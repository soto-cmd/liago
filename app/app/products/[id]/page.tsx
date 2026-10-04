import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes, Pencil } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { setProductStatusAction, updateProductAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const messages = await searchParams;
  const { supabase, organizationId, role } = await requireActiveOrganization();
  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(role);

  const [{ data: product }, { data: categories }, { data: suppliers }, { data: balances }, { data: movements }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).eq("organization_id", organizationId).eq("item_type", "PRODUCT").is("deleted_at", null).maybeSingle(),
    supabase.from("product_categories").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("suppliers").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("inventory_balances").select("quantity,updated_at,branches(id,name)").eq("organization_id", organizationId).eq("product_id", id).order("updated_at", { ascending: false }),
    supabase.from("inventory_movements").select("id,movement_type,quantity,unit_cost,notes,created_at,branches(name)").eq("organization_id", organizationId).eq("product_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (!product) notFound();

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/app/products" className="mb-3 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950"><ArrowLeft className="h-4 w-4" /> Volver a productos</Link>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold">{product.name}</h1><span className="rounded-full border bg-white px-2.5 py-1 text-xs font-medium">{product.status}</span></div>
          <p className="mt-1 font-mono text-sm text-neutral-500">{product.code}{product.sku ? ` · SKU ${product.sku}` : ""}{product.barcode ? ` · ${product.barcode}` : ""}</p>
        </div>
        {canManage ? <form action={setProductStatusAction}><input type="hidden" name="product_id" value={product.id} /><input type="hidden" name="status" value={product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} /><button className="rounded-lg border bg-white px-4 py-2 text-sm font-medium">{product.status === "ACTIVE" ? "Desactivar" : "Activar"}</button></form> : null}
      </div>

      {messages.created ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Producto creado correctamente.</div> : null}
      {messages.updated ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Cambios guardados.</div> : null}
      {messages.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo completar la operación.</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Pencil className="h-4 w-4" /><h2 className="font-semibold">Datos del producto</h2></div>
          <form action={updateProductAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="product_id" value={product.id} />
            <input name="code" defaultValue={product.code} required disabled={!canManage} placeholder="Código interno" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="sku" defaultValue={product.sku ?? ""} disabled={!canManage} placeholder="SKU" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="barcode" defaultValue={product.barcode ?? ""} disabled={!canManage} placeholder="Código de barras" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="name" defaultValue={product.name} required disabled={!canManage} placeholder="Nombre" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            <textarea name="description" defaultValue={product.description ?? ""} disabled={!canManage} placeholder="Descripción" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            <select name="category_id" defaultValue={product.category_id ?? ""} disabled={!canManage} className="rounded-lg border px-3 py-2 text-sm"><option value="">Sin categoría</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select name="supplier_id" defaultValue={product.supplier_id ?? ""} disabled={!canManage} className="rounded-lg border px-3 py-2 text-sm"><option value="">Sin proveedor</option>{suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <input name="unit" defaultValue={product.unit} disabled={!canManage} className="rounded-lg border px-3 py-2 text-sm" />
            <input name="purchase_price" type="number" min="0" step="0.01" defaultValue={product.purchase_price} disabled={!canManage} placeholder="Costo" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="sale_price" type="number" min="0" step="0.01" defaultValue={product.sale_price} disabled={!canManage} placeholder="Precio venta" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="tax_rate" type="number" min="0" max="100" step="0.01" defaultValue={product.tax_rate} disabled={!canManage} placeholder="IVA %" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="min_stock" type="number" min="0" step="0.001" defaultValue={product.min_stock} disabled={!canManage} placeholder="Stock mínimo" className="rounded-lg border px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input name="track_stock" type="checkbox" defaultChecked={product.track_stock} disabled={!canManage} /> Controlar stock</label>
            <textarea name="notes" defaultValue={product.notes ?? ""} disabled={!canManage} placeholder="Notas" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            {canManage ? <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white md:col-span-2">Guardar cambios</button> : null}
          </form>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Boxes className="h-4 w-4" /><h2 className="font-semibold">Stock por sucursal</h2></div><div className="space-y-2">{balances?.length ? balances.map((row, index) => { const branch = row.branches as unknown as { name: string } | null; return <div key={index} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2"><span className="text-sm">{branch?.name || "Sucursal"}</span><span className="font-semibold">{Number(row.quantity).toLocaleString("es-PY")} {product.unit}</span></div>; }) : <p className="text-sm text-neutral-500">Sin movimientos de stock todavía.</p>}</div></div>
          <div className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold">Últimos movimientos</h2><div className="space-y-3">{movements?.length ? movements.map((m) => { const branch = m.branches as unknown as { name: string } | null; return <div key={m.id} className="border-b pb-3 text-sm last:border-0 last:pb-0"><div className="flex justify-between gap-3"><span className="font-medium">{m.movement_type}</span><span className={Number(m.quantity) >= 0 ? "text-emerald-700" : "text-red-700"}>{Number(m.quantity) > 0 ? "+" : ""}{Number(m.quantity).toLocaleString("es-PY")}</span></div><div className="mt-1 text-xs text-neutral-500">{branch?.name || ""} · {new Date(m.created_at).toLocaleString("es-PY")}{m.notes ? ` · ${m.notes}` : ""}</div></div>; }) : <p className="text-sm text-neutral-500">Sin movimientos.</p>}</div></div>
        </section>
      </div>
    </div>
  );
}
