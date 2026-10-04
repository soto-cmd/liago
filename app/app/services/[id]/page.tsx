import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save, Wrench } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { setServiceStatusAction, updateServiceAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const messages = await searchParams;
  const { supabase, organizationId, role } = await requireActiveOrganization();
  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(role);
  const [{ data: service }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).eq("organization_id", organizationId).eq("item_type", "SERVICE").is("deleted_at", null).maybeSingle(),
    supabase.from("product_categories").select("id,name").eq("organization_id", organizationId).eq("status", "ACTIVE").is("deleted_at", null).order("name"),
  ]);
  if (!service) notFound();

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><Link href="/app/services" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-600"><ArrowLeft className="h-4 w-4" /> Volver a servicios</Link><div className="flex items-center gap-3"><Wrench className="h-6 w-6 text-violet-700" /><h1 className="text-3xl font-extrabold text-slate-950">{service.name}</h1></div><p className="mt-1 font-mono text-sm text-slate-500">{service.code}</p></div>
          {canManage ? <form action={setServiceStatusAction}><input type="hidden" name="service_id" value={service.id} /><input type="hidden" name="status" value={service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} /><button className="liago-btn-secondary">{service.status === "ACTIVE" ? "Desactivar" : "Activar"}</button></form> : null}
        </div>
        {messages.created ? <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Servicio creado correctamente.</div> : null}
        {messages.updated ? <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Cambios guardados.</div> : null}
        {messages.error ? <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">No se pudo completar la operación.</div> : null}

        <form action={updateServiceAction} className="space-y-5">
          <input type="hidden" name="service_id" value={service.id} />
          <section className="liago-card p-5 md:p-6"><h2 className="font-extrabold text-slate-950">Información comercial</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Nombre *</span><input name="name" defaultValue={service.name} required disabled={!canManage} className="liago-input" /></label>
            <label><span className="mb-2 block text-sm font-bold text-slate-700">Código</span><input name="code" defaultValue={service.code} disabled={!canManage} className="liago-input font-mono" /></label>
            <label><span className="mb-2 block text-sm font-bold text-slate-700">Categoría</span><select name="category_id" defaultValue={service.category_id ?? ""} disabled={!canManage} className="liago-input"><option value="">Sin categoría</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-bold text-slate-700">Precio</span><input name="sale_price" type="number" min="0" step="1" defaultValue={service.sale_price} disabled={!canManage} className="liago-input" /></label>
            <label><span className="mb-2 block text-sm font-bold text-slate-700">Costo estimado</span><input name="purchase_price" type="number" min="0" step="1" defaultValue={service.purchase_price} disabled={!canManage} className="liago-input" /></label>
            <label><span className="mb-2 block text-sm font-bold text-slate-700">Impuesto</span><select name="tax_rate" defaultValue={String(service.tax_rate)} disabled={!canManage} className="liago-input"><option value="0">Exento / 0%</option><option value="5">IVA 5%</option><option value="10">IVA 10%</option></select></label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><input name="service_price_variable" type="checkbox" defaultChecked={service.service_price_variable} disabled={!canManage} /><div><div className="font-bold text-slate-800">Precio variable</div><div className="text-xs text-slate-500">Puede modificarse al vender.</div></div></label>
          </div></section>

          <section className="liago-card p-5 md:p-6"><h2 className="font-extrabold text-slate-950">Prestación del servicio</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
            <label><span className="mb-2 block text-sm font-bold text-slate-700">Duración (min)</span><input name="service_duration_minutes" type="number" min="1" defaultValue={service.service_duration_minutes ?? 60} disabled={!canManage} className="liago-input" /></label>
            <label><span className="mb-2 block text-sm font-bold text-slate-700">Unidad de cobro</span><select name="service_billing_unit" defaultValue={service.service_billing_unit ?? "SERVICE"} disabled={!canManage} className="liago-input"><option value="SERVICE">Por servicio</option><option value="HOUR">Por hora</option><option value="SESSION">Por sesión</option><option value="DAY">Por día</option><option value="VISIT">Por visita</option><option value="PROJECT">Por proyecto</option></select></label>
            <label><span className="mb-2 block text-sm font-bold text-slate-700">Responsable / profesional</span><input name="service_responsible_name" defaultValue={service.service_responsible_name ?? ""} disabled={!canManage} className="liago-input" /></label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><input name="service_requires_booking" type="checkbox" defaultChecked={service.service_requires_booking} disabled={!canManage} /><div><div className="font-bold text-slate-800">Requiere reserva</div><div className="text-xs text-slate-500">Normalmente necesita agenda previa.</div></div></label>
          </div></section>

          <section className="liago-card p-5 md:p-6"><h2 className="font-extrabold text-slate-950">Descripción y notas</h2><textarea name="description" defaultValue={service.description ?? ""} disabled={!canManage} className="liago-input mt-4 min-h-28" /><textarea name="notes" defaultValue={service.notes ?? ""} disabled={!canManage} className="liago-input mt-4 min-h-24" /></section>
          {canManage ? <div className="sticky bottom-4 flex justify-end rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur"><button className="liago-btn-primary"><Save className="h-4 w-4" /> Guardar cambios</button></div> : null}
        </form>
      </div>
    </div>
  );
}
