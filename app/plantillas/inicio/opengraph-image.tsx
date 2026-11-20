import {ImageResponse} from "next/og";

export const alt="LiaGo · Plantillas imprimibles gratis";
export const size={width:1200,height:630};
export const contentType="image/png";

export default function OpenGraphImage(){
 return new ImageResponse(
  <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",background:"#f9f8f5",padding:"66px 78px",fontFamily:"Arial, sans-serif",color:"#172236"}}>
   <div style={{display:"flex",alignItems:"center",gap:24}}>
    <div style={{width:90,height:90,background:"#1e40af",borderRadius:19,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:62,fontWeight:800}}>L</div>
    <div style={{display:"flex",flexDirection:"column"}}>
     <div style={{fontSize:56,fontWeight:800,letterSpacing:-2}}>LiaGo</div>
     <div style={{fontSize:22,color:"#64748b"}}>Una herramienta de Adrián Soto</div>
    </div>
   </div>
   <div style={{display:"flex",flexDirection:"column",gap:20,maxWidth:1000}}>
    <div style={{fontSize:64,fontWeight:800,lineHeight:1.08,letterSpacing:-2}}>Plantillas de papel imprimibles gratis</div>
    <div style={{fontSize:28,lineHeight:1.3,color:"#475569"}}>Planificadores, calendarios, escritura, matemáticas y mucho más.</div>
   </div>
   <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:24,borderTop:"2px solid #e2e8f0",fontSize:23,color:"#64748b"}}>
    <span>Creado por Adrián Soto</span><span>liago.vercel.app/plantillas/inicio</span>
   </div>
  </div>,
  size
 );
}
