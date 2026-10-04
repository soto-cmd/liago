-- LiaGo Fase 2G: ACL explícito de RPCs sensibles
begin;

revoke execute on function public.adjust_inventory(uuid,uuid,uuid,text,numeric,text) from anon;
revoke execute on function public.cancel_payment(uuid,text) from anon;
revoke execute on function public.cancel_sale(uuid,text) from anon;
revoke execute on function public.close_cash_session(uuid,uuid,numeric,text) from anon;
revoke execute on function public.create_sale(uuid,uuid,uuid,text,numeric,text,date,text,jsonb) from anon;
revoke execute on function public.open_cash_session(uuid,uuid,numeric,text) from anon;
revoke execute on function public.receive_purchase(uuid,uuid,uuid,text,numeric,date,text,text,jsonb) from anon;
revoke execute on function public.record_customer_payment(uuid,uuid,uuid,uuid,numeric,text,text,text) from anon;
revoke execute on function public.record_expense(uuid,uuid,text,text,numeric,text,uuid,text,text) from anon;

-- Solo usuarios autenticados pueden invocarlos desde el Data API.
grant execute on function public.adjust_inventory(uuid,uuid,uuid,text,numeric,text) to authenticated;
grant execute on function public.cancel_payment(uuid,text) to authenticated;
grant execute on function public.cancel_sale(uuid,text) to authenticated;
grant execute on function public.close_cash_session(uuid,uuid,numeric,text) to authenticated;
grant execute on function public.create_sale(uuid,uuid,uuid,text,numeric,text,date,text,jsonb) to authenticated;
grant execute on function public.open_cash_session(uuid,uuid,numeric,text) to authenticated;
grant execute on function public.receive_purchase(uuid,uuid,uuid,text,numeric,date,text,text,jsonb) to authenticated;
grant execute on function public.record_customer_payment(uuid,uuid,uuid,uuid,numeric,text,text,text) to authenticated;
grant execute on function public.record_expense(uuid,uuid,text,text,numeric,text,uuid,text,text) to authenticated;

commit;
