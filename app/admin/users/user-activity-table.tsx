"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export type UserActivityRow = {
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

const pyDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Asuncion", year: "numeric", month: "2-digit", day: "2-digit",
});
const pyDateTime = new Intl.DateTimeFormat("es-PY", {
  timeZone: "America/Asuncion", dateStyle: "medium", timeStyle: "short",
});
const pageSize = 15;

function statusFor(user: UserActivityRow, todayKey: string, now: number) {
  if (!user.last_seen_at) return { label: "Sin actividad", tone: "bg-slate-100 text-slate-600", key: "never" };
  const date = new Date(user.last_seen_at);
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return { label: "Sin actividad", tone: "bg-slate-100 text-slate-600", key: "never" };
  if (pyDate.format(date) === todayKey) return { label: "Activo hoy", tone: "bg-emerald-50 text-emerald-700", key: "today" };
  if (now - timestamp < 7 * 86_400_000) return { label: "Últimos 7 días", tone: "bg-blue-50 text-blue-700", key: "week" };
  if (now - timestamp < 30 * 86_400_000) return { label: "Inactivo 7–30 días", tone: "bg-amber-50 text-amber-700", key: "month" };
  return { label: "Inactivo +30 días", tone: "bg-rose-50 text-rose-700", key: "old" };
}

function progress(user: UserActivityRow) {
  return user.onboarding_completed ? "Completado" : user.onboarding_skipped ? "Omitido" : "En proceso";
}

export function UserActivityTable({ users, todayKey, now }: { users: UserActivityRow[]; todayKey: string; now: number }) {
  const [query, setQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("es");
    return users.filter((user) => {
      const status = statusFor(user, todayKey, now);
      if (activityFilter !== "all" && status.key !== activityFilter) return false;
      if (originFilter === "invited" && !user.invitation_type) return false;
      if (originFilter === "direct" && user.invitation_type) return false;
      if (progressFilter !== "all" && progress(user) !== progressFilter) return false;
      if (search && ![user.full_name, user.email, user.invitation_label].some(v => v?.toLocaleLowerCase("es").includes(search))) return false;
      return true;
    }).sort((a, b) => {
      if (sort === "visits") return Number(b.visit_count || 0) - Number(a.visit_count || 0);
      if (sort === "name") return (a.full_name || a.email || "").localeCompare(b.full_name || b.email || "", "es");
      return (b.last_seen_at ? Date.parse(b.last_seen_at) || 0 : 0) - (a.last_seen_at ? Date.parse(a.last_seen_at) || 0 : 0);
    });
  }, [users, query, activityFilter, originFilter, progressFilter, sort, todayKey, now]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  function resetPage() { setPage(1); }
  const control = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500";

  return <section className="liago-card overflow-hidden">
    <div className="space-y-3 border-b border-slate-100 p-4">
      <div className="grid gap-2 md:grid-cols-[minmax(190px,1fr)_repeat(3,minmax(130px,180px))]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input aria-label="Buscar usuarios" value={query} onChange={e => {setQuery(e.target.value);resetPage();}} placeholder="Buscar nombre, correo o invitación" className={control + " pl-9"} />
        </label>
        <select aria-label="Filtrar por actividad" value={activityFilter} onChange={e => {setActivityFilter(e.target.value);resetPage();}} className={control}>
          <option value="all">Toda la actividad</option><option value="today">Activos hoy</option><option value="week">Últimos 7 días</option><option value="month">Inactivos 7–30 días</option><option value="old">Inactivos +30 días</option><option value="never">Sin actividad</option>
        </select>
        <select aria-label="Filtrar por origen" value={originFilter} onChange={e => {setOriginFilter(e.target.value);resetPage();}} className={control}>
          <option value="all">Todos los orígenes</option><option value="invited">Por invitación</option><option value="direct">Registro directo</option>
        </select>
        <select aria-label="Filtrar por guía" value={progressFilter} onChange={e => {setProgressFilter(e.target.value);resetPage();}} className={control}>
          <option value="all">Todos los avances</option><option value="En proceso">En proceso</option><option value="Completado">Completado</option><option value="Omitido">Omitido</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{filtered.length} de {users.length} usuarios</span>
        <label className="flex items-center gap-2 text-xs text-slate-600">Ordenar
          <select aria-label="Ordenar usuarios" value={sort} onChange={e => {setSort(e.target.value);resetPage();}} className="rounded-md border border-slate-200 bg-white p-1.5 text-xs">
            <option value="recent">Última actividad</option><option value="visits">Más visitas</option><option value="name">Nombre A–Z</option>
          </select>
        </label>
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500"><tr>
        <th className="px-4 py-3 font-semibold">Usuario</th><th className="px-4 py-3 font-semibold">Origen</th><th className="px-4 py-3 font-semibold">Última actividad</th><th className="px-4 py-3 text-right font-semibold">Visitas acumuladas</th><th className="px-4 py-3 font-semibold">Primeros pasos</th>
      </tr></thead>
      <tbody className="divide-y divide-slate-100">
        {visible.map(user => {
          const status = statusFor(user, todayKey, now);
          return <tr key={user.user_id} className="hover:bg-slate-50/60">
            <td className="max-w-[285px] px-4 py-3">
              <div className="truncate font-semibold text-slate-900" title={user.full_name || user.email || "Usuario"}>{user.full_name || user.email || "Usuario"}</div>
              {user.full_name && <div className="truncate text-xs text-slate-500" title={user.email || ""}>{user.email}</div>}
            </td>
            <td className="max-w-[230px] px-4 py-3"><div className="truncate text-slate-700" title={user.invitation_label || "Registro directo"}>{user.invitation_label || "Registro directo"}</div><div className="text-xs text-slate-500">{user.invitation_type === "TRIAL" ? "Prueba" : user.invitation_type === "ORGANIZATION" ? "Invitación a empresa" : "—"}</div></td>
            <td className="px-4 py-3"><span className={status.tone + " inline-flex rounded-md px-2 py-1 text-xs font-semibold"}>{status.label}</span><div className="mt-1 whitespace-nowrap text-xs text-slate-500">{user.last_seen_at && Number.isFinite(Date.parse(user.last_seen_at)) ? pyDateTime.format(new Date(user.last_seen_at)) : "Nunca"}</div></td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums">{Number(user.visit_count || 0).toLocaleString("es-PY")}</td>
            <td className="px-4 py-3"><span className={user.onboarding_completed ? "font-semibold text-emerald-700" : user.onboarding_skipped ? "text-amber-700" : "text-slate-500"}>{progress(user)}</span></td>
          </tr>;
        })}
        {!visible.length && <tr><td colSpan={5} className="px-4 py-9 text-center text-slate-500">No hay usuarios que coincidan con los filtros.</td></tr>}
      </tbody>
    </table></div>
    {pageCount > 1 && <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
      <span>Página {currentPage} de {pageCount}</span><div className="flex gap-2">
        <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>}
  </section>;
}
