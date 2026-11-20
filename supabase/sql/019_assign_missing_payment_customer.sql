-- Vincular clientes omitidos a recibos históricos de contado sin modificar importes ni movimientos.
-- Aplicar antes de habilitar la interfaz de corrección.
create or replace function public.assign_missing_payment_customer(
 p_organization_id uuid,p_payment_id uuid,p_customer_id uuid
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_payment public.payments%rowtype;v_sale public.sales%rowtype;
begin
 if auth.uid() is null or not exists (
  select 1 from public.organization_members m where m.organization_id=p_organization_id
   and m.user_id=auth.uid() and m.status='ACTIVE' and m.deleted_at is null
   and m.role in ('OWNER','ADMIN','MANAGER')
 ) then raise exception 'Sin permisos'; end if;
 if not exists (select 1 from public.customers c where c.id=p_customer_id
  and c.organization_id=p_organization_id and c.status='ACTIVE' and c.deleted_at is null)
 then raise exception 'Cliente no válido'; end if;
 select * into v_payment from public.payments p where p.id=p_payment_id
  and p.organization_id=p_organization_id for update;
 if not found or v_payment.customer_id is not null or v_payment.status<>'CONFIRMED'
  or v_payment.sale_id is null then raise exception 'El recibo no admite corrección'; end if;
 select * into v_sale from public.sales s where s.id=v_payment.sale_id
  and s.organization_id=p_organization_id for update;
 if not found or v_sale.customer_id is not null or v_sale.sale_type<>'CASH'
  or v_sale.status<>'CONFIRMED' or v_sale.payment_status<>'PAID'
  or v_sale.balance_due<>0 or v_sale.amount_paid<>v_sale.total
  or v_payment.amount<>v_sale.total then raise exception 'La venta no admite corrección'; end if;
 if exists(select 1 from public.payments p where p.sale_id=v_sale.id and p.id<>v_payment.id)
  or exists(select 1 from public.payment_allocations a where a.payment_id=v_payment.id)
  or exists(select 1 from public.debts d where d.sale_id=v_sale.id)
  or exists(select 1 from public.customer_account_entries e
     where e.organization_id=p_organization_id and e.reference_id in (v_payment.id,v_sale.id))
 then raise exception 'Existen movimientos relacionados; se requiere revisión contable'; end if;
 update public.sales set customer_id=p_customer_id where id=v_sale.id and organization_id=p_organization_id;
 update public.payments set customer_id=p_customer_id where id=v_payment.id and organization_id=p_organization_id;
 insert into public.audit_logs(organization_id,actor_user_id,action,module,record_id,old_data,new_data)
 values(p_organization_id,auth.uid(),'UPDATE','PAYMENTS',p_payment_id::text,
 jsonb_build_object('customer_id',null,'sale_id',v_sale.id,'sale_customer_id',null),
 jsonb_build_object('customer_id',p_customer_id,'sale_id',v_sale.id,'sale_customer_id',p_customer_id,'reason','Asociación de cliente omitido; sin cambios financieros'));
 return p_payment_id;
end $$;
revoke all on function public.assign_missing_payment_customer(uuid,uuid,uuid) from public,anon;
grant execute on function public.assign_missing_payment_customer(uuid,uuid,uuid) to authenticated;
