import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, FileText, ReceiptText, Trash2 } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { PrintButton } from "@/components/common/print-button";
import { nextMonthlyPaymentDate } from "@/lib/billing/next-payment-date";
import { SaleEmailButton } from "@/components/sales/sale-email-button";
import { setSaleDocumentStatusAction, setSaleEmailStatusAction } from "./tracking-actions";
import { cancelSaleAction, deleteSaleAction, updateSaleDateAction } from "./actions";

export const dynamic = "force-dynamic";

const saleTypeLabels: Record<string, string> = { CASH: "Contado", PARTIAL: "Pago parcial", CREDIT: "Crédito" };
const paymentStatusLabels: Record<string, string> = { PAID: "Pagado", PARTIAL: "Pago parcial", PENDING: "Pendiente", CANCELED: "Anulado" };
const paymentMethodLabels: Record<string, string> = { CASH: "Efectivo", TRANSFER: "Transferencia", CARD: "Tarjeta", OTHER: "Otro" };
const recordStatusLabels: Record<string, string> = { CONFIRMED: "Confirmado", CANCELED: "Anulado", PENDING: "Pendiente" };

function money(value: number | string | null | undefined, currency: string) {
  const formatted = Number(value || 0).toLocaleString("es-PY");
  return currency === "PYG" ? `Gs. ${formatted}` : `${formatted} ${currency}`;
}

