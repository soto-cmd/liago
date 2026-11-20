import Link from "next/link";
import PlantillasNav from "../nav";
import {ArrowRight,BookOpen,CalendarDays,Grid3X3,Mail,MessageCircle,PenLine,Printer} from "lucide-react";

const sections=[
 {title:"Planificadores",detail:"Planes diarios, semanales, mensuales y anuales con calendario automático.",icon:CalendarDays,href:"/plantillas?template=plan-semanal"},
 {title:"Escritura y notas",detail:"Papel rayado, cuadernos, guías de escritura y fichas.",icon:PenLine,href:"/plantillas?template=pautado"},
 {title:"Matemáticas y técnica",detail:"Cuadrículas, papel milimetrado, puntos y diagramas.",icon:Grid3X3,href:"/plantillas?template=cuadricula"},
 {title:"Práctica de letras",detail:"Hojas para repasar letras y palabras con líneas guía.",icon:BookOpen,href:"/plantillas?template=letter-tracing-worksheet"}
];
export default function InicioPlantillas(){
 return <main className="min-h-screen bg-[#faf9f6] text-[#282824]">
 <PlantillasNav active="inicio"/>
 <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 md:min-h-[610px] lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
  <div>
   <p className="mb-4 text-xs font-bold uppercase tracking-[.21em] text-blue-800">Editor de papel · Liago</p>
   <h1 className="max-w-lg font-serif text-5xl leading-[1.09] tracking-tight sm:text-6xl lg:text-7xl">Plantillas de papel imprimibles gratis</h1>
   <p className="mt-6 max-w-lg text-lg leading-8 text-stone-600">Elegí una plantilla, ajustá las medidas en milímetros, previsualizá el resultado y prepará tus hojas para imprimir.</p>
   <div className="mt-8 flex flex-wrap gap-3">
    <Link href="/plantillas/catalogo" className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white">Explorar plantillas <ArrowRight size={17}/></Link>
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
   <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs uppercase tracking-widest text-blue-800">Catálogo</p><h2 className="font-serif text-3xl">Encontrá tu próxima plantilla</h2></div><Link href="/plantillas/catalogo" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-900">Ver todo <ArrowRight size={15}/></Link></div>
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{sections.map(item=><Link key={item.title} href={item.href} className="group rounded-xl border border-stone-200 p-5 transition hover:border-blue-500 hover:shadow-md"><item.icon className="mb-5 h-7 w-7 text-blue-900"/><h3 className="font-serif text-xl">{item.title}</h3><p className="mt-2 text-sm leading-6 text-stone-600">{item.detail}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-900">Abrir <ArrowRight size={14}/></span></Link>)}</div>
  </div>
 </section>
 <section className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-6 py-12"><div><h2 className="font-serif text-2xl">Prepará un paquete de impresión</h2><p className="mt-2 text-sm text-stone-500">Combiná varias hojas y guardalas como PDF desde el navegador.</p></div><Link href="/plantillas?panel=paquete" className="inline-flex items-center gap-2 rounded-lg border border-blue-900 px-5 py-3 font-semibold text-blue-900"><Printer size={17}/> Ir al paquete</Link></section>
 <section id="solicitar-plantilla" className="border-t border-stone-200 bg-white py-14">
 <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_auto] lg:items-center">
  <div>
   <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-900">Contacto y sugerencias</p>
   <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">¿Necesitás una plantilla que todavía no tenemos?</h2>
   <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">Podés solicitar nuevas plantillas imprimibles gratuitamente o compartir ideas para mejorar las existentes. Contame qué tipo de hoja necesitás y para qué la vas a utilizar.</p>
   <p className="mt-4 text-sm text-stone-600">Contacto directo con <strong className="text-stone-800">Adrián Soto</strong>, creador de Liago.</p>
  </div>
  <div className="flex w-full flex-col gap-3 sm:w-auto">
   <a href="https://wa.me/595971643485?text=Hola%20Adri%C3%A1n%2C%20quisiera%20solicitar%20una%20nueva%20plantilla%20para%20Liago." target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"><MessageCircle size={18}/> Solicitar por WhatsApp</a>
   <a href="mailto:l.adrian.soto@gmail.com?subject=Solicitud%20de%20plantilla%20-%20Liago" className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-800 hover:border-blue-900"><Mail size={18}/> Solicitar por correo</a>
   <p className="text-center text-xs text-stone-500">WhatsApp: 0971 643 485</p>
   <p className="text-center text-xs text-stone-500">l.adrian.soto@gmail.com</p>
  </div>
 </div></section>
 <footer className="border-t border-stone-200 px-6 py-7 text-center text-sm text-stone-500">Liago · Creado por Adrián Soto · Medidas en milímetros</footer>
 </main>;
}
