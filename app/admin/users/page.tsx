import { Activity, CheckCircle2, Clock3, UserRound, Users } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";

export const dynamic = "force-dynamic";

type UserActivityRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  last_seen_at: string | null;
  visit_count: number | null;
  onboarding_completed: boolean | null;
  onboarding_skipped: boolean | null;
  invitation_label: string | null;
  invitation_type: string | null;
  redeemed_at: string | null;
};

function activityStatus(lastSeen: string | null) {
  if (!lastSeen) return { label: "Sin actividad", className: "bg-slate-100 text-slate-600" };
  const days = (Date.now() - new Date(lastSeen).getTime()) / 86_400_000;
  if (days < 1) return { label: "Activo hoy", className: "bg-emerald-100 text-emerald-700" };
  if (days < 7) return { label: "Activo esta semana", className: "bg-blue-100 text-blue-700" };
  if (days < 30) return { label: "Inactivo +7 días", className: "bg-amber-100 text-amber-700" };
  return { label: "Inactivo +30 días", className: "bg-rose-100 text-rose-700" };
}

export default async function AdminUsersPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase.rpc("platform_user_activity");
  if (error) throw new Error(error.message);

  const users = (data ?? []) as UserActivityRow[];
  const activeToday = users.filter((u) => u.last_seen_at && Date.now() - new Date(u.last_seen_at).getTime() < 86_400_000).length;
  const activeWeek = users.filter((u) => u.last_seen_at && Date.now() - new Date(u.last_seen_at).getTime() < 7 * 86_400_000).length;
  const completed = users.filter((u) => u.onboarding_completed).length;

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><Activity className="h-3.5 w-3.5" /> Actividad</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Usuarios y actividad</h1>
          <p className="mt-2 text-sm text-slate-500">Seguimiento de registros, uso de invitaciones, último acceso y avance del onboarding.</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="liago-card p-5"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Users className="h-4 w-4" /> Usuarios</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{users.length}</div></div>
          <div className="liago-card p-5"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Activity className="h-4 w-4" /> Activos hoy</div><div className="mt-2 text-3xl font-extrabold text-emerald-700">{activeToday}</div></div>
          <div className="liago-card p-5"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Clock3 className="h-4 w-4" /> Activos 7 días</div><div className="mt-2 text-3xl font-extrabold text-blue-700">{activeWeek}</div></div>
          <div className="liago-card p-5"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><CheckCircle2 className="h-4 w-4" /> Guía completada</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{completed}</div></div>
        </div>

        <div className="liago-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Usuario</th><th className="px-5 py-4">Origen</th><th className="px-5 py-4">Actividad</th><th className="px-5 py-4">Visitas</th><th className="px-5 py-4">Primeros pasos</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {users.length ? users.map((user) => {
                  const status = activityStatus(user.last_seen_at);
                  return (
                    <tr key={user.user_id}>
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500"><UserRound className="h-4 w-4" /></div><div><div className="font-bold text-slate-900">{user.full_name || user.email || "Usuario"}</div>{user.full_name ? <div className="text-xs text-slate-500">{user.email}</div> : null}</div></div></td>
                      <td className="px-5 py-4"><div className="font-medium text-slate-700">{user.invitation_label || "Registro directo"}</div><div className="mt-1 text-xs text-slate-500">{user.invitation_type === "TRIAL" ? "Prueba" : user.invitation_type === "ORGANIZATION" ? "Invitación a empresa" : "—"}</div></td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span><div className="mt-2 text-xs text-slate-500">{user.last_seen_at ? new Intl.DateTimeFormat("es-PY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(user.last_seen_at)) : "Nunca"}</div></td>
                      <td className="px-5 py-4 font-bold text-slate-900">{user.visit_count || 0}</td>
                      <td className="px-5 py-4">{user.onboarding_completed ? <span className="font-semibold text-emerald-700">Completado</span> : user.onboarding_skipped ? <span className="font-semibold text-amber-700">Omitido</span> : <span className="text-slate-500">En proceso</span>}</td>
                    </tr>
                  );
                }) : <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Todavía no hay usuarios registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
