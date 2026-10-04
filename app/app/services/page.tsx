import Link from "next/link";
import { CalendarClock, Plus, Search, Wrench } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

const unitLabels: Record<string, string> = {
  SERVICE: "Por servicio",
  HOUR: "Por hora",
  SESSION: "Por sesión",
  DAY: "Por día",
  VISIT: "Por visita",
  PROJECT: "Por proyecto",
};

export default async function ServicesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  let query = supabase
    .from("products")
    .select("id,code,name,description,sale_price,purchase_price,tax_rate,status,service_duration_minutes,service_billing_unit,service_responsible_name,service_price_variable,service_requires_booking,created_at")
    .eq("organization_id", organizationId)
    .eq("item_type", "SERVICE")
    .is("deleted_at", null)
    .order("name");

  if (q) query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,description.ilike.%${q}%`);
  const { data: services } = await query;

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-700"><Wrench className="h-4 w-4" /> Servicios</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Catálogo de servicios</h1>
            <p className="mt-2 text-sm text-slate-500">Administrá precios, duración, forma de cobro, responsable y reservas.</p>
          </div>
          <Link href="/app/services/new" className="liago-btn-primary"><Plus className="h-4 w-4" /> Nuevo servicio</Link>
        </div>

        {params.error ? <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">No se pudo completar la operación.</div> : null}

        <form className="liago-card mb-5 flex gap-2 p-4">
          <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={q} placeholder="Buscar servicio por nombre, código o descripción" className="liago-input pl-11" /></div>
          <button className="liago-btn-secondary"><Search className="h-4 w-4" /> Buscar</button>
        </form>

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {services?.length ? services.map((service) => (
            <Link key={service.id} href={`/app/services/${service.id}`} className="liago-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div><div className="text-xs font-bold uppercase tracking-wide text-violet-700">{service.code}</div><h2 className="mt-1 text-lg font-extrabold text-slate-950">{service.name}</h2></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${service.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{service.status === "ACTIVE" ? "Activo" : "Inactivo"}</span>
              </div>
              <p className="mt-3 line-clamp-2 min-h-10 text-sm text-slate-500">{service.description || "Sin descripción"}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                <div><div className="text-xs text-slate-500">Precio</div><div className="mt-1 font-extrabold text-slate-950">Gs. {Number(service.sale_price).toLocaleString("es-PY")}{service.service_price_variable ? " +" : ""}</div></div>
                <div><div className="text-xs text-slate-500">Cobro</div><div className="mt-1 font-bold text-slate-800">{unitLabels[service.service_billing_unit || "SERVICE"] || "Por servicio"}</div></div>
                <div><div className="text-xs text-slate-500">Duración</div><div className="mt-1 flex items-center gap-1 font-bold text-slate-800"><CalendarClock className="h-3.5 w-3.5" /> {service.service_duration_minutes ? `${service.service_duration_minutes} min` : "No definida"}</div></div>
                <div><div className="text-xs text-slate-500">Reserva</div><div className="mt-1 font-bold text-slate-800">{service.service_requires_booking ? "Requerida" : "No requerida"}</div></div>
              </div>
              {service.service_responsible_name ? <div className="mt-4 text-xs text-slate-500">Responsable: <span className="font-bold text-slate-700">{service.service_responsible_name}</span></div> : null}
            </Link>
          )) : <div className="liago-card col-span-full p-12 text-center"><Wrench className="mx-auto h-9 w-9 text-slate-300" /><div className="mt-3 font-bold text-slate-700">Todavía no hay servicios</div><div className="mt-1 text-sm text-slate-400">Creá tu primer servicio para ofrecerlo en ventas.</div><Link href="/app/services/new" className="liago-btn-primary mt-5"><Plus className="h-4 w-4" /> Nuevo servicio</Link></div>}
        </div>
      </div>
    </div>
  );
}
