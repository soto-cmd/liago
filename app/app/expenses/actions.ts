"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function recordExpenseAction(formData: FormData) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const amount = Number(String(formData.get("amount") || "0").replace(",", "."));
  const branchId = String(formData.get("branch_id") || "");
  const category = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!branchId || !category || !description || !(amount > 0)) redirect("/app/expenses?error=required");

  const { error } = await supabase.rpc("record_expense", {
    p_organization_id: organizationId,
    p_branch_id: branchId,
    p_category: category,
    p_description: description,
    p_amount: amount,
    p_payment_method: String(formData.get("payment_method") || "CASH"),
    p_supplier_id: String(formData.get("supplier_id") || "") || null,
    p_reference: String(formData.get("reference") || "").trim() || null,
    p_notes: String(formData.get("notes") || "").trim() || null,
  });
  if (error) redirect(`/app/expenses?error=${encodeURIComponent(error.message.slice(0,80))}`);
  revalidatePath("/app/expenses");
  revalidatePath("/app/cash");
  revalidatePath("/app");
  redirect("/app/expenses?created=1");
}
