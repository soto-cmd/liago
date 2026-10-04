import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  Check,
  LifeBuoy,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

const plans = [
  {
    name: "FREE",
    monthly: "Gs. 0",
    annual: "Gs. 0",
    description: "Para empezar a ordenar un pequeño negocio sin costo.",
    highlighted: false,
    features: [
      "1 empresa",
      "1 usuario",
      "Productos y servicios",
      "Clientes y proveedores",
      "Ventas y caja",
      "Inventario básico",
      "Soporte desde LiaGo",
    ],
  },
  {
    name: "BASIC",
    monthly: "Gs. 69.000",
    annual: "Gs. 690.000/año",
    description: "Para emprendimientos que ya necesitan controlar toda su operación comercial.",
    highlighted: false,
    features: [
      "Todo lo incluido en FREE",
      "Hasta 3 usuarios",
      "Compras y gastos",
      "Cobranzas y cuenta corriente",
      "Reportes comerciales",
      "Mayor capacidad de productos y clientes",
      "Soporte estándar",
    ],
  },
  {
    name: "PRO",
    monthly: "Gs. 129.000",
    annual: "Gs. 1.290.000/año",
    description: "Para negocios en crecimiento que necesitan más control, usuarios y trazabilidad.",
    highlighted: true,
    features: [
      "Todo lo incluido en BASIC",
      "Hasta 10 usuarios",
      "Más sucursales",
      "Reportes avanzados",
      "Auditoría y trazabilidad",
      "Mayor capacidad operativa",
      "Soporte prioritario",
    ],
  },
  {
    name: "BUSINESS",
    monthly: "Gs. 229.000",
    annual: "Gs. 2.290.000/año",
    description: "Para empresas con varios equipos, sucursales o necesidades de administración más amplias.",
    highlighted: false,
    features: [
      "Todo lo incluido en PRO",
      "Hasta 25 usuarios",
      "Administración multiempresa",
      "Más sucursales y capacidad",
      "Permisos y control ampliados",
      "Atención personalizada",
      "Configuración según la operación",
    ],
  },
];

