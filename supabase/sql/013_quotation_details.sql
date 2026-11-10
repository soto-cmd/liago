-- Campos adicionales para reproducir los datos del ejemplo 242, sin alterar documentos antiguos.
alter table public.quotations
 add column if not exists event_time text,
 add column if not exists included_services text,
 add column if not exists payment_terms text,
 add column if not exists payment_methods text,
 add column if not exists bank_details text;

create or replace function public.create_quotation_detailed(
 p_organization_id uuid, p_customer_id uuid, p_items jsonb,
 p_event_name text default null, p_event_date date default null,
 p_event_location text default null, p_notes text default null,
 p_deposit numeric default 0, p_event_time text default null,
 p_included_services text default null, p_payment_terms text default null,
 p_payment_methods text default null, p_bank_details text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if length(coalesce(p_event_time,''))>100
 or length(coalesce(p_included_services,''))>2500
 or length(coalesce(p_payment_terms,''))>1000
 or length(coalesce(p_payment_methods,''))>500
 or length(coalesce(p_bank_details,''))>700
 then raise exception 'Additional quotation field too long'; end if;
 -- Se reutiliza el procedimiento existente para permisos, numeración y conceptos.
 v_id:=public.create_quotation(p_organization_id,p_customer_id,p_items,
   p_event_name,p_event_date,p_event_location,p_notes,p_deposit);
 update public.quotations set
  event_time=nullif(trim(p_event_time),''),
  included_services=nullif(trim(p_included_services),''),
  payment_terms=nullif(trim(p_payment_terms),''),
  payment_methods=nullif(trim(p_payment_methods),''),
  bank_details=nullif(trim(p_bank_details),'')
 where id=v_id and organization_id=p_organization_id;
 return v_id;
end $$;
revoke all on function public.create_quotation_detailed(uuid,uuid,jsonb,text,date,text,text,numeric,text,text,text,text,text) from public,anon;
grant execute on function public.create_quotation_detailed(uuid,uuid,jsonb,text,date,text,text,numeric,text,text,text,text,text) to authenticated;