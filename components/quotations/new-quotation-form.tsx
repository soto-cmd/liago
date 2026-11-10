"use client";
import { useMemo, useState } from "react";
import { createQuotationAction } from "@/app/app/quotations/actions";

type Customer = {id:string;name:string;customer_code:string|null;phone:string|null;whatsapp:string|null};
type Product = {id:string;name:string;description:string|null;sale_price:number;item_type:string};
type Item = {product_id:string|null;description:string;quantity:number;unit_price:number;key:number};
export function NewQuotationForm({customers,products,currency}:{customers:Customer[];products:Product[];currency:string}) {
 const [search,setSearch]=useState(""); const [customerId,setCustomerId]=useState("");
 const [items,setItems]=useState<Item[]>([]);const [deposit,setDeposit]=useState(0);
 const [selected,setSelected]=useState("");const [pending,setPending]=useState(false);
 const filtered=useMemo(()=>customers.filter(c=>(c.name+" "+(c.phone||"")+" "+(c.whatsapp||"")+" "+(c.customer_code||"")).toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0,150),[search,customers]);
 const total=items.reduce((sum,x)=>sum+Math.round(x.quantity*x.unit_price*100)/100,0);
 const format=(n:number)=>new Intl.NumberFormat("es-PY",{maximumFractionDigits:2}).format(n)+" "+currency;
 const update=(key:number,field:"description"|"quantity"|"unit_price",value:string)=>setItems(prev=>prev.map(x=>x.key===key?{...x,[field]:field==="description"?value:Number(value)}:x));
 function add(){
 const product=products.find(p=>p.id===selected);
 if(!product)return;
 setItems(prev=>[...prev,{product_id:product.id,description:product.name+(product.description?" - "+product.description:""),quantity:1,unit_price:Number(product.sale_price)||0,key:Date.now()+Math.random()}]);
 }
 const valid=!!customerId&&items.length>0&&items.every(x=>x.description.trim()&&Number.isFinite(x.quantity)&&x.quantity>0&&Number.isFinite(x.unit_price)&&x.unit_price>=0)&&deposit>=0&&deposit<=total;
 return <form action={createQuotationAction} onSubmit={()=>setPending(true)} className="liago-card space-y-5 p-5">
 <div className="grid gap-4 md:grid-cols-2">
  <div><label className="mb-1 block text-sm font-semibold">Buscar cliente</label><input className="liago-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nombre, teléfono o código"/>
  <select required name="customer_id" className="liago-input mt-2" value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Seleccionar cliente existente</option>{filtered.map(c=><option key={c.id} value={c.id}>{c.name} {c.phone||c.whatsapp?" · "+(c.phone||c.whatsapp):""}</option>)}</select>
  </div>
  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><strong className="block text-slate-900">Cotización nueva</strong>El número consecutivo se asignará al guardar, sin afectar los recibos ni las ventas.</div>
  <label className="text-sm font-semibold">Evento / concepto<input name="event_name" maxLength={160} className="liago-input mt-1" placeholder="Ej. Cobertura fotográfica"/></label>
  <label className="text-sm font-semibold">Fecha del evento<input name="event_date" type="date" className="liago-input mt-1"/></label>
  <label className="text-sm font-semibold md:col-span-2">Lugar<input name="event_location" maxLength={250} className="liago-input mt-1" placeholder="Ciudad, salón o dirección"/></label>
 </div>
 <div className="border-t border-slate-100 pt-4">
 <h3 className="mb-3 font-bold text-slate-900">Servicios y productos</h3>
 <div className="flex flex-col gap-2 sm:flex-row"><select className="liago-input flex-1" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Seleccionar servicio o producto</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {format(Number(p.sale_price))}</option>)}</select><button type="button" onClick={add} disabled={!selected} className="liago-btn-secondary">Agregar concepto</button></div>
 {items.length>0?<div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b text-left text-slate-500"><th className="p-2">Descripción</th><th className="p-2">Cantidad</th><th className="p-2">Precio</th><th className="p-2">Subtotal</th><th></th></tr></thead><tbody>{items.map(item=><tr className="border-b" key={item.key}><td className="p-2"><input aria-label="Descripción" maxLength={500} className="liago-input" value={item.description} onChange={e=>update(item.key,"description",e.target.value)}/></td><td className="w-24 p-2"><input aria-label="Cantidad" className="liago-input" type="number" min="0.001" step="0.001" value={item.quantity} onChange={e=>update(item.key,"quantity",e.target.value)}/></td><td className="w-32 p-2"><input aria-label="Precio unitario" className="liago-input" type="number" min="0" step="0.01" value={item.unit_price} onChange={e=>update(item.key,"unit_price",e.target.value)}/></td><td className="whitespace-nowrap p-2">{format(item.quantity*item.unit_price)}</td><td><button type="button" className="text-sm font-semibold text-red-600" onClick={()=>setItems(prev=>prev.filter(x=>x.key!==item.key))}>Quitar</button></td></tr>)}</tbody></table></div>:<p className="py-5 text-sm text-slate-500">Agregá los servicios que querés cotizar.</p>}
 </div>
 <div className="grid gap-4 border-t pt-4 md:grid-cols-2"><label className="text-sm font-semibold">Anticipo previsto ({currency})<input className="liago-input mt-1" name="deposit" type="number" min="0" max={total} step="0.01" value={deposit} onChange={e=>setDeposit(Number(e.target.value))}/></label><div className="space-y-1 rounded-xl bg-blue-50 p-4 text-right text-sm"><p>Total: <strong>{format(total)}</strong></p><p>Anticipo: {format(deposit)}</p><p>Saldo estimado: <strong>{format(total-deposit)}</strong></p></div></div>
 <label className="block text-sm font-semibold">Observaciones / condiciones<textarea name="notes" rows={3} maxLength={2000} className="liago-input mt-1" placeholder="Plazo de validez, entregables, condiciones de pago..."/></label>
 <input type="hidden" name="items_json" value={JSON.stringify(items.map(({product_id,description,quantity,unit_price})=>({product_id,description,quantity,unit_price})))}/>
 <button type="submit" disabled={!valid||pending} className="liago-btn-primary disabled:opacity-50">{pending?"Guardando...":"Guardar cotización"}</button>
 </form>;
}
