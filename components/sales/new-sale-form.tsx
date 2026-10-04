"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createSaleAction } from "@/app/app/sales/actions";

type Product = { id: string; code: string; name: string; sale_price: number; tax_rate: number; unit: string };
type Customer = { id: string; name: string; customer_code: string | null };
type Branch = { id: string; name: string };
type SaleItem = { product_id: string; code: string; name: string; quantity: number; unit_price: number; discount: number; tax_rate: number };

export function NewSaleForm({ products, customers, branches }: { products: Product[]; customers: Customer[]; branches: Branch[] }) {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selected, setSelected] = useState("");
  const [quantity, setQuantity] = useState(1);

  const total = useMemo(() => items.reduce((sum, item) => {
    const base = item.quantity * item.unit_price;
    const taxable = Math.max(0, base - item.discount);
    return sum + taxable + taxable * item.tax_rate / 100;
  }, 0), [items]);

  function addItem() {
    const product = products.find((p) => p.id === selected);
    if (!product || quantity <= 0) return;
    setItems((current) => {
      const existing = current.find((i) => i.product_id === product.id);
      if (existing) return current.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      return [...current, { product_id: product.id, code: product.code, name: product.name, quantity, unit_price: Number(product.sale_price), discount: 0, tax_rate: Number(product.tax_rate) }];
    });
    setSelected("");
    setQuantity(1);
  }

  function patch(index: number, key: keyof SaleItem, value: number) {
    setItems((current) => current.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  return <form action={createSaleAction} className="space-y-5">
    <input type="hidden" name="items_json" value={JSON.stringify(items.map(({ product_id, quantity, unit_price, discount, tax_rate }) => ({ product_id, quantity, unit_price, discount, tax_rate })))} />

    <div className="grid gap-3 md:grid-cols-4">
      <select name="branch_id" required className="rounded-lg border px-3 py-2 text-sm"><option value="">Sucursal *</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
      <select name="customer_id" className="rounded-lg border px-3 py-2 text-sm"><option value="">Consumidor final</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.customer_code ? `${c.customer_code} · ` : ""}{c.name}</option>)}</select>
      <select name="sale_type" className="rounded-lg border px-3 py-2 text-sm"><option value="CASH">Contado</option><option value="PARTIAL">Pago parcial</option><option value="CREDIT">Crédito</option></select>
      <input name="due_date" type="date" className="rounded-lg border px-3 py-2 text-sm" />
    </div>

    <div className="rounded-xl border bg-neutral-50 p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm"><option value="">Seleccionar producto o servicio</option>{products.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name} · {Number(p.sale_price).toLocaleString("es-PY")}</option>)}</select>
        <input type="number" min="0.001" step="0.001" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="rounded-lg border bg-white px-3 py-2 text-sm" />
        <button type="button" onClick={addItem} className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Agregar</button>
      </div>
    </div>

    <div className="overflow-hidden rounded-xl border bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50"><tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Producto</th><th className="px-3 py-2">Cantidad</th><th className="px-3 py-2">Precio</th><th className="px-3 py-2">Desc.</th><th className="px-3 py-2">Total</th><th /></tr></thead><tbody className="divide-y">
      {items.length ? items.map((item, index) => { const base = item.quantity * item.unit_price; const taxable = Math.max(0, base-item.discount); const rowTotal = taxable + taxable*item.tax_rate/100; return <tr key={item.product_id}><td className="px-3 py-2 font-mono">{item.code}</td><td className="px-3 py-2 font-medium">{item.name}</td><td className="px-3 py-2"><input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => patch(index,"quantity",Number(e.target.value))} className="w-24 rounded border px-2 py-1" /></td><td className="px-3 py-2"><input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => patch(index,"unit_price",Number(e.target.value))} className="w-28 rounded border px-2 py-1" /></td><td className="px-3 py-2"><input type="number" min="0" step="0.01" value={item.discount} onChange={(e) => patch(index,"discount",Number(e.target.value))} className="w-24 rounded border px-2 py-1" /></td><td className="px-3 py-2 font-medium">{rowTotal.toLocaleString("es-PY")}</td><td className="px-3 py-2"><button type="button" onClick={() => setItems((current) => current.filter((_,i) => i!==index))} className="rounded p-1 hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-600" /></button></td></tr>; }) : <tr><td colSpan={7} className="px-3 py-8 text-center text-neutral-500">Agregá al menos un producto o servicio.</td></tr>}
    </tbody></table></div></div>

    <div className="grid gap-3 md:grid-cols-4">
      <input name="amount_paid" type="number" min="0" step="0.01" placeholder="Monto cobrado ahora" className="rounded-lg border px-3 py-2 text-sm" />
      <select name="payment_method" className="rounded-lg border px-3 py-2 text-sm"><option value="CASH">Efectivo</option><option value="TRANSFER">Transferencia</option><option value="CARD">Tarjeta</option><option value="OTHER">Otro</option></select>
      <input name="notes" placeholder="Observaciones" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
    </div>

    <div className="flex items-center justify-between rounded-xl border bg-neutral-50 p-4"><div><div className="text-sm text-neutral-500">Total estimado</div><div className="text-2xl font-semibold">{total.toLocaleString("es-PY")}</div></div><button disabled={!items.length} className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">Confirmar venta</button></div>
  </form>;
}
