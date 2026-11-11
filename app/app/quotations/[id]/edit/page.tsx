import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import { NewQuotationForm } from "@/components/quotations/new-quotation-form";

export default async function EditQuotationPage({
  params,searchParams,
}:{
  params:Promise<{id:string}>;searchParams:Promise<{error?:string}>
}){
 const {id}=await params;
 const {error}=await searchParams;
 const {supabase,organizationId,organization,role}=await requireActiveOrganization();
 if(!["OWNER","ADMIN","MANAGER","SELLER","CASHIER"].includes(role))redirect("/app/quotations?error=permission");
 const photographyOnly=organizationId==="7369c304-d00d-4a13-bf59-3c9bb201bfef";
 const productsQuery=supabase.from("products").select("id,name,description,sale_price,item_type")
  .eq("organization_id",organizationId).eq("status","ACTIVE").is("deleted_at",null).order("name");
 if(photographyOnly)productsQuery.eq("item_type","SERVICE");
 const [{data:quotation},{data:items},{data:customers},{data:products},{data:places},{data:recent}]=await Promise.all([
  supabase.from("quotations").select("id,customer_id,event_name,event_date,event_time,event_location,included_services,payment_terms,payment_methods,bank_details,notes,status,sale_id,number")
    .eq("id",id).eq("organization_id",organizationId).maybeSingle(),
  supabase.from("quotation_items").select("product_id,description,quantity,unit_price").eq("quotation_id",id).eq("organization_id",organizationId),
  supabase.from("customers").select("id,name,customer_code,phone,whatsapp,city").eq("organization_id",organizationId).eq("status","ACTIVE").is("deleted_at",null).order("name"),
  productsQuery,
  supabase.from("quotation_locations").select("name").eq("organization_id",organizationId).limit(400),
  supabase.from("quotations").select("event_name,event_time,included_services,payment_terms,payment_methods,bank_details")
    .eq("organization_id",organizationId).order("issued_at",{ascending:false}).limit(150)
 ]);
 if(!quotation)notFound();
 if(quotation.sale_id || !["DRAFT","SENT"].includes(quotation.status))redirect("/app/quotations/"+id+"?error=edit_locked");
 const locations=[...new Set([...(places||[]).map(x=>x.name),...(customers||[]).map(x=>x.city).filter((v):v is string=>!!v),quotation.event_location||""].filter(Boolean))].sort();
 const choices={
  events:(recent||[]).map(x=>x.event_name).filter((v):v is string=>!!v),
  times:(recent||[]).map(x=>x.event_time).filter((v):v is string=>!!v),
  includes:(recent||[]).map(x=>x.included_services).filter((v):v is string=>!!v),
  terms:(recent||[]).map(x=>x.payment_terms).filter((v):v is string=>!!v),
  methods:(recent||[]).map(x=>x.payment_methods).filter((v):v is string=>!!v),
  banks:(recent||[]).map(x=>x.bank_details).filter((v):v is string=>!!v),
 };
 return <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
  <div><Link href={"/app/quotations/"+id} className="text-sm font-semibold text-blue-700">Volver al documento</Link>
   <h1 className="mt-2 text-2xl font-extrabold">Editar cotización N.º {quotation.number}</h1>
   <p className="text-sm text-slate-600">Se conserva el número original y se recalculan los importes y el adelanto.</p></div>
  {error?<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo actualizar. Revisá los datos o verificá la migración SQL 016.</p>:null}
  <NewQuotationForm customers={customers||[]} products={products||[]} currency={organization.currency||"PYG"}
    locations={locations} previousChoices={choices} photographyOnly={photographyOnly}
    initial={{...quotation,items:(items||[]).map(x=>({...x,quantity:Number(x.quantity),unit_price:Number(x.unit_price)}))}}/>
 </div>;
}
