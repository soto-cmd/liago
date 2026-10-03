"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function adjustInventoryAction(formData: FormData) {
  const { supabase, organizationId, userId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/inventory?error=not_allowed");

  const branchId = String(formData.get("branch_id") || "");
  const productId = String(formData.get("product_id") || "");
  const direction = String(formData.get("direction") || "IN");
  const raw = Number(String(formData.get("quantity") || "0").replace(",", "."));
  const quantity = Math.abs(raw);
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!branchId || !productId || !(quantity > 0)) redirect("/app/inventory?error=required");

  const { data: product } = await supabase
    .from("products")
    .select("id,purchase_price,track_stock,item_type")
    .eq("id", productId)
    .eq("organization_id", organizationId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .maybeSingle();

  if (!product || !product.track_stock || product.item_type !== "PRODUCT") redirect("/app/inventory?error=product");

  const { error } = await supabase.from("inventory_movements").insert({
    organization_id: organizationId,
    branch_id: branchId,
    product_id: productId,
    movement_type: direction === "OUT" ? "ADJUSTMENT_OUT" : "ADJUSTMENT_IN",
    quantity: direction === "OUT" ? -quantity : quantity,
    unit_cost: product.purchase_price,
    notes: notes || (direction === "OUT" ? "Ajuste de salida" : "Ajuste de entrada"),
    created_by: userId,
  });

  if (error) redirect(`/app/inventory?error=${encodeURIComponent(error.message.slice(0,80))}`);
  revalidatePath("/app/inventory");
  revalidatePath(`/app/products/${productId}`);
  redirect("/app/inventory?adjusted=1");
}
