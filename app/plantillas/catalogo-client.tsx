"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
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
 useEffect(()=>{const q=new URLSearchParams(window.location.search);const item=q.get("categoria");if(item&&variantFamilies.some(f=>f.name===item))setCategory(item)},[]);
 const curated=[
  {title:"Planificación y organización",body:"Organizá tus citas, prioridades y tareas en un mismo lugar.",template:"plan-semanal",family:"Papel pautado"},
  {title:"Imprimibles para aprender",body:"Hojas para practicar letras, escritura y matemáticas.",template:"aprender-inicial",family:"Aprendizaje infantil"},
  {title:"Hogar y familia",body:"Listas, tareas y registros que simplifican el día a día.",template:"tareas-ninos",family:"Tabla de tareas para niños"},
  {title:"Trabajo y proyectos",body:"Presupuestos, seguimientos, hojas técnicas y notas.",template:"presupuesto",family:"Hoja de presupuesto"},
  {title:"Música y aficiones",body:"Pentagramas, tablaturas y hojas de composición.",template:"pentagrama",family:"Papel pautado manuscrito"}
 ];
 const learningTemplates=entries.filter(e=>e.group==="Aprendizaje infantil");
 const filteredLearning=learningTemplates.filter(e=>`${e.name} ${e.group}`.toLowerCase().includes(search.toLowerCase()));
 const perPage=24;
 const groups=Array.from(new Set(entries.map(e=>e.group)));
 const visibleTemplates=entries.filter(e=>(category==="Todas"||category===e.group)&&(`${e.name} ${e.group}`.toLowerCase().includes(search.toLowerCase())));
 const visibleVariants=paperVariants.filter(v=>(category==="Todas"||category===v.family)&&(`${v.name} ${v.family}`.toLowerCase().includes(search.toLowerCase())));
 const categories=mode==="plantillas"?groups:["Aprendizaje infantil",...variantFamilies.map(f=>f.name)];
 const itemsCount=mode==="plantillas"?visibleTemplates.length:category==="Aprendizaje infantil"?filteredLearning.length:visibleVariants.length;
 const paged=category==="Aprendizaje infantil"?[]:visibleVariants.slice(page*perPage,(page+1)*perPage);
 const setFilter=(value:string)=>{setCategory(value);setPage(0);setRowOffset({});};
 const selection=<aside className="w-full shrink-0 border-b border-stone-200 bg-[#faf9f6] px-5 py-6 lg:sticky lg:top-[68px] lg:h-[calc(100vh-68px)] lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r">
  <label className="text-sm font-medium">Buscar {mode==="plantillas"?"plantillas":"una familia de papel"}</label>
  <div className="relative mt-3"><Search size={16} className="absolute left-3 top-3 text-stone-400"/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-800" placeholder="Busca por nombre o uso"/></div>
  <h2 className="mb-3 mt-7 text-xs font-semibold text-stone-500">Categorías</h2>
  <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-0.5">{["Todas",...categories].map(label=><button key={label} onClick={()=>setFilter(label)} className={`flex w-auto shrink-0 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm lg:w-full lg:whitespace-normal ${category===label?"border-l-[3px] border-blue-900 bg-[#f0ece4] font-semibold text-blue-900":"hover:bg-stone-100"}`}><span>{label}</span><span className="text-xs text-stone-400">{label==="Todas"?(mode==="plantillas"?entries.length:variantTotal+learningTemplates.length):mode==="plantillas"?entries.filter(e=>e.group===label).length:label==="Aprendizaje infantil"?learningTemplates.length:variantFamilies.find(f=>f.name===label)?.count}</span></button>)}</div>
 </aside>;
 return <main className="min-h-screen bg-[#faf9f6] text-[#242424]">
 <PlantillasNav active={mode==="plantillas"?"plantillas":"imprimibles"}/>
 <div className="lg:flex">
 {selection}
 <div className="min-w-0 flex-1 px-5 py-8 sm:px-9 lg:px-10">
 <div className="border-b border-stone-200 pb-6">
 <p className="text-xs font-semibold uppercase tracking-widest text-blue-900">{mode==="plantillas"?"Plantillas":"Imprimibles"}</p>
 <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-5xl">{mode==="plantillas"?"Plantillas de papel imprimibles gratis":"Imprimibles para aprender, trabajar y organizarse"}</h1>
 <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600"><p>{mode==="plantillas"?"Elegí una estructura y después el tamaño, las medidas y la orientación.":"Seleccioná una variante y personalizala en el editor de Liago."}</p><span>{mode==="plantillas"?`${entries.length} plantillas editables · ${variantTotal} variantes`:`${variantFamilies.length+1} familias · ${variantTotal+learningTemplates.length} opciones`}</span></div>
 </div>
 {mode==="imprimibles"&&category==="Todas"&&!search&&<section className="border-b border-stone-200 py-8">
 <nav aria-label="Secciones de imprimibles" className="mb-7 flex flex-wrap gap-x-7 gap-y-2 text-sm text-stone-600">{curated.map(group=><a href={"#"+group.title.replaceAll(" ","-")} key={group.title} className="hover:text-blue-900">{group.title}</a>)}</nav>
 <div className="grid gap-7 md:grid-cols-2">{curated.map(group=><article id={group.title.replaceAll(" ","-")} key={group.title} className="min-w-0">
 <Link href={`/plantillas?template=${group.template}`} className="block overflow-hidden rounded-xl border border-stone-200 bg-[#eae7e0] p-4 transition hover:border-blue-900">
 <div className="mx-auto max-w-72 -rotate-1 bg-white shadow-lg"><Preview template={group.template}/></div>
 </Link>
 <h2 className="mt-4 font-serif text-2xl">{group.title}</h2><p className="mt-2 text-sm text-stone-600">{group.body}</p>
 <Link href={`/plantillas/imprimibles?categoria=${encodeURIComponent(group.family)}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-900">Ver opciones <ArrowUpRight size={15}/></Link>
 </article>)}</div></section>}
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
 {(category==="Todas"||category==="Aprendizaje infantil")&&<section className="mb-10">
 <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
 <div><h3 className="font-serif text-2xl">Imprimibles para aprender</h3><p className="mt-1 text-xs text-stone-500">Letras, números, matemáticas y reconocimiento visual. Editables y gratuitos.</p></div>
 {category==="Todas"&&<button type="button" onClick={()=>setFilter("Aprendizaje infantil")} className="text-sm font-semibold text-blue-900">Ver todas las actividades</button>}
 </div>
 <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
 {filteredLearning.map(e=><Link key={e.id} href={`/plantillas?template=${encodeURIComponent(e.id)}`} className="group min-w-0">
 <Preview template={e.id}/>
 <p className="mt-2 font-serif text-base group-hover:text-blue-900">{e.name}</p>
 <p className="mt-1 text-xs text-stone-500">Aprendizaje infantil · A4 o Carta</p>
 </Link>)}
 </div>
 {filteredLearning.length===0&&<p className="py-6 text-sm text-stone-500">No se encontraron actividades educativas.</p>}
 </section>}
 <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{paged.map(v=><Link key={v.id} href={`/plantillas?variant=${encodeURIComponent(v.id)}`} className="group min-w-0">
 <Preview template={v.template} paper={v.paper} spacing={v.spacing} margin={v.margin} ink={v.ink} landscape={v.landscape}/>
 <p className="mt-2 font-serif text-base group-hover:text-blue-900">{v.name}</p><p className="mt-1 text-xs text-stone-500">{v.family} · {v.paper}</p>
 </Link>)}</div>
 {category!=="Aprendizaje infantil"&&!paged.length&&<p className="rounded-xl border p-8 text-stone-500">No se encontraron resultados.</p>}
 {category!=="Aprendizaje infantil"&&itemsCount>perPage&&<div className="mt-8 flex items-center justify-center gap-3 text-sm"><button disabled={page===0} onClick={()=>{setPage(v=>Math.max(0,v-1));window.scrollTo({top:0,behavior:"smooth"})}} className="rounded-lg border px-3 py-2 disabled:opacity-30">Anterior</button><span>{page+1} de {Math.ceil(itemsCount/perPage)}</span><button disabled={(page+1)*perPage>=itemsCount} onClick={()=>{setPage(v=>v+1);window.scrollTo({top:0,behavior:"smooth"})}} className="rounded-lg border px-3 py-2 disabled:opacity-30">Siguiente</button></div>}
 </div>}
 <footer className="mt-10 border-t border-stone-200 py-6 text-center text-xs text-stone-500">Liago · Creado por Adrián Soto</footer>
 </div></div></main>;
}