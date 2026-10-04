"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function receivePurchaseAction(formData: FormData) {
  const { supabase, organizationId } = await requireActiveOrganization();
  let items: unknown[] = [];
  try { items = JSON.parse(String(formData.get("items_json") || "[]")); } catch { redirect("/app/purchases?error=items"); }
  if (!Array.isArray(items) || !items.length) redirect("/app/purchases?error=items");

  const { error } = await supabase.rpc("receive_purchase", {
    p_organization_id: organizationId,
    p_branch_id: String(formData.get("branch_id") || ""),
    p_supplier_id: String(formData.get("supplier_id") || ""),
    p_purchase_type: String(formData.get("purchase_type") || "CASH"),
    p_amount_paid: Number(String(formData.get("amount_paid") || "0").replace(",", ".")) || 0,
    p_due_date: String(formData.get("due_date") || "") || null,
    p_reference: String(formData.get("reference") || "").trim() || null,
    p_notes: String(formData.get("notes") || "").trim() || null,
    p_items: items,
  });

  if (error) redirect(`/app/purchases?error=${encodeURIComponent(error.message.slice(0,80))}`);
  revalidatePath("/app/purchases");
  revalidatePath("/app/inventory");
  revalidatePath("/app/products");
  revalidatePath("/app/cash");
  redirect("/app/purchases?created=1");
}
