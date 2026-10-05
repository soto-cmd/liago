-- LiaGo — free-tier performance and security hardening
-- Applied to Supabase on 2026-10-05 and kept here as the source-of-truth script.
-- Objective: lower query overhead and reduce unnecessary RPC exposure without changing intended business permissions.

-- Foreign-key index for invitation redemption lookups/joins.
create index if not exists invitation_redemptions_organization_id_idx
  on public.invitation_redemptions (organization_id);

-- AUDIT LOGS ---------------------------------------------------------------
drop policy if exists audit_logs_platform_admin_select on public.audit_logs;
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
for select to authenticated
using (
  ((organization_id is not null) and private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER']))
  or private.is_platform_admin()
);

-- CUSTOMERS ----------------------------------------------------------------
drop policy if exists customers_platform_admin_all on public.customers;
drop policy if exists customers_insert on public.customers;
drop policy if exists customers_select on public.customers;
drop policy if exists customers_update on public.customers;
drop policy if exists customers_platform_admin_delete on public.customers;

create policy customers_select on public.customers
for select to authenticated
using (
  ((deleted_at is null) and private.is_org_member(organization_id))
  or private.is_platform_admin(array['SUPERADMIN','ADMIN'])
);

create policy customers_insert on public.customers
for insert to authenticated
with check (
  private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER'])
  or private.is_platform_admin(array['SUPERADMIN','ADMIN'])
);

create policy customers_update on public.customers
for update to authenticated
using (
  private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER'])
  or private.is_platform_admin(array['SUPERADMIN','ADMIN'])
)
with check (
  private.has_org_role(organization_id, array['OWNER','ADMIN','MANAGER','SELLER','CASHIER'])
  or private.is_platform_admin(array['SUPERADMIN','ADMIN'])
);

create policy customers_platform_admin_delete on public.customers
for delete to authenticated
using (private.is_platform_admin(array['SUPERADMIN','ADMIN']));

-- INVITATION REDEMPTIONS ---------------------------------------------------
drop policy if exists invitation_redemptions_admin_select on public.invitation_redemptions;
drop policy if exists invitation_redemptions_self_select on public.invitation_redemptions;
drop policy if exists invitation_redemptions_select on public.invitation_redemptions;

create policy invitation_redemptions_select on public.invitation_redemptions
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.platform_admins p
    where p.user_id = (select auth.uid()) and p.status = 'ACTIVE'
  )
);

-- ONBOARDING ---------------------------------------------------------------
drop policy if exists onboarding_progress_admin_select on public.onboarding_progress;
drop policy if exists onboarding_progress_self_select on public.onboarding_progress;
drop policy if exists onboarding_progress_self_write on public.onboarding_progress;
drop policy if exists onboarding_progress_select on public.onboarding_progress;
drop policy if exists onboarding_progress_insert on public.onboarding_progress;
drop policy if exists onboarding_progress_update on public.onboarding_progress;
drop policy if exists onboarding_progress_delete on public.onboarding_progress;

create policy onboarding_progress_select on public.onboarding_progress
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.platform_admins p
    where p.user_id = (select auth.uid()) and p.status = 'ACTIVE'
  )
);
create policy onboarding_progress_insert on public.onboarding_progress
for insert to authenticated
with check (user_id = (select auth.uid()));
create policy onboarding_progress_update on public.onboarding_progress
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy onboarding_progress_delete on public.onboarding_progress
for delete to authenticated
using (user_id = (select auth.uid()));

-- USER ACTIVITY ------------------------------------------------------------
drop policy if exists user_activity_admin_select on public.user_activity;
drop policy if exists user_activity_self_select on public.user_activity;
drop policy if exists user_activity_self_write on public.user_activity;
drop policy if exists user_activity_select on public.user_activity;
drop policy if exists user_activity_insert on public.user_activity;
drop policy if exists user_activity_update on public.user_activity;
drop policy if exists user_activity_delete on public.user_activity;

create policy user_activity_select on public.user_activity
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.platform_admins p
    where p.user_id = (select auth.uid()) and p.status = 'ACTIVE'
  )
);
create policy user_activity_insert on public.user_activity
for insert to authenticated
with check (user_id = (select auth.uid()));
create policy user_activity_update on public.user_activity
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy user_activity_delete on public.user_activity
for delete to authenticated
using (user_id = (select auth.uid()));

