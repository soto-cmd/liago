import Link from "next/link";
import { Building2, LayoutDashboard, LogOut, ShieldCheck, Users, WalletCards } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";
import { signOutAction } from "@/app/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-slate-950 text-white md:flex md:flex-col">
        <div className="border-b border-white/10 p-5">
          <Link href="/admin" className="flex items-center gap-3 font-extrabold tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600"><ShieldCheck className="h-5 w-5" /></span>
            <span><span className="block text-lg">LiaGo Admin</span><span className="text-xs font-medium text-slate-400">{role}</span></span>
          </Link>
        </div>
        <nav className="space-y-1 p-4 text-sm">
          <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/10"><LayoutDashboard className="h-4 w-4" /> Resumen</Link>
          <Link href="/admin/companies" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/10"><Building2 className="h-4 w-4" /> Empresas</Link>
          <Link href="/admin/customers" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/10"><Users className="h-4 w-4" /> Clientes</Link>
          <Link href="/admin/plans" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/10"><WalletCards className="h-4 w-4" /> Planes</Link>
        </nav>
        <div className="mt-auto border-t border-white/10 p-4">
          <Link href="/app" className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10">Volver al sistema</Link>
          <form action={signOutAction}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10"><LogOut className="h-4 w-4" /> Cerrar sesión</button></form>
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
