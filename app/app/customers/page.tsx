import { Plus, Search } from "lucide-react";
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
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div><p className="text-sm text-neutral-500">Base comercial</p><h1 className="text-2xl font-semibold">Clientes</h1><p className="mt-1 text-sm text-neutral-600">Datos, límites de crédito y cuenta corriente por empresa.</p></div>
        <details className="rounded-xl border bg-white p-3 shadow-sm md:w-[520px]">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium"><Plus className="h-4 w-4" /> Agregar cliente</summary>
          <form action={createCustomerAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <select name="customer_type" className="rounded-lg border px-3 py-2 text-sm"><option value="PERSON">Persona</option><option value="COMPANY">Empresa</option></select>
            <input name="customer_code" placeholder="Código de cliente" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="name" required placeholder="Nombre / Razón social *" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            <input name="tax_id" placeholder="Documento / RUC" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="phone" placeholder="Teléfono" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="whatsapp" placeholder="WhatsApp" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="email" type="email" placeholder="Email" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="city" placeholder="Ciudad" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="credit_limit" type="number" min="0" step="0.01" placeholder="Límite de crédito" className="rounded-lg border px-3 py-2 text-sm" />
            <input name="address" placeholder="Dirección" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            <textarea name="notes" placeholder="Notas" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
            <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white md:col-span-2">Guardar cliente</button>
          </form>
        </details>
      </div>

      {params.created ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Cliente guardado correctamente.</div> : null}
      {params.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo guardar el cliente.</div> : null}

      <form className="mb-4 flex max-w-xl gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" /><input name="q" defaultValue={q} placeholder="Buscar cliente, código, RUC o teléfono" className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm" /></div><button className="rounded-lg border bg-white px-4 text-sm">Buscar</button></form>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-neutral-600"><tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Documento</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Crédito</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y">
        {customers?.length ? customers.map((c) => <tr key={c.id} className="hover:bg-neutral-50"><td className="px-4 py-3 font-mono">{c.customer_code || "—"}</td><td className="px-4 py-3"><div className="font-medium">{c.name}</div><div className="text-xs text-neutral-500">{c.customer_type === "COMPANY" ? "Empresa" : "Persona"}{c.city ? ` · ${c.city}` : ""}</div></td><td className="px-4 py-3">{c.tax_id || "—"}</td><td className="px-4 py-3"><div>{c.whatsapp || c.phone || "—"}</div><div className="text-xs text-neutral-500">{c.email || ""}</div></td><td className="px-4 py-3">{Number(c.credit_limit).toLocaleString("es-PY")}</td><td className="px-4 py-3">{c.status}</td></tr>) : <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Todavía no hay clientes.</td></tr>}
      </tbody></table></div></div>
    </div>
  );
}
