import { NewSaleForm } from "@/components/sales/new-sale-form";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const params = await searchParams;

  const [{ data: products }, { data: customers }, { data: branches }, { data: sales }] = await Promise.all([
    supabase.from("products").select("id,code,name,sale_price,tax_rate,unit").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("customers").select("id,name,customer_code").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("branches").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("is_main", { ascending: false }),
    supabase.from("sales").select("id,sale_number,sale_type,status,payment_status,sold_at,total,amount_paid,balance_due,customers(name)").eq("organization_id", organizationId).order("sold_at", { ascending: false }).limit(30),
  ]);

  return <div className="p-4 md:p-8">
    <div className="mb-6"><p className="text-sm text-neutral-500">Operación comercial</p><h1 className="text-2xl font-semibold">Ventas</h1><p className="mt-1 text-sm text-neutral-600">Contado, pago parcial o crédito; el saldo genera deuda y cuenta corriente automáticamente.</p></div>
    {params.created ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Venta confirmada correctamente.</div> : null}
    {params.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo confirmar la venta: {String(params.error)}</div> : null}
    <details className="mb-6 rounded-xl border bg-white p-4 shadow-sm"><summary className="cursor-pointer list-none font-medium">Nueva venta</summary><div className="mt-5"><NewSaleForm products={(products ?? []) as any} customers={(customers ?? []) as any} branches={(branches ?? []) as any} /></div></details>
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-neutral-600"><tr><th className="px-4 py-3">N°</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Cobrado</th><th className="px-4 py-3">Saldo</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y">{sales?.length ? sales.map((sale) => { const customer = sale.customers as unknown as { name:string } | null; return <tr key={sale.id}><td className="px-4 py-3 font-mono">{sale.sale_number}</td><td className="px-4 py-3">{new Date(sale.sold_at).toLocaleString("es-PY")}</td><td className="px-4 py-3">{customer?.name || "Consumidor final"}</td><td className="px-4 py-3">{sale.sale_type}</td><td className="px-4 py-3 font-medium">{Number(sale.total).toLocaleString("es-PY")}</td><td className="px-4 py-3">{Number(sale.amount_paid).toLocaleString("es-PY")}</td><td className="px-4 py-3">{Number(sale.balance_due).toLocaleString("es-PY")}</td><td className="px-4 py-3">{sale.payment_status}</td></tr>; }) : <tr><td colSpan={8} className="px-4 py-10 text-center text-neutral-500">Todavía no hay ventas.</td></tr>}</tbody></table></div></div>
  </div>;
}
