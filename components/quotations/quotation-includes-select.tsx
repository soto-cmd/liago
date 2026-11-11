"use client";

import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";

type Props={previousValues:string[];photographyOnly?:boolean;initialValue?:string};
const photographyOptions=[
 "Fotos digitales por WhatsApp",
 "Fotos digitales por Google Drive",
 "Cobertura fotográfica del evento",
 "Fotografías editadas",
 "Entrega de fotografías en formato digital",
 "Sesión fotográfica previa",
 "Sesión fotográfica posterior",
 "Tomas aéreas con dron",
 "Video del evento",
 "Impresiones fotográficas",
];

export function QuotationIncludesSelect({previousValues,photographyOnly=false,initialValue=""}:Props){
 const options=useMemo(()=>{
  const historical=[...previousValues,initialValue].flatMap(v=>v.split(/\r?\n/)).map(v=>v.trim()).filter(Boolean);
  const seeds=photographyOnly?photographyOptions:[
   "Fotos digitales por WhatsApp","Fotos digitales por Google Drive"
  ];
  return [...new Map([...seeds,...historical].map(s=>[s.toLocaleLowerCase("es"),s] as const)).values()]
   .sort((a,b)=>a.localeCompare(b,"es"));
 },[previousValues,photographyOnly,initialValue]);
 const [selected,setSelected]=useState<string[]>(initialValue.split(/\r?\n/).map(x=>x.trim()).filter(Boolean));
 const [customOptions,setCustomOptions]=useState<string[]>([]);
 const [search,setSearch]=useState("");
 const [newValue,setNewValue]=useState("");
 const [showNew,setShowNew]=useState(false);
 const allOptions=useMemo(()=>[...new Map([...options,...customOptions].map(s=>[s.toLocaleLowerCase("es"),s] as const)).values()], [options,customOptions]);
 const current=selected.join("\n");
 const filtered=allOptions.filter(s=>s.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es")));
 function toggle(value:string){
  setSelected(old=>old.includes(value)?old.filter(v=>v!==value):current.length+value.length+1<=2500?[...old,value]:old);
 }
 function addNew(){
  const value=newValue.trim().replace(/[\r\n]+/g," ");
  if(!value || value.length>250 || current.length+value.length+1>2500)return;
  const existing=allOptions.find(o=>o.toLocaleLowerCase("es")===value.toLocaleLowerCase("es"));
  const chosen=existing||value;
  if(!existing)setCustomOptions(old=>[...old,chosen]);
  setSelected(old=>old.includes(chosen)?old:[...old,chosen]);
  setNewValue("");setShowNew(false);setSearch("");
 }
 return <div className="space-y-2 text-sm">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <label htmlFor="included-search" className="font-semibold text-slate-800">El servicio incluye</label>
   <span className="text-xs text-slate-500">{selected.length} seleccionados</span>
  </div>
  <div className="rounded-xl border border-slate-200 bg-white p-3">
   <input id="included-search" value={search} onChange={e=>setSearch(e.target.value)}
     placeholder="Buscar opciones para incluir" className="liago-input mb-3" />
   <div className="grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-2">
    {filtered.map(value=><label key={value} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-blue-700"
        checked={selected.includes(value)} onChange={()=>toggle(value)}/>
      <span>{value}</span>
     </label>)}
    {!filtered.length?<p className="px-2 py-3 text-sm text-slate-500">No se encontraron opciones. Podés agregar una nueva.</p>:null}
   </div>
   <button type="button" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
      onClick={()=>setShowNew(v=>!v)}><Plus className="h-4 w-4"/> Agregar nuevo elemento</button>
   {showNew?<div className="mt-2 flex flex-wrap gap-2">
    <input aria-label="Nuevo elemento incluido" maxLength={250} value={newValue}
      onChange={e=>setNewValue(e.target.value)}
      onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addNew();}}}
      className="liago-input min-w-0 flex-1" placeholder="Ej. Entrega de 100 fotografías editadas"/>
    <button type="button" onClick={addNew} disabled={!newValue.trim()} className="liago-btn-secondary disabled:opacity-40">Añadir</button>
   </div>:null}
  </div>
  {selected.length>0?<div className="flex flex-wrap gap-1.5" aria-label="Elementos incluidos seleccionados">
   {selected.map(value=><button type="button" key={value} onClick={()=>toggle(value)}
      className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
      <Check className="h-3 w-3 shrink-0"/><span className="truncate">{value}</span><X className="h-3 w-3 shrink-0"/>
    </button>)}
   </div>:<p className="text-xs text-slate-500">Marcá todos los elementos que correspondan. Son opcionales.</p>}
  <input type="hidden" name="included_services" value={current}/>
 </div>;
}
