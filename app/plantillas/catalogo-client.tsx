"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {Search,ChevronLeft,ChevronRight,ArrowUpRight,X} from "lucide-react";
import {categories,categoryForTemplate,categoryForVariant,categoryLabel,templateMatches,variantMatches,normalizeSearch} from "./taxonomia";
import PlantillasNav from "./nav";
import {entries,initial,svgFor} from "./estudio";
import {paperVariants,variantFamilies,variantTotal} from "./variantes";

type Mode="plantillas"|"imprimibles";
function Preview({template,paper,spacing,margin,ink,landscape}:{template:string;paper?:string;spacing?:number;margin?:number;ink?:string;landscape?:boolean}){
 const art=useMemo(()=>svgFor({...initial,template,paper:paper||"A4",spacing:spacing??7,margin:margin??13,ink:ink||"#333f53",landscape:landscape??false}),[template,paper,spacing,margin,ink,landscape]);
 return <div className="flex h-52 items-center justify-center overflow-hidden border border-stone-200 bg-[#f2eee8] p-3 sm:h-64">
 <div className="h-full max-w-full overflow-hidden bg-white shadow-[0_8px_20px_#00000018]" style={{aspectRatio:`${art.w}/${art.h}`}}><div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{__html:art.svg}}/></div>
 </div>;
}
export default function CatalogoClient({mode}:{mode:Mode}){
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("Todas");
 const [family,setFamily]=useState("Todas");
 const [page,setPage]=useState(0);
 const [rowOffset,setRowOffset]=useState<Record<string,number>>({});
 useEffect(()=>{const q=new URLSearchParams(window.location.search);const item=q.get("categoria");const term=q.get("buscar");if(term)setSearch(term);if(item&&categories.some(c=>c.id===item))setCategory(item);else if(item&&mode==="imprimibles"&&variantFamilies.some(f=>f.name===item)){setFamily(item);setCategory("Todas")}},[mode]);
 const curated=[
  {title:"Planificación y organización",body:"Organizá tus citas, prioridades y tareas en un mismo lugar.",template:"plan-semanal",category:"planificacion"},
  {title:"Imprimibles para aprender",body:"Hojas para practicar letras, escritura y matemáticas.",template:"letter-tracing-worksheet",category:"aprendizaje"},
  {title:"Hogar y familia",body:"Listas, tareas y registros que simplifican el día a día.",template:"tareas-ninos",category:"hogar"},
  {title:"Trabajo y proyectos",body:"Presupuestos, seguimientos, hojas técnicas y notas.",template:"presupuesto",category:"trabajo"},
  {title:"Música y aficiones",body:"Pentagramas, tablaturas y hojas de composición.",template:"pentagrama",category:"musica"}
 ];

 const perPage=24;
 const visibleTemplates=entries.filter(e=>(category==="Todas"||categoryForTemplate(e)===category)&&templateMatches(e,search)).sort((a,b)=>search?Number(normalizeSearch(b.name).includes(normalizeSearch(search)))-Number(normalizeSearch(a.name).includes(normalizeSearch(search))):0);
 const visibleVariants=paperVariants.filter(v=>(category==="Todas"||categoryForVariant(v)===category)&&(family==="Todas"||v.family===family)&&variantMatches(v,search));
 const itemsCount=mode==="plantillas"?visibleTemplates.length:visibleVariants.length;
 const paged=visibleVariants.slice(page*perPage,(page+1)*perPage);
 const pageTemplates=search.trim()?visibleTemplates.slice(page*perPage,(page+1)*perPage):visibleTemplates;
 const familyOptions=variantFamilies.filter(f=>category==="Todas"||paperVariants.some(v=>v.family===f.name&&categoryForVariant(v)===category));
 const countFor=(id:string)=>mode==="plantillas"?entries.filter(e=>id==="Todas"||categoryForTemplate(e)===id).length:paperVariants.filter(v=>id==="Todas"||categoryForVariant(v)===id).length;
 const setFilter=(value:string)=>{setCategory(value);setFamily("Todas");setPage(0);setRowOffset({});};
 const reset=()=>{setSearch("");setFilter("Todas");};

 const selection=<aside className="w-full shrink-0 border-b border-stone-200 bg-[#faf9f6] px-5 py-5 lg:sticky lg:top-[68px] lg:h-[calc(100vh-68px)] lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r">
  <label htmlFor="liago-catalog-search" className="text-sm font-bold text-stone-800">Buscar {mode==="plantillas"?"plantillas":"imprimibles"}</label>
  <div className="relative mt-2">
   <Search size={17} className="pointer-events-none absolute left-3 top-3 text-stone-400"/>
   <input id="liago-catalog-search" type="search" value={search} onChange={e=>{setSearch(e.target.value);setCategory("Todas");setFamily("Todas");setPage(0);setRowOffset({})}} className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-10 pr-9 text-sm outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-100" placeholder={mode==="plantillas"?"Ej. hábitos, agenda, notas":"Ej. rayado, puntos, A4"}/>
   {search&&<button type="button" aria-label="Borrar búsqueda" onClick={()=>{setSearch("");setCategory("Todas");setFamily("Todas");setPage(0)}} className="absolute right-2 top-2 rounded p-1 text-stone-500 hover:text-blue-900"><X size={17}/></button>}
  </div>
  <p className="mt-2 text-xs leading-5 text-stone-500">Por nombre o uso, incluso sin tildes.</p>
  <div className="mt-3 flex flex-wrap gap-1.5">
   {(mode==="plantillas"?["Hábitos","Plan diario","Calendario"]:["A4","Rayado","Cuadrícula"]).map(hint=><button key={hint} type="button" onClick={()=>{setSearch(hint);setCategory("Todas");setFamily("Todas");setPage(0)}} className="rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] hover:border-blue-700 hover:text-blue-900">{hint}</button>)}
  </div>
  <div className="mt-6 flex items-center justify-between gap-2"><h2 className="text-xs font-bold uppercase tracking-wide text-stone-600">Categorías</h2>{(category!=="Todas"||family!=="Todas"||search)&&<button type="button" onClick={reset} className="text-xs font-semibold text-blue-900 hover:underline">Limpiar filtros</button>}</div>
  <nav aria-label="Filtrar por categoría" className="mt-3 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-0.5">
   {[{id:"Todas",name:"Todas las categorías"},...categories.filter(c=>mode==="plantillas"||countFor(c.id)>0)].map(item=><button key={item.id} type="button" aria-pressed={category===item.id} onClick={()=>setFilter(item.id)} className={`flex shrink-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs transition lg:w-full lg:text-sm ${category===item.id?"border-blue-900 bg-blue-50 font-bold text-blue-900":"border-transparent bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-100"}`}><span>{item.name}</span><span className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500">{countFor(item.id)}</span></button>)}
  </nav>
  {mode==="imprimibles"&&<div className="mt-5 border-t border-stone-200 pt-4">
   <label htmlFor="liago-family-filter" className="block text-xs font-semibold text-stone-700">Tipo de papel</label>
   <select id="liago-family-filter" value={family} onChange={e=>{setFamily(e.target.value);setPage(0)}} className="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-blue-800">
    <option value="Todas">Todos los tipos</option>{familyOptions.map(f=><option value={f.name} key={f.name}>{f.name}</option>)}
   </select>
  </div>}
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
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 py-3 text-xs text-stone-600" aria-live="polite"><span><strong className="text-stone-900">{itemsCount}</strong> resultados{category!=="Todas"?" en "+categoryLabel(category):""}{family!=="Todas"?" · "+family:""}{search?' para " '+search+'"':""}</span>{(category!=="Todas"||family!=="Todas"||search)&&<button type="button" onClick={reset} className="font-semibold text-blue-900 hover:underline">Mostrar todas</button>}</div>
 {mode==="imprimibles"&&category==="Todas"&&family==="Todas"&&!search&&<section className="border-b border-stone-200 py-8">
 <nav aria-label="Secciones de imprimibles" className="mb-7 flex flex-wrap gap-x-7 gap-y-2 text-sm text-stone-600">{curated.map(group=><a href={"#"+group.title.replaceAll(" ","-")} key={group.title} className="hover:text-blue-900">{group.title}</a>)}</nav>
 <div className="grid gap-7 md:grid-cols-2">{curated.map(group=><article id={group.title.replaceAll(" ","-")} key={group.title} className="min-w-0">
 <Link href={`/plantillas?template=${group.template}`} className="block overflow-hidden rounded-xl border border-stone-200 bg-[#eae7e0] p-4 transition hover:border-blue-900">
 <div className="mx-auto max-w-72 -rotate-1 bg-white shadow-lg"><Preview template={group.template}/></div>
 </Link>
 <h2 className="mt-4 font-serif text-2xl">{group.title}</h2><p className="mt-2 text-sm text-stone-600">{group.body}</p>
 <Link href={`/plantillas/catalogo?categoria=${encodeURIComponent(group.category)}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-900">Ver opciones <ArrowUpRight size={15}/></Link>
 </article>)}</div></section>}
 {mode==="plantillas"?
 <div className="space-y-10 py-7">
 {categories.filter(c=>category==="Todas"||category===c.id).map(group=>{
  const items=pageTemplates.filter(e=>categoryForTemplate(e)===group.id);if(!items.length)return null;
  const offset=search.trim()?0:rowOffset[group.id]||0,windowed=search.trim()?items:items.slice(offset,offset+5);
  return <section key={group.id}>
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
  <div><h2 className="font-serif text-2xl">{group.name}</h2><p className="mt-1 text-xs text-stone-500">{group.hint} · {items.length} {search?"coincidencias":"plantillas"}</p></div>
  {!search.trim()&&items.length>5&&<div className="flex gap-2"><button type="button" aria-label={"Ver plantillas anteriores de "+group.name} disabled={!offset} onClick={()=>setRowOffset(v=>({...v,[group.id]:Math.max(0,offset-5)}))} className="rounded-lg border border-stone-200 bg-white p-2 disabled:opacity-30"><ChevronLeft size={19}/></button><button type="button" aria-label={"Ver más plantillas de "+group.name} disabled={offset+5>=items.length} onClick={()=>setRowOffset(v=>({...v,[group.id]:Math.min(Math.max(0,items.length-5),offset+5)}))} className="rounded-lg border border-stone-200 bg-white p-2 disabled:opacity-30"><ChevronRight size={19}/></button></div>}
  </div>
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{windowed.map(e=><Link key={e.id} href={`/plantillas?template=${encodeURIComponent(e.id)}`} className="group min-w-0">
  <Preview template={e.id}/>
  <div className="mt-2 flex items-start justify-between gap-1"><span className="font-serif text-base group-hover:text-blue-900">{e.name}</span><ArrowUpRight size={16} className="shrink-0 text-stone-400 group-hover:text-blue-900"/></div>
  </Link>)}</div>
  </section>;
 })}
 {visibleTemplates.length===0&&<div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-stone-600"><p>No encontramos plantillas con esos filtros.</p><button type="button" onClick={reset} className="mt-3 font-semibold text-blue-900 underline">Ver todas las plantillas</button></div>}
 {search.trim()&&visibleTemplates.length>perPage&&<div className="flex items-center justify-center gap-3 text-sm"><button type="button" disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} className="rounded-lg border border-stone-300 bg-white px-3 py-2 disabled:opacity-30">Anterior</button><span>Página {page+1} de {Math.ceil(visibleTemplates.length/perPage)}</span><button type="button" disabled={(page+1)*perPage>=visibleTemplates.length} onClick={()=>setPage(p=>p+1)} className="rounded-lg border border-stone-300 bg-white px-3 py-2 disabled:opacity-30">Siguiente</button></div>}
 </div>:
 <div className="py-9">
 <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl">{family!=="Todas"?family:category==="Todas"?"Todas las variantes":categoryLabel(category)}</h2><span className="text-xs text-stone-500">{itemsCount} opciones · Medidas en mm</span></div>
 <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{paged.map(v=><Link key={v.id} href={`/plantillas?variant=${encodeURIComponent(v.id)}`} className="group min-w-0">
 <Preview template={v.template} paper={v.paper} spacing={v.spacing} margin={v.margin} ink={v.ink} landscape={v.landscape}/>
 <p className="mt-2 font-serif text-base group-hover:text-blue-900">{v.name}</p><p className="mt-1 text-xs text-stone-500">{v.family} · {v.paper}</p>
 </Link>)}</div>
 {!paged.length&&<div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500"><p>No se encontraron resultados para esos filtros.</p><button type="button" onClick={reset} className="mt-3 font-semibold text-blue-900 underline">Ver todos los imprimibles</button></div>}
 {itemsCount>perPage&&<div className="mt-8 flex items-center justify-center gap-3 text-sm"><button disabled={page===0} onClick={()=>{setPage(v=>Math.max(0,v-1));window.scrollTo({top:0,behavior:"smooth"})}} className="rounded-lg border px-3 py-2 disabled:opacity-30">Anterior</button><span>{page+1} de {Math.ceil(itemsCount/perPage)}</span><button disabled={(page+1)*perPage>=itemsCount} onClick={()=>{setPage(v=>v+1);window.scrollTo({top:0,behavior:"smooth"})}} className="rounded-lg border px-3 py-2 disabled:opacity-30">Siguiente</button></div>}
 </div>}
 <footer className="mt-10 border-t border-stone-200 py-6 text-center text-xs text-stone-500">Liago · Creado por Adrián Soto</footer>
 </div></div></main>;
}