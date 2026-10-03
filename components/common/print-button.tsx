"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium print:hidden"
    >
      <Printer className="h-4 w-4" /> Imprimir comprobante
    </button>
  );
}
