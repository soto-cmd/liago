-- LiaGo Fase 2C: operaciones transaccionales
begin;

create or replace function private.next_document_number(p_organization_id uuid, p_document_type text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_number bigint;
begin
  if not private.is_org_member(p_organization_id) then
    raise exception 'Not allowed';
  end if;

  insert into public.document_counters(organization_id, document_type, next_number)
  values (p_organization_id, p_document_type, 2)
  on conflict (organization_id, document_type)
  do update set next_number = public.document_counters.next_number + 1, updated_at = now()
  returning next_number - 1 into v_number;

  return v_number;
end;
$$;
revoke all on function private.next_document_number(uuid,text) from public;
grant execute on function private.next_document_number(uuid,text) to authenticated;

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
security invoker
set search_path = ''
as $$
declare
  v_sale_id uuid;
  v_sale_number bigint;
  v_payment_number bigint;
  v_payment_id uuid;
  v_debt_id uuid;
  v_total numeric(18,2) := 0;
  v_paid numeric(18,2) := greatest(coalesce(p_amount_paid,0),0);
  v_balance numeric(18,2);
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(18,3);
  v_price numeric(18,2);
  v_discount numeric(18,2);
  v_tax_rate numeric(7,4);
  v_subtotal numeric(18,2);
  v_tax numeric(18,2);
  v_line_total numeric(18,2);
begin
  if not private.has_org_role(p_organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']) then
    raise exception 'Not allowed';
  end if;
  if p_sale_type not in ('CASH','PARTIAL','CREDIT') then raise exception 'Invalid sale type'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'Sale requires items'; end if;
  if not exists(select 1 from public.branches b where b.id=p_branch_id and b.organization_id=p_organization_id and b.status='ACTIVE' and b.deleted_at is null) then raise exception 'Invalid branch'; end if;
  if p_customer_id is not null and not exists(select 1 from public.customers c where c.id=p_customer_id and c.organization_id=p_organization_id and c.status='ACTIVE' and c.deleted_at is null) then raise exception 'Invalid customer'; end if;

  v_sale_number := private.next_document_number(p_organization_id,'SALE');
  insert into public.sales(organization_id,branch_id,customer_id,sale_number,sale_type,status,payment_status,sold_at,due_date,created_by,notes)
  values(p_organization_id,p_branch_id,p_customer_id,v_sale_number,p_sale_type,'DRAFT','PENDING',now(),p_due_date,(select auth.uid()),p_notes)
  returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products p
    where p.id=(v_item->>'product_id')::uuid and p.organization_id=p_organization_id and p.status='ACTIVE' and p.deleted_at is null;
    if not found then raise exception 'Invalid product'; end if;

    v_qty := greatest(coalesce((v_item->>'quantity')::numeric,0),0);
    if v_qty <= 0 then raise exception 'Invalid quantity'; end if;
    v_price := coalesce(nullif(v_item->>'unit_price','')::numeric, v_product.sale_price);
    v_discount := greatest(coalesce(nullif(v_item->>'discount','')::numeric,0),0);
    v_tax_rate := coalesce(nullif(v_item->>'tax_rate','')::numeric, v_product.tax_rate);
    v_subtotal := round(v_qty * v_price,2);
    if v_discount > v_subtotal then v_discount := v_subtotal; end if;
    v_tax := round((v_subtotal-v_discount) * v_tax_rate / 100,2);
    v_line_total := v_subtotal - v_discount + v_tax;
    v_total := v_total + v_line_total;

    insert into public.sale_items(organization_id,sale_id,product_id,item_code,description,quantity,unit_price,discount,tax_rate,line_subtotal,line_tax,line_total)
    values(p_organization_id,v_sale_id,v_product.id,v_product.code,v_product.name,v_qty,v_price,v_discount,v_tax_rate,v_subtotal,v_tax,v_line_total);

    if v_product.track_stock and v_product.item_type='PRODUCT' then
      insert into public.inventory_movements(organization_id,branch_id,product_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by)
      values(p_organization_id,p_branch_id,v_product.id,'SALE',-v_qty,v_product.purchase_price,'SALE',v_sale_id,'Venta '||v_sale_number,(select auth.uid()));
    end if;
  end loop;

  if v_paid > v_total then v_paid := v_total; end if;
  v_balance := v_total - v_paid;
  if v_balance > 0 and p_customer_id is null then raise exception 'Customer required for credit balance'; end if;

  update public.sales set subtotal=v_total,tax_total=0,total=v_total,amount_paid=v_paid,balance_due=v_balance,status='CONFIRMED',payment_status=case when v_balance=0 then 'PAID' when v_paid>0 then 'PARTIAL' else 'PENDING' end where id=v_sale_id;

  if p_customer_id is not null then
    insert into public.customer_account_entries(organization_id,customer_id,entry_type,description,debit,reference_type,reference_id,created_by)
    values(p_organization_id,p_customer_id,'SALE','Venta '||v_sale_number,v_total,'SALE',v_sale_id,(select auth.uid()));
  end if;

  if v_balance > 0 then
    insert into public.debts(organization_id,customer_id,sale_id,concept,original_amount,balance,issued_at,due_date,reference,status)
    values(p_organization_id,p_customer_id,v_sale_id,'Venta '||v_sale_number,v_balance,v_balance,current_date,p_due_date,v_sale_number::text,case when v_paid>0 then 'PARTIAL' else 'PENDING' end)
    returning id into v_debt_id;
  end if;

  if v_paid > 0 then
    v_payment_number := private.next_document_number(p_organization_id,'PAYMENT');
    insert into public.payments(organization_id,branch_id,customer_id,payment_number,amount,payment_method,reference,notes,created_by)
    values(p_organization_id,p_branch_id,p_customer_id,v_payment_number,v_paid,coalesce(p_payment_method,'CASH'),v_sale_number::text,'Cobro de venta',(select auth.uid()))
    returning id into v_payment_id;

    if v_debt_id is not null then
      insert into public.payment_allocations(organization_id,payment_id,debt_id,amount)
      values(p_organization_id,v_payment_id,v_debt_id,least(v_paid,v_balance));
    end if;

    if p_customer_id is not null then
      insert into public.customer_account_entries(organization_id,customer_id,entry_type,description,credit,reference_type,reference_id,created_by)
      values(p_organization_id,p_customer_id,'PAYMENT','Cobro '||v_payment_number,v_paid,'PAYMENT',v_payment_id,(select auth.uid()));
    end if;

    insert into public.cash_movements(organization_id,branch_id,movement_type,direction,amount,description,payment_method,reference_type,reference_id,created_by)
    values(p_organization_id,p_branch_id,'SALE','IN',v_paid,'Venta '||v_sale_number,coalesce(p_payment_method,'CASH'),'SALE',v_sale_id,(select auth.uid()));
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
security invoker
set search_path = ''
as $$
declare
  v_debt public.debts%rowtype;
  v_payment_id uuid;
  v_payment_number bigint;
  v_apply numeric(18,2);
begin
  if not private.has_org_role(p_organization_id,array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']) then raise exception 'Not allowed'; end if;
  if p_amount <= 0 then raise exception 'Invalid amount'; end if;
  select * into v_debt from public.debts where id=p_debt_id and organization_id=p_organization_id and customer_id=p_customer_id and status in ('PENDING','PARTIAL','OVERDUE') for update;
  if not found then raise exception 'Debt not found'; end if;
  v_apply := least(p_amount,v_debt.balance);
  v_payment_number := private.next_document_number(p_organization_id,'PAYMENT');

  insert into public.payments(organization_id,branch_id,customer_id,payment_number,amount,payment_method,reference,notes,created_by)
  values(p_organization_id,p_branch_id,p_customer_id,v_payment_number,v_apply,p_payment_method,p_reference,p_notes,(select auth.uid())) returning id into v_payment_id;
  insert into public.payment_allocations(organization_id,payment_id,debt_id,amount) values(p_organization_id,v_payment_id,p_debt_id,v_apply);
  update public.debts set balance=balance-v_apply,status=case when balance-v_apply<=0 then 'PAID' else 'PARTIAL' end where id=p_debt_id;
  insert into public.customer_account_entries(organization_id,customer_id,entry_type,description,credit,reference_type,reference_id,created_by)
  values(p_organization_id,p_customer_id,'PAYMENT','Cobro '||v_payment_number,v_apply,'PAYMENT',v_payment_id,(select auth.uid()));
  insert into public.cash_movements(organization_id,branch_id,movement_type,direction,amount,description,payment_method,reference_type,reference_id,created_by)
  values(p_organization_id,p_branch_id,'PAYMENT','IN',v_apply,'Cobro '||v_payment_number,p_payment_method,'PAYMENT',v_payment_id,(select auth.uid()));
  return v_payment_id;
end;
$$;
revoke all on function public.record_customer_payment(uuid,uuid,uuid,uuid,numeric,text,text,text) from public;
grant execute on function public.record_customer_payment(uuid,uuid,uuid,uuid,numeric,text,text,text) to authenticated;

commit;
