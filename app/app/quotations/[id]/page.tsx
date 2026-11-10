import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/common/print-button";
import { QuotationReceiptForm } from "@/components/quotations/quotation-receipt-form";
import { acceptQuotationAction } from "./actions";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

export default async function QuotationDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {id}=await params;
 const messages=await searchParams;
 const {supabase,organizationId,organization,role}=await requireActiveOrganization();
 const canWrite=["OWNER","ADMIN","MANAGER","SELLER","CASHIER"].includes(role);
 const [{data:q},{data:items},{data:organizationInfo},{data:branches}]=await Promise.all([
  supabase.from("quotations").select("id,number,issued_at,event_name,event_date,event_location,notes,currency,subtotal,total,deposit,status,sale_id,accepted_at,customers(name,phone,whatsapp,email,address,city)").eq("id",id).eq("organization_id",organizationId).maybeSingle(),
  supabase.from("quotation_items").select("id,description,quantity,unit_price,line_total").eq("quotation_id",id).eq("organization_id",organizationId),
  supabase.from("organizations").select("name,legal_name,phone,email,address,city,logo_url").eq("id",organizationId).maybeSingle(),
  supabase.from("branches").select("id,name").eq("organization_id",organizationId).eq("status","ACTIVE").is("deleted_at",null).order("is_main",{ascending:false})
 ]);
 if(!q)notFound();
 const customer=q.customers as unknown as {name:string;phone:string|null;whatsapp:string|null;email:string|null;address:string|null;city:string|null}|null;
 const money=(n:number|string)=>Number(n).toLocaleString("es-PY",{maximumFractionDigits:2})+" "+(q.currency||organization.currency);
 return <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-8 print:max-w-none print:p-0">
  <div className="flex items-center justify-between gap-3 print:hidden"><Link className="liago-btn-secondary" href="/app/quotations">Volver a cotizaciones</Link><PrintButton filename={`Cotizacion-${String(q.number).padStart(4,"0")}.pdf`}/></div>
  {messages.accepted?<div className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800 print:hidden">Cotización aceptada. Ya podés registrar el cobro y generar el comprobante.</div>:null}
  {messages.error?<div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 print:hidden">No se pudo completar la operación. Revisá el estado, el importe y los permisos. No se registró un nuevo cobro.</div>:null}
  {q.sale_id?<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 print:hidden"><h3 className="font-bold text-emerald-900">Cotización vinculada a comprobante</h3><p className="mt-1 text-sm text-emerald-800">La operación ya está registrada. Para consultar el comprobante o los pagos, ingresá al detalle.</p><Link href={"/app/sales/"+q.sale_id} className="liago-btn-primary mt-3">Ver comprobante y pagos</Link></div>:null}
  {canWrite && !q.sale_id && ["DRAFT","SENT"].includes(q.status)?<form action={acceptQuotationAction} className="rounded-xl border border-slate-200 bg-white p-4 print:hidden"><input type="hidden" name="quotation_id" value={q.id}/><p className="mb-3 text-sm text-slate-600">El cliente confirmó que acepta los importes y condiciones. Este paso no registra cobros ni deudas.</p><button type="submit" className="liago-btn-primary">Marcar como aceptada</button></form>:null}
  {canWrite && q.status==="ACCEPTED" && !q.sale_id?<QuotationReceiptForm quotationId={q.id} total={Number(q.total)} suggestedDeposit={Number(q.deposit)} currency={q.currency||organization.currency||"PYG"} branches={branches||[]}/>:null}
  <article className="liago-card bg-white p-6 text-slate-900 md:p-10 print:rounded-none print:border-0 print:shadow-none">
    <header className="flex flex-wrap items-start justify-between gap-5 border-b-2 border-blue-700 pb-6">
      <div className="flex items-center gap-3">{(organizationInfo?.logo_url || (organization.name.toLowerCase().includes("a&m estudio") ? "/am-estudio-logo.svg" : null))?<img src={organizationInfo?.logo_url || "/am-estudio-logo.svg"} alt="Logo de la empresa" className="h-20 max-w-40 object-contain"/>:null}<div><h1 className="text-xl font-extrabold">{organizationInfo?.name||organization.name}</h1><p className="mt-1 text-sm text-slate-500">{organizationInfo?.address} {organizationInfo?.city}</p><p className="text-sm text-slate-500">{organizationInfo?.phone} {organizationInfo?.email}</p></div></div>
      <div className="text-right"><h2 className="text-2xl font-black">COTIZACIÓN</h2><p className="text-lg font-semibold">N° {String(q.number).padStart(4,"0")}</p><p className="text-sm">Emisión: {new Date(q.issued_at).toLocaleDateString("es-PY")}</p><p className="text-sm text-slate-500">Estado: {({DRAFT:"Preparada",SENT:"Enviada",ACCEPTED:"Aceptada",REJECTED:"Rechazada",CANCELED:"Anulada"} as Record<string,string>)[q.status]||q.status}</p></div>
    </header>
    <section className="grid gap-6 py-7 text-sm sm:grid-cols-2"><div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-700">Cliente</h3><p className="font-bold">{customer?.name}</p><p>{customer?.phone||customer?.whatsapp}</p><p>{customer?.email}</p><p>{customer?.address} {customer?.city}</p></div><div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-700">Evento / trabajo</h3><p className="font-bold">{q.event_name||"Servicio cotizado"}</p><p>{q.event_date||""}</p><p>{q.event_location||""}</p></div></section>
    <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Descripción</th><th className="p-3 text-right">Cant.</th><th className="p-3 text-right">Precio</th><th className="p-3 text-right">Subtotal</th></tr></thead><tbody>{(items||[]).map(item=><tr key={item.id} className="border-b"><td className="p-3">{item.description}</td><td className="p-3 text-right">{Number(item.quantity).toLocaleString("es-PY")}</td><td className="p-3 text-right">{money(item.unit_price)}</td><td className="p-3 text-right">{money(item.line_total)}</td></tr>)}</tbody></table></div>
    <div className="ml-auto mt-7 max-w-xs space-y-2 rounded-xl bg-slate-50 p-5 text-right text-sm print:bg-white"><p>Subtotal: {money(q.subtotal)}</p><p className="text-lg font-black">TOTAL: {money(q.total)}</p><p>Anticipo previsto: {money(q.deposit)}</p><p className="font-bold">Saldo previsto: {money(Number(q.total)-Number(q.deposit))}</p></div>
    {q.notes?<div className="mt-8 border-t pt-5 text-sm"><h3 className="mb-2 font-bold">Condiciones y observaciones</h3><p className="whitespace-pre-wrap">{q.notes}</p></div>:null}
    <p className="mt-10 text-xs text-slate-500">Documento de cotización comercial. No es una factura ni acredita un pago.</p>
  </article>
 </div>;
}
