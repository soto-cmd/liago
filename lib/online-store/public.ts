import { createClient } from "@supabase/supabase-js";

export type StorePublic = {
  organization_id:string; slug:string; title:string; tagline:string|null;
  description:string|null; whatsapp:string|null; logo_url:string|null;
  banner_url:string|null; accent_color:string;
};
export type StoreItemPublic = {
  id:string; title:string; code:string; description:string|null;
  category_name:string|null; image_url:string|null; price:number;
  compare_at_price:number|null; currency:string;
};
function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  });
}
export async function fetchPublicStore(slug:string):Promise<StorePublic|null> {
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>70)return null;
  const {data,error}=await publicClient().from("online_stores")
    .select("organization_id,slug,title,tagline,description,whatsapp,logo_url,banner_url,accent_color")
    .eq("slug",slug).eq("is_published",true).maybeSingle();
  return error?null:data;
}
export async function fetchPublicItems(organizationId:string):Promise<StoreItemPublic[]> {
  const {data,error}=await publicClient().from("online_store_items")
    .select("id,title,code,description,category_name,image_url,price,compare_at_price,currency")
    .eq("organization_id",organizationId).eq("is_published",true)
    .order("position",{ascending:true}).order("updated_at",{ascending:false}).limit(120);
  if(error)return[];
  return (data||[]).map(item=>({...item,price:Number(item.price),compare_at_price:item.compare_at_price===null?null:Number(item.compare_at_price)}));
}
export function itemMoney(v:number,currency:string){return currency==="PYG"?"G. "+Number(v).toLocaleString("es-PY"):Number(v).toLocaleString("es-PY")+" "+currency;}
export function whatsappUrl(phone:string|null,title:string,code:string){
  const n=(phone||"").replace(/\D/g,"");
  return n? `https://wa.me/${n}?text=${encodeURIComponent(`Hola, quiero consultar por el artículo ${code}: ${title}. ¿Está disponible?`)}`:null;
}
