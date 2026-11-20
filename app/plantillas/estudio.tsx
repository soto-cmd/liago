"use client";
import Link from "next/link";
import PlantillasNav from "./nav";
import {paperVariants,variantFamilies,variantTotal} from "./variantes";
import {makeTracingSvg,type TraceSettings} from "./tracing";
import {useEffect,useMemo,useState} from "react";
import {ArrowLeft,Bookmark,ChevronDown,Download,FilePlus2,Layers,Minus,Plus,Printer,RotateCcw,Share2,Trash2,ArrowUp,ArrowDown} from "lucide-react";
type Template={id:string;name:string;group:string;mode:string};
export const entries:Template[]=[
["plan-semanal","Plan semanal","Planificación","weekly"],["plan-diario","Plan diario","Planificación","daily"],["plan-proyecto","Plan de proyecto","Planificación","project"],["plan-mensual","Plan mensual","Planificación","monthly"],["plan-anual","Plan anual","Planificación","yearly"],["sprint","Sprint de objetivo","Planificación","goals"],["reto","Seguimiento de reto","Planificación","track"],["habitos","Seguimiento de hábitos","Planificación","habit"],
["lista-lectura","Lista de lectura","Lectura","ledger"],["notas-libro","Notas de libro","Lectura","notes"],["seguimiento-lectura","Seguimiento de lectura","Lectura","track"],
["peliculas","Registro de películas","Registros","ledger"],["plantas","Ficha de planta","Registros","notes"],["entrenamiento","Registro de entrenamiento","Registros","ledger"],["receta","Prueba de receta","Registros","notes"],
["partitura","Papel pautado","Música editable","staff"],["lead-sheet","Lead sheet","Música editable","staff"],["composicion","Hoja de composición","Música editable","staff"],["tab-notacion","TAB + notación","Música editable","tabs"],["biblioteca-acordes","Biblioteca de acordes","Música editable","chords"],["practica-musical","Registro de práctica","Música editable","ledger"],["conjunto","Partitura de conjunto","Música editable","staff"],
["storyboard-cine","Storyboard de cine","Estudio visual","story"],["storyboard-vertical","Storyboard vertical","Estudio visual","story"],["dialogo","Cobertura de diálogo","Estudio visual","story"],["tira-comica","Tira cómica","Estudio visual","comic"],["pagina-comic","Página de cómic","Estudio visual","comic"],["lista-planos","Lista de planos","Estudio visual","ledger"],["personaje","Hoja de personaje","Estudio visual","notes"],
["beisbol","Hoja de anotación de béisbol","Deportes","score"],["softbol","Hoja de anotación de sóftbol","Deportes","score"],["baloncesto","Acta de baloncesto","Deportes","score"],["voleibol","Acta de voleibol","Deportes","score"],["futbol","Acta de fútbol","Deportes","score"],["futbol-americano","Resumen de fútbol americano","Deportes","score"],["hockey","Acta de hockey","Deportes","score"],["tenis","Tarjeta de tenis","Deportes","score"],["pickleball","Puntuación de pickleball","Deportes","score"],["golf","Tarjeta de golf","Deportes","score"],["bolos","Puntuación de bolos","Deportes","score"],
["pautado","Papel rayado","Escritura y notas","ruled"],["pautado-estrecho","Papel pautado estrecho","Escritura y notas","ruled"],["pautado-primaria","Papel pautado primaria","Escritura y notas","hand"],["pautado-ancho","Papel pautado ancho","Escritura y notas","ruled"],["puntos","Cuadrícula de puntos","Escritura y notas","dots"],["blanco","Papel blanco","Escritura y notas","blank"],["lista","Lista de comprobación","Escritura y notas","check"],["lista-numerada","Lista numerada","Escritura y notas","numbered"],["gregg","Papel Gregg","Escritura y notas","ruled"],
["cuadricula","Cuadrícula cuadrada","Matemáticas y técnica","grid"],["cartesiano","Plano cartesiano","Matemáticas y técnica","cartesian"],["recta","Recta numérica","Matemáticas y técnica","numberline"],["tecnico","Cuadrícula técnica","Matemáticas y técnica","gridheavy"],["isometrico","Cuadrícula isométrica","Matemáticas y técnica","iso"],["logaritmico","Papel logarítmico","Matemáticas y técnica","log"],
["letter-tracing-worksheet","Trazado de letras A–Z","Práctica de escritura","lettertrace"],["trazado-nombre","Trazado de nombres","Práctica de escritura","trace"],["trazado-lineas","Trazado de líneas","Práctica de escritura","hand"],["mi-zi-ge","Papel Mi Zi Ge","Práctica de escritura","chinese"],["pentagrama","Pentagramas","Papel de música","staff"],["piano","Pauta doble para piano","Papel de música","staff"],["guitarra","TAB de guitarra","Papel de música","tabs"],["bajo","TAB para bajo","Papel de música","tabs"],["ukelele","TAB para ukelele","Papel de música","tabs"],
["cheques","Registro de cheques","Formularios financieros","ledger"],["facturas","Seguimiento de facturas","Formularios financieros","ledger"],["tareas-ninos","Tabla de tareas para niños","Formularios financieros","habit"],["presupuesto","Hoja de presupuesto","Formularios financieros","budget"],
["comic","Storyboard","Diseños creativos","story"],["fichas","Fichas 4×6","Diseños creativos","cards"],
["cornell","Notas Cornell","Más estructuras de papel","cornell"],["hexagono","Cuadrícula hexagonal","Más estructuras de papel","hex"],["polar","Gráfico polar","Más estructuras de papel","polar"],["historias","Hoja para historias con dibujo","Más estructuras de papel","storywrite"],["frances","Papel pautado francés","Más estructuras de papel","hand"],["caligrafia","Papel de caligrafía","Más estructuras de papel","hand"],["acordes","Diagramas de acordes","Más estructuras de papel","chords"],["contable","Papel contable","Más estructuras de papel","ledger"],["carta","Papel carta","Más estructuras de papel","letter"],["calendario","Calendario mensual","Más estructuras de papel","calendar"]
].map(([id,name,group,mode])=>({id,name,group,mode}));
const sizes:Record<string,[number,number]>={A4:[210,297],A5:[148,210],Carta:[215.9,279.4],Oficio:[215.9,330.2],A3:[297,420],A6:[105,148]};
type Sheet=TraceSettings & {id:number;variantId?:string;template:string;paper:string;landscape:boolean;margin:number;spacing:number;ink:string;background:string;heading:string;subtitle:string;date:string;calendarDate?:string;calendarAuto?:boolean;};
export const initial:Sheet={id:1,template:"plan-mensual",paper:"A4",landscape:false,margin:13,spacing:7,ink:"#333f53",background:"#ffffff",heading:"",subtitle:"",date:"",traceInput:"A",traceMode:"both",traceSize:"medium",dashedCopies:"half",traceFont:"rounded",showNameLine:true,showDateLine:true,showFooterMark:true};
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
const fmt=(v:number)=>Number(v.toFixed(3));
const MONTHS=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const WEEKDAYS=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const dateISO=(d:Date)=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const parseISO=(iso:string)=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);if(!m)return new Date();const y=Number(m[1]),month=Number(m[2]),day=Number(m[3]);if(y<1900||y>2100||month<1||month>12)return new Date();return new Date(y,month-1,Math.min(day,new Date(y,month,0).getDate()));};
const changePeriod=(d:Date,year:number,month:number)=>new Date(year,month,Math.min(d.getDate(),new Date(year,month+1,0).getDate()));
const isoMonday=(d:Date)=>{const start=new Date(d.getFullYear(),d.getMonth(),d.getDate());start.setDate(start.getDate()-(start.getDay()+6)%7);return start;};
const shortDate=(d:Date)=>`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const planningMode=(mode:string)=>["daily","weekly","monthly","calendar","yearly"].includes(mode);

export function svgFor(s:Sheet){
 const [pw,ph]=sizes[s.paper]||sizes.A4,[w,h]=s.landscape?[ph,pw]:[pw,ph],m=s.margin,R=w-m,B=h-m,ww=R-m,hh=B-(m+18),sp=s.spacing,ink=s.ink;
 let t=m+18;
 const mode=entries.find(x=>x.id===s.template)?.mode||"ruled",name=entries.find(x=>x.id===s.template)?.name||"Plantilla";
 if(mode==="lettertrace")return {svg:makeTracingSvg(s,w,h),w,h};
 let out="";
 const ln=(x1:number,y1:number,x2:number,y2:number,th=.22,dash="")=>{out+=`<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${ink}" stroke-width="${th}" ${dash?'stroke-dasharray="'+dash+'"':""}/>`};
 const rect=(x:number,y:number,a:number,b:number,fill="none",th=.25)=>{out+=`<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(Math.max(0,a))}" height="${fmt(Math.max(0,b))}" fill="${fill}" stroke="${ink}" stroke-width="${th}"/>`};
 const txt=(str:string,x:number,y:number,size=3.2,bold=false)=>{out+=`<text x="${fmt(x)}" y="${fmt(y)}" fill="${ink}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${bold?700:400}">${esc(str)}</text>`};
 const lines=(y:number,end:number,delta=sp,start=m,stop=R)=>{for(let j=y;j<=end;j+=delta)ln(start,j,stop,j,.16)};
 const checklist=(x:number,y:number,count:number,step=9,width=ww)=>{for(let j=0;j<count;j++){const yy=y+j*step;if(yy>B-4)break;rect(x,yy,3.3,3.3);ln(x+6,yy+3.3,x+width,yy+3.3,.16)}};
 const section=(name:string,x:number,y:number,width:number,height:number,variant:"lines"|"checks"|"box"="lines")=>{txt(name.toUpperCase(),x,y,3.1,true);const yy=y+5; if(variant==="box")rect(x,yy,width,height-5);else if(variant==="checks")checklist(x,yy,Math.floor((height-6)/9),9,width);else lines(yy+5,y+height,8,x,x+width)};
 const table=(headers:string[],y:number,rows=12)=>{const cw=ww/headers.length,row=Math.min(12,(B-y-3)/(rows+1));headers.forEach((c,i)=>txt(c.slice(0,21).toUpperCase(),m+i*cw+1,y+5,2.8,true));for(let i=0;i<=headers.length;i++)ln(m+i*cw,y,m+i*cw,y+(rows+1)*row,.21);for(let i=0;i<=rows+1;i++)ln(m,y+i*row,R,y+i*row,.2)};
 const mainTitle=(s.heading.trim()||name).toUpperCase();
 const selectedDate=s.calendarAuto===false&&s.calendarDate?parseISO(s.calendarDate):new Date();
 const weekStart=isoMonday(selectedDate);
 const periodLabel=mode==="daily"?shortDate(selectedDate):mode==="weekly"?`${shortDate(weekStart)} — ${shortDate(new Date(weekStart.getFullYear(),weekStart.getMonth(),weekStart.getDate()+6))}`:mode==="monthly"||mode==="calendar"?`${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`:mode==="yearly"?String(selectedDate.getFullYear()):s.date||new Date().toLocaleDateString("es-PY",{month:"long",year:"numeric"});
 txt(mainTitle.slice(0,52),m,m+6,5.3,true);txt(periodLabel.toUpperCase(),R-Math.min(75,ww*.49),m+6,2.7);ln(m,m+9,R,m+9,.55);
 if(["ruled","dots","grid","gridheavy","blank","hand","iso","hex","cartesian","log","polar","chinese","letter","numberline","trace"].includes(mode)){
   if(!s.heading.trim()){out="";} else {t=m+13; }
   if(mode==="ruled"||mode==="letter"){lines(t+sp,B,sp);if(mode==="ruled")ln(m+13,t,m+13,B,.3)}
   if(mode==="dots")for(let x=m;x<=R;x+=sp)for(let y=t;y<=B;y+=sp){out+=`<circle cx="${fmt(x)}" cy="${fmt(y)}" r=".38" fill="${ink}"/>`}
   if(mode==="grid"||mode==="gridheavy"||mode==="cartesian"||mode==="log"){for(let x=m;x<=R;x+=sp)ln(x,t,x,B,mode==="gridheavy"&&Math.round((x-m)/sp)%5===0?.5:.16);for(let y=t;y<=B;y+=sp)ln(m,y,R,y,mode==="gridheavy"&&Math.round((y-t)/sp)%5===0?.5:.16);if(mode==="cartesian"){ln((m+R)/2,t,(m+R)/2,B,.65);ln(m,(t+B)/2,R,(t+B)/2,.65)}}
   if(mode==="hand"||mode==="trace"){for(let y=t+sp*4;y<=B;y+=sp*4){ln(m,y,R,y,.34);ln(m,y-sp,R,y-sp,.18,"1 1");ln(m,y-sp*2,R,y-sp*2,.18,"1 1");ln(m,y-sp*3,R,y-sp*3,.34);if(mode==="trace")txt((s.subtitle||"Aa Bb Cc 123").slice(0,28),m+2,y-sp*2,sp*.85)}}
   if(mode==="iso"){const dy=sp*.866;for(let y=t;y<B;y+=dy)for(let x=m+(Math.round((y-t)/dy)%2)*sp/2;x<R;x+=sp)out+=`<circle cx="${fmt(x)}" cy="${fmt(y)}" r=".38" fill="${ink}"/>`}
   if(mode==="chinese"){for(let y=t;y+sp*2<=B;y+=sp*2){for(let x=m;x+sp*2<=R;x+=sp*2){rect(x,y,sp*2,sp*2);ln(x+sp,y,x+sp,y+sp*2,.14,"1 1");ln(x,y+sp,x+sp*2,y+sp,.14,"1 1");ln(x,y,x+sp*2,y+sp*2,.13,"1 1");ln(x+sp*2,y,x,y+sp*2,.13,"1 1")}}}
   if(mode==="hex"){const sz=sp/1.6;for(let y=t+sz;y+sz<B;y+=sz*1.73)for(let x=m+sz+(Math.round((y-t)/ (sz*1.73))%2)*sz*1.5;x+sz<R;x+=sz*3){let points="";for(let k=0;k<6;k++){const a=Math.PI*k/3;points+=fmt(x+sz*Math.cos(a))+","+fmt(y+sz*Math.sin(a))+" "}out+=`<polygon points="${points}" fill="none" stroke="${ink}" stroke-width=".17"/>`}}
   if(mode==="polar"){const cx=(m+R)/2,cy=(t+B)/2,r=Math.min(ww, B-t)*.43;for(let i=1;i<=8;i++){out+=`<circle cx="${cx}" cy="${cy}" r="${fmt(r*i/8)}" stroke="${ink}" stroke-width=".17" fill="none"/>`}for(let i=0;i<24;i++){let a=i*Math.PI/12;ln(cx,cy,cx+r*Math.cos(a),cy+r*Math.sin(a),.17)}}
   if(mode==="numberline"){for(let y=t+20;y<B-6;y+=25){ln(m+8,y,R-8,y,.4);for(let i=0;i<=10;i++){const x=m+8+i*(ww-16)/10;ln(x,y-3,x,y+3,.3);txt(String(i),x-1,y+7,2.8)}}}
 } else if(mode==="weekly"){
   const col=ww/7,usable=Math.max(25,B-t-31);
   for(let i=0;i<7;i++){const d=new Date(weekStart.getFullYear(),weekStart.getMonth(),weekStart.getDate()+i),x=m+i*col;
     txt(`${WEEKDAYS[i]} ${d.getDate()}/${d.getMonth()+1}`,x+1.5,t+5,2.7,true);
     rect(x,t+8,col,usable);
     for(let lineY=t+21;lineY<t+8+usable-4;lineY+=12)ln(x+2,lineY,x+col-2,lineY,.12);
   }
   section("Prioridades de la semana",m,B-21,ww,16,"checks");
 }
 else if(mode==="monthly"||mode==="calendar"){
   const first=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1),daysInMonth=new Date(selectedDate.getFullYear(),selectedDate.getMonth()+1,0).getDate();
   const shift=(first.getDay()+6)%7,rows=Math.ceil((shift+daysInMonth)/7),col=ww/7;
   const calendarTop=t+9,calendarBottom=mode==="monthly"?Math.min(B-67,t+127):B-8,rowHeight=(calendarBottom-calendarTop)/rows;
   for(let k=0;k<7;k++)txt(WEEKDAYS[k],m+k*col+2,t+5,3,true);
   for(let row=0;row<rows;row++)for(let k=0;k<7;k++){
      const number=row*7+k-shift+1,x=m+k*col,y=calendarTop+row*rowHeight;
      rect(x,y,col,rowHeight);
      if(number>=1&&number<=daysInMonth)txt(String(number),x+2,y+5,3,true);
   }
   if(mode==="monthly"){
     const remaining=Math.max(28,B-calendarBottom-13),sectionHeight=(remaining-4)/2;
     section("Prioridades",m,calendarBottom+10,ww*.48,sectionHeight,"checks");
     section("Fechas importantes",m+ww*.53,calendarBottom+10,ww*.47,sectionHeight,"checks");
   }
 }
 else if(mode==="yearly"){
   const gapX=4,gapY=7,columns=3,rows=4,cellW=(ww-gapX*(columns-1))/columns,cellH=Math.min((B-t-7-gapY*(rows-1))/rows,61);
   for(let month=0;month<12;month++){
      const x=m+(month%columns)*(cellW+gapX),y=t+Math.floor(month/columns)*(cellH+gapY);
      txt(MONTHS[month].toUpperCase(),x+1,y+4,3.1,true);
      const cW=cellW/7,headingY=y+8,baseY=y+13,rowH=(cellH-17)/6;
      for(let k=0;k<7;k++)txt(WEEKDAYS[k].slice(0,1),x+k*cW+cW*.3,headingY,2.2);
      const offset=(new Date(selectedDate.getFullYear(),month,1).getDay()+6)%7,days=new Date(selectedDate.getFullYear(),month+1,0).getDate();
      for(let d=1;d<=days;d++){const n=offset+d-1,dx=x+(n%7)*cW,dy=baseY+Math.floor(n/7)*rowH;txt(String(d),dx+1,dy,2.5);}
   }
 }
 else if(mode==="daily"){
   txt(WEEKDAYS[(selectedDate.getDay()+6)%7].toUpperCase(),m,t+3,3.3,true);
   section("Prioridades",m,t+9,ww*.47,65,"checks");section("Horario",m+ww*.53,t+9,ww*.47,100);
   section("Tareas",m,t+84,ww*.47,Math.min(110,B-(t+84)-2),"checks");section("Notas",m+ww*.53,t+115,ww*.47,Math.min(75,B-(t+115)-2));
 }
 else if(mode==="project"||mode==="goals"){section("Objetivo principal",m,t,ww,30,"box");section("Hitos y entregables",m,t+45,ww*.47,105,"checks");section("Responsables y fechas",m+ww*.53,t+45,ww*.47,105);section("Próximos pasos",m,t+166,ww,65,"checks")}
 else if(mode==="track"||mode==="habit"){table(["Actividad","L","M","M","J","V","S","D"],t,15)}
 else if(mode==="notes"){section("Información general",m,t,ww,42,"box");section("Ideas y observaciones",m,t+57,ww,106);section("Conclusiones",m,t+174,ww,55,"box")}
 else if(mode==="ledger"||mode==="budget"||mode==="score"){table(mode==="budget"?["Concepto","Presupuesto","Real","Diferencia"]:mode==="score"?["Jugador / Equipo","1","2","3","4","Total"]:["Fecha","Descripción","Cantidad","Observaciones"],t,mode==="score"?16:18);if(mode==="budget")section("Balance y notas",m,B-38,ww,29,"box")}
 else if(mode==="staff"||mode==="tabs"){const gap=mode==="tabs"?3.3:2.5,ct=mode==="tabs"?6:5;for(let y=t+8;y+ct*gap<B;y+=gap*(ct+7))for(let j=0;j<ct;j++)ln(m,y+j*gap,R,y+j*gap,.28);if(mode==="tabs")txt("TAB",m+2,t+6,3.3,true)}
 else if(mode==="chords"){const cell=ww/4;for(let i=0;i<4;i++)for(let j=0;j<5;j++){const x=m+i*cell+cell*.12,y=t+j*44;for(let k=0;k<6;k++)ln(x+k*cell*.1,y+5,x+k*cell*.1,y+32,.25);for(let k=0;k<5;k++)ln(x,y+5+k*6.75,x+cell*.5,y+5+k*6.75,.25);txt("Acorde: ______",x,y+39,2.5)}}
 else if(mode==="story"||mode==="comic"||mode==="storywrite"){const cols=mode==="comic"?2:mode==="storywrite"?1:2,rows=mode==="comic"?3:3,cw=ww/cols,ch=(hh-8)/rows;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){let x=m+c*cw,y=t+r*ch;rect(x+2,y+2,cw-5,mode==="storywrite"?ch*.6:ch*.7);txt("ESCENA "+(r*cols+c+1),x+3,y+ch*.74,2.5,true);lines(y+ch*.81,y+ch-4,5,x+3,x+cw-4)}}
 else if(mode==="cards"){for(let r=0;r<3;r++)for(let c=0;c<2;c++)rect(m+c*ww/2+2,t+r*(hh/3)+2,ww/2-4,hh/3-4)}
 else if(mode==="check"||mode==="numbered"){for(let y=t+10,i=1;y<B;y+=sp*1.8,i++){if(mode==="check")rect(m,y-4,4,4);else txt(i+".",m,y,3);ln(m+9,y,R,y,.17)}}
 else if(mode==="cornell"){const div=m+ww*.3;ln(div,t,div,B-33,.4);ln(m,B-33,R,B-33,.4);section("Palabras clave",m,t,ww*.28,hh-40);section("Apuntes",div+3,t,ww*.66,hh-40);section("Resumen",m,B-29,ww,25)}
 else if(mode==="storywrite"){rect(m,t,ww,hh*.4);lines(t+hh*.48,B,sp)}
 const footer=`<rect x="0" y="${h-10}" width="${w}" height="10" fill="${s.background}"/><text x="${w/2}" y="${h-5}" fill="#aeb5bf" text-anchor="middle" font-family="Arial,sans-serif" font-size="2.8" letter-spacing=".45">Liago</text>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${s.background}"/>${out}${footer}</svg>`;
 return {svg,w,h};
}
function save(blob:Blob,name:string){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000)}
const input="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-700";
export default function Estudio(){
 const [pages,setPages]=useState<Sheet[]>([initial]),[selected,setSelected]=useState(1),[query,setQuery]=useState(""),[variantSearch,setVariantSearch]=useState(""),[variantFamily,setVariantFamily]=useState("Todas"),[showVariants,setShowVariants]=useState(true),[galleryOpen,setGalleryOpen]=useState(false),[galleryTab,setGalleryTab]=useState("Planificación"),[galleryMode,setGalleryMode]=useState<"plantillas"|"variantes">("plantillas"),[galleryPage,setGalleryPage]=useState(0),[sidebarTab,setSidebarTab]=useState<"plantillas"|"diseno"|"contenido">("plantillas"),[clockTick,setClockTick]=useState(0),[zoom,setZoom]=useState(90),[showExport,setShowExport]=useState(false),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const current=pages.find(p=>p.id===selected)||pages[0],art=useMemo(()=>svgFor(current),[current,clockTick]);const groups=[...new Set(entries.map(e=>e.group))];const template=entries.find(e=>e.id===current.template)||entries[0];
 const update=(changes:Partial<Sheet>)=>setPages(v=>v.map(p=>p.id===selected?{...p,...changes}:p));
 const chooseVariant=(id:string)=>{const v=paperVariants.find(p=>p.id===id);if(!v)return;update({variantId:id,template:v.template,paper:v.paper,landscape:v.landscape,spacing:v.spacing,margin:v.margin,ink:v.ink,subtitle:v.subtitle||""});};
 const filteredTemplates=entries.filter(e=>(galleryTab==="Todas"||e.group===galleryTab)&&(!query||e.name.toLowerCase().includes(query.toLowerCase())||e.group.toLowerCase().includes(query.toLowerCase())));
 const filteredVariants=paperVariants.filter(v=>(galleryTab==="Todas"||v.family===galleryTab)&&(!variantSearch||v.name.toLowerCase().includes(variantSearch.toLowerCase())||v.family.toLowerCase().includes(variantSearch.toLowerCase())));
 const galleryCount=galleryMode==="plantillas"?filteredTemplates.length:filteredVariants.length;
 const galleryPages=Math.max(1,Math.ceil(galleryCount/16));
 const add=()=>{const id=Math.max(...pages.map(x=>x.id))+1;setPages(v=>[...v,{...current,id}]);setSelected(id)};
 const del=(id:number)=>{if(pages.length===1)return;const next=pages.filter(x=>x.id!==id);setPages(next);if(selected===id)setSelected(next[0].id)};
 const move=(id:number,dir:number)=>{const next=[...pages],at=next.findIndex(p=>p.id===id),to=at+dir;if(to<0||to>=next.length)return;[next[at],next[to]]=[next[to],next[at]];setPages(next)};
 useEffect(()=>{const timer=window.setInterval(()=>setClockTick(v=>v+1),60000);return()=>window.clearInterval(timer)},[]);
 useEffect(()=>{try{const raw=localStorage.getItem("liago-print-studio-v1");if(raw){const p=JSON.parse(raw);if(Array.isArray(p)&&p.length&&p.length<51&&p.every(x=>typeof x.id==="number"&&typeof x.template==="string")){setPages(p);setSelected(p[0].id)}}}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem("liago-print-studio-v1",JSON.stringify(pages))}catch{}},[pages]);
 const print=(all=false)=>{
  const chosen=all?pages:[current];
  const same=chosen.every(p=>p.paper===chosen[0].paper&&p.landscape===chosen[0].landscape);
  if(all&&!same){setError("El paquete combina tamaños diferentes. Usá un único tamaño y orientación para conservar la escala real.");return;}
  const {w,h}=svgFor(chosen[0]);
  const html=chosen.map(p=>{const art=svgFor(p);return `<div class="page" style="width:${art.w}mm;height:${art.h}mm">${art.svg}</div>`}).join("");
  // Print from a same-origin iframe instead of window.open, so popup blockers never intervene.
  const previous=document.getElementById("liago-print-frame");
  previous?.remove();
  const iframe=document.createElement("iframe");
  iframe.id="liago-print-frame";
  iframe.setAttribute("title","Área de impresión Liago");
  iframe.style.cssText="position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none";
  let printed=false;
  iframe.onload=()=>{
    if(printed)return;
    printed=true;
    const target=iframe.contentWindow;
    if(!target){setError("No se pudo preparar la impresión. Probá nuevamente.");iframe.remove();return;}
    const cleanup=()=>{window.setTimeout(()=>iframe.remove(),1000)};
    target.addEventListener("afterprint",cleanup,{once:true});
    try{target.focus();target.print();window.setTimeout(()=>{if(iframe.isConnected)iframe.remove()},120000);setError("")}
    catch{iframe.remove();setError("No se pudo abrir el diálogo de impresión. Intentá nuevamente.")}
  };
  iframe.srcdoc=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Liago - impresión</title><style>@page{size:${w}mm ${h}mm;margin:0}html,body{margin:0;padding:0;background:white}.page{break-after:page;page-break-after:always;overflow:hidden}.page:last-child{break-after:auto}svg{width:100%;height:100%;display:block}</style></head><body>${html}</body></html>`;
  document.body.appendChild(iframe);
 };
 const exportSvg=()=>save(new Blob([art.svg],{type:"image/svg+xml;charset=utf-8"}),"Liago "+template.name+".svg");
 const exportPng=async()=>{setBusy(true);try{const blob=new Blob([art.svg],{type:"image/svg+xml"}),url=URL.createObjectURL(blob),img=new Image();try{await new Promise<void>((ok,no)=>{img.onload=()=>ok();img.onerror=()=>no(Error("Error al renderizar"));img.src=url});const canvas=document.createElement("canvas");canvas.width=Math.round(art.w*300/25.4);canvas.height=Math.round(art.h*300/25.4);canvas.getContext("2d")?.drawImage(img,0,0,canvas.width,canvas.height);const png=await new Promise<Blob>((ok,no)=>canvas.toBlob(b=>b?ok(b):no(Error("PNG no disponible")),"image/png"));save(png,"Liago "+template.name+".png")}finally{URL.revokeObjectURL(url)}}catch{setError("No se pudo exportar PNG.")}finally{setBusy(false)}};
 const copy=async()=>{const p=new URLSearchParams({template:current.template,paper:current.paper});try{await navigator.clipboard.writeText(location.origin+"/plantillas?"+p);setError("Enlace copiado.")}catch{setError("No fue posible copiar el enlace.")}};
 useEffect(()=>{const q=new URLSearchParams(location.search),id=q.get("template"),p=q.get("paper"),variant=q.get("variant"),catalog=q.get("catalog"),panel=q.get("panel");if(id&&entries.some(x=>x.id===id))setPages(v=>v.map((s,i)=>i===0?{...s,template:id,paper:p&&sizes[p]?p:s.paper}:s));if(variant){const item=paperVariants.find(v=>v.id===variant);if(item)setPages(v=>v.map((s,i)=>i===0?{...s,variantId:item.id,template:item.template,paper:item.paper,landscape:item.landscape,margin:item.margin,spacing:item.spacing,ink:item.ink,subtitle:item.subtitle||""}:s))}if(catalog==="plantillas"||catalog==="variantes"){setGalleryMode(catalog);setGalleryTab("Todas");setGalleryPage(0);setGalleryOpen(true)}if(panel==="paquete")window.requestAnimationFrame(()=>document.getElementById("liago-print-package")?.scrollIntoView({behavior:"smooth",block:"start"}))},[]);
 return <main className="flex min-h-screen flex-col bg-[#f6f3ee] text-[#282824]">
 <PlantillasNav active="editor" packageCount={pages.length}/>
 <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4"><div><h1 className="text-lg font-semibold">{template.name} <ChevronDown className="inline" size={15}/></h1><p className="text-xs text-stone-500">{template.group} · {pages.length} {pages.length===1?"página":"páginas"}</p></div><div className="flex flex-wrap gap-2 text-sm"><button onClick={()=>{try{localStorage.setItem("liago-print-saved",JSON.stringify(pages));setError("Configuración guardada en este navegador.")}catch{setError("No se pudo guardar.")}}} className="rounded-lg border border-stone-200 px-3 py-2"><Bookmark className="mr-1 inline" size={16}/> Guardar receta</button><div className="relative"><button onClick={()=>setShowExport(!showExport)} className="rounded-lg border border-stone-200 px-3 py-2"><Share2 className="mr-1 inline" size={16}/> Compartir y formatos</button>{showExport&&<div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border bg-white p-2 shadow-xl"><button onClick={copy} className="block w-full p-2 text-left hover:bg-stone-100">Copiar enlace</button><button onClick={exportSvg} className="block w-full p-2 text-left hover:bg-stone-100">Exportar SVG</button><button onClick={exportPng} disabled={busy} className="block w-full p-2 text-left hover:bg-stone-100">Exportar PNG</button><button onClick={()=>print()} className="block w-full p-2 text-left hover:bg-stone-100">Imprimir</button></div>}</div><button onClick={add} className="rounded-lg border border-blue-300 px-3 py-2 text-blue-900"><Layers className="mr-1 inline" size={16}/> Añadir al paquete</button><button onClick={()=>print()} className="rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white"><Download className="mr-1 inline" size={16}/> Descargar PDF</button></div></div>
 {error&&<div role="status" className="border-b bg-amber-50 px-5 py-2 text-sm text-amber-900">{error}<button className="ml-3 underline" onClick={()=>setError("")}>Cerrar</button></div>}
 {galleryOpen&&<div role="dialog" aria-modal="true" aria-label="Catálogo de plantillas" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-5">
<div className="flex h-[min(92vh,980px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#faf9f6] shadow-2xl">
<div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4">
<div><h2 className="font-serif text-xl font-semibold">Explorar plantillas imprimibles</h2><p className="text-xs text-stone-500">Seleccioná una miniatura para editarla en tu hoja actual.</p></div>
<button type="button" onClick={()=>setGalleryOpen(false)} aria-label="Cerrar catálogo" className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold">Cerrar ✕</button>
</div>
<div className="flex flex-wrap items-center gap-3 border-b border-stone-200 px-5 py-3">
<div role="tablist" aria-label="Tipo de catálogo" className="inline-flex gap-1 rounded-lg bg-stone-200 p-1">
<button role="tab" aria-selected={galleryMode==="plantillas"} onClick={()=>{setGalleryMode("plantillas");setGalleryTab("Todas");setGalleryPage(0)}} className={`rounded-md px-3 py-2 text-xs font-bold ${galleryMode==="plantillas"?"bg-white text-blue-900 shadow-sm":"text-stone-600"}`}>Plantillas ({entries.length})</button>
<button role="tab" aria-selected={galleryMode==="variantes"} onClick={()=>{setGalleryMode("variantes");setGalleryTab("Todas");setGalleryPage(0)}} className={`rounded-md px-3 py-2 text-xs font-bold ${galleryMode==="variantes"?"bg-white text-blue-900 shadow-sm":"text-stone-600"}`}>Variantes ({variantTotal})</button>
</div>
<input aria-label="Buscar en el catálogo" value={galleryMode==="plantillas"?query:variantSearch} onChange={e=>{if(galleryMode==="plantillas")setQuery(e.target.value);else setVariantSearch(e.target.value);setGalleryPage(0)}} className="min-w-40 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm" placeholder="Buscar por nombre o categoría..."/>
</div>
<div role="tablist" aria-label="Categorías" className="flex shrink-0 gap-2 overflow-x-auto border-b border-stone-200 px-5 py-3">
{["Todas",...(galleryMode==="plantillas"?groups:variantFamilies.map(f=>f.name))].map(group=><button key={group} role="tab" aria-selected={galleryTab===group} onClick={()=>{setGalleryTab(group);setGalleryPage(0)}} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${galleryTab===group?"bg-blue-900 text-white":"border border-stone-200 bg-white hover:border-blue-400"}`}>{group}</button>)}
</div>
<div className="flex-1 overflow-y-auto p-4 sm:p-6">
{galleryMode==="plantillas"?<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
{filteredTemplates.slice(galleryPage*16,galleryPage*16+16).map(e=>{const preview=svgFor({...initial,template:e.id});return <button type="button" key={e.id} onClick={()=>{update({template:e.id,variantId:undefined});setGalleryOpen(false)}} className={`group rounded-xl border bg-white p-3 text-left shadow-sm transition hover:border-blue-700 hover:shadow-md ${current.template===e.id?"border-blue-700 ring-1 ring-blue-700":"border-stone-200"}`}>
<div className="mx-auto flex h-44 items-center justify-center overflow-hidden rounded-lg bg-[#f0eee8] p-2 sm:h-56"><div className="h-full max-w-full overflow-hidden bg-white shadow-sm" style={{aspectRatio:preview.w+"/"+preview.h}}><div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{__html:preview.svg}}/></div></div>
<p className="mt-3 text-sm font-semibold group-hover:text-blue-800">{e.name}</p><p className="mt-1 text-xs text-stone-500">{e.group}</p>
</button>})}</div>:<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
{filteredVariants.slice(galleryPage*16,galleryPage*16+16).map(v=>{const preview=svgFor({...initial,template:v.template,paper:v.paper,landscape:v.landscape,spacing:v.spacing,margin:v.margin,ink:v.ink,subtitle:v.subtitle||""});return <button type="button" key={v.id} onClick={()=>{chooseVariant(v.id);setGalleryOpen(false)}} className={`group rounded-xl border bg-white p-3 text-left shadow-sm hover:border-blue-700 hover:shadow-md ${current.variantId===v.id?"border-blue-700 ring-1 ring-blue-700":"border-stone-200"}`}>
<div className="mx-auto flex h-44 items-center justify-center overflow-hidden rounded-lg bg-[#f0eee8] p-2 sm:h-56"><div className="h-full max-w-full overflow-hidden bg-white shadow-sm" style={{aspectRatio:preview.w+"/"+preview.h}}><div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{__html:preview.svg}}/></div></div>
<p className="mt-3 text-xs font-semibold group-hover:text-blue-800">{v.name}</p><p className="mt-1 text-[11px] text-stone-500">{v.family}</p>
</button>})}</div>}
<div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-stone-200 pt-4 text-sm"><span className="text-stone-500">{galleryCount} resultados · página {Math.min(galleryPage+1,galleryPages)} de {galleryPages}</span><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={galleryPage===0} onClick={()=>setGalleryPage(v=>Math.max(0,v-1))}>Anterior</button><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={galleryPage>=galleryPages-1} onClick={()=>setGalleryPage(v=>Math.min(galleryPages-1,v+1))}>Siguiente</button></div>
</div>
</div></div>}
<div id="liago-editor" className="grid min-h-[calc(100vh-162px)] flex-1 lg:grid-cols-[330px_minmax(0,1fr)_245px]">
 <aside className="max-h-[calc(100vh-155px)] overflow-y-auto border-r border-stone-200 bg-[#faf9f6] p-4">
