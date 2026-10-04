import { WalletCards } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";

export default async function AdminPlansPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: subscriptions } = await supabase.from("subscriptions").select("plan,status").in("status", ["TRIALING", "ACTIVE", "PAST_DUE"]);

  const plans = ["FREE", "BASIC", "PRO", "BUSINESS"] as const;
  const counts = new Map(plans.map((plan) => [plan, subscriptions?.filter((item) => item.plan === plan).length ?? 0]));

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><WalletCards className="h-3.5 w-3.5" /> Suscripciones</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Planes</h1>
          <p className="mt-2 text-sm text-slate-500">Distribución actual de empresas por plan.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => <div key={plan} className="liago-card p-6"><div className="text-sm font-bold text-blue-700">{plan}</div><div className="mt-3 text-4xl font-extrabold text-slate-950">{counts.get(plan)}</div><div className="mt-1 text-xs text-slate-500">empresas</div></div>)}
        </div>
      </div>
    </div>
  );
}
