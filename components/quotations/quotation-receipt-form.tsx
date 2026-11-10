"use client";

import { useState } from "react";
import { generateReceiptFromQuotationAction } from "@/app/app/quotations/[id]/actions";

type Branch = {id: string; name: string};
export function QuotationReceiptForm({
  quotationId, total, suggestedDeposit, currency, branches,
}: {
  quotationId:string; total:number; suggestedDeposit:number; currency:string; branches:Branch[];
}) {
  const [amount,setAmount] = useState(String(Math.max(0,Math.min(total,suggestedDeposit))));
  const [saving,setSaving] = useState(false);
  const numeric = Number(amount);
  const valid = amount.trim()!=="" && Number.isFinite(numeric) && numeric >= 0 && numeric <= total;
  const format=(v:number)=>new Intl.NumberFormat("es-PY",{maximumFractionDigits:2}).format(v)+" "+currency;
  const isCredit = numeric===0;
  return <form action={generateReceiptFromQuotationAction} onSubmit={()=>setSaving(true)} className="mt-4 space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 print:hidden">
    <div><h3 className="font-bold text-slate-900">Generar comprobante desde esta cotización</h3>
      <p className="mt-1 text-xs leading-5 text-slate-600">Los datos del cliente y los conceptos se copiarán automáticamente. El cobro se registrará solo por el importe recibido. La cotización y el comprobante quedarán vinculados.</p>
    </div>
    <input type="hidden" name="quotation_id" value={quotationId}/>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">Sucursal *
        <select name="branch_id" required className="liago-input mt-1"><option value="">Elegir sucursal</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
      </label>
      <label className="text-sm font-semibold text-slate-700">Monto efectivamente cobrado ({currency}) *
        <input name="amount_paid" required type="number" min="0" max={total} step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="liago-input mt-1"/>
      </label>
      <label className="text-sm font-semibold text-slate-700">Forma de pago
        <select name="payment_method" className="liago-input mt-1"><option value="CASH">Efectivo</option><option value="TRANSFER">Transferencia</option><option value="CARD">Tarjeta</option><option value="OTHER">Otro</option></select>
      </label>
      <label className="text-sm font-semibold text-slate-700">Fecha de vencimiento del saldo (opcional)
        <input name="due_date" type="date" className="liago-input mt-1"/>
      </label>
    </div>
    {valid ? <div className="rounded-lg bg-white p-3 text-sm text-slate-700">
      <div className="flex justify-between"><span>Total cotizado</span><strong>{format(total)}</strong></div>
      <div className="mt-1 flex justify-between"><span>Cobro real ahora</span><strong>{format(numeric)}</strong></div>
      <div className="mt-1 flex justify-between border-t pt-1"><span>Saldo por cobrar</span><strong>{format(total-numeric)}</strong></div>
    </div>:<p className="text-sm text-red-700">El cobro debe estar entre cero y el importe total.</p>}
    {isCredit ? <p className="text-xs text-amber-800">Con Gs. 0 se registra una venta a crédito y una deuda, pero todavía no un recibo de pago.</p>:null}
    <button type="submit" disabled={!valid||saving||!branches.length} className="liago-btn-primary disabled:opacity-50">
      {saving?"Registrando...":isCredit?"Confirmar operación a crédito":"Registrar cobro y abrir comprobante"}
    </button>
    <p className="text-xs text-slate-500">Para pagos posteriores de saldos pendientes, utilizá Deudas y cobros. No se generará una segunda venta por esta cotización.</p>
  </form>;
}
