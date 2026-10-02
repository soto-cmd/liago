import { redirect } from "next/navigation";
import { getCurrentOrganization } from "@/lib/organizations/get-current";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const membership = await getCurrentOrganization();

  if (!membership?.organizations) {
    redirect("/onboarding");
  }

  const organization = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="text-sm text-neutral-500">Empresa actual</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {organization?.name || "Mi empresa"}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Ventas de hoy", "Fase 2"],
          ["Cobros del día", "Fase 2"],
          ["Saldo de caja", "Fase 3"],
          ["Pendiente de cobro", "Fase 2"]
        ].map(([title, value]) => (
          <Card key={title}>
            <CardHeader>
              <CardDescription>{title}</CardDescription>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fase 1 activa</CardTitle>
          <CardDescription>
            Autenticación, organizaciones, usuarios/roles, RLS, sucursales base,
            suscripciones y auditoría.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            El siguiente bloque funcional es Clientes + Productos + Ventas + Pagos + Cuenta corriente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
