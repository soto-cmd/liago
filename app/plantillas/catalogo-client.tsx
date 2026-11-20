"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {Search,ChevronLeft,ChevronRight,ArrowUpRight} from "lucide-react";
import PlantillasNav from "./nav";
import {entries,initial,svgFor} from "./estudio";
import {paperVariants,variantFamilies,variantTotal} from "./variantes";

type Mode="plantillas"|"imprimibles";
const CATEGORY_TITLE:Record<string,string>={
 "Planificación":"Planificadores y colecciones editables",
 "Lectura":"Planificadores y colecciones editables",
 "Registros":"Planificadores y colecciones editables",
 "Música editable":"Planificadores y colecciones editables",
 "Estudio visual":"Planificadores y colecciones editables",
 "Deportes":"Planificadores y colecciones editables"
};
function Preview({template,paper,spacing,margin,ink,landscape}:{template:string;paper?:string;spacing?:number;margin?:number;ink?:string;landscape?:boolean}){
 const art=useMemo(()=>svgFor({...initial,template,paper:paper||"A4",spacing:spacing??7,margin:margin??13,ink:ink||"#333f53",landscape:landscape??false}),[template,paper,spacing,margin,ink,landscape]);
 return <div className="flex h-52 items-center justify-center overflow-hidden border border-stone-200 bg-[#f2eee8] p-3 sm:h-64">
 <div className="h-full max-w-full overflow-hidden bg-white shadow-[0_8px_20px_#00000018]" style={{aspectRatio:`${art.w}/${art.h}`}}><div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{__html:art.svg}}/></div>
 </div>;
}
export default function CatalogoClient({mode}:{mode:Mode}){
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("Todas");
 const [page,setPage]=useState(0);
 const [rowOffset,setRowOffset]=useState<Record<string,number>>({});
 const perPage=24;
 const groups=Array.from(new Set(entries.map(e=>e.group)));
 const visibleTemplates=entries.filter(e=>(category==="Todas"||category===e.group)&&(`${e.name} ${e.group}`.toLowerCase().includes(search.toLowerCase())));
 const visibleVariants=paperVariants.filter(v=>(category==="Todas"||category===v.family)&&(`${v.name} ${v.family}`.toLowerCase().includes(search.toLowerCase())));
 const categories=mode==="plantillas"?groups:variantFamilies.map(f=>f.name);
 const itemsCount=mode==="plantillas"?visibleTemplates.length:visibleVariants.length;
 const paged=visibleVariants.slice(page*perPage,(page+1)*perPage);
 const setFilter=(value:string)=>{setCategory(value);setPage(0);setRowOffset({});};
 const selection=<aside className="w-full shrink-0 border-b border-stone-200 bg-[#faf9f6] px-5 py-6 lg:sticky lg:top-[68px] lg:h-[calc(100vh-68px)] lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r">
  <label className="text-sm font-medium">Buscar {mode==="plantillas"?"plantillas":"una familia de papel"}</label>
  <div className="relative mt-3"><Search size={16} className="absolute left-3 top-3 text-stone-400"/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-800" placeholder="Busca por nombre o uso"/></div>
  <h2 className="mb-3 mt-7 text-xs font-semibold text-stone-500">Categorías</h2>
  <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-0.5">{["Todas",...categories].map(label=><button key={label} onClick={()=>setFilter(label)} className={`flex w-auto shrink-0 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm lg:w-full lg:whitespace-normal ${category===label?"border-l-[3px] border-blue-900 bg-[#f0ece4] font-semibold text-blue-900":"hover:bg-stone-100"}`}><span>{label}</span><span className="text-xs text-stone-400">{label==="Todas"?(mode==="plantillas"?entries.length:variantTotal):mode==="plantillas"?entries.filter(e=>e.group===label).length:variantFamilies.find(f=>f.name===label)?.count}</span></button>)}</div>
 </aside>;
 return <main className="min-h-screen bg-[#faf9f6] text-[#242424]">
 <PlantillasNav active={mode==="plantillas"?"plantillas":"imprimibles"}/>
 <div className="lg:flex">
 {selection}
 <div className="min-w-0 flex-1 px-5 py-8 sm:px-9 lg:px-10">
 <div className="border-b border-stone-200 pb-6">
 <p className="text-xs font-semibold uppercase tracking-widest text-blue-900">{mode==="plantillas"?"Plantillas":"Imprimibles"}</p>
 <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-5xl">{mode==="plantillas"?"Plantillas de papel imprimibles gratis":"Imprimibles para aprender, trabajar y organizarse"}</h1>
 <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600"><p>{mode==="plantillas"?"Elegí una estructura y después el tamaño, las medidas y la orientación.":"Seleccioná una variante y personalizala en el editor de Liago."}</p><span>{mode==="plantillas"?`${entries.length} plantillas editables · ${variantTotal} variantes`:`${variantFamilies.length} familias · ${variantTotal} variantes`}</span></div>
 </div>
 {mode==="plantillas"?
 <div className="space-y-12 py-9">
 {groups.filter(group=>category==="Todas"||category===group).map(group=>{
  const items=visibleTemplates.filter(e=>e.group===group);if(!items.length)return null;
  const offset=rowOffset[group]||0,windowed=items.slice(offset,offset+5);
  return <section key={group}>
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
  <div><h2 className="font-serif text-2xl">{group}</h2><p className="mt-1 text-xs text-stone-500">{items.length} plantillas editables</p></div>
  {items.length>5&&<div className="flex gap-2"><button aria-label={"Ver plantillas anteriores de "+group} disabled={!offset} onClick={()=>setRowOffset(v=>({...v,[group]:Math.max(0,offset-5)}))} className="rounded-lg border border-stone-200 bg-white p-2 disabled:opacity-30"><ChevronLeft size={19}/></button><button aria-label={"Ver más plantillas de "+group} disabled={offset+5>=items.length} onClick={()=>setRowOffset(v=>({...v,[group]:Math.min(Math.max(0,items.length-5),offset+5)}))} className="rounded-lg border border-stone-200 bg-white p-2 disabled:opacity-30"><ChevronRight size={19}/></button></div>}
  </div>
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{windowed.map(e=><Link key={e.id} href={`/plantillas?template=${encodeURIComponent(e.id)}`} className="group min-w-0">
  <Preview template={e.id}/>
  <div className="mt-2 flex items-start justify-between gap-1"><span className="font-serif text-base group-hover:text-blue-900">{e.name}</span><ArrowUpRight size={16} className="shrink-0 text-stone-400 group-hover:text-blue-900"/></div>
  </Link>)}</div>
  </section>;
 })}
 {visibleTemplates.length===0&&<p className="rounded-lg border p-8 text-center text-stone-500">No se encontraron plantillas para esta búsqueda.</p>}
 </div>:
 <div className="py-9">
 <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl">{category==="Todas"?"Todas las variantes":category}</h2><span className="text-xs text-stone-500">{itemsCount} opciones · Medidas en mm</span></div>
 <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{paged.map(v=><Link key={v.id} href={`/plantillas?variant=${encodeURIComponent(v.id)}`} className="group min-w-0">
 <Preview template={v.template} paper={v.paper} spacing={v.spacing} margin={v.margin} ink={v.ink} landscape={v.landscape}/>
 <p className="mt-2 font-serif text-base group-hover:text-blue-900">{v.name}</p><p className="mt-1 text-xs text-stone-500">{v.family} · {v.paper}</p>
 </Link>)}</div>
 {!paged.length&&<p className="rounded-xl border p-8 text-stone-500">No se encontraron resultados.</p>}
 {itemsCount>perPage&&<div className="mt-8 flex items-center justify-center gap-3 text-sm"><button disabled={page===0} onClick={()=>{setPage(v=>Math.max(0,v-1));window.scrollTo({top:0,behavior:"smooth"})}} className="rounded-lg border px-3 py-2 disabled:opacity-30">Anterior</button><span>{page+1} de {Math.ceil(itemsCount/perPage)}</span><button disabled={(page+1)*perPage>=itemsCount} onClick={()=>{setPage(v=>v+1);window.scrollTo({top:0,behavior:"smooth"})}} className="rounded-lg border px-3 py-2 disabled:opacity-30">Siguiente</button></div>}
 </div>}
 <footer className="mt-10 border-t border-stone-200 py-6 text-center text-xs text-stone-500">Liago · Creado por Adrián Soto</footer>
 </div></div></main>;
}