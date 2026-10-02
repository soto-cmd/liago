import { requireUser } from "@/lib/auth/require-user";
import { setActiveOrganizationAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      organization_id,
      role,
      organizations (
        id,
        name,
        slug,
        currency
      )
    `)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-semibold">Mis empresas</h1>
      <p className="mt-2 text-neutral-500">
        El cambio de empresa se valida en servidor antes de modificar el espacio activo.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {(data || []).map((membership) => {
          const organization = Array.isArray(membership.organizations)
            ? membership.organizations[0]
            : membership.organizations;

          return (
            <Card key={membership.organization_id}>
              <CardHeader>
                <CardTitle>{organization?.name || "Empresa"}</CardTitle>
                <CardDescription>Rol: {membership.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={setActiveOrganizationAction}>
                  <input type="hidden" name="organizationId" value={membership.organization_id} />
                  <Button type="submit">Usar esta empresa</Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
