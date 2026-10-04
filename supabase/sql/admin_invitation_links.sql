-- Applied to LiaGo Supabase as migration admin_invitation_links.
-- Unique invitation links for trials and organization membership.

create table if not exists public.invitation_links (
  id uuid primary key default gen_random_uuid(),
  token uuid not null default gen_random_uuid() unique,
  invitation_type text not null check (invitation_type in ('TRIAL','ORGANIZATION')),
  label text,
  email text,
  organization_id uuid references public.organizations(id) on delete cascade,
  role text check (role is null or role in ('OWNER','ADMIN','MANAGER','SELLER','CASHIER','VIEWER')),
  plan text not null default 'FREE' check (plan in ('FREE','BASIC','PRO','BUSINESS')),
  trial_days integer not null default 7 check (trial_days between 1 and 90),
  max_uses integer not null default 1 check (max_uses > 0 and max_uses <= 1000),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((invitation_type = 'TRIAL' and organization_id is null) or (invitation_type = 'ORGANIZATION' and organization_id is not null))
);

-- RLS: platform admins manage links. Public users only see sanitized invitation metadata through RPC.
