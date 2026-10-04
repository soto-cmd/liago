"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function cancelSaleAction(formData: FormData) {
  const { supabase, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/sales?error=not_allowed");

  const saleId = String(formData.get("sale_id") || "");
  const reason = String(formData.get("reason") || "").trim() || null;
  if (!saleId) redirect("/app/sales?error=required");

  const { error } = await supabase.rpc("cancel_sale", {
    p_sale_id: saleId,
    p_reason: reason,
  });

  if (error) redirect(`/app/sales/${saleId}?error=${encodeURIComponent(error.message.slice(0,100))}`);
  revalidatePath(`/app/sales/${saleId}`);
  revalidatePath("/app/sales");
  revalidatePath("/app/debts");
  revalidatePath("/app/payments");
  revalidatePath("/app/inventory");
  revalidatePath("/app/cash");
  revalidatePath("/app");
  redirect(`/app/sales/${saleId}?canceled=1`);
}
