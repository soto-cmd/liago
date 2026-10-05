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

export async function deleteSaleAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER", "ADMIN"].includes(role)) redirect("/app/sales?error=not_allowed");

  const saleId = String(formData.get("sale_id") || "");
  const confirmation = String(formData.get("confirmation") || "").trim().toUpperCase();
  if (!saleId || confirmation !== "ELIMINAR") redirect(`/app/sales/${saleId}?error=confirmation_required`);

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("id,sale_number,status")
    .eq("id", saleId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (saleError || !sale) redirect("/app/sales?error=not_found");
  if (sale.status !== "CANCELED") redirect(`/app/sales/${saleId}?error=cancel_first`);

  const { data: debts } = await supabase
    .from("debts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("sale_id", saleId);

  const { data: payments } = await supabase
    .from("payments")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("reference", String(sale.sale_number))
    .eq("notes", "Cobro de venta");

  const debtIds = (debts ?? []).map((row) => row.id);
  const paymentIds = (payments ?? []).map((row) => row.id);

  if (debtIds.length) {
    const { error } = await supabase.from("payment_allocations").delete().in("debt_id", debtIds).eq("organization_id", organizationId);
    if (error) redirect(`/app/sales/${saleId}?error=${encodeURIComponent(error.message.slice(0,100))}`);
  }
  if (paymentIds.length) {
    const { error: allocError } = await supabase.from("payment_allocations").delete().in("payment_id", paymentIds).eq("organization_id", organizationId);
    if (allocError) redirect(`/app/sales/${saleId}?error=${encodeURIComponent(allocError.message.slice(0,100))}`);
    const { error: accountPaymentError } = await supabase.from("customer_account_entries").delete().in("reference_id", paymentIds).eq("organization_id", organizationId);
    if (accountPaymentError) redirect(`/app/sales/${saleId}?error=${encodeURIComponent(accountPaymentError.message.slice(0,100))}`);
    const { error: paymentError } = await supabase.from("payments").delete().in("id", paymentIds).eq("organization_id", organizationId);
    if (paymentError) redirect(`/app/sales/${saleId}?error=${encodeURIComponent(paymentError.message.slice(0,100))}`);
  }

  const deletions = [
    supabase.from("customer_account_entries").delete().eq("organization_id", organizationId).eq("reference_id", saleId),
    supabase.from("cash_movements").delete().eq("organization_id", organizationId).eq("reference_id", saleId),
    supabase.from("inventory_movements").delete().eq("organization_id", organizationId).eq("reference_id", saleId),
    supabase.from("debts").delete().eq("organization_id", organizationId).eq("sale_id", saleId),
    supabase.from("sale_items").delete().eq("organization_id", organizationId).eq("sale_id", saleId),
  ];

  for (const deletion of deletions) {
    const { error } = await deletion;
    if (error) redirect(`/app/sales/${saleId}?error=${encodeURIComponent(error.message.slice(0,100))}`);
  }

  const { error: deleteError } = await supabase
    .from("sales")
    .delete()
    .eq("id", saleId)
    .eq("organization_id", organizationId);

  if (deleteError) redirect(`/app/sales/${saleId}?error=${encodeURIComponent(deleteError.message.slice(0,100))}`);

  revalidatePath("/app/sales");
  revalidatePath("/app/debts");
  revalidatePath("/app/payments");
  revalidatePath("/app/inventory");
  revalidatePath("/app/cash");
  revalidatePath("/app/reports");
  revalidatePath("/app");
  redirect("/app/sales?deleted=1");
}
