"use client";
import { useMemo, useState } from "react";
import { createQuotationAction } from "@/app/app/quotations/actions";
import { Plus, Trash2, Search } from "lucide-react";
import { QuotationChoice } from "@/components/quotations/quotation-choice";

type Customer={id:string;name:string;customer_code:string|null;phone:string|null;whatsapp:string|null};
type Product={id:string;name:string;description:string|null;sale_price:number;item_type:string};
type Item={key:number;product_id:string;description:string;quantity:number;unit_price:number};
const money=(n:number,c:string)=>new Intl.NumberFormat("es-PY",{maximumFractionDigits:2}).format(n)+" "+c;
type PreviousChoices={events:string[];times:string[];includes:string[];terms:string[];methods:string[];banks:string[]};
export function NewQuotationForm({customers,products,currency,locations,previousChoices}:{customers:Customer[];products:Product[];currency:string;locations:string[];previousChoices:PreviousChoices}){
 const [customerSearch,setCustomerSearch]=useState("");
 const [customerId,setCustomerId]=useState("");
 const [serviceSearch,setServiceSearch]=useState("");
 const [eventLocation,setEventLocation]=useState("");
 const [newLocation,setNewLocation]=useState("");
 const [selected,setSelected]=useState("");
 const [items,setItems]=useState<Item[]>([]);
 const [depositPercent,setDepositPercent]=useState("50");
 const [depositMode,setDepositMode]=useState<"percent"|"amount">("percent");
 const [fixedDeposit,setFixedDeposit]=useState("0");
 const [pending,setPending]=useState(false);
 const clients=useMemo(()=>customers.filter(c=>(c.name+" "+(c.customer_code||"")+" "+(c.whatsapp||"")+" "+(c.phone||"")).toLocaleLowerCase().includes(customerSearch.toLocaleLowerCase())),[customers,customerSearch]);
 const catalog=useMemo(()=>products.filter(p=>(p.name+" "+(p.description||"")).toLocaleLowerCase().includes(serviceSearch.toLocaleLowerCase())).sort((a,b)=>(a.item_type==="SERVICE"?0:1)-(b.item_type==="SERVICE"?0:1)||a.name.localeCompare(b.name)),[products,serviceSearch]);
 const total=items.reduce((s,i)=>s+Math.round(i.quantity*i.unit_price*100)/100,0);
 const percent=Number(depositPercent);
 const deposit=depositMode==="percent"?Math.round(total*Math.max(0,Math.min(100,Number.isFinite(percent)?percent:0))/100*100)/100:Number(fixedDeposit);
 const locationValue=eventLocation==="__new__"?newLocation.trim():eventLocation;
 const valid=!!customerId&&(eventLocation!=="__new__"||newLocation.trim().length>0)&&items.length>0&&total>0&&Number.isFinite(deposit)&&deposit>=0&&deposit<=total&&items.every(i=>i.description.trim().length>0&&i.quantity>0&&i.unit_price>=0&&Number.isFinite(i.unit_price));
 function add(){
  const p=products.find(p=>p.id===selected);if(!p)return;
  setItems(a=>[...a,{key:Date.now()+Math.random(),product_id:p.id,description:p.name+(p.description?"\n"+p.description:""),quantity:1,unit_price:Number(p.sale_price)||0}]);setSelected("");
 }
 function edit(key:number,changes:Partial<Item>){setItems(a=>a.map(i=>i.key===key?{...i,...changes}:i));}
 return <form action={createQuotationAction} onSubmit={()=>setPending(true)} className="space-y-5">
   <section className="rounded-xl border bg-white p-4">
     <div className="mb-3 flex items-center justify-between"><h3 className="font-bold text-slate-900">1. Cliente y evento</h3><span className="text-xs text-slate-500">Numeración automática al guardar</span></div>
     <div className="grid gap-3 md:grid-cols-2">
      <label className="text-sm font-medium">Buscar cliente<div className="relative mt-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input className="liago-input pl-9" value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} placeholder="Nombre o teléfono"/></div></label>
      <label className="text-sm font-medium">Cliente *<select name="customer_id" required className="liago-input mt-1" value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Seleccionar cliente existente</option>{clients.map(c=><option value={c.id} key={c.id}>{c.name}{c.customer_code?" · "+c.customer_code:""}</option>)}</select></label>
      <QuotationChoice name="event_name" label="Evento o trabajo" maxLength={160} options={[...previousChoices.events,"Evento institucional","Cumpleaños infantil","Cumpleaños de adulto","15 años","Boda","Bautismo","Graduación","Sesión fotográfica","Evento empresarial"]}/>
      <label className="text-sm font-medium">Fecha<input type="date" name="event_date" className="liago-input mt-1"/></label>
      <QuotationChoice name="event_time" label="Horario" maxLength={100} options={[...previousChoices.times,"08:00 a 10:00 hs","10:00 a 12:00 hs","14:00 a 16:00 hs","16:00 a 18:00 hs","18:00 a 20:00 hs","19:00 a 21:00 hs","20:00 a 22:00 hs","A confirmar"]}/>
      <div className="text-sm font-medium">
       <label htmlFor="quote-location">Ciudad o lugar</label>
       <select id="quote-location" className="liago-input mt-1" value={eventLocation} onChange={e=>{setEventLocation(e.target.value);if(e.target.value!=="__new__")setNewLocation("");}}>
         <option value="">Seleccionar ciudad o lugar</option>
         {locations.map(name=><option key={name} value={name}>{name}</option>)}
         <option value="__new__">+ Agregar nuevo lugar</option>
       </select>
       {eventLocation==="__new__"?
         <div className="mt-2"><label htmlFor="new-quote-location" className="text-xs font-semibold text-slate-600">Nombre del nuevo lugar</label>
           <input id="new-quote-location" className="liago-input mt-1" maxLength={250} required value={newLocation} onChange={e=>setNewLocation(e.target.value)} placeholder="Ej. San Fernando o Salón Municipal"/>
           <p className="mt-1 text-xs text-slate-500">Se guardará para próximas cotizaciones al guardar este documento.</p>
         </div>:null}
       <input type="hidden" name="event_location" value={locationValue}/>
     </div>
     </div>
   </section>
   <section className="rounded-xl border bg-white p-4">
     <h3 className="mb-3 font-bold text-slate-900">2. Servicios e importes</h3>
     <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
       <input className="liago-input" value={serviceSearch} onChange={e=>setServiceSearch(e.target.value)} placeholder="Filtrar servicios"/>
       <select className="liago-input" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Elegir servicio o producto</option>{catalog.map(p=><option key={p.id} value={p.id}>{p.item_type==="SERVICE"?"Servicio":"Producto"} · {p.name} · {money(Number(p.sale_price),currency)}</option>)}</select>
       <button type="button" disabled={!selected} className="liago-btn-secondary" onClick={add}><Plus className="h-4 w-4"/> Agregar</button>
     </div>
     <p className="mt-2 text-xs text-slate-500">El precio del catálogo sirve de referencia. Podés ajustarlo para cada evento sin modificar el servicio original.</p>
     <div className="mt-4 space-y-2">{items.map((item,index)=><div key={item.key} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[minmax(0,1fr)_90px_130px_110px_32px] md:items-end">
       <label className="text-xs font-semibold text-slate-600">Descripción <span className="text-slate-400">#{index+1}</span><textarea rows={2} maxLength={500} value={item.description} onChange={e=>edit(item.key,{description:e.target.value})} className="liago-input mt-1 w-full"/></label>
       <label className="text-xs font-semibold text-slate-600">Cantidad<input aria-label="Cantidad" type="number" min="0.001" step="0.001" className="liago-input mt-1" value={item.quantity} onChange={e=>edit(item.key,{quantity:Number(e.target.value)})}/></label>
       <label className="text-xs font-semibold text-slate-600">Precio ({currency})<input aria-label="Precio" type="number" min="0" step="0.01" className="liago-input mt-1" value={item.unit_price} onChange={e=>edit(item.key,{unit_price:Number(e.target.value)})}/></label>
       <div><p className="text-xs font-semibold text-slate-600">Importe</p><p className="py-2 text-sm font-bold tabular-nums">{money(item.quantity*item.unit_price,currency)}</p></div>
       <button type="button" aria-label="Quitar servicio" className="mb-1 rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={()=>setItems(a=>a.filter(x=>x.key!==item.key))}><Trash2 className="h-4 w-4"/></button>
     </div>)}</div>
     {!items.length?<p className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">Agregá uno o varios servicios al presupuesto.</p>:null}
     <div className="mt-4 flex justify-end border-t pt-3"><strong className="text-lg">Total: {money(total,currency)}</strong></div>
   </section>
   <section className="rounded-xl border bg-white p-4">
     <h3 className="mb-3 font-bold text-slate-900">3. Incluye y condiciones de pago</h3>
     <QuotationChoice name="included_services" label="El servicio incluye" multiline maxLength={2500} options={[...previousChoices.includes,"Fotos digitales por WhatsApp\nFotos digitales por Google Drive","Fotos digitales por Google Drive","Fotos digitales por WhatsApp"]}/>
     <div className="mt-3 grid gap-3 md:grid-cols-2">
       <label className="text-sm font-medium">Anticipo previsto
         <div className="mt-1 flex gap-2"><select className="liago-input w-24 shrink-0" value={depositMode} onChange={e=>setDepositMode(e.target.value as "percent"|"amount")}><option value="percent">%</option><option value="amount">{currency}</option></select>
         {depositMode==="percent"?<input type="number" min="0" max="100" step="1" value={depositPercent} onChange={e=>setDepositPercent(e.target.value)} className="liago-input"/>:<input type="number" min="0" max={total} step="0.01" value={fixedDeposit} onChange={e=>setFixedDeposit(e.target.value)} className="liago-input"/>}</div>
       </label>
       <div className="rounded-lg bg-amber-50 p-3 text-sm"><div className="flex justify-between"><span>Anticipo estimado</span><strong>{money(Number.isFinite(deposit)?deposit:0,currency)}</strong></div><div className="mt-1 flex justify-between"><span>Saldo estimado</span><strong>{money(Math.max(0,total-(Number.isFinite(deposit)?deposit:0)),currency)}</strong></div></div>
       <div className="md:col-span-2"><QuotationChoice name="payment_terms" label="Condición del anticipo y saldo" multiline maxLength={1000} options={[...previousChoices.terms,"50% de anticipo para reservar la fecha y 50% restante al finalizar la cobertura.","Pago total al finalizar el servicio.","Pago total por adelantado."]}/></div>
       <QuotationChoice name="payment_methods" label="Formas de pago" maxLength={500} options={[...previousChoices.methods,"Transferencia bancaria o efectivo.","Transferencia bancaria","Efectivo","Tarjeta"]}/>
       <QuotationChoice name="bank_details" label="Datos de transferencia (opcional)" maxLength={700} options={previousChoices.banks}/>
     </div>
     <label className="mt-3 block text-sm font-medium">Otras observaciones<textarea name="notes" maxLength={2000} rows={2} className="liago-input mt-1" placeholder="Entregables, vigencia, aclaraciones..."/></label>
   </section>
   <input type="hidden" name="deposit" value={Number.isFinite(deposit)?deposit:0}/>
   <input type="hidden" name="items_json" value={JSON.stringify(items.map(({product_id,description,quantity,unit_price})=>({product_id,description,quantity,unit_price})))}/>
   <div className="sticky bottom-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-3 shadow-lg"><div className="text-sm"><div className="text-slate-500">Total cotizado</div><strong>{money(total,currency)}</strong>{!valid?<p className="text-xs text-amber-700">Seleccioná un cliente y servicios con importe mayor a cero.</p>:null}</div><button type="submit" disabled={!valid||pending} className="liago-btn-primary disabled:opacity-50">{pending?"Guardando...":"Guardar cotización"}</button></div>
 </form>;
}
