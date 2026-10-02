-- LiaGo - Fase 1
-- Ejecutar como migración en un proyecto Supabase NUEVO.
-- Diseñado para proyectos 2026 donde los GRANT del Data API pueden requerirse explícitamente.

begin;

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  slug text not null,
  legal_name text,
  tax_id text,
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  country text not null default 'PY' check (char_length(country) = 2),
  currency text not null default 'PYG' check (char_length(currency) = 3),
  logo_url text,
  primary_color text not null default '#171717',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index organizations_slug_active_uidx
  on public.organizations (lower(slug))
  where deleted_at is null;

create index organizations_created_by_idx
  on public.organizations (created_by);

create index organizations_created_at_idx
  on public.organizations (created_at desc);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null,
  status text not null default 'ACTIVE'
    check (status in ('INVITED', 'ACTIVE', 'DISABLED')),
  invited_by uuid references auth.users(id) on delete set null,
  permission_overrides jsonb not null default '{}'::jsonb,
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index organization_members_active_uidx
  on public.organization_members (organization_id, user_id)
  where deleted_at is null;

create index organization_members_user_idx
  on public.organization_members (user_id)
  where deleted_at is null;

create index organization_members_org_idx
  on public.organization_members (organization_id)
  where deleted_at is null;

create index organization_members_role_idx
  on public.organization_members (organization_id, role)
  where deleted_at is null and status = 'ACTIVE';

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  code text,
  address text,
  city text,
  is_main boolean not null default false,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index branches_organization_idx
  on public.branches (organization_id)
  where deleted_at is null;

create unique index branches_code_active_uidx
  on public.branches (organization_id, lower(code))
  where deleted_at is null and code is not null;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  plan text not null default 'FREE'
    check (plan in ('FREE', 'BASIC', 'PRO', 'BUSINESS')),
  status text not null default 'ACTIVE'
    check (status in ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  billing_provider text,
  external_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_one_active_per_org_uidx
  on public.subscriptions (organization_id)
  where status in ('TRIALING', 'ACTIVE', 'PAST_DUE');

create index subscriptions_plan_idx
  on public.subscriptions (plan, status);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  module text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_org_created_idx
  on public.audit_logs (organization_id, created_at desc);

create index audit_logs_actor_idx
  on public.audit_logs (actor_user_id, created_at desc);

create index audit_logs_module_idx
  on public.audit_logs (organization_id, module, created_at desc);

create or replace function private.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'ACTIVE'
      and m.deleted_at is null
  );
$$;

revoke all on function private.is_org_member(uuid) from public;
grant execute on function private.is_org_member(uuid) to authenticated;

create or replace function private.has_org_role(
  p_organization_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.role = any(p_roles)
      and m.status = 'ACTIVE'
      and m.deleted_at is null
  );
$$;

revoke all on function private.has_org_role(uuid, text[]) from public;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;

create or replace function private.org_has_any_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.deleted_at is null
  );
$$;

revoke all on function private.org_has_any_member(uuid) from public;
grant execute on function private.org_has_any_member(uuid) to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();

create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function private.set_updated_at();

create trigger branches_set_updated_at
before update on public.branches
for each row execute function private.set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function private.set_updated_at();

create or replace function private.bootstrap_free_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.subscriptions (
    organization_id,
    plan,
    status,
    starts_at
  )
  values (
    new.id,
    'FREE',
    'ACTIVE',
    now()
  );

  return new;
end;
$$;

revoke all on function private.bootstrap_free_subscription() from public;

create trigger organizations_bootstrap_free_subscription
after insert on public.organizations
for each row execute function private.bootstrap_free_subscription();

create or replace function private.audit_core_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_org_id uuid;
  v_record_id text;
begin
  if tg_op <> 'INSERT' then
    v_old := to_jsonb(old);
  end if;

  if tg_op <> 'DELETE' then
    v_new := to_jsonb(new);
  end if;

  if tg_table_name = 'organizations' then
    v_org_id := coalesce(
      nullif(v_new ->> 'id', '')::uuid,
      nullif(v_old ->> 'id', '')::uuid
    );
    v_record_id := coalesce(v_new ->> 'id', v_old ->> 'id');
  else
    v_org_id := coalesce(
      nullif(v_new ->> 'organization_id', '')::uuid,
      nullif(v_old ->> 'organization_id', '')::uuid
    );
    v_record_id := coalesce(v_new ->> 'id', v_old ->> 'id');
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_user_id,
    action,
    module,
    record_id,
    old_data,
    new_data
  )
  values (
    v_org_id,
    (select auth.uid()),
    tg_op,
    tg_table_name,
    v_record_id,
    v_old,
    v_new
  );

  return coalesce(new, old);
end;
$$;

revoke all on function private.audit_core_change() from public;

create trigger organizations_audit
after insert or update on public.organizations
for each row execute function private.audit_core_change();

create trigger organization_members_audit
after insert or update on public.organization_members
for each row execute function private.audit_core_change();

create trigger branches_audit
after insert or update on public.branches
for each row execute function private.audit_core_change();

create trigger subscriptions_audit
after insert or update on public.subscriptions
for each row execute function private.audit_core_change();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.branches enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;

-- ORGANIZATIONS

create policy organizations_select
on public.organizations
for select
to authenticated
using (
  deleted_at is null
  and (
    created_by = (select auth.uid())
    or private.is_org_member(id)
  )
);

create policy organizations_insert
on public.organizations
for insert
to authenticated
with check (
  created_by = (select auth.uid())
);

create policy organizations_update
on public.organizations
for update
to authenticated
using (
  deleted_at is null
  and private.has_org_role(id, array['OWNER', 'ADMIN'])
)
with check (
  private.has_org_role(id, array['OWNER', 'ADMIN'])
);

-- No DELETE policy: soft delete only.

-- ORGANIZATION MEMBERS

create policy organization_members_select
on public.organization_members
for select
to authenticated
using (
  deleted_at is null
  and (
    user_id = (select auth.uid())
    or private.is_org_member(organization_id)
  )
);

create policy organization_members_insert
on public.organization_members
for insert
to authenticated
with check (
  (
    user_id = (select auth.uid())
    and role = 'OWNER'
    and status = 'ACTIVE'
    and not private.org_has_any_member(organization_id)
    and exists (
      select 1
      from public.organizations o
      where o.id = organization_id
        and o.created_by = (select auth.uid())
        and o.deleted_at is null
    )
  )
  or private.has_org_role(organization_id, array['OWNER'])
  or (
    role <> 'OWNER'
    and private.has_org_role(organization_id, array['ADMIN'])
  )
);

create policy organization_members_update
on public.organization_members
for update
to authenticated
using (
  deleted_at is null
  and (
    private.has_org_role(organization_id, array['OWNER'])
    or (
      role <> 'OWNER'
      and private.has_org_role(organization_id, array['ADMIN'])
    )
  )
)
with check (
  (
    private.has_org_role(organization_id, array['OWNER'])
    or (
      role <> 'OWNER'
      and private.has_org_role(organization_id, array['ADMIN'])
    )
  )
);

-- No physical DELETE policy.

-- BRANCHES

create policy branches_select
on public.branches
for select
to authenticated
using (
  deleted_at is null
  and private.is_org_member(organization_id)
);

create policy branches_insert
on public.branches
for insert
to authenticated
with check (
  private.has_org_role(organization_id, array['OWNER', 'ADMIN', 'MANAGER'])
);

create policy branches_update
on public.branches
for update
to authenticated
using (
  deleted_at is null
  and private.has_org_role(organization_id, array['OWNER', 'ADMIN', 'MANAGER'])
)
with check (
  private.has_org_role(organization_id, array['OWNER', 'ADMIN', 'MANAGER'])
);

-- SUBSCRIPTIONS: lectura para la empresa; escritura reservada para backend/plataforma.

create policy subscriptions_select
on public.subscriptions
for select
to authenticated
using (
  private.has_org_role(organization_id, array['OWNER', 'ADMIN'])
);

-- AUDIT LOGS: lectura administrativa, sin escritura directa desde cliente.

create policy audit_logs_select
on public.audit_logs
for select
to authenticated
using (
  organization_id is not null
  and private.has_org_role(organization_id, array['OWNER', 'ADMIN', 'MANAGER'])
);

-- RPC transaccional para onboarding.
-- SECURITY INVOKER: usa privilegios y RLS del usuario autenticado.

create or replace function public.create_organization(
  p_name text,
  p_legal_name text default null,
  p_tax_id text default null,
  p_phone text default null,
  p_whatsapp text default null,
  p_email text default null,
  p_address text default null,
  p_city text default null,
  p_country text default 'PY',
  p_currency text default 'PYG',
  p_primary_color text default '#171717'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_org_id uuid;
  v_slug text;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_name is null or char_length(trim(p_name)) < 2 then
    raise exception 'Organization name is required';
  end if;

  v_slug :=
    trim(both '-' from lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g')))
    || '-'
    || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.organizations (
    name,
    slug,
    legal_name,
    tax_id,
    phone,
    whatsapp,
    email,
    address,
    city,
    country,
    currency,
    primary_color,
    created_by
  )
  values (
    trim(p_name),
    v_slug,
    nullif(trim(p_legal_name), ''),
    nullif(trim(p_tax_id), ''),
    nullif(trim(p_phone), ''),
    nullif(trim(p_whatsapp), ''),
    nullif(trim(p_email), ''),
    nullif(trim(p_address), ''),
    nullif(trim(p_city), ''),
    upper(trim(p_country)),
    upper(trim(p_currency)),
    coalesce(nullif(trim(p_primary_color), ''), '#171717'),
    v_user_id
  )
  returning id into v_org_id;

  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    status
  )
  values (
    v_org_id,
    v_user_id,
    'OWNER',
    'ACTIVE'
  );

  insert into public.branches (
    organization_id,
    name,
    code,
    is_main,
    status
  )
  values (
    v_org_id,
    'Casa central',
    'MAIN',
    true,
    'ACTIVE'
  );

  return v_org_id;
end;
$$;

revoke all on function public.create_organization(
  text, text, text, text, text, text, text, text, text, text, text
) from public;

grant execute on function public.create_organization(
  text, text, text, text, text, text, text, text, text, text, text
) to authenticated;

-- Data API grants explícitos para proyectos Supabase nuevos.
grant select, insert, update on public.organizations to authenticated;
grant select, insert, update on public.organization_members to authenticated;
grant select, insert, update on public.branches to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.audit_logs to authenticated;

grant usage, select on sequence public.audit_logs_id_seq to authenticated;

commit;
