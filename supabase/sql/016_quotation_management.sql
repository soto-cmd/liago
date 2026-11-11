-- Quotation lifecycle in Liago. Run after 011-015. Does not modify historic sale/receipt functions.
-- Quotation numbers are never recycled.
create or replace function public.update_quotation_detailed(
 p_organization_id uuid, p_quotation_id uuid, p_customer_id uuid, p_items jsonb,
 p_event_name text default null, p_event_date date default null, p_event_location text default null,
 p_notes text default null, p_deposit numeric default 0, p_event_time text default null,
 p_included_services text default null, p_payment_terms text default null,
 p_payment_methods text default null, p_bank_details text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_quote public.quotations%rowtype;
 v_row jsonb; v_total numeric(18,2):=0; v_qty numeric; v_price numeric;
 v_desc text; v_product uuid;
begin
 if auth.uid() is null or not exists (
  select 1 from public.organization_members m where m.organization_id=p_organization_id
    and m.user_id=auth.uid() and m.status='ACTIVE' and m.deleted_at is null
    and m.role in ('OWNER','ADMIN','MANAGER','SELLER','CASHIER')
 ) then raise exception 'Sin permisos'; end if;
 select * into v_quote from public.quotations where id=p_quotation_id and organization_id=p_organization_id for update;
 if not found then raise exception 'Cotización inexistente'; end if;
 if v_quote.sale_id is not null or v_quote.status not in ('DRAFT','SENT')
 then raise exception 'Solo se pueden editar cotizaciones no aceptadas ni convertidas'; end if;
 if not exists (select 1 from public.customers where id=p_customer_id and organization_id=p_organization_id
     and status='ACTIVE' and deleted_at is null)
 then raise exception 'Cliente inválido'; end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 60
 then raise exception 'Conceptos inválidos'; end if;
 if length(coalesce(p_event_name,''))>160 or length(coalesce(p_event_location,''))>250
    or length(coalesce(p_notes,''))>2000 or length(coalesce(p_event_time,''))>100
    or length(coalesce(p_included_services,''))>2500 or length(coalesce(p_payment_terms,''))>1000
    or length(coalesce(p_payment_methods,''))>500 or length(coalesce(p_bank_details,''))>700
 then raise exception 'Texto demasiado extenso'; end if;
 for v_row in select value from jsonb_array_elements(p_items) loop
   v_desc:=trim(coalesce(v_row->>'description',''));
   v_qty:=nullif(v_row->>'quantity','')::numeric;
   v_price:=nullif(v_row->>'unit_price','')::numeric;
   v_product:=nullif(v_row->>'product_id','')::uuid;
   if length(v_desc) not between 1 and 500 or v_qty is null or v_qty<=0 or v_qty>10000
      or v_price is null or v_price<=0 or v_price>100000000000
   then raise exception 'Servicio o precio inválido'; end if;
   if v_product is not null and not exists (
     select 1 from public.products where id=v_product and organization_id=p_organization_id
        and status='ACTIVE' and deleted_at is null
   ) then raise exception 'Servicio inválido'; end if;
   v_total:=v_total+round(v_qty*v_price,2);
 end loop;
 if v_total<=0 or v_total>1000000000000 or p_deposit is null or p_deposit<0 or p_deposit>v_total
 then raise exception 'Importes inválidos'; end if;
 update public.quotations set customer_id=p_customer_id, event_name=nullif(trim(p_event_name),''),
  event_date=p_event_date, event_location=nullif(trim(p_event_location),''),
  notes=nullif(trim(p_notes),''), deposit=p_deposit, subtotal=v_total, total=v_total,
  event_time=nullif(trim(p_event_time),''), included_services=nullif(trim(p_included_services),''),
  payment_terms=nullif(trim(p_payment_terms),''), payment_methods=nullif(trim(p_payment_methods),''),
  bank_details=nullif(trim(p_bank_details),'')
 where id=p_quotation_id and organization_id=p_organization_id;
 delete from public.quotation_items where quotation_id=p_quotation_id and organization_id=p_organization_id;
 insert into public.quotation_items (organization_id,quotation_id,product_id,description,quantity,unit_price,line_total)
 select p_organization_id,p_quotation_id,nullif(value->>'product_id','')::uuid,trim(value->>'description'),
    (value->>'quantity')::numeric,(value->>'unit_price')::numeric,
    round((value->>'quantity')::numeric*(value->>'unit_price')::numeric,2)
 from jsonb_array_elements(p_items);
 return p_quotation_id;
end $$;

create or replace function public.remove_quotation(
 p_organization_id uuid, p_quotation_id uuid, p_delete boolean default false
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_quote public.quotations%rowtype; v_role text;
begin
 select role into v_role from public.organization_members where organization_id=p_organization_id
 and user_id=auth.uid() and status='ACTIVE' and deleted_at is null;
 if v_role is null or v_role not in ('OWNER','ADMIN','MANAGER') then raise exception 'Sin permisos'; end if;
 select * into v_quote from public.quotations where id=p_quotation_id and organization_id=p_organization_id for update;
 if not found then raise exception 'Cotización inexistente'; end if;
 if v_quote.sale_id is not null then raise exception 'La cotización tiene cobros vinculados; no se puede eliminar ni anular aquí'; end if;
 if p_delete then
   if v_role not in ('OWNER','ADMIN') or v_quote.status <> 'DRAFT'
   then raise exception 'Solo propietarios y administradores pueden eliminar borradores'; end if;
   delete from public.quotations where id=p_quotation_id and organization_id=p_organization_id;
 else
   if v_quote.status = 'ACCEPTED' then raise exception 'No se puede anular una cotización aceptada'; end if;
   update public.quotations set status='CANCELED' where id=p_quotation_id and organization_id=p_organization_id;
 end if;
 return p_quotation_id;
end $$;
revoke all on function public.update_quotation_detailed(uuid,uuid,uuid,jsonb,text,date,text,text,numeric,text,text,text,text,text) from public,anon;
grant execute on function public.update_quotation_detailed(uuid,uuid,uuid,jsonb,text,date,text,text,numeric,text,text,text,text,text) to authenticated;
revoke all on function public.remove_quotation(uuid,uuid,boolean) from public,anon;
grant execute on function public.remove_quotation(uuid,uuid,boolean) to authenticated;
