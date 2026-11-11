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

export async function updatePaymentDocumentAction(formData: FormData) {
  const {supabase,organizationId,role}=await requireActiveOrganization();
  const id=String(formData.get("payment_id")||"");
  if (!["OWNER","ADMIN","MANAGER"].includes(role) || !/^[0-9a-f-]{36}$/i.test(id))
    redirect("/app/payments?error=not_allowed");
  const paidDate=String(formData.get("paid_date")||"");
  const reference=String(formData.get("reference")||"").trim();
  const notes=String(formData.get("notes")||"").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidDate) || reference.length>250 || notes.length>2000)
    redirect("/app/payments/"+id+"?error=invalid");
  const {error}=await supabase.rpc("update_payment_document",{
    p_organization_id:organizationId,p_payment_id:id,
    p_paid_at:paidDate+"T12:00:00-03:00",p_reference:reference||null,p_notes:notes||null
  });
  if(error) {
    console.error("update_payment_document",error.code,error.message);
    redirect("/app/payments/"+id+"?error=update");
  }
  revalidatePath("/app/payments");
  revalidatePath("/app/payments/"+id);
  revalidatePath("/app/reports");
  redirect("/app/payments/"+id+"?updated=1");
}
