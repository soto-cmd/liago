-- LiaGo Fase 2B: ventas, cuenta corriente, compras y caja
begin;

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete restrict,
  sale_number bigint not null,
  sale_type text not null default 'CASH' check (sale_type in ('CASH','PARTIAL','CREDIT')),
  status text not null default 'DRAFT' check (status in ('DRAFT','CONFIRMED','CANCELED')),
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING','PARTIAL','PAID','CANCELED')),
  sold_at timestamptz not null default now(),
  due_date date,
  subtotal numeric(18,2) not null default 0 check (subtotal >= 0),
  discount_total numeric(18,2) not null default 0 check (discount_total >= 0),
  tax_total numeric(18,2) not null default 0 check (tax_total >= 0),
  total numeric(18,2) not null default 0 check (total >= 0),
  amount_paid numeric(18,2) not null default 0 check (amount_paid >= 0),
  balance_due numeric(18,2) not null default 0 check (balance_due >= 0),
  payment_method text,
  reference text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  canceled_at timestamptz,
  canceled_by uuid references auth.users(id) on delete set null,
  unique (organization_id, sale_number)
);
create index sales_org_date_idx on public.sales(organization_id, sold_at desc);
create index sales_customer_idx on public.sales(organization_id, customer_id, sold_at desc);
create index sales_status_idx on public.sales(organization_id, status, payment_status);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  sale_id uuid not null references public.sales(id) on delete restrict,
  product_id uuid references public.products(id) on delete restrict,
  item_code text,
  description text not null,
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price numeric(18,2) not null check (unit_price >= 0),
  discount numeric(18,2) not null default 0 check (discount >= 0),
  tax_rate numeric(7,4) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  line_subtotal numeric(18,2) not null default 0,
  line_tax numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0
);
create index sale_items_sale_idx on public.sale_items(sale_id);
create index sale_items_product_idx on public.sale_items(organization_id, product_id);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  sale_id uuid references public.sales(id) on delete restrict,
  concept text not null,
  original_amount numeric(18,2) not null check (original_amount > 0),
  balance numeric(18,2) not null check (balance >= 0),
  issued_at date not null default current_date,
  due_date date,
  reference text,
  status text not null default 'PENDING' check (status in ('PENDING','PARTIAL','PAID','CANCELED','OVERDUE')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index debts_customer_idx on public.debts(organization_id, customer_id, status, due_date);
create index debts_sale_idx on public.debts(sale_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete restrict,
  payment_number bigint not null,
  paid_at timestamptz not null default now(),
  amount numeric(18,2) not null check (amount > 0),
  payment_method text not null,
  reference text,
  notes text,
  status text not null default 'CONFIRMED' check (status in ('CONFIRMED','CANCELED')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, payment_number)
);
create index payments_customer_idx on public.payments(organization_id, customer_id, paid_at desc);

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  payment_id uuid not null references public.payments(id) on delete restrict,
  debt_id uuid not null references public.debts(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique(payment_id, debt_id)
);
create index payment_allocations_debt_idx on public.payment_allocations(debt_id);

create table public.customer_account_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  entry_date timestamptz not null default now(),
  entry_type text not null check (entry_type in ('SALE','DEBT','PAYMENT','CREDIT','DEBIT','ADJUSTMENT')),
  description text not null,
  debit numeric(18,2) not null default 0 check (debit >= 0),
  credit numeric(18,2) not null default 0 check (credit >= 0),
  reference_type text,
  reference_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);
create index customer_account_entries_idx on public.customer_account_entries(organization_id, customer_id, entry_date desc);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete restrict,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  purchase_number bigint not null,
  purchase_type text not null default 'CASH' check (purchase_type in ('CASH','PARTIAL','CREDIT')),
  status text not null default 'DRAFT' check (status in ('DRAFT','RECEIVED','CANCELED')),
  purchased_at timestamptz not null default now(),
  due_date date,
  subtotal numeric(18,2) not null default 0,
  discount_total numeric(18,2) not null default 0,
  tax_total numeric(18,2) not null default 0,
  total numeric(18,2) not null default 0,
  amount_paid numeric(18,2) not null default 0,
  balance_due numeric(18,2) not null default 0,
  reference text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, purchase_number)
);
create index purchases_supplier_idx on public.purchases(organization_id, supplier_id, purchased_at desc);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  purchase_id uuid not null references public.purchases(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(18,3) not null check (quantity > 0),
  unit_cost numeric(18,2) not null check (unit_cost >= 0),
  discount numeric(18,2) not null default 0,
  tax_rate numeric(7,4) not null default 0,
  line_total numeric(18,2) not null default 0
);
create index purchase_items_purchase_idx on public.purchase_items(purchase_id);

