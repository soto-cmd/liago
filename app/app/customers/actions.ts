"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

function creditLimit(formData: FormData) {
  const raw = String(formData.get("credit_limit") || "0").replace(",", ".");
  return Math.max(0, Number(raw) || 0);
}

export async function createCustomerAction(formData: FormData) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/app/customers?error=required");

  const { data, error } = await supabase.from("customers").insert({
    organization_id: organizationId,
    customer_code: text(formData, "customer_code"),
    customer_type: formData.get("customer_type") === "COMPANY" ? "COMPANY" : "PERSON",
    name,
    tax_id: text(formData, "tax_id"),
    phone: text(formData, "phone"),
    whatsapp: text(formData, "whatsapp"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    city: text(formData, "city"),
    credit_limit: creditLimit(formData),
    notes: text(formData, "notes"),
  }).select("id").single();

  if (error || !data) redirect(`/app/customers?error=${error?.code === "23505" ? "duplicate_code" : "save"}`);
  revalidatePath("/app/customers");
  redirect(`/app/customers/${data.id}?created=1`);
}

export async function updateCustomerAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER", "SELLER", "CASHIER"].includes(role)) redirect("/app/customers?error=not_allowed");

  const customerId = String(formData.get("customer_id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(customerId) || !name || name.length > 150) redirect("/app/customers?error=required");

  const { data: updated, error } = await supabase.from("customers").update({
    customer_code: text(formData, "customer_code"),
    customer_type: formData.get("customer_type") === "COMPANY" ? "COMPANY" : "PERSON",
    name,
    tax_id: text(formData, "tax_id"),
    phone: text(formData, "phone"),
    whatsapp: text(formData, "whatsapp"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    city: text(formData, "city"),
    credit_limit: creditLimit(formData),
    notes: text(formData, "notes"),
  }).eq("id", customerId).eq("organization_id", organizationId).is("deleted_at", null).select("id").maybeSingle();

  if (error || !updated) redirect(`/app/customers/${customerId}?error=${error?.code === "23505" ? "duplicate_code" : "save"}`);
  revalidatePath("/app/customers");
  revalidatePath(`/app/customers/${customerId}`);
  redirect(`/app/customers/${customerId}?updated=1`);
}

export async function setCustomerStatusAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/customers?error=not_allowed");

  const customerId = String(formData.get("customer_id") || "");
  const requested = String(formData.get("status") || "ACTIVE");
  if (!["ACTIVE", "INACTIVE", "BLOCKED"].includes(requested)) redirect("/app/customers?error=status");
  const status = requested;
  if (!customerId) redirect("/app/customers?error=required");

  const { data, error } = await supabase.from("customers").update({ status }).eq("id", customerId).eq("organization_id", organizationId).is("deleted_at", null).select("id").maybeSingle();
  if (error || !data) redirect(`/app/customers/${customerId}?error=status`);
  revalidatePath("/app/customers");
  revalidatePath(`/app/customers/${customerId}`);
  redirect(`/app/customers/${customerId}?status_changed=1`);
}

export async function archiveCustomerAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN"].includes(role)) redirect("/app/customers?error=not_allowed");
  const customerId = String(formData.get("customer_id") || "").trim();
  const confirmation = String(formData.get("confirmation") || "").trim().toUpperCase();
  if (!/^[0-9a-f-]{36}$/i.test(customerId) || confirmation !== "ELIMINAR") {
    redirect("/app/customers?error=confirmation");
  }

  // Soft deletion hides the contact without affecting historical sales or accounting records.
  const { data, error } = await supabase.from("customers")
    .update({ deleted_at: new Date().toISOString(), status: "INACTIVE" })
    .eq("id", customerId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect(`/app/customers/${customerId}?error=archive`);
  revalidatePath("/app/customers");
  redirect("/app/customers?archived=1");
}
