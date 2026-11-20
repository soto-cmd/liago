"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, FileImage, FileText, Printer, RotateCcw } from "lucide-react";

type Paper = "A4" | "A5" | "Carta" | "Oficio";
type Template = "rayado" | "cuadricula" | "puntos" | "blanco" | "cornell" | "caligrafia" | "musica" | "horario" | "lista" | "matematicas";
const formats: Record<Paper, [number, number]> = { A4: [210, 297], A5: [148, 210], Carta: [215.9, 279.4], Oficio: [215.9, 330.2] };
const templates: { id: Template; name: string; description: string }[] = [
  { id: "rayado", name: "Papel rayado", description: "Apuntes y escritura" },
  { id: "cuadricula", name: "Cuadriculado", description: "Dibujos y cálculos" },
  { id: "puntos", name: "Punteado", description: "Bullet journal" },
  { id: "blanco", name: "Hoja blanca", description: "Página sin guías" },
  { id: "cornell", name: "Notas Cornell", description: "Estudio y resúmenes" },
  { id: "caligrafia", name: "Caligrafía", description: "Práctica de escritura" },
  { id: "musica", name: "Pentagramas", description: "Partituras musicales" },
  { id: "horario", name: "Horario semanal", description: "Planificación" },
  { id: "lista", name: "Lista de tareas", description: "Organización diaria" },
  { id: "matematicas", name: "Cuadrícula matemática", description: "Ejercicios escolares" },
];
const safe = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
const n = (v: number) => Number(v.toFixed(3));

