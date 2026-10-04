import { AlertTriangle, Boxes, SlidersHorizontal } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { adjustInventoryAction } from "./actions";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { supabase, organizationId, role } = await requireActiveOrganization();
  const canAdjust = ["OWNER", "ADMIN", "MANAGER"].includes(role);

  const [{ data: rows }, { data: products }, { data: branches }, { data: movements }] = await Promise.all([
    supabase
      .from("inventory_balances")
      .select("quantity,updated_at, products(id,code,name,unit,min_stock,status), branches(id,name)")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    supabase.from("products").select("id,code,name").eq("organization_id", organizationId).eq("item_type", "PRODUCT").eq("track_stock", true).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("branches").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("is_main", { ascending: false }),
    supabase.from("inventory_movements").select("id,movement_type,quantity,notes,created_at,products(code,name),branches(name)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(30),
  ]);

  const lowStock = rows?.filter((row) => {
    const product = row.products as unknown as { min_stock: number } | null;
    return product && Number(row.quantity) <= Number(product.min_stock);
  }) ?? [];

  return <div className="p-4 md:p-8">
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><p className="text-sm text-neutral-500">Existencias por sucursal</p><h1 className="text-2xl font-semibold">Inventario</h1><p className="mt-1 text-sm text-neutral-600">El stock se calcula desde movimientos; los ajustes quedan registrados.</p></div>
      {canAdjust ? <details className="rounded-xl border bg-white p-3 shadow-sm md:w-[520px]"><summary className="flex cursor-pointer list-none items-center gap-2 font-medium"><SlidersHorizontal className="h-4 w-4" /> Ajustar stock</summary><form action={adjustInventoryAction} className="mt-4 grid gap-3 md:grid-cols-2"><select name="branch_id" required className="rounded-lg border px-3 py-2 text-sm"><option value="">Sucursal *</option>{branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select><select name="product_id" required className="rounded-lg border px-3 py-2 text-sm"><option value="">Producto *</option>{products?.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select><select name="direction" className="rounded-lg border px-3 py-2 text-sm"><option value="IN">Entrada / sumar</option><option value="OUT">Salida / restar</option></select><input name="quantity" required type="number" min="0.001" step="0.001" placeholder="Cantidad *" className="rounded-lg border px-3 py-2 text-sm" /><textarea name="notes" required placeholder="Motivo del ajuste *" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" /><button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white md:col-span-2">Registrar ajuste</button></form></details> : null}
    </div>

    {params.adjusted ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Ajuste registrado correctamente.</div> : null}
    {params.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo registrar el ajuste: {String(params.error)}</div> : null}

    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-sm text-neutral-500"><Boxes className="h-4 w-4" /> Posiciones de stock</div><div className="mt-2 text-2xl font-semibold">{rows?.length ?? 0}</div></div>
      <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-sm text-neutral-500"><AlertTriangle className="h-4 w-4" /> Stock bajo</div><div className="mt-2 text-2xl font-semibold">{lowStock.length}</div></div>
      <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="text-sm text-neutral-500">Movimientos mostrados</div><div className="mt-2 text-2xl font-semibold">{movements?.length ?? 0}</div></div>
    </div>

    <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-neutral-600"><tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Sucursal</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Mínimo</th><th className="px-4 py-3">Situación</th></tr></thead><tbody className="divide-y">
      {rows?.length ? rows.map((row, index) => { const p = row.products as unknown as { id:string; code:string; name:string; unit:string; min_stock:number } | null; const b = row.branches as unknown as { id:string; name:string } | null; const low = p ? Number(row.quantity) <= Number(p.min_stock) : false; return <tr key={`${p?.id}-${b?.id}-${index}`}><td className="px-4 py-3 font-mono">{p?.code || "—"}</td><td className="px-4 py-3 font-medium">{p?.name || "—"}</td><td className="px-4 py-3">{b?.name || "—"}</td><td className="px-4 py-3 font-semibold">{Number(row.quantity).toLocaleString("es-PY")} {p?.unit || ""}</td><td className="px-4 py-3">{Number(p?.min_stock || 0).toLocaleString("es-PY")}</td><td className={`px-4 py-3 ${low ? "text-amber-700" : "text-emerald-700"}`}>{low ? "Reponer" : "Normal"}</td></tr>; }) : <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Todavía no hay movimientos de inventario.</td></tr>}
    </tbody></table></div></div>

    <div className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold">Últimos movimientos</h2><div className="space-y-3">{movements?.length ? movements.map((m) => { const p = m.products as unknown as { code:string; name:string } | null; const b = m.branches as unknown as { name:string } | null; return <div key={m.id} className="grid gap-1 border-b pb-3 text-sm last:border-0 last:pb-0 md:grid-cols-[1fr_auto]"><div><div className="font-medium">{p?.code || ""} · {p?.name || "Producto"}</div><div className="text-xs text-neutral-500">{m.movement_type} · {b?.name || "Sucursal"} · {new Date(m.created_at).toLocaleString("es-PY")}{m.notes ? ` · ${m.notes}` : ""}</div></div><div className={Number(m.quantity) >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>{Number(m.quantity) > 0 ? "+" : ""}{Number(m.quantity).toLocaleString("es-PY")}</div></div>; }) : <p className="text-sm text-neutral-500">Sin movimientos.</p>}</div></div>
  </div>;
}
