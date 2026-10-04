import Link from "next/link";
import { ArrowLeft, Barcode, Boxes, ImagePlus, PackagePlus, Save, Tag, Truck } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { createProductAction } from "../actions";

export default async function NewProductPage() {
  const { supabase, organizationId } = await requireActiveOrganization();
  const [{ data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("product_categories").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
    supabase.from("suppliers").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
  ]);

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1450px]">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/app/products" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-5 w-5" /></Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Nuevo producto</h1>
              <p className="mt-1 text-sm text-slate-500">Cargá la información comercial, códigos y stock inicial.</p>
            </div>
          </div>
        </div>

        <form action={createProductAction} className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-5">
            <section className="liago-card p-5 md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><PackagePlus className="h-5 w-5" /></div>
                <div><h2 className="font-extrabold text-slate-950">Información básica</h2><p className="text-sm text-slate-500">Lo esencial para identificar y vender el producto.</p></div>
              </div>

              <div className="mb-5 grid min-h-40 place-items-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-6 text-center">
                <div><ImagePlus className="mx-auto h-8 w-8 text-blue-600" /><div className="mt-3 font-bold text-slate-800">Imagen del producto</div><div className="mt-1 text-sm text-slate-500">La carga de imágenes quedará habilitada cuando conectemos Storage.</div></div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Nombre del producto *</span><input name="name" required placeholder="Ej.: Camiseta deportiva azul" className="liago-input" /></label>
                <label><span className="mb-2 block text-sm font-bold text-slate-700">Tipo *</span><select name="item_type" className="liago-input"><option value="PRODUCT">Producto</option><option value="SERVICE">Servicio</option></select></label>
                <label><span className="mb-2 block text-sm font-bold text-slate-700">Unidad</span><select name="unit" defaultValue="UN" className="liago-input"><option value="UN">Unidad (Und)</option><option value="KG">Kilogramo (Kg)</option><option value="G">Gramo (g)</option><option value="L">Litro (L)</option><option value="ML">Mililitro (ml)</option><option value="M">Metro (m)</option><option value="M2">Metro²</option><option value="CAJA">Caja</option><option value="PACK">Pack</option></select></label>
                <label><span className="mb-2 block text-sm font-bold text-slate-700">Precio de venta *</span><input name="sale_price" type="number" min="0" step="1" required placeholder="0" className="liago-input" /></label>
                <label><span className="mb-2 block text-sm font-bold text-slate-700">Costo</span><input name="purchase_price" type="number" min="0" step="1" placeholder="0" className="liago-input" /></label>
              </div>
            </section>

            <section className="liago-card p-5 md:p-6">
              <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Boxes className="h-5 w-5" /></div><div><h2 className="font-extrabold text-slate-950">Inventario</h2><p className="text-sm text-slate-500">Stock inicial y alerta de unidades bajas.</p></div></div>
              <div className="grid gap-4 md:grid-cols-2">
                <label><span className="mb-2 block text-sm font-bold text-slate-700">Stock inicial</span><input name="opening_stock" type="number" step="0.001" defaultValue="0" className="liago-input" /></label>
                <label><span className="mb-2 block text-sm font-bold text-slate-700">Stock mínimo</span><input name="min_stock" type="number" min="0" step="0.001" defaultValue="0" className="liago-input" /></label>
                <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><input name="track_stock" type="checkbox" defaultChecked className="h-4 w-4" /><div><div className="font-bold text-slate-800">Controlar stock</div><div className="text-xs text-slate-500">LiaGo actualizará existencias con ventas, compras y ajustes.</div></div></label>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="liago-card p-5 md:p-6">
              <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Barcode className="h-5 w-5" /></div><div><h2 className="font-extrabold text-slate-950">Códigos</h2><p className="text-sm text-slate-500">Buscá después por cualquiera de ellos.</p></div></div>
              <div className="space-y-4">
                <label><span className="mb-2 block text-sm font-bold text-slate-700">Código interno *</span><input name="code" required placeholder="Ej.: PROD-001" className="liago-input font-mono" /></label>
                <label><span className="mb-2 block text-sm font-bold text-slate-700">SKU</span><input name="sku" placeholder="Ej.: CAM-AZ-M" className="liago-input font-mono" /></label>
                <label><span className="mb-2 block text-sm font-bold text-slate-700">Código de barras</span><div className="relative"><Barcode className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input name="barcode" placeholder="Escaneá o escribí el código" className="liago-input pl-11 font-mono" /></div></label>
              </div>
            </section>

            <section className="liago-card p-5 md:p-6">
              <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Tag className="h-5 w-5" /></div><div><h2 className="font-extrabold text-slate-950">Clasificación</h2><p className="text-sm text-slate-500">Categoría, proveedor e impuesto.</p></div></div>
              <div className="space-y-4">
                <label><span className="mb-2 block text-sm font-bold text-slate-700">Categoría</span><select name="category_id" className="liago-input"><option value="">Sin categoría</option>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label><span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><Truck className="h-4 w-4" /> Proveedor</span><select name="supplier_id" className="liago-input"><option value="">Sin proveedor</option>{suppliers?.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
                <label><span className="mb-2 block text-sm font-bold text-slate-700">Impuesto</span><select name="tax_rate" defaultValue="0" className="liago-input"><option value="0">Exento / 0%</option><option value="5">IVA 5%</option><option value="10">IVA 10%</option></select></label>
              </div>
            </section>

            <section className="liago-card p-5 md:p-6">
              <h2 className="font-extrabold text-slate-950">Descripción y notas</h2>
              <label className="mt-4 block"><span className="mb-2 block text-sm font-bold text-slate-700">Descripción</span><textarea name="description" placeholder="Descripción visible y características del producto" className="liago-input" /></label>
              <label className="mt-4 block"><span className="mb-2 block text-sm font-bold text-slate-700">Notas internas</span><textarea name="notes" placeholder="Información interna opcional" className="liago-input" /></label>
            </section>

            <div className="flex justify-end gap-2">
              <Link href="/app/products" className="liago-btn-secondary">Cancelar</Link>
              <button className="liago-btn-primary" type="submit"><Save className="h-4 w-4" /> Crear producto</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
