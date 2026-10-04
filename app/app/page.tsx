import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  HandCoins,
  PackagePlus,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export const dynamic = "force-dynamic";

function money(value: number) {
  return `Gs. ${Math.round(value).toLocaleString("es-PY")}`;
}

export default async function DashboardPage() {
  const { supabase, organizationId, organization } = await requireActiveOrganization();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [
    { data: sales },
    { data: payments },
    { data: debts },
    { data: stock },
    { data: expenses },
    { count: customerCount },
    { count: productCount },
  ] = await Promise.all([
    supabase.from("sales").select("total,status").eq("organization_id", organizationId).gte("sold_at", todayIso).eq("status", "CONFIRMED"),
    supabase.from("payments").select("amount,status").eq("organization_id", organizationId).gte("paid_at", todayIso).eq("status", "CONFIRMED"),
    supabase.from("debts").select("balance,status").eq("organization_id", organizationId).in("status", ["PENDING", "PARTIAL", "OVERDUE"]),
    supabase.from("inventory_balances").select("quantity,products(min_stock)").eq("organization_id", organizationId),
    supabase.from("expenses").select("amount,status").eq("organization_id", organizationId).gte("expense_date", todayIso).eq("status", "CONFIRMED"),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null),
  ]);

  const salesToday = sales?.reduce((sum, item) => sum + Number(item.total), 0) ?? 0;
  const collectedToday = payments?.reduce((sum, item) => sum + Number(item.amount), 0) ?? 0;
  const debtTotal = debts?.reduce((sum, item) => sum + Number(item.balance), 0) ?? 0;
  const expensesToday = expenses?.reduce((sum, item) => sum + Number(item.amount), 0) ?? 0;
  const lowStock = stock?.filter((item) => {
    const product = item.products as unknown as { min_stock: number } | null;
    return product && Number(item.quantity) <= Number(product.min_stock);
  }).length ?? 0;

  const cards = [
    { title: "Ventas de hoy", value: money(salesToday), helper: `${sales?.length ?? 0} operaciones`, icon: ShoppingCart, tone: "bg-emerald-50 text-emerald-700" },
    { title: "Cobrado hoy", value: money(collectedToday), helper: `${payments?.length ?? 0} cobros`, icon: WalletCards, tone: "bg-blue-50 text-blue-700" },
    { title: "Por cobrar", value: money(debtTotal), helper: `${debts?.length ?? 0} saldos pendientes`, icon: HandCoins, tone: "bg-amber-50 text-amber-700" },
    { title: "Gastos de hoy", value: money(expensesToday), helper: `${expenses?.length ?? 0} movimientos`, icon: ReceiptText, tone: "bg-rose-50 text-rose-700" },
  ];

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              <TrendingUp className="h-3.5 w-3.5" /> Resumen del día
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">{organization?.name || "Mi empresa"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Controlá ventas, caja, clientes e inventario desde un solo panel.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/products/new" className="liago-btn-secondary"><PackagePlus className="h-4 w-4" /> Agregar producto</Link>
            <Link href="/app/sales" className="liago-btn-primary"><ShoppingCart className="h-4 w-4" /> Registrar venta</Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ title, value, helper, icon: Icon, tone }) => (
            <div key={title} className="liago-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-500">{title}</div>
                  <div className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{value}</div>
                  <div className="mt-1 text-xs text-slate-400">{helper}</div>
                </div>
                <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
          <section className="liago-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="font-bold text-slate-950">Operación rápida</div>
                <div className="mt-1 text-sm text-slate-500">Accesos para las tareas más frecuentes.</div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Hoy</span>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Nueva venta", "Cobrar productos o servicios", "/app/sales", ShoppingCart],
                ["Nuevo producto", "Código, precio y stock", "/app/products/new", PackagePlus],
                ["Nuevo cliente", "Datos y cuenta corriente", "/app/customers", Users],
                ["Registrar compra", "Proveedor y entrada de stock", "/app/purchases", ReceiptText],
              ].map(([label, description, href, Icon]) => (
                <Link key={href as string} href={href as string} className="group rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/50">
                  <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-bold text-slate-900">{label as string}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{description as string}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="liago-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-950">Inventario</div>
                <div className="mt-1 text-sm text-slate-500">Estado general del catálogo.</div>
              </div>
              <div className={`grid h-11 w-11 place-items-center rounded-2xl ${lowStock > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                {lowStock > 0 ? <AlertTriangle className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-extrabold text-slate-950">{productCount ?? 0}</div><div className="mt-1 text-xs text-slate-500">Productos</div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-extrabold text-slate-950">{customerCount ?? 0}</div><div className="mt-1 text-xs text-slate-500">Clientes</div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-extrabold text-slate-950">{lowStock}</div><div className="mt-1 text-xs text-slate-500">Stock bajo</div></div>
            </div>
            <Link href="/app/inventory" className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Ver inventario completo <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
