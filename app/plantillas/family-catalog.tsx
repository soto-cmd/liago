"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {ArrowUpRight,BookOpen,CalendarDays,Heart,Search,X} from "lucide-react";
import PlantillasNav from "./nav";
import {entries,initial,svgFor} from "./estudio";
import {searchMatches} from "./taxonomia";

const collections=[
 {id:"nombres",title:"Aprendo mi nombre",detail:"Actividades de reconocimiento, escritura, recorte y color para practicar en casa.",icon:BookOpen,ids:["trazado-nombre","nombre-grande","nombre-cajas","nombre-mira-copia","nombre-escribir","nombre-colorear","nombre-inicial","nombre-buscar-letras","nombre-buscar","nombre-recortar","nombre-plastilina","nombre-arcoiris"]},
 {id:"aprendizaje",title:"Letras, números y práctica",detail:"Ejercicios para empezar a escribir, repasar números y aprender con fichas.",icon:BookOpen,ids:["letter-tracing-worksheet","trazado-lineas","numeros-repasar","recta","fichas"]},
 {id:"familia",title:"Rutinas y organización familiar",detail:"Tareas semanales, hábitos, rutinas y calendarios para toda la familia.",icon:CalendarDays,ids:["tareas-ninos","rutina-infantil","habitos","calendario","plan-semanal"]}
] as const;
const descriptions:Record<string,string>={
 "trazado-nombre":"Repasá tu nombre sobre letras con guía.",
 "nombre-grande":"Practicá con letras más grandes y una última línea libre.",
 "nombre-cajas":"Reconocé cada letra y copiala en su propio espacio.",
 "nombre-mira-copia":"Observá el modelo, repasá y escribí por tu cuenta.",
 "nombre-escribir":"Un modelo, letras para repasar y renglones libres.",
 "nombre-colorear":"Pintá las letras del nombre en tres espacios amplios.",
 "nombre-inicial":"Decorá la primera letra y reconocela en tu nombre.",
 "nombre-buscar-letras":"Identificá las letras de tu nombre en una cuadrícula.",
 "nombre-buscar":"Encontrá tu nombre entre otras palabras.",
 "nombre-recortar":"Recortá fichas de letras y ordenalas para formar tu nombre.",
 "nombre-plastilina":"Construí las formas de las letras con masa.",
 "nombre-arcoiris":"Repasá el nombre usando diferentes colores.",
 "letter-tracing-worksheet":"Trazado de letras y palabras con pautas de escritura.",
 "trazado-lineas":"Práctica de motricidad y líneas para escribir.",
 "numeros-repasar":"Repasá los números del 0 al 9.",
 "recta":"Recta numérica para ejercicios de matemática.",
 "fichas":"Fichas imprimibles para memorizar y aprender.",
 "tareas-ninos":"Marcá las tareas completadas durante la semana.",
 "rutina-infantil":"Organizá tareas de mañana, tarde y noche.",
 "habitos":"Hacé seguimiento de hábitos durante el mes.",
 "calendario":"Calendario mensual para anotar actividades.",
 "plan-semanal":"Una vista de la semana para toda la familia."
};

function SheetPreview({id}:{id:string}){
 const art=useMemo(()=>svgFor({...initial,template:id}),[id]);
 return <div className="flex h-44 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-[#f1eee7] p-3 sm:h-52">
  <div className="h-full max-w-full overflow-hidden bg-white shadow-[0_6px_16px_#00000018]" style={{aspectRatio:art.w+"/"+art.h}}>
   <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{__html:art.svg}}/>
  </div>
 </div>;
}

