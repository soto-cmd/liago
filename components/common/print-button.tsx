"use client";

import { FileDown } from "lucide-react";

export function PrintButton({ filename = "comprobante.pdf" }: { filename?: string }) {
  function savePdf() {
    // Browsers control the Save as PDF destination; no paid server PDF service needed.
    // The title is used as the suggested filename by many desktop browsers.
    const originalTitle = document.title;
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    document.title = filename.replace(/\.pdf$/i, "");
    window.addEventListener("afterprint", restoreTitle, { once: true });
    window.print();
  }

  return (
    <button
      type="button"
      onClick={savePdf}
      title="En la ventana de impresión elegí «Guardar como PDF». Desactivá encabezados y pies de página si aparecen."
      className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 active:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 print:hidden"
    >
      <FileDown className="h-4 w-4" /> Guardar como PDF
    </button>
  );
}
