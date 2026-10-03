"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function openCashAction(formData: FormData) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const branchId = String(formData.get("branch_id") || "");
  const openingAmount = Number(String(formData.get("opening_amount") || "0").replace(",", ".")) || 0;
  const notes = String(formData.get("notes") || "").trim() || null;
  if (!branchId) redirect("/app/cash?error=branch");
  const { error } = await supabase.rpc("open_cash_session", { p_organization_id:organizationId, p_branch_id:branchId, p_opening_amount:openingAmount, p_notes:notes });
  if (error) redirect(`/app/cash?error=${encodeURIComponent(error.message.slice(0,80))}`);
  revalidatePath("/app/cash");
  redirect("/app/cash?opened=1");
}

export async function closeCashAction(formData: FormData) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const sessionId = String(formData.get("session_id") || "");
  const closingAmount = Number(String(formData.get("closing_amount") || "0").replace(",", "."));
  const notes = String(formData.get("notes") || "").trim() || null;
  if (!sessionId || !Number.isFinite(closingAmount)) redirect("/app/cash?error=required");
  const { error } = await supabase.rpc("close_cash_session", { p_organization_id:organizationId, p_cash_session_id:sessionId, p_closing_amount:closingAmount, p_notes:notes });
  if (error) redirect(`/app/cash?error=${encodeURIComponent(error.message.slice(0,80))}`);
  revalidatePath("/app/cash");
  redirect("/app/cash?closed=1");
}
