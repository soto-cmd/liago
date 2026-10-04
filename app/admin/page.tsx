import Link from "next/link";
import { Building2, Package2, ShieldCheck, Users } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";

export default async function AdminDashboardPage() {
  const { supabase } = await requirePlatformAdmin();

  const [
    { count: companies },
    { count: customers },
    { count: products },
    { count: members },
  ] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("customers").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("products").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("organization_members").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  const cards = [
    ["Empresas", companies ?? 0, Building2, "/admin/companies"],
    ["Clientes", customers ?? 0, Users, "/admin/customers"],
    ["Productos", products ?? 0, Package2, "/app/products"],
    ["Usuarios en empresas", members ?? 0, ShieldCheck, "/admin/companies"],
  ] as const;

  return (
    <div className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"><ShieldCheck className="h-3.5 w-3.5" /> Administración de plataforma</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">LiaGo Admin</h1>
          <p className="mt-2 text-sm text-slate-500">Empresas, clientes, usuarios, planes y actividad general de la plataforma.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, Icon, href]) => (
            <Link key={label} href={href} className="liago-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div><div className="text-sm font-semibold text-slate-500">{label}</div><div className="mt-3 text-3xl font-extrabold text-slate-950">{value}</div></div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Link href="/admin/companies" className="liago-card p-6"><div className="text-sm font-semibold text-blue-700">Gestión central</div><div className="mt-2 text-xl font-extrabold text-slate-950">Empresas</div><p className="mt-2 text-sm leading-6 text-slate-500">Creá nuevas empresas, administrá su estado, plan y posteriormente asigná propietarios y usuarios.</p></Link>
          <Link href="/admin/customers" className="liago-card p-6"><div className="text-sm font-semibold text-blue-700">Vista global</div><div className="mt-2 text-xl font-extrabold text-slate-950">Clientes por empresa</div><p className="mt-2 text-sm leading-6 text-slate-500">Consultá y agregá clientes comerciales seleccionando siempre la empresa a la que pertenecen.</p></Link>
        </div>
      </div>
    </div>
  );
}
