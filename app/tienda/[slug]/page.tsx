import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft, MessageCircle, ShieldCheck, ShoppingBag} from "lucide-react";
import {fetchPublicStore,fetchPublicItems} from "@/lib/online-store/public";
import {PublicCatalog} from "@/components/online-store/public-catalog";

export const revalidate=60;
export default async function PublicStorePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const store=await fetchPublicStore(slug);
 if(!store)notFound();
 const items=await fetchPublicItems(store.organization_id);
 const whatsapp=(store.whatsapp||"").replace(/\D/g,"");
 return <main className="min-h-screen bg-[#f6f7fb] text-slate-900">
  <header className="border-b border-slate-200 bg-white">
   <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
    <div className="flex min-w-0 items-center gap-3">
     {store.logo_url?<img src={store.logo_url} alt="" className="h-11 w-11 rounded-xl border object-contain"/>:<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 font-black text-white">{store.title.slice(0,1).toUpperCase()}</div>}
     <div className="min-w-0"><div className="truncate text-lg font-extrabold">{store.title}</div><p className="text-xs text-slate-500">Tienda online en Liago</p></div>
    </div>
    <a href="#catalogo" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Ver catálogo</a>
   </div>
  </header>
  <section className="relative overflow-hidden bg-slate-900 text-white">
   {store.banner_url?<img src={store.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30"/>:null}
   <div className="relative mx-auto flex min-h-64 max-w-7xl flex-col justify-center px-4 py-12 md:px-8">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Bienvenido a nuestra tienda</p>
    <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight md:text-5xl">{store.tagline||store.title}</h1>
    {store.description?<p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200">{store.description}</p>:null}
    <div className="mt-7 flex flex-wrap gap-3">
     <a href="#catalogo" style={{backgroundColor:store.accent_color}} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"><ShoppingBag className="h-4 w-4"/> Explorar artículos</a>
     {whatsapp?<a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, quisiera consultar por la tienda ${store.title}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold"><MessageCircle className="h-4 w-4"/> Contactar tienda</a>:null}
    </div>
   </div>
  </section>
  <PublicCatalog items={items} slug={store.slug} whatsapp={store.whatsapp}/>
  <footer className="border-t bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-slate-500 md:px-8"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Consulta directa con el comercio. Precios sujetos a confirmación.</span><Link href="/"><span className="inline-flex items-center gap-1 font-semibold text-slate-600"><ArrowLeft className="h-3 w-3"/> Desarrollado con Liago</span></Link></div></footer>
 </main>;
}
