"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function createSaleAction(formData: FormData) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const itemsRaw = String(formData.get("items_json") || "[]");
  let items: unknown[] = [];
  try { items = JSON.parse(itemsRaw); } catch { redirect("/app/sales?error=items"); }
  if (!Array.isArray(items) || !items.length) redirect("/app/sales?error=items");

  const amountPaid = Number(String(formData.get("amount_paid") || "0").replace(",", ".")) || 0;
  const branchId = String(formData.get("branch_id") || "");
  const customerId = String(formData.get("customer_id") || "") || null;
  const saleType = String(formData.get("sale_type") || "CASH");
  const dueDate = String(formData.get("due_date") || "") || null;
  const paymentMethod = String(formData.get("payment_method") || "") || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  const { data, error } = await supabase.rpc("create_sale", {
    p_organization_id: organizationId,
    p_branch_id: branchId,
    p_customer_id: customerId,
    p_sale_type: saleType,
    p_amount_paid: amountPaid,
    p_payment_method: paymentMethod,
    p_due_date: dueDate,
    p_notes: notes,
    p_items: items,
  });

  if (error || !data) redirect(`/app/sales?error=${encodeURIComponent(error?.message.slice(0,80) || "save")}`);

  revalidatePath("/app/sales");
  revalidatePath("/app/debts");
  revalidatePath("/app/payments");
  revalidatePath("/app/inventory");
  revalidatePath("/app/cash");
  revalidatePath("/app");
  redirect(`/app/sales/${data}?created=1`);
}