create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  opened_by uuid not null references auth.users(id) on delete restrict,
  opened_at timestamptz not null default now(),
  opening_amount numeric(18,2) not null default 0,
  status text not null default 'OPEN' check (status in ('OPEN','CLOSED')),
  closed_by uuid references auth.users(id) on delete restrict,
  closed_at timestamptz,
  expected_amount numeric(18,2),
  closing_amount numeric(18,2),
  difference numeric(18,2),
  notes text
);
create index cash_sessions_org_idx on public.cash_sessions(organization_id, branch_id, opened_at desc);

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid not null references public.branches(id) on delete restrict,
  cash_session_id uuid references public.cash_sessions(id) on delete restrict,
  movement_type text not null check (movement_type in ('SALE','PAYMENT','PURCHASE','EXPENSE','INCOME','WITHDRAWAL','ADJUSTMENT')),
  direction text not null check (direction in ('IN','OUT')),
  amount numeric(18,2) not null check (amount > 0),
  description text not null,
  payment_method text,
  reference_type text,
  reference_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index cash_movements_session_idx on public.cash_movements(organization_id, cash_session_id, created_at desc);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete restrict,
  expense_date timestamptz not null default now(),
  category text not null,
  description text not null,
  amount numeric(18,2) not null check (amount > 0),
  payment_method text,
  supplier_id uuid references public.suppliers(id) on delete set null,
  reference text,
  notes text,
  status text not null default 'CONFIRMED' check (status in ('CONFIRMED','CANCELED')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index expenses_org_date_idx on public.expenses(organization_id, expense_date desc);

create table public.document_counters (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  document_type text not null check (document_type in ('SALE','PAYMENT','PURCHASE','CUSTOMER','PRODUCT')),
  next_number bigint not null default 1 check (next_number > 0),
  prefix text,
  updated_at timestamptz not null default now(),
  primary key (organization_id, document_type)
);

create trigger sales_set_updated_at before update on public.sales for each row execute function private.set_updated_at();
create trigger debts_set_updated_at before update on public.debts for each row execute function private.set_updated_at();
create trigger purchases_set_updated_at before update on public.purchases for each row execute function private.set_updated_at();

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.debts enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.customer_account_entries enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;
alter table public.expenses enable row level security;
alter table public.document_counters enable row level security;

create policy sales_select on public.sales for select to authenticated using (private.is_org_member(organization_id));
create policy sale_items_select on public.sale_items for select to authenticated using (private.is_org_member(organization_id));
create policy debts_select on public.debts for select to authenticated using (private.is_org_member(organization_id));
create policy payments_select on public.payments for select to authenticated using (private.is_org_member(organization_id));
create policy payment_allocations_select on public.payment_allocations for select to authenticated using (private.is_org_member(organization_id));
create policy customer_account_entries_select on public.customer_account_entries for select to authenticated using (private.is_org_member(organization_id));
create policy purchases_select on public.purchases for select to authenticated using (private.is_org_member(organization_id));
create policy purchase_items_select on public.purchase_items for select to authenticated using (private.is_org_member(organization_id));
create policy cash_sessions_select on public.cash_sessions for select to authenticated using (private.is_org_member(organization_id));
create policy cash_movements_select on public.cash_movements for select to authenticated using (private.is_org_member(organization_id));
create policy expenses_select on public.expenses for select to authenticated using (private.is_org_member(organization_id));
create policy document_counters_select on public.document_counters for select to authenticated using (private.is_org_member(organization_id));

create policy sales_write on public.sales for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']));
create policy sale_items_write on public.sale_items for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']));
create policy debts_write on public.debts for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']));
create policy payments_write on public.payments for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']));
create policy payment_allocations_write on public.payment_allocations for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']));
create policy account_entries_write on public.customer_account_entries for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']));
create policy purchases_write on public.purchases for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']));
create policy purchase_items_write on public.purchase_items for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']));
create policy cash_sessions_write on public.cash_sessions for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','CASHIER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','CASHIER']));
create policy cash_movements_write on public.cash_movements for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','CASHIER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','CASHIER']));
create policy expenses_write on public.expenses for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','CASHIER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','CASHIER']));
create policy document_counters_write on public.document_counters for all to authenticated using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER'])) with check (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']));

grant select, insert, update on public.sales, public.sale_items, public.debts, public.payments, public.payment_allocations, public.customer_account_entries to authenticated;
grant select, insert, update on public.purchases, public.purchase_items, public.cash_sessions, public.cash_movements, public.expenses, public.document_counters to authenticated;

commit;
