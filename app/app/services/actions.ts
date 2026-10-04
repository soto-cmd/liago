"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

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

function generatedServiceCode() {
  return `SERV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function billingUnit(value: FormDataEntryValue | null) {
  const allowed = ["SERVICE", "HOUR", "SESSION", "DAY", "VISIT", "PROJECT"];
  const unit = String(value || "SERVICE").toUpperCase();
  return allowed.includes(unit) ? unit : "SERVICE";
}

export async function createServiceAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/services?error=not_allowed");

  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim() || generatedServiceCode();
  if (!name) redirect("/app/services/new?error=required");

  const { data, error } = await supabase.from("products").insert({
    organization_id: organizationId,
    item_type: "SERVICE",
    code,
    name,
    description: text(formData, "description"),
    category_id: text(formData, "category_id"),
    supplier_id: null,
    sku: null,
    barcode: null,
    unit: "SERVICIO",
    purchase_price: numberValue(formData, "purchase_price"),
    sale_price: numberValue(formData, "sale_price"),
    tax_rate: numberValue(formData, "tax_rate"),
    track_stock: false,
    min_stock: 0,
    service_duration_minutes: numberValue(formData, "service_duration_minutes", 60),
    service_billing_unit: billingUnit(formData.get("service_billing_unit")),
    service_responsible_name: text(formData, "service_responsible_name"),
    service_price_variable: formData.get("service_price_variable") === "on",
    service_requires_booking: formData.get("service_requires_booking") === "on",
    notes: text(formData, "notes"),
    status: "ACTIVE",
  }).select("id").single();

  if (error || !data) redirect(`/app/services/new?error=${error?.code === "23505" ? "duplicate_code" : "save"}`);
  revalidatePath("/app/services");
  revalidatePath("/app/products");
  redirect(`/app/services/${data.id}?created=1`);
}

export async function updateServiceAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/services?error=not_allowed");

  const id = String(formData.get("service_id") || "");
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim() || generatedServiceCode();
  if (!id || !name) redirect(`/app/services/${id}?error=required`);

  const { error } = await supabase.from("products").update({
    code,
    name,
    description: text(formData, "description"),
    category_id: text(formData, "category_id"),
    purchase_price: numberValue(formData, "purchase_price"),
    sale_price: numberValue(formData, "sale_price"),
    tax_rate: numberValue(formData, "tax_rate"),
    service_duration_minutes: numberValue(formData, "service_duration_minutes", 60),
    service_billing_unit: billingUnit(formData.get("service_billing_unit")),
    service_responsible_name: text(formData, "service_responsible_name"),
    service_price_variable: formData.get("service_price_variable") === "on",
    service_requires_booking: formData.get("service_requires_booking") === "on",
    notes: text(formData, "notes"),
    item_type: "SERVICE",
    supplier_id: null,
    sku: null,
    barcode: null,
    unit: "SERVICIO",
    track_stock: false,
    min_stock: 0,
  }).eq("id", id).eq("organization_id", organizationId).eq("item_type", "SERVICE");

  if (error) redirect(`/app/services/${id}?error=${error.code === "23505" ? "duplicate_code" : "save"}`);
  revalidatePath("/app/services");
  revalidatePath(`/app/services/${id}`);
  redirect(`/app/services/${id}?updated=1`);
}

export async function setServiceStatusAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/services?error=not_allowed");
  const id = String(formData.get("service_id") || "");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  if (!id) redirect("/app/services?error=required");
  const { error } = await supabase.from("products").update({ status }).eq("id", id).eq("organization_id", organizationId).eq("item_type", "SERVICE");
  if (error) redirect(`/app/services/${id}?error=status`);
  revalidatePath("/app/services");
  revalidatePath(`/app/services/${id}`);
  redirect(`/app/services/${id}?status_changed=1`);
}
