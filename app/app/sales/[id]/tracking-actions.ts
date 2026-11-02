"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

function route(saleId: string) {
  return `/app/sales/${encodeURIComponent(saleId)}`;
}

async function requireTrackableSale(saleId: string) {
  const ctx = await requireActiveOrganization();
  if (!["OWNER", "ADMIN", "MANAGER"].includes(ctx.role)) {
    redirect("/app/sales?error=not_allowed");
  }
  if (!/^[0-9a-f-]{36}$/i.test(saleId)) redirect("/app/sales?error=not_found");

  const { data: sale, error } = await ctx.supabase.from("sales")
    .select("id,status")
    .eq("id", saleId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();
  if (error || !sale || sale.status === "CANCELED") {
    redirect("/app/sales?error=not_found");
  }
  const { error: initError } = await ctx.supabase.from("sale_document_tracking")
    .upsert({ sale_id: saleId, organization_id: ctx.organizationId }, { onConflict: "sale_id", ignoreDuplicates: true });
  if (initError) redirect(`${route(saleId)}?tracking_error=save`);
  return ctx;
}

export async function setSaleDocumentStatusAction(formData: FormData) {
  const saleId = String(formData.get("sale_id") || "");
  const ctx = await requireTrackableSale(saleId);
  const status = String(formData.get("document_status") || "");
  if (!["PENDING", "RECEIPT", "PROFORMA", "EXTERNAL_INVOICE"].includes(status)) {
    redirect(`${route(saleId)}?tracking_error=document`);
  }
  const number = String(formData.get("external_invoice_number") || "").trim();
  if (status === "EXTERNAL_INVOICE" && (!number || number.length > 100)) {
    redirect(`${route(saleId)}?tracking_error=invoice_number`);
  }
  const { data, error } = await ctx.supabase.from("sale_document_tracking")
    .update({
      document_status: status,
      external_invoice_number: status === "EXTERNAL_INVOICE" ? number : null,
      document_recorded_at: status === "PENDING" ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: ctx.userId,
    })
    .eq("sale_id", saleId).eq("organization_id", ctx.organizationId)
    .select("sale_id").maybeSingle();
  if (error || !data) redirect(`${route(saleId)}?tracking_error=save`);
  revalidatePath("/app/sales");
  revalidatePath(route(saleId));
  redirect(`${route(saleId)}?tracking_saved=document`);
}

export async function setSaleEmailStatusAction(formData: FormData) {
  const saleId = String(formData.get("sale_id") || "");
  const ctx = await requireTrackableSale(saleId);
  const status = String(formData.get("email_status") || "");
  const recipient = String(formData.get("email_recipient") || "").trim();
  const reference = String(formData.get("email_reference") || "").trim();
  const confirm = String(formData.get("confirm_sent") || "");
  if (!["NOT_PREPARED", "PREPARED", "SENT"].includes(status)) {
    redirect(`${route(saleId)}?tracking_error=email`);
  }
  if (status === "SENT" && (confirm !== "ENVIADO" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))) {
    redirect(`${route(saleId)}?tracking_error=confirm_sent`);
  }
  if (recipient.length > 255 || reference.length > 255) {
    redirect(`${route(saleId)}?tracking_error=email`);
  }
  const { data: previous, error: readError } = await ctx.supabase
    .from("sale_document_tracking")
    .select("email_status,email_recipient,email_sent_at,email_reference")
    .eq("sale_id", saleId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();
  if (readError || !previous) redirect(`${route(saleId)}?tracking_error=save`);

  const now = new Date().toISOString();
  const sameConfirmedSend = status === "SENT" && previous.email_status === "SENT"
    && previous.email_recipient === recipient;
  const { data, error } = await ctx.supabase.from("sale_document_tracking")
    .update({
      email_status: status,
      email_recipient: status === "NOT_PREPARED" ? null : (recipient || null),
      email_sent_at: status === "SENT" ? (sameConfirmedSend && previous.email_sent_at ? previous.email_sent_at : now) : null,
      email_reference: status === "SENT" ? (reference || (sameConfirmedSend ? previous.email_reference : null) || "Registrado manualmente") : null,
      updated_at: now,
      updated_by: ctx.userId,
    })
    .eq("sale_id", saleId).eq("organization_id", ctx.organizationId)
    .select("sale_id").maybeSingle();
  if (error || !data) redirect(`${route(saleId)}?tracking_error=save`);
  revalidatePath("/app/sales");
  revalidatePath(route(saleId));
  redirect(`${route(saleId)}?tracking_saved=email`);
}
