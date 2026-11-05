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
    "Muchas gracias por confiar en nosotros.",
    companyName,
  ].join("\n");
  // Gmail compose works without OAuth, Gmail API calls, or additional server usage.
  // The link cannot attach local PDFs or establish that a message was sent.
  const gmailUrl = new URL("https://mail.google.com/mail/u/0/");
  gmailUrl.searchParams.set("view", "cm");
  gmailUrl.searchParams.set("fs", "1");
  if (customerEmail?.trim()) gmailUrl.searchParams.set("to", customerEmail.trim());
  gmailUrl.searchParams.set("su", subject);
  gmailUrl.searchParams.set("body", body);
  const href = gmailUrl.toString();

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Preparar correo en Gmail (se abre en una pestaña nueva)" className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
      <Mail className="h-4 w-4" /> Preparar correo en Gmail
    </a>
  );
}
