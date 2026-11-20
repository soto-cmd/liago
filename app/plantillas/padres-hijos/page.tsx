import type {Metadata} from "next";
import FamilyCatalog from "../family-catalog";
export const metadata:Metadata={
 title:"Padres e hijos | Plantillas gratuitas de Liago",
 description:"Actividades imprimibles gratuitas para practicar nombres, letras, números y rutinas familiares. Editá y guardá como PDF sin registrarte.",
 alternates:{canonical:"https://liago.vercel.app/plantillas/padres-hijos"}
};
export default function PadresEHijosPage(){return <FamilyCatalog/>;}
