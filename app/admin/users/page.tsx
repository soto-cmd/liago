import { Activity, CheckCircle2, Clock3, Users } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";
import { UserActivityTable, type UserActivityRow } from "./user-activity-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase.rpc("platform_user_activity");
  if (error) throw new Error(error.message);

  const users = (data ?? []) as UserActivityRow[];
  const now = Date.now();
  const dayFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion", year: "numeric", month: "2-digit", day: "2-digit",
  });
  const todayKey = dayFormatter.format(new Date(now));
  const activeToday = users.filter((u) => {
    if (!u.last_seen_at) return false;
    const date = new Date(u.last_seen_at);
    return Number.isFinite(date.getTime()) && dayFormatter.format(date) === todayKey;
  }).length;
  const activeWeek = users.filter((u) => {
    const timestamp = u.last_seen_at ? Date.parse(u.last_seen_at) : NaN;
    return Number.isFinite(timestamp) && now - timestamp < 7 * 86_400_000 && timestamp <= now;
  }).length;
  const completed = users.filter((u) => u.onboarding_completed).length;

  const cards = [
    { label: "Usuarios registrados", value: users.length, Icon: Users, color: "text-slate-900" },
    { label: "Activos hoy", value: activeToday, Icon: Activity, color: "text-emerald-700" },
    { label: "Activos últimos 7 días", value: activeWeek, Icon: Clock3, color: "text-blue-700" },
    { label: "Guía completada", value: completed, Icon: CheckCircle2, color: "text-slate-900" },
  ];

  return (
    <div className="p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-blue-700"><Activity className="h-4 w-4" /> Administración</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Usuarios y actividad</h1>
          <p className="mt-1 text-sm text-slate-500">Registros, invitaciones y uso de Liago. Horarios de Paraguay (America/Asuncion).</p>
        </header>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {cards.map(({label,value,Icon,color}) => (
            <div key={label} className="liago-card flex items-center justify-between gap-3 p-4">
              <div><div className="text-xs font-medium text-slate-500">{label}</div><div className={`mt-1 text-2xl font-extrabold tabular-nums ${color}`}>{value}</div></div>
              <Icon className="h-5 w-5 shrink-0 text-slate-400" />
            </div>
          ))}
        </div>
        <UserActivityTable users={users} now={now} todayKey={todayKey} />
        <p className="text-xs text-slate-500">«Activo hoy» corresponde a la fecha local en Paraguay; «últimos 7 días» es una ventana móvil. Las visitas son acumuladas y no representan sesiones únicas. La actividad depende de los registros de uso disponibles.</p>
      </div>
    </div>
  );
}
