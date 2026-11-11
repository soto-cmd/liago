import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/common/print-button";
import { ExportJpgButton } from "@/components/common/export-jpg-button";
import { QuotationReceiptForm } from "@/components/quotations/quotation-receipt-form";
import { acceptQuotationAction, removeQuotationAction } from "./actions";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

const statusNames:Record<string,string>={DRAFT:"Preparada",SENT:"Enviada",ACCEPTED:"Aceptada",REJECTED:"Rechazada",CANCELED:"Anulada"};
export default async function QuotationDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {id}=await params;
 const messages=await searchParams;
 const {supabase,organizationId,organization,role}=await requireActiveOrganization();
 const canWrite=["OWNER","ADMIN","MANAGER","SELLER","CASHIER"].includes(role);
 const [{data:q},{data:items},{data:company},{data:branches}]=await Promise.all([
  supabase.from("quotations").select("id,number,issued_at,event_name,event_date,event_location,event_time,included_services,payment_terms,payment_methods,bank_details,notes,currency,subtotal,total,deposit,status,sale_id,accepted_at,customers(name,phone,whatsapp,email,address,city)").eq("id",id).eq("organization_id",organizationId).maybeSingle(),
  supabase.from("quotation_items").select("id,description,quantity,unit_price,line_total").eq("quotation_id",id).eq("organization_id",organizationId),
  supabase.from("organizations").select("name,legal_name,phone,email,address,city,logo_url").eq("id",organizationId).maybeSingle(),
  supabase.from("branches").select("id,name").eq("organization_id",organizationId).eq("status","ACTIVE").is("deleted_at",null).order("is_main",{ascending:false})
 ]);
 if(!q) notFound();
 const customer=q.customers as unknown as {name:string;phone:string|null;whatsapp:string|null;email:string|null;address:string|null;city:string|null}|null;
 const money=(n:number|string)=> (q.currency==="PYG"?"₲ ":"")+Number(n).toLocaleString("es-PY",{maximumFractionDigits:2})+(q.currency!=="PYG"?" "+(q.currency||organization.currency):"");
 const date=(v:string)=>new Date(v+"T12:00:00").toLocaleDateString("es-PY",{day:"2-digit",month:"2-digit",year:"numeric"});
 const issued=new Date(q.issued_at).toLocaleDateString("es-PY",{timeZone:"America/Asuncion"});
 const isAM=organization.name.toLowerCase().includes("a&m estudio");
 const logo=company?.logo_url || (isAM?"/am-estudio-logo.svg":null);
 const includes=(q.included_services||"").split(/\r?\n/).map((s:string)=>s.trim()).filter(Boolean);
 const code="COT-"+new Date(q.issued_at).getFullYear()+"-"+String(q.number).padStart(6,"0");
 const filename="Cotizacion-"+q.number+"_"+(customer?.name||"Cliente").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-")+".pdf";
 return <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-8 print:max-w-none print:p-0">
  <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Link className="liago-btn-secondary" href="/app/quotations">Volver a cotizaciones</Link><div className="flex flex-wrap gap-2"><PrintButton filename={filename}/><ExportJpgButton filename={filename} targetId="quotation-document"/></div></div>
  {messages.updated?<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 print:hidden">Cotización actualizada.</p>:null}
  {messages.canceled?<p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 print:hidden">Cotización anulada.</p>:null}
  {canWrite && !q.sale_id && ["DRAFT","SENT"].includes(q.status)?
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <Link href={"/app/quotations/"+id+"/edit"} className="liago-btn-secondary">Editar / actualizar</Link>
      {["OWNER","ADMIN","MANAGER"].includes(role)?
        <details className="rounded-lg border border-amber-200 p-2 text-sm">
          <summary className="cursor-pointer font-semibold">Anular o eliminar</summary>
          <form action={removeQuotationAction} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="quotation_id" value={id}/>
            <select name="mode" className="liago-input" defaultValue="cancel">
              <option value="cancel">Anular (conservar historial)</option>
              {["OWNER","ADMIN"].includes(role)&&q.status==="DRAFT"?<option value="delete">Eliminar borrador definitivamente</option>:null}
            </select>
            <input name="confirmation" required className="liago-input" placeholder="ANULAR o ELIMINAR"/>
            <button className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white">Confirmar</button>
          </form>
          <p className="mt-2 text-xs text-slate-600">Para anular escribí ANULAR. Para eliminar un borrador escribí ELIMINAR. Los números no se reutilizan.</p>
        </details>:null}
    </div>:null}
  {messages.accepted?<p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 print:hidden">Cotización aceptada. Ya podés registrar el cobro.</p>:null}
  {messages.error?<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 print:hidden">No se pudo completar la operación. No se registró un cobro nuevo.</p>:null}
  {q.sale_id?<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm print:hidden"><strong>Cotización convertida.</strong> El cobro y los recibos están asociados a la operación. <Link href={"/app/sales/"+q.sale_id} className="ml-2 font-bold text-blue-700 underline">Ver comprobante y pagos</Link></div>:null}
  {canWrite && !q.sale_id && ["DRAFT","SENT"].includes(q.status)?<form action={acceptQuotationAction} className="rounded-xl border bg-white p-4 print:hidden"><input type="hidden" name="quotation_id" value={q.id}/><p className="mb-3 text-sm text-slate-600">Confirmá la aceptación del cliente. Esto no registra ningún cobro.</p><button className="liago-btn-primary">Marcar como aceptada</button></form>:null}
  {canWrite && q.status==="ACCEPTED" && !q.sale_id?<QuotationReceiptForm quotationId={q.id} total={Number(q.total)} suggestedDeposit={Number(q.deposit)} currency={q.currency||organization.currency||"PYG"} branches={branches||[]}/>:null}
  <style>{`@media print { @page { size:A4 portrait; margin:13mm; } .quote-sheet, .quote-sheet tr, .quote-sheet section { break-inside:avoid; } .quote-sheet {-webkit-print-color-adjust:exact;print-color-adjust:exact;} }`}</style>
  <article id="quotation-document" className="quote-sheet mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm sm:p-9 print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none">
   <header className="flex items-start justify-between gap-4">
    <div><h1 className="text-xl font-extrabold">{company?.name||organization.name}</h1><p className="mt-1 text-xs text-slate-600">{company?.phone?"Tel. "+company.phone:""}</p><p className="text-xs text-slate-600">{[company?.address,company?.city].filter(Boolean).join(", ")}</p><p className="text-xs text-slate-600">{company?.email||""}</p></div>
    {logo?<img src={logo} alt="Logo de la empresa" className="h-16 w-auto max-w-36 object-contain"/>:null}
   </header>
   <div className="mt-5 h-2 w-full bg-[#b49a5b]"/>
   <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3"><h2 className="text-xl font-black tracking-tight">COTIZACIÓN {q.number}</h2><p className="text-xs text-slate-600">Fecha: {issued}</p></div>
   <section className="mt-5 grid grid-cols-2 gap-0 text-sm">
    <div><h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#a58a4c]">Cliente</h3><div className="min-h-24 border border-slate-300 p-3"><strong>{customer?.name||"—"}</strong><p className="mt-1 text-xs text-slate-500">{customer?.phone||customer?.whatsapp||""}</p></div></div>
    <div><h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#a58a4c]">Evento</h3><div className="min-h-24 border border-l-0 border-slate-300 p-3 text-xs"><p>{q.event_name?"Evento: "+q.event_name:""}</p><p>{q.event_date?"Fecha: "+date(q.event_date):""}</p><p>{q.event_time?"Horario: "+q.event_time:""}</p><p>{q.event_location?"Ciudad / lugar: "+q.event_location:""}</p></div></div>
   </section>
   <section className="mt-6"><h3 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#a58a4c]">Servicios</h3>
    <table className="w-full border-collapse text-sm"><thead><tr className="bg-[#222] text-white"><th className="p-2 text-left">Descripción</th><th className="w-16 p-2 text-right">Cant.</th><th className="w-32 p-2 text-right">Importe</th></tr></thead>
    <tbody>{(items||[]).map(item=><tr key={item.id} className="border-b border-x border-slate-300"><td className="whitespace-pre-line p-2 text-xs leading-5">{item.description}</td><td className="p-2 text-right text-xs">{Number(item.quantity).toLocaleString("es-PY")}</td><td className="p-2 text-right text-xs font-semibold">{money(item.line_total)}</td></tr>)}</tbody></table>
    <div className="mt-4 flex justify-end gap-6 text-base font-extrabold"><span>TOTAL</span><span>{money(q.total)}</span></div>
   </section>
   {includes.length?<section className="mt-6"><h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#a58a4c]">Incluye</h3><ul className="space-y-1 text-xs">{includes.map((s:string,i:number)=><li key={i} className="flex gap-2"><span className="font-bold">✓</span><span>{s}</span></li>)}</ul></section>:null}
   {(q.payment_terms||q.payment_methods||q.bank_details)?<section className="mt-6"><div className="mb-3 h-2 bg-[#b49a5b]"/><h3 className="mb-1 text-[11px] font-bold uppercase text-[#a58a4c]">Condiciones y forma de pago</h3>
    <div className="border border-slate-200 text-xs">{q.payment_terms?<div className="grid grid-cols-[132px_1fr] border-b border-slate-200"><strong className="bg-[#f3f0e8] p-2 text-[#927743]">ANTICIPO Y SALDO</strong><span className="p-2">{q.payment_terms}</span></div>:null}{q.payment_methods?<div className="grid grid-cols-[132px_1fr] border-b border-slate-200"><strong className="bg-[#f3f0e8] p-2 text-[#927743]">FORMA DE PAGO</strong><span className="p-2">{q.payment_methods}</span></div>:null}{q.bank_details?<div className="grid grid-cols-[132px_1fr]"><strong className="bg-[#f3f0e8] p-2 text-[#927743]">TRANSFERENCIA</strong><span className="p-2">{q.bank_details}</span></div>:null}</div>
   </section>:null}
   {q.notes?<section className="mt-4 text-xs"><h3 className="font-bold">Observaciones</h3><p className="mt-1 whitespace-pre-wrap text-slate-700">{q.notes}</p></section>:null}
   <footer className="mt-8 border-t pt-3 text-center text-[10px] text-slate-500">{company?.name||organization.name} · {code}<p className="mt-1">Cotización comercial; no acredita un pago ni constituye factura tributaria.</p></footer>
  </article>
 </div>;
}
