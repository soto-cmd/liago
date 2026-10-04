-- LiaGo Fase 2A: datos maestros, productos e inventario
begin;

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  code text,
  description text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index product_categories_name_uidx on public.product_categories (organization_id, lower(name)) where deleted_at is null;
create unique index product_categories_code_uidx on public.product_categories (organization_id, lower(code)) where deleted_at is null and code is not null;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  tax_id text,
  contact_name text,
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  notes text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index suppliers_org_idx on public.suppliers(organization_id) where deleted_at is null;
create index suppliers_name_idx on public.suppliers(organization_id, name) where deleted_at is null;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  customer_code text,
  customer_type text not null default 'PERSON' check (customer_type in ('PERSON','COMPANY')),
  name text not null,
  tax_id text,
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  credit_limit numeric(18,2) not null default 0 check (credit_limit >= 0),
  notes text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE','BLOCKED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index customers_code_uidx on public.customers(organization_id, lower(customer_code)) where deleted_at is null and customer_code is not null;
create index customers_name_idx on public.customers(organization_id, name) where deleted_at is null;
create index customers_tax_idx on public.customers(organization_id, tax_id) where deleted_at is null and tax_id is not null;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  category_id uuid references public.product_categories(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  item_type text not null default 'PRODUCT' check (item_type in ('PRODUCT','SERVICE')),
  code text not null,
  sku text,
  barcode text,
  name text not null,
  description text,
  unit text not null default 'UN',
  purchase_price numeric(18,2) not null default 0 check (purchase_price >= 0),
  sale_price numeric(18,2) not null default 0 check (sale_price >= 0),
  tax_rate numeric(7,4) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  track_stock boolean not null default true,
  min_stock numeric(18,3) not null default 0 check (min_stock >= 0),
  image_url text,
  notes text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (item_type = 'PRODUCT' or track_stock = false)
);
create unique index products_code_uidx on public.products(organization_id, lower(code)) where deleted_at is null;
create unique index products_sku_uidx on public.products(organization_id, lower(sku)) where deleted_at is null and sku is not null;
create unique index products_barcode_uidx on public.products(organization_id, barcode) where deleted_at is null and barcode is not null;
create index products_name_idx on public.products(organization_id, name) where deleted_at is null;
create index products_category_idx on public.products(category_id) where deleted_at is null;
create index products_supplier_idx on public.products(supplier_id) where deleted_at is null;

create table public.inventory_balances (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(18,3) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (organization_id, branch_id, product_id)
);
create index inventory_balances_product_idx on public.inventory_balances(organization_id, product_id);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type text not null check (movement_type in ('OPENING','PURCHASE','SALE','ADJUSTMENT_IN','ADJUSTMENT_OUT','RETURN_IN','RETURN_OUT','TRANSFER_IN','TRANSFER_OUT')),
  quantity numeric(18,3) not null check (quantity <> 0),
  unit_cost numeric(18,2),
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_lookup_idx on public.inventory_movements(organization_id, product_id, created_at desc);
create index inventory_movements_branch_idx on public.inventory_movements(organization_id, branch_id, created_at desc);

create trigger product_categories_set_updated_at before update on public.product_categories for each row execute function private.set_updated_at();
create trigger suppliers_set_updated_at before update on public.suppliers for each row execute function private.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function private.set_updated_at();

create or replace function private.apply_inventory_movement()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.inventory_balances(organization_id, branch_id, product_id, quantity, updated_at)
  values(new.organization_id, new.branch_id, new.product_id, new.quantity, now())
  on conflict (organization_id, branch_id, product_id)
  do update set quantity = public.inventory_balances.quantity + excluded.quantity, updated_at = now();
  return new;
end;
$$;
revoke all on function private.apply_inventory_movement() from public;
create trigger inventory_movements_apply after insert on public.inventory_movements for each row execute function private.apply_inventory_movement();

alter table public.product_categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.inventory_movements enable row level security;

create policy product_categories_select on public.product_categories for select to authenticated using (deleted_at is null and private.is_org_member(organization_id));
create policy suppliers_select on public.suppliers for select to authenticated using (deleted_at is null and private.is_org_member(organization_id));
create policy customers_select on public.customers for select to authenticated using (deleted_at is null and private.is_org_member(organization_id));
create policy products_select on public.products for select to authenticated using (deleted_at is null and private.is_org_member(organization_id));
create policy inventory_balances_select on public.inventory_balances for select to authenticated using (private.is_org_member(organization_id));
create policy inventory_movements_select on public.inventory_movements for select to authenticated using (private.is_org_member(organization_id));

create policy product_categories_write on public.product_categories for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']));
create policy suppliers_write on public.suppliers for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']));
create policy customers_write on public.customers for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']));
create policy products_write on public.products for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']));
create policy inventory_movements_insert on public.inventory_movements for insert to authenticated with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']));

grant select, insert, update on public.product_categories, public.suppliers, public.customers, public.products to authenticated;
grant select, insert on public.inventory_movements to authenticated;
grant select on public.inventory_balances to authenticated;

commit;
