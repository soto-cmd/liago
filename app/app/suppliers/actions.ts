"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

export async function createSupplierAction(formData: FormData) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/app/suppliers?error=required");

  const { error } = await supabase.from("suppliers").insert({
    organization_id: organizationId,
    name,
    tax_id: text(formData, "tax_id"),
    contact_name: text(formData, "contact_name"),
    phone: text(formData, "phone"),
    whatsapp: text(formData, "whatsapp"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    city: text(formData, "city"),
    notes: text(formData, "notes"),
  });

  if (error) redirect("/app/suppliers?error=save");
  revalidatePath("/app/suppliers");
  redirect("/app/suppliers?created=1");
}
