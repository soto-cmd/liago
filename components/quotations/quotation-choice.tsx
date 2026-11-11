"use client";
import { useState } from "react";

export function QuotationChoice({
  name,label,options,placeholder,maxLength=500,multiline=false,required=false,initialValue=""
}:{
  name:string;label:string;options:string[];placeholder?:string;maxLength?:number;multiline?:boolean;required?:boolean;initialValue?:string
}){
 const [choice,setChoice]=useState(initialValue);
 const [custom,setCustom]=useState("");
 const clean=[...new Map([...options,initialValue].map(s=>s.trim()).filter(Boolean).map(s=>[s.toLocaleLowerCase("es"),s])).values()].sort((a,b)=>a.localeCompare(b,"es"));
 const value=choice==="__custom__"?custom:choice;
 return <div className="text-sm font-medium">
  <label htmlFor={"choice-"+name}>{label}</label>
  <select id={"choice-"+name} value={choice} onChange={e=>{setChoice(e.target.value);if(e.target.value!=="__custom__")setCustom("");}} className="liago-input mt-1">
   <option value="">{placeholder||"Seleccionar opción"}</option>
   {clean.map(v=><option key={v} value={v}>{v.length>95?v.slice(0,92)+"...":v.replace(/\n/g," · ")}</option>)}
   <option value="__custom__">+ Agregar nuevo</option>
  </select>
  {choice==="__custom__"?(multiline?
   <textarea aria-label={"Nuevo "+label.toLowerCase()} className="liago-input mt-2" maxLength={maxLength} rows={3} value={custom} required={required} onChange={e=>setCustom(e.target.value)} placeholder="Escribí el nuevo valor"/>:
   <input aria-label={"Nuevo "+label.toLowerCase()} className="liago-input mt-2" maxLength={maxLength} value={custom} required={required} onChange={e=>setCustom(e.target.value)} placeholder="Escribí el nuevo valor"/>):null}
  <input type="hidden" name={name} value={value.trim()}/>
  {choice==="__custom__"?<p className="mt-1 text-xs text-slate-500">El nuevo valor estará disponible en las siguientes cotizaciones.</p>:null}
 </div>;
}
