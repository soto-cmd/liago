import Link from "next/link";
import { Barcode, Package, Plus, Search, Tag, Wrench } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  let query = supabase
    .from("products")
    .select("id,code,sku,barcode,name,unit,purchase_price,sale_price,track_stock,min_stock,status,created_at")
    .eq("organization_id", organizationId)
    .eq("item_type", "PRODUCT")
    .is("deleted_at", null)
    .order("name");

  if (q) query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`);
  const { data: products } = await query;

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700"><Package className="h-4 w-4" /> Productos</div><h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Catálogo de productos</h1><p className="mt-2 text-sm text-slate-500">Administrá códigos, precios, unidades e inventario de artículos físicos.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/app/services" className="liago-btn-secondary"><Wrench className="h-4 w-4" /> Ver servicios</Link><Link href="/app/products/categories" className="liago-btn-secondary"><Tag className="h-4 w-4" /> Categorías</Link><Link href="/app/products/new" className="liago-btn-primary"><Plus className="h-4 w-4" /> Nuevo producto</Link></div>
        </div>

        {params.error ? <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">No se pudo guardar. Revisá los datos o verificá que el código no esté repetido.</div> : null}

        <form className="liago-card mb-5 flex gap-2 p-4"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={q} placeholder="Buscar por nombre, código, SKU o código de barras" className="liago-input pl-11" /></div><button className="liago-btn-secondary"><Search className="h-4 w-4" /> Buscar</button></form>

        <div className="liago-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><div className="font-bold text-slate-950">Productos actuales</div><div className="mt-1 text-xs text-slate-500">{products?.length ?? 0} registros visibles</div></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Producto</th><th className="px-5 py-4">Código</th><th className="px-5 py-4">SKU / Barra</th><th className="px-5 py-4">Costo</th><th className="px-5 py-4">Venta</th><th className="px-5 py-4">Stock</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4"></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {products?.length ? products.map((product) => <tr key={product.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Package className="h-5 w-5" /></div><div><div className="font-bold text-slate-900">{product.name}</div><div className="mt-0.5 text-xs text-slate-500">Producto · {product.unit}</div></div></div></td>
                <td className="px-5 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-700">{product.code}</span></td>
                <td className="px-5 py-4"><div>{product.sku || "—"}</div><div className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Barcode className="h-3.5 w-3.5" /> {product.barcode || "Sin código"}</div></td>
                <td className="px-5 py-4 text-slate-600">Gs. {Number(product.purchase_price).toLocaleString("es-PY")}</td><td className="px-5 py-4 font-bold text-slate-950">Gs. {Number(product.sale_price).toLocaleString("es-PY")}</td>
                <td className="px-5 py-4 text-slate-600">{product.track_stock ? `Mín. ${Number(product.min_stock).toLocaleString("es-PY")}` : "No controla"}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{product.status === "ACTIVE" ? "Activo" : "Inactivo"}</span></td>
                <td className="px-5 py-4 text-right"><Link href={`/app/products/${product.id}`} className="font-bold text-blue-700">Editar</Link></td>
              </tr>) : <tr><td colSpan={8} className="px-5 py-16 text-center"><Package className="mx-auto h-10 w-10 text-slate-300" /><div className="mt-3 font-bold text-slate-700">Todavía no hay productos</div><Link href="/app/products/new" className="liago-btn-primary mt-5"><Plus className="h-4 w-4" /> Nuevo producto</Link></td></tr>}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  );
}
