-- Catálogo liviano de lugares para cotizaciones, separado por empresa.
-- Reutiliza event_location del documento y no altera los ya emitidos.
create table if not exists public.quotation_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (length(trim(name)) between 1 and 250),
  created_at timestamptz not null default now()
);
create unique index if not exists quotation_locations_org_lower_name
  on public.quotation_locations(organization_id, lower(trim(name)));
create index if not exists quotation_locations_org_order
  on public.quotation_locations(organization_id, name);
alter table public.quotation_locations enable row level security;
drop policy if exists quotation_locations_read on public.quotation_locations;
create policy quotation_locations_read on public.quotation_locations
  for select to authenticated using (private.is_org_member(organization_id));
revoke insert,update,delete on public.quotation_locations from anon,authenticated;

-- Añadido al procedimiento actual; los lugares se guardan solo al emitir
-- una cotización válida, en la misma transacción.
create or replace function public.create_quotation_detailed(
 p_organization_id uuid, p_customer_id uuid, p_items jsonb,
 p_event_name text default null, p_event_date date default null,
 p_event_location text default null, p_notes text default null,
 p_deposit numeric default 0, p_event_time text default null,
 p_included_services text default null, p_payment_terms text default null,
 p_payment_methods text default null, p_bank_details text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
declare v_location text:=nullif(trim(p_event_location),'');
begin
 if length(coalesce(p_event_time,''))>100
 or length(coalesce(p_included_services,''))>2500
 or length(coalesce(p_payment_terms,''))>1000
 or length(coalesce(p_payment_methods,''))>500
 or length(coalesce(p_bank_details,''))>700
 or length(coalesce(p_event_location,''))>250
 then raise exception 'Quotation field too long'; end if;
 -- El procedimiento original verifica usuario, empresa, cliente, ítems y monto.
 v_id:=public.create_quotation(p_organization_id,p_customer_id,p_items,
   p_event_name,p_event_date,v_location,p_notes,p_deposit);
 update public.quotations set
  event_time=nullif(trim(p_event_time),''),
  included_services=nullif(trim(p_included_services),''),
  payment_terms=nullif(trim(p_payment_terms),''),
  payment_methods=nullif(trim(p_payment_methods),''),
  bank_details=nullif(trim(p_bank_details),'')
 where id=v_id and organization_id=p_organization_id;
 if v_location is not null then
   insert into public.quotation_locations(organization_id,name)
   values(p_organization_id,v_location)
   on conflict (organization_id, (lower(trim(name)))) do nothing;
 end if;
 return v_id;
end $$;
revoke all on function public.create_quotation_detailed(uuid,uuid,jsonb,text,date,text,text,numeric,text,text,text,text,text)
 from public,anon;
grant execute on function public.create_quotation_detailed(uuid,uuid,jsonb,text,date,text,text,numeric,text,text,text,text,text)
 to authenticated;
