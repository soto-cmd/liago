import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft, CheckCircle2, ImageOff, MessageCircle, Share2} from "lucide-react";
import {fetchPublicItem,fetchPublicStore,itemMoney,whatsappUrl} from "@/lib/online-store/public";
import {ShareProductButton} from "@/components/online-store/share-product-button";
import {ProductGallery} from "@/components/online-store/product-gallery";

export const revalidate=60;
export async function generateMetadata({params}:{params:Promise<{slug:string;id:string}>}):Promise<Metadata>{
 const {slug,id}=await params;
 const store=await fetchPublicStore(slug);
 if(!store)return {title:"Artículo no disponible",robots:{index:false,follow:false}};
 const item=await fetchPublicItem(store.organization_id,id);
 if(!item)return {title:"Artículo no disponible",robots:{index:false,follow:false}};
 const url=`https://liago.vercel.app/tienda/${store.slug}/${item.id}`;
 const title=`${item.title} | ${store.title}`;
 const description=`${item.title} · ${itemMoney(item.price,item.currency)}. ${(item.description||"Consultá disponibilidad al comercio.").slice(0,120)}`;
 const picture=item.images?.[0]||item.image_url;
 return {title,description,alternates:{canonical:url},
  openGraph:{title,description,type:"website",url,siteName:store.title,
   ...(picture?{images:[{url:picture,alt:item.title}]}:{})},
  twitter:{card:picture?"summary_large_image":"summary",title,description,
   ...(picture?{images:[picture]}:{})}};
}

export default async function StoreProductDetail({params}:{params:Promise<{slug:string;id:string}>}){
 const {slug,id}=await params;
 const store=await fetchPublicStore(slug);
 if(!store)notFound();
 const item=await fetchPublicItem(store.organization_id,id);
 if(!item)notFound();
 const wa=whatsappUrl(store.whatsapp,item.title,item.code);
 const savings=item.compare_at_price&&item.compare_at_price>item.price?item.compare_at_price-item.price:0;
 return <main className="min-h-screen bg-[#f6f7fb] text-slate-900">
  <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-8"><Link href={`/tienda/${slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><ArrowLeft className="h-4 w-4"/> Volver a {store.title}</Link><Link href={`/tienda/${slug}#catalogo`} className="text-sm font-semibold text-blue-700">Ver catálogo</Link></div></header>
  <article className="mx-auto grid max-w-6xl gap-7 px-4 py-9 md:grid-cols-2 md:px-8">
   <ProductGallery images={item.images?.length?item.images:item.image_url?[item.image_url]:[]} title={item.title}/>
   <div>
    <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{item.category_name||"Otros"}</p>
    <h1 className="mt-3 text-3xl font-extrabold leading-tight">{item.title}</h1>
    <p className="mt-3 inline-block rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm text-slate-600">Código {item.code}</p>
    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{item.item_condition==="USED"?"Usado":"Nuevo"}</span>
      <span className={`rounded-full px-3 py-1 ${item.listing_status==="AVAILABLE"?"bg-emerald-100 text-emerald-800":item.listing_status==="RESERVED"?"bg-amber-100 text-amber-800":"bg-slate-200 text-slate-700"}`}>{item.listing_status==="AVAILABLE"?"Disponible":item.listing_status==="RESERVED"?"Reservado":"Vendido"}</span>
    </div>
    <div className="mt-6">{savings>0&&item.compare_at_price?<p className="text-sm text-slate-400 line-through">{itemMoney(item.compare_at_price,item.currency)}</p>:null}
     <p className="text-4xl font-extrabold text-slate-950">{itemMoney(item.price,item.currency)}</p>
     {savings>0?<p className="mt-2 text-sm font-bold text-red-600">Ahorrás {itemMoney(savings,item.currency)}</p>:null}
    </div>
    <div className="my-6 border-t border-slate-200"/>
    <h2 className="font-bold">Descripción</h2>
    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{item.description||"Consultá al comercio por las características y disponibilidad de este artículo."}</p>
    {store.terms?<div className="mt-5 rounded-xl border bg-white p-4"><h3 className="text-sm font-bold">Condiciones del comercio</h3><p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{store.terms}</p></div>:null}
    <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-blue-600"/> Precio y disponibilidad sujetos a confirmación del comercio.</p>
    <div className="mt-6 flex flex-wrap gap-3">{wa&&item.listing_status!=="SOLD"?<a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"><MessageCircle className="h-4 w-4"/> Consultar por WhatsApp</a>:null}
     <ShareProductButton title={item.title}/></div>
   </div>
  </article>
  <footer className="mx-auto max-w-6xl px-4 pb-12 text-center text-xs text-slate-500 md:px-8">Tienda administrada por {store.title} · Liago</footer>
 </main>;
}
