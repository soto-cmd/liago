// Three printable layouts adapted to Liago's vector paper engine.
export type PlannerKind="daily"|"project"|"habit";
export type PlannerSettings={
 heading:string;ink:string;background:string;calendarDate?:string;calendarAuto?:boolean;
 date?:string;habitNames?:string[];
};
const escapeText=(text:string)=>text.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));
const decimal=(number:number)=>Math.round(number*100)/100;
const MONTHS=["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
const DAYS=["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
function selectedDate(s:PlannerSettings){const v=s.calendarDate;const m=s.calendarAuto===false&&v?/^(\d{4})-(\d{2})-(\d{2})$/.exec(v):null;if(!m)return new Date();const year=+m[1],month=+m[2],day=+m[3];if(year<1900||year>2100||month<1||month>12)return new Date();return new Date(year,month-1,Math.min(day,new Date(year,month,0).getDate()));}
export function renderPlanner(kind:PlannerKind,s:PlannerSettings,w:number,h:number):string {
 const ink=s.ink||"#253047",background=s.background||"#fff",date=selectedDate(s),dateTitle=`${DAYS[date.getDay()]}, ${date.getDate()} DE ${MONTHS[date.getMonth()]} DE ${date.getFullYear()}`;
 let lines="";
 const line=(x1:number,y1:number,x2:number,y2:number,weight=.24,color=ink)=>{lines+=`<line x1="${decimal(x1)}" y1="${decimal(y1)}" x2="${decimal(x2)}" y2="${decimal(y2)}" stroke="${color}" stroke-width="${weight}"/>`};
 const box=(x:number,y:number,bw:number,bh:number,fill="none",radius=0,weight=.2)=>{lines+=`<rect x="${decimal(x)}" y="${decimal(y)}" width="${decimal(bw)}" height="${decimal(bh)}" rx="${radius}" fill="${fill}" stroke="${fill==="none"?ink:fill}" stroke-width="${weight}"/>`};
 const text=(t:string,x:number,y:number,size=2.5,bold=false,anchor="start",color=ink)=>{lines+=`<text x="${decimal(x)}" y="${decimal(y)}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${bold?"700":"400"}" text-anchor="${anchor}" fill="${color}">${escapeText(t)}</text>`};
 const rows=(x:number,y:number,length:number,count:number,gap:number)=>{for(let i=0;i<count;i++)line(x,y+i*gap,x+length,y+i*gap,.18,"#7b8796")};
 const circle=(cx:number,cy:number,r=2.5)=>{lines+=`<circle cx="${decimal(cx)}" cy="${decimal(cy)}" r="${r}" fill="none" stroke="${ink}" stroke-width=".23"/>`};
 const check=(x:number,y:number)=>box(x,y-2,2.4,2.4,"none",0,.18);
 const title=kind==="daily"?"PLAN DIARIO":kind==="project"?"PLAN DE PROYECTO":"REGISTRO DE HÁBITOS";
 text((s.heading||title).toUpperCase().slice(0,44),13,19,6.1,true);
 if(kind!=="project")text(kind==="daily"?dateTitle:`${MONTHS[date.getMonth()]} ${date.getFullYear()}`,197,18,2.9,false,"end");
 line(13,24,197,24,.52);
 if(kind==="daily"){
   box(13,31,184,17,"#f0f1f3",1);
   text("ENFOQUE",17,36,2.65,true);text("Lo más importante de hoy",17,43,2.8);
   const mid=112,top=57,bottom=250;
   text("HORARIO",13,54,2.65,true);text("TOP 3",mid+4,54,2.65,true);
   for(let hour=7;hour<=20;hour++){
     const y=top+(hour-7)*14.4;
     text(String(hour).padStart(2,"0")+":00",14,y+2.3,2.65);
     line(26,y,107,y,.2,"#788493");
   }
   line(26,top,26,top+13*14.4,.25);
   for(let i=0;i<3;i++){const y=62+i*11; text(String(i+1)+".",mid+4,y,2.8);line(mid+12,y,197,y,.18)}
   text("TAREAS",mid+4,96,2.65,true);
   for(let i=0;i<8;i++){const y=103+i*10.5;check(mid+4,y);line(mid+11,y,197,y,.18,"#7b8796")}
   text("NOTAS",mid+4,198,2.65,true);rows(mid+4,208,81,5,10.2);
   line(13,255,197,255,.35);text("REFLEXIÓN",13,262,2.8,true);
   ["LOGRO","APRENDIZAJE","TRASLADAR"].forEach((label,i)=>{const x=13+i*63;text(label,x,269,2.7,true);line(x,279,x+57,279,.18)});
 }else if(kind==="project"){
   const labels=["RESPONSABLE","INICIO","OBJETIVO","PRESUPUESTO","REAL"];
   labels.forEach((label,i)=>{const x=13+i*37;text(label,x,34,2.45,true);line(x,45,x+32,45,.22)});
   box(13,54,89,27,"#f1f2f3",1);box(108,54,89,27,"#f1f2f3",1);
   text("RESULTADO DESEADO",17,61,2.65,true);text("¿Qué habrá cambiado al terminar este proyecto?",17,69,2.6);line(17,76,98,76,.18);
   text("MEDIDA DE ÉXITO",112,61,2.65,true);text("¿Cómo se medirá el éxito?",112,69,2.6);line(112,76,193,76,.18);
   text("HITOS",13,91,2.8,true);line(22,109,188,109,.33);
   for(let i=0;i<4;i++){const x=22+i*55.33;circle(x,109,3.2);text(String(i+1),x,110.2,3,true,"middle");rows(x-11,123,22,2,8)}
   text("PRÓXIMAS ACCIONES",13,151,2.7,true);text("RESPONSABLE",89,151,2.45,true);text("OBJETIVO",122,151,2.45,true);text("RIESGOS Y BLOQUEOS",155,151,2.3,true);
   for(let i=0;i<7;i++){const y=162+i*12;check(13,y);line(20,y,82,y,.19,"#718096");line(88,y,116,y,.19,"#718096");line(121,y,149,y,.19,"#718096");line(154,y,197,y,.19,"#718096")}
   text("RECURSOS",155,239,2.5,true);rows(155,247,42,3,7);
   line(13,258,197,258,.35);text("DECISIONES Y NOTAS",13,264,2.7,true);rows(13,273,184,2,7);
 }else{
   const titles=s.habitNames?.length?s.habitNames.slice(0,5):["LECTURA","MOVIMIENTO","TRABAJO CONCENTRADO","REFLEXIÓN","HIDRATACIÓN"];
   const days=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
   for(let i=0;i<5;i++){
     const top=34+i*44.4; text((titles[i]||`HÁBITO ${i+1}`).toUpperCase().slice(0,48),13,top,2.9,true);
     line(13,top+5,197,top+5,.22,"#7b8796");
     for(let d=1;d<=days;d++){
       const row=d<=16?0:1,index=d<=16?d-1:d-17;
       const cx=19+index*11.55,cy=top+16+row*13;
       circle(cx,cy,2.55);text(String(d),cx,cy+.95,d>=10?2.25:2.5,false,"middle");
     }
   }
   box(13,257,184,26,"none",1,.2);
   text("REFLEXIÓN",17,263,2.65,true);
   text("¿Qué ha ayudado? ¿Qué cambiaré el próximo mes?",17,269,2.5);
   rows(17,276,175,1,7);
 }
 text("Liago",105,293,2.65,false,"middle","#aeb5bf");
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 210 297" preserveAspectRatio="xMidYMid meet"><rect width="210" height="297" fill="${background}"/>${lines}</svg>`;
}
