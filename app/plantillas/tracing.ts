export type TraceSettings = {
 traceInput?: string;
 traceMode?: "uppercase" | "lowercase" | "both" | "word";
 traceSize?: "large" | "medium" | "small";
 dashedCopies?: "full" | "half" | "one" | "none";
 traceFont?: "rounded" | "print";
 showNameLine?: boolean;
 showDateLine?: boolean;
 showFooterMark?: boolean;
};
const escapeXml=(value:string)=>value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[char]||char));
const pos=(value:number)=>Number(value.toFixed(2));
export function makeTracingSvg(settings:TraceSettings & {heading:string;ink:string;background:string;margin:number;paper:string;landscape:boolean}, w:number,h:number):string {
 const m=Math.max(7,Math.min(35,settings.margin)),right=w-m,bottom=h-m;
 const color=settings.ink;
 const input=(settings.traceInput||"A").trim().slice(0,26)||"A";
 const mode=settings.traceMode||"both";
 const text=mode==="uppercase"?input[0].toLocaleUpperCase("es"):mode==="lowercase"?input[0].toLocaleLowerCase("es"):mode==="both"?input[0].toLocaleUpperCase("es")+input[0].toLocaleLowerCase("es"):input;
 const rowHeight=settings.traceSize==="large"?28:settings.traceSize==="small"?17:22;
 const fontSize=settings.traceSize==="large"?18:settings.traceSize==="small"?10.5:14;
 const font=settings.traceFont==="print"?"Arial,Helvetica,sans-serif":"Trebuchet MS,Arial,sans-serif";
 const line=(x1:number,y1:number,x2:number,y2:number,stroke="#aab3c0",width=.2,dash="")=>`<line x1="${pos(x1)}" y1="${pos(y1)}" x2="${pos(x2)}" y2="${pos(y2)}" stroke="${stroke}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:""}/>`;
 const label=(value:string,x:number,y:number,size=3.4,stroke=color)=>`<text x="${pos(x)}" y="${pos(y)}" fill="${stroke}" font-size="${size}" font-family="Arial,sans-serif">${escapeXml(value)}</text>`;
 let content=`<rect width="${w}" height="${h}" fill="${settings.background}"/>`;
 const title=(settings.heading.trim()||"PRÁCTICA DE TRAZADO DE LETRAS").slice(0,58);
 content+=label(title.toLocaleUpperCase("es"),m,m+5,5.3);
 content+=line(m,m+9,right,m+9,color,.45);
 let top=m+17;
 const name=settings.showNameLine!==false,date=settings.showDateLine!==false;
 if(name){content+=label("Nombre:",m,top,3.4)+line(m+17,top+1,m+(right-m)*.58,top+1);}
 if(date){content+=label("Fecha:",m+(right-m)*.66,top,3.4)+line(m+(right-m)*.79,top+1,right,top+1);}
 if(name||date)top+=12;
 const gap=7, limit=bottom-(settings.showFooterMark===false?2:10);
 const nRows=Math.max(1,Math.floor((limit-top)/(rowHeight+gap)));
 const copies=settings.dashedCopies||"half";
 for(let row=0;row<nRows;row++){
   const y=top+row*(rowHeight+gap),base=y+rowHeight*.78,half=y+rowHeight*.43,asc=y+rowHeight*.1;
   if(base>limit)break;
   content+=line(m,asc,right,asc,"#cbd5e1",.23);
   content+=line(m,half,right,half,"#b8c3d1",.18,"1 1.3");
   content+=line(m,base,right,base,"#94a3b8",.33);
   content+=line(m,y+rowHeight*.96,right,y+rowHeight*.96,"#d4dae3",.17);
   const textWidth=Math.min((right-m)*.42,Math.max(fontSize*.58,text.length*fontSize*.67));
   const cell=Math.max(12,textWidth+5);
   const available=Math.max(0,Math.floor((right-m-4)/cell)-1);
   const count=copies==="none"?0:copies==="one"?1:copies==="half"?Math.max(1,Math.floor(available/2)):available;
   const mainY=base-1;
   const textStyle=`font-family=${JSON.stringify(font)} font-size="${fontSize}" font-weight="600"`;
   content+=`<text x="${pos(m+2)}" y="${pos(mainY)}" fill="${color}" ${textStyle}>${escapeXml(text)}</text>`;
   for(let i=0;i<count;i++){
     const xx=m+2+cell*(i+1);
     if(xx+textWidth>right)break;
     content+=`<text x="${pos(xx)}" y="${pos(mainY)}" fill="none" stroke="#98a5b4" stroke-width=".55" stroke-dasharray="1.3 1.5" stroke-linecap="round" stroke-linejoin="round" ${textStyle}>${escapeXml(text)}</text>`;
   }
 }
 if(settings.showFooterMark!==false){
   content+=line(m,h-10,right,h-10,"#e2e8f0",.16);
   content+=`<text x="${w/2}" y="${pos(h-5.8)}" fill="#a6adb7" font-family="Arial,sans-serif" text-anchor="middle" font-size="2.9" letter-spacing=".55">Creado con LiaGo · liago.vercel.app</text>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">${content}</svg>`;
}
