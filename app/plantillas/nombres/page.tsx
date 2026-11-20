"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {ArrowRight,Check,Edit3} from "lucide-react";
import PlantillasNav from "../nav";
import {entries,initial,svgFor} from "../estudio";
import {kidsThemes,type KidsTheme} from "../temas-infantiles";

const nameIds=["trazado-nombre","nombre-grande","nombre-cajas","nombre-mira-copia","nombre-escribir","nombre-colorear","nombre-inicial","nombre-buscar-letras","nombre-buscar","nombre-recortar","nombre-plastilina","nombre-arcoiris"] as const;
const descriptions:Record<string,string>={
 "trazado-nombre":"Repasar las letras sobre líneas guía",
 "nombre-grande":"Practicar letras grandes y escribir",
 "nombre-cajas":"Una letra en cada casilla",
 "nombre-mira-copia":"Mirar, repasar y copiar",
 "nombre-escribir":"Escribir el nombre sin ayuda",
 "nombre-colorear":"Colorear las letras del nombre",
 "nombre-inicial":"Descubrir mi primera letra",
 "nombre-buscar-letras":"Buscar las letras en una cuadrícula",
 "nombre-buscar":"Reconocer el nombre entre palabras",
 "nombre-recortar":"Recortar y ordenar las letras",
 "nombre-plastilina":"Formar letras con plastilina",
 "nombre-arcoiris":"Repasar con muchos colores"
};
const items=nameIds.map(id=>entries.find(e=>e.id===id)).filter((e):e is (typeof entries)[number]=>Boolean(e));
const previewClass="h-full w-full [&>svg]:h-full [&>svg]:w-full";
function MiniSheet({id,name,theme,paper}:{id:string;name:string;theme:KidsTheme;paper:string}){
 const art=useMemo(()=>svgFor({...initial,template:id,childName:name||"Emma",kidTheme:theme,paper}),[id,name,theme,paper]);
 return <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-[#f0ede6] p-3">
  <div className="h-full max-w-full overflow-hidden bg-white shadow-sm" style={{aspectRatio:art.w+"/"+art.h}}>
   <div className={previewClass} dangerouslySetInnerHTML={{__html:art.svg}}/>
  </div>
 </div>;
}
export default function EditorDeNombres(){
 const [name,setName]=useState("");
 const [selected,setSelected]=useState<string>("trazado-nombre");
 const [theme,setTheme]=useState<KidsTheme>("arcoiris");
 const [paper,setPaper]=useState("A4");
 const [showAll,setShowAll]=useState(false);
 const art=useMemo(()=>svgFor({...initial,template:selected,childName:name||"Emma",kidTheme:theme,paper}),[selected,name,theme,paper]);
 const chosen=items.find(i=>i.id===selected);
 const editorLink="/plantillas?"+new URLSearchParams({template:selected,paper,nombre:name,tema:theme}).toString();
 return <main className="min-h-screen bg-[#faf9f6] text-[#282824]">
  <PlantillasNav active="nombres"/>
  <div className="mx-auto max-w-7xl px-4 pb-16 pt-9 sm:px-6">
   <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-blue-900">Imprimibles infantiles · Gratis</p>
    <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Editor de nombres</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">Escribí un nombre una sola vez, elegí la actividad y mirá cómo queda la hoja. Personalizala para imprimir sin iniciar sesión.</p></div>
    <Link href="/plantillas/padres-hijos" className="text-sm font-semibold text-blue-900 underline underline-offset-4">Ver todas las actividades infantiles</Link>
   </div>
   <section aria-label="Personalizar nombre y hoja" className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
     <label className="block text-sm font-semibold text-stone-700">Nombre o palabra
      <input value={name} maxLength={22} onChange={e=>setName(e.target.value)} placeholder="Ej.: Emma, Lia..." aria-label="Nombre o palabra para personalizar todas las actividades" className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-lg font-medium outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-100"/>
     </label>
     <label className="block text-sm font-semibold text-stone-700">Tamaño de papel
      <select value={paper} onChange={e=>setPaper(e.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm focus:border-blue-800"><option>A4</option><option>Carta</option><option>A5</option><option>Oficio</option></select>
     </label>
     <div><span className="block text-sm font-semibold text-stone-700">Vista previa</span><div className="mt-2 flex min-h-12 items-center rounded-xl bg-blue-50 px-4 text-sm font-medium text-blue-900"><Check size={16} className="mr-2"/>{name.trim()?name.trim():"Ejemplo: Emma"}</div></div>
    </div>
    <div className="mt-5"><p className="mb-2 text-sm font-semibold text-stone-700">Dibujos de la hoja</p>
     <div role="group" aria-label="Estilo de dibujos" className="flex flex-wrap gap-2">{kidsThemes.map(t=><button key={t.id} type="button" aria-pressed={theme===t.id} onClick={()=>setTheme(t.id)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${theme===t.id?"border-blue-800 bg-blue-50 text-blue-900":"border-stone-200 bg-white text-stone-600 hover:border-blue-400"}`}>{t.label}</button>)}</div>
    </div>
   </section>
   <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(330px,.9fr)]">
    <section aria-labelledby="list-activities">
     <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-blue-900">Actividades con nombres</p><h2 id="list-activities" className="font-serif text-3xl">Elegí una actividad</h2></div><span className="text-sm text-stone-500">{items.length} fichas editables</span></div>
     <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {(showAll?items:items.slice(0,6)).map(item=><button type="button" key={item.id} onClick={()=>setSelected(item.id)} aria-pressed={selected===item.id} className={`min-w-0 rounded-xl border p-2 text-left transition hover:border-blue-700 hover:shadow-md sm:p-3 ${selected===item.id?"border-blue-800 bg-blue-50 shadow-sm":"border-stone-200 bg-white"}`}>
       <MiniSheet id={item.id} name={name} theme={theme} paper={paper}/>
       <strong className="mt-3 block text-sm leading-5">{item.name}</strong><span className="mt-1 block text-xs leading-5 text-stone-500">{descriptions[item.id]}</span>
      </button>)}
     </div>
     <button type="button" onClick={()=>setShowAll(v=>!v)} className="mt-4 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900">{showAll?"Mostrar menos actividades":"Ver las 12 actividades"}</button>
    </section>
    <section aria-label="Vista de la hoja seleccionada" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
     <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-5 py-4"><div><p className="text-xs text-stone-500">Vista de la página completa</p><h2 className="font-serif text-2xl">{chosen?.name||"Ficha de nombre"}</h2></div><span className="text-xs text-stone-500">{paper}</span></div>
      <div className="flex justify-center bg-[#f0ede7] p-5 sm:p-8">
       <div className="w-full max-w-[385px] overflow-hidden bg-white shadow-[0_12px_30px_#00000018]" style={{aspectRatio:art.w+"/"+art.h}}><div className={previewClass} dangerouslySetInnerHTML={{__html:art.svg}}/></div>
      </div>
      <div className="space-y-2 p-5"><Link href={editorLink} className="flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"><Edit3 size={17}/> Editar e imprimir esta hoja <ArrowRight size={17}/></Link><p className="text-center text-xs text-stone-500">El editor completo permite guardar PDF, PNG o SVG y preparar paquetes de impresión.</p></div>
     </div>
    </section>
   </div>
  </div>
 </main>;
}
