import { Copy, Link2, Plus, ShieldCheck } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";
import { createInvitationAction, revokeInvitationAction } from "./actions";

function statusOf(item: { revoked_at: string | null; expires_at: string | null; used_count: number; max_uses: number }) {
  if (item.revoked_at) return "Revocado";
  if (item.expires_at && new Date(item.expires_at) <= new Date()) return "Vencido";
  if (item.used_count >= item.max_uses) return "Agotado";
  return "Activo";
}

export default async function AdminInvitationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, role } = await requirePlatformAdmin();
  const params = await searchParams;

  const [{ data: invites }, { data: organizations }] = await Promise.all([
    supabase.from("invitation_links").select("id,token,invitation_type,label,email,organization_id,role,plan,trial_days,max_uses,used_count,expires_at,revoked_at,created_at,organizations(name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("organizations").select("id,name").is("deleted_at", null).order("name"),
  ]);

  const canManage = role === "SUPERADMIN" || role === "ADMIN";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://liago.vercel.app";

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><Link2 className="h-3.5 w-3.5" /> Accesos</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Invitaciones</h1>
            <p className="mt-2 text-sm text-slate-500">Generá enlaces únicos para invitar usuarios o dar acceso de prueba a LiaGo.</p>
          </div>

          {canManage ? (
            <details className="liago-card p-4 lg:w-[620px]">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-slate-900"><Plus className="h-4 w-4" /> Crear enlace</summary>
              <form action={createInvitationAction} className="mt-4 grid gap-3 md:grid-cols-2">
                <select name="invitation_type" className="liago-input"><option value="TRIAL">Prueba de LiaGo</option><option value="ORGANIZATION">Invitación a empresa</option></select>
                <input name="label" placeholder="Nombre / campaña" className="liago-input" />
                <input name="email" type="email" placeholder="Email específico (opcional)" className="liago-input md:col-span-2" />
                <select name="organization_id" className="liago-input md:col-span-2"><option value="">Empresa (solo para invitación a empresa)</option>{organizations?.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select>
                <select name="role" className="liago-input"><option value="VIEWER">Viewer</option><option value="CASHIER">Cajero</option><option value="SELLER">Vendedor</option><option value="MANAGER">Gerente</option><option value="ADMIN">Admin empresa</option><option value="OWNER">Propietario</option></select>
                <select name="plan" className="liago-input"><option value="FREE">FREE</option><option value="BASIC">BASIC</option><option value="PRO">PRO</option><option value="BUSINESS">BUSINESS</option></select>
                <input name="trial_days" type="number" min="1" max="90" defaultValue="7" placeholder="Días de prueba" className="liago-input" />
                <input name="expires_days" type="number" min="1" max="365" defaultValue="7" placeholder="Vence en días" className="liago-input" />
                <input name="max_uses" type="number" min="1" max="1000" defaultValue="1" placeholder="Usos máximos" className="liago-input md:col-span-2" />
                <button className="liago-btn-primary md:col-span-2">Generar enlace único</button>
              </form>
            </details>
          ) : null}
        </div>

        {params.created ? <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Enlace creado correctamente.</div> : null}
        {params.revoked ? <div className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-700">Invitación revocada.</div> : null}
        {params.error ? <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">No se pudo completar la operación.</div> : null}

        <div className="liago-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Invitación</th><th className="px-5 py-4">Destino</th><th className="px-5 py-4">Uso</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Enlace</th><th className="px-5 py-4"></th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {invites?.length ? invites.map((item) => {
                  const url = `${appUrl}/invite/${item.token}`;
                  const status = statusOf(item);
                  const orgName = Array.isArray(item.organizations) ? item.organizations[0]?.name : (item.organizations as { name?: string } | null)?.name;
                  return (
                    <tr key={item.id} className="align-top">
                      <td className="px-5 py-4"><div className="font-bold text-slate-900">{item.label || (item.invitation_type === "TRIAL" ? "Prueba LiaGo" : "Invitación")}</div><div className="mt-1 text-xs text-slate-500">{item.invitation_type === "TRIAL" ? `${item.plan} · ${item.trial_days} días` : `Rol ${item.role || "VIEWER"}`}</div></td>
                      <td className="px-5 py-4"><div>{item.email || "Cualquier email"}</div><div className="mt-1 text-xs text-slate-500">{orgName || "Nueva empresa de prueba"}</div></td>
                      <td className="px-5 py-4">{item.used_count}/{item.max_uses}<div className="mt-1 text-xs text-slate-500">Vence {item.expires_at ? new Date(item.expires_at).toLocaleDateString("es-PY") : "sin fecha"}</div></td>
                      <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{status}</span></td>
                      <td className="px-5 py-4"><div className="flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><code className="min-w-0 flex-1 truncate text-xs">{url}</code><Copy className="h-4 w-4 text-slate-400" /></div></td>
                      <td className="px-5 py-4">{canManage && status === "Activo" ? <form action={revokeInvitationAction}><input type="hidden" name="id" value={item.id} /><button className="text-xs font-bold text-rose-600">Revocar</button></form> : null}</td>
                    </tr>
                  );
                }) : <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500"><ShieldCheck className="mx-auto mb-3 h-6 w-6" />Todavía no hay invitaciones.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
