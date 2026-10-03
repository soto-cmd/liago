"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { receivePurchaseAction } from "@/app/app/purchases/actions";

type Product = { id:string; code:string; name:string; purchase_price:number; tax_rate:number; unit:string };
type Supplier = { id:string; name:string };
type Branch = { id:string; name:string };
type Item = { product_id:string; code:string; name:string; quantity:number; unit_cost:number; discount:number; tax_rate:number };

export function NewPurchaseForm({ products, suppliers, branches }: { products:Product[]; suppliers:Supplier[]; branches:Branch[] }) {
  const [items,setItems]=useState<Item[]>([]);
  const [selected,setSelected]=useState("");
  const [quantity,setQuantity]=useState(1);
  const total=useMemo(()=>items.reduce((sum,i)=>sum+Math.max(0,i.quantity*i.unit_cost-i.discount),0),[items]);

  function addItem(){
    const p=products.find((x)=>x.id===selected); if(!p||quantity<=0)return;
    setItems((current)=>{ const found=current.find((i)=>i.product_id===p.id); if(found)return current.map((i)=>i.product_id===p.id?{...i,quantity:i.quantity+quantity}:i); return [...current,{product_id:p.id,code:p.code,name:p.name,quantity,unit_cost:Number(p.purchase_price),discount:0,tax_rate:Number(p.tax_rate)}]; });
    setSelected(""); setQuantity(1);
  }
  function patch(index:number,key:keyof Item,value:number){ setItems((current)=>current.map((item,i)=>i===index?{...item,[key]:value}:item)); }

  return <form action={receivePurchaseAction} className="space-y-5">
    <input type="hidden" name="items_json" value={JSON.stringify(items.map(({product_id,quantity,unit_cost,discount,tax_rate})=>({product_id,quantity,unit_cost,discount,tax_rate})))} />
    <div className="grid gap-3 md:grid-cols-4">
      <select name="branch_id" required className="rounded-lg border px-3 py-2 text-sm"><option value="">Sucursal *</option>{branches.map((b)=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
      <select name="supplier_id" required className="rounded-lg border px-3 py-2 text-sm"><option value="">Proveedor *</option>{suppliers.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <select name="purchase_type" className="rounded-lg border px-3 py-2 text-sm"><option value="CASH">Contado</option><option value="PARTIAL">Pago parcial</option><option value="CREDIT">Crédito</option></select>
      <input name="due_date" type="date" className="rounded-lg border px-3 py-2 text-sm" />
    </div>
    <div className="rounded-xl border bg-neutral-50 p-3"><div className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
      <select value={selected} onChange={(e)=>setSelected(e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm"><option value="">Seleccionar producto</option>{products.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select>
      <input type="number" min="0.001" step="0.001" value={quantity} onChange={(e)=>setQuantity(Number(e.target.value))} className="rounded-lg border bg-white px-3 py-2 text-sm" />
      <button type="button" onClick={addItem} className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4"/> Agregar</button>
    </div></div>
    <div className="overflow-hidden rounded-xl border bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50"><tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Producto</th><th className="px-3 py-2">Cantidad</th><th className="px-3 py-2">Costo</th><th className="px-3 py-2">Desc.</th><th className="px-3 py-2">Total</th><th/></tr></thead><tbody className="divide-y">{items.length?items.map((item,index)=><tr key={item.product_id}><td className="px-3 py-2 font-mono">{item.code}</td><td className="px-3 py-2 font-medium">{item.name}</td><td className="px-3 py-2"><input className="w-24 rounded border px-2 py-1" type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e)=>patch(index,"quantity",Number(e.target.value))}/></td><td className="px-3 py-2"><input className="w-28 rounded border px-2 py-1" type="number" min="0" step="0.01" value={item.unit_cost} onChange={(e)=>patch(index,"unit_cost",Number(e.target.value))}/></td><td className="px-3 py-2"><input className="w-24 rounded border px-2 py-1" type="number" min="0" step="0.01" value={item.discount} onChange={(e)=>patch(index,"discount",Number(e.target.value))}/></td><td className="px-3 py-2 font-medium">{Math.max(0,item.quantity*item.unit_cost-item.discount).toLocaleString("es-PY")}</td><td className="px-3 py-2"><button type="button" onClick={()=>setItems((c)=>c.filter((_,i)=>i!==index))}><Trash2 className="h-4 w-4 text-red-600"/></button></td></tr>):<tr><td colSpan={7} className="px-3 py-8 text-center text-neutral-500">Agregá productos a la compra.</td></tr>}</tbody></table></div></div>
    <div className="grid gap-3 md:grid-cols-4"><input name="amount_paid" type="number" min="0" step="0.01" placeholder="Pagado ahora" className="rounded-lg border px-3 py-2 text-sm"/><input name="reference" placeholder="Factura / referencia" className="rounded-lg border px-3 py-2 text-sm"/><input name="notes" placeholder="Observaciones" className="rounded-lg border px-3 py-2 text-sm md:col-span-2"/></div>
    <div className="flex items-center justify-between rounded-xl border bg-neutral-50 p-4"><div><div className="text-sm text-neutral-500">Total estimado</div><div className="text-2xl font-semibold">{total.toLocaleString("es-PY")}</div></div><button disabled={!items.length} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">Recibir compra</button></div>
  </form>;
}
