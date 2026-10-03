"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

export async function createCustomerAction(formData: FormData) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/app/customers?error=required");

  const creditRaw = String(formData.get("credit_limit") || "0").replace(",", ".");
  const creditLimit = Math.max(0, Number(creditRaw) || 0);

  const { error } = await supabase.from("customers").insert({
    organization_id: organizationId,
    customer_code: text(formData, "customer_code"),
    customer_type: String(formData.get("customer_type") || "PERSON"),
    name,
    tax_id: text(formData, "tax_id"),
    phone: text(formData, "phone"),
    whatsapp: text(formData, "whatsapp"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    city: text(formData, "city"),
    credit_limit: creditLimit,
    notes: text(formData, "notes"),
  });

  if (error) {
    redirect(`/app/customers?error=${error.code === "23505" ? "duplicate_code" : "save"}`);
  }

  revalidatePath("/app/customers");
  redirect("/app/customers?created=1");
}
