"use client";

import { useMemo, useRef, useState } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { createSaleAction } from "@/app/app/sales/actions";

type Product = { id: string; code: string; name: string; sale_price: number; tax_rate: number; unit: string };
type Customer = { id: string; name: string; customer_code: string | null };
type Branch = { id: string; name: string };
type SaleItem = { product_id: string; code: string; name: string; quantity: number; unit_price: number; discount: number; tax_rate: number; unit: string };
type SaleType = "CASH" | "PARTIAL" | "CREDIT";

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function money(value: number) {
  return `Gs. ${Math.round(value).toLocaleString("es-PY")}`;
}

export function NewSaleForm({ products, customers, branches }: { products: Product[]; customers: Customer[]; branches: Branch[] }) {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saleType, setSaleType] = useState<SaleType>("CASH");
  const [customerId, setCustomerId] = useState("");
  const [partialPaid, setPartialPaid] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return products.slice(0, 8);
    return products.filter((p) => `${p.code} ${p.name}`.toLowerCase().includes(text)).slice(0, 8);
  }, [products, query]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + round2(item.quantity * item.unit_price), 0), [items]);
  const discounts = useMemo(() => items.reduce((sum, item) => {
    const rowSubtotal = round2(item.quantity * item.unit_price);
    return sum + Math.min(Math.max(item.discount, 0), rowSubtotal);
  }, 0), [items]);
  const taxes = useMemo(() => items.reduce((sum, item) => {
    const rowSubtotal = round2(item.quantity * item.unit_price);
    const discount = Math.min(Math.max(item.discount, 0), rowSubtotal);
    return sum + round2((rowSubtotal - discount) * item.tax_rate / 100);
  }, 0), [items]);
  const total = round2(subtotal - discounts + taxes);

  const needsCustomer = saleType !== "CASH";
  const partialValue = Number(partialPaid) || 0;
  const partialValid = saleType !== "PARTIAL" || (partialValue > 0 && partialValue < total);
  const canSubmit = Boolean(branchId) && items.length > 0 && (!needsCustomer || Boolean(customerId)) && partialValid;
  const balance = saleType === "CASH" ? 0 : saleType === "CREDIT" ? total : Math.max(total - partialValue, 0);

  function addProduct(product: Product) {
    if (quantity <= 0) return;
    setItems((current) => {
      const existing = current.find((i) => i.product_id === product.id);
      if (existing) return current.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      return [...current, {
        product_id: product.id,
        code: product.code,
        name: product.name,
        quantity,
        unit_price: Number(product.sale_price),
        discount: 0,
        tax_rate: Number(product.tax_rate),
        unit: product.unit,
      }];
    });
    setQuery("");
    setQuantity(1);
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }

  function patch(index: number, key: "quantity" | "unit_price" | "discount", value: number) {
    setItems((current) => current.map((item, i) => i === index ? { ...item, [key]: Math.max(value, 0) } : item));
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const exact = products.find((p) => p.code.toLowerCase() === query.trim().toLowerCase());
    const product = exact ?? filteredProducts[0];
    if (product) addProduct(product);
  }

  return (
    <form action={createSaleAction} className="space-y-4">
      <input type="hidden" name="items_json" value={JSON.stringify(items.map(({ product_id, quantity: q, unit_price, discount, tax_rate }) => ({ product_id, quantity: q, unit_price, discount, tax_rate })))} />
      <input type="hidden" name="branch_id" value={branchId} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Datos de venta</div>
            <div className="text-xs text-slate-500">Configurá lo esencial y empezá a cargar ítems.</div>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Venta nueva</div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[0.85fr_1.2fr_0.9fr_1fr]">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">Sucursal</span>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} required className="liago-input w-full">
              <option value="">Seleccionar</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">Cliente</span>
            <select name="customer_id" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required={needsCustomer} className="liago-input w-full">
              <option value="">{needsCustomer ? "Seleccionar cliente *" : "Consumidor final"}</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.customer_code ? `${c.customer_code} · ` : ""}{c.name}</option>)}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">Tipo de venta</span>
            <select name="sale_type" value={saleType} onChange={(e) => { setSaleType(e.target.value as SaleType); setPartialPaid(""); }} className="liago-input w-full">
              <option value="CASH">Contado</option>
              <option value="PARTIAL">Pago parcial</option>
              <option value="CREDIT">Crédito</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">{saleType === "CASH" ? "Cobro" : "Vencimiento"}</span>
            {saleType === "CASH"
              ? <div className="flex h-11 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700">Cobro total automático</div>
              : <input name="due_date" type="date" className="liago-input w-full" />}
          </label>
        </div>

        {needsCustomer && !customerId ? <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Seleccioná un cliente para continuar con una venta {saleType === "CREDIT" ? "a crédito" : "con pago parcial"}.</div> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Productos y servicios</div>
            <div className="text-xs text-slate-500">Buscá por código o nombre. Enter agrega la primera coincidencia.</div>
          </div>
          <div className="text-xs font-semibold text-slate-500">{items.length} ítem{items.length === 1 ? "" : "s"}</div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_150px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder="Buscar producto, servicio o código…" className="liago-input w-full pl-9" />
            {query ? (
              <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                {filteredProducts.length ? filteredProducts.map((p) => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.code} · {p.unit === "SERVICIO" ? "Servicio" : "Producto"}</div>
                    </div>
                    <div className="shrink-0 text-sm font-bold text-slate-900">{money(Number(p.sale_price))}</div>
                  </button>
                )) : <div className="px-3 py-6 text-center text-sm text-slate-500">Sin coincidencias.</div>}
              </div>
            ) : null}
          </div>

          <div className="flex h-11 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="grid h-full w-11 place-items-center text-slate-600 hover:bg-slate-50"><Minus className="h-4 w-4" /></button>
            <input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="h-full min-w-0 flex-1 border-x border-slate-200 text-center text-sm font-semibold outline-none" />
            <button type="button" onClick={() => setQuantity((q) => q + 1)} className="grid h-full w-11 place-items-center text-slate-600 hover:bg-slate-50"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Ítem</th><th className="px-3 py-3">Cantidad</th><th className="px-3 py-3">Precio</th><th className="px-3 py-3">Descuento</th><th className="px-3 py-3 text-right">Total</th><th className="w-12" /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {items.length ? items.map((item, index) => {
                  const rowSubtotal = round2(item.quantity * item.unit_price);
                  const discount = Math.min(Math.max(item.discount, 0), rowSubtotal);
                  const tax = round2((rowSubtotal - discount) * item.tax_rate / 100);
                  const rowTotal = rowSubtotal - discount + tax;
                  return <tr key={item.product_id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-3"><div className="font-semibold text-slate-900">{item.name}</div><div className="mt-0.5 text-xs text-slate-500">{item.code} · {item.unit === "SERVICIO" ? "Servicio" : item.unit}</div></td>
                    <td className="px-3 py-3"><input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => patch(index, "quantity", Number(e.target.value))} className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /></td>
                    <td className="px-3 py-3"><input type="number" min="0" step="1" value={item.unit_price} onChange={(e) => patch(index, "unit_price", Number(e.target.value))} className="w-32 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /></td>
                    <td className="px-3 py-3"><input type="number" min="0" step="1" value={item.discount} onChange={(e) => patch(index, "discount", Number(e.target.value))} className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /></td>
                    <td className="px-3 py-3 text-right font-bold text-slate-900">{money(rowTotal)}</td>
                    <td className="px-3 py-3"><button type="button" onClick={() => setItems((current) => current.filter((_, i) => i !== index))} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label={`Quitar ${item.name}`}><Trash2 className="h-4 w-4" /></button></td>
                  </tr>;
                }) : <tr><td colSpan={6} className="px-4 py-10 text-center"><ShoppingCart className="mx-auto mb-2 h-7 w-7 text-slate-300" /><div className="text-sm font-medium text-slate-500">Todavía no agregaste productos o servicios.</div><div className="mt-1 text-xs text-slate-400">Usá el buscador de arriba para empezar.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 text-sm font-semibold text-slate-900">Cobro y observaciones</div>
          <div className="grid gap-3 md:grid-cols-2">
            {saleType === "PARTIAL" ? <label className="space-y-1.5"><span className="text-xs font-semibold text-slate-600">Monto recibido</span><input name="amount_paid" type="number" min="1" max={Math.max(total - 1, 1)} step="1" value={partialPaid} onChange={(e) => setPartialPaid(e.target.value)} required placeholder="0" className="liago-input w-full" /></label> : <input type="hidden" name="amount_paid" value={saleType === "CREDIT" ? "0" : total} />}

            {saleType !== "CREDIT" ? <label className="space-y-1.5"><span className="text-xs font-semibold text-slate-600">Forma de pago</span><select name="payment_method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="liago-input w-full"><option value="CASH">Efectivo</option><option value="TRANSFER">Transferencia</option><option value="CARD">Tarjeta</option><option value="OTHER">Otro</option></select></label> : <input type="hidden" name="payment_method" value="" />}

            <label className="space-y-1.5 md:col-span-2"><span className="text-xs font-semibold text-slate-600">Observaciones</span><textarea name="notes" rows={3} placeholder="Notas opcionales de la venta" className="liago-input w-full resize-none" /></label>
          </div>
          {saleType === "PARTIAL" && partialPaid && !partialValid ? <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">El pago parcial debe ser mayor a Gs. 0 y menor al total.</div> : null}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Resumen</div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-300"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex items-center justify-between text-slate-300"><span>Descuentos</span><span>- {money(discounts)}</span></div>
            <div className="flex items-center justify-between text-slate-300"><span>Impuestos</span><span>{money(taxes)}</span></div>
          </div>
          <div className="my-4 border-t border-slate-800" />
          <div className="flex items-end justify-between gap-3"><span className="text-sm font-semibold text-slate-300">Total</span><span className="text-3xl font-black tracking-tight">{money(total)}</span></div>
          <div className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300">{saleType === "CASH" ? "Se registrará como pagada en su totalidad." : saleType === "CREDIT" ? `Saldo del cliente: ${money(balance)}` : `Saldo pendiente: ${money(balance)}`}</div>
          <button disabled={!canSubmit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"><ShoppingCart className="h-4 w-4" /> Confirmar venta</button>
          {!canSubmit ? <div className="mt-2 text-center text-[11px] text-slate-500">Agregá ítems y completá los datos obligatorios.</div> : null}
        </aside>
      </div>
    </form>
  );
}
