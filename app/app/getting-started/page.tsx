import Link from "next/link";
import { BookOpen, Building2, CheckCircle2, Package, ShoppingCart, Users, WalletCards } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { restartOnboardingAction } from "./actions";

const steps = [
  ["Conocé tu espacio", "Ubicá el panel principal, menú y accesos rápidos.", "/app", Building2],
  ["Creá tu primer cliente", "Guardá datos y empezá a construir la cuenta corriente.", "/app/customers", Users],
  ["Agregá productos y servicios", "Usá código, SKU o código de barras, precio y stock.", "/app/products/new", Package],
  ["Registrá una venta", "Contado, parcial o crédito desde un mismo flujo.", "/app/sales", ShoppingCart],
  ["Controlá cobros y deudas", "Revisá saldos, vencimientos y pagos.", "/app/debts", WalletCards],
  ["Seguí trabajando", "Volvé a esta guía cuando quieras.", "/app", CheckCircle2],
] as const;

export default async function GettingStartedPage() {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase.from("onboarding_progress").select("current_step,completed,skipped").eq("user_id", userId).maybeSingle();
  const currentStep = data?.current_step || 1;

  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><BookOpen className="h-3.5 w-3.5" /> Ayuda</div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Primeros pasos en LiaGo</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Una guía rápida para empezar a usar el sistema sin perderte entre los módulos.</p>
          </div>
          <form action={restartOnboardingAction}><button className="liago-btn-secondary">Ver guía interactiva otra vez</button></form>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {steps.map(([title, description, href, Icon], index) => {
            const n = index + 1;
            const done = Boolean(data?.completed) || n < currentStep;
            return (
              <Link key={title} href={href} className="liago-card group flex gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${done ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}><Icon className="h-6 w-6" /></div>
                <div><div className="text-xs font-bold uppercase tracking-wide text-slate-400">Paso {n}</div><h2 className="mt-1 font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
