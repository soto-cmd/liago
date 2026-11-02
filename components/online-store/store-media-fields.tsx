"use client";

import {ChangeEvent,useState} from "react";
import {ImagePlus,LoaderCircle,X} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

async function compressImage(file:File):Promise<Blob> {
 const bitmap=await createImageBitmap(file);
 try {
  let width=bitmap.width,height=bitmap.height;
  const scale=Math.min(1,1100/Math.max(width,height));
  width=Math.max(1,Math.round(width*scale));
  height=Math.max(1,Math.round(height*scale));
  const canvas=document.createElement("canvas");
  for(let attempt=0;attempt<10;attempt++){
   canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext("2d");
   if(!ctx)throw Error("No se puede procesar la imagen.");
   ctx.drawImage(bitmap,0,0,width,height);
   const quality=Math.max(0.48,0.82-attempt*.045);
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",quality));
   if(!blob||blob.type!=="image/webp")throw Error("El navegador no permite comprimir a WebP.");
   if(blob.size<=245000)return blob;
   width=Math.max(240,Math.round(width*.82));
   height=Math.max(240,Math.round(height*.82));
  }
  throw Error("La foto sigue siendo pesada. Probá otra fotografía.");
 }finally{bitmap.close?.();}
}
function parsePhotos(main:string,extra:string){
 return [main,...extra.split(/\r?\n/)].map(s=>s.trim()).filter(Boolean).slice(0,6);
}
export function StoreMediaFields({organizationId,itemId,initialMain,initialExtra}:{organizationId:string;itemId:string;initialMain:string;initialExtra:string}){
 const [main,setMain]=useState(initialMain);
 const [extra,setExtra]=useState(initialExtra);
 const [uploading,setUploading]=useState(false);
 const [notice,setNotice]=useState("");
 const photos=parsePhotos(main,extra);
 async function upload(event:ChangeEvent<HTMLInputElement>){
  const input=event.target;
  const files=Array.from(input.files||[]);
  if(!files.length)return;
  const slots=Math.max(0,6-photos.length);
  if(files.length>slots){setNotice(`Podés agregar ${slots} foto(s) más. Quitá alguna para liberar espacio.`);input.value="";return;}
  setUploading(true);setNotice("");
  const db=createClient();
  let next=[...photos];
  try{
   for(const file of files){
    if(!file.type.startsWith("image/"))throw Error("Seleccioná archivos de imagen.");
    if(file.size>25*1024*1024)throw Error("La foto original supera los 25 MB.");
    const compressed=await compressImage(file);
    const slot=next.length+1;
    const path=`${organizationId}/${itemId}/foto-${slot}.webp`;
    const {error}=await db.storage.from("liago-store-media").upload(path,compressed,{contentType:"image/webp",cacheControl:"60",upsert:true});
    if(error)throw Error("No se pudo subir: "+error.message);
    const {data}=db.storage.from("liago-store-media").getPublicUrl(path);
    next.push(data.publicUrl);
    setMain(next[0]||"");
    setExtra(next.slice(1).join("\n"));
   }
   setNotice(`${files.length} fotografía(s) optimizada(s) y cargada(s). Guardá el artículo para publicar los cambios.`);
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo subir la fotografía.")}
  finally{input.value="";setUploading(false);}
 }
 function removePhoto(index:number){
  const next=photos.filter((_,i)=>i!==index);
  setMain(next[0]||"");setExtra(next.slice(1).join("\n"));
  setNotice("Fotografía quitada del formulario. Guardá el artículo para aplicar el cambio.");
 }
 return <div className="space-y-3 sm:col-span-2">
  <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold text-slate-700">Fotografías del producto (máximo 6)</span><span className="text-[11px] text-slate-500">{photos.length}/6</span></div>
  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-3 py-4 text-sm font-bold text-blue-700 hover:bg-blue-100">
   {uploading?<LoaderCircle className="h-5 w-5 animate-spin"/>:<ImagePlus className="h-5 w-5"/>}
   {uploading?"Optimizando y subiendo fotografías...":"Elegir fotografías del dispositivo"}
   <input type="file" accept="image/*" multiple disabled={uploading||photos.length>=6} onChange={upload} className="sr-only"/>
  </label>
  <p className="text-[11px] text-slate-500">Cada fotografía se comprime automáticamente a WebP antes de subirla. Máximo 245 KB por fotografía. Evitá repetir cargas innecesarias.</p>
  {photos.length?<div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{photos.map((src,i)=><div key={src+i} className="relative aspect-square overflow-hidden rounded-lg border bg-slate-100"><img src={src} alt={`Foto ${i+1}`} className="h-full w-full object-cover"/><button type="button" onClick={()=>removePhoto(i)} aria-label={`Quitar fotografía ${i+1}`} className="absolute right-1 top-1 rounded-full bg-white p-1 text-red-700 shadow"><X className="h-3 w-3"/></button></div>)}</div>:null}
  <label className="block text-xs font-semibold text-slate-600">Fotografía principal (URL, opcional)<input type="url" name="image_url" value={main} onChange={e=>setMain(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
  <label className="block text-xs font-semibold text-slate-600">Otras fotografías (una URL por línea)<textarea name="images" value={extra} onChange={e=>setExtra(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border p-2 text-sm"/></label>
  {notice?<p role="status" className="text-xs font-semibold text-blue-700">{notice}</p>:null}
 </div>;
}