export default function FamilyCatalog(){
 const [category,setCategory]=useState("todos");
 const [query,setQuery]=useState("");
 const catalog=collections.map(group=>{
  const items=group.ids.map(id=>entries.find(item=>item.id===id)).filter((item):item is (typeof entries)[number]=>Boolean(item));
  return {...group,items:items.filter(item=>searchMatches(query,[item.name,descriptions[item.id],group.title,group.detail]))};
 }).filter(group=>(category==="todos"||category===group.id)&&group.items.length>0);
 const total=catalog.reduce((sum,group)=>sum+group.items.length,0);
 return <main className="min-h-screen bg-[#faf9f6] text-[#282824]">
  <PlantillasNav active="familia"/>
  <section className="border-b border-stone-200 bg-white">
   <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-blue-900"><Heart size={17}/> Liago · Imprimibles gratuitos</div>
    <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Padres e hijos</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">Hojas para practicar el nombre, reconocer letras, aprender números y organizar las tareas de casa. Elegí una actividad, personalizala en el editor y guardala como PDF o imprimila. Sin registro.</p>
    <div className="mt-6 flex flex-wrap gap-3"><Link href="/plantillas?template=trazado-nombre" className="rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Empezar con mi nombre</Link><Link href="/plantillas?template=tareas-ninos" className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold hover:border-blue-900">Tabla de tareas familiar</Link></div>
   </div>
  </section>
  <div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8">
   <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
    <div role="group" aria-label="Filtrar actividades" className="flex flex-wrap gap-2">
     {[{id:"todos",title:"Todas"},...collections].map(item=><button key={item.id} type="button" aria-pressed={category===item.id} onClick={()=>setCategory(item.id)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${category===item.id?"border-blue-900 bg-blue-900 text-white":"border-stone-200 text-stone-600 hover:border-blue-900 hover:text-blue-900"}`}>{item.title}</button>)}
    </div>
    <div className="relative min-w-0 sm:w-72">
     <Search size={16} className="pointer-events-none absolute left-3 top-3 text-stone-400"/>
     <input aria-label="Buscar actividad para niños" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar nombre, números, tareas..." className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-blue-900"/>
     {query&&<button type="button" aria-label="Borrar búsqueda" onClick={()=>setQuery("")} className="absolute right-2 top-2 rounded p-1 text-stone-500"><X size={16}/></button>}
    </div>
   </div>
   <p aria-live="polite" className="mt-4 text-xs text-stone-500">{total} actividades disponibles · Ajustes de impresión en milímetros</p>
   {catalog.map(group=><section key={group.id} className="mt-9">
    <div className="mb-4 flex flex-wrap items-center gap-2"><group.icon size={22} className="text-blue-900"/><h2 className="font-serif text-2xl">{group.title}</h2><span className="ml-auto rounded bg-stone-100 px-2 py-1 text-xs text-stone-500">{group.items.length}</span></div>
    <p className="mb-5 text-sm text-stone-600">{group.detail}</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
     {group.items.map(item=><Link key={item.id} href={"/plantillas?template="+encodeURIComponent(item.id)} className="group min-w-0 rounded-xl border border-stone-200 bg-white p-2.5 transition hover:border-blue-700 hover:shadow-md sm:p-3">
      <SheetPreview id={item.id}/>
      <div className="mt-3 flex items-start justify-between gap-2"><h3 className="text-sm font-semibold leading-5 group-hover:text-blue-900">{item.name}</h3><ArrowUpRight size={16} className="shrink-0 text-stone-400 group-hover:text-blue-900"/></div>
      <p className="mt-1 text-xs leading-5 text-stone-500">{descriptions[item.id]}</p>
     </Link>)}
    </div>
   </section>)}
   {!total&&<div className="mt-7 rounded-xl border border-stone-200 bg-white p-9 text-center"><p className="text-stone-600">No encontramos actividades con esos filtros.</p><button type="button" onClick={()=>{setCategory("todos");setQuery("")}} className="mt-3 text-sm font-semibold text-blue-900 underline">Ver todas las actividades</button></div>}
   <footer className="mt-14 border-t border-stone-200 pt-6 text-center text-xs text-stone-500">Liago · Creado por Adrián Soto · Plantillas públicas y gratuitas</footer>
  </div>
 </main>;
}
