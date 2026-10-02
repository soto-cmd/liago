import Link from "next/link";
import { Building2, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { signOutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-neutral-200 bg-white p-4 md:flex md:flex-col">
        <div className="mb-8 flex items-center gap-2 px-2 font-semibold">
          <Building2 className="h-5 w-5" />
          LiaGo
        </div>

        <nav className="space-y-1 text-sm">
          <Link className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 font-medium" href="/app">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-neutral-100" href="/app/organizations">
            <Building2 className="h-4 w-4" /> Mis empresas
          </Link>
          <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-neutral-400">
            <Users className="h-4 w-4" /> Clientes · Fase 2
          </span>
          <Link className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-neutral-100" href="/app/settings">
            <Settings className="h-4 w-4" /> Configuración
          </Link>
        </nav>

        <form action={signOutAction} className="mt-auto">
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-100">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </form>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
