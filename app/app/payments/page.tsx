import { Ban } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { cancelPaymentAction } from "./actions";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { supabase, organizationId, role } = await requireActiveOrganization();
  const canCancel = ["OWNER", "ADMIN", "MANAGER"].includes(role);
  const { data: payments } = await supabase
    .from("payments")
    .select("id,payment_number,paid_at,amount,payment_method,reference,status,customers(name)")
    .eq("organization_id", organizationId)
    .order("paid_at", { ascending: false })
    .limit(100);

  const total = payments?.filter((p)=>p.status==="CONFIRMED").reduce((s,p)=>s+Number(p.amount),0) ?? 0;

  return <div className="p-4 md:p-8">
    <div className="mb-6"><p className="text-sm text-neutral-500">Historial financiero</p><h1 className="text-2xl font-semibold">Cobros</h1><p className="mt-1 text-sm text-neutral-600">Pagos recibidos por ventas y deudas; las anulaciones revierten saldo y caja.</p></div>
    {params.canceled ? <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Cobro anulado correctamente.</div> : null}
    {params.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo anular el cobro: {String(params.error)}</div> : null}
    <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm md:max-w-sm"><div className="text-sm text-neutral-500">Total confirmado mostrado</div><div className="mt-2 text-2xl font-semibold">{total.toLocaleString("es-PY")}</div></div>
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-neutral-600"><tr><th className="px-4 py-3">N°</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Medio</th><th className="px-4 py-3">Referencia</th><th className="px-4 py-3">Monto</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y">{payments?.length ? payments.map((p)=>{ const customer=p.customers as unknown as {name:string}|null; return <tr key={p.id} className="hover:bg-neutral-50"><td className="px-4 py-3 font-mono">{p.payment_number}</td><td className="px-4 py-3">{new Date(p.paid_at).toLocaleString("es-PY")}</td><td className="px-4 py-3">{customer?.name || "—"}</td><td className="px-4 py-3">{p.payment_method}</td><td className="px-4 py-3">{p.reference || "—"}</td><td className="px-4 py-3 font-medium">{Number(p.amount).toLocaleString("es-PY")}</td><td className={`px-4 py-3 ${p.status === "CANCELED" ? "text-red-700" : ""}`}>{p.status}</td><td className="px-4 py-3 text-right">{canCancel && p.status === "CONFIRMED" ? <details className="relative inline-block text-left"><summary className="flex cursor-pointer list-none items-center gap-1 font-medium text-red-700"><Ban className="h-4 w-4" /> Anular</summary><form action={cancelPaymentAction} className="mt-2 w-64 rounded-lg border bg-white p-3 shadow-lg"><input type="hidden" name="payment_id" value={p.id} /><textarea name="reason" required placeholder="Motivo" className="mb-2 w-full rounded-lg border px-3 py-2 text-sm" /><button className="w-full rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white">Confirmar</button></form></details> : null}</td></tr>;}) : <tr><td colSpan={8} className="px-4 py-10 text-center text-neutral-500">Todavía no hay cobros.</td></tr>}</tbody></table></div></div>
  </div>;
}
