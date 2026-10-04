import Link from "next/link";
import { cookies } from "next/headers";
import {
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  WalletCards,
  Wrench,
} from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { SupportWidget } from "@/components/support/support-widget";
import { FirstUseOnboarding } from "@/components/onboarding/first-use-onboarding";
import { signOutAction } from "./actions";

export const dynamic = "force-dynamic";

const sections = [
  {
    label: "Gestiona tu negocio",
    items: [
      ["Inicio", "/app", LayoutDashboard],
      ["Ventas", "/app/sales", ShoppingCart],
      ["Productos", "/app/products", Package],
      ["Servicios", "/app/services", Wrench],
      ["Inventario", "/app/inventory", Boxes],
      ["Compras", "/app/purchases", ReceiptText],
      ["Caja", "/app/cash", WalletCards],
      ["Gastos", "/app/expenses", HandCoins],
      ["Reportes", "/app/reports", BarChart3],
    ],
  },
  {
    label: "Contactos",
    items: [
      ["Clientes", "/app/customers", Users],
      ["Proveedores", "/app/suppliers", Truck],
    ],
  },
] as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, userId } = await requireUser();
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("active_organization_id")?.value;

  await supabase.rpc("touch_user_activity", { p_path: "/app" });

  const [{ data: admin }, { data: subscription }, { data: onboarding }, { data: redemption }] = await Promise.all([
    supabase.from("platform_admins").select("role,status").eq("user_id", userId).eq("status", "ACTIVE").maybeSingle(),
    organizationId
      ? supabase.from("subscriptions").select("plan").eq("organization_id", organizationId).in("status", ["TRIALING", "ACTIVE", "PAST_DUE"]).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("onboarding_progress").select("current_step,completed,skipped").eq("user_id", userId).maybeSingle(),
    supabase.from("invitation_redemptions").select("invitation_links(invitation_type)").eq("user_id", userId).order("redeemed_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const isPlatformAdmin = Boolean(admin && ["SUPERADMIN", "ADMIN", "SUPPORT"].includes(admin.role));
  const plan = subscription?.plan || "FREE";
  const invitation = Array.isArray(redemption?.invitation_links) ? redemption?.invitation_links[0] : redemption?.invitation_links;
  const isTrial = invitation?.invitation_type === "TRIAL";
  const showOnboarding = onboarding && !onboarding.completed && !onboarding.skipped;

  return (
    <div className="min-h-screen bg-[#f5f7fb] md:grid md:grid-cols-[272px_1fr]">
      <aside className="hidden min-h-screen border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="flex h-20 items-center border-b border-slate-100 px-6">
          <Link href="/app" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-lg font-black text-white shadow-sm">L</div>
            <div><div className="text-lg font-extrabold tracking-tight text-slate-900">LiaGo</div><div className="text-xs text-slate-500">Tu negocio en movimiento</div></div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {sections.map((section) => (
            <div key={section.label} className="mb-6">
              <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{section.label}</div>
              <nav className="space-y-1">
                {section.items.map(([label, href, Icon]) => (
                  <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"><Icon className="h-[18px] w-[18px] text-slate-400 transition group-hover:text-blue-600" />{label}</Link>
                ))}
              </nav>
            </div>
          ))}

          <div className="mb-6 border-t border-slate-100 pt-5">
            <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Administración</div>
            <nav className="space-y-1">
              <Link href="/app/getting-started" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"><BookOpen className="h-[18px] w-[18px] text-slate-400 group-hover:text-blue-600" /> Primeros pasos</Link>
              <Link href="/app/organizations" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"><Building2 className="h-[18px] w-[18px] text-slate-400 group-hover:text-blue-600" /> Mis empresas</Link>
              <Link href="/app/settings" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"><Settings className="h-[18px] w-[18px] text-slate-400 group-hover:text-blue-600" /> Configuración</Link>
              {isPlatformAdmin ? <Link href="/admin" className="group flex items-center gap-3 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"><ShieldCheck className="h-[18px] w-[18px]" /> LiaGo Admin</Link> : null}
            </nav>
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 rounded-2xl bg-slate-50 p-4"><div className="text-xs font-semibold text-slate-500">Plan actual</div><div className="mt-1 flex items-center justify-between"><span className="font-bold text-slate-900">{plan}</span><span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-700">LiaGo</span></div></div>
          <form action={signOutAction}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"><LogOut className="h-[18px] w-[18px]" /> Cerrar sesión</button></form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="md:hidden"><Link href="/app" className="flex items-center gap-2 font-extrabold text-slate-900"><span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-white">L</span> LiaGo</Link></div>
          <div className="hidden text-sm text-slate-500 md:block">Gestión comercial simple, clara y segura.</div>
          <div className="flex items-center gap-2">
            {isPlatformAdmin ? <Link href="/admin" className="liago-btn-secondary hidden lg:inline-flex"><ShieldCheck className="h-4 w-4" /> Admin</Link> : null}
            <Link href="/app/services/new" className="liago-btn-secondary hidden lg:inline-flex"><Wrench className="h-4 w-4" /> Servicio</Link>
            <Link href="/app/products/new" className="liago-btn-secondary hidden sm:inline-flex"><Package className="h-4 w-4" /> Producto</Link>
            <Link href="/app/sales" className="liago-btn-primary"><ShoppingCart className="h-4 w-4" /> Nueva venta</Link>
          </div>
        </header>
        <main className="min-w-0">{children}</main>
        <SupportWidget />
      </div>
      {showOnboarding ? <FirstUseOnboarding initialStep={onboarding.current_step || 1} isTrial={isTrial} /> : null}
    </div>
  );
}
