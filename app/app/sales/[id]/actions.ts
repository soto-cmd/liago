"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function updateSaleDateAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) redirect("/app/sales?error=not_allowed");

  const saleId = String(formData.get("sale_id") || "");
  const saleDate = String(formData.get("sale_date") || "");
  if (!saleId || !/^\d{4}-\d{2}-\d{2}$/.test(saleDate)) redirect(`/app/sales/${saleId}?error=invalid_date`);

  const soldAt = `${saleDate}T12:00:00-03:00`;
  const { error } = await supabase
    .from("sales")
    .update({ sold_at: soldAt })
    .eq("id", saleId)
    .eq("organization_id", organizationId);

  if (error) redirect(`/app/sales/${saleId}?error=${encodeURIComponent(error.message.slice(0,100))}`);
  revalidatePath(`/app/sales/${saleId}`);
  revalidatePath("/app/sales");
  revalidatePath("/app/reports");
  revalidatePath("/app");
  redirect(`/app/sales/${saleId}?date_updated=1`);
}

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
