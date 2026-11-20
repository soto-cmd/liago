"use client";
import {useState} from "react";
import {CustomerPicker, type QuickCustomer} from "@/components/customers/customer-picker";
import {assignMissingPaymentCustomerAction} from "@/app/app/payments/assign-customer-action";
export function AssignMissingPaymentCustomerForm({paymentId,customers}:{paymentId:string;customers:QuickCustomer[]}){
 const [customerId,setCustomerId]=useState("");
 return <form action={assignMissingPaymentCustomerAction} className="mt-3 space-y-3">
  <input type="hidden" name="payment_id" value={paymentId}/>
  <CustomerPicker customers={customers} value={customerId} onChange={setCustomerId}/>
  <p className="text-xs text-slate-600">Se asignará el cliente al recibo y su venta original. No se modificarán montos, fechas, saldos ni numeraciones. La corrección quedará auditada.</p>
  <button type="submit" className="liago-btn-primary disabled:opacity-50" disabled={!customerId}>Vincular cliente</button>
 </form>;
}
