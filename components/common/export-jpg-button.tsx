"use client";

import { useState } from "react";
import { ImageDown } from "lucide-react";

export function ExportJpgButton({ filename, targetId }: { filename: string; targetId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function downloadJpg() {
    if (busy) return;
    const node = document.getElementById(targetId);
    if (!node) { setError(true); return; }
    setBusy(true);
    setError(false);
    try {
      // Dynamic import: no PDF/JPG renderer on the server or on ordinary page visits.
      const { toJpeg } = await import("html-to-image");
      const dataUrl = await toJpeg(node, {
        quality: 0.94,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: false,
      });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = filename.replace(/\.pdf$/i, ".jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (cause) {
      console.error("Document JPG export failed", cause);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return <div className="inline-flex flex-col items-start gap-1 print:hidden">
    <button type="button" disabled={busy} onClick={downloadJpg}
      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-60">
      <ImageDown className="h-4 w-4" /> {busy ? "Generando JPG..." : "Exportar JPG"}
    </button>
    {error ? <span role="alert" className="text-xs text-red-700">No se pudo generar el JPG. Probá con PDF.</span> : null}
  </div>;
}
