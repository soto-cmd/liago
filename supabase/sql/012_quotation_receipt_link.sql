-- Liago: aceptación y conversión segura de cotizaciones a ventas/recibos existentes.
-- No modifica funciones previas, Apps Script ni la estructura de comprobantes.
alter table public.quotations
  add column if not exists sale_id uuid references public.sales(id) on delete restrict,
  add column if not exists accepted_at timestamptz;
create unique index if not exists quotation_unique_sale_idx on public.quotations(sale_id) where sale_id is not null;

create or replace function public.accept_quotation(p_organization_id uuid, p_quotation_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_quote public.quotations%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members
    where organization_id=p_organization_id and user_id=auth.uid()
      and status='ACTIVE' and deleted_at is null
      and role in ('OWNER','ADMIN','MANAGER','SELLER','CASHIER')
  ) then raise exception 'Not allowed'; end if;

  select * into v_quote from public.quotations
  where id=p_quotation_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Quotation not found'; end if;
  if v_quote.status in ('REJECTED','CANCELED') then raise exception 'Quotation closed'; end if;
  if v_quote.sale_id is not null then raise exception 'Quotation already converted'; end if;
  if v_quote.status not in ('DRAFT','SENT','ACCEPTED') then raise exception 'Invalid status'; end if;
  update public.quotations
  set status='ACCEPTED', accepted_at=coalesce(accepted_at,now())
  where id=p_quotation_id and status<>'ACCEPTED';
  return p_quotation_id;
end $$;

create or replace function public.convert_quotation_to_sale(
  p_organization_id uuid,p_quotation_id uuid,p_branch_id uuid,
  p_amount_paid numeric, p_payment_method text default 'CASH',
  p_due_date date default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_quote public.quotations%rowtype;
  v_lines jsonb;
  v_sale uuid;
  v_type text;
  v_line record;
  v_sale_item uuid;
  v_used uuid[]:=array[]::uuid[];
  v_expected numeric(18,2);
  v_created numeric(18,2);
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members
    where organization_id=p_organization_id and user_id=auth.uid()
      and status='ACTIVE' and deleted_at is null
      and role in ('OWNER','ADMIN','MANAGER','SELLER','CASHIER')
  ) then raise exception 'Not allowed'; end if;
  select * into v_quote from public.quotations
   where id=p_quotation_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Quotation not found'; end if;
  if v_quote.status<>'ACCEPTED' then raise exception 'Quotation must be accepted'; end if;
  if v_quote.sale_id is not null then raise exception 'Quotation already has a sale'; end if;
  if p_amount_paid is null or p_amount_paid<0 or p_amount_paid>v_quote.total
    then raise exception 'Invalid amount paid'; end if;
  if v_quote.total<=0 then raise exception 'Quotation must have a positive total'; end if;
  if p_payment_method not in ('CASH','TRANSFER','CARD','OTHER')
    then raise exception 'Invalid payment method'; end if;
  if not exists(select 1 from public.branches where id=p_branch_id
    and organization_id=p_organization_id and status='ACTIVE' and deleted_at is null)
    then raise exception 'Invalid branch'; end if;
  if exists (select 1 from public.quotation_items qi
      where qi.quotation_id=v_quote.id and qi.organization_id=p_organization_id
        and (qi.product_id is null or not exists(select 1 from public.products p
          where p.id=qi.product_id and p.organization_id=p_organization_id
            and p.status='ACTIVE' and p.deleted_at is null)))
    then raise exception 'Quote contains an unavailable product/service'; end if;
  select jsonb_agg(jsonb_build_object('product_id',qi.product_id,'quantity',qi.quantity,
    'unit_price',qi.unit_price,'discount',0,'tax_rate',0) order by qi.id)
  into v_lines
  from public.quotation_items qi
  where qi.quotation_id=v_quote.id and qi.organization_id=p_organization_id;
  if v_lines is null then raise exception 'Quotation has no lines'; end if;

  v_type:=case when p_amount_paid=0 then 'CREDIT'
    when p_amount_paid=v_quote.total then 'CASH' else 'PARTIAL' end;
  v_sale:=public.create_sale(p_organization_id,p_branch_id,v_quote.customer_id,
    v_type,p_amount_paid,case when p_amount_paid>0 then p_payment_method else null end,
    p_due_date,'Origen: cotización N° '||v_quote.number||case when v_quote.notes is not null then ' - '||left(v_quote.notes,800) else '' end,
    v_lines);
  select total into v_created from public.sales where id=v_sale and organization_id=p_organization_id;
  if v_created is distinct from v_quote.total then raise exception 'Quotation and sale totals do not match'; end if;

  -- Restore the exact descriptions from the accepted quotation, not product master titles.
  for v_line in select * from public.quotation_items
    where quotation_id=v_quote.id and organization_id=p_organization_id order by id
  loop
    select si.id into v_sale_item from public.sale_items si
    where si.sale_id=v_sale and si.organization_id=p_organization_id
      and si.product_id=v_line.product_id and si.quantity=v_line.quantity
      and si.unit_price=v_line.unit_price and not (si.id = any(v_used))
    limit 1;
    if v_sale_item is null then raise exception 'Could not match sale item to quotation'; end if;
    update public.sale_items set description=v_line.description where id=v_sale_item;
    v_used:=array_append(v_used,v_sale_item);
    v_sale_item:=null;
  end loop;
  update public.quotations set sale_id=v_sale where id=v_quote.id and sale_id is null;
  if not found then raise exception 'Concurrent conversion blocked'; end if;
  return v_sale;
end $$;

revoke all on function public.accept_quotation(uuid,uuid) from public,anon;
grant execute on function public.accept_quotation(uuid,uuid) to authenticated;
revoke all on function public.convert_quotation_to_sale(uuid,uuid,uuid,numeric,text,date) from public,anon;
grant execute on function public.convert_quotation_to_sale(uuid,uuid,uuid,numeric,text,date) to authenticated;
