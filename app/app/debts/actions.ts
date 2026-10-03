"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function recordDebtPaymentAction(formData: FormData) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const branchId = String(formData.get("branch_id") || "");
  const customerId = String(formData.get("customer_id") || "");
  const debtId = String(formData.get("debt_id") || "");
  const amount = Number(String(formData.get("amount") || "0").replace(",", "."));
  const paymentMethod = String(formData.get("payment_method") || "CASH");
  const reference = String(formData.get("reference") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!branchId || !customerId || !debtId || !(amount > 0)) redirect("/app/debts?error=required");

  const { error } = await supabase.rpc("record_customer_payment", {
    p_organization_id: organizationId,
    p_branch_id: branchId,
    p_customer_id: customerId,
    p_debt_id: debtId,
    p_amount: amount,
    p_payment_method: paymentMethod,
    p_reference: reference,
    p_notes: notes,
  });

  if (error) redirect(`/app/debts?error=${encodeURIComponent(error.message.slice(0,80))}`);
  revalidatePath("/app/debts");
  revalidatePath("/app/payments");
  revalidatePath("/app/cash");
  redirect("/app/debts?paid=1");
}
