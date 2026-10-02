import { getCurrentOrganization } from "@/lib/organizations/get-current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const membership = await getCurrentOrganization();

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 text-3xl font-semibold">Configuración</h1>
      <Card>
        <CardHeader>
          <CardTitle>Organización</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-neutral-100 p-4 text-xs">
            {JSON.stringify(membership, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