-- USER PROFILES ------------------------------------------------------------
drop policy if exists user_profiles_admin_select on public.user_profiles;
drop policy if exists user_profiles_self_select on public.user_profiles;
drop policy if exists user_profiles_self_write on public.user_profiles;
drop policy if exists user_profiles_select on public.user_profiles;
drop policy if exists user_profiles_insert on public.user_profiles;
drop policy if exists user_profiles_update on public.user_profiles;
drop policy if exists user_profiles_delete on public.user_profiles;

create policy user_profiles_select on public.user_profiles
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.platform_admins p
    where p.user_id = (select auth.uid()) and p.status = 'ACTIVE'
  )
);
create policy user_profiles_insert on public.user_profiles
for insert to authenticated
with check (user_id = (select auth.uid()));
create policy user_profiles_update on public.user_profiles
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy user_profiles_delete on public.user_profiles
for delete to authenticated
using (user_id = (select auth.uid()));

-- ORGANIZATION MEMBERS -----------------------------------------------------
drop policy if exists organization_members_platform_admin_write on public.organization_members;
drop policy if exists organization_members_platform_admin_select on public.organization_members;
drop policy if exists organization_members_insert on public.organization_members;
drop policy if exists organization_members_select on public.organization_members;
drop policy if exists organization_members_update on public.organization_members;
drop policy if exists organization_members_platform_admin_delete on public.organization_members;

create policy organization_members_select on public.organization_members
for select to authenticated
using (
  ((deleted_at is null) and ((user_id = (select auth.uid())) or private.is_org_member(organization_id)))
  or private.is_platform_admin()
);

create policy organization_members_insert on public.organization_members
for insert to authenticated
with check (
  (
    (user_id = (select auth.uid()))
    and role = 'OWNER'
    and status = 'ACTIVE'
    and not private.org_has_any_member(organization_id)
    and exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.created_by = (select auth.uid())
        and o.deleted_at is null
    )
  )
  or private.has_org_role(organization_id, array['OWNER'])
  or ((role <> 'OWNER') and private.has_org_role(organization_id, array['ADMIN']))
  or private.is_platform_admin(array['SUPERADMIN','ADMIN'])
);

create policy organization_members_update on public.organization_members
for update to authenticated
using (
  ((deleted_at is null) and (
    private.has_org_role(organization_id, array['OWNER'])
    or ((role <> 'OWNER') and private.has_org_role(organization_id, array['ADMIN']))
  ))
  or private.is_platform_admin(array['SUPERADMIN','ADMIN'])
)
with check (
  private.has_org_role(organization_id, array['OWNER'])
  or ((role <> 'OWNER') and private.has_org_role(organization_id, array['ADMIN']))
  or private.is_platform_admin(array['SUPERADMIN','ADMIN'])
);

create policy organization_members_platform_admin_delete on public.organization_members
for delete to authenticated
using (private.is_platform_admin(array['SUPERADMIN','ADMIN']));

-- ORGANIZATIONS ------------------------------------------------------------
drop policy if exists organizations_platform_admin_select on public.organizations;
drop policy if exists organizations_select on public.organizations;
drop policy if exists organizations_platform_admin_update on public.organizations;
drop policy if exists organizations_update on public.organizations;

create policy organizations_select on public.organizations
for select to authenticated
using (
  ((deleted_at is null) and ((created_by = (select auth.uid())) or private.is_org_member(id)))
  or private.is_platform_admin()
);

create policy organizations_update on public.organizations
for update to authenticated
using (
  ((deleted_at is null) and private.has_org_role(id, array['OWNER','ADMIN']))
  or private.is_platform_admin(array['SUPERADMIN','ADMIN'])
)
with check (
  private.has_org_role(id, array['OWNER','ADMIN'])
  or private.is_platform_admin(array['SUPERADMIN','ADMIN'])
);

-- SUBSCRIPTIONS ------------------------------------------------------------
drop policy if exists subscriptions_platform_admin_select on public.subscriptions;
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
for select to authenticated
using (
  private.has_org_role(organization_id, array['OWNER','ADMIN'])
  or private.is_platform_admin()
);

-- RPC ACCESS ---------------------------------------------------------------
-- These functions require an authenticated user, or do nothing when anonymous.
revoke execute on function public.platform_user_activity() from anon, public;
revoke execute on function public.redeem_invitation(uuid) from anon, public;
revoke execute on function public.touch_user_activity(text) from anon, public;

-- This endpoint intentionally remains available before sign-in so invitation
-- details can be displayed. Remove the implicit PUBLIC grant, retaining the
-- explicit anon/authenticated grants.
revoke execute on function public.get_invitation_link(uuid) from public;

-- Future functions must be explicitly granted to client roles.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
