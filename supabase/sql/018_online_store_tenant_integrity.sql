-- Harden the existing online-store tenant isolation without removing any historical data.
-- The former policy compared p.organization_id to itself, which did not check the store owner.
begin;

drop policy if exists online_store_items_manage_insert on public.online_store_items;
create policy online_store_items_manage_insert on public.online_store_items
for insert to authenticated
with check (
  private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER'])
  and exists (
    select 1 from public.products p
    where p.id=product_id and p.organization_id=online_store_items.organization_id
      and p.item_type='PRODUCT' and p.status='ACTIVE' and p.deleted_at is null
  )
);

drop policy if exists online_store_items_manage_update on public.online_store_items;
create policy online_store_items_manage_update on public.online_store_items
for update to authenticated
using (private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']))
with check (
  private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER'])
  and exists (
    select 1 from public.products p
    where p.id=product_id and p.organization_id=online_store_items.organization_id
      and p.item_type='PRODUCT' and p.status='ACTIVE' and p.deleted_at is null
  )
);

-- Composite FK makes cross-tenant product associations impossible even for privileged writes.
create unique index if not exists products_org_id_id_store_fk_idx
on public.products (organization_id,id);
alter table public.online_store_items
  add constraint online_store_items_product_same_organization_fk
  foreign key (organization_id,product_id)
  references public.products (organization_id,id)
  on delete cascade
  not valid;
alter table public.online_store_items
  validate constraint online_store_items_product_same_organization_fk;

commit;
