import Link from "next/link";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";
import { updateAdminCompanyDetailsAction } from "../../actions";

export default async function EditAdminCompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase } = await requirePlatformAdmin(["SUPERADMIN", "ADMIN"]);
  const { id } = await params;
  const { error } = await searchParams;
  const { data: company } = await supabase
    .from("organizations")
    .select("id,name,legal_name,tax_id,phone,whatsapp,email,address,city,status")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!company) notFound();

  const fields = [
    { name: "name", label: "Nombre comercial", value: company.name, required: true },
    { name: "legal_name", label: "Razón social", value: company.legal_name },
    { name: "tax_id", label: "RUC / Documento", value: company.tax_id },
    { name: "phone", label: "Teléfono", value: company.phone },
    { name: "whatsapp", label: "WhatsApp", value: company.whatsapp },
    { name: "email", label: "Correo electrónico", value: company.email, type: "email" },
    { name: "city", label: "Ciudad", value: company.city },
    { name: "address", label: "Dirección", value: company.address },
  ];

  return (
    <main className="p-4 md:p-8 xl:p-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/companies" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a empresas
        </Link>
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="h-7 w-7 text-blue-700" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Editar empresa</h1>
            <p className="text-sm text-slate-500">Actualizá los datos de {company.name} sin perder su historial, usuarios o ventas.</p>
          </div>
        </div>
        {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {error === "required" ? "Ingresá un nombre comercial válido." : error === "email" ? "Ingresá un correo electrónico válido." : "No se pudieron guardar los cambios. Verificá los datos e intentá de nuevo."}
        </p>}
        <form action={updateAdminCompanyDetailsAction} className="liago-card grid gap-4 p-5 md:grid-cols-2 md:p-7">
          <input type="hidden" name="organization_id" value={company.id} />
          {fields.map((field) => (
            <label key={field.name} className={field.name === "name" || field.name === "address" ? "flex flex-col gap-1.5 md:col-span-2" : "flex flex-col gap-1.5"}>
              <span className="text-sm font-semibold text-slate-700">{field.label}{field.required ? " *" : ""}</span>
              <input
                className="liago-input"
                name={field.name}
                type={field.type ?? "text"}
                required={field.required}
                maxLength={field.name === "name" ? 150 : 255}
                defaultValue={field.value ?? ""}
                autoComplete="off"
              />
            </label>
          ))}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5 md:col-span-2">
            <Link href="/admin/companies" className="liago-btn-secondary">Cancelar</Link>
            <button type="submit" className="liago-btn-primary inline-flex items-center gap-2">
              <Save className="h-4 w-4" /> Guardar cambios
            </button>
          </div>
        </form>
        <p className="mt-4 text-xs text-slate-500">El plan y el estado se administran desde la lista de empresas.</p>
      </div>
    </main>
  );
}
