-- LiaGo Fase 2H: índices de relaciones y RLS sin políticas SELECT duplicadas
begin;

-- Las políticas *_write creadas como FOR ALL también evaluaban SELECT.
-- Se reemplazan por INSERT/UPDATE específicas; no habilitamos DELETE físico.
drop policy if exists product_categories_write on public.product_categories;
drop policy if exists suppliers_write on public.suppliers;
drop policy if exists customers_write on public.customers;
drop policy if exists products_write on public.products;

create policy product_categories_insert on public.product_categories
for insert to authenticated
with check (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER']));
create policy product_categories_update on public.product_categories
for update to authenticated
using (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER']))
with check (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER']));

create policy suppliers_insert on public.suppliers
for insert to authenticated
with check (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER']));
create policy suppliers_update on public.suppliers
for update to authenticated
using (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER']))
with check (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER']));

create policy customers_insert on public.customers
for insert to authenticated
with check (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']));
create policy customers_update on public.customers
for update to authenticated
using (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']))
with check (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER','SELLER','CASHIER']));

create policy products_insert on public.products
for insert to authenticated
with check (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER']));
create policy products_update on public.products
for update to authenticated
using (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER']))
with check (private.has_org_role(organization_id,array['OWNER','ADMIN','MANAGER']));

-- Índices de FK no cubiertos por los índices compuestos existentes.
create index if not exists cash_movements_branch_idx on public.cash_movements(branch_id);
create index if not exists cash_movements_cash_session_idx on public.cash_movements(cash_session_id) where cash_session_id is not null;
create index if not exists cash_movements_created_by_idx on public.cash_movements(created_by) where created_by is not null;
create index if not exists cash_sessions_branch_idx on public.cash_sessions(branch_id);
create index if not exists cash_sessions_opened_by_idx on public.cash_sessions(opened_by);
create index if not exists cash_sessions_closed_by_idx on public.cash_sessions(closed_by) where closed_by is not null;
create index if not exists customer_account_entries_customer_idx on public.customer_account_entries(customer_id);
create index if not exists customer_account_entries_created_by_idx on public.customer_account_entries(created_by) where created_by is not null;
create index if not exists debts_customer_fk_idx on public.debts(customer_id);
create index if not exists expenses_branch_idx on public.expenses(branch_id) where branch_id is not null;
create index if not exists expenses_created_by_idx on public.expenses(created_by) where created_by is not null;
create index if not exists expenses_supplier_idx on public.expenses(supplier_id) where supplier_id is not null;
create index if not exists inventory_balances_branch_idx on public.inventory_balances(branch_id);
create index if not exists inventory_balances_product_fk_idx on public.inventory_balances(product_id);
create index if not exists inventory_movements_branch_fk_idx on public.inventory_movements(branch_id);
create index if not exists inventory_movements_product_fk_idx on public.inventory_movements(product_id);
create index if not exists inventory_movements_created_by_idx on public.inventory_movements(created_by) where created_by is not null;
create index if not exists payment_allocations_org_idx on public.payment_allocations(organization_id);
create index if not exists payments_branch_idx on public.payments(branch_id) where branch_id is not null;
create index if not exists payments_customer_fk_idx on public.payments(customer_id) where customer_id is not null;
create index if not exists payments_created_by_idx on public.payments(created_by) where created_by is not null;
create index if not exists purchase_items_org_idx on public.purchase_items(organization_id);
create index if not exists purchase_items_product_idx on public.purchase_items(product_id);
create index if not exists purchases_branch_idx on public.purchases(branch_id) where branch_id is not null;
create index if not exists purchases_supplier_fk_idx on public.purchases(supplier_id);
create index if not exists purchases_created_by_idx on public.purchases(created_by) where created_by is not null;
create index if not exists sale_items_product_fk_idx on public.sale_items(product_id) where product_id is not null;
create index if not exists sales_branch_idx on public.sales(branch_id) where branch_id is not null;
create index if not exists sales_customer_fk_idx on public.sales(customer_id) where customer_id is not null;
create index if not exists sales_created_by_idx on public.sales(created_by) where created_by is not null;
create index if not exists sales_canceled_by_idx on public.sales(canceled_by) where canceled_by is not null;

commit;
