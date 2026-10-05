import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
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
  not_allowed: "No tenés permisos para realizar esta acción.",
  not_found: "No se encontró la venta.",
  cancel_first: "Primero debés anular la venta antes de eliminarla definitivamente.",
  confirmation_required: "Para eliminar definitivamente debés escribir ELIMINAR.",
  save: "No se pudo guardar la venta. Revisá los datos e intentá nuevamente.",
};

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const params = await searchParams;

  const [{ data: products }, { data: customers }, { data: branches }, { data: sales }] = await Promise.all([
    supabase.from("products").select("id,code,name,sale_price,tax_rate,unit").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("customers").select("id,name,customer_code").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("branches").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("is_main", { ascending: false }),
    supabase.from("sales").select("id,sale_number,sale_type,status,payment_status,sold_at,total,amount_paid,balance_due,customers(name)").eq("organization_id", organizationId).order("sold_at", { ascending: false }).limit(50),
  ]);

  const errorKey = typeof params.error === "string" ? params.error : "";
  const errorMessage = errorKey ? (errorMessages[errorKey] || errorMessages.save) : null;

  return <div className="p-4 md:p-8">
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="text-sm text-neutral-500">Operación comercial</p><h1 className="text-2xl font-semibold">Ventas</h1><p className="mt-1 text-sm text-neutral-600">Contado, pago parcial o crédito; el saldo genera deuda y cuenta corriente automáticamente.</p></div>
      <Link href="/app/sales/export" className="liago-btn-secondary w-fit"><FileSpreadsheet className="h-4 w-4" /> Exportar Excel</Link>
    </div>
    {params.created ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Venta confirmada correctamente.</div> : null}
    {params.deleted ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Venta eliminada definitivamente.</div> : null}
    {errorMessage ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div> : null}
    <details className="mb-6 rounded-xl border bg-white p-4 shadow-sm"><summary className="cursor-pointer list-none font-medium">Nueva venta</summary><div className="mt-5"><NewSaleForm products={(products ?? []) as any} customers={(customers ?? []) as any} branches={(branches ?? []) as any} /></div></details>
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-neutral-600"><tr><th className="px-4 py-3">N°</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Cobrado</th><th className="px-4 py-3">Saldo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y">{sales?.length ? sales.map((sale) => { const customer = sale.customers as unknown as { name:string } | null; return <tr key={sale.id} className="hover:bg-neutral-50"><td className="px-4 py-3 font-mono">{sale.sale_number}</td><td className="px-4 py-3">{new Date(sale.sold_at).toLocaleString("es-PY")}</td><td className="px-4 py-3">{customer?.name || "Consumidor final"}</td><td className="px-4 py-3">{sale.sale_type === "CASH" ? "Contado" : sale.sale_type === "PARTIAL" ? "Pago parcial" : "Crédito"}</td><td className="px-4 py-3 font-medium">Gs. {Number(sale.total).toLocaleString("es-PY")}</td><td className="px-4 py-3">Gs. {Number(sale.amount_paid).toLocaleString("es-PY")}</td><td className="px-4 py-3">Gs. {Number(sale.balance_due).toLocaleString("es-PY")}</td><td className="px-4 py-3"><span className={sale.status === "CANCELED" ? "text-red-700" : ""}>{sale.status === "CANCELED" ? "ANULADA" : sale.payment_status === "PAID" ? "PAGADA" : sale.payment_status === "PARTIAL" ? "PARCIAL" : "PENDIENTE"}</span></td><td className="px-4 py-3 text-right"><Link href={`/app/sales/${sale.id}`} className="font-medium underline underline-offset-4">Ver</Link></td></tr>; }) : <tr><td colSpan={9} className="px-4 py-10 text-center text-neutral-500">Todavía no hay ventas.</td></tr>}</tbody></table></div></div>
  </div>;
}
