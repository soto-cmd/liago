"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowUp,Heart,Home,ImageOff,MessageCircle,Search,Share2,ShoppingBag,SlidersHorizontal,Tag,X,Minus,Plus} from "lucide-react";
import {itemMoney,whatsappUrl,type StoreItemPublic} from "@/lib/online-store/public";

type Props={items:StoreItemPublic[];slug:string;whatsapp:string|null};
function badgeFor(item:StoreItemPublic){return item.listing_status==="SOLD"?"Vendido":item.listing_status==="RESERVED"?"Reservado":"";}
function digits(phone:string|null){return (phone||"").replace(/\D/g,"");}
export function PublicCatalog({items,slug,whatsapp}:Props) {
 const [q,setQ]=useState("");
 const [category,setCategory]=useState("Todas");
 const [sort,setSort]=useState("new");
 const [min,setMin]=useState("");
 const [max,setMax]=useState("");
 const [discountOnly,setDiscountOnly]=useState(false);
 const [condition,setCondition]=useState("Todas");
 const [status,setStatus]=useState("Todas");
 const [advanced,setAdvanced]=useState(false);
 const [favorites,setFavorites]=useState<string[]>([]);
 const [cart,setCart]=useState<Record<string,number>>({});
 const [cartOpen,setCartOpen]=useState(false);
 const [feedback,setFeedback]=useState("");
 const [loaded,setLoaded]=useState(false);
 const categories=useMemo(()=>["Todas",...Array.from(new Set(items.map(x=>x.category_name||"Otros"))).sort((a,b)=>a.localeCompare(b,"es"))],[items]);
 useEffect(()=>{
   try{const v=JSON.parse(localStorage.getItem(`liago:${slug}:favorites`)||"[]");if(Array.isArray(v))setFavorites(v.filter((x):x is string=>typeof x==="string").slice(0,200));}catch{}
   try{const v=JSON.parse(localStorage.getItem(`liago:${slug}:cart`)||"{}");if(v&&typeof v==="object"&&!Array.isArray(v))setCart(Object.fromEntries(Object.entries(v).filter(([id,n])=>items.some(x=>x.id===id&&x.listing_status==="AVAILABLE")&&Number.isInteger(Number(n))&&Number(n)>0).map(([id,n])=>[id,Math.min(99,Number(n))])));}catch{}
   setLoaded(true);
 },[slug,items]);
 useEffect(()=>{if(loaded){try{localStorage.setItem(`liago:${slug}:favorites`,JSON.stringify(favorites))}catch{}}},[favorites,loaded,slug]);
 useEffect(()=>{if(loaded){try{localStorage.setItem(`liago:${slug}:cart`,JSON.stringify(cart))}catch{}}},[cart,loaded,slug]);
 const filtered=useMemo(()=>{
   const needle=q.trim().toLocaleLowerCase("es");
   const lower=min===""?null:Number(min),upper=max===""?null:Number(max);
   const rows=items.filter(x=>(category==="Todas"||(x.category_name||"Otros")===category)
      &&(!needle||[x.title,x.code,x.category_name||"",x.description||""].join(" ").toLocaleLowerCase("es").includes(needle))
      &&(lower===null||!Number.isFinite(lower)||x.price>=lower)
      &&(upper===null||!Number.isFinite(upper)||x.price<=upper)
      &&(!discountOnly||(x.compare_at_price!==null&&x.compare_at_price>x.price))
      &&(condition==="Todas"||x.item_condition===condition)
      &&(status==="Todas"||x.listing_status===status));
   if(sort==="price-asc")rows.sort((a,b)=>a.price-b.price);
   else if(sort==="price-desc")rows.sort((a,b)=>b.price-a.price);
   else if(sort==="name")rows.sort((a,b)=>a.title.localeCompare(b.title,"es"));
   return rows;
 },[items,q,category,sort,min,max,discountOnly,condition,status]);
 const cartItems=items.filter(x=>cart[x.id]>0&&x.listing_status==="AVAILABLE");
 const cartCount=cartItems.reduce((sum,x)=>sum+(cart[x.id]||0),0);
 const cartTotal=cartItems.reduce((sum,x)=>sum+(cart[x.id]||0)*x.price,0);
 const waDigits=digits(whatsapp);
 const cartMessage=cartItems.map(x=>`• ${x.code} · ${x.title} (x${cart[x.id]}) — ${itemMoney(x.price*cart[x.id],x.currency)}`).join("\n");
 const cartLink=waDigits&&cartItems.length?`https://wa.me/${waDigits}?text=${encodeURIComponent(`Hola, quisiera consultar por estos productos de la tienda:\n\n${cartMessage}\n\nTotal estimado: ${itemMoney(cartTotal,"PYG")}\n¿Están disponibles? Muchas gracias.`)}`:null;
 function count(id:string,delta:number){setCart(old=>{const n=Math.max(0,Math.min(99,(old[id]||0)+delta));const next={...old};if(n===0)delete next[id];else next[id]=n;return next;});}
 function favorite(id:string){setFavorites(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id].slice(0,200));}
 async function share(path:string,title:string){
  const url=window.location.origin+path;
  try{if(navigator.share){await navigator.share({title,url});return;}await navigator.clipboard.writeText(url);setFeedback("Enlace copiado");}
  catch{setFeedback("No se pudo copiar automáticamente. Usá la barra del navegador.");}
 }
 function clearFilters(){setQ("");setCategory("Todas");setMin("");setMax("");setCondition("Todas");setStatus("Todas");setDiscountOnly(false);setSort("new");}
 const discounts=items.filter(x=>x.compare_at_price!==null&&x.compare_at_price>x.price).length;
 return <section id="catalogo" className="mx-auto max-w-7xl px-4 py-8 md:px-8">
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
   <div><p className="text-[11px] font-black uppercase tracking-[.15em] text-blue-700">Explorá nuestros productos</p><h2 className="mt-1 text-2xl font-extrabold text-slate-950">Catálogo</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} de {items.length} artículos</p></div>
   <div className="flex flex-wrap gap-2">
    <button type="button" onClick={()=>share(`/tienda/${slug}`,"Compartir tienda")} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Share2 className="h-4 w-4"/> Compartir</button>
    <button type="button" onClick={()=>{setCartOpen(true);setFeedback("");}} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"><ShoppingBag className="h-4 w-4"/> Lista de consulta <span className="rounded-full bg-white/20 px-2 py-0.5">{cartCount}</span></button>
   </div>
  </div>
  {items.length>0?<div className="mb-5 flex gap-2 overflow-x-auto pb-1">{categories.map(cat=><button key={cat} type="button" onClick={()=>setCategory(cat)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${category===cat?"border-slate-900 bg-slate-900 text-white":"border-slate-200 bg-white text-slate-700 hover:border-blue-400"}`}>{cat}</button>)}</div>:null}
  <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
   <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px_auto]">
    <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar artículos, categorías o códigos" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm" aria-label="Buscar artículos"/></label>
    <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Ordenar artículos" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="new">Destacados</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="name">Nombre A–Z</option></select>
    <button type="button" onClick={()=>setAdvanced(x=>!x)} aria-expanded={advanced} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold"><SlidersHorizontal className="h-4 w-4"/> Filtros {advanced?"−":"+"}</button>
   </div>
   {advanced?<div className="mt-3 grid gap-2 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4">
    <label className="text-xs font-semibold text-slate-600">Precio mínimo<input type="number" value={min} onChange={e=>setMin(e.target.value)} min={0} placeholder="Desde G." className="mt-1 w-full rounded-lg border p-2.5 text-sm"/></label>
    <label className="text-xs font-semibold text-slate-600">Precio máximo<input type="number" value={max} onChange={e=>setMax(e.target.value)} min={0} placeholder="Hasta G." className="mt-1 w-full rounded-lg border p-2.5 text-sm"/></label>
    <label className="text-xs font-semibold text-slate-600">Condición<select value={condition} onChange={e=>setCondition(e.target.value)} className="mt-1 w-full rounded-lg border bg-white p-2.5 text-sm"><option value="Todas">Todas</option><option value="NEW">Nuevo</option><option value="USED">Usado</option></select></label>
    <label className="text-xs font-semibold text-slate-600">Disponibilidad<select value={status} onChange={e=>setStatus(e.target.value)} className="mt-1 w-full rounded-lg border bg-white p-2.5 text-sm"><option value="Todas">Todos</option><option value="AVAILABLE">Disponible</option><option value="RESERVED">Reservado</option><option value="SOLD">Vendido</option></select></label>
    <label className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={discountOnly} onChange={e=>setDiscountOnly(e.target.checked)} className="h-4 w-4"/> Solo ofertas ({discounts})</label>
    <button type="button" onClick={clearFilters} className="rounded-lg border p-2 text-xs font-semibold text-blue-700">Limpiar filtros</button>
   </div>:null}
  </div>
  {feedback?<p role="status" className="mb-3 text-xs font-semibold text-blue-700">{feedback}</p>:null}
  {!filtered.length?<div className="rounded-xl border bg-white p-12 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-slate-300"/><p className="mt-3 font-semibold text-slate-600">No hay artículos con esos filtros.</p><button type="button" onClick={clearFilters} className="mt-3 font-bold text-blue-700 underline">Mostrar todos</button></div>:
   <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
    {filtered.map(item=>{
      const discount=item.compare_at_price&&item.compare_at_price>item.price?Math.round((1-item.price/item.compare_at_price)*100):0;
      const wa=whatsappUrl(whatsapp,item.title,item.code);
      const available=item.listing_status==="AVAILABLE";
      const photo=item.images?.[0]||item.image_url;
      return <article key={item.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
       <div className="relative aspect-square overflow-hidden bg-slate-100">
        <Link href={`/tienda/${slug}/${item.id}`} className="block h-full w-full">{photo?<img loading="lazy" src={photo} alt={item.title} className={`h-full w-full object-cover transition duration-300 hover:scale-105 ${!available?"opacity-70":""}`}/>:<span className="flex h-full flex-col items-center justify-center gap-2 text-slate-400"><ImageOff className="h-9 w-9"/><span className="text-xs">Sin fotografía</span></span>}</Link>
        {discount>0?<span className="absolute left-2 top-2 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">-{discount}%</span>:null}
        {badgeFor(item)?<span className="absolute bottom-2 left-2 rounded-lg bg-slate-900/90 px-2 py-1 text-xs font-bold text-white">{badgeFor(item)}</span>:null}
        <button type="button" onClick={()=>favorite(item.id)} aria-label={favorites.includes(item.id)?"Quitar de favoritos":"Agregar a favoritos"} aria-pressed={favorites.includes(item.id)} className="absolute right-2 top-2 rounded-full bg-white/95 p-2 text-slate-600 shadow"><Heart className={`h-4 w-4 ${favorites.includes(item.id)?"fill-red-500 text-red-500":""}`}/></button>
       </div>
       <div className="flex flex-1 flex-col p-3"><div className="text-[11px] font-medium text-slate-500">{item.category_name||"Otros"} · <span className="font-mono">{item.code}</span></div>
        <Link href={`/tienda/${slug}/${item.id}`} className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 hover:text-blue-700">{item.title}</Link>
        <div className="mt-2">{item.compare_at_price&&discount>0?<div className="text-xs text-slate-400 line-through">{itemMoney(item.compare_at_price,item.currency)}</div>:null}<div className="text-lg font-extrabold text-slate-950">{itemMoney(item.price,item.currency)}</div></div>
        <p className="mt-1 text-[11px] text-slate-500">{item.item_condition==="USED"?"Usado":"Nuevo"}</p>
        <div className="mt-auto grid grid-cols-[1fr_auto_auto] gap-1.5 pt-4">
         <Link href={`/tienda/${slug}/${item.id}`} className="rounded-lg border px-2 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50">Detalle</Link>
         {available?<button type="button" onClick={()=>count(item.id,1)} title="Agregar a lista de consulta" aria-label={`Agregar ${item.title} a lista`} className="rounded-lg bg-slate-900 p-2 text-white hover:bg-slate-700"><Plus className="h-4 w-4"/></button>:null}
         {wa&&available?<a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`Consultar ${item.title} por WhatsApp`} className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"><MessageCircle className="h-4 w-4"/></a>:null}
        </div>
        <button type="button" onClick={()=>share(`/tienda/${slug}/${item.id}`,item.title)} className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-700"><Share2 className="h-3 w-3"/> Compartir artículo</button>
       </div>
      </article>;
    })}
   </div>}
   {cartOpen?<div role="dialog" aria-modal="true" aria-label="Lista de consulta" className="fixed inset-0 z-[80] flex justify-end bg-black/45" onClick={()=>setCartOpen(false)}>
    <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={e=>e.stopPropagation()}>
     <header className="flex items-center justify-between border-b p-4"><div><h3 className="text-lg font-extrabold">Lista de consulta</h3><p className="text-xs text-slate-500">{cartCount} artículos · Sin pago online</p></div><button autoFocus aria-label="Cerrar lista" type="button" onClick={()=>setCartOpen(false)} className="rounded-lg border p-2"><X className="h-5 w-5"/></button></header>
     <div className="flex-1 space-y-3 overflow-y-auto p-4">{cartItems.length?cartItems.map(x=><div key={x.id} className="flex items-center gap-3 rounded-xl border p-3">
      {x.images?.[0]||x.image_url?<img src={x.images?.[0]||x.image_url||""} alt="" className="h-14 w-14 rounded-lg object-cover"/>:<span className="h-14 w-14 rounded-lg bg-slate-100"/>}
      <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold">{x.title}</p><p className="text-xs text-slate-500">{x.code}</p><p className="font-bold">{itemMoney(x.price*cart[x.id],x.currency)}</p></div>
      <div className="flex items-center gap-1"><button aria-label="Quitar uno" type="button" onClick={()=>count(x.id,-1)} className="rounded-md border p-1.5"><Minus className="h-3 w-3"/></button><span className="min-w-4 text-center text-xs font-bold">{cart[x.id]}</span><button aria-label="Agregar uno" type="button" onClick={()=>count(x.id,1)} className="rounded-md border p-1.5"><Plus className="h-3 w-3"/></button></div>
     </div>):<p className="py-12 text-center text-sm text-slate-500">Tu lista está vacía. Agregá artículos del catálogo para consultarlos.</p>}</div>
     <footer className="space-y-3 border-t p-4"><div className="flex justify-between text-sm font-bold"><span>Total estimado</span><span>{itemMoney(cartTotal,"PYG")}</span></div><p className="text-xs text-slate-500">La lista genera una consulta al comercio. El precio final y la disponibilidad deben confirmarse antes de comprar.</p>
      {cartLink?<a href={cartLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white"><MessageCircle className="h-4 w-4"/> Consultar lista por WhatsApp</a>:<p className="text-xs text-amber-700">El comercio todavía no configuró WhatsApp para consultas.</p>}
      <button type="button" onClick={()=>setCartOpen(false)} className="w-full rounded-xl border py-2.5 text-sm font-semibold">Seguir explorando</button>
     </footer>
    </div>
   </div>:null}
   <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-500">
    <a href="#" className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2"><ArrowUp className="h-3 w-3"/> Arriba</a>
    <Link href={`/tienda/${slug}`} className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2"><Home className="h-3 w-3"/> Inicio</Link>
    <button type="button" onClick={()=>{clearFilters();setFeedback("Filtros restablecidos");}} className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2"><Tag className="h-3 w-3"/> Ver todos</button>
   </div>
 </section>;
}
