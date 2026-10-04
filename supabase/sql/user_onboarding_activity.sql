-- LiaGo: seguimiento de usuarios, invitaciones y onboarding de primer uso.
-- Aplicado en Supabase como migrations user_onboarding_activity + touch_user_activity.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_activity (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  visit_count bigint not null default 1,
  last_path text,
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_step integer not null default 1 check (current_step between 1 and 6),
  completed boolean not null default false,
  skipped boolean not null default false,
  completed_at timestamptz,
  skipped_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.invitation_redemptions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitation_links(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  redeemed_at timestamptz not null default now(),
  unique(invitation_id,user_id)
);
create index if not exists invitation_redemptions_user_idx on public.invitation_redemptions(user_id, redeemed_at desc);

alter table public.user_profiles enable row level security;
alter table public.user_activity enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.invitation_redemptions enable row level security;

create policy user_profiles_self_select on public.user_profiles for select to authenticated using (user_id = auth.uid());
create policy user_profiles_self_write on public.user_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_activity_self_select on public.user_activity for select to authenticated using (user_id = auth.uid());
create policy user_activity_self_write on public.user_activity for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy onboarding_progress_self_select on public.onboarding_progress for select to authenticated using (user_id = auth.uid());
create policy onboarding_progress_self_write on public.onboarding_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy invitation_redemptions_self_select on public.invitation_redemptions for select to authenticated using (user_id = auth.uid());
create policy user_profiles_admin_select on public.user_profiles for select to authenticated using (exists (select 1 from public.platform_admins p where p.user_id = auth.uid() and p.status='ACTIVE'));
create policy user_activity_admin_select on public.user_activity for select to authenticated using (exists (select 1 from public.platform_admins p where p.user_id = auth.uid() and p.status='ACTIVE'));
create policy onboarding_progress_admin_select on public.onboarding_progress for select to authenticated using (exists (select 1 from public.platform_admins p where p.user_id = auth.uid() and p.status='ACTIVE'));
create policy invitation_redemptions_admin_select on public.invitation_redemptions for select to authenticated using (exists (select 1 from public.platform_admins p where p.user_id = auth.uid() and p.status='ACTIVE'));

grant select,insert,update on public.user_profiles, public.user_activity, public.onboarding_progress to authenticated;
grant select on public.invitation_redemptions to authenticated;

create or replace function public.redeem_invitation(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitation_links%rowtype;
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select * into v_inv from public.invitation_links where token=p_token for update;
  if not found then raise exception 'invalid invitation'; end if;
  if v_inv.revoked_at is not null then raise exception 'invitation revoked'; end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then raise exception 'invitation expired'; end if;
  if v_inv.used_count >= v_inv.max_uses then raise exception 'invitation exhausted'; end if;

  insert into public.invitation_redemptions(invitation_id,user_id,organization_id)
  values(v_inv.id,v_user,v_inv.organization_id)
  on conflict(invitation_id,user_id) do nothing;
  if found then update public.invitation_links set used_count=used_count+1, updated_at=now() where id=v_inv.id; end if;

  if v_inv.invitation_type='ORGANIZATION' and v_inv.organization_id is not null then
    insert into public.organization_members(organization_id,user_id,role,status,invited_by)
    values(v_inv.organization_id,v_user,coalesce(v_inv.role,'VIEWER'),'ACTIVE',v_inv.created_by)
    on conflict(organization_id,user_id) do nothing;
  end if;

  insert into public.onboarding_progress(user_id) values(v_user) on conflict(user_id) do nothing;
  insert into public.user_activity(user_id) values(v_user)
    on conflict(user_id) do update set last_seen_at=now(),visit_count=public.user_activity.visit_count+1,updated_at=now();

  return jsonb_build_object('type',v_inv.invitation_type,'organization_id',v_inv.organization_id,'plan',v_inv.plan,'trial_days',v_inv.trial_days);
end;
$$;
revoke all on function public.redeem_invitation(uuid) from public;
grant execute on function public.redeem_invitation(uuid) to authenticated;

create or replace function public.touch_user_activity(p_path text default null)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then return; end if;
  insert into public.user_activity(user_id,last_path) values(v_user,p_path)
  on conflict(user_id) do update set last_seen_at=now(),visit_count=public.user_activity.visit_count+1,last_path=coalesce(excluded.last_path,public.user_activity.last_path),updated_at=now();
  insert into public.onboarding_progress(user_id) values(v_user) on conflict(user_id) do nothing;
end;
$$;
revoke all on function public.touch_user_activity(text) from public;
grant execute on function public.touch_user_activity(text) to authenticated;

create or replace function public.platform_user_activity()
returns table(user_id uuid,email text,full_name text,last_seen_at timestamptz,visit_count bigint,onboarding_completed boolean,onboarding_skipped boolean,invitation_label text,invitation_type text,redeemed_at timestamptz)
language sql
security definer
set search_path=''
as $$
  select u.id,u.email,p.full_name,a.last_seen_at,coalesce(a.visit_count,0),coalesce(o.completed,false),coalesce(o.skipped,false),i.label,i.invitation_type,r.redeemed_at
  from auth.users u
  left join public.user_profiles p on p.user_id=u.id
  left join public.user_activity a on a.user_id=u.id
  left join public.onboarding_progress o on o.user_id=u.id
  left join lateral (select rr.invitation_id,rr.redeemed_at from public.invitation_redemptions rr where rr.user_id=u.id order by rr.redeemed_at desc limit 1) r on true
  left join public.invitation_links i on i.id=r.invitation_id
  where exists (select 1 from public.platform_admins pa where pa.user_id=auth.uid() and pa.status='ACTIVE')
  order by a.last_seen_at desc nulls last,u.created_at desc;
$$;
revoke all on function public.platform_user_activity() from public;
grant execute on function public.platform_user_activity() to authenticated;
