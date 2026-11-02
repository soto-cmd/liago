"use client";

import {useEffect,useState} from "react";
import {ChevronLeft,ChevronRight,ImageOff,Maximize2,X} from "lucide-react";

export function ProductGallery({images,title}:{images:string[];title:string}){
 const photos=Array.from(new Set(images.filter(x=>typeof x==="string"&&/^https?:\/\//i.test(x)))).slice(0,6);
 const [index,setIndex]=useState(0);
 const [zoom,setZoom]=useState(false);
 useEffect(()=>{if(!zoom)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setZoom(false);if(e.key==="ArrowRight")setIndex(x=>(x+1)%Math.max(photos.length,1));if(e.key==="ArrowLeft")setIndex(x=>(x+photos.length-1)%Math.max(photos.length,1));};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[zoom,photos.length]);
 const previous=()=>setIndex(x=>(x+photos.length-1)%photos.length);
 const next=()=>setIndex(x=>(x+1)%photos.length);
 return <div className="space-y-3">
  <div className="relative aspect-square overflow-hidden rounded-2xl border bg-white shadow-sm">
   {photos.length?<button type="button" onClick={()=>setZoom(true)} aria-label="Ampliar fotografía" className="group h-full w-full"><img src={photos[index]} alt={`${title} · fotografía ${index+1}`} className="h-full w-full object-contain"/><span className="absolute right-3 top-3 rounded-lg bg-white/90 p-2 text-slate-700"><Maximize2 className="h-4 w-4"/></span></button>:<div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400"><ImageOff className="h-12 w-12"/> Imagen no disponible</div>}
   {photos.length>1?<><button type="button" onClick={previous} aria-label="Fotografía anterior" className="absolute left-3 top-1/2 rounded-full bg-white/90 p-2 shadow"><ChevronLeft className="h-5 w-5"/></button><button type="button" onClick={next} aria-label="Fotografía siguiente" className="absolute right-3 top-1/2 rounded-full bg-white/90 p-2 shadow"><ChevronRight className="h-5 w-5"/></button></>:null}
  </div>
  {photos.length>1?<div className="flex gap-2 overflow-x-auto pb-1">{photos.map((photo,i)=><button key={photo} type="button" onClick={()=>setIndex(i)} aria-label={`Ver fotografía ${i+1}`} aria-pressed={index===i} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${index===i?"border-blue-600":"border-slate-200"}`}><img src={photo} alt="" className="h-full w-full object-cover"/></button>)}</div>:null}
  {zoom&&photos.length?<div role="dialog" aria-modal="true" aria-label={`Galería de ${title}`} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onClick={()=>setZoom(false)}>
   <button autoFocus type="button" onClick={()=>setZoom(false)} aria-label="Cerrar fotografía ampliada" className="absolute right-4 top-4 rounded-full bg-white p-3 text-slate-950"><X className="h-5 w-5"/></button>
   {photos.length>1?<button type="button" onClick={e=>{e.stopPropagation();previous()}} aria-label="Anterior" className="absolute left-2 z-10 rounded-full bg-white/90 p-2 text-slate-950"><ChevronLeft/></button>:null}
   <img src={photos[index]} alt={`${title} · fotografía ampliada ${index+1}`} className="max-h-[85vh] max-w-full object-contain" onClick={e=>e.stopPropagation()}/>
   {photos.length>1?<button type="button" onClick={e=>{e.stopPropagation();next()}} aria-label="Siguiente" className="absolute right-2 z-10 rounded-full bg-white/90 p-2 text-slate-950"><ChevronRight/></button>:null}
   <div className="absolute bottom-4 text-xs text-white">{index+1} / {photos.length}</div>
  </div>:null}
 </div>;
}
