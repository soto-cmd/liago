import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { OrganizationForm } from "@/components/onboarding/organization-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { supabase, userId } = await requireUser();

  const { data: existing } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect("/app");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Crear tu empresa</CardTitle>
          <CardDescription>
            Este será el espacio privado donde vivirán los datos de tu negocio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationForm />
        </CardContent>
      </Card>
    </main>
  );
}
