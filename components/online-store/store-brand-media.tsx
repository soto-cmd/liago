"use client";
import {ChangeEvent,useState} from "react";
import {ImagePlus,LoaderCircle} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

async function compress(file:File):Promise<Blob>{
 const bitmap=await createImageBitmap(file);
 try{
  let width=bitmap.width,height=bitmap.height;
  const ratio=Math.min(1,1300/Math.max(width,height));
  width=Math.max(1,Math.round(width*ratio));height=Math.max(1,Math.round(height*ratio));
  const canvas=document.createElement("canvas");
  for(let attempt=0;attempt<10;attempt++){
   canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext("2d");
   if(!ctx)throw Error("No se pudo procesar la imagen.");
   ctx.drawImage(bitmap,0,0,width,height);
   const image=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",Math.max(.46,.82-attempt*.04)));
   if(!image||image.type!=="image/webp")throw Error("Tu navegador no permite comprimir esta imagen.");
   if(image.size<=245000)return image;
   width=Math.max(240,Math.round(width*.82));height=Math.max(240,Math.round(height*.82));
  }
  throw Error("La imagen es demasiado pesada después de comprimirla.");
 }finally{bitmap.close?.();}
}
type Kind="logo"|"banner";
export function StoreBrandMedia({organizationId,initialLogo,initialBanner}:{organizationId:string;initialLogo:string;initialBanner:string}){
 const [logo,setLogo]=useState(initialLogo);
 const [banner,setBanner]=useState(initialBanner);
 const [busy,setBusy]=useState<Kind|null>(null);
 const [notice,setNotice]=useState("");
 async function upload(kind:Kind,event:ChangeEvent<HTMLInputElement>){
  const input=event.target;const file=input.files?.[0];
  if(!file)return;
  setBusy(kind);setNotice("");
  try{
   if(!file.type.startsWith("image/")||file.size>25*1024*1024)throw Error("Elegí una imagen válida de hasta 25 MB.");
   const image=await compress(file);
   const db=createClient();const path=`${organizationId}/marca/${kind}.webp`;
   const {error}=await db.storage.from("liago-store-media").upload(path,image,{contentType:"image/webp",cacheControl:"60",upsert:true});
   if(error)throw Error("No se pudo subir la imagen: "+error.message);
   const {data}=db.storage.from("liago-store-media").getPublicUrl(path);
   if(kind==="logo")setLogo(data.publicUrl);else setBanner(data.publicUrl);
   setNotice("Imagen optimizada y cargada. Guardá la configuración para aplicar el cambio.");
  }catch(e){setNotice(e instanceof Error?e.message:"Error al subir la imagen.");}
  finally{setBusy(null);input.value="";}
 }
 function editor(kind:Kind,url:string,setUrl:(v:string)=>void,label:string){
  return <div className="space-y-2">
   <label className="block text-xs font-bold text-slate-600">{label} (URL)<input type="url" name={kind==="logo"?"logo_url":"banner_url"} value={url} onChange={e=>setUrl(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm"/></label>
   {url?<img src={url} alt={label} className={kind==="logo"?"h-20 w-20 rounded-lg border object-contain":"h-20 w-full rounded-lg border object-cover"}/>:null}
   <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100">
    {busy===kind?<LoaderCircle className="h-4 w-4 animate-spin"/>:<ImagePlus className="h-4 w-4"/>}
    {busy===kind?"Optimizando...":"Subir "+label.toLowerCase()}
    <input type="file" accept="image/*" disabled={Boolean(busy)} className="sr-only" onChange={e=>upload(kind,e)}/>
   </label>
  </div>;
 }
 return <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
  {editor("logo",logo,setLogo,"Logo")}
  {editor("banner",banner,setBanner,"Portada")}
  <p className="text-[11px] text-slate-500 sm:col-span-2">Las imágenes se comprimen a WebP (máximo 245 KB por archivo) y reemplazan la versión anterior para evitar consumos innecesarios.</p>
  {notice?<p role="status" className="text-xs font-bold text-blue-700 sm:col-span-2">{notice}</p>:null}
 </div>;
}
