import { NewPurchaseForm } from "@/components/purchases/new-purchase-form";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const params = await searchParams;
  const [{ data:products },{ data:suppliers },{ data:branches },{ data:purchases }] = await Promise.all([
    supabase.from("products").select("id,code,name,purchase_price,tax_rate,unit").eq("organization_id",organizationId).eq("status","ACTIVE").eq("item_type","PRODUCT").is("deleted_at",null).order("name"),
    supabase.from("suppliers").select("id,name").eq("organization_id",organizationId).eq("status","ACTIVE").is("deleted_at",null).order("name"),
    supabase.from("branches").select("id,name").eq("organization_id",organizationId).eq("status","ACTIVE").is("deleted_at",null).order("is_main",{ascending:false}),
    supabase.from("purchases").select("id,purchase_number,purchased_at,purchase_type,status,total,amount_paid,balance_due,suppliers(name)").eq("organization_id",organizationId).order("purchased_at",{ascending:false}).limit(50),
  ]);
  return <div className="p-4 md:p-8">
    <div className="mb-6"><p className="text-sm text-neutral-500">Abastecimiento</p><h1 className="text-2xl font-semibold">Compras</h1><p className="mt-1 text-sm text-neutral-600">Recibir mercadería actualiza costo e inventario automáticamente.</p></div>
    {params.created ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Compra recibida correctamente.</div>:null}
    {params.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo recibir la compra: {String(params.error)}</div>:null}
    <details className="mb-6 rounded-xl border bg-white p-4 shadow-sm"><summary className="cursor-pointer list-none font-medium">Nueva compra</summary><div className="mt-5"><NewPurchaseForm products={(products??[]) as any} suppliers={(suppliers??[]) as any} branches={(branches??[]) as any}/></div></details>
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-neutral-600"><tr><th className="px-4 py-3">N°</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Proveedor</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Pagado</th><th className="px-4 py-3">Saldo</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y">{purchases?.length?purchases.map((p)=>{const s=p.suppliers as unknown as {name:string}|null;return <tr key={p.id}><td className="px-4 py-3 font-mono">{p.purchase_number}</td><td className="px-4 py-3">{new Date(p.purchased_at).toLocaleString("es-PY")}</td><td className="px-4 py-3">{s?.name||"—"}</td><td className="px-4 py-3">{p.purchase_type}</td><td className="px-4 py-3 font-medium">{Number(p.total).toLocaleString("es-PY")}</td><td className="px-4 py-3">{Number(p.amount_paid).toLocaleString("es-PY")}</td><td className="px-4 py-3">{Number(p.balance_due).toLocaleString("es-PY")}</td><td className="px-4 py-3">{p.status}</td></tr>}):<tr><td colSpan={8} className="px-4 py-10 text-center text-neutral-500">Todavía no hay compras.</td></tr>}</tbody></table></div></div>
  </div>;
}
