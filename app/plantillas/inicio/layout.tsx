import type {Metadata} from "next";

const pageUrl="https://liago.vercel.app/plantillas/inicio";
const imageUrl=pageUrl+"/opengraph-image";

export const metadata:Metadata={
 title:"Liago · Plantillas de papel imprimibles gratis",
 description:"Creá y descargá gratis plantillas de papel, planificadores diarios y semanales, calendarios y hojas de escritura. Una herramienta de Adrián Soto.",
 alternates:{canonical:pageUrl},
 openGraph:{
  title:"Liago · Plantillas imprimibles gratis",
  description:"Planificadores, calendarios, escritura y más. Creado por Adrián Soto.",
  url:pageUrl,
  siteName:"Liago",
  type:"website",
  locale:"es_PY",
  images:[{url:imageUrl,width:1200,height:630,alt:"Liago · Plantillas imprimibles gratis"}]
 },
 twitter:{
  card:"summary_large_image",
  title:"Liago · Plantillas imprimibles gratis",
  description:"Plantillas para imprimir gratis. Creado por Adrián Soto.",
  images:[imageUrl]
 }
};
export default function Layout({children}:{children:React.ReactNode}){return children}
