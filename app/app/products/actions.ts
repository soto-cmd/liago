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

export async function createProductAction(formData: FormData) {
  const { supabase, organizationId, userId } = await requireActiveOrganization();
  const itemType = String(formData.get("item_type") || "PRODUCT");
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!code || !name) {
    redirect("/app/products?error=required");
  }

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
    const duplicate = error?.code === "23505";
    redirect(`/app/products?error=${duplicate ? "duplicate_code" : "save"}`);
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
      await supabase.from("inventory_movements").insert({
        organization_id: organizationId,
        branch_id: branch.id,
        product_id: product.id,
        movement_type: "OPENING",
        quantity: openingStock,
        unit_cost: numberValue(formData, "purchase_price"),
        notes: "Stock inicial",
        created_by: userId,
      });
    }
  }

  revalidatePath("/app/products");
  revalidatePath("/app/inventory");
  redirect("/app/products?created=1");
}
