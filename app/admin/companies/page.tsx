import { Building2, Plus, Search } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";
import { createAdminCompanyAction, updateCompanyPlanAction, updateCompanyStatusAction } from "../actions";

export default async function AdminCompaniesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requirePlatformAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  let query = supabase
    .from("organizations")
    .select("id,name,legal_name,tax_id,phone,whatsapp,email,city,status,created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q}%,legal_name.ilike.%${q}%,tax_id.ilike.%${q}%,email.ilike.%${q}%`);

  const [{ data: companies }, { data: subscriptions }] = await Promise.all([
    query,
    supabase.from("subscriptions").select("organization_id,plan,status").in("status", ["TRIALING", "ACTIVE", "PAST_DUE"]),
  ]);

  const planByOrg = new Map((subscriptions ?? []).map((item) => [item.organization_id, item.plan]));

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><Building2 className="h-3.5 w-3.5" /> Administración</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Empresas</h1>
            <p className="mt-2 text-sm text-slate-500">Creá y administrá las empresas que usan LiaGo.</p>
          </div>

          <details className="liago-card p-4 lg:w-[560px]">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-slate-900"><Plus className="h-4 w-4" /> Agregar empresa</summary>
            <form action={createAdminCompanyAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input name="name" required placeholder="Nombre comercial *" className="liago-input md:col-span-2" />
              <input name="legal_name" placeholder="Razón social" className="liago-input" />
              <input name="tax_id" placeholder="RUC / Documento" className="liago-input" />
              <input name="phone" placeholder="Teléfono" className="liago-input" />
              <input name="whatsapp" placeholder="WhatsApp" className="liago-input" />
              <input name="email" type="email" placeholder="Email" className="liago-input" />
              <input name="city" placeholder="Ciudad" className="liago-input" />
              <input name="address" placeholder="Dirección" className="liago-input md:col-span-2" />
              <select name="plan" className="liago-input md:col-span-2"><option value="FREE">FREE</option><option value="BASIC">BASIC</option><option value="PRO">PRO</option><option value="BUSINESS">BUSINESS</option></select>
              <button className="liago-btn-primary md:col-span-2">Crear empresa</button>
            </form>
          </details>
        </div>

        {params.created ? <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Empresa creada correctamente.</div> : null}
        {params.error ? <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">No se pudo completar la operación.</div> : null}

        <form className="mb-5 flex max-w-xl gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input name="q" defaultValue={q} placeholder="Buscar empresa, razón social, RUC o email" className="liago-input pl-9" /></div>
          <button className="liago-btn-secondary">Buscar</button>
        </form>

        <div className="liago-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Empresa</th><th className="px-5 py-4">Contacto</th><th className="px-5 py-4">Plan</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Creada</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {companies?.length ? companies.map((company) => (
                  <tr key={company.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-5 py-4"><div className="font-bold text-slate-900">{company.name}</div><div className="mt-1 text-xs text-slate-500">{company.legal_name || "Sin razón social"}{company.tax_id ? ` · ${company.tax_id}` : ""}</div></td>
                    <td className="px-5 py-4"><div>{company.whatsapp || company.phone || "—"}</div><div className="mt-1 text-xs text-slate-500">{company.email || company.city || ""}</div></td>
                    <td className="px-5 py-4"><form action={updateCompanyPlanAction} className="flex gap-2"><input type="hidden" name="organization_id" value={company.id} /><select name="plan" defaultValue={planByOrg.get(company.id) || "FREE"} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"><option>FREE</option><option>BASIC</option><option>PRO</option><option>BUSINESS</option></select><button className="text-xs font-bold text-blue-700">Guardar</button></form></td>
                    <td className="px-5 py-4"><form action={updateCompanyStatusAction} className="flex gap-2"><input type="hidden" name="organization_id" value={company.id} /><select name="status" defaultValue={company.status} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"><option value="ACTIVE">Activa</option><option value="INACTIVE">Inactiva</option><option value="SUSPENDED">Suspendida</option></select><button className="text-xs font-bold text-blue-700">Guardar</button></form></td>
                    <td className="px-5 py-4 text-slate-500">{new Date(company.created_at).toLocaleDateString("es-PY")}</td>
                  </tr>
                )) : <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Todavía no hay empresas.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
