"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Building2, CheckCircle2, Package, ShoppingCart, Users, WalletCards, X } from "lucide-react";
import { completeOnboardingAction, setOnboardingStepAction, skipOnboardingAction } from "@/app/app/getting-started/actions";

type Props = { initialStep: number; isTrial?: boolean };

const steps = [
  { title: "Conocé tu espacio", text: "Este es el panel principal de LiaGo. Desde aquí vas a manejar tu negocio.", href: "/app", icon: Building2 },
  { title: "Creá tu primer cliente", text: "Guardá los datos de tus clientes y consultá después sus compras, pagos y saldo.", href: "/app/customers", icon: Users },
  { title: "Agregá un producto o servicio", text: "Podés usar código interno, SKU o código de barras y definir precio, costo y stock.", href: "/app/products/new", icon: Package },
  { title: "Registrá una venta", text: "Probá una venta al contado, parcial o a crédito. LiaGo actualizará la cuenta del cliente.", href: "/app/sales", icon: ShoppingCart },
  { title: "Revisá cobros y deudas", text: "Encontrá pagos pendientes, saldos y movimientos de cuenta corriente.", href: "/app/debts", icon: WalletCards },
  { title: "Listo para empezar", text: "Ya conocés lo esencial. Podés volver a esta guía cuando quieras desde Primeros pasos.", href: "/app/getting-started", icon: CheckCircle2 },
];

export function FirstUseOnboarding({ initialStep, isTrial = false }: Props) {
  const [step, setStep] = useState(Math.max(1, Math.min(6, initialStep || 1)));
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const current = steps[step - 1];
  const Icon = current.icon;

  if (!open) return null;

  function next() {
    if (step >= 6) {
      startTransition(async () => {
        await completeOnboardingAction();
        setOpen(false);
      });
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    startTransition(() => setOnboardingStepAction(nextStep));
  }

  function skip() {
    startTransition(async () => {
      await skipOnboardingAction();
      setOpen(false);
    });
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Primeros pasos · {step}/6</div>
              <h2 className="mt-2 text-2xl font-extrabold">{isTrial ? "Bienvenido a tu prueba de LiaGo" : "Bienvenido a LiaGo"}</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100">Te mostramos lo esencial en menos de dos minutos. Podés omitirlo y volver cuando quieras.</p>
            </div>
            <button onClick={skip} className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="Cerrar guía"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${(step / 6) * 100}%` }} /></div>
          <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700"><Icon className="h-6 w-6" /></div>
            <div>
              <h3 className="text-lg font-bold text-slate-950">{current.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{current.text}</p>
              <Link href={current.href} className="mt-3 inline-flex text-sm font-bold text-blue-700 hover:text-blue-800">Ir a esta sección →</Link>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={skip} disabled={pending} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Omitir por ahora</button>
            <button onClick={next} disabled={pending} className="liago-btn-primary justify-center">{step === 6 ? "Terminar guía" : "Siguiente"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
