"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function adjustInventoryAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/inventory?error=not_allowed");

  const branchId = String(formData.get("branch_id") || "");
  const productId = String(formData.get("product_id") || "");
  const direction = String(formData.get("direction") || "IN") === "OUT" ? "OUT" : "IN";
  const raw = Number(String(formData.get("quantity") || "0").replace(",", "."));
  const quantity = Math.abs(raw);
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!branchId || !productId || !(quantity > 0)) redirect("/app/inventory?error=required");

  const { error } = await supabase.rpc("adjust_inventory", {
    p_organization_id: organizationId,
    p_branch_id: branchId,
    p_product_id: productId,
    p_direction: direction,
    p_quantity: quantity,
    p_notes: notes,
  });

  if (error) redirect(`/app/inventory?error=${encodeURIComponent(error.message.slice(0,80))}`);
  revalidatePath("/app/inventory");
  revalidatePath(`/app/products/${productId}`);
  revalidatePath("/app");
  redirect("/app/inventory?adjusted=1");
}
