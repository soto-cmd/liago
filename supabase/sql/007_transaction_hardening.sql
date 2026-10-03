-- LiaGo Fase 2F: hardening transaccional y permisos operativos
begin;

-- Vincula claramente el cobro inicial con su venta.
alter table public.payments
  add column if not exists sale_id uuid references public.sales(id) on delete restrict;
create index if not exists payments_sale_idx on public.payments(sale_id) where sale_id is not null;

-- Solo los RPC transaccionales escriben las tablas operativas.
drop policy if exists sales_write on public.sales;
drop policy if exists sale_items_write on public.sale_items;
drop policy if exists debts_write on public.debts;
drop policy if exists payments_write on public.payments;
drop policy if exists payment_allocations_write on public.payment_allocations;
drop policy if exists account_entries_write on public.customer_account_entries;
drop policy if exists purchases_write on public.purchases;
drop policy if exists purchase_items_write on public.purchase_items;
drop policy if exists cash_sessions_write on public.cash_sessions;
drop policy if exists cash_movements_write on public.cash_movements;
drop policy if exists expenses_write on public.expenses;
drop policy if exists document_counters_write on public.document_counters;

revoke insert, update, delete on public.sales from authenticated;
revoke insert, update, delete on public.sale_items from authenticated;
revoke insert, update, delete on public.debts from authenticated;
revoke insert, update, delete on public.payments from authenticated;
revoke insert, update, delete on public.payment_allocations from authenticated;
revoke insert, update, delete on public.customer_account_entries from authenticated;
revoke insert, update, delete on public.purchases from authenticated;
revoke insert, update, delete on public.purchase_items from authenticated;
revoke insert, update, delete on public.cash_sessions from authenticated;
revoke insert, update, delete on public.cash_movements from authenticated;
revoke insert, update, delete on public.expenses from authenticated;
revoke insert, update, delete on public.document_counters from authenticated;
revoke insert, update, delete on public.inventory_movements from authenticated;

