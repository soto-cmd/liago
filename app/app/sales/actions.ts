"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

type SalePayloadItem = {
  quantity?: number;
  unit_price?: number;
  discount?: number;
  tax_rate?: number;
};

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function cashTotal(items: SalePayloadItem[]) {
  return items.reduce((sum, item) => {
    const quantity = Math.max(Number(item.quantity) || 0, 0);
    const price = Math.max(Number(item.unit_price) || 0, 0);
    const subtotal = round2(quantity * price);
    const discount = Math.min(Math.max(Number(item.discount) || 0, 0), subtotal);
    const taxRate = Math.max(Number(item.tax_rate) || 0, 0);
    const tax = round2((subtotal - discount) * taxRate / 100);
    return sum + subtotal - discount + tax;
  }, 0);
}

function errorCode(message?: string) {
  const value = (message || "").toLowerCase();
  if (value.includes("customer required")) return "customer_required";
  if (value.includes("cash sale must be fully paid")) return "cash_payment";
  if (value.includes("partial sale requires")) return "partial_payment";
  if (value.includes("credit sale cannot")) return "credit_payment";
  if (value.includes("credit limit")) return "credit_limit";
  if (value.includes("invalid branch")) return "branch";
  if (value.includes("sale requires items") || value.includes("invalid quantity")) return "items";
  return "save";
}

export async function createSaleAction(formData: FormData) {
  const { supabase, organizationId } = await requireActiveOrganization();
  const itemsRaw = String(formData.get("items_json") || "[]");
  let items: SalePayloadItem[] = [];
  try { items = JSON.parse(itemsRaw) as SalePayloadItem[]; } catch { redirect("/app/sales?error=items"); }
  if (!Array.isArray(items) || !items.length) redirect("/app/sales?error=items");

  const branchId = String(formData.get("branch_id") || "");
  const customerId = String(formData.get("customer_id") || "") || null;
  const saleType = String(formData.get("sale_type") || "CASH");
  const dueDate = String(formData.get("due_date") || "") || null;
  const paymentMethod = String(formData.get("payment_method") || "") || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if ((saleType === "PARTIAL" || saleType === "CREDIT") && !customerId) {
    redirect("/app/sales?error=customer_required");
  }

  const enteredAmount = Number(String(formData.get("amount_paid") || "0").replace(",", ".")) || 0;
  const amountPaid = saleType === "CASH" ? cashTotal(items) : saleType === "CREDIT" ? 0 : enteredAmount;

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

  if (error || !data) redirect(`/app/sales?error=${errorCode(error?.message)}`);

  revalidatePath("/app/sales");
  revalidatePath("/app/debts");
  revalidatePath("/app/payments");
  revalidatePath("/app/inventory");
  revalidatePath("/app/cash");
  revalidatePath("/app");
  redirect(`/app/sales/${data}?created=1`);
}
