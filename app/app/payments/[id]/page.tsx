import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { PrintButton } from "@/components/common/print-button";

export default async function PaymentReceiptPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const {supabase,organizationId,organization}=await requireActiveOrganization();
  const [{data:payment},{data:company},{data:allocations}]=await Promise.all([
    supabase.from("payments").select("id,organization_id,payment_number,paid_at,amount,payment_method,reference,notes,status,sale_id,customer_id,customers(name,tax_id,phone,whatsapp,email,address),branches(name,address)").eq("organization_id",organizationId).eq("id",id).maybeSingle(),
    supabase.from("organizations").select("name,address,city,phone,email,logo_url,currency").eq("id",organizationId).maybeSingle(),
    supabase.from("payment_allocations").select("debt_id,amount,debts(sale_id)").eq("organization_id",organizationId).eq("payment_id",id).limit(10),
  ]);
  if(!payment)notFound();
  const customer=payment.customers as unknown as {name:string;tax_id:string|null;phone:string|null;whatsapp:string|null;email:string|null;address:string|null}|null;
  const branch=payment.branches as unknown as {name:string;address:string|null}|null;
  const linkedDebt=allocations?.[0]?.debts as unknown as {sale_id:string|null}|null;
  const saleId=payment.sale_id || linkedDebt?.sale_id || null;
  const {data:quotation}=saleId?await supabase.from("quotations").select("id,number").eq("organization_id",organizationId).eq("sale_id",saleId).maybeSingle():{data:null};
  const currency=company?.currency||organization.currency||"PYG";
  const money=(value:number|string)=>Number(value).toLocaleString("es-PY",{maximumFractionDigits:2})+" "+currency;
  const code="REC-"+String(payment.payment_number).padStart(6,"0");
  const safeName=(customer?.name||"Cliente").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"");
  const methodNames:Record<string,string>={CASH:"Efectivo",TRANSFER:"Transferencia",CARD:"Tarjeta",OTHER:"Otro"};
  const isStudio=(company?.name||organization.name).toLowerCase().includes("a&m estudio");
  return <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-8 print:max-w-none print:p-0">
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Link href="/app/payments" className="liago-btn-secondary">Volver a cobros</Link><PrintButton filename={code+"_"+safeName+".pdf"}/></div>
    <article className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm md:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="mb-7 border-b-2 border-emerald-700 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>{(company?.logo_url||(isStudio?"/am-estudio-logo.svg":null))?<img src={company?.logo_url||"/am-estudio-logo.svg"} alt="Logo" className="mb-2 h-20 max-w-48 object-contain"/>:null}<h1 className="text-lg font-extrabold">{company?.name||organization.name}</h1><p className="text-xs text-slate-500">{company?.address} {company?.city}</p><p className="text-xs text-slate-500">{company?.phone} {company?.email}</p></div>
          <div className="text-right"><h2 className="text-2xl font-black tracking-wide">RECIBO</h2><p className="mt-1 text-xl font-bold">{code}</p><p className="text-sm text-slate-600">{new Date(payment.paid_at).toLocaleDateString("es-PY",{timeZone:"America/Asuncion"})}</p></div>
        </div>
      </div>
      {payment.status==="CANCELED"?<div className="mb-5 border-2 border-red-500 p-3 text-center font-black text-red-700">RECIBO ANULADO</div>:null}
      <div className="grid gap-5 text-sm sm:grid-cols-2">
        <div><h3 className="mb-2 text-xs font-bold uppercase text-emerald-700">Recibimos de</h3><p className="text-base font-bold">{customer?.name||"Cliente"}</p><p>{customer?.tax_id||""}</p><p>{customer?.phone||customer?.whatsapp||""}</p><p>{customer?.email||""}</p><p>{customer?.address||""}</p></div>
        <div><h3 className="mb-2 text-xs font-bold uppercase text-emerald-700">Detalle del cobro</h3><p>Medio: <strong>{methodNames[payment.payment_method]||payment.payment_method}</strong></p><p>Sucursal: {branch?.name||"Casa central"}</p><p>Referencia: {payment.reference||"—"}</p>{quotation?<p>Cotización origen: <strong>N° {quotation.number}</strong></p>:null}{saleId?<p>Operación comercial vinculada</p>:null}</div>
      </div>
      <div className="my-8 rounded-xl border border-emerald-100 bg-emerald-50 p-6 text-right"><p className="text-sm font-semibold text-emerald-800">Monto efectivamente recibido</p><p className="mt-2 text-3xl font-black text-emerald-900">{money(payment.amount)}</p></div>
      {payment.notes?<p className="text-sm text-slate-700"><strong>Observaciones:</strong> {payment.notes}</p>:null}
      <div className="mt-9 border-t pt-4 text-xs text-slate-500">Comprobante interno de cobro, no es una factura tributaria. Documento asociado a un pago registrado en Liago.</div>
    </article>
    <div className="flex flex-wrap gap-3 print:hidden">{saleId?<Link href={"/app/sales/"+saleId} className="liago-btn-secondary">Ver operación</Link>:null}{quotation?<Link href={"/app/quotations/"+quotation.id} className="liago-btn-secondary">Ver cotización</Link>:null}</div>
  </div>;
}