export default async function SaleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const messages = await searchParams;
  const { supabase, organizationId, role, organization } = await requireActiveOrganization();
  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(role);
  const canDelete = ["OWNER", "ADMIN"].includes(role);

  const [{ data: sale }, { data: items }, { data: debt }, { data: payments }, { data: tracking }] = await Promise.all([
    supabase
      .from("sales")
      .select("id,sale_number,sale_type,status,payment_status,sold_at,due_date,subtotal,discount_total,tax_total,total,amount_paid,balance_due,payment_method,reference,notes,customers(id,name,tax_id,phone,whatsapp,email,address,next_payment_day),branches(id,name,address)")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase.from("sale_items").select("id,item_code,description,quantity,unit_price,discount,tax_rate,line_subtotal,line_tax,line_total,products(unit,service_recurring_monthly)").eq("organization_id", organizationId).eq("sale_id", id),
    supabase.from("debts").select("id,original_amount,balance,status,due_date").eq("organization_id", organizationId).eq("sale_id", id).maybeSingle(),
    supabase.from("payments").select("id,payment_number,paid_at,amount,payment_method,status,reference").eq("organization_id", organizationId).eq("sale_id", id).order("paid_at", { ascending: true }),
    supabase.from("sale_document_tracking").select("document_status,document_recorded_at,external_invoice_number,email_status,email_recipient,email_sent_at,email_reference").eq("organization_id", organizationId).eq("sale_id", id).maybeSingle(),
  ]);

  if (!sale) notFound();
  const customer = sale.customers as unknown as { id:string; name:string; tax_id:string|null; phone:string|null; whatsapp:string|null; email:string|null; address:string|null; next_payment_day:number|null } | null;
  const branch = sale.branches as unknown as { id:string; name:string; address:string|null } | null;
  const currency = organization.currency || "PYG";
  const isAMStudio = organization.name.toLowerCase().includes("a&m estudio fotografico");
  const isServiceReceipt = Boolean(items?.length) && (items || []).every((item) => {
    const product = item.products as unknown as { unit: string } | null;
    return (product?.unit || "").toUpperCase() === "SERVICIO";
  });
  const issuer = organization.name.toLowerCase().includes("sototech academy") || ((items ?? []).some(item => /inform[aá]tica/i.test(item.description)) && organization.name.toLowerCase().includes("adrián soto")) ? "SotoTech Academy" : organization.name;
  const recurringMonthly = (items ?? []).some((item) => {
    const product = item.products as unknown as { service_recurring_monthly?: boolean } | null;
    return product?.service_recurring_monthly === true;
  });
  const nextPaymentDate = recurringMonthly && customer?.next_payment_day
    ? nextMonthlyPaymentDate(sale.sold_at, customer.next_payment_day)
    : null;
  const proforma = messages.document === "proforma" && sale.status !== "CANCELED";
  const receiptTitle = proforma ? "Factura proforma · No tributaria" : isServiceReceipt ? "Comprobante de servicio" : "Comprobante de venta";
  const saleDate = new Date(sale.sold_at).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
  // Existing organization-scoped sale_number remains the source of truth.
  // This is a document reference, NOT an official tax invoice number.
  const documentCode = `${proforma ? "PRO" : "COM"}-${String(sale.sale_number).padStart(6, "0")}`;
  const safeFilenamePart = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const pdfFilename = `${documentCode}_${safeFilenamePart(customer?.name || "Cliente")}.pdf`;

  return (
    <div className="p-4 md:p-8 print:p-0 print:bg-white">
      <div className="mb-6 flex flex-col gap-3 print:hidden md:flex-row md:items-center md:justify-between">
        <Link href="/app/sales" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950"><ArrowLeft className="h-4 w-4" /> Volver a ventas</Link>
        <div className="flex flex-wrap gap-2">
          <PrintButton filename={pdfFilename} />
          {sale.status !== "CANCELED" ? <Link href={proforma ? "/app/sales/" + sale.id : "/app/sales/" + sale.id + "?document=proforma"} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"><FileText className="h-4 w-4" /> {proforma ? "Ver comprobante" : "Generar factura"}</Link> : null}
          {sale.status !== "CANCELED" ? <SaleEmailButton proforma={proforma} customerEmail={customer?.email || null} customerName={customer?.name || "cliente"} companyName={issuer} saleNumber={String(sale.sale_number)} saleDate={saleDate} total={money(sale.total, currency)} amountPaid={money(sale.amount_paid, currency)} balance={money(sale.balance_due, currency)} nextPaymentDate={nextPaymentDate} /> : null}
          {canManage ? <details className="rounded-lg border bg-white px-4 py-2 text-sm"><summary className="cursor-pointer list-none font-medium">Editar fecha</summary><form action={updateSaleDateAction} className="mt-3 flex gap-2"><input type="hidden" name="sale_id" value={sale.id} /><input name="sale_date" type="date" defaultValue={String(sale.sold_at).slice(0,10)} required className="rounded-lg border px-3 py-2 text-sm" /><button className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white">Guardar</button></form></details> : null}
          {canManage && sale.status === "CONFIRMED" ? <details className="rounded-lg border bg-white px-4 py-2 text-sm"><summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-red-700"><Ban className="h-4 w-4" /> Anular venta</summary><form action={cancelSaleAction} className="mt-3 w-72 space-y-3"><input type="hidden" name="sale_id" value={sale.id} /><textarea name="reason" required placeholder="Motivo de anulación" className="w-full rounded-lg border px-3 py-2 text-sm" /><button className="w-full rounded-lg bg-red-700 px-3 py-2 font-medium text-white">Confirmar anulación</button></form></details> : null}
          {canDelete && sale.status === "CANCELED" ? <details className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm"><summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-red-800"><Trash2 className="h-4 w-4" /> Eliminar definitivamente</summary><form action={deleteSaleAction} className="mt-3 w-80 space-y-3"><input type="hidden" name="sale_id" value={sale.id} /><p className="text-xs leading-5 text-red-800">Esta acción elimina el comprobante y sus registros relacionados. No se puede deshacer.</p><input name="confirmation" required placeholder="Escribí ELIMINAR" className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm" /><button className="w-full rounded-lg bg-red-700 px-3 py-2 font-medium text-white">Eliminar venta</button></form></details> : null}
        </div>
      </div>

      <p className="mb-2 break-all text-xs text-slate-600 print:hidden">Nombre sugerido del archivo: <span className="font-medium text-slate-900">{pdfFilename}</span></p>
      <p className="mb-4 text-xs text-slate-500 print:hidden">El correo se prepara en tu aplicación de email. Revisá el destinatario y adjuntá el PDF guardado con el botón «Guardar como PDF» antes de enviarlo. La proforma no sustituye una factura tributaria.</p>
      {messages.tracking_saved ? <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Seguimiento actualizado correctamente.</div> : null}
      {messages.tracking_error ? <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">No se pudo actualizar el seguimiento. Para marcar un correo como enviado, escribí ENVIADO y verificá el destinatario. Para una factura externa, ingresá el número de factura.</div> : null}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-base font-bold text-slate-950">Seguimiento del comprobante</h2><p className="text-xs text-slate-500">Los estados se registran por separado del pago. Preparar un correo no significa enviarlo.</p></div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">{tracking?.document_status === "EXTERNAL_INVOICE" ? "Factura externa registrada" : tracking?.document_status === "RECEIPT" ? "Comprobante emitido" : tracking?.document_status === "PROFORMA" ? "Proforma preparada" : "Documento pendiente"}</span>
            <span className={tracking?.email_status === "SENT" ? "rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700" : "rounded-full bg-slate-100 px-3 py-1.5 text-slate-600"}>{tracking?.email_status === "SENT" ? "Correo enviado" : tracking?.email_status === "PREPARED" ? "Correo preparado" : "Correo pendiente"}</span>
          </div>
        </div>
        {tracking?.email_status === "SENT" ? <p className="mb-3 text-xs text-slate-600">Enviado a: {tracking.email_recipient}{tracking.email_sent_at ? ` · ${new Date(tracking.email_sent_at).toLocaleString("es-PY", {timeZone:"America/Asuncion"})}` : ""}{tracking.email_reference ? ` · Referencia: ${tracking.email_reference}` : ""}</p> : null}
        {canManage && sale.status !== "CANCELED" ? <div className="grid gap-4 lg:grid-cols-2">
          <form action={setSaleDocumentStatusAction} className="space-y-2 rounded-lg border border-slate-200 p-3">
            <input type="hidden" name="sale_id" value={sale.id}/>
            <label className="block text-xs font-bold text-slate-600" htmlFor="document-status">Estado del documento</label>
            <select id="document-status" name="document_status" defaultValue={tracking?.document_status || "PENDING"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="PENDING">Pendiente de generar</option>
              <option value="RECEIPT">Comprobante interno emitido</option>
              <option value="PROFORMA">Proforma preparada (no tributaria)</option>
              <option value="EXTERNAL_INVOICE">Factura tributaria emitida externamente</option>
            </select>
            <label className="block text-xs text-slate-600" htmlFor="external-invoice-number">N.º de factura tributaria externa (solo si corresponde)</label>
            <input id="external-invoice-number" name="external_invoice_number" maxLength={100} defaultValue={tracking?.external_invoice_number || ""} placeholder="Número oficial; obligatorio para factura externa" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Guardar documento</button>
          </form>
          <form action={setSaleEmailStatusAction} className="space-y-2 rounded-lg border border-slate-200 p-3">
            <input type="hidden" name="sale_id" value={sale.id}/>
            <label className="block text-xs font-bold text-slate-600" htmlFor="email-status">Estado del correo</label>
            <select id="email-status" name="email_status" defaultValue={tracking?.email_status || "NOT_PREPARED"} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="NOT_PREPARED">Pendiente</option>
              <option value="PREPARED">Borrador preparado (no enviado)</option>
              <option value="SENT">Enviado (confirmación manual)</option>
            </select>
            <input name="email_recipient" type="email" maxLength={255} aria-label="Correo del destinatario" defaultValue={tracking?.email_recipient || customer?.email || ""} placeholder="Correo del destinatario" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
            <input name="email_reference" maxLength={255} defaultValue={tracking?.email_reference || ""} placeholder="Referencia del correo (opcional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
            <p className="text-xs text-slate-500">Para confirmar que realmente se envió, seleccioná Enviado y escribí ENVIADO.</p>
            <input name="confirm_sent" aria-label="Confirmar correo enviado" placeholder="ENVIADO (solo para marcar enviado)" autoComplete="off" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Guardar correo</button>
              <SaleEmailButton proforma={proforma} customerEmail={tracking?.email_recipient || customer?.email || null} customerName={customer?.name || "cliente"} companyName={issuer} saleNumber={String(sale.sale_number)} saleDate={saleDate} total={money(sale.total, currency)} amountPaid={money(sale.amount_paid, currency)} balance={money(sale.balance_due, currency)} nextPaymentDate={nextPaymentDate} />
            </div>
            <p className="text-xs text-slate-500">Gmail se abre con el mensaje preparado, sin enviarlo. Adjuntá manualmente el archivo {pdfFilename}. Si modificás el destinatario arriba, guardá el cambio antes de preparar el correo.</p>
          </form>
        </div> : null}
      </section>
      {messages.created ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 print:hidden">Venta confirmada correctamente.</div> : null}
      {messages.date_updated ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 print:hidden">Fecha actualizada correctamente.</div> : null}
      {messages.canceled ? <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 print:hidden">Venta anulada y movimientos revertidos.</div> : null}
      {messages.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 print:hidden">No se pudo completar la operación: {String(messages.error)}</div> : null}


      <style>{`@media print { @page { size: A4 portrait; margin: 12mm; } .liago-invoice { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .liago-invoice section, .liago-invoice footer, .liago-invoice tr { break-inside: avoid; } }`}</style>
      <article className="liago-invoice mx-auto max-w-4xl overflow-hidden rounded-xl border border-emerald-100 bg-white text-slate-900 shadow-lg print:m-0 print:w-full print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <div className="h-3 bg-emerald-700 print:h-2" />
        <div className="px-7 pb-7 pt-8 sm:px-10 print:px-0 print:pb-0 print:pt-5">
          <header className="mb-8 flex flex-wrap items-start justify-between gap-7 print:mb-6">
            <div className="min-w-0 flex-1">
              {isAMStudio ? <img src="/am-estudio-logo.svg" alt="A&M Estudio Fotográfico" className="mb-3 h-auto w-52 max-w-full" /> : <div className="text-2xl font-extrabold tracking-tight text-slate-950">{issuer}</div>}
              {isAMStudio ? <div className="text-sm font-semibold text-slate-900">{organization.name}</div> : null}
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{branch?.name || "Casa central"}{branch?.address ? ` · ${branch.address}` : ""}</p>
            </div>
            <div className="min-w-[185px] text-right">
              <p className="text-2xl font-black uppercase tracking-[0.12em] text-emerald-800 print:text-xl">{proforma ? "PROFORMA" : "COMPROBANTE"}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{receiptTitle}</p>
              <p className="mt-3 font-mono text-lg font-bold text-slate-900">{documentCode}</p>
            </div>
          </header>

          <div className="mb-7 h-px bg-emerald-200 print:mb-5" />

          <section className="mb-7 grid grid-cols-1 gap-6 sm:grid-cols-2 print:mb-5 print:grid-cols-2">
            <div>
              <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">Facturado a</h2>
              <p className="text-base font-bold text-slate-950">{customer?.name || "Consumidor final"}</p>
              {customer?.tax_id ? <p className="mt-1 text-xs text-slate-600">RUC / Documento: {customer.tax_id}</p> : null}
              {customer?.address ? <p className="mt-1 text-xs text-slate-600">{customer.address}</p> : null}
              {customer?.phone || customer?.whatsapp ? <p className="mt-1 text-xs text-slate-600">{customer?.whatsapp || customer?.phone}</p> : null}
              {customer?.email ? <p className="mt-1 break-all text-xs text-slate-600">{customer.email}</p> : null}
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 print:p-3">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
                <span className="font-semibold text-slate-500">Fecha</span><span className="text-right font-medium">{saleDate}</span>
                <span className="font-semibold text-slate-500">N.º de venta</span><span className="text-right font-medium">#{sale.sale_number}</span>
                <span className="font-semibold text-slate-500">Condición</span><span className="text-right font-medium">{saleTypeLabels[sale.sale_type] || sale.sale_type}</span>
                <span className="font-semibold text-slate-500">Pago</span><span className="text-right font-bold text-emerald-800">{paymentStatusLabels[sale.payment_status] || sale.payment_status}</span>
                {sale.due_date ? <><span className="font-semibold text-slate-500">Vencimiento</span><span className="text-right font-medium">{new Date(`${sale.due_date}T00:00:00`).toLocaleDateString("es-PY")}</span></> : null}
              </div>
            </div>
          </section>

          {recurringMonthly ? <section className="mb-7 flex items-center justify-between gap-4 rounded-lg border-l-4 border-emerald-700 bg-emerald-50 px-5 py-3 print:mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Próxima fecha de pago</p>
              <p className="mt-0.5 text-xs text-slate-600">Servicio recurrente</p>
            </div>
            <strong className="text-xl tabular-nums text-emerald-900">{nextPaymentDate || "Por configurar"}</strong>
          </section> : null}

          <section className="mb-6 print:mb-5">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <thead className="bg-emerald-700 text-white">
                  <tr>
                    <th className="w-[18%] px-3 py-3 font-semibold print:px-2">Código</th>
                    <th className="w-[33%] px-3 py-3 font-semibold print:px-2">Descripción</th>
                    <th className="w-[8%] px-2 py-3 text-right font-semibold">Cant.</th>
                    <th className="w-[16%] px-2 py-3 text-right font-semibold">Precio</th>
                    <th className="w-[9%] px-2 py-3 text-right font-semibold">Desc.</th>
                    <th className="w-[16%] px-3 py-3 text-right font-semibold print:px-2">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items?.map(item => <tr key={item.id} className="even:bg-slate-50/60">
                    <td className="break-all px-3 py-3 font-mono text-[10px] text-slate-600 print:px-2">{item.item_code || "—"}</td>
                    <td className="px-3 py-3 font-medium print:px-2">{item.description}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{Number(item.quantity).toLocaleString("es-PY")}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{money(item.unit_price, currency)}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{Number(item.discount).toLocaleString("es-PY")}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums print:px-2">{money(item.line_total, currency)}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-7 flex justify-end print:mb-5">
            <div className="w-full max-w-sm border-t-2 border-emerald-700 pt-3 text-sm">
              <div className="flex justify-between gap-4 py-1"><span className="text-slate-500">Subtotal</span><span className="tabular-nums">{money(sale.subtotal, currency)}</span></div>
              {Number(sale.discount_total) > 0 ? <div className="flex justify-between gap-4 py-1"><span className="text-slate-500">Descuentos</span><span className="tabular-nums">-{money(sale.discount_total, currency)}</span></div> : null}
              {Number(sale.tax_total) > 0 ? <div className="flex justify-between gap-4 py-1"><span className="text-slate-500">Impuestos</span><span className="tabular-nums">{money(sale.tax_total, currency)}</span></div> : null}
              <div className="mt-2 flex justify-between gap-4 bg-emerald-50 px-3 py-3 text-base font-extrabold text-emerald-900"><span>TOTAL</span><span className="tabular-nums">{money(sale.total, currency)}</span></div>
              <div className="flex justify-between gap-4 px-3 py-2 text-xs"><span className="text-slate-500">Cobrado</span><span className="tabular-nums">{money(sale.amount_paid, currency)}</span></div>
              <div className="flex justify-between gap-4 border-t border-slate-200 px-3 py-2 text-xs font-bold"><span>Saldo pendiente</span><span className="tabular-nums">{money(sale.balance_due, currency)}</span></div>
            </div>
          </section>

          {payments?.length ? <section className="mb-6 rounded-lg border border-slate-200 px-4 py-3 print:mb-4">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800">Detalle del pago</h2>
            <div className="space-y-2 text-xs">{payments.map(p => <div key={p.id} className="flex items-center justify-between gap-4"><span>#{p.payment_number} · {paymentMethodLabels[p.payment_method] || p.payment_method} · {recordStatusLabels[p.status] || p.status}</span><span className="whitespace-nowrap font-semibold tabular-nums">{money(p.amount,currency)}</span></div>)}</div>
          </section> : null}
          {debt ? <section className="mb-4 flex justify-between gap-4 border-b border-slate-100 pb-3 text-xs"><span>Deuda asociada · {paymentStatusLabels[debt.status] || debt.status}</span><span className="font-semibold">Saldo {money(debt.balance,currency)}</span></section> : null}
          {sale.notes ? <section className="mb-4 text-xs text-slate-600"><span className="font-bold text-slate-800">Notas:</span> {sale.notes}</section> : null}
          {sale.status === "CANCELED" ? <div className="mb-5 border-2 border-red-500 p-3 text-center font-bold uppercase text-red-700">VENTA ANULADA</div> : null}

          <footer className="mt-7 border-t border-emerald-200 pt-5 print:mt-5 print:pt-3">
            <p className="text-[10px] font-semibold leading-relaxed text-slate-500">{proforma ? "DOCUMENTO PROFORMA · SIN VALIDEZ TRIBUTARIA. No sustituye una factura electrónica ni constituye comprobante fiscal." : "Comprobante interno · No constituye una factura tributaria."}</p>
            {isAMStudio ? <p className="mt-2 text-xs font-medium text-emerald-800">Gracias por confiar en A&M Estudio Fotográfico.</p> : null}
            <div className="mt-4 h-1 w-16 rounded-full bg-emerald-700 print:mt-3" />
          </footer>
        </div>
      </article>
    </div>
  );
}
