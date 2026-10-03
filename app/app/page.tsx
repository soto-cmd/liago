import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, HandCoins, ShoppingCart, WalletCards } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, organizationId, organization } = await requireActiveOrganization();
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayIso = today.toISOString();

  const [{ data:sales },{ data:payments },{ data:debts },{ data:stock },{ data:expenses }] = await Promise.all([
    supabase.from("sales").select("total,status").eq("organization_id",organizationId).gte("sold_at",todayIso).eq("status","CONFIRMED"),
    supabase.from("payments").select("amount,status").eq("organization_id",organizationId).gte("paid_at",todayIso).eq("status","CONFIRMED"),
    supabase.from("debts").select("balance,status").eq("organization_id",organizationId).in("status",["PENDING","PARTIAL","OVERDUE"]),
    supabase.from("inventory_balances").select("quantity,products(min_stock)").eq("organization_id",organizationId),
    supabase.from("expenses").select("amount,status").eq("organization_id",organizationId).gte("expense_date",todayIso).eq("status","CONFIRMED"),
  ]);

  const salesToday=sales?.reduce((s,x)=>s+Number(x.total),0)??0;
  const collectedToday=payments?.reduce((s,x)=>s+Number(x.amount),0)??0;
  const debtTotal=debts?.reduce((s,x)=>s+Number(x.balance),0)??0;
  const expensesToday=expenses?.reduce((s,x)=>s+Number(x.amount),0)??0;
  const lowStock=stock?.filter((x)=>{const p=x.products as unknown as {min_stock:number}|null;return p&&Number(x.quantity)<=Number(p.min_stock);}).length??0;

  const cards=[
    ["Ventas de hoy",salesToday,ShoppingCart,"/app/sales"],
    ["Cobros de hoy",collectedToday,WalletCards,"/app/payments"],
    ["Pendiente de cobro",debtTotal,HandCoins,"/app/debts"],
    ["Gastos de hoy",expensesToday,WalletCards,"/app/expenses"],
  ] as const;

  return <div className="p-4 md:p-8">
    <div className="mb-8"><p className="text-sm text-neutral-500">Empresa actual</p><h1 className="text-3xl font-semibold tracking-tight">{organization?.name || "Mi empresa"}</h1><p className="mt-1 text-sm text-neutral-600">Resumen comercial en tiempo real.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([title,value,Icon,href])=><Link key={title} href={href} className="rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow"><div className="flex items-center justify-between"><div className="text-sm text-neutral-500">{title}</div><Icon className="h-4 w-4 text-neutral-400"/></div><div className="mt-2 text-2xl font-semibold">{Number(value).toLocaleString("es-PY")}</div></Link>)}</div>
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <Link href="/app/inventory" className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-1"><div className="flex items-center justify-between"><div><div className="text-sm text-neutral-500">Inventario</div><div className="mt-1 text-lg font-semibold">{lowStock} productos para revisar</div></div>{lowStock>0?<AlertTriangle className="h-5 w-5 text-amber-600"/>:<Boxes className="h-5 w-5 text-emerald-600"/>}</div><div className="mt-4 flex items-center gap-1 text-sm font-medium">Ver inventario <ArrowRight className="h-4 w-4"/></div></Link>
      <div className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-2"><div className="mb-4"><div className="text-sm text-neutral-500">Accesos rápidos</div><div className="text-lg font-semibold">Operación diaria</div></div><div className="grid gap-2 sm:grid-cols-2">{[["Nueva venta","/app/sales"],["Agregar producto","/app/products"],["Registrar cobro","/app/debts"],["Recibir compra","/app/purchases"]].map(([label,href])=><Link key={href} href={href} className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-neutral-50">{label}</Link>)}</div></div>
    </div>
  </div>;
}
