"use server";
import { revalidatePath } from "next/cache";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";

type Input={id?:string;name:string;phone?:string;email?:string;tax_id?:string};
const allowed=["OWNER","ADMIN","MANAGER","SELLER","CASHIER"];
export async function saveCustomerInlineAction(input:Input):Promise<{ok:boolean;message?:string;customer?:{id:string;name:string;customer_code:string|null;phone:string|null;whatsapp:string|null}}> {
 const {supabase,organizationId,role}=await requireActiveOrganization();
 if(!allowed.includes(role))return {ok:false,message:"No tenés permisos para guardar clientes."};
 const name=input.name?.trim(),phone=input.phone?.trim()||null,email=input.email?.trim()||null,tax_id=input.tax_id?.trim()||null;
 if(!name||name.length>150)return {ok:false,message:"Ingresá un nombre válido (máximo 150 caracteres)."};
 if(email&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254))return {ok:false,message:"Correo electrónico no válido."};
 if(phone&&phone.length>50)return {ok:false,message:"El teléfono es demasiado largo."};
 const id=input.id?.trim();
 if(id&&!/^[a-f0-9-]{36}$/i.test(id))return {ok:false,message:"Cliente inválido."};
 if(!id){
  const {data:existing,error:lookupError}=await supabase.from("customers").select("id,name,customer_code,phone,whatsapp").eq("organization_id",organizationId).is("deleted_at",null).ilike("name",name).limit(10);
  if(lookupError)return {ok:false,message:"No se pudo comprobar si existe el cliente."};
  const duplicate=existing?.find(c=>c.name.trim().toLocaleLowerCase()===name.toLocaleLowerCase());
  if(duplicate)return {ok:false,message:"Ya existe un cliente con ese nombre. Seleccionalo en la lista."};
 }
 const query=id?
  supabase.from("customers").update({name,phone,email,tax_id}).eq("id",id).eq("organization_id",organizationId).is("deleted_at",null):
  supabase.from("customers").insert({organization_id:organizationId,name,phone,email,tax_id,customer_type:"PERSON"});
 const {data,error}=await query.select("id,name,customer_code,phone,whatsapp").single();
 if(error||!data)return {ok:false,message:"No se pudo guardar el cliente. Verificá los datos."};
 revalidatePath("/app/customers");revalidatePath("/app/quotations");revalidatePath("/app/sales");revalidatePath("/app/payments");
 return {ok:true,customer:data};
}
