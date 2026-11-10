import Link from "next/link";
import { FileText } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { NewQuotationForm } from "@/components/quotations/new-quotation-form";

export default async function QuotationsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {supabase,organizationId,organization}=await requireActiveOrganization();
 const params=await searchParams;
 const [{data:customers},{data:products},{data:quotes,error},{data:savedLocations},{data:recentChoices}]=await Promise.all([
  supabase.from("customers").select("id,name,customer_code,phone,whatsapp,city").eq("organization_id",organizationId).eq("status","ACTIVE").is("deleted_at",null).order("name"),
  supabase.from("products").select("id,name,description,sale_price,item_type").eq("organization_id",organizationId).eq("status","ACTIVE").is("deleted_at",null).order("name"),
  supabase.from("quotations").select("id,number,issued_at,total,status,customers(name)").eq("organization_id",organizationId).order("issued_at",{ascending:false}).limit(60),
  supabase.from("quotation_locations").select("name").eq("organization_id",organizationId).order("name").limit(400),
  supabase.from("quotations").select("event_name,event_time,included_services,payment_terms,payment_methods,bank_details").eq("organization_id",organizationId).order("issued_at",{ascending:false}).limit(150)
 ]);
 const locations=[...new Map([
  ...(savedLocations||[]).map(x=>x.name),
  ...(customers||[]).map(x=>(x as {city?:string|null}).city).filter((x):x is string=>!!x),
 ].map(name=>[name.trim().toLocaleLowerCase("es"),name.trim()] as const)).values()].filter(Boolean).sort((a,b)=>a.localeCompare(b,"es"));
 const previousChoices={
   events:(recentChoices||[]).map(q=>q.event_name).filter((x):x is string=>!!x),
   times:(recentChoices||[]).map(q=>q.event_time).filter((x):x is string=>!!x),
   includes:(recentChoices||[]).map(q=>q.included_services).filter((x):x is string=>!!x),
   terms:(recentChoices||[]).map(q=>q.payment_terms).filter((x):x is string=>!!x),
   methods:(recentChoices||[]).map(q=>q.payment_methods).filter((x):x is string=>!!x),
   banks:(recentChoices||[]).map(q=>q.bank_details).filter((x):x is string=>!!x)
 };
 const labels:Record<string,string>={DRAFT:"Preparada",SENT:"Enviada",ACCEPTED:"Aceptada",REJECTED:"Rechazada",CANCELED:"Anulada"};
 const currency=organization.currency||"PYG";
 return <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-8">
  <div><div className="flex items-center gap-2 text-sm font-semibold text-blue-700"><FileText className="h-4 w-4"/> Documentos comerciales</div><h1 className="mt-1 text-3xl font-extrabold text-slate-950">Cotizaciones</h1><p className="mt-2 text-sm text-slate-500">Prepará presupuestos sin registrar una venta, deuda ni cobro.</p></div>
  {params.error?<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">No se pudo guardar la cotización. Comprobá la configuración y los campos.</div>:null}
  <details className="liago-card p-4" open><summary className="cursor-pointer font-bold text-slate-900">Nueva cotización</summary><div className="mt-4"><NewQuotationForm customers={customers||[]} products={products||[]} currency={currency} locations={locations} previousChoices={previousChoices}/></div></details>
  <section className="liago-card overflow-hidden"><h2 className="border-b px-5 py-4 font-bold">Historial de cotizaciones</h2>
   {error?<p className="p-5 text-sm text-red-700">No se pudo consultar el historial. Verificá la migración de cotizaciones.</p>:
   quotes?.length?<div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Número</th><th className="p-4">Cliente</th><th className="p-4">Fecha</th><th className="p-4">Importe</th><th className="p-4">Estado</th><th className="p-4">Acción</th></tr></thead><tbody>{quotes.map(q=><tr key={q.id} className="border-t"><td className="p-4 font-semibold">{String(q.number).padStart(4,"0")}</td><td className="p-4">{(q.customers as unknown as {name:string}|null)?.name||"—"}</td><td className="p-4">{new Date(q.issued_at).toLocaleDateString("es-PY")}</td><td className="p-4">{Number(q.total).toLocaleString("es-PY")} {currency}</td><td className="p-4">{labels[q.status]||q.status}</td><td className="p-4"><Link href={"/app/quotations/"+q.id} className="font-semibold text-blue-700 hover:underline">Ver / Imprimir</Link></td></tr>)}</tbody></table></div>:
   <p className="p-6 text-sm text-slate-500">Todavía no hay cotizaciones registradas en esta empresa.</p>}
  </section>
 </div>;
}
