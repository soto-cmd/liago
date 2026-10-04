import { Building2, Plus, Search, UserRound, Users } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { createCustomerAction } from "./actions";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  let query = supabase
    .from("customers")
    .select("id,customer_code,customer_type,name,tax_id,phone,whatsapp,email,city,credit_limit,status,created_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");

  if (q) query = query.or(`name.ilike.%${q}%,customer_code.ilike.%${q}%,tax_id.ilike.%${q}%,phone.ilike.%${q}%,whatsapp.ilike.%${q}%`);
  const { data: customers } = await query;

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700"><Users className="h-4 w-4" /> Contactos</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Clientes</h1>
            <p className="mt-2 text-sm text-slate-500">Datos de contacto, crédito y cuenta corriente de cada cliente.</p>
          </div>
          <details className="liago-card w-full p-4 lg:max-w-xl">
            <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-slate-900"><span className="flex items-center gap-2"><Plus className="h-4 w-4 text-blue-600" /> Agregar cliente</span><span className="text-xs font-medium text-slate-400">Abrir formulario</span></summary>
            <form action={createCustomerAction} className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
              <label><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Tipo</span><select name="customer_type" className="liago-input"><option value="PERSON">Persona</option><option value="COMPANY">Empresa</option></select></label>
              <label><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Código</span><input name="customer_code" placeholder="CLI-001" className="liago-input font-mono" /></label>
              <label className="md:col-span-2"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Nombre / Razón social *</span><input name="name" required placeholder="Nombre del cliente" className="liago-input" /></label>
              <input name="tax_id" placeholder="Documento / RUC" className="liago-input" />
              <input name="whatsapp" placeholder="WhatsApp" className="liago-input" />
              <input name="phone" placeholder="Teléfono" className="liago-input" />
              <input name="email" type="email" placeholder="Email" className="liago-input" />
              <input name="city" placeholder="Ciudad" className="liago-input" />
              <input name="credit_limit" type="number" min="0" step="1" placeholder="Límite de crédito" className="liago-input" />
              <input name="address" placeholder="Dirección" className="liago-input md:col-span-2" />
              <textarea name="notes" placeholder="Notas internas" className="liago-input md:col-span-2" />
              <button className="liago-btn-primary md:col-span-2">Guardar cliente</button>
            </form>
          </details>
        </div>

        {params.created ? <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Cliente guardado correctamente.</div> : null}
        {params.error ? <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">No se pudo guardar el cliente.</div> : null}

        <div className="liago-card mb-5 p-4">
          <form className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={q} placeholder="Buscar por nombre, código, RUC o teléfono" className="liago-input pl-11" /></div>
            <button className="liago-btn-secondary"><Search className="h-4 w-4" /> Buscar</button>
          </form>
        </div>

        <div className="liago-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><div className="font-bold text-slate-950">Base de clientes</div><div className="mt-1 text-xs text-slate-500">{customers?.length ?? 0} registros visibles</div></div></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Cliente</th><th className="px-5 py-4">Código</th><th className="px-5 py-4">Documento</th><th className="px-5 py-4">Contacto</th><th className="px-5 py-4">Crédito</th><th className="px-5 py-4">Estado</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {customers?.length ? customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${customer.customer_type === "COMPANY" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}>{customer.customer_type === "COMPANY" ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</div><div><div className="font-bold text-slate-900">{customer.name}</div><div className="text-xs text-slate-500">{customer.customer_type === "COMPANY" ? "Empresa" : "Persona"}{customer.city ? ` · ${customer.city}` : ""}</div></div></div></td>
                    <td className="px-5 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-700">{customer.customer_code || "—"}</span></td>
                    <td className="px-5 py-4 text-slate-600">{customer.tax_id || "—"}</td>
                    <td className="px-5 py-4"><div className="font-medium text-slate-700">{customer.whatsapp || customer.phone || "—"}</div><div className="text-xs text-slate-400">{customer.email || ""}</div></td>
                    <td className="px-5 py-4 font-semibold text-slate-700">Gs. {Number(customer.credit_limit).toLocaleString("es-PY")}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${customer.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{customer.status === "ACTIVE" ? "Activo" : customer.status}</span></td>
                  </tr>
                )) : <tr><td colSpan={6} className="px-5 py-16 text-center"><Users className="mx-auto h-10 w-10 text-slate-300" /><div className="mt-3 font-bold text-slate-700">Todavía no hay clientes</div><div className="mt-1 text-sm text-slate-400">Agregá el primero para comenzar.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
