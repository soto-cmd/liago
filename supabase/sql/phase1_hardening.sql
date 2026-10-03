-- LiaGo - Fase 1 hardening
-- Mantiene el repositorio alineado con la base de datos aplicada en Supabase.

alter table public.organization_members
add constraint organization_members_role_check
check (role in ('OWNER','ADMIN','MANAGER','SELLER','CASHIER','VIEWER'));

create index organization_members_invited_by_idx
on public.organization_members (invited_by)
where invited_by is not null;
