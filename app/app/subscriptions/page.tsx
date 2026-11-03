import Link from "next/link";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { saveManagedSubscriptionAction } from "./actions";
import { Cloud, CalendarDays, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

function money(amount: number | string | null | undefined) {
  return `Gs. ${Number(amount || 0).toLocaleString("es-PY")}`;
}
function localDue(day: number, year: number, month: number) {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${String(Math.min(day,last)).padStart(2,"0")}/${String(month).padStart(2,"0")}/${year}`;
}

type Params = { error?: string; saved?: string };

export default async function SubscriptionsPage({searchParams}:{searchParams: Promise<Params>}) {
  const params = await searchParams;
  const {supabase,organizationId,role} = await requireActiveOrganization();
  const canManage=["OWNER","ADMIN","MANAGER"].includes(role);
  const [{data: subscriptions,error},{data:customers}] = await Promise.all([
    supabase.from("managed_subscriptions")
      .select("id,customer_id,provider,plan_name,storage_gb,managed_email,monthly_price,monthly_cost,renewal_day,status,last_confirmed_period,last_confirmed_payment_date,next_unpaid_period,notes,customers(name,email)")
      .eq("organization_id",organizationId).order("renewal_day"),
    supabase.from("customers").select("id,name,email").eq("organization_id",organizationId)
      .eq("status","ACTIVE").is("deleted_at",null).order("name")
  ]);
  const today = new Date(new Date().toLocaleString("en-US",{timeZone:"America/Asuncion"}));
  const year=today.getFullYear(),month=today.getMonth()+1;
  const active=(subscriptions||[]).filter(s=>s.status==="ACTIVE");
  const outstanding=active.filter(s=>s.next_unpaid_period);
  return <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="flex items-center gap-2 text-sm font-bold text-blue-700"><Cloud className="h-4 w-4"/> Servicios recurrentes y suscripciones</p><h1 className="mt-1 text-2xl font-extrabold text-slate-950">Gestión de suscripciones</h1><p className="mt-1 text-sm text-slate-600">Seguimiento de renovaciones y pagos por cliente. Por ahora, el formulario disponible registra cuentas Google One; otros servicios se incorporarán posteriormente. Sin contraseñas ni cargos automáticos.</p></div>
      <Link className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50" href="/app/customers">Ver clientes</Link>
    </div>
    {params.saved ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Suscripción guardada. No se registraron cobros ni facturas.</p> : null}
    {params.error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">No se pudo guardar. Verificá el cliente, el correo, los períodos YYYY-MM y los importes. No se modificaron pagos.</p> : null}
    {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">No se pudo cargar el listado de suscripciones.</p> : null}
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Suscripciones activas</p><p className="mt-1 text-2xl font-bold">{active.length}</p></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Importe mensual contratado</p><p className="mt-1 text-2xl font-bold">{money(active.reduce((sum,s)=>sum+Number(s.monthly_price),0))}</p><p className="mt-1 text-xs text-slate-500">No equivale a ingreso cobrado.</p></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Suscripciones con períodos pendientes declarados</p><p className="mt-1 text-2xl font-bold">{outstanding.length}</p><p className="mt-1 text-xs text-slate-500">Verificar con cuentas por cobrar.</p></div>
    </div>
    <p className="text-xs text-slate-600">El período pagado y el pendiente se consignan según tus registros. Modificarlos aquí no crea un pago ni cancela una deuda: solo actualiza el seguimiento de la suscripción.</p>
    <div className="grid gap-4 lg:grid-cols-2">
      {(subscriptions||[]).map(s=>{
        const customer = s.customers as unknown as {name:string;email:string|null}|null;
        const nextDue=localDue(s.renewal_day,year,month);
        return <section key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div><h2 className="text-lg font-bold text-slate-950">{customer?.name||"Cliente"}</h2><p className="text-sm text-slate-600">{s.plan_name}</p><p className="mt-1 break-all text-xs text-slate-500">{s.managed_email}</p></div>
            <span className={s.status==="ACTIVE"?"rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700":"rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600"}>{s.status==="ACTIVE"?"Activo":s.status==="PAUSED"?"Pausado":"Cancelado"}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-500">Mensualidad</p><p className="font-bold">{money(s.monthly_price)}</p></div>
            <div><p className="text-xs text-slate-500">Día habitual de renovación</p><p className="font-bold">{s.renewal_day} de cada mes</p></div>
            <div><p className="text-xs text-slate-500">Último período pagado confirmado</p><p className="font-semibold">{s.last_confirmed_period||"Sin confirmar"}</p></div>
            <div><p className="text-xs text-slate-500">Período pendiente registrado</p><p className={s.next_unpaid_period?"font-bold text-amber-700":"font-semibold text-emerald-700"}>{s.next_unpaid_period||"Ninguno declarado"}</p></div>
          </div>
          {s.notes ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{s.notes}</p> : null}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600"><span className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/> Fecha de este mes: {nextDue}</span><Link className="font-bold text-blue-700 underline" href={`/app/customers/${s.customer_id}`}>Ficha del cliente</Link></div>
          {canManage ? <details className="mt-4 border-t pt-3"><summary className="cursor-pointer text-sm font-semibold text-blue-700">Editar suscripción</summary>
            <form action={saveManagedSubscriptionAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="id" type="hidden" value={s.id}/>
              <input name="customer_id" type="hidden" value={s.customer_id}/>
              <label className="text-xs font-semibold">Plan<input className="mt-1 w-full rounded-lg border p-2 text-sm" name="plan_name" required defaultValue={s.plan_name}/></label>
              <label className="text-xs font-semibold">GB (capacidad)<input type="number" min="1" className="mt-1 w-full rounded-lg border p-2 text-sm" name="storage_gb" defaultValue={s.storage_gb??""}/></label>
              <label className="text-xs font-semibold sm:col-span-2">Correo administrado<input type="email" className="mt-1 w-full rounded-lg border p-2 text-sm" name="managed_email" required defaultValue={s.managed_email}/></label>
              <label className="text-xs font-semibold">Mensualidad Gs.<input type="number" min="0" step="1" name="monthly_price" required className="mt-1 w-full rounded-lg border p-2 text-sm" defaultValue={s.monthly_price}/></label>
              <label className="text-xs font-semibold">Costo Gs. (opcional)<input type="number" min="0" step="1" name="monthly_cost" className="mt-1 w-full rounded-lg border p-2 text-sm" defaultValue={s.monthly_cost??""}/></label>
              <label className="text-xs font-semibold">Día de renovación<input type="number" min="1" max="31" name="renewal_day" required className="mt-1 w-full rounded-lg border p-2 text-sm" defaultValue={s.renewal_day}/></label>
              <label className="text-xs font-semibold">Estado<select name="status" className="mt-1 w-full rounded-lg border bg-white p-2 text-sm" defaultValue={s.status}><option value="ACTIVE">Activo</option><option value="PAUSED">Pausado</option><option value="CANCELED">Cancelado</option></select></label>
              <label className="text-xs font-semibold">Último período pagado (AAAA-MM)<input name="last_confirmed_period" placeholder="2026-11" className="mt-1 w-full rounded-lg border p-2 text-sm" defaultValue={s.last_confirmed_period??""}/></label>
              <label className="text-xs font-semibold">Fecha de pago confirmada<input type="date" name="last_confirmed_payment_date" className="mt-1 w-full rounded-lg border p-2 text-sm" defaultValue={s.last_confirmed_payment_date??""}/></label>
              <label className="text-xs font-semibold sm:col-span-2">Período pendiente (AAAA-MM, opcional)<input name="next_unpaid_period" placeholder="2026-12" className="mt-1 w-full rounded-lg border p-2 text-sm" defaultValue={s.next_unpaid_period??""}/></label>
              <label className="text-xs font-semibold sm:col-span-2">Notas<textarea name="notes" maxLength={1500} rows={4} className="mt-1 w-full rounded-lg border p-2 text-sm" defaultValue={s.notes??""}/></label>
              <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white sm:col-span-2">Guardar suscripción</button>
            </form>
          </details> : null}
        </section>
      })}
    </div>
    {canManage ? <details className="rounded-xl border bg-white p-4">
      <summary className="cursor-pointer text-sm font-bold text-blue-700">Agregar cuenta Google One</summary>
      <p className="mt-2 text-xs text-slate-600">Primero creá la ficha del cliente si todavía no existe. No se almacenan contraseñas ni se genera ningún cargo.</p>
      <form action={saveManagedSubscriptionAction} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold sm:col-span-2">Cliente<select name="customer_id" required className="mt-1 w-full rounded-lg border bg-white p-2 text-sm"><option value="">Elegir cliente</option>{customers?.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
        <label className="text-xs font-semibold">Plan<input name="plan_name" required placeholder="Google One 100 GB" className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
        <label className="text-xs font-semibold">Capacidad GB<input name="storage_gb" type="number" min="1" className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
        <label className="text-xs font-semibold sm:col-span-2">Correo administrado<input name="managed_email" type="email" required className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
        <label className="text-xs font-semibold">Mensualidad Gs.<input name="monthly_price" type="number" min="0" required className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
        <label className="text-xs font-semibold">Costo Gs. (opcional)<input name="monthly_cost" type="number" min="0" className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
        <label className="text-xs font-semibold">Día renovación<input name="renewal_day" type="number" min="1" max="31" required className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
        <label className="text-xs font-semibold">Estado<select name="status" className="mt-1 w-full rounded-lg border bg-white p-2 text-sm"><option value="ACTIVE">Activo</option><option value="PAUSED">Pausado</option><option value="CANCELED">Cancelado</option></select></label>
        <label className="text-xs font-semibold">Último período pagado (AAAA-MM)<input name="last_confirmed_period" placeholder="2026-11" className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
        <label className="text-xs font-semibold">Fecha pago confirmado<input name="last_confirmed_payment_date" type="date" className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
        <label className="text-xs font-semibold sm:col-span-2">Período pendiente (AAAA-MM)<input name="next_unpaid_period" className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
        <label className="text-xs font-semibold sm:col-span-2">Notas<textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
        <button type="submit" className="rounded-lg bg-blue-700 p-3 font-bold text-white sm:col-span-2">Guardar cuenta Google One</button>
      </form>
    </details> : null}
    <p className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4"/> Este módulo registra y controla administrativamente cuentas Google One. No contrata servicios ni procesa pagos bancarios automáticamente.</p>
  </div>;
}