const comparison = [
  ["Productos y servicios", true, true, true, true],
  ["Clientes y proveedores", true, true, true, true],
  ["Ventas y caja", true, true, true, true],
  ["Inventario", "Básico", true, true, true],
  ["Compras y gastos", false, true, true, true],
  ["Cuenta corriente y cobranzas", false, true, true, true],
  ["Reportes avanzados", false, false, true, true],
  ["Auditoría y trazabilidad", false, false, true, true],
  ["Multiempresa avanzada", false, false, false, true],
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-emerald-600" />;
  if (value === false) return <span className="text-slate-300">—</span>;
  return <span className="text-xs font-semibold text-slate-600">{value}</span>;
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-lg font-black text-white shadow-sm">L</span>
            <div>
              <div className="font-extrabold tracking-tight">LiaGo</div>
              <div className="text-[11px] text-slate-500">Tu negocio en movimiento.</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#funciones" className="hover:text-blue-700">Funciones</a>
            <a href="#planes" className="hover:text-blue-700">Planes</a>
            <a href="#comparar" className="hover:text-blue-700">Comparar</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="liago-btn-secondary hidden sm:inline-flex">Iniciar sesión</Link>
            <Link href="/auth/sign-up" className="liago-btn-primary">Crear cuenta</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
            <ShieldCheck className="h-4 w-4" /> Gestión comercial segura y multiempresa
          </div>
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-[-0.04em] md:text-7xl">
            Administrá tu negocio desde un solo lugar.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Ventas, productos, servicios, clientes, inventario, caja, compras, gastos y reportes en una plataforma clara, pensada para negocios de Paraguay.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/sign-up" className="liago-btn-primary h-12 px-6 text-base">
              Empezar gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#planes" className="liago-btn-secondary h-12 px-6 text-base">Ver precios</a>
          </div>
          <p className="mt-4 text-sm text-slate-500">Plan FREE sin costo. Los planes pagos están expresados en guaraníes.</p>
        </div>

        <div id="funciones" className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,.08)] md:p-8">
          <div className="mb-6"><div className="text-sm font-bold text-blue-700">LiaGo</div><div className="mt-1 text-2xl font-extrabold">Tu operación, organizada</div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [ShoppingCart, "Ventas", "Contado, parcial y crédito"],
              [Boxes, "Inventario", "Stock y movimientos"],
              [Users, "Clientes", "Historial y cuenta corriente"],
              [BarChart3, "Reportes", "Información para decidir mejor"],
            ].map(([Icon, title, text]) => {
              const ItemIcon = Icon as typeof ShoppingCart;
              return (
                <div key={String(title)} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <ItemIcon className="h-5 w-5 text-blue-600" />
                  <div className="mt-3 font-bold">{String(title)}</div>
                  <div className="mt-1 text-sm text-slate-500">{String(text)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="planes" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-sm font-bold uppercase tracking-[.16em] text-blue-700">Planes LiaGo</div>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Un plan para cada etapa de tu negocio</h2>
            <p className="mt-4 text-slate-600">Empezá gratis y subí de plan cuando necesites más usuarios, capacidad y herramientas de gestión.</p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {plans.map((plan) => (
              <article key={plan.name} className={`relative rounded-3xl border p-6 ${plan.highlighted ? "border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-100" : "border-slate-200 bg-white"}`}>
                {plan.highlighted ? <div className="absolute -top-3 left-6 rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">Más recomendado</div> : null}
                <div className={`text-sm font-extrabold ${plan.highlighted ? "text-blue-100" : "text-blue-700"}`}>{plan.name}</div>
                <div className="mt-4 text-3xl font-extrabold">{plan.monthly}</div>
                <div className={`mt-1 text-sm ${plan.highlighted ? "text-blue-100" : "text-slate-500"}`}>por mes</div>
                <div className={`mt-2 text-xs font-semibold ${plan.highlighted ? "text-blue-100" : "text-emerald-700"}`}>{plan.annual}</div>
                <p className={`mt-5 min-h-20 text-sm leading-6 ${plan.highlighted ? "text-blue-50" : "text-slate-600"}`}>{plan.description}</p>
                <ul className="mt-5 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? "text-white" : "text-emerald-600"}`} /> <span>{feature}</span></li>
                  ))}
                </ul>
                <Link href="/auth/sign-up" className={`mt-7 flex h-11 items-center justify-center rounded-xl text-sm font-bold ${plan.highlighted ? "bg-white text-blue-700" : "bg-slate-950 text-white"}`}>
                  {plan.name === "FREE" ? "Empezar gratis" : "Elegir plan"}
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">Los precios mostrados son mensuales y referenciales para Paraguay. El plan anual representa un precio promocional equivalente a aproximadamente dos meses de ahorro frente al pago mensual.</p>
        </div>
      </section>

      <section id="comparar" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-8 max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-[.16em] text-blue-700">Comparación</div>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight">¿Qué cambia entre los planes?</h2>
          <p className="mt-3 text-slate-600">Las funciones esenciales están disponibles desde el inicio. Los planes superiores agregan capacidad, control y herramientas para equipos más grandes.</p>
        </div>
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50">
              <tr><th className="px-5 py-4 text-left">Función</th>{plans.map((plan) => <th key={plan.name} className="px-5 py-4 text-center font-extrabold">{plan.name}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparison.map(([label, ...values]) => (
                <tr key={String(label)}><td className="px-5 py-4 font-semibold text-slate-700">{String(label)}</td>{values.map((value, index) => <td key={`${String(label)}-${index}`} className="px-5 py-4 text-center"><FeatureValue value={value as boolean | string} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="text-3xl font-extrabold">Probá LiaGo con tu propio negocio.</div><p className="mt-2 max-w-2xl text-slate-400">Empezá con FREE. Cuando necesites más capacidad, podés pasar a BASIC, PRO o BUSINESS.</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/auth/sign-up" className="liago-btn-primary h-12 px-6">Crear cuenta</Link><Link href="/auth/login" className="inline-flex h-12 items-center rounded-xl border border-white/20 px-6 text-sm font-bold hover:bg-white/10">Ya tengo cuenta</Link></div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> LiaGo · Tu negocio en movimiento.</div>
          <div className="flex items-center gap-2"><LifeBuoy className="h-4 w-4" /> Soporte incluido desde la plataforma.</div>
        </div>
      </footer>
    </main>
  );
}
