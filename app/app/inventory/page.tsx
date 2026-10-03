import { AlertTriangle, Boxes } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export default async function InventoryPage() {
  const { supabase, organizationId } = await requireActiveOrganization();
  const { data: rows } = await supabase
    .from("inventory_balances")
    .select("quantity,updated_at, products(id,code,name,unit,min_stock,status), branches(id,name)")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  const lowStock = rows?.filter((row) => {
    const product = row.products as unknown as { min_stock: number } | null;
    return product && Number(row.quantity) <= Number(product.min_stock);
  }) ?? [];

  return <div className="p-4 md:p-8">
    <div className="mb-6"><p className="text-sm text-neutral-500">Existencias por sucursal</p><h1 className="text-2xl font-semibold">Inventario</h1><p className="mt-1 text-sm text-neutral-600">El stock se calcula desde movimientos; no se edita directamente.</p></div>
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-sm text-neutral-500"><Boxes className="h-4 w-4" /> Posiciones de stock</div><div className="mt-2 text-2xl font-semibold">{rows?.length ?? 0}</div></div>
      <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-sm text-neutral-500"><AlertTriangle className="h-4 w-4" /> Stock bajo</div><div className="mt-2 text-2xl font-semibold">{lowStock.length}</div></div>
    </div>
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-neutral-600"><tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Sucursal</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Mínimo</th><th className="px-4 py-3">Situación</th></tr></thead><tbody className="divide-y">
      {rows?.length ? rows.map((row, index) => { const p = row.products as unknown as { id:string; code:string; name:string; unit:string; min_stock:number } | null; const b = row.branches as unknown as { id:string; name:string } | null; const low = p ? Number(row.quantity) <= Number(p.min_stock) : false; return <tr key={`${p?.id}-${b?.id}-${index}`}><td className="px-4 py-3 font-mono">{p?.code || "—"}</td><td className="px-4 py-3 font-medium">{p?.name || "—"}</td><td className="px-4 py-3">{b?.name || "—"}</td><td className="px-4 py-3 font-semibold">{Number(row.quantity).toLocaleString("es-PY")} {p?.unit || ""}</td><td className="px-4 py-3">{Number(p?.min_stock || 0).toLocaleString("es-PY")}</td><td className={`px-4 py-3 ${low ? "text-amber-700" : "text-emerald-700"}`}>{low ? "Reponer" : "Normal"}</td></tr>; }) : <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Todavía no hay movimientos de inventario.</td></tr>}
    </tbody></table></div></div>
  </div>;
}
