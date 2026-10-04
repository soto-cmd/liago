import Link from "next/link";
import { CheckCircle2, Clock3, Link2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redeemInvitationAction } from "./actions";

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: invite } = await supabase.rpc("get_invitation_link", { p_token: token }).maybeSingle();
  const { data: { user } } = await supabase.auth.getUser();

  if (!invite) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="liago-card max-w-lg p-8 text-center"><Link2 className="mx-auto h-8 w-8 text-slate-400" /><h1 className="mt-4 text-2xl font-extrabold">Enlace no válido</h1><p className="mt-2 text-sm text-slate-500">La invitación no existe o ya no está disponible.</p></div></main>;
  }

  const available = Boolean(invite.available);
  const next = `/invite/${token}`;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7fb] p-6">
      <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white"><ShieldCheck className="h-5 w-5" /></span><div><div className="font-extrabold text-slate-950">LiaGo</div><div className="text-xs text-slate-500">Tu negocio en movimiento</div></div></div>
        <div className="mt-8"><div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><Link2 className="h-3.5 w-3.5" /> Invitación privada</div><h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">{invite.label || (invite.invitation_type === "TRIAL" ? "Probá LiaGo" : "Te invitaron a LiaGo")}</h1></div>

        <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          {invite.invitation_type === "TRIAL" ? <><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Plan {invite.plan} por {invite.trial_days} días</div><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Empresa de prueba privada y separada</div></> : <><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Empresa: {invite.organization_name}</div><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Rol asignado: {invite.role}</div></>}
          {invite.expires_at ? <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" /> Válido hasta {new Date(invite.expires_at).toLocaleString("es-PY")}</div> : null}
        </div>

        {!available ? <div className="mt-6 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">Este enlace venció, fue revocado o alcanzó su límite de usos.</div> : null}
        {query.error ? <div className="mt-6 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">No se pudo aceptar la invitación. Verificá que estés usando el correo autorizado para este enlace.</div> : null}

        {available ? user ? (
          <form action={redeemInvitationAction} className="mt-6"><input type="hidden" name="token" value={token} /><button className="liago-btn-primary w-full justify-center">Aceptar invitación y entrar</button></form>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href={`/auth/sign-up?next=${encodeURIComponent(next)}`} className="liago-btn-primary justify-center">Crear cuenta</Link><Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="liago-btn-secondary justify-center">Ya tengo cuenta</Link></div>
        ) : null}
      </div>
    </main>
  );
}
