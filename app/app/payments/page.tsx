import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export default async function PaymentsPage() {
  const { supabase, organizationId } = await requireActiveOrganization();
  const { data: payments } = await supabase
    .from("payments")
    .select("id,payment_number,paid_at,amount,payment_method,reference,status,customers(name)")
    .eq("organization_id", organizationId)
    .order("paid_at", { ascending: false })
    .limit(100);

  const total = payments?.filter((p)=>p.status==="CONFIRMED").reduce((s,p)=>s+Number(p.amount),0) ?? 0;

  return <div className="p-4 md:p-8">
    <div className="mb-6"><p className="text-sm text-neutral-500">Historial financiero</p><h1 className="text-2xl font-semibold">Cobros</h1><p className="mt-1 text-sm text-neutral-600">Pagos recibidos por ventas y deudas.</p></div>
    <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm md:max-w-sm"><div className="text-sm text-neutral-500">Total mostrado</div><div className="mt-2 text-2xl font-semibold">{total.toLocaleString("es-PY")}</div></div>
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-neutral-600"><tr><th className="px-4 py-3">N°</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Medio</th><th className="px-4 py-3">Referencia</th><th className="px-4 py-3">Monto</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y">{payments?.length ? payments.map((p)=>{ const customer=p.customers as unknown as {name:string}|null; return <tr key={p.id}><td className="px-4 py-3 font-mono">{p.payment_number}</td><td className="px-4 py-3">{new Date(p.paid_at).toLocaleString("es-PY")}</td><td className="px-4 py-3">{customer?.name || "—"}</td><td className="px-4 py-3">{p.payment_method}</td><td className="px-4 py-3">{p.reference || "—"}</td><td className="px-4 py-3 font-medium">{Number(p.amount).toLocaleString("es-PY")}</td><td className="px-4 py-3">{p.status}</td></tr>;}) : <tr><td colSpan={7} className="px-4 py-10 text-center text-neutral-500">Todavía no hay cobros.</td></tr>}</tbody></table></div></div>
  </div>;
}
