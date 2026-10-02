import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm">
            <ShieldCheck className="h-4 w-4" />
            Gestión multiempresa segura
          </div>

          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
            Una sola plataforma.
            <br />
            Cada empresa, su propio espacio.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-neutral-600">
            LiaGo te permite administrar múltiples negocios sin mezclar
            clientes, ventas, pagos ni información privada.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/auth/sign-up"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-neutral-950 px-5 text-sm font-medium text-white"
            >
              Crear cuenta <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 text-sm font-medium"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            ["Multiempresa", "Cada registro comercial queda asociado a una organización."],
            ["Multiusuario", "Propietarios, administradores, gerentes, vendedores y cajeros."],
            ["Escalable", "Preparado para planes, sucursales y nuevos módulos."]
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-6">
              <Building2 className="mb-4 h-5 w-5" />
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-neutral-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
