import Link from "next/link";
import { ExternalLink, Globe2, PackagePlus, ShoppingBag } from "lucide-react";
import { requireActiveOrganization } from "@/lib/organizations/active-organization";
import {StoreMediaFields} from "@/components/online-store/store-media-fields";
import {StoreBrandMedia} from "@/components/online-store/store-brand-media";
import { publishOnlineStoreProductAction, removeOnlineStoreProductAction, saveOnlineStoreAction, updateOnlineStoreProductAction } from "./actions";

export const dynamic="force-dynamic";
type Search={saved?:string;error?:string;new_product?:string};
function slugify(value:string){return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,65)||"mi-tienda";}
function money(v:string|number){return "G. "+Number(v).toLocaleString("es-PY");}
const field="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500";

export default async function OnlineStoreAdmin({searchParams}:{searchParams:Promise<Search>}){
 const params=await searchParams;
 const {supabase,organizationId,organization,role}=await requireActiveOrganization();
 const canManage=["OWNER","ADMIN","MANAGER"].includes(role);
 const [{data:store},{data:items},{data:products}]=await Promise.all([
  supabase.from("online_stores").select("*").eq("organization_id",organizationId).maybeSingle(),
  supabase.from("online_store_items").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(200),
  supabase.from("products").select("id,name,code,sale_price").eq("organization_id",organizationId).eq("item_type","PRODUCT").eq("status","ACTIVE").is("deleted_at",null).order("name").limit(300)
 ]);
 const publishedItems=(items||[]).filter(x=>x.is_published).length;
 const available=(products||[]).filter(p=>!(items||[]).some(i=>i.product_id===p.id));
 return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
  <div className="flex flex-wrap items-start justify-between gap-4">
   <div><p className="flex items-center gap-2 text-sm font-bold text-blue-700"><ShoppingBag className="h-4 w-4"/> Comercio digital</p><h1 className="mt-1 text-3xl font-extrabold text-slate-950">Mi tienda online</h1>
   <p className="mt-2 max-w-2xl text-sm text-slate-600">Publicá artículos de tu empresa, compartí el catálogo y recibí consultas por WhatsApp. Cada empresa gestiona sus publicaciones de forma independiente, con control de precios y disponibilidad.</p></div>
   {store?.is_published ? <Link href={`/tienda/${store.slug}`} target="_blank" rel="noopener noreferrer" className="liago-btn-primary"><ExternalLink className="h-4 w-4"/> Ver tienda pública</Link>:null}
  </div>
  {params.new_product?<div role="status" className="rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">Producto creado. Seleccionalo en «Preparar artículo», cargá sus fotografías y activá «Mostrar en la tienda pública».</div>:null}
  {params.saved?<div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Cambios guardados correctamente. Los artículos solo se muestran al público si la tienda y cada artículo están publicados.</div>:null}
  {params.error?<div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">No se pudo guardar. Revisá el formulario, el código de la tienda y los valores. Un nombre de enlace puede estar ocupado por otra empresa.</div>:null}
  <div className="grid gap-4 sm:grid-cols-3">
   <section className="rounded-xl border bg-white p-4"><div className="text-xs text-slate-500">Estado de la tienda</div><strong className="mt-1 block text-xl">{store?.is_published?"Publicada":"Privada"}</strong></section>
   <section className="rounded-xl border bg-white p-4"><div className="text-xs text-slate-500">Artículos visibles</div><strong className="mt-1 block text-xl">{publishedItems}</strong></section>
   <section className="rounded-xl border bg-white p-4"><div className="text-xs text-slate-500">Artículos preparados</div><strong className="mt-1 block text-xl">{items?.length??0}</strong></section>
  </div>
  <section className="rounded-2xl border bg-white p-5 shadow-sm">
   <div className="mb-4 flex items-center gap-2"><Globe2 className="h-5 w-5 text-blue-700"/><h2 className="text-lg font-extrabold">Identidad de tu tienda</h2></div>
   {!canManage?<p className="text-sm text-slate-600">No tenés permisos para editar la configuración.</p>:
   <form action={saveOnlineStoreAction} className="grid gap-4 sm:grid-cols-2">
    <label className="text-xs font-bold text-slate-600">Nombre de la tienda<input name="title" required maxLength={120} defaultValue={store?.title||organization.name} className={field}/></label>
    <label className="text-xs font-bold text-slate-600">Enlace único (sin espacios)<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={70} defaultValue={store?.slug||slugify(organization.name)} className={field}/></label>
    <label className="text-xs font-bold text-slate-600 sm:col-span-2">Frase de portada<input name="tagline" maxLength={150} defaultValue={store?.tagline||"Descubrí nuestros productos"} className={field}/></label>
    <label className="text-xs font-bold text-slate-600 sm:col-span-2">Descripción<textarea name="description" rows={2} maxLength={1000} defaultValue={store?.description||""} className={field}/></label>
    <label className="text-xs font-bold text-slate-600">WhatsApp para consultas (con código de país)<input name="whatsapp" placeholder="5959..." defaultValue={store?.whatsapp||""} className={field}/></label>
    <label className="text-xs font-bold text-slate-600">Color principal<input name="accent_color" type="color" defaultValue={store?.accent_color||"#1d4ed8"} className="mt-1 h-11 w-full cursor-pointer rounded-xl border p-1"/></label>
    <StoreBrandMedia organizationId={organizationId} initialLogo={store?.logo_url||""} initialBanner={store?.banner_url||""}/>
    <label className="text-xs font-bold text-slate-600">Ubicación Google Maps (URL)<input name="location_url" type="url" defaultValue={store?.location_url||""} className={field}/></label>
    <label className="text-xs font-bold text-slate-600">Horario de atención<input name="opening_hours" maxLength={250} defaultValue={store?.opening_hours||""} className={field}/></label>
    <label className="text-xs font-bold text-slate-600">Instagram (URL)<input name="instagram_url" type="url" defaultValue={store?.instagram_url||""} className={field}/></label>
    <label className="text-xs font-bold text-slate-600">Facebook (URL)<input name="facebook_url" type="url" defaultValue={store?.facebook_url||""} className={field}/></label>
    <label className="text-xs font-bold text-slate-600">TikTok (URL)<input name="tiktok_url" type="url" defaultValue={store?.tiktok_url||""} className={field}/></label>
    <label className="text-xs font-bold text-slate-600">Sitio web (URL)<input name="website_url" type="url" defaultValue={store?.website_url||""} className={field}/></label>
    <label className="text-xs font-bold text-slate-600 sm:col-span-2">Condiciones de venta y entrega<textarea name="terms" maxLength={1500} rows={3} defaultValue={store?.terms||""} className={field}/></label>
    <label className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="is_published" defaultChecked={store?.is_published||false} className="h-4 w-4"/> Publicar la tienda y habilitar su enlace para los visitantes</label>
    <button className="liago-btn-primary sm:col-span-2">Guardar configuración de la tienda</button>
    <p className="text-xs text-slate-500 sm:col-span-2">La tienda comienza privada. El nombre del enlace debe ser único entre todas las empresas de Liago. Si cambiás el enlace, actualizá los links que ya compartiste.</p>
   </form>}
  </section>
  <section className="rounded-2xl border bg-white p-5 shadow-sm">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div><h2 className="flex items-center gap-2 text-lg font-extrabold"><PackagePlus className="h-5 w-5 text-blue-700"/> Artículos para publicar</h2><p className="mt-1 text-xs text-slate-500">1. Creá el producto · 2. Preparalo en esta tienda · 3. Subí sus fotos y publicalo. El stock, costo de compra y clientes permanecen privados.</p></div>
    {canManage?<Link href="/app/products/new?from=store" className="liago-btn-secondary">+ Crear producto para mi tienda</Link>:null}
   </div>
   {canManage && store? <form action={publishOnlineStoreProductAction} className="mb-5 flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3">
    <select name="product_id" required className="min-w-48 flex-1 rounded-lg border p-2.5 text-sm"><option value="">Seleccionar producto existente</option>{available.map(p=><option key={p.id} value={p.id}>{p.name} · {p.code} · {money(p.sale_price)}</option>)}</select>
    <button disabled={!available.length} className="liago-btn-primary disabled:opacity-50">Preparar artículo</button>
   </form> : <p className="mb-4 text-sm text-amber-700">{canManage ? "Guardá primero la configuración de la tienda para agregar artículos." : "Tu rol actual permite consultar la tienda, pero no publicar artículos."}</p>}
   <div className="space-y-3">
    {items?.map(item=><details key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
     <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3"><span className="font-bold text-slate-900">{item.title} <span className="ml-2 font-mono text-xs text-slate-400">{item.code}</span></span><span className="flex items-center gap-2 text-xs"><span className="font-bold">{money(item.price)}</span><span className={item.is_published?"rounded-full bg-emerald-50 px-2 py-1 text-emerald-700":"rounded-full bg-slate-100 px-2 py-1 text-slate-600"}>{item.is_published?"Visible":"Oculto"}</span></span></summary>
     {canManage?<div className="mt-4 border-t pt-4">
      <form action={updateOnlineStoreProductAction} className="grid gap-3 sm:grid-cols-2">
       <input type="hidden" name="id" value={item.id}/>
       <label className="text-xs font-semibold">Título<input name="title" defaultValue={item.title} maxLength={160} required className={field}/></label>
       <label className="text-xs font-semibold">Categoría<input name="category_name" defaultValue={item.category_name||"Otros"} maxLength={80} className={field}/></label>
       <label className="text-xs font-semibold">Precio de venta (G.)<input name="price" defaultValue={item.price} type="number" min={0} step="1" required className={field}/></label>
       <label className="text-xs font-semibold">Precio anterior (G., opcional)<input name="compare_at_price" defaultValue={item.compare_at_price||""} type="number" min={0} step="1" className={field}/></label>
       <StoreMediaFields organizationId={organizationId} itemId={item.id} initialMain={item.image_url||""} initialExtra={Array.isArray(item.images)?item.images.filter((u:string)=>u!==item.image_url).join("\n"):""}/>

       <label className="text-xs font-semibold sm:col-span-2">Descripción<textarea name="description" rows={3} defaultValue={item.description||""} className={field}/></label>
       <label className="text-xs font-semibold sm:col-span-2">Código promocional (si corresponde)<input name="promo_code" maxLength={60} defaultValue={item.promo_code||""} placeholder="Ej. MC-0001" className={field}/></label>
       <label className="text-xs font-semibold">Condición<select name="item_condition" defaultValue={item.item_condition||"NEW"} className={field}><option value="NEW">Nuevo</option><option value="USED">Usado</option></select></label>
       <label className="text-xs font-semibold">Disponibilidad<select name="listing_status" defaultValue={item.listing_status||"AVAILABLE"} className={field}><option value="AVAILABLE">Disponible</option><option value="RESERVED">Reservado</option><option value="SOLD">Vendido</option></select></label>

       <label className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm font-semibold sm:col-span-2"><input type="checkbox" name="is_published" defaultChecked={item.is_published}/> Mostrar en la tienda pública</label>
       <button className="liago-btn-primary sm:col-span-2">Guardar artículo</button>
      </form>
      <form action={removeOnlineStoreProductAction} className="mt-3 text-right"><input name="id" type="hidden" value={item.id}/><button className="text-xs font-semibold text-red-700 underline">Quitar del catálogo online</button></form>
     </div>:null}
    </details>)}
    {!items?.length?<p className="rounded-xl bg-slate-50 p-7 text-center text-sm text-slate-600">Todavía no preparaste artículos para tu tienda. Podés reutilizar tus productos existentes sin crear registros duplicados.</p>:null}
   </div>
  </section>
  <p className="text-xs text-slate-500">Esta versión recibe consultas por WhatsApp. No procesa pagos, pedidos, facturas ni descuenta stock automáticamente.</p>
 </main>;
}
