"use client";

import Link from "next/link";
import {useMemo,useState} from "react";
import {ArrowRight,Download,FileImage,FileText,Grid3X3,Palette,Ruler,SlidersHorizontal} from "lucide-react";
import {entries,initial,svgFor} from "../estudio";

const papers=["A4","Carta","A5","Oficio","A3"] as const;
const patterns=[
 {id:"cuadricula",label:"Cuadrícula"},
 {id:"pautado",label:"Papel rayado"},
 {id:"puntos",label:"Puntos"},
 {id:"blanco",label:"Papel blanco"},
 {id:"isometrico",label:"Isométrico"},
 {id:"hexagono",label:"Hexagonal"},
 {id:"pautado-primaria",label:"Caligrafía"},
 {id:"cartesiano",label:"Cartesiano"}
] as const;
const swatches=[
 {name:"Azul",value:"#7295e6"},
 {name:"Gris",value:"#94a3b8"},
 {name:"Negro",value:"#2d3748"},
 {name:"Verde",value:"#65a18e"},
 {name:"Rojo",value:"#d08484"}
] as const;

function saveFile(blob:Blob,filename:string){
 const url=URL.createObjectURL(blob),link=document.createElement("a");
 link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),3000);
}

export default function InicioEditorRapido(){
 const [template,setTemplate]=useState("cuadricula");
 const [spacing,setSpacing]=useState(6.35);
 const [paper,setPaper]=useState<string>("A4");
 const [ink,setInk]=useState<string>("#7295e6");
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const chosen=patterns.find(t=>t.id===template);
 const color=swatches.find(c=>c.value===ink);
 const art=useMemo(()=>svgFor({...initial,template,paper,spacing,ink,margin:13}),[template,paper,spacing,ink]);
 const filename="Liago "+(entries.find(e=>e.id===template)?.name||"Plantilla");
 const advanced="/plantillas?"+new URLSearchParams({template,paper,separacion:String(spacing),tinta:ink}).toString();

 function downloadSvg(){
  try{saveFile(new Blob([art.svg],{type:"image/svg+xml;charset=utf-8"}),filename+".svg");setNotice("");}
  catch{setNotice("No se pudo generar el SVG.");}
 }
 async function downloadPng(){
  setBusy(true);setNotice("");
  const source=URL.createObjectURL(new Blob([art.svg],{type:"image/svg+xml;charset=utf-8"}));
  try{
   const img=new Image();
   await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error("Imagen inválida"));img.src=source;});
   const canvas=document.createElement("canvas");
   canvas.width=Math.round(art.w*300/25.4);canvas.height=Math.round(art.h*300/25.4);
   const ctx=canvas.getContext("2d");
   if(!ctx)throw new Error("Canvas no disponible");
   ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error("PNG no disponible")),"image/png"));
   saveFile(blob,filename+".png");
  }catch{setNotice("No fue posible descargar PNG. Probá con SVG.");}
  finally{URL.revokeObjectURL(source);setBusy(false);}
 }
 function downloadPdf(){
  setNotice("");
  // Mismo mecanismo que el editor completo: impresión nativa con destino Guardar como PDF.
  document.getElementById("liago-home-print-frame")?.remove();
  const iframe=document.createElement("iframe");
  iframe.id="liago-home-print-frame";iframe.title="Impresión de plantilla Liago";
  iframe.style.cssText="position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none";
  let printed=false;
  iframe.onload=()=>{
   if(printed)return;printed=true;
   const target=iframe.contentWindow;
   if(!target){setNotice("No se pudo preparar la impresión.");iframe.remove();return;}
   target.addEventListener("afterprint",()=>window.setTimeout(()=>iframe.remove(),1000),{once:true});
   try{target.focus();target.print();window.setTimeout(()=>{if(iframe.isConnected)iframe.remove()},120000);}
   catch{setNotice("No se pudo abrir el cuadro de impresión.");iframe.remove();}
  };
  iframe.srcdoc=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${filename}</title><style>@page{size:${art.w}mm ${art.h}mm;margin:0}html,body{margin:0;padding:0;background:#fff}svg{width:100%;height:100%;display:block}</style></head><body>${art.svg}</body></html>`;
  document.body.appendChild(iframe);
 }
 const selectClass="w-full min-w-0 appearance-none rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-800 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100";
 return <section aria-labelledby="liago-inicio-hero-title" className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-10 sm:px-8 lg:min-h-[690px] lg:grid-cols-[minmax(270px,.78fr)_minmax(0,1.22fr)] lg:gap-14 lg:py-14">
  <div className="max-w-[570px] lg:pl-5">
   <p className="mb-5 text-xs font-bold uppercase tracking-[.19em] text-blue-900">Editor de papel · Liago</p>
   <h1 id="liago-inicio-hero-title" className="max-w-[540px] font-serif text-5xl leading-[1.09] tracking-tight sm:text-6xl">Plantillas de papel imprimibles gratis</h1>
   <div className="mt-7 flex flex-wrap items-center gap-2 text-sm">
    <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">Vista previa en vivo</span>
    <span className="font-serif text-2xl italic text-blue-900">{chosen?.label}</span>
   </div>
   <p className="mt-5 max-w-md text-base leading-7 text-stone-600">Personalizá tus hojas para escribir, planificar, estudiar o dibujar. Cambiá el formato y descargá la plantilla sin registrarte.</p>
   <div className="mt-6 flex flex-wrap items-center gap-2.5">
    <button type="button" onClick={downloadPdf} className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"><FileText size={17}/> Descargar PDF</button>
    <button type="button" onClick={downloadPng} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm font-semibold hover:border-blue-600 disabled:opacity-60"><FileImage size={16}/>{busy?"Generando…":"PNG"}</button>
    <button type="button" onClick={downloadSvg} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm font-semibold hover:border-blue-600"><Download size={16}/> SVG</button>
   </div>
   <p className="mt-2 text-xs text-stone-500">Para PDF se abre la impresión del navegador; elegí «Guardar como PDF».</p>
   {notice&&<p role="alert" className="mt-3 text-sm text-red-700">{notice}</p>}
   <Link href={advanced} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-900 hover:underline">Opciones avanzadas del editor <ArrowRight size={16}/></Link>
  </div>
  <div className="min-w-0">
   <div className="relative rounded-xl bg-[#f4f1ea] px-4 pb-5 pt-8 sm:px-9 sm:pt-10" style={{backgroundImage:"linear-gradient(#ccd4df45 1px,transparent 1px),linear-gradient(90deg,#ccd4df45 1px,transparent 1px)",backgroundSize:"19px 19px"}}>
    <div className="mx-auto w-full max-w-[485px]">
     <div aria-hidden="true" className="mb-2 flex justify-between border-b border-stone-300 px-1 pb-1 text-[10px] text-stone-500"><span>0</span><span>50</span><span>100</span><span>150</span><span>200 mm</span></div>
     <div className="relative">
      <div aria-hidden="true" className="absolute -left-4 top-2 bottom-2 flex flex-col justify-between text-[9px] text-stone-500 sm:-left-8"><span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>250</span></div>
      <div className="mx-auto w-full overflow-hidden border border-stone-200 bg-white shadow-[7px_9px_0_#e1dcd2,0_18px_28px_#00000020]" style={{aspectRatio:art.w+"/"+art.h}}>
       <div aria-label={"Vista previa de "+chosen?.label+" en "+paper} role="img" className="h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{__html:art.svg}}/>
      </div>
     </div>
    </div>
   </div>
   <div aria-label="Opciones rápidas para personalizar el papel" className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-stone-200 bg-white p-2 shadow-sm sm:grid-cols-4">
    <label className="min-w-0"><span className="mb-1 flex items-center gap-1 text-xs text-stone-500"><Grid3X3 size={13}/> Tipo</span><select aria-label="Tipo de plantilla" className={selectClass} value={template} onChange={e=>setTemplate(e.target.value)}>{patterns.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
    <label className="min-w-0"><span className="mb-1 flex items-center gap-1 text-xs text-stone-500"><Ruler size={13}/> Separación</span><select aria-label="Separación de líneas en milímetros" className={selectClass} value={spacing} onChange={e=>setSpacing(Number(e.target.value))}>{[3,4,5,6.35,7,8,10,12,15].map(v=><option key={v} value={v}>{v} mm</option>)}</select></label>
    <label className="min-w-0"><span className="mb-1 flex items-center gap-1 text-xs text-stone-500"><SlidersHorizontal size={13}/> Papel</span><select aria-label="Tamaño de papel" className={selectClass} value={paper} onChange={e=>setPaper(e.target.value)}>{papers.map(p=><option key={p}>{p}</option>)}</select></label>
    <label className="min-w-0"><span className="mb-1 flex items-center gap-1 text-xs text-stone-500"><Palette size={13}/> Color</span><select aria-label="Color de líneas y cuadrícula" className={selectClass} value={ink} onChange={e=>setInk(e.target.value)}>{swatches.map(c=><option key={c.value} value={c.value}>{c.name}</option>)}</select></label>
   </div>
   <p className="sr-only" aria-live="polite">{chosen?.label}, {spacing} milímetros, papel {paper}, color {color?.name}</p>
  </div>
 </section>;
}
