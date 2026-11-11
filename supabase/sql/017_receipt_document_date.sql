-- Override document date separately from actual accounting timestamp; keep financial movements untouched.
alter table public.payments add column if not exists document_date date;
drop function if exists public.update_payment_document(uuid,uuid,timestamptz,text,text);
create or replace function public.update_payment_document(
 p_organization_id uuid, p_payment_id uuid, p_document_date date,
 p_reference text default null, p_notes text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_payment public.payments%rowtype;
begin
 if auth.uid() is null or not exists (
  select 1 from public.organization_members where organization_id=p_organization_id
   and user_id=auth.uid() and status='ACTIVE' and deleted_at is null
   and role in ('OWNER','ADMIN','MANAGER')
 ) then raise exception 'Sin permisos'; end if;
 select * into v_payment from public.payments where id=p_payment_id and organization_id=p_organization_id for update;
 if not found then raise exception 'Recibo no encontrado'; end if;
 if v_payment.status<>'CONFIRMED' then raise exception 'Recibo anulado'; end if;
 if p_document_date is null or length(coalesce(p_reference,''))>250 or length(coalesce(p_notes,''))>2000
 then raise exception 'Datos inválidos'; end if;
 update public.payments set document_date=p_document_date,
  reference=nullif(trim(p_reference),''),notes=nullif(trim(p_notes),'')
 where id=p_payment_id and organization_id=p_organization_id;
 insert into public.audit_logs(organization_id,actor_user_id,action,module,record_id,old_data,new_data)
 values(p_organization_id,auth.uid(),'UPDATE','PAYMENTS',p_payment_id::text,
  jsonb_build_object('document_date',v_payment.document_date,'reference',v_payment.reference,'notes',v_payment.notes),
  jsonb_build_object('document_date',p_document_date,'reference',nullif(trim(p_reference),''),'notes',nullif(trim(p_notes),'')));
 return p_payment_id;
end $$;
revoke all on function public.update_payment_document(uuid,uuid,date,text,text) from public,anon;
grant execute on function public.update_payment_document(uuid,uuid,date,text,text) to authenticated;
