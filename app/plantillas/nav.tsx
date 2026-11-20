"use client";
import Link from "next/link";
import {ArrowLeft,Layers} from "lucide-react";
type Active="inicio"|"plantillas"|"imprimibles"|"editor";
export default function PlantillasNav({active,packageCount}:{active:Active;packageCount?:number}){
 const links=[{id:"inicio",label:"Inicio",href:"/plantillas/inicio"},{id:"plantillas",label:"Plantillas",href:"/plantillas/catalogo"},{id:"imprimibles",label:"Imprimibles",href:"/plantillas/imprimibles"},{id:"editor",label:"Editor",href:"/plantillas"}] as const;
 return <header className="sticky top-0 z-30 border-b border-[#e8e3da] bg-[#faf9f6]/95 backdrop-blur">
 <div className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-7">
 <Link href="/plantillas/inicio" className="flex shrink-0 items-center gap-3 text-xl font-semibold"><span className="flex flex-col gap-1"><span className="block h-[4px] w-7 bg-stone-900"/><span className="block h-[4px] w-5 bg-blue-900"/></span><span className="font-serif text-[27px] tracking-tight">Liago</span></Link>
 <nav aria-label="Navegación de plantillas" className="flex flex-wrap items-center gap-1.5 text-sm sm:gap-3">
 {links.map(item=><Link key={item.id} href={item.href} aria-current={active===item.id?"page":undefined} className={`border-b-2 px-2 py-2.5 transition hover:text-blue-900 ${active===item.id?"border-blue-900 font-semibold text-blue-900":"border-transparent"}`}>{item.label}</Link>)}
 <Link href="/plantillas?panel=paquete" className="ml-1 inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 font-medium hover:border-blue-800"><Layers size={17}/><span className="hidden sm:inline">Paquete de impresión</span><span className="rounded bg-[#ede9e0] px-2 py-0.5 text-xs">{packageCount??0}</span></Link>
 <Link href="/" title="Ir a Liago principal" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-blue-800 hover:text-blue-900"><ArrowLeft size={15}/> Liago principal</Link>
 <span className="ml-1 rounded-lg border border-stone-200 bg-[#eeeae1] px-3 py-2 text-xs font-semibold">MM</span>
 </nav>
 </div></header>
}