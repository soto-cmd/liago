import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, ReceiptText } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { PrintButton } from "@/components/common/print-button";
import { cancelSaleAction } from "./actions";

export const dynamic = "force-dynamic";

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
  const canCancel = ["OWNER", "ADMIN", "MANAGER"].includes(role);

  const [{ data: sale }, { data: items }, { data: debt }, { data: payments }] = await Promise.all([
    supabase
      .from("sales")
      .select("id,sale_number,sale_type,status,payment_status,sold_at,due_date,subtotal,discount_total,tax_total,total,amount_paid,balance_due,payment_method,reference,notes,customers(id,name,tax_id,phone,whatsapp,address),branches(id,name,address)")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase.from("sale_items").select("id,item_code,description,quantity,unit_price,discount,tax_rate,line_subtotal,line_tax,line_total,products(unit)").eq("organization_id", organizationId).eq("sale_id", id),
    supabase.from("debts").select("id,original_amount,balance,status,due_date").eq("organization_id", organizationId).eq("sale_id", id).maybeSingle(),
    supabase.from("payments").select("id,payment_number,paid_at,amount,payment_method,status,reference").eq("organization_id", organizationId).eq("sale_id", id).order("paid_at", { ascending: true }),
  ]);

  if (!sale) notFound();
  const customer = sale.customers as unknown as { id:string; name:string; tax_id:string|null; phone:string|null; whatsapp:string|null; address:string|null } | null;
  const branch = sale.branches as unknown as { id:string; name:string; address:string|null } | null;
  const currency = organization.currency || "PYG";

  return (
    <div className="p-4 md:p-8 print:bg-white print:p-0">
      <div className="mb-6 flex flex-col gap-3 print:hidden md:flex-row md:items-center md:justify-between">
        <Link href="/app/sales" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-950"><ArrowLeft className="h-4 w-4" /> Volver a ventas</Link>
        <div className="flex flex-wrap gap-2"><PrintButton />{canCancel && sale.status === "CONFIRMED" ? <details className="rounded-lg border bg-white px-4 py-2 text-sm"><summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-red-700"><Ban className="h-4 w-4" /> Anular venta</summary><form action={cancelSaleAction} className="mt-3 w-72 space-y-3"><input type="hidden" name="sale_id" value={sale.id} /><textarea name="reason" required placeholder="Motivo de anulación" className="w-full rounded-lg border px-3 py-2 text-sm" /><button className="w-full rounded-lg bg-red-700 px-3 py-2 font-medium text-white">Confirmar anulación</button></form></details> : null}</div>
      </div>

      {messages.created ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 print:hidden">Venta confirmada correctamente.</div> : null}
      {messages.canceled ? <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 print:hidden">Venta anulada y movimientos revertidos.</div> : null}
      {messages.error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 print:hidden">No se pudo completar la operación: {String(messages.error)}</div> : null}

      <article className="mx-auto max-w-4xl rounded-xl border bg-white p-6 shadow-sm print:max-w-none print:border-0 print:shadow-none">
        <header className="mb-6 flex items-start justify-between gap-6 border-b pb-5">
          <div><div className="flex items-center gap-2 text-xl font-semibold"><ReceiptText className="h-5 w-5 print:hidden" /> {organization.name}</div><p className="mt-1 text-sm text-neutral-500">{branch?.name || "Sucursal"}{branch?.address ? ` · ${branch.address}` : ""}</p></div>
          <div className="text-right"><p className="text-xs uppercase tracking-wide text-neutral-500">Comprobante de venta</p><p className="mt-1 font-mono text-2xl font-semibold">#{sale.sale_number}</p><p className="mt-1 text-sm text-neutral-500">{new Date(sale.sold_at).toLocaleString("es-PY")}</p></div>
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs uppercase tracking-wide text-neutral-500">Cliente</p><p className="mt-1 font-medium">{customer?.name || "Consumidor final"}</p>{customer?.tax_id ? <p className="text-sm text-neutral-600">RUC/Documento: {customer.tax_id}</p> : null}{customer?.whatsapp || customer?.phone ? <p className="text-sm text-neutral-600">Contacto: {customer.whatsapp || customer.phone}</p> : null}</div>
          <div className="sm:text-right"><p className="text-xs uppercase tracking-wide text-neutral-500">Condición</p><p className="mt-1 font-medium">{sale.sale_type}</p><p className="text-sm text-neutral-600">Pago: {sale.payment_status}</p>{sale.due_date ? <p className="text-sm text-neutral-600">Vence: {new Date(`${sale.due_date}T00:00:00`).toLocaleDateString("es-PY")}</p> : null}</div>
        </div>

        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y bg-neutral-50"><tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Detalle</th><th className="px-3 py-2 text-right">Cant.</th><th className="px-3 py-2 text-right">Precio</th><th className="px-3 py-2 text-right">Desc.</th><th className="px-3 py-2 text-right">Total</th></tr></thead><tbody className="divide-y">{items?.map((item) => { const p = item.products as unknown as { unit:string } | null; return <tr key={item.id}><td className="px-3 py-3 font-mono">{item.item_code || "—"}</td><td className="px-3 py-3">{item.description}</td><td className="px-3 py-3 text-right">{Number(item.quantity).toLocaleString("es-PY")} {p?.unit || ""}</td><td className="px-3 py-3 text-right">{Number(item.unit_price).toLocaleString("es-PY")}</td><td className="px-3 py-3 text-right">{Number(item.discount).toLocaleString("es-PY")}</td><td className="px-3 py-3 text-right font-medium">{Number(item.line_total).toLocaleString("es-PY")}</td></tr>; })}</tbody></table></div>

        <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{Number(sale.subtotal).toLocaleString("es-PY")} {currency}</span></div>{Number(sale.discount_total) > 0 ? <div className="flex justify-between"><span>Descuentos</span><span>-{Number(sale.discount_total).toLocaleString("es-PY")} {currency}</span></div> : null}{Number(sale.tax_total) > 0 ? <div className="flex justify-between"><span>Impuestos</span><span>{Number(sale.tax_total).toLocaleString("es-PY")} {currency}</span></div> : null}<div className="flex justify-between border-t pt-2 text-lg font-semibold"><span>Total</span><span>{Number(sale.total).toLocaleString("es-PY")} {currency}</span></div><div className="flex justify-between"><span>Cobrado</span><span>{Number(sale.amount_paid).toLocaleString("es-PY")} {currency}</span></div><div className="flex justify-between font-semibold"><span>Saldo</span><span>{Number(sale.balance_due).toLocaleString("es-PY")} {currency}</span></div></div>

        {payments?.length ? <section className="mt-6 border-t pt-4"><h2 className="mb-2 text-sm font-semibold">Cobros vinculados</h2><div className="space-y-1 text-sm">{payments.map((p) => <div key={p.id} className="flex justify-between"><span>#{p.payment_number} · {new Date(p.paid_at).toLocaleDateString("es-PY")} · {p.payment_method} · {p.status}</span><span>{Number(p.amount).toLocaleString("es-PY")} {currency}</span></div>)}</div></section> : null}
        {debt ? <section className="mt-4 border-t pt-4 text-sm"><div className="flex justify-between"><span>Deuda asociada · {debt.status}</span><span className="font-semibold">Saldo {Number(debt.balance).toLocaleString("es-PY")} {currency}</span></div></section> : null}
        {sale.notes ? <section className="mt-4 border-t pt-4 text-sm"><span className="font-medium">Notas:</span> {sale.notes}</section> : null}
        {sale.status === "CANCELED" ? <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center font-semibold text-red-700">VENTA ANULADA</div> : null}
      </article>
    </div>
  );
}