<div role="tablist" aria-label="Opciones del generador" className="sticky top-0 z-10 mb-4 grid grid-cols-3 gap-1 rounded-xl border border-stone-200 bg-white p-1.5 shadow-sm">
{([{id:"plantillas",label:"Plantillas"},{id:"diseno",label:"Diseño"},{id:"contenido",label:"Contenido"}] as const).map(tab=><button key={tab.id} type="button" role="tab" aria-selected={sidebarTab===tab.id} onClick={()=>setSidebarTab(tab.id)} className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition-colors ${sidebarTab===tab.id?"bg-blue-900 text-white":"text-stone-600 hover:bg-stone-100"}`}>{tab.label}</button>)}
</div>
{sidebarTab==="plantillas"&&<div role="tabpanel" className="space-y-4"><div className="mb-4 rounded-xl border border-blue-200 bg-white p-3">
<h2 className="text-sm font-bold text-slate-800">Cambiar de planificador</h2>
<p className="mt-1 text-xs text-stone-500">Elegí directamente qué tipo de planificación querés imprimir.</p>
<div className="mt-3 grid grid-cols-4 gap-1.5">
{([{id:"plan-diario",label:"Diario"},{id:"plan-semanal",label:"Semanal"},{id:"plan-mensual",label:"Mensual"},{id:"plan-anual",label:"Anual"}] as const).map(item=><button key={item.id} type="button" onClick={()=>update({template:item.id,variantId:undefined})} aria-pressed={current.template===item.id} className={`min-h-11 rounded-lg border px-1 py-2 text-xs font-semibold transition-colors ${current.template===item.id?"border-blue-800 bg-blue-900 text-white":"border-stone-200 bg-stone-50 text-slate-700 hover:border-blue-500 hover:bg-blue-50"}`}>{item.label}</button>)}
</div>
</div>
<div className="rounded-xl border border-stone-200 bg-white p-3">
<h2 className="font-serif text-lg">Selector de plantillas</h2>
<p className="mt-1 text-xs text-stone-500">Explorá categorías y elegí desde una vista previa.</p>
<button type="button" onClick={()=>{setGalleryMode("plantillas");setGalleryTab(template.group);setGalleryPage(0);setGalleryOpen(true)}} className="mt-3 w-full rounded-lg bg-blue-900 px-3 py-3 text-sm font-semibold text-white">Ver catálogo con miniaturas</button>
<div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3"><p className="text-[11px] font-bold uppercase text-stone-500">Plantilla actual</p><div className="mt-2 flex items-center gap-3"><div className="h-24 w-16 shrink-0 overflow-hidden border bg-white shadow-sm"><div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{__html:art.svg}}/></div><div><p className="text-sm font-semibold">{template.name}</p><p className="mt-1 text-xs text-stone-500">{template.group}</p></div></div></div>
<div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={()=>{setGalleryMode("plantillas");setGalleryTab(template.group);setGalleryOpen(true)}} className="rounded-lg border border-stone-200 px-2 py-2 text-xs">Plantillas ({entries.length})</button><button type="button" onClick={()=>{setGalleryMode("variantes");setGalleryTab("Todas");setGalleryPage(0);setGalleryOpen(true)}} className="rounded-lg border border-stone-200 px-2 py-2 text-xs">Variantes ({variantTotal})</button></div>
</div>
</div>}
{sidebarTab==="diseno"&&<div role="tabpanel" className="space-y-4"><div className="mt-6 space-y-3 border-t pt-4"><h2 className="font-serif text-lg">Papel y diseño</h2><label className="block text-sm">Tamaño de papel<select value={current.paper} onChange={e=>update({paper:e.target.value})} className={input}>{Object.keys(sizes).map(p=><option key={p}>{p}</option>)}</select></label><label className="block text-sm">Orientación<select value={current.landscape?"h":"v"} onChange={e=>update({landscape:e.target.value==="h"})} className={input}><option value="v">Vertical</option><option value="h">Horizontal</option></select></label><div className="grid grid-cols-2 gap-2"><label className="text-sm">Margen (mm)<input className={input} type="number" min="3" max="40" step="1" value={current.margin} onChange={e=>update({margin:Math.max(3,Math.min(40,Number(e.target.value)||3))})}/></label><label className="text-sm">Espaciado (mm)<input className={input} type="number" min="2" max="30" step=".5" value={current.spacing} onChange={e=>update({spacing:Math.max(2,Math.min(30,Number(e.target.value)||2))})}/></label></div><label className="block text-sm">Color de tinta<div className="flex items-center gap-3"><input type="color" value={current.ink} onChange={e=>update({ink:e.target.value})}/><span className="text-xs">{current.ink}</span></div></label><div className="flex gap-2">{["#111111","#475569","#94a3b8","#1e40af","#608a73","#d24b60"].map(c=><button aria-label={"Color "+c} key={c} onClick={()=>update({ink:c})} style={{background:c}} className="h-7 w-7 rounded-md border-2 border-white shadow-sm"/>)}</div><label className="block text-sm">Fondo<div className="flex gap-2">{["#ffffff","#fff9e8","#edf4fc","#f0f7ef","#fbebee"].map(c=><button aria-label={"Fondo "+c} key={c} onClick={()=>update({background:c})} style={{background:c}} className="h-8 w-8 rounded-md border border-stone-300"/>)}</div></label></div></div>}
{sidebarTab==="contenido"&&<div role="tabpanel" className="space-y-4">
{planningMode(template.mode)&&<div className="rounded-xl border border-blue-200 bg-blue-50/30 p-3">
<h2 className="text-sm font-semibold text-blue-900">Fecha del planificador</h2>
<label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={current.calendarAuto!==false} onChange={e=>update({calendarAuto:e.target.checked,calendarDate:e.target.checked?undefined:dateISO(new Date())})}/> Usar fecha actual automáticamente</label>
{current.calendarAuto===false&&<div className="mt-3 space-y-2">
<label className="block text-xs">Fecha<input type="date" className={input} min="1900-01-01" max="2100-12-31" value={current.calendarDate||dateISO(new Date())} onChange={e=>{if(e.target.value)update({calendarDate:e.target.value})}}/></label>
<div className="grid grid-cols-2 gap-2"><label className="text-xs">Mes<select className={input} value={parseISO(current.calendarDate||dateISO(new Date())).getMonth()} onChange={e=>{const d=parseISO(current.calendarDate||dateISO(new Date()));update({calendarDate:dateISO(changePeriod(d,d.getFullYear(),Number(e.target.value)))})}}>{MONTHS.map((name,i)=><option value={i} key={name}>{name[0].toUpperCase()+name.slice(1)}</option>)}</select></label><label className="text-xs">Año<input type="number" className={input} min={1900} max={2100} value={parseISO(current.calendarDate||dateISO(new Date())).getFullYear()} onChange={e=>{const year=Number(e.target.value);if(year>=1900&&year<=2100){const d=parseISO(current.calendarDate||dateISO(new Date()));update({calendarDate:dateISO(changePeriod(d,year,d.getMonth()))})}}}/></label></div>
</div>}
<p className="mt-2 text-xs text-stone-500">En modo automático, el período se actualiza con el calendario. Las fechas elegidas manualmente se conservan.</p>
</div>}
<div className="rounded-xl border border-stone-200 bg-white p-3"><h2 className="font-serif text-lg">Contenido de la hoja</h2><p className="mb-3 text-xs text-stone-500">Modificá los textos y los ajustes de la plantilla seleccionada.</p><div className="space-y-3"><label className="block text-sm">Título personalizado<input className={input} maxLength={60} value={current.heading} onChange={e=>update({heading:e.target.value})} placeholder={template.name}/></label><label className="block text-sm">Texto de práctica (si corresponde)<input className={input} maxLength={50} value={current.subtitle} onChange={e=>update({subtitle:e.target.value})} placeholder="Aa Bb Cc 123"/></label><label className="block text-sm">Fecha o periodo<input className={input} maxLength={35} value={current.date} onChange={e=>update({date:e.target.value})} placeholder="Noviembre 2026"/></label></div></div>
 {current.template==="letter-tracing-worksheet"&&<section className="mt-6 space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
<h2 className="text-base font-bold text-blue-900">Práctica de trazado A–Z</h2>
<label className="block text-sm">Letra o palabra<input className={input} maxLength={26} value={current.traceInput??"A"} onChange={e=>update({traceInput:e.target.value})} placeholder="Ej.: A, Lia o apple"/></label>
<div className="grid grid-cols-2 gap-2"><label className="text-sm">Trazar<select className={input} value={current.traceMode||"both"} onChange={e=>update({traceMode:e.target.value as NonNullable<Sheet["traceMode"]>})}><option value="both">Ambas Aa</option><option value="uppercase">Mayúscula</option><option value="lowercase">Minúscula</option><option value="word">Texto completo</option></select></label><label className="text-sm">Tamaño<select className={input} value={current.traceSize||"medium"} onChange={e=>update({traceSize:e.target.value as NonNullable<Sheet["traceSize"]>})}><option value="large">Grande</option><option value="medium">Mediano</option><option value="small">Pequeño</option></select></label></div>
<label className="block text-sm">Copias para repasar<select className={input} value={current.dashedCopies||"half"} onChange={e=>update({dashedCopies:e.target.value as NonNullable<Sheet["dashedCopies"]>})}><option value="full">Fila completa</option><option value="half">Media fila</option><option value="one">Una copia</option><option value="none">Sin copias</option></select></label>
<label className="block text-sm">Estilo de letra<select className={input} value={current.traceFont||"rounded"} onChange={e=>update({traceFont:e.target.value as NonNullable<Sheet["traceFont"]>})}><option value="rounded">Redondeada</option><option value="print">Imprenta</option></select></label>
<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={current.showNameLine!==false} onChange={e=>update({showNameLine:e.target.checked})}/> Línea para nombre</label>
<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={current.showDateLine!==false} onChange={e=>update({showDateLine:e.target.checked})}/> Línea para fecha</label>

</section>}

<div className="rounded-lg border border-stone-200 bg-white p-3 text-xs text-stone-500">La marca de agua Liago aparece automáticamente en todas las hojas.</div>
</div>}
<div className="mt-5 border-t border-stone-200 pt-4"><button onClick={()=>update({...initial,id:current.id,template:current.template})} className="flex items-center gap-2 text-sm text-stone-600 hover:text-blue-800"><RotateCcw size={15}/> Restablecer ajustes de esta hoja</button></div>
</aside>
 <section className="min-w-0 overflow-auto bg-[#f1ece3] p-4 lg:p-8"><div className="mx-auto mb-4 flex max-w-[850px] justify-between text-xs text-stone-500"><span>Vista en vivo · {art.w} × {art.h} mm</span><div className="flex items-center gap-3 rounded-lg bg-white p-2"><button aria-label="Reducir zoom" onClick={()=>setZoom(v=>Math.max(35,v-10))}><Minus size={15}/></button><span>{zoom}%</span><button aria-label="Aumentar zoom" onClick={()=>setZoom(v=>Math.min(160,v+10))}><Plus size={15}/></button></div></div><div className="flex min-w-max justify-center"><div className="relative"><div className="absolute -top-5 left-0 right-0 flex justify-between border-b border-stone-400 text-[10px] text-stone-400"><span>0</span><span>{Math.round(art.w/2)}</span><span>{Math.round(art.w)} mm</span></div><div className="bg-white shadow-xl" style={{width:art.w*2.3*zoom/100,height:art.h*2.3*zoom/100}}><div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{__html:art.svg}}/></div></div></div></section>
 <aside id="liago-print-package" className="scroll-mt-20 border-l border-stone-200 bg-[#faf9f6] p-4"><div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-lg">Páginas ({pages.length})</h2><button onClick={add} className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-bold text-white"><Plus size={14} className="inline"/> Añadir</button></div><div className="space-y-3">{pages.map((p,i)=>{const a=svgFor(p);return <div key={p.id} onClick={()=>setSelected(p.id)} className={`cursor-pointer rounded-xl border p-3 ${selected===p.id?"border-blue-800 bg-blue-50":"border-stone-200 bg-white"}`}><p className="mb-2 text-xs font-semibold">#{i+1} · {entries.find(x=>x.id===p.template)?.name}</p><div className="mx-auto h-36 w-fit max-w-full overflow-hidden border bg-white shadow-sm" style={{aspectRatio:a.w+"/"+a.h}}><div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{__html:a.svg}}/></div><div className="mt-2 flex justify-end gap-2 text-stone-500"><button title="Subir" onClick={e=>{e.stopPropagation();move(p.id,-1)}}><ArrowUp size={15}/></button><button title="Bajar" onClick={e=>{e.stopPropagation();move(p.id,1)}}><ArrowDown size={15}/></button><button title="Eliminar" disabled={pages.length===1} onClick={e=>{e.stopPropagation();del(p.id)}}><Trash2 size={15}/></button></div></div>})}</div><button onClick={add} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 px-3 py-3 text-sm"><FilePlus2 size={16}/> Nueva página</button><button onClick={()=>print(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 px-3 py-3 text-sm font-semibold text-white"><Printer size={16}/> Imprimir paquete</button><p className="mt-3 text-xs text-stone-500">Las hojas se guardan en este navegador. Para PDF, seleccioná «Guardar como PDF» y escala real en la ventana de impresión.</p></aside>
 </div></main>
}
