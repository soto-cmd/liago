-- LiaGo: cotizaciones multiempresa independientes de ventas, recibos y Apps Script.
create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  customer_id uuid not null references public.customers(id),
  number bigint not null,
  issued_at timestamptz not null default now(),
  event_name text,
  event_date date,
  event_location text,
  notes text,
  currency text not null default 'PYG',
  subtotal numeric(18,2) not null check (subtotal >= 0),
  discount numeric(18,2) not null default 0 check (discount >= 0),
  total numeric(18,2) not null check (total >= 0),
  deposit numeric(18,2) not null default 0 check (deposit >= 0),
  status text not null default 'DRAFT' check (status in ('DRAFT','SENT','ACCEPTED','REJECTED','CANCELED')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id,number),
  unique (organization_id,id)
);
create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  quotation_id uuid not null,
  product_id uuid references public.products(id),
  description text not null,
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price numeric(18,2) not null check (unit_price >= 0),
  line_total numeric(18,2) not null check (line_total >= 0),
  foreign key (organization_id, quotation_id) references public.quotations(organization_id,id) on delete cascade
);
create table if not exists public.quotation_counters(
  organization_id uuid primary key references public.organizations(id),
  next_number bigint not null default 1 check (next_number > 0)
);
create index if not exists quotations_org_recent_idx on public.quotations(organization_id,issued_at desc);
create index if not exists quotations_customer_idx on public.quotations(organization_id,customer_id);
create index if not exists quotation_items_lookup_idx on public.quotation_items(quotation_id);
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.quotation_counters enable row level security;
drop policy if exists quotations_read on public.quotations;
create policy quotations_read on public.quotations for select to authenticated using (private.is_org_member(organization_id));
drop policy if exists quotation_items_read on public.quotation_items;
create policy quotation_items_read on public.quotation_items for select to authenticated using (private.is_org_member(organization_id));
-- Writes are deliberately only possible through the validated RPC, not direct Data API inserts.
revoke insert,update,delete on public.quotations from anon, authenticated;
revoke insert,update,delete on public.quotation_items from anon, authenticated;
revoke all on public.quotation_counters from anon, authenticated;

create or replace function public.create_quotation(
 p_organization_id uuid,p_customer_id uuid,p_items jsonb,
 p_event_name text default null,p_event_date date default null,
 p_event_location text default null,p_notes text default null,
 p_deposit numeric default 0
) returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_id uuid; v_n bigint; v_total numeric(18,2):=0; v_row jsonb;
 v_product uuid; v_description text; v_quantity numeric; v_price numeric; v_count integer:=0;
begin
 if auth.uid() is null or not exists (
   select 1 from public.organization_members m where m.organization_id=p_organization_id
     and m.user_id=auth.uid() and m.status='ACTIVE' and m.deleted_at is null
     and m.role in ('OWNER','ADMIN','MANAGER','SELLER','CASHIER')
 ) then raise exception 'Sin permisos para generar cotizaciones';
 end if;
 if not exists(select 1 from public.customers c where c.id=p_customer_id and c.organization_id=p_organization_id and c.status='ACTIVE' and c.deleted_at is null)
 then raise exception 'Cliente no válido para esta empresa'; end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 60
 then raise exception 'Se requiere entre 1 y 60 conceptos'; end if;
 for v_row in select value from jsonb_array_elements(p_items)
 loop
  v_count:=v_count+1;
  v_product:=nullif(v_row->>'product_id','')::uuid;
  v_description:=trim(coalesce(v_row->>'description',''));
  v_quantity:=(v_row->>'quantity')::numeric;
  v_price:=(v_row->>'unit_price')::numeric;
  if length(v_description)<1 or length(v_description)>500 or v_quantity<=0 or v_quantity>10000 or v_price<0 or v_price>100000000000 or v_quantity is null or v_price is null
  then raise exception 'Concepto inválido';end if;
  if v_product is not null and not exists (select 1 from public.products p where p.id=v_product and p.organization_id=p_organization_id and p.status='ACTIVE' and p.deleted_at is null)
  then raise exception 'Servicio ajeno o inactivo';end if;
  v_total:=v_total+round(v_quantity*v_price,2);
 end loop;
 if v_total>1000000000000 or p_deposit is null or p_deposit<0 or p_deposit>v_total
 then raise exception 'Importe o anticipo inválido';end if;
 -- Counter initialized once; transaction locks the row to serialize number assignment.
 insert into public.quotation_counters(organization_id,next_number) values(p_organization_id,1)
 on conflict(organization_id) do nothing;
 select next_number into v_n from public.quotation_counters where organization_id=p_organization_id for update;
 update public.quotation_counters set next_number=v_n+1 where organization_id=p_organization_id;
 insert into public.quotations(organization_id,customer_id,number,event_name,event_date,event_location,notes,currency,subtotal,total,deposit,created_by)
 values(p_organization_id,p_customer_id,v_n,left(p_event_name,160),p_event_date,left(p_event_location,250),left(p_notes,2000),
 coalesce((select currency from public.organizations where id=p_organization_id),'PYG'),v_total,v_total,p_deposit,auth.uid())
 returning id into v_id;
 insert into public.quotation_items(organization_id,quotation_id,product_id,description,quantity,unit_price,line_total)
 select p_organization_id,v_id,nullif(value->>'product_id','')::uuid,trim(value->>'description'),
 (value->>'quantity')::numeric,(value->>'unit_price')::numeric,
 round((value->>'quantity')::numeric*(value->>'unit_price')::numeric,2)
 from jsonb_array_elements(p_items);
 return v_id;
end; $$;
revoke all on function public.create_quotation(uuid,uuid,jsonb,text,date,text,text,numeric) from public, anon;
grant execute on function public.create_quotation(uuid,uuid,jsonb,text,date,text,text,numeric) to authenticated;
