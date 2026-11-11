"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export async function acceptQuotationAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  const id = String(formData.get("quotation_id") || "");
  if (!["OWNER","ADMIN","MANAGER","SELLER","CASHIER"].includes(role) || !/^[0-9a-f-]{36}$/i.test(id)) {
    redirect("/app/quotations?error=permission");
  }
  const { error } = await supabase.rpc("accept_quotation", {
    p_organization_id: organizationId,
    p_quotation_id: id,
  });
  if (error) {
    console.error("accept_quotation", error.code, error.message);
    redirect("/app/quotations/" + id + "?error=accept");
  }
  revalidatePath("/app/quotations");
  revalidatePath("/app/quotations/" + id);
  redirect("/app/quotations/" + id + "?accepted=1");
}

export async function generateReceiptFromQuotationAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  const id = String(formData.get("quotation_id") || "");
  if (!["OWNER","ADMIN","MANAGER","SELLER","CASHIER"].includes(role) || !/^[0-9a-f-]{36}$/i.test(id)) {
    redirect("/app/quotations?error=permission");
  }
  const branchId = String(formData.get("branch_id") || "");
  const amount = Number(formData.get("amount_paid"));
  const method = String(formData.get("payment_method") || "CASH");
  const date = String(formData.get("due_date") || "");
  if (!/^[0-9a-f-]{36}$/i.test(branchId) || !Number.isFinite(amount) || amount < 0 ||
    !["CASH", "TRANSFER", "CARD", "OTHER"].includes(method) ||
    (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    redirect("/app/quotations/" + id + "?error=invalid_payment");
  }
  const { data, error } = await supabase.rpc("convert_quotation_to_sale", {
    p_organization_id: organizationId,
    p_quotation_id: id,
    p_branch_id: branchId,
    p_amount_paid: amount,
    p_payment_method: method,
    p_due_date: date || null,
  });
  if (error || !data) {
    console.error("convert_quotation_to_sale", error?.code, error?.message);
    redirect("/app/quotations/" + id + "?error=convert");
  }
  revalidatePath("/app/quotations");
  revalidatePath("/app/quotations/" + id);
  revalidatePath("/app/sales");
  revalidatePath("/app/payments");
  revalidatePath("/app/debts");
  revalidatePath("/app/cash");
  redirect("/app/sales/" + data + "?created=1");
}

export async function removeQuotationAction(formData: FormData) {
  const { supabase, organizationId, role } = await requireActiveOrganization();
  const id = String(formData.get("quotation_id")||"");
  const remove = String(formData.get("mode"))==="delete";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["OWNER","ADMIN","MANAGER"].includes(role)
     || (remove && !["OWNER","ADMIN"].includes(role))
     || String(formData.get("confirmation")||"").toUpperCase().trim() !== (remove?"ELIMINAR":"ANULAR")) {
    redirect("/app/quotations/"+id+"?error=permission");
  }
  const { error } = await supabase.rpc("remove_quotation",{
    p_organization_id: organizationId,p_quotation_id:id,p_delete:remove
  });
  if(error){
    console.error("remove_quotation",error.code,error.message);
    redirect("/app/quotations/"+id+"?error=remove");
  }
  revalidatePath("/app/quotations");
  revalidatePath("/app/quotations/"+id);
  redirect(remove?"/app/quotations?removed=1":"/app/quotations/"+id+"?canceled=1");
}
