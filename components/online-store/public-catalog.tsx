"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {Search, MessageCircle, Share2, SlidersHorizontal, ShoppingBag, ImageOff} from "lucide-react";
import {itemMoney,whatsappUrl,type StoreItemPublic} from "@/lib/online-store/public";

type Props={items:StoreItemPublic[];slug:string;whatsapp:string|null};
export function PublicCatalog({items,slug,whatsapp}:Props) {
 const [q,setQ]=useState("");
 const [category,setCategory]=useState("Todas");
 const [sort,setSort]=useState("new");
 const [feedback,setFeedback]=useState("");
 const categories=useMemo(()=>["Todas",...Array.from(new Set(items.map(x=>x.category_name||"Otros"))).sort((a,b)=>a.localeCompare(b,"es"))],[items]);
 const filtered=useMemo(()=>{
   const needle=q.trim().toLocaleLowerCase("es");
   const rows=items.filter(x=>(category==="Todas"||(x.category_name||"Otros")===category) &&
      (!needle||[x.title,x.code,x.category_name||"",x.description||""].join(" ").toLocaleLowerCase("es").includes(needle)));
   if(sort==="price-asc")rows.sort((a,b)=>a.price-b.price);
   else if(sort==="price-desc")rows.sort((a,b)=>b.price-a.price);
   else if(sort==="name")rows.sort((a,b)=>a.title.localeCompare(b.title,"es"));
   return rows;
 },[items,q,category,sort]);
 async function share(path:string,title:string){
  const url=window.location.origin+path;
  try{
    if(navigator.share){await navigator.share({title,url});return;}
    await navigator.clipboard.writeText(url);setFeedback("Enlace copiado");
  }catch{setFeedback("Copiá el enlace desde la barra del navegador.");}
 }
 return <section id="catalogo" className="mx-auto max-w-7xl px-4 py-9 md:px-8">
  <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Elegí lo que te gusta</p><h2 className="mt-1 text-2xl font-extrabold text-slate-950">Nuestro catálogo</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} de {items.length} artículos</p></div>
   <button onClick={()=>share(`/tienda/${slug}`,"Compartir tienda")} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Share2 className="h-4 w-4"/> Compartir tienda</button>
  </div>
  <div className="mb-6 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_170px_170px]">
   <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nombre o código..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm" aria-label="Buscar artículos"/></label>
   <label className="relative"><SlidersHorizontal className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filtrar categoría" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-2 text-sm">{categories.map(cat=><option key={cat}>{cat}</option>)}</select></label>
   <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Ordenar artículos" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="new">Destacados</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="name">Nombre A–Z</option></select>
  </div>
  {feedback?<p role="status" className="mb-3 text-sm text-blue-700">{feedback}</p>:null}
  {!filtered.length?<div className="rounded-2xl border bg-white p-12 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-3 font-semibold text-slate-600">No encontramos artículos con esos filtros.</p><button onClick={()=>{setQ("");setCategory("Todas");}} className="mt-3 font-bold text-blue-700 underline">Ver todos los artículos</button></div>:
   <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
    {filtered.map(item=>{
      const discount=item.compare_at_price&&item.compare_at_price>item.price?Math.round((1-item.price/item.compare_at_price)*100):0;
      const wa=whatsappUrl(whatsapp,item.title,item.code);
      return <article key={item.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
       <Link href={`/tienda/${slug}/${item.id}`} className="relative block aspect-square overflow-hidden bg-slate-100">
         {item.image_url?<img loading="lazy" src={item.image_url} alt={item.title} className="h-full w-full object-cover transition duration-300 hover:scale-105"/>:<span className="flex h-full flex-col items-center justify-center gap-2 text-slate-400"><ImageOff className="h-9 w-9"/><span className="text-xs">Sin fotografía</span></span>}
         {discount>0?<span className="absolute left-2 top-2 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">-{discount}%</span>:null}
       </Link>
       <div className="flex flex-1 flex-col p-3 sm:p-4"><div className="text-[11px] font-semibold text-slate-500">{item.category_name||"Otros"} · <span className="font-mono">{item.code}</span></div>
        <Link href={`/tienda/${slug}/${item.id}`} className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 hover:text-blue-700">{item.title}</Link>
        <div className="mt-2">{item.compare_at_price&&discount>0?<div className="text-xs text-slate-400 line-through">{itemMoney(item.compare_at_price,item.currency)}</div>:null}<div className="text-lg font-extrabold text-slate-950">{itemMoney(item.price,item.currency)}</div></div>
        <div className="mt-auto flex gap-2 pt-4"><Link href={`/tienda/${slug}/${item.id}`} className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50">Ver detalle</Link>
         {wa?<a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`Consultar ${item.title} por WhatsApp`} className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"><MessageCircle className="h-4 w-4"/></a>:null}
         <button onClick={()=>share(`/tienda/${slug}/${item.id}`,item.title)} aria-label={`Compartir ${item.title}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Share2 className="h-4 w-4"/></button>
        </div>
       </div>
      </article>;
    })}
   </div>}
 </section>;
}