-- Ajuste de inventario controlado.
create or replace function public.adjust_inventory(
  p_organization_id uuid,
  p_branch_id uuid,
  p_product_id uuid,
  p_direction text,
  p_quantity numeric,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_product public.products%rowtype;
  v_qty numeric(18,3);
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not private.has_org_role(p_organization_id,array['OWNER','ADMIN','MANAGER']) then raise exception 'Not allowed'; end if;
  if p_direction not in ('IN','OUT') then raise exception 'Invalid direction'; end if;
  v_qty := abs(coalesce(p_quantity,0));
  if v_qty <= 0 then raise exception 'Invalid quantity'; end if;
  if not exists(select 1 from public.branches b where b.id=p_branch_id and b.organization_id=p_organization_id and b.status='ACTIVE' and b.deleted_at is null) then raise exception 'Invalid branch'; end if;
  select * into v_product from public.products p where p.id=p_product_id and p.organization_id=p_organization_id and p.item_type='PRODUCT' and p.track_stock=true and p.status='ACTIVE' and p.deleted_at is null;
  if not found then raise exception 'Invalid product'; end if;

  insert into public.inventory_movements(
    organization_id,branch_id,product_id,movement_type,quantity,unit_cost,reference_type,notes,created_by
  ) values (
    p_organization_id,p_branch_id,p_product_id,
    case when p_direction='OUT' then 'ADJUSTMENT_OUT' else 'ADJUSTMENT_IN' end,
    case when p_direction='OUT' then -v_qty else v_qty end,
    v_product.purchase_price,'MANUAL_ADJUSTMENT',coalesce(nullif(trim(p_notes),''),'Ajuste manual'),v_user
  ) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.adjust_inventory(uuid,uuid,uuid,text,numeric,text) from public;
grant execute on function public.adjust_inventory(uuid,uuid,uuid,text,numeric,text) to authenticated;

-- Venta completamente transaccional. Calcula totales, stock, deuda, cobro y caja.
create or replace function public.create_sale(
  p_organization_id uuid,
  p_branch_id uuid,
  p_customer_id uuid default null,
  p_sale_type text default 'CASH',
  p_amount_paid numeric default 0,
  p_payment_method text default null,
  p_due_date date default null,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_sale_id uuid;
  v_sale_number bigint;
  v_payment_number bigint;
  v_payment_id uuid;
  v_total numeric(18,2) := 0;
  v_subtotal_total numeric(18,2) := 0;
  v_discount_total numeric(18,2) := 0;
  v_tax_total numeric(18,2) := 0;
  v_paid numeric(18,2) := greatest(coalesce(p_amount_paid,0),0);
  v_balance numeric(18,2);
  v_item jsonb;
  v_product public.products%rowtype;
  v_customer public.customers%rowtype;
  v_qty numeric(18,3);
  v_price numeric(18,2);
  v_discount numeric(18,2);
  v_tax_rate numeric(7,4);
  v_subtotal numeric(18,2);
  v_tax numeric(18,2);
  v_line_total numeric(18,2);
  v_current_credit numeric(18,2);
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not private.has_org_role(p_organization_id,array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']) then raise exception 'Not allowed'; end if;
  if p_sale_type not in ('CASH','PARTIAL','CREDIT') then raise exception 'Invalid sale type'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'Sale requires items'; end if;
  if not exists(select 1 from public.branches b where b.id=p_branch_id and b.organization_id=p_organization_id and b.status='ACTIVE' and b.deleted_at is null) then raise exception 'Invalid branch'; end if;

  if p_customer_id is not null then
    select * into v_customer from public.customers c where c.id=p_customer_id and c.organization_id=p_organization_id and c.status='ACTIVE' and c.deleted_at is null;
    if not found then raise exception 'Invalid customer'; end if;
  end if;

  v_sale_number := private.next_document_number(p_organization_id,'SALE');
  insert into public.sales(organization_id,branch_id,customer_id,sale_number,sale_type,status,payment_status,sold_at,due_date,created_by,notes)
  values(p_organization_id,p_branch_id,p_customer_id,v_sale_number,p_sale_type,'DRAFT','PENDING',now(),p_due_date,v_user,p_notes)
  returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products p
    where p.id=(v_item->>'product_id')::uuid and p.organization_id=p_organization_id and p.status='ACTIVE' and p.deleted_at is null;
    if not found then raise exception 'Invalid product'; end if;

    v_qty := greatest(coalesce(nullif(v_item->>'quantity','')::numeric,0),0);
    if v_qty<=0 then raise exception 'Invalid quantity'; end if;
    v_price := greatest(coalesce(nullif(v_item->>'unit_price','')::numeric,v_product.sale_price),0);
    v_discount := greatest(coalesce(nullif(v_item->>'discount','')::numeric,0),0);
    v_tax_rate := greatest(coalesce(nullif(v_item->>'tax_rate','')::numeric,v_product.tax_rate),0);
    if v_tax_rate>100 then raise exception 'Invalid tax rate'; end if;

    v_subtotal := round(v_qty*v_price,2);
    if v_discount>v_subtotal then v_discount:=v_subtotal; end if;
    v_tax := round((v_subtotal-v_discount)*v_tax_rate/100,2);
    v_line_total := v_subtotal-v_discount+v_tax;

    v_subtotal_total := v_subtotal_total+v_subtotal;
    v_discount_total := v_discount_total+v_discount;
    v_tax_total := v_tax_total+v_tax;
    v_total := v_total+v_line_total;

    insert into public.sale_items(organization_id,sale_id,product_id,item_code,description,quantity,unit_price,discount,tax_rate,line_subtotal,line_tax,line_total)
    values(p_organization_id,v_sale_id,v_product.id,v_product.code,v_product.name,v_qty,v_price,v_discount,v_tax_rate,v_subtotal,v_tax,v_line_total);

    if v_product.track_stock and v_product.item_type='PRODUCT' then
      insert into public.inventory_movements(organization_id,branch_id,product_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by)
      values(p_organization_id,p_branch_id,v_product.id,'SALE',-v_qty,v_product.purchase_price,'SALE',v_sale_id,'Venta '||v_sale_number,v_user);
    end if;
  end loop;

  v_paid := least(v_paid,v_total);
  v_balance := v_total-v_paid;
  if v_balance>0 and p_customer_id is null then raise exception 'Customer required for credit balance'; end if;
  if p_sale_type='CASH' and v_balance<>0 then raise exception 'Cash sale must be fully paid'; end if;
  if p_sale_type='CREDIT' and v_paid<>0 then raise exception 'Credit sale cannot have initial payment'; end if;
  if p_sale_type='PARTIAL' and not (v_paid>0 and v_balance>0) then raise exception 'Partial sale requires payment and balance'; end if;

  if p_customer_id is not null and v_balance>0 and v_customer.credit_limit>0 then
    select coalesce(sum(d.balance),0) into v_current_credit
    from public.debts d
    where d.organization_id=p_organization_id and d.customer_id=p_customer_id and d.status in ('PENDING','PARTIAL','OVERDUE');
    if v_current_credit+v_balance>v_customer.credit_limit then raise exception 'Customer credit limit exceeded'; end if;
  end if;

  update public.sales
     set subtotal=v_subtotal_total,
         discount_total=v_discount_total,
         tax_total=v_tax_total,
         total=v_total,
         amount_paid=v_paid,
         balance_due=v_balance,
         status='CONFIRMED',
         payment_status=case when v_balance=0 then 'PAID' when v_paid>0 then 'PARTIAL' else 'PENDING' end
   where id=v_sale_id;

  if p_customer_id is not null then
    insert into public.customer_account_entries(organization_id,customer_id,entry_type,description,debit,reference_type,reference_id,created_by)
    values(p_organization_id,p_customer_id,'SALE','Venta '||v_sale_number,v_total,'SALE',v_sale_id,v_user);
  end if;

  if v_balance>0 then
    insert into public.debts(organization_id,customer_id,sale_id,concept,original_amount,balance,issued_at,due_date,reference,status)
    values(p_organization_id,p_customer_id,v_sale_id,'Venta '||v_sale_number,v_balance,v_balance,current_date,p_due_date,v_sale_number::text,case when v_paid>0 then 'PARTIAL' else 'PENDING' end);
  end if;

  if v_paid>0 then
    v_payment_number := private.next_document_number(p_organization_id,'PAYMENT');
    insert into public.payments(organization_id,branch_id,customer_id,sale_id,payment_number,amount,payment_method,reference,notes,created_by)
    values(p_organization_id,p_branch_id,p_customer_id,v_sale_id,v_payment_number,v_paid,coalesce(nullif(p_payment_method,''),'CASH'),v_sale_number::text,'Cobro inicial de venta',v_user)
    returning id into v_payment_id;

    if p_customer_id is not null then
      insert into public.customer_account_entries(organization_id,customer_id,entry_type,description,credit,reference_type,reference_id,created_by)
      values(p_organization_id,p_customer_id,'PAYMENT','Cobro '||v_payment_number,v_paid,'PAYMENT',v_payment_id,v_user);
    end if;

    insert into public.cash_movements(organization_id,branch_id,movement_type,direction,amount,description,payment_method,reference_type,reference_id,created_by)
    values(p_organization_id,p_branch_id,'SALE','IN',v_paid,'Venta '||v_sale_number,coalesce(nullif(p_payment_method,''),'CASH'),'SALE',v_sale_id,v_user);
  end if;

  return v_sale_id;
end;
$$;
revoke all on function public.create_sale(uuid,uuid,uuid,text,numeric,text,date,text,jsonb) from public;
grant execute on function public.create_sale(uuid,uuid,uuid,text,numeric,text,date,text,jsonb) to authenticated;

create or replace function public.record_customer_payment(
  p_organization_id uuid,
  p_branch_id uuid,
  p_customer_id uuid,
  p_debt_id uuid,
  p_amount numeric,
  p_payment_method text default 'CASH',
  p_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_debt public.debts%rowtype;
  v_payment_id uuid;
  v_payment_number bigint;
  v_apply numeric(18,2);
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not private.has_org_role(p_organization_id,array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']) then raise exception 'Not allowed'; end if;
  if p_amount<=0 then raise exception 'Invalid amount'; end if;
  if not exists(select 1 from public.branches b where b.id=p_branch_id and b.organization_id=p_organization_id and b.status='ACTIVE' and b.deleted_at is null) then raise exception 'Invalid branch'; end if;
  if not exists(select 1 from public.customers c where c.id=p_customer_id and c.organization_id=p_organization_id and c.deleted_at is null) then raise exception 'Invalid customer'; end if;

  select * into v_debt from public.debts where id=p_debt_id and organization_id=p_organization_id and customer_id=p_customer_id and status in ('PENDING','PARTIAL','OVERDUE') for update;
  if not found then raise exception 'Debt not found'; end if;
  v_apply:=least(p_amount,v_debt.balance);
  v_payment_number:=private.next_document_number(p_organization_id,'PAYMENT');

  insert into public.payments(organization_id,branch_id,customer_id,payment_number,amount,payment_method,reference,notes,created_by)
  values(p_organization_id,p_branch_id,p_customer_id,v_payment_number,v_apply,coalesce(nullif(p_payment_method,''),'CASH'),p_reference,p_notes,v_user)
  returning id into v_payment_id;

  insert into public.payment_allocations(organization_id,payment_id,debt_id,amount)
  values(p_organization_id,v_payment_id,p_debt_id,v_apply);

  update public.debts
     set balance=balance-v_apply,
         status=case when balance-v_apply<=0 then 'PAID' else 'PARTIAL' end,
         updated_at=now()
   where id=p_debt_id;

  insert into public.customer_account_entries(organization_id,customer_id,entry_type,description,credit,reference_type,reference_id,created_by)
  values(p_organization_id,p_customer_id,'PAYMENT','Cobro '||v_payment_number,v_apply,'PAYMENT',v_payment_id,v_user);

  insert into public.cash_movements(organization_id,branch_id,movement_type,direction,amount,description,payment_method,reference_type,reference_id,created_by)
  values(p_organization_id,p_branch_id,'PAYMENT','IN',v_apply,'Cobro '||v_payment_number,coalesce(nullif(p_payment_method,''),'CASH'),'PAYMENT',v_payment_id,v_user);

  return v_payment_id;
end;
$$;
revoke all on function public.record_customer_payment(uuid,uuid,uuid,uuid,numeric,text,text,text) from public;
grant execute on function public.record_customer_payment(uuid,uuid,uuid,uuid,numeric,text,text,text) to authenticated;

-- Compras, caja y gastos: SECURITY DEFINER con controles explícitos.
alter function public.receive_purchase(uuid,uuid,uuid,text,numeric,date,text,text,jsonb) security definer;
alter function public.open_cash_session(uuid,uuid,numeric,text) security definer;
alter function public.close_cash_session(uuid,uuid,numeric,text) security definer;
alter function public.record_expense(uuid,uuid,text,text,numeric,text,uuid,text,text) security definer;

-- Anulación robusta de cobros.
create or replace function public.cancel_payment(p_payment_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_alloc record;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_payment from public.payments where id=p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if not private.has_org_role(v_payment.organization_id,array['OWNER','ADMIN','MANAGER']) then raise exception 'Not allowed'; end if;
  if v_payment.status='CANCELED' then return; end if;

  for v_alloc in select * from public.payment_allocations where payment_id=v_payment.id loop
    update public.debts
       set balance=least(original_amount,balance+v_alloc.amount),
           status=case when balance+v_alloc.amount>=original_amount then 'PENDING' else 'PARTIAL' end,
           updated_at=now()
     where id=v_alloc.debt_id;
  end loop;

  if v_payment.customer_id is not null then
    insert into public.customer_account_entries(organization_id,customer_id,entry_type,description,debit,credit,reference_type,reference_id,created_by)
    values(v_payment.organization_id,v_payment.customer_id,'DEBIT','Anulación cobro #'||v_payment.payment_number,v_payment.amount,0,'PAYMENT_CANCEL',v_payment.id,v_user);
  end if;

  if v_payment.branch_id is not null then
    insert into public.cash_movements(organization_id,branch_id,movement_type,direction,amount,description,payment_method,reference_type,reference_id,created_by)
    values(v_payment.organization_id,v_payment.branch_id,'ADJUSTMENT','OUT',v_payment.amount,'Anulación cobro #'||v_payment.payment_number,v_payment.payment_method,'PAYMENT_CANCEL',v_payment.id,v_user);
  end if;

  update public.payments set status='CANCELED',notes=concat_ws(E'\n',notes,coalesce(p_reason,'')) where id=v_payment.id;

  if v_payment.sale_id is not null then
    update public.sales s
       set amount_paid=greatest(0,s.amount_paid-v_payment.amount),
           balance_due=least(s.total,s.balance_due+v_payment.amount),
           payment_status=case
             when greatest(0,s.amount_paid-v_payment.amount)=0 then 'PENDING'
             else 'PARTIAL'
           end
     where s.id=v_payment.sale_id and s.status='CONFIRMED';
  end if;
end;
$$;
revoke all on function public.cancel_payment(uuid,text) from public;
grant execute on function public.cancel_payment(uuid,text) to authenticated;

-- Anulación de venta: primero cancela su cobro inicial si existe; bloquea cobros externos.
create or replace function public.cancel_sale(p_sale_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_sale public.sales%rowtype;
  v_item record;
  v_payment record;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_sale from public.sales where id=p_sale_id for update;
  if not found then raise exception 'Sale not found'; end if;
  if not private.has_org_role(v_sale.organization_id,array['OWNER','ADMIN','MANAGER']) then raise exception 'Not allowed'; end if;
  if v_sale.status='CANCELED' then return; end if;
  if v_sale.status<>'CONFIRMED' then raise exception 'Only confirmed sales can be canceled'; end if;

  if exists(
    select 1
    from public.debts d
    join public.payment_allocations pa on pa.debt_id=d.id
    join public.payments p on p.id=pa.payment_id
    where d.sale_id=v_sale.id and p.status='CONFIRMED'
  ) then raise exception 'Sale has later payments; cancel those payments first'; end if;

  for v_payment in select id from public.payments where sale_id=v_sale.id and status='CONFIRMED' loop
    perform public.cancel_payment(v_payment.id,'Anulación de venta');
  end loop;

  for v_item in
    select si.product_id,si.quantity,pr.track_stock
    from public.sale_items si
    left join public.products pr on pr.id=si.product_id
    where si.sale_id=v_sale.id
  loop
    if v_item.product_id is not null and coalesce(v_item.track_stock,false) then
      insert into public.inventory_movements(organization_id,branch_id,product_id,movement_type,quantity,reference_type,reference_id,notes,created_by)
      values(v_sale.organization_id,v_sale.branch_id,v_item.product_id,'RETURN_IN',v_item.quantity,'SALE_CANCEL',v_sale.id,coalesce(p_reason,'Anulación de venta'),v_user);
    end if;
  end loop;

  update public.debts
     set status='CANCELED',balance=0,updated_at=now(),notes=concat_ws(E'\n',notes,'Anulada con venta: '||coalesce(p_reason,''))
   where sale_id=v_sale.id and status<>'CANCELED';

  if v_sale.customer_id is not null then
    insert into public.customer_account_entries(organization_id,customer_id,entry_type,description,debit,credit,reference_type,reference_id,created_by)
    values(v_sale.organization_id,v_sale.customer_id,'CREDIT','Anulación venta #'||v_sale.sale_number,0,v_sale.total,'SALE_CANCEL',v_sale.id,v_user);
  end if;

  update public.sales
     set status='CANCELED',payment_status='CANCELED',amount_paid=0,balance_due=0,canceled_at=now(),canceled_by=v_user,notes=concat_ws(E'\n',notes,coalesce(p_reason,''))
   where id=v_sale.id;
end;
$$;
revoke all on function public.cancel_sale(uuid,text) from public;
grant execute on function public.cancel_sale(uuid,text) to authenticated;

commit;
