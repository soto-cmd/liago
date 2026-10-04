"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/admin/require-platform-admin";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const raw = String(formData.get(key) || "").trim();
  if (!raw) return fallback;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) ? value : fallback;
}

export async function createAdminCompanyAction(formData: FormData) {
  const { supabase } = await requirePlatformAdmin(["SUPERADMIN", "ADMIN"]);
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/admin/companies?error=required");

  const { error } = await supabase.rpc("admin_create_organization", {
    p_name: name,
    p_legal_name: text(formData, "legal_name"),
    p_tax_id: text(formData, "tax_id"),
    p_phone: text(formData, "phone"),
    p_whatsapp: text(formData, "whatsapp"),
    p_email: text(formData, "email"),
    p_address: text(formData, "address"),
    p_city: text(formData, "city"),
    p_plan: String(formData.get("plan") || "FREE"),
  });

  if (error) redirect("/admin/companies?error=save");
  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  redirect("/admin/companies?created=1");
}

export async function updateCompanyStatusAction(formData: FormData) {
  const { supabase } = await requirePlatformAdmin(["SUPERADMIN", "ADMIN"]);
  const organizationId = String(formData.get("organization_id") || "");
  const status = String(formData.get("status") || "ACTIVE");
  if (!organizationId || !["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) redirect("/admin/companies?error=status");

  const { error } = await supabase.from("organizations").update({ status }).eq("id", organizationId);
  if (error) redirect("/admin/companies?error=status");
  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  revalidatePath("/app");
  redirect("/admin/companies?updated=status");
}

export async function updateCompanyPlanAction(formData: FormData) {
  const { supabase } = await requirePlatformAdmin(["SUPERADMIN", "ADMIN"]);
  const organizationId = String(formData.get("organization_id") || "");
  const plan = String(formData.get("plan") || "FREE");
  if (!organizationId || !["FREE", "BASIC", "PRO", "BUSINESS"].includes(plan)) redirect("/admin/companies?error=plan");

  const { error } = await supabase
    .from("subscriptions")
    .update({ plan })
    .eq("organization_id", organizationId)
    .in("status", ["TRIALING", "ACTIVE", "PAST_DUE"]);

  if (error) redirect("/admin/companies?error=plan");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/plans");
  revalidatePath("/app");
  redirect("/admin/companies?updated=plan");
}

export async function createAdminCustomerAction(formData: FormData) {
  const { supabase } = await requirePlatformAdmin(["SUPERADMIN", "ADMIN"]);
  const organizationId = String(formData.get("organization_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!organizationId || !name) redirect("/admin/customers?error=required");

  const { error } = await supabase.from("customers").insert({
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
    credit_limit: numberValue(formData, "credit_limit"),
    notes: text(formData, "notes"),
    status: "ACTIVE",
  });

  if (error) redirect(`/admin/customers?organization_id=${organizationId}&error=save`);
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath("/app/customers");
  redirect(`/admin/customers?organization_id=${organizationId}&created=1`);
}
