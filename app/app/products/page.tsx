import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { createProductAction } from "./actions";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  let query = supabase
    .from("products")
    .select("id, code, sku, barcode, name, item_type, unit, purchase_price, sale_price, track_stock, min_stock, status, created_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");

  if (q) query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`);

  const [{ data: products }, { data: categories }, { data: suppliers }] = await Promise.all([
    query,
    supabase.from("product_categories").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("suppliers").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
  ]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-neutral-500">Catálogo comercial</p>
          <h1 className="text-2xl font-semibold">Productos y servicios</h1>
          <p className="mt-1 text-sm text-neutral-600">Código interno, SKU y código de barras por empresa.</p>
        </div>
        <details className="group rounded-xl border bg-white p-3 shadow-sm md:w-[520px]">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium"><Plus className="h-4 w-4" /> Agregar producto</summary>
          <form action={createProductAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <select name="item_type" className="rounded-lg border px-3 py-2 text-sm"><option value="PRODUCT">Producto</option><option value="SERVICE">Servicio</option></select>
            <input name="code" required placeholder="Código interno *" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="sku" placeholder="SKU" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="barcode" placeholder="Código de barras" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="name" required placeholder="Nombre *" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            <textarea name="description" placeholder="Descripción" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            <select name="category_id" className="rounded-lg border px-3 py-2 text-sm"><option value="">Sin categoría</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select name="supplier_id" className="rounded-lg border px-3 py-2 text-sm"><option value="">Sin proveedor</option>{suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <input name="unit" defaultValue="UN" placeholder="Unidad" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="purchase_price" type="number" min="0" step="0.01" placeholder="Costo" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="sale_price" type="number" min="0" step="0.01" placeholder="Precio de venta" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="tax_rate" type="number" min="0" max="100" step="0.01" defaultValue="0" placeholder="IVA %" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="min_stock" type="number" min="0" step="0.001" placeholder="Stock mínimo" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="opening_stock" type="number" step="0.001" placeholder="Stock inicial" className="rounded-lg border px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input name="track_stock" type="checkbox" defaultChecked /> Controlar stock</label>
            <textarea name="notes" placeholder="Notas" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white md:col-span-2">Guardar producto</button>
          </form>
        </details>
      </div>

      {params.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo guardar. Verificá campos y códigos duplicados.</div> : null}

      <form className="mb-4 flex max-w-xl gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" /><input name="q" defaultValue={q} placeholder="Buscar por nombre, código, SKU o barra" className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm" /></div>
        <button className="rounded-lg border bg-white px-4 text-sm">Buscar</button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600"><tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">SKU / Barra</th><th className="px-4 py-3">Costo</th><th className="px-4 py-3">Venta</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3"></th></tr></thead>
            <tbody className="divide-y">
              {products?.length ? products.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50"><td className="px-4 py-3 font-mono font-medium">{p.code}</td><td className="px-4 py-3"><div className="font-medium">{p.name}</div><div className="text-xs text-neutral-500">{p.unit}{p.track_stock ? ` · mínimo ${p.min_stock}` : " · sin stock"}</div></td><td className="px-4 py-3"><div>{p.sku || "—"}</div><div className="text-xs text-neutral-500">{p.barcode || "—"}</div></td><td className="px-4 py-3">{Number(p.purchase_price).toLocaleString("es-PY")}</td><td className="px-4 py-3 font-medium">{Number(p.sale_price).toLocaleString("es-PY")}</td><td className="px-4 py-3">{p.item_type === "SERVICE" ? "Servicio" : "Producto"}</td><td className="px-4 py-3">{p.status}</td><td className="px-4 py-3 text-right"><Link href={`/app/products/${p.id}`} className="font-medium underline underline-offset-4">Ver / editar</Link></td></tr>
              )) : <tr><td colSpan={8} className="px-4 py-10 text-center text-neutral-500">Todavía no hay productos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
