import { Plus, Search, Users } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";
import { createAdminCustomerAction } from "../actions";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requirePlatformAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const organizationId = typeof params.organization_id === "string" ? params.organization_id : "";

  const { data: companies } = await supabase
    .from("organizations")
    .select("id,name,status")
    .is("deleted_at", null)
    .order("name");

  let query = supabase
    .from("customers")
    .select("id,organization_id,customer_code,customer_type,name,tax_id,phone,whatsapp,email,city,credit_limit,status,created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (organizationId) query = query.eq("organization_id", organizationId);
  if (q) query = query.or(`name.ilike.%${q}%,customer_code.ilike.%${q}%,tax_id.ilike.%${q}%,phone.ilike.%${q}%,whatsapp.ilike.%${q}%`);

  const { data: customers } = await query;
  const companyName = new Map((companies ?? []).map((company) => [company.id, company.name]));

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><Users className="h-3.5 w-3.5" /> Vista global</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Clientes</h1>
            <p className="mt-2 text-sm text-slate-500">Clientes comerciales de todas las empresas, siempre separados por organización.</p>
          </div>

          <details className="liago-card p-4 lg:w-[600px]">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-slate-900"><Plus className="h-4 w-4" /> Agregar cliente</summary>
            <form action={createAdminCustomerAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <select name="organization_id" defaultValue={organizationId} required className="liago-input md:col-span-2"><option value="">Seleccionar empresa *</option>{companies?.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>
              <select name="customer_type" className="liago-input"><option value="PERSON">Persona</option><option value="COMPANY">Empresa</option></select>
              <input name="customer_code" placeholder="Código de cliente" className="liago-input" />
              <input name="name" required placeholder="Nombre / Razón social *" className="liago-input md:col-span-2" />
              <input name="tax_id" placeholder="Documento / RUC" className="liago-input" />
              <input name="phone" placeholder="Teléfono" className="liago-input" />
              <input name="whatsapp" placeholder="WhatsApp" className="liago-input" />
              <input name="email" type="email" placeholder="Email" className="liago-input" />
              <input name="city" placeholder="Ciudad" className="liago-input" />
              <input name="credit_limit" type="number" min="0" step="0.01" placeholder="Límite de crédito" className="liago-input" />
              <input name="address" placeholder="Dirección" className="liago-input md:col-span-2" />
              <textarea name="notes" placeholder="Notas" className="liago-input min-h-24 md:col-span-2" />
              <button className="liago-btn-primary md:col-span-2">Guardar cliente</button>
            </form>
          </details>
        </div>

        {params.created ? <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Cliente guardado correctamente.</div> : null}
        {params.error ? <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">No se pudo guardar el cliente.</div> : null}

        <form className="mb-5 grid gap-2 md:grid-cols-[280px_1fr_auto]">
          <select name="organization_id" defaultValue={organizationId} className="liago-input"><option value="">Todas las empresas</option>{companies?.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input name="q" defaultValue={q} placeholder="Buscar cliente, código, RUC o teléfono" className="liago-input pl-9" /></div>
          <button className="liago-btn-secondary">Filtrar</button>
        </form>

        <div className="liago-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Empresa</th><th className="px-5 py-4">Código</th><th className="px-5 py-4">Cliente</th><th className="px-5 py-4">Contacto</th><th className="px-5 py-4">Crédito</th><th className="px-5 py-4">Estado</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {customers?.length ? customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-700">{companyName.get(customer.organization_id) || "—"}</td>
                    <td className="px-5 py-4 font-mono text-xs">{customer.customer_code || "—"}</td>
                    <td className="px-5 py-4"><div className="font-bold text-slate-900">{customer.name}</div><div className="mt-1 text-xs text-slate-500">{customer.customer_type === "COMPANY" ? "Empresa" : "Persona"}{customer.tax_id ? ` · ${customer.tax_id}` : ""}{customer.city ? ` · ${customer.city}` : ""}</div></td>
                    <td className="px-5 py-4"><div>{customer.whatsapp || customer.phone || "—"}</div><div className="mt-1 text-xs text-slate-500">{customer.email || ""}</div></td>
                    <td className="px-5 py-4 font-semibold">Gs. {Math.round(Number(customer.credit_limit)).toLocaleString("es-PY")}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{customer.status}</span></td>
                  </tr>
                )) : <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">No hay clientes con estos filtros.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
