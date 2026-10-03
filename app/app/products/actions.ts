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

function cleanItemType(value: FormDataEntryValue | null) {
  return value === "SERVICE" ? "SERVICE" : "PRODUCT";
}

export async function createProductAction(formData: FormData) {
  const { supabase, organizationId, userId } = await requireActiveOrganization();
  const itemType = cleanItemType(formData.get("item_type"));
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!code || !name) redirect("/app/products?error=required");

  const trackStock = itemType === "PRODUCT" && formData.get("track_stock") === "on";
  const openingStock = trackStock ? numberValue(formData, "opening_stock", 0) : 0;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      organization_id: organizationId,
      item_type: itemType,
      code,
      sku: text(formData, "sku"),
      barcode: text(formData, "barcode"),
      name,
      description: text(formData, "description"),
      category_id: text(formData, "category_id"),
      supplier_id: text(formData, "supplier_id"),
      unit: String(formData.get("unit") || "UN").trim().toUpperCase(),
      purchase_price: numberValue(formData, "purchase_price"),
      sale_price: numberValue(formData, "sale_price"),
      tax_rate: numberValue(formData, "tax_rate"),
      track_stock: trackStock,
      min_stock: numberValue(formData, "min_stock"),
      notes: text(formData, "notes"),
      status: "ACTIVE",
    })
    .select("id")
    .single();

  if (error || !product) {
    redirect(`/app/products?error=${error?.code === "23505" ? "duplicate_code" : "save"}`);
  }

  if (openingStock !== 0) {
    const { data: branch } = await supabase
      .from("branches")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_main", true)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .maybeSingle();

    if (branch) {
      const { error: movementError } = await supabase.from("inventory_movements").insert({
        organization_id: organizationId,
        branch_id: branch.id,
        product_id: product.id,
        movement_type: "OPENING",
        quantity: openingStock,
        unit_cost: numberValue(formData, "purchase_price"),
        notes: "Stock inicial",
        created_by: userId,
      });
      if (movementError) redirect(`/app/products/${product.id}?error=opening_stock`);
    }
  }

  revalidatePath("/app/products");
  revalidatePath("/app/inventory");
  redirect(`/app/products/${product.id}?created=1`);
}

export async function updateProductAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/products?error=not_allowed");

  const productId = String(formData.get("product_id") || "");
  const itemType = cleanItemType(formData.get("item_type"));
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!productId || !code || !name) redirect(`/app/products/${productId}?error=required`);

  const { error } = await supabase
    .from("products")
    .update({
      item_type: itemType,
      code,
      sku: text(formData, "sku"),
      barcode: text(formData, "barcode"),
      name,
      description: text(formData, "description"),
      category_id: text(formData, "category_id"),
      supplier_id: text(formData, "supplier_id"),
      unit: String(formData.get("unit") || "UN").trim().toUpperCase(),
      purchase_price: numberValue(formData, "purchase_price"),
      sale_price: numberValue(formData, "sale_price"),
      tax_rate: numberValue(formData, "tax_rate"),
      track_stock: itemType === "PRODUCT" && formData.get("track_stock") === "on",
      min_stock: numberValue(formData, "min_stock"),
      notes: text(formData, "notes"),
    })
    .eq("id", productId)
    .eq("organization_id", organizationId);

  if (error) redirect(`/app/products/${productId}?error=${error.code === "23505" ? "duplicate_code" : "save"}`);
  revalidatePath("/app/products");
  revalidatePath(`/app/products/${productId}`);
  redirect(`/app/products/${productId}?updated=1`);
}

export async function setProductStatusAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/products?error=not_allowed");

  const productId = String(formData.get("product_id") || "");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  if (!productId) redirect("/app/products?error=required");

  const { error } = await supabase.from("products").update({ status }).eq("id", productId).eq("organization_id", organizationId);
  if (error) redirect(`/app/products/${productId}?error=status`);
  revalidatePath("/app/products");
  revalidatePath(`/app/products/${productId}`);
  redirect(`/app/products/${productId}?status_changed=1`);
}
