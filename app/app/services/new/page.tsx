import Link from "next/link";
import { ArrowLeft, Save, Wrench } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { createServiceAction } from "../actions";

export default async function NewServicePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const params = await searchParams;
  const { data: categories } = await supabase.from("product_categories").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name");

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/app/services" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white"><ArrowLeft className="h-5 w-5" /></Link>
          <div><div className="flex items-center gap-2 text-sm font-bold text-violet-700"><Wrench className="h-4 w-4" /> Servicios</div><h1 className="text-3xl font-extrabold text-slate-950">Nuevo servicio</h1><p className="mt-1 text-sm text-slate-500">Configurá solo los datos que aplican a un servicio.</p></div>
        </div>
        {params.error ? <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">No se pudo guardar el servicio. Revisá los datos.</div> : null}

        <form action={createServiceAction} className="space-y-5">
          <section className="liago-card p-5 md:p-6">
            <h2 className="font-extrabold text-slate-950">Información comercial</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Nombre del servicio *</span><input name="name" required className="liago-input" placeholder="Ej.: Sesión fotográfica familiar" /></label>
              <label><span className="mb-2 block text-sm font-bold text-slate-700">Código interno</span><input name="code" className="liago-input font-mono" placeholder="Automático si lo dejás vacío" /></label>
              <label><span className="mb-2 block text-sm font-bold text-slate-700">Categoría</span><select name="category_id" className="liago-input"><option value="">Sin categoría</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label><span className="mb-2 block text-sm font-bold text-slate-700">Precio *</span><input name="sale_price" type="number" min="0" step="1" required className="liago-input" placeholder="0" /></label>
              <label><span className="mb-2 block text-sm font-bold text-slate-700">Costo estimado</span><input name="purchase_price" type="number" min="0" step="1" className="liago-input" placeholder="0" /></label>
              <label><span className="mb-2 block text-sm font-bold text-slate-700">Impuesto</span><select name="tax_rate" defaultValue="0" className="liago-input"><option value="0">Exento / 0%</option><option value="5">IVA 5%</option><option value="10">IVA 10%</option></select></label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><input name="service_price_variable" type="checkbox" className="h-4 w-4" /><div><div className="font-bold text-slate-800">Precio variable</div><div className="text-xs text-slate-500">El importe puede ajustarse al vender.</div></div></label>
            </div>
          </section>

          <section className="liago-card p-5 md:p-6">
            <h2 className="font-extrabold text-slate-950">Cómo se presta</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label><span className="mb-2 block text-sm font-bold text-slate-700">Duración estimada</span><div className="flex items-center gap-2"><input name="service_duration_minutes" type="number" min="1" defaultValue="60" className="liago-input" /><span className="text-sm text-slate-500">min</span></div></label>
              <label><span className="mb-2 block text-sm font-bold text-slate-700">Unidad de cobro</span><select name="service_billing_unit" defaultValue="SERVICE" className="liago-input"><option value="SERVICE">Por servicio</option><option value="HOUR">Por hora</option><option value="SESSION">Por sesión</option><option value="DAY">Por día</option><option value="VISIT">Por visita</option><option value="PROJECT">Por proyecto</option></select></label>
              <label><span className="mb-2 block text-sm font-bold text-slate-700">Responsable / profesional</span><input name="service_responsible_name" className="liago-input" placeholder="Opcional" /></label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><input name="service_requires_booking" type="checkbox" className="h-4 w-4" /><div><div className="font-bold text-slate-800">Requiere reserva</div><div className="text-xs text-slate-500">Marcá si normalmente necesita agenda previa.</div></div></label>
            </div>
          </section>

          <section className="liago-card p-5 md:p-6"><h2 className="font-extrabold text-slate-950">Descripción y notas</h2><textarea name="description" className="liago-input mt-4 min-h-28" placeholder="Descripción del servicio" /><textarea name="notes" className="liago-input mt-4 min-h-24" placeholder="Notas internas opcionales" /></section>

          <div className="sticky bottom-4 flex justify-end gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur"><Link href="/app/services" className="liago-btn-secondary">Cancelar</Link><button className="liago-btn-primary"><Save className="h-4 w-4" /> Guardar servicio</button></div>
        </form>
      </div>
    </div>
  );
}
