import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/require-user";

export async function getCurrentOrganization() {
  const { supabase, userId } = await requireUser();
  const cookieStore = await cookies();
  const selectedOrganizationId = cookieStore.get("active_organization_id")?.value;

  const baseQuery = supabase
    .from("organization_members")
    .select(`
      organization_id,
      role,
      organizations (
        id,
        name,
        slug,
        logo_url,
        currency,
        primary_color
      )
    `)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null);

  if (selectedOrganizationId) {
    const { data: selected, error: selectedError } = await baseQuery
      .eq("organization_id", selectedOrganizationId)
      .limit(1)
      .maybeSingle();

    if (selectedError) {
      throw new Error(selectedError.message);
    }

    if (selected) return selected;
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      organization_id,
      role,
      organizations (
        id,
        name,
        slug,
        logo_url,
        currency,
        primary_color
      )
    `)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
