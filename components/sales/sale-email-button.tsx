"use client";

import { Mail } from "lucide-react";

type SaleEmailButtonProps = {
  customerEmail: string | null;
  customerName: string;
  companyName: string;
  saleNumber: string;
  saleDate: string;
  total: string;
  amountPaid: string;
  balance: string;
  proforma: boolean;
  nextPaymentDate: string | null;
};

export function SaleEmailButton({
  customerEmail, customerName, companyName, saleNumber, saleDate, total, amountPaid, balance, proforma, nextPaymentDate,
}: SaleEmailButtonProps) {
  const documentLabel = proforma ? "Factura proforma (no tributaria)" : "Comprobante interno de venta";
  const subject = `${documentLabel} #${saleNumber} · ${companyName}`;
  const body = [
    `Hola ${customerName},`,
    "",
    `Te compartimos el resumen de tu operación con ${companyName}.`,
    `${documentLabel}: #${saleNumber}`,
    `Fecha: ${saleDate}`,
    `Total: ${total}`,
    `Abonado: ${amountPaid}`,
    `Saldo pendiente: ${balance}`,
    ...(nextPaymentDate ? [`Próxima fecha de pago: ${nextPaymentDate}`] : []),
    "",
    "Te compartimos el comprobante correspondiente para tu referencia.",
    proforma ? "Este documento es una proforma y no constituye una factura tributaria." : "Este documento es un comprobante interno y no constituye una factura tributaria.",
    "",
    "Antes de enviar este correo, adjuntá el PDF del comprobante guardado desde Liago.",
    "",
    "Muchas gracias por confiar en nosotros.",
    companyName,
  ].join("\n");
  const href = `mailto:${encodeURIComponent(customerEmail || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <a href={href} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
      <Mail className="h-4 w-4" /> Preparar correo
    </a>
  );
}
