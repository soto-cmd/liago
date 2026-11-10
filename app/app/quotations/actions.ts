"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function createQuotationAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  if (!["OWNER","ADMIN","MANAGER","SELLER","CASHIER"].includes(role)) redirect("/app/quotations?error=permission");
  const raw = String(formData.get("items_json") || "[]");
  let items: unknown;
  try { items = JSON.parse(raw); } catch { redirect("/app/quotations?error=items"); }
  if (!Array.isArray(items) || items.length < 1 || items.length > 60) redirect("/app/quotations?error=items");
  const customerId = String(formData.get("customer_id") || "");
  if (!/^[a-f0-9-]{36}$/i.test(customerId)) redirect("/app/quotations?error=customer");
  const deposit = Number(formData.get("deposit") || 0);
  if (!Number.isFinite(deposit) || deposit < 0) redirect("/app/quotations?error=deposit");
  const date = String(formData.get("event_date") || "");
  const { data, error } = await supabase.rpc("create_quotation_detailed", {
    p_organization_id: organizationId, p_customer_id: customerId, p_items: items,
    p_event_name: String(formData.get("event_name") || "").trim() || null,
    p_event_date: date || null,
    p_event_location: String(formData.get("event_location") || "").trim() || null,
    p_notes: String(formData.get("notes") || "").trim() || null,
    p_deposit: deposit,
    p_event_time: String(formData.get("event_time") || "").trim() || null,
    p_included_services: String(formData.get("included_services") || "").trim() || null,
    p_payment_terms: String(formData.get("payment_terms") || "").trim() || null,
    p_payment_methods: String(formData.get("payment_methods") || "").trim() || null,
    p_bank_details: String(formData.get("bank_details") || "").trim() || null,
  });
  if (error || !data) {
    console.error("create_quotation:", error?.code, error?.message);
    redirect("/app/quotations?error=save");
  }
  revalidatePath("/app/quotations");
  redirect("/app/quotations/"+data+"?created=1");
}
