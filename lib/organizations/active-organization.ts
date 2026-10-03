import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export async function requireActiveOrganization() {
  const { supabase, userId } = await requireUser();
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("active_organization_id")?.value;

  if (!organizationId) {
    redirect("/app/organizations");
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, name, currency)")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    redirect("/app/organizations");
  }

  return {
    supabase,
    userId,
    organizationId,
    role: data.role as string,
    organization: data.organizations as unknown as {
      id: string;
      name: string;
      currency: string;
    },
  };
}
