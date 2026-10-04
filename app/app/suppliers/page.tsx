import { Plus } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { createSupplierAction } from "./actions";

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const params = await searchParams;
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id,name,tax_id,contact_name,phone,whatsapp,email,city,status")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");

  return <div className="p-4 md:p-8">
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><p className="text-sm text-neutral-500">Abastecimiento</p><h1 className="text-2xl font-semibold">Proveedores</h1><p className="mt-1 text-sm text-neutral-600">Contactos, RUC y proveedores vinculables a productos y compras.</p></div>
      <details className="rounded-xl border bg-white p-3 shadow-sm md:w-[500px]"><summary className="flex cursor-pointer list-none items-center gap-2 font-medium"><Plus className="h-4 w-4" /> Agregar proveedor</summary>
        <form action={createSupplierAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="name" required placeholder="Nombre / Razón social *" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
          <input name="tax_id" placeholder="RUC / Documento" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="contact_name" placeholder="Contacto" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="phone" placeholder="Teléfono" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="whatsapp" placeholder="WhatsApp" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="email" type="email" placeholder="Email" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="city" placeholder="Ciudad" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="address" placeholder="Dirección" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
          <textarea name="notes" placeholder="Notas" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white md:col-span-2">Guardar proveedor</button>
        </form>
      </details>
    </div>
    {params.created ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Proveedor guardado correctamente.</div> : null}
    {params.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo guardar el proveedor.</div> : null}
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50 text-neutral-600"><tr><th className="px-4 py-3">Proveedor</th><th className="px-4 py-3">RUC</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Teléfono</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y">{suppliers?.length ? suppliers.map((s) => <tr key={s.id}><td className="px-4 py-3"><div className="font-medium">{s.name}</div><div className="text-xs text-neutral-500">{s.city || ""}</div></td><td className="px-4 py-3">{s.tax_id || "—"}</td><td className="px-4 py-3">{s.contact_name || "—"}</td><td className="px-4 py-3">{s.whatsapp || s.phone || "—"}</td><td className="px-4 py-3">{s.status}</td></tr>) : <tr><td colSpan={5} className="px-4 py-10 text-center text-neutral-500">Todavía no hay proveedores.</td></tr>}</tbody></table></div></div>
  </div>;
}
