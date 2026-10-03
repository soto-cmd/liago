import Link from "next/link";
import {
  BadgeDollarSign,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  HandCoins,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  ReceiptText,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { signOutAction } from "./actions";

export const dynamic = "force-dynamic";

const navItems = [
  ["/app", "Dashboard", LayoutDashboard],
  ["/app/customers", "Clientes", Users],
  ["/app/products", "Productos", PackagePlus],
  ["/app/inventory", "Inventario", Boxes],
  ["/app/sales", "Ventas", ShoppingCart],
  ["/app/debts", "Deudas", HandCoins],
  ["/app/payments", "Cobros", BadgeDollarSign],
  ["/app/suppliers", "Proveedores", Truck],
  ["/app/purchases", "Compras", Store],
  ["/app/cash", "Caja", WalletCards],
  ["/app/expenses", "Gastos", CircleDollarSign],
  ["/app/reports", "Reportes", ChartNoAxesCombined],
] as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="min-h-screen bg-neutral-50 md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden max-h-screen overflow-y-auto border-r border-neutral-200 bg-white p-4 md:flex md:flex-col">
        <div className="mb-6 flex items-center gap-2 px-2 font-semibold">
          <Building2 className="h-5 w-5" /> LiaGo
        </div>

        <nav className="space-y-1 text-sm">
          {navItems.map(([href, label, Icon]) => (
            <Link key={href} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-neutral-100" href={href}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
          <div className="my-3 border-t" />
          <Link className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-neutral-100" href="/app/organizations">
            <Building2 className="h-4 w-4" /> Mis empresas
          </Link>
          <Link className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-neutral-100" href="/app/settings">
            <Settings className="h-4 w-4" /> Configuración
          </Link>
        </nav>

        <div className="mt-6 rounded-xl border bg-neutral-50 p-3 text-xs text-neutral-600">
          <div className="mb-1 flex items-center gap-2 font-medium text-neutral-900">
            <ReceiptText className="h-4 w-4" /> Gestión comercial
          </div>
          Productos por código, ventas, cuenta corriente, caja e inventario en un solo lugar.
        </div>

        <form action={signOutAction} className="mt-auto pt-6">
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-100">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </form>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
