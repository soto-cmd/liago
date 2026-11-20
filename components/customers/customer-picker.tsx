"use client";
import { useMemo,useState } from "react";
import { saveCustomerInlineAction } from "@/app/app/customers/inline-actions";

export type QuickCustomer={id:string;name:string;customer_code:string|null;phone?:string|null;whatsapp?:string|null};
export function CustomerPicker({customers,value,onChange}:{customers:QuickCustomer[];value:string;onChange:(id:string)=>void}){
 const [list,setList]=useState(customers);
 const [search,setSearch]=useState("");
 const [mode,setMode]=useState<"add"|"edit"|null>(null);
 const [name,setName]=useState("");
 const [phone,setPhone]=useState("");
 const [email,setEmail]=useState("");
 const [taxId,setTaxId]=useState("");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const chosen=list.find(c=>c.id===value);
 const matches=useMemo(()=>list.filter(c=>(c.name+" "+(c.customer_code||"")+" "+(c.phone||"")+" "+(c.whatsapp||"")).toLocaleLowerCase().includes(search.toLocaleLowerCase())),[list,search]);
 function open(next:"add"|"edit"){
  setMode(next);setName(next==="edit"?chosen?.name||"":"");setPhone(next==="edit"?chosen?.phone||chosen?.whatsapp||"":"");setEmail("");setTaxId("");setError("");
 }
 async function save(){
  setSaving(true);setError("");
  try{
   const result=await saveCustomerInlineAction({id:mode==="edit"?value:undefined,name,phone,email,tax_id:taxId});
   if(!result.ok||!result.customer){setError(result.message||"No se pudo guardar.");return;}
   const customer=result.customer;
   setList(items=>[...items.filter(x=>x.id!==customer.id),customer].sort((a,b)=>a.name.localeCompare(b.name)));
   setSearch("");onChange(customer.id);setMode(null);
  }catch{setError("No se pudo guardar. Intentá nuevamente.");}finally{setSaving(false);}
 }
 return <div className="min-w-0 space-y-2">
  <label className="block text-sm font-semibold">Cliente * <input type="search" className="liago-input mt-1" placeholder="Buscar por nombre o teléfono" value={search} onChange={e=>setSearch(e.target.value)}/></label>
  <select name="customer_id" required className="liago-input w-full" value={value} onChange={e=>onChange(e.target.value)}>
   <option value="">Seleccionar cliente</option>
   {chosen&&!matches.some(c=>c.id===chosen.id)?<option value={chosen.id}>{chosen.name}</option>:null}
   {matches.map(c=><option key={c.id} value={c.id}>{c.name}{c.customer_code?" · "+c.customer_code:""}</option>)}
  </select>
  <div className="flex flex-wrap gap-2 text-xs">
   <button type="button" className="font-semibold text-blue-700 hover:underline" onClick={()=>open("add")}>+ Agregar cliente</button>
   {chosen?<button type="button" className="font-semibold text-slate-700 hover:underline" onClick={()=>open("edit")}>Editar cliente</button>:null}
  </div>
  {mode?<div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
   <strong className="text-sm">{mode==="add"?"Agregar cliente":"Editar cliente"}</strong>
   <label className="block text-xs">Nombre *<input className="liago-input mt-1" maxLength={150} value={name} onChange={e=>setName(e.target.value)}/></label>
   <label className="block text-xs">Teléfono<input className="liago-input mt-1" maxLength={50} value={phone} onChange={e=>setPhone(e.target.value)}/></label>
   {mode==="add"?<><label className="block text-xs">Correo (opcional)<input type="email" className="liago-input mt-1" value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block text-xs">RUC / CI (opcional)<input className="liago-input mt-1" value={taxId} onChange={e=>setTaxId(e.target.value)}/></label></>:null}
   {error?<p role="alert" className="text-xs text-red-700">{error}</p>:null}
   <div className="flex gap-2"><button type="button" disabled={saving||!name.trim()} onClick={save} className="liago-btn-primary disabled:opacity-50">{saving?"Guardando...":"Guardar cliente"}</button><button type="button" disabled={saving} onClick={()=>setMode(null)} className="liago-btn-secondary">Cancelar</button></div>
  </div>:null}
 </div>;
}
