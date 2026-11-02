"use client";
import {useState} from "react";
import {Share2} from "lucide-react";

export function ShareProductButton({title}:{title:string}) {
 const [message,setMessage]=useState("");
 async function share() {
  try {
   if(navigator.share){await navigator.share({title,url:window.location.href});return;}
   await navigator.clipboard.writeText(window.location.href);
   setMessage("Enlace copiado");
  } catch {setMessage("Copiá el enlace desde la barra del navegador.");}
 }
 return <div className="flex flex-col gap-1"><button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-xl border bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Share2 className="h-4 w-4"/> Compartir</button>{message?<span role="status" className="text-xs text-blue-700">{message}</span>:null}</div>;
}
