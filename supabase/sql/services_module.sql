-- Additive migration for LiaGo service-specific fields.
alter table public.products
  add column if not exists service_duration_minutes integer,
  add column if not exists service_billing_unit text,
  add column if not exists service_responsible_name text,
  add column if not exists service_price_variable boolean not null default false,
  add column if not exists service_requires_booking boolean not null default false;

alter table public.products drop constraint if exists products_service_duration_minutes_check;
alter table public.products add constraint products_service_duration_minutes_check
  check (service_duration_minutes is null or service_duration_minutes > 0);

alter table public.products drop constraint if exists products_service_billing_unit_check;
alter table public.products add constraint products_service_billing_unit_check
  check (service_billing_unit is null or service_billing_unit in ('SERVICE','HOUR','SESSION','DAY','VISIT','PROJECT'));

create index if not exists products_org_service_idx
  on public.products (organization_id, item_type, status)
  where deleted_at is null;
