import Link from "next/link";
import {ArrowRight,BookOpen,CalendarDays,Grid3X3,Layers,PenLine,Printer,Ruler} from "lucide-react";

const sections=[
 {title:"Planificadores",detail:"Planes diarios, semanales, mensuales y anuales con calendario automático.",icon:CalendarDays,href:"/plantillas?template=plan-semanal"},
 {title:"Escritura y notas",detail:"Papel rayado, cuadernos, guías de escritura y fichas.",icon:PenLine,href:"/plantillas?template=pautado"},
 {title:"Matemáticas y técnica",detail:"Cuadrículas, papel milimetrado, puntos y diagramas.",icon:Grid3X3,href:"/plantillas?template=cuadricula"},
 {title:"Práctica de letras",detail:"Hojas para repasar letras y palabras con líneas guía.",icon:BookOpen,href:"/plantillas?template=letter-tracing-worksheet"}
];
export default function InicioPlantillas(){
 return <main className="min-h-screen bg-[#faf9f6] text-[#282824]">
 <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#faf9f6]/95 backdrop-blur">
  <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
   <Link href="/plantillas/inicio" className="flex items-center gap-3 text-xl font-black"><span className="rounded bg-blue-800 px-2 py-1 text-sm text-white">L</span> LiaGo <span className="hidden text-xs font-normal text-stone-500 sm:inline">Plantillas imprimibles</span></Link>
   <nav aria-label="Navegación de plantillas" className="flex flex-wrap items-center gap-2 text-sm sm:gap-4">
    <Link href="/plantillas/inicio" aria-current="page" className="border-b-2 border-blue-800 px-2 py-2 font-semibold text-blue-900">Inicio</Link>
    <Link href="/plantillas?catalog=plantillas" className="px-2 py-2 hover:text-blue-800">Plantillas</Link>
    <Link href="/plantillas?catalog=variantes" className="px-2 py-2 hover:text-blue-800">Imprimibles</Link>
    <Link href="/plantillas" className="px-2 py-2 hover:text-blue-800">Editor</Link>
    <Link href="/plantillas?panel=paquete" className="flex items-center gap-2 rounded-lg border border-blue-800 px-3 py-2 font-semibold text-blue-900"><Layers size={16}/> Paquete de impresión</Link>
    <span className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">mm</span>
   </nav>
  </div>
 </header>
 <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 md:min-h-[610px] lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
  <div>
   <p className="mb-4 text-xs font-bold uppercase tracking-[.21em] text-blue-800">Editor de papel · Liago</p>
   <h1 className="max-w-lg font-serif text-5xl leading-[1.09] tracking-tight sm:text-6xl lg:text-7xl">Plantillas de papel imprimibles gratis</h1>
   <p className="mt-6 max-w-lg text-lg leading-8 text-stone-600">Elegí una plantilla, ajustá las medidas en milímetros, previsualizá el resultado y prepará tus hojas para imprimir.</p>
   <div className="mt-8 flex flex-wrap gap-3">
    <Link href="/plantillas?catalog=plantillas" className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white">Explorar plantillas <ArrowRight size={17}/></Link>
    <Link href="/plantillas" className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-3 font-semibold">Abrir editor</Link>
   </div>
   <p className="mt-8 text-sm text-stone-500">Una herramienta de Liago · Creado por <strong className="text-stone-700">Adrián Soto</strong>.</p>
  </div>
  <div className="relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-[#f1ede5] p-7 sm:min-h-[560px]" style={{backgroundImage:"linear-gradient(#c8ced033 1px, transparent 1px),linear-gradient(90deg,#c8ced033 1px, transparent 1px)",backgroundSize:"20px 20px"}}>
   <div className="relative w-full max-w-[420px]">
    <div className="mb-2 flex justify-between pl-5 text-[10px] text-stone-400"><span>0</span><span>50</span><span>100</span><span>150</span><span>200 mm</span></div>
    <div className="relative aspect-[210/297] w-full border border-stone-300 bg-white p-[9%] shadow-[10px_12px_0_#d8d2c8,0_20px_44px_#00000020]">
     <div className="h-full w-full" style={{backgroundImage:"radial-gradient(circle,#ab9889 0.75px,transparent 0.95px)",backgroundSize:"14px 14px"}}/>
     <p className="absolute inset-x-0 bottom-4 text-center text-[10px] tracking-widest text-stone-300">Liago</p>
    </div>
    <div className="absolute -left-5 top-8 flex h-[70%] flex-col justify-between text-[10px] text-stone-400"><span>0</span><span>50</span><span>100</span><span>150</span><span>200 mm</span></div>
   </div>
  </div>
 </section>
 <section className="border-t border-stone-200 bg-white py-14">
  <div className="mx-auto max-w-7xl px-6">
   <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs uppercase tracking-widest text-blue-800">Catálogo</p><h2 className="font-serif text-3xl">Encontrá tu próxima plantilla</h2></div><Link href="/plantillas?catalog=plantillas" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-900">Ver todo <ArrowRight size={15}/></Link></div>
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{sections.map(item=><Link key={item.title} href={item.href} className="group rounded-xl border border-stone-200 p-5 transition hover:border-blue-500 hover:shadow-md"><item.icon className="mb-5 h-7 w-7 text-blue-900"/><h3 className="font-serif text-xl">{item.title}</h3><p className="mt-2 text-sm leading-6 text-stone-600">{item.detail}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-900">Abrir <ArrowRight size={14}/></span></Link>)}</div>
  </div>
 </section>
 <section className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-12"><div><h2 className="font-serif text-2xl">Prepará un paquete de impresión</h2><p className="mt-2 text-sm text-stone-500">Combiná varias hojas y guardalas como PDF desde el navegador.</p></div><Link href="/plantillas?panel=paquete" className="inline-flex items-center gap-2 rounded-lg border border-blue-900 px-5 py-3 font-semibold text-blue-900"><Printer size={17}/> Ir al paquete</Link></section>
 <footer className="border-t border-stone-200 px-6 py-7 text-center text-sm text-stone-500">Liago · Creado por Adrián Soto · Medidas en milímetros</footer>
 </main>;
}
