"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function cancelPaymentAction(formData: FormData) {
  const { supabase, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/payments?error=not_allowed");

  const paymentId = String(formData.get("payment_id") || "");
  const reason = String(formData.get("reason") || "").trim() || null;
  if (!paymentId) redirect("/app/payments?error=required");

  const { error } = await supabase.rpc("cancel_payment", {
    p_payment_id: paymentId,
    p_reason: reason,
  });

  if (error) redirect(`/app/payments?error=${encodeURIComponent(error.message.slice(0,100))}`);
  revalidatePath("/app/payments");
  revalidatePath("/app/debts");
  revalidatePath("/app/sales");
  revalidatePath("/app/cash");
  revalidatePath("/app");
  redirect("/app/payments?canceled=1");
}