function makeSvg(kind: Template, w: number, h: number, margin: number, step: number, color: string, heading: string) {
  const x = margin, y = margin, right = w - margin, bottom = h - margin;
  const line = (x1: number, y1: number, x2: number, y2: number, width = .22, dash = "") =>
    `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
  const txt = (t: string, xx: number, yy: number, size = 4) => `<text x="${n(xx)}" y="${n(yy)}" fill="#334155" font-family="Arial,sans-serif" font-size="${size}">${safe(t)}</text>`;
  let content = "";
  const titleSpace = heading.trim() ? 13 : 0;
  const top = y + titleSpace;
  if (heading.trim()) content += txt(heading.slice(0, 80), x, y + 5, 5.6);
  const rows = (spacing = step, start = top + spacing) => {
    for (let yy = start; yy <= bottom + .001; yy += spacing) content += line(x, yy, right, yy);
  };
  const grid = (spacing = step) => {
    for (let xx = x; xx <= right + .001; xx += spacing) content += line(xx, top, xx, bottom, .17);
    for (let yy = top; yy <= bottom + .001; yy += spacing) content += line(x, yy, right, yy, .17);
  };
  if (kind === "rayado") { rows(); content += line(x + 13, top, x + 13, bottom, .35); }
  if (kind === "cuadricula" || kind === "matematicas") grid(kind === "matematicas" ? Math.max(5, step) : step);
  if (kind === "puntos") for (let xx = x; xx <= right; xx += step) for (let yy = top; yy <= bottom; yy += step) content += `<circle cx="${n(xx)}" cy="${n(yy)}" r=".38" fill="${color}"/>`;
  if (kind === "cornell") { const divider = x + (right - x) * .3; content += line(divider, top, divider, bottom - 32, .4); content += line(x, bottom - 32, right, bottom - 32, .4); for (let yy = top + step; yy < bottom - 32; yy += step) content += line(x, yy, right, yy, .17); content += txt("Ideas clave", x + 2, top + 5, 3.5) + txt("Notas", divider + 2, top + 5, 3.5) + txt("Resumen", x + 2, bottom - 27, 3.5); }
  if (kind === "caligrafia") for (let yy = top + 4 * step; yy <= bottom; yy += 4 * step) { content += line(x, yy, right, yy, .35) + line(x, yy - step, right, yy - step, .17, "1.3 1.3") + line(x, yy - 2 * step, right, yy - 2 * step, .17, "1.3 1.3") + line(x, yy - 3 * step, right, yy - 3 * step, .35); }
  if (kind === "musica") { const gap = Math.max(step * .6, 2); for (let yy = top + 7; yy + 4 * gap <= bottom; yy += gap * 9) for (let k = 0; k < 5; k++) content += line(x, yy + k * gap, right, yy + k * gap, .28); }
  if (kind === "horario") { const days = ["Hora", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]; const cell = (right - x) / 7; const head = top + 11; for (let i = 0; i <= 7; i++) content += line(x + i * cell, top, x + i * cell, bottom, .22); content += line(x, top, right, top) + line(x, head, right, head); days.forEach((d, i) => { content += txt(d, x + i * cell + 2, top + 7, 3.5); }); for (let yy = head + 13; yy <= bottom; yy += 13) content += line(x, yy, right, yy); }
  if (kind === "lista") for (let yy = top + 13; yy <= bottom; yy += Math.max(step * 1.8, 10)) { content += `<rect x="${x}" y="${n(yy - 4)}" width="4.5" height="4.5" stroke="${color}" stroke-width=".3" fill="none"/>` + line(x + 8, yy + 1, right, yy + 1); }
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#fff"/>${content}</svg>`;
  return doc;
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default function PlantillasPage() {
  const [kind, setKind] = useState<Template>("rayado");
  const [paper, setPaper] = useState<Paper>("A4");
  const [landscape, setLandscape] = useState(false);
  const [margin, setMargin] = useState(12);
  const [step, setStep] = useState(7);
  const [color, setColor] = useState("#94a3b8");
  const [heading, setHeading] = useState("");
  const [copies, setCopies] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fw, fh] = formats[paper];
  const [w, h] = landscape ? [fh, fw] : [fw, fh];
  const svg = useMemo(() => makeSvg(kind, w, h, margin, step, color, heading), [kind, w, h, margin, step, color, heading]);
  const filename = `Liago ${kind} ${paper}${landscape ? " horizontal" : ""}`;
  const downloadSvg = () => save(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), filename + ".svg");
  async function downloadPng() {
    setBusy(true); setError("");
    try {
      const image = new Image();
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
      try {
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("No se pudo generar la imagen.")); image.src = url; });
        const canvas = document.createElement("canvas");
        const scale = 300 / 25.4; canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Tu navegador no admite la exportación.");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("No se pudo exportar PNG.")), "image/png"));
        save(blob, filename + ".png");
      } finally { URL.revokeObjectURL(url); }
    } catch (e) { setError(e instanceof Error ? e.message : "Ocurrió un error al exportar."); }
    finally { setBusy(false); }
  }
  function printPdf() {
    setError("");
    const popup = window.open("", "_blank");
    if (!popup) { setError("Habilitá las ventanas emergentes para imprimir o guardar como PDF."); return; }
    const pages = Array.from({ length: copies }, () => `<div class="page">${svg}</div>`).join("");
    popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${safe(filename)}</title><style>@page{size:${n(w)}mm ${n(h)}mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}.page{width:${w}mm;height:${h}mm;break-after:page;page-break-after:always;overflow:hidden}.page:last-child{break-after:auto;page-break-after:auto}svg{display:block;width:100%;height:100%}@media screen{body{background:#e2e8f0;padding:16px}.page{margin:0 auto 16px;box-shadow:0 3px 20px #94a3b8}}</style></head><body>${pages}<script>window.onload=()=>{window.focus();window.print()}<\/script></body></html>`);
    popup.document.close();
  }
  function reset() { setKind("rayado"); setPaper("A4"); setLandscape(false); setMargin(12); setStep(7); setColor("#94a3b8"); setHeading(""); setCopies(1); setError(""); }
  const selectClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500";
  const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500";
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6"><Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft size={17}/> LiaGo</Link><span className="text-sm font-extrabold tracking-tight">Generador de plantillas</span><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Gratis · Sin registro</span></div></header>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-7"><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Herramientas gratuitas LiaGo</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Creá papel listo para imprimir</h1><p className="mt-2 text-sm text-slate-600">Elegí una plantilla, personalizá sus medidas y descargala. Todo se genera en tu dispositivo.</p></div>
      <div className="grid items-start gap-6 lg:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div><h2 className="mb-3 text-sm font-extrabold">1. Elegí una plantilla</h2><div className="grid grid-cols-2 gap-2">{templates.map((item) => <button type="button" key={item.id} title={item.description} onClick={() => setKind(item.id)} aria-pressed={kind === item.id} className={`rounded-xl border p-3 text-left text-xs font-semibold transition ${kind === item.id ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 hover:border-blue-300"}`}>{item.name}</button>)}</div></div>
          <div className="border-t border-slate-100 pt-4"><h2 className="mb-3 text-sm font-extrabold">2. Personalizá tu hoja</h2><div className="grid grid-cols-2 gap-3">
            <label><span className={labelClass}>Tamaño</span><select className={selectClass} value={paper} onChange={(e) => setPaper(e.target.value as Paper)}>{Object.keys(formats).map(f => <option key={f}>{f}</option>)}</select></label>
            <label><span className={labelClass}>Orientación</span><select className={selectClass} value={landscape ? "h" : "v"} onChange={e => setLandscape(e.target.value === "h")}><option value="v">Vertical</option><option value="h">Horizontal</option></select></label>
            <label><span className={labelClass}>Márgenes (mm)</span><input className={selectClass} type="number" min="5" max="35" value={margin} onChange={e => setMargin(Math.min(35, Math.max(5, Number(e.target.value) || 5)))}/></label>
            <label><span className={labelClass}>Espaciado (mm)</span><input className={selectClass} type="number" min="2" max="25" step=".5" value={step} onChange={e => setStep(Math.min(25, Math.max(2, Number(e.target.value) || 2)))}/></label>
            <label><span className={labelClass}>Color de guías</span><input aria-label="Color de guías" className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1" type="color" value={color} onChange={e => setColor(e.target.value)}/></label>
            <label><span className={labelClass}>Copias PDF</span><input className={selectClass} type="number" min="1" max="30" value={copies} onChange={e => setCopies(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}/></label>
          </div><label className="mt-3 block"><span className={labelClass}>Título (opcional)</span><input className={selectClass} type="text" maxLength={80} placeholder="Ej.: Mis apuntes" value={heading} onChange={e => setHeading(e.target.value)}/></label></div>
          <div className="border-t border-slate-100 pt-4"><h2 className="mb-3 text-sm font-extrabold">3. Descargá o imprimí</h2><div className="grid gap-2"><button onClick={printPdf} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"><Printer size={17}/> Imprimir / Guardar PDF</button><div className="grid grid-cols-2 gap-2"><button disabled={busy} onClick={downloadPng} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><FileImage size={16}/> {busy ? "Generando…" : "PNG"}</button><button onClick={downloadSvg} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50"><Download size={16}/> SVG</button></div></div>{error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}<button onClick={reset} className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-700"><RotateCcw size={14}/> Restablecer</button></div>
        </aside>
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-extrabold">Vista previa en vivo</h2><p className="text-xs text-slate-500">{templates.find(t => t.id === kind)?.name} · {paper} · {landscape ? "Horizontal" : "Vertical"} · {n(w)} × {n(h)} mm</p></div><span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><FileText size={15}/> Escala real al imprimir</span></div><div className="flex max-h-[780px] items-start justify-center overflow-auto rounded-xl bg-slate-100 p-4 sm:p-7"><div className="w-full max-w-[580px] shrink-0 overflow-hidden bg-white shadow-xl" style={{ aspectRatio: `${w} / ${h}` }}><div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }}/></div></div><p className="mt-4 text-xs leading-5 text-slate-500">Al guardar como PDF, elegí «Guardar como PDF» en la ventana de impresión y seleccioná escala 100 %, sin márgenes adicionales ni encabezados del navegador. Las páginas se procesan localmente y no se envían a servidores.</p></section>
      </div>
    </div>
  </main>;
}
