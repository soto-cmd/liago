import { Check, WalletCards } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";

const plans = [
  { name: "FREE", price: "Gs. 0", users: "1 usuario", summary: "Inicio y prueba", features: ["Productos y servicios", "Clientes y proveedores", "Ventas y caja", "Inventario básico"] },
  { name: "BASIC", price: "Gs. 69.000", users: "Hasta 3 usuarios", summary: "Emprendimientos activos", features: ["Todo FREE", "Compras y gastos", "Cobranzas", "Reportes comerciales"] },
  { name: "PRO", price: "Gs. 129.000", users: "Hasta 10 usuarios", summary: "Negocios en crecimiento", features: ["Todo BASIC", "Más sucursales", "Reportes avanzados", "Auditoría y trazabilidad"] },
  { name: "BUSINESS", price: "Gs. 229.000", users: "Hasta 25 usuarios", summary: "Operaciones más amplias", features: ["Todo PRO", "Multiempresa avanzada", "Mayor capacidad", "Atención personalizada"] },
] as const;

export default async function AdminPlansPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: subscriptions } = await supabase.from("subscriptions").select("plan,status").in("status", ["TRIALING", "ACTIVE", "PAST_DUE"]);
  const counts = new Map(plans.map((plan) => [plan.name, subscriptions?.filter((item) => item.plan === plan.name).length ?? 0]));

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8"><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><WalletCards className="h-3.5 w-3.5" /> Suscripciones</div><h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Planes</h1><p className="mt-2 text-sm text-slate-500">Precios vigentes publicados y distribución actual de empresas.</p></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => <article key={plan.name} className={`liago-card p-6 ${plan.name === "PRO" ? "ring-2 ring-blue-500" : ""}`}>
            <div className="flex items-start justify-between"><div><div className="text-sm font-extrabold text-blue-700">{plan.name}</div><div className="mt-2 text-2xl font-extrabold text-slate-950">{plan.price}<span className="text-sm font-medium text-slate-400">/mes</span></div></div><div className="rounded-xl bg-slate-100 px-3 py-2 text-center"><div className="text-xl font-extrabold text-slate-950">{counts.get(plan.name)}</div><div className="text-[10px] uppercase text-slate-500">empresas</div></div></div>
            <div className="mt-4 text-sm font-bold text-slate-700">{plan.summary}</div><div className="mt-1 text-xs text-slate-500">{plan.users}</div>
            <ul className="mt-5 space-y-2">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}</ul>
          </article>)}
        </div>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Estos precios coinciden con la portada pública actual. Los límites todavía deben implementarse técnicamente antes de usarlos como restricciones automáticas.</div>
      </div>
    </div>
  );
}
