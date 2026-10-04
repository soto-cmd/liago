import { Link2, ShieldCheck, Sparkles } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationForm } from "./invitation-form";
import { ShareInvitation } from "./share-invitation";
import { revokeInvitationAction } from "./actions";

export const dynamic = "force-dynamic";

function invitationStatus(item: { revoked_at: string | null; expires_at: string | null; used_count: number; max_uses: number }) {
  if (item.revoked_at) return { label: "Revocada", className: "bg-red-100 text-red-700" };
  if (item.expires_at && new Date(item.expires_at).getTime() < Date.now()) return { label: "Vencida", className: "bg-amber-100 text-amber-700" };
  if (item.used_count >= item.max_uses) return { label: "Usada", className: "bg-slate-100 text-slate-700" };
  return { label: "Activa", className: "bg-emerald-100 text-emerald-700" };
}

export default async function InvitationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { supabase, role } = await requirePlatformAdmin();

  const [{ data: invitations, error }, { data: organizations }] = await Promise.all([
    supabase
      .from("invitation_links")
      .select("id,token,invitation_type,label,email,organization_id,role,plan,trial_days,max_uses,used_count,expires_at,revoked_at,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("organizations").select("id,name").order("name"),
  ]);

  if (error) throw new Error(error.message);

  const organizationMap = new Map((organizations || []).map((organization) => [organization.id, organization.name]));
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://liago.vercel.app").replace(/\/$/, "");
  const canManage = role === "SUPERADMIN" || role === "ADMIN";

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" /> Accesos controlados
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Invitaciones y accesos de prueba</h1>
            <p className="mt-2 max-w-2xl text-neutral-500">
              Invitá personas a una empresa o compartí accesos exclusivos para probar LiaGo. Cada enlace tiene vigencia, límite de usos y trazabilidad.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
            <span className="font-semibold text-neutral-900">{(invitations || []).length}</span> enlaces registrados
          </div>
        </div>

        {params.created ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Enlace generado correctamente. Ya podés copiarlo o compartirlo.</div> : null}
        {params.error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">No se pudo completar la operación. Revisá los datos e intentá nuevamente.</div> : null}

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle>Generar nueva invitación</CardTitle>
              <CardDescription>Elegí el tipo de acceso. LiaGo mostrará solamente los campos necesarios.</CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationForm organizations={organizations || []} />
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">Tu rol permite consultar invitaciones, pero no crear ni revocar enlaces.</div>
        )}

        <div className="space-y-4">
          {(invitations || []).map((item) => {
            const status = invitationStatus(item);
            const organizationName = item.organization_id ? organizationMap.get(item.organization_id) : null;
            const url = `${baseUrl}/auth/sign-up?invite=${item.token}`;
            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">{item.label || (item.invitation_type === "TRIAL" ? "Prueba de LiaGo" : "Invitación a empresa")}</CardTitle>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{item.invitation_type === "TRIAL" ? "Prueba" : "Empresa"}</span>
                      </div>
                      <CardDescription className="mt-2">
                        {item.invitation_type === "TRIAL"
                          ? `${item.trial_days} días · Plan ${item.plan}`
                          : `${organizationName || "Empresa"} · ${item.role || "Rol"}`}
                        {item.email ? ` · ${item.email}` : ""}
                      </CardDescription>
                    </div>
                    <div className="text-xs text-neutral-500">
                      <div>{item.used_count}/{item.max_uses} usos</div>
                      <div className="mt-1">Vence: {item.expires_at ? new Intl.DateTimeFormat("es-PY", { dateStyle: "medium" }).format(new Date(item.expires_at)) : "Sin vencimiento"}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                    <Link2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{url}</span>
                  </div>
                  <ShareInvitation url={url} type={item.invitation_type as "TRIAL" | "ORGANIZATION"} organizationName={organizationName} />
                  {canManage && status.label === "Activa" ? (
                    <form action={revokeInvitationAction} className="flex justify-end border-t border-neutral-100 pt-4">
                      <input type="hidden" name="id" value={item.id} />
                      <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                        <ShieldCheck className="h-4 w-4" /> Revocar enlace
                      </button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}

          {!invitations?.length ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">Todavía no hay invitaciones. Generá la primera desde el formulario superior.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
