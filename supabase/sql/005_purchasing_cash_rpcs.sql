-- LiaGo Fase 2D: compras, caja y gastos transaccionales
begin;

create or replace function public.receive_purchase(
  p_organization_id uuid,
  p_branch_id uuid,
  p_supplier_id uuid,
  p_purchase_type text default 'CASH',
  p_amount_paid numeric default 0,
  p_due_date date default null,
  p_reference text default null,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_purchase_id uuid;
  v_purchase_number bigint;
  v_total numeric(18,2) := 0;
  v_paid numeric(18,2) := greatest(coalesce(p_amount_paid,0),0);
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(18,3);
  v_cost numeric(18,2);
  v_discount numeric(18,2);
  v_tax_rate numeric(7,4);
  v_line_total numeric(18,2);
begin
  if not private.has_org_role(p_organization_id,array['OWNER','ADMIN','MANAGER']) then raise exception 'Not allowed'; end if;
  if p_purchase_type not in ('CASH','PARTIAL','CREDIT') then raise exception 'Invalid purchase type'; end if;
  if jsonb_array_length(p_items)=0 then raise exception 'Purchase requires items'; end if;
  if not exists(select 1 from public.branches b where b.id=p_branch_id and b.organization_id=p_organization_id and b.status='ACTIVE' and b.deleted_at is null) then raise exception 'Invalid branch'; end if;
  if not exists(select 1 from public.suppliers s where s.id=p_supplier_id and s.organization_id=p_organization_id and s.status='ACTIVE' and s.deleted_at is null) then raise exception 'Invalid supplier'; end if;

  v_purchase_number := private.next_document_number(p_organization_id,'PURCHASE');
  insert into public.purchases(organization_id,branch_id,supplier_id,purchase_number,purchase_type,status,purchased_at,due_date,reference,notes,created_by)
  values(p_organization_id,p_branch_id,p_supplier_id,v_purchase_number,p_purchase_type,'DRAFT',now(),p_due_date,p_reference,p_notes,(select auth.uid())) returning id into v_purchase_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products p where p.id=(v_item->>'product_id')::uuid and p.organization_id=p_organization_id and p.status='ACTIVE' and p.deleted_at is null;
    if not found then raise exception 'Invalid product'; end if;
    v_qty := greatest(coalesce((v_item->>'quantity')::numeric,0),0);
    v_cost := greatest(coalesce((v_item->>'unit_cost')::numeric,v_product.purchase_price),0);
    v_discount := greatest(coalesce(nullif(v_item->>'discount','')::numeric,0),0);
    v_tax_rate := coalesce(nullif(v_item->>'tax_rate','')::numeric,v_product.tax_rate);
    if v_qty<=0 then raise exception 'Invalid quantity'; end if;
    v_line_total := greatest(round(v_qty*v_cost-v_discount,2),0);
    v_total := v_total + v_line_total;

    insert into public.purchase_items(organization_id,purchase_id,product_id,quantity,unit_cost,discount,tax_rate,line_total)
    values(p_organization_id,v_purchase_id,v_product.id,v_qty,v_cost,v_discount,v_tax_rate,v_line_total);

    if v_product.track_stock and v_product.item_type='PRODUCT' then
      insert into public.inventory_movements(organization_id,branch_id,product_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by)
      values(p_organization_id,p_branch_id,v_product.id,'PURCHASE',v_qty,v_cost,'PURCHASE',v_purchase_id,'Compra '||v_purchase_number,(select auth.uid()));
    end if;

    update public.products set purchase_price=v_cost where id=v_product.id;
  end loop;

  if v_paid>v_total then v_paid:=v_total; end if;
  update public.purchases set subtotal=v_total,total=v_total,amount_paid=v_paid,balance_due=v_total-v_paid,status='RECEIVED' where id=v_purchase_id;

  if v_paid>0 then
    insert into public.cash_movements(organization_id,branch_id,movement_type,direction,amount,description,payment_method,reference_type,reference_id,created_by)
    values(p_organization_id,p_branch_id,'PURCHASE','OUT',v_paid,'Compra '||v_purchase_number,'CASH','PURCHASE',v_purchase_id,(select auth.uid()));
  end if;

  return v_purchase_id;
end;
$$;
revoke all on function public.receive_purchase(uuid,uuid,uuid,text,numeric,date,text,text,jsonb) from public;
grant execute on function public.receive_purchase(uuid,uuid,uuid,text,numeric,date,text,text,jsonb) to authenticated;

create or replace function public.open_cash_session(
  p_organization_id uuid,
  p_branch_id uuid,
  p_opening_amount numeric default 0,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare v_id uuid;
begin
  if not private.has_org_role(p_organization_id,array['OWNER','ADMIN','MANAGER','CASHIER']) then raise exception 'Not allowed'; end if;
  if exists(select 1 from public.cash_sessions c where c.organization_id=p_organization_id and c.branch_id=p_branch_id and c.status='OPEN') then raise exception 'Cash already open'; end if;
  insert into public.cash_sessions(organization_id,branch_id,opened_by,opening_amount,notes)
  values(p_organization_id,p_branch_id,(select auth.uid()),greatest(coalesce(p_opening_amount,0),0),p_notes) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.open_cash_session(uuid,uuid,numeric,text) from public;
grant execute on function public.open_cash_session(uuid,uuid,numeric,text) to authenticated;

create or replace function public.close_cash_session(
  p_organization_id uuid,
  p_cash_session_id uuid,
  p_closing_amount numeric,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.cash_sessions%rowtype;
  v_net numeric(18,2);
  v_expected numeric(18,2);
begin
  if not private.has_org_role(p_organization_id,array['OWNER','ADMIN','MANAGER','CASHIER']) then raise exception 'Not allowed'; end if;
  select * into v_session from public.cash_sessions where id=p_cash_session_id and organization_id=p_organization_id and status='OPEN' for update;
  if not found then raise exception 'Open cash session not found'; end if;
  select coalesce(sum(case when direction='IN' then amount else -amount end),0) into v_net from public.cash_movements where organization_id=p_organization_id and branch_id=v_session.branch_id and created_at>=v_session.opened_at and created_at<=now();
  v_expected := v_session.opening_amount + v_net;
  update public.cash_sessions set status='CLOSED',closed_by=(select auth.uid()),closed_at=now(),expected_amount=v_expected,closing_amount=p_closing_amount,difference=p_closing_amount-v_expected,notes=coalesce(p_notes,notes) where id=p_cash_session_id;
  return p_cash_session_id;
end;
$$;
revoke all on function public.close_cash_session(uuid,uuid,numeric,text) from public;
grant execute on function public.close_cash_session(uuid,uuid,numeric,text) to authenticated;

create or replace function public.record_expense(
  p_organization_id uuid,
  p_branch_id uuid,
  p_category text,
  p_description text,
  p_amount numeric,
  p_payment_method text default 'CASH',
  p_supplier_id uuid default null,
  p_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare v_id uuid;
begin
  if not private.has_org_role(p_organization_id,array['OWNER','ADMIN','MANAGER','CASHIER']) then raise exception 'Not allowed'; end if;
  if p_amount<=0 then raise exception 'Invalid amount'; end if;
  insert into public.expenses(organization_id,branch_id,category,description,amount,payment_method,supplier_id,reference,notes,created_by)
  values(p_organization_id,p_branch_id,p_category,p_description,p_amount,p_payment_method,p_supplier_id,p_reference,p_notes,(select auth.uid())) returning id into v_id;
  insert into public.cash_movements(organization_id,branch_id,movement_type,direction,amount,description,payment_method,reference_type,reference_id,created_by)
  values(p_organization_id,p_branch_id,'EXPENSE','OUT',p_amount,p_description,p_payment_method,'EXPENSE',v_id,(select auth.uid()));
  return v_id;
end;
$$;
revoke all on function public.record_expense(uuid,uuid,text,text,numeric,text,uuid,text,text) from public;
grant execute on function public.record_expense(uuid,uuid,text,text,numeric,text,uuid,text,text) to authenticated;

commit;
