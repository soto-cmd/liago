import Link from "next/link";
import { Clock3, ShoppingCart } from "lucide-react";
import { NewSaleForm } from "@/components/sales/new-sale-form";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

const errorMessages: Record<string, string> = {
  customer_required: "Seleccioná un cliente para una venta a crédito o con pago parcial.",
  cash_payment: "La venta al contado debe quedar pagada en su totalidad.",
  partial_payment: "El pago parcial debe ser mayor a cero y menor al total de la venta.",
  credit_payment: "Una venta a crédito no debe registrar un pago inicial.",
  credit_limit: "El cliente superó su límite de crédito.",
  branch: "Seleccioná una sucursal válida.",
  items: "Agregá al menos un producto o servicio con una cantidad válida.",
  save: "No se pudo guardar la venta. Revisá los datos e intentá nuevamente.",
};

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const params = await searchParams;

  const [{ data: products }, { data: customers }, { data: branches }, { data: sales }] = await Promise.all([
    supabase.from("products").select("id,code,name,sale_price,tax_rate,unit").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("customers").select("id,name,customer_code").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("branches").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("is_main", { ascending: false }),
    supabase.from("sales").select("id,sale_number,sale_type,status,payment_status,sold_at,total,amount_paid,balance_due,customers(name)").eq("organization_id", organizationId).order("sold_at", { ascending: false }).limit(30),
  ]);

  const errorKey = typeof params.error === "string" ? params.error : "";
  const errorMessage = errorKey ? (errorMessages[errorKey] || errorMessages.save) : null;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700"><ShoppingCart className="h-4 w-4" /> Operación comercial</div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">Nueva venta</h1>
            <p className="mt-1 text-sm text-slate-500">Cobrá rápido, registrá crédito y mantené la cuenta corriente actualizada.</p>
          </div>
          <div className="text-xs text-slate-400">Los últimos movimientos aparecen debajo.</div>
        </div>

        {params.created ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Venta confirmada correctamente.</div> : null}
        {errorMessage ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{errorMessage}</div> : null}

        <NewSaleForm products={(products ?? []) as any} customers={(customers ?? []) as any} branches={(branches ?? []) as any} />

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 md:px-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Clock3 className="h-4 w-4 text-slate-400" /> Ventas recientes</div>
              <div className="mt-0.5 text-xs text-slate-500">Últimas 30 operaciones registradas.</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">N°</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Cobrado</th><th className="px-4 py-3 text-right">Saldo</th><th className="px-4 py-3">Estado</th><th className="w-16" /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {sales?.length ? sales.map((sale) => {
                  const customer = sale.customers as unknown as { name:string } | null;
                  const stateLabel = sale.status === "CANCELED" ? "ANULADA" : sale.payment_status === "PAID" ? "PAGADA" : sale.payment_status === "PARTIAL" ? "PARCIAL" : "PENDIENTE";
                  const stateClass = sale.status === "CANCELED" ? "bg-red-50 text-red-700" : sale.payment_status === "PAID" ? "bg-emerald-50 text-emerald-700" : sale.payment_status === "PARTIAL" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700";
                  return <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{sale.sale_number}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(sale.sold_at).toLocaleString("es-PY")}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{customer?.name || "Consumidor final"}</td>
                    <td className="px-4 py-3 text-slate-600">{sale.sale_type === "CASH" ? "Contado" : sale.sale_type === "PARTIAL" ? "Pago parcial" : "Crédito"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">Gs. {Number(sale.total).toLocaleString("es-PY")}</td>
                    <td className="px-4 py-3 text-right text-slate-600">Gs. {Number(sale.amount_paid).toLocaleString("es-PY")}</td>
                    <td className="px-4 py-3 text-right text-slate-600">Gs. {Number(sale.balance_due).toLocaleString("es-PY")}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${stateClass}`}>{stateLabel}</span></td>
                    <td className="px-4 py-3 text-right"><Link href={`/app/sales/${sale.id}`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Ver</Link></td>
                  </tr>;
                }) : <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">Todavía no hay ventas registradas.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
