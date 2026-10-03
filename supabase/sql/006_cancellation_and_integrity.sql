-- LiaGo Fase 2E: anulaciones e integridad operativa
begin;

-- Evita saldos de stock negativos por error de aplicación del movimiento.
create or replace function private.apply_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_quantity numeric(18,3);
begin
  insert into public.inventory_balances(organization_id, branch_id, product_id, quantity, updated_at)
  values(new.organization_id, new.branch_id, new.product_id, new.quantity, now())
  on conflict (organization_id, branch_id, product_id)
  do update set quantity = public.inventory_balances.quantity + excluded.quantity,
                updated_at = now()
  returning quantity into v_new_quantity;

  if v_new_quantity < 0 then
    raise exception 'Insufficient stock for product %', new.product_id;
  end if;

  return new;
end;
$$;

-- Anula una venta confirmada y revierte stock, deuda, cuenta corriente y caja.
create or replace function public.cancel_sale(p_sale_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_sale public.sales%rowtype;
  v_item record;
  v_debt record;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Sale not found'; end if;

  if not private.has_org_role(v_sale.organization_id, array['OWNER','ADMIN','MANAGER']) then
    raise exception 'Not allowed';
  end if;

  if v_sale.status = 'CANCELED' then return; end if;
  if v_sale.status <> 'CONFIRMED' then raise exception 'Only confirmed sales can be canceled'; end if;

  -- No permitir anular si hubo cobros posteriores asignados a la deuda.
  select d.* into v_debt from public.debts d where d.sale_id = v_sale.id limit 1;
  if found and exists (
    select 1 from public.payment_allocations pa
    join public.payments p on p.id = pa.payment_id
    where pa.debt_id = v_debt.id and p.status = 'CONFIRMED'
  ) then
    raise exception 'Sale has confirmed payments; cancel those payments first';
  end if;

  for v_item in
    select si.*, pr.track_stock
    from public.sale_items si
    left join public.products pr on pr.id = si.product_id
    where si.sale_id = v_sale.id
  loop
    if v_item.product_id is not null and coalesce(v_item.track_stock, false) then
      insert into public.inventory_movements(
        organization_id, branch_id, product_id, movement_type, quantity,
        unit_cost, reference_type, reference_id, notes, created_by
      ) values (
        v_sale.organization_id, v_sale.branch_id, v_item.product_id,
        'RETURN_IN', v_item.quantity, null, 'SALE_CANCEL', v_sale.id,
        coalesce(p_reason, 'Anulación de venta'), v_user
      );
    end if;
  end loop;

  if found then
    update public.debts
       set status = 'CANCELED', balance = 0, updated_at = now(),
           notes = concat_ws(E'\n', notes, 'Anulada con venta: ', coalesce(p_reason,''))
     where sale_id = v_sale.id and status <> 'CANCELED';
  end if;

  insert into public.customer_account_entries(
    organization_id, customer_id, entry_type, description,
    debit, credit, reference_type, reference_id, created_by
  )
  select v_sale.organization_id, v_sale.customer_id, 'CREDIT',
         'Anulación venta #' || v_sale.sale_number,
         0, v_sale.balance_due, 'SALE_CANCEL', v_sale.id, v_user
  where v_sale.customer_id is not null and v_sale.balance_due > 0;

  insert into public.cash_movements(
    organization_id, branch_id, movement_type, direction, amount,
    description, payment_method, reference_type, reference_id, created_by
  )
  select v_sale.organization_id, v_sale.branch_id, 'ADJUSTMENT', 'OUT', v_sale.amount_paid,
         'Anulación venta #' || v_sale.sale_number,
         v_sale.payment_method, 'SALE_CANCEL', v_sale.id, v_user
  where v_sale.amount_paid > 0 and v_sale.branch_id is not null;

  update public.sales
     set status = 'CANCELED', payment_status = 'CANCELED', canceled_at = now(),
         canceled_by = v_user, notes = concat_ws(E'\n', notes, coalesce(p_reason,''))
   where id = v_sale.id;
end;
$$;

revoke all on function public.cancel_sale(uuid,text) from public;
grant execute on function public.cancel_sale(uuid,text) to authenticated;

-- Anula un cobro y restaura el saldo de las deudas afectadas.
create or replace function public.cancel_payment(p_payment_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_alloc record;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if not private.has_org_role(v_payment.organization_id, array['OWNER','ADMIN','MANAGER']) then
    raise exception 'Not allowed';
  end if;
  if v_payment.status = 'CANCELED' then return; end if;

  for v_alloc in select * from public.payment_allocations where payment_id = v_payment.id loop
    update public.debts
       set balance = least(original_amount, balance + v_alloc.amount),
           status = case
             when balance + v_alloc.amount >= original_amount then 'PENDING'
             else 'PARTIAL'
           end,
           updated_at = now()
     where id = v_alloc.debt_id;
  end loop;

  if v_payment.customer_id is not null then
    insert into public.customer_account_entries(
      organization_id, customer_id, entry_type, description,
      debit, credit, reference_type, reference_id, created_by
    ) values (
      v_payment.organization_id, v_payment.customer_id, 'DEBIT',
      'Anulación cobro #' || v_payment.payment_number,
      v_payment.amount, 0, 'PAYMENT_CANCEL', v_payment.id, v_user
    );
  end if;

  if v_payment.branch_id is not null then
    insert into public.cash_movements(
      organization_id, branch_id, movement_type, direction, amount,
      description, payment_method, reference_type, reference_id, created_by
    ) values (
      v_payment.organization_id, v_payment.branch_id, 'ADJUSTMENT', 'OUT',
      v_payment.amount, 'Anulación cobro #' || v_payment.payment_number,
      v_payment.payment_method, 'PAYMENT_CANCEL', v_payment.id, v_user
    );
  end if;

  update public.payments
     set status = 'CANCELED', notes = concat_ws(E'\n', notes, coalesce(p_reason,''))
   where id = v_payment.id;
end;
$$;

revoke all on function public.cancel_payment(uuid,text) from public;
grant execute on function public.cancel_payment(uuid,text) to authenticated;

commit;
