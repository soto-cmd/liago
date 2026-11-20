// Actividades originales de Liago para uso doméstico y aprendizaje infantil.
// Todas se renderizan como SVG vectorial local, sin solicitudes a servicios externos.
export type KidsSheetOptions={
 heading:string;ink:string;background:string;margin:number;
 childName?:string;kidTasks?:string[];
};
export const kidsSheetIds=[
 "trazado-nombre","nombre-grande","nombre-cajas","nombre-mira-copia",
 "nombre-escribir","nombre-colorear","nombre-inicial","nombre-buscar-letras",
 "nombre-buscar","nombre-recortar","nombre-plastilina","nombre-arcoiris",
 "numeros-repasar","tareas-ninos","rutina-infantil"
] as const;
const sheets=new Set<string>(kidsSheetIds);
export const isKidsSheet=(id:string)=>sheets.has(id);
export const isKidsNameSheet=(id:string)=>id.startsWith("nombre-")||id==="trazado-nombre";
export const isKidsTaskSheet=(id:string)=>id==="tareas-ninos"||id==="rutina-infantil";
export const defaultKidsTasks=["Ordenar juguetes","Tender la cama","Lavarse los dientes","Leer un rato","Hacer la tarea","Ayudar en casa","Preparar la mochila"];
const defaults:Record<string,string>={
 "trazado-nombre":"REPASO MI NOMBRE","nombre-grande":"MIS LETRAS GRANDES",
 "nombre-cajas":"LETRA POR LETRA","nombre-mira-copia":"MIRO, REPASO Y ESCRIBO",
 "nombre-escribir":"ESCRIBO SIN AYUDA","nombre-colorear":"COLOREO MI NOMBRE",
 "nombre-inicial":"MI PRIMERA LETRA","nombre-buscar-letras":"ENCUENTRO MIS LETRAS",
 "nombre-buscar":"BUSCO MI NOMBRE","nombre-recortar":"ARMO MI NOMBRE",
 "nombre-plastilina":"CONSTRUYO CON MASA","nombre-arcoiris":"MI NOMBRE EN COLORES",
 "numeros-repasar":"REPASO LOS NÚMEROS","tareas-ninos":"MIS TAREAS DE LA SEMANA",
 "rutina-infantil":"MI RUTINA DIARIA"
};
function escapeXml(value:string){return value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]||c));}
function fmt(n:number){return Number(n.toFixed(2));}
function attrs(obj:Record<string,string|number>){return Object.entries(obj).map(([k,v])=>k+'="'+escapeXml(String(v))+'"').join(" ");}
export function renderKidsSheet(id:string,s:KidsSheetOptions,w:number,h:number):string {
 // Diseño A4 proporcional: se adapta a otros papeles sin cortar contenido.
 const paperW=w,paperH=h;
 w=210;h=297;
 const ink=/^#[0-9a-f]{6}$/i.test(s.ink)?s.ink:"#334155";
 const bg=/^#[0-9a-f]{6}$/i.test(s.background)?s.background:"#ffffff";
 const m=Math.max(10,Math.min(30,s.margin||13)),r=w-m,inner=r-m,footer=h-8,top=m+20;
 const raw=(s.childName||"").trim().slice(0,22);
 const name=(raw||"MI NOMBRE").toLocaleUpperCase("es");
 const letters=Array.from(name).filter(c=>c!==" ").slice(0,18);
 const tasks=(s.kidTasks?.length?s.kidTasks:defaultKidsTasks).slice(0,7);
 const out:string[]=[];
 function add(el:string,values:Record<string,string|number>,inside=""){out.push("<"+el+" "+attrs(values)+">"+inside+"</"+el+">");}
 function line(x1:number,y1:number,x2:number,y2:number,color="#c1cbd6",th=.26,dash=""){
  add("line",{x1:fmt(x1),y1:fmt(y1),x2:fmt(x2),y2:fmt(y2),stroke:color,"stroke-width":th,...(dash?{"stroke-dasharray":dash}:{})});
 }
 function rect(x:number,y:number,rw:number,rh:number,fill="none",stroke="#b9c4d1",th=.26,rx=0,dash=""){
  add("rect",{x:fmt(x),y:fmt(y),width:fmt(Math.max(0,rw)),height:fmt(Math.max(0,rh)),rx,fill,stroke,"stroke-width":th,...(dash?{"stroke-dasharray":dash}:{})});
 }
 function txt(value:string,x:number,y:number,size=4,bold=false,color=ink,anchor="start",stroke="",dash=""){
  add("text",{x:fmt(x),y:fmt(y),"font-family":"Arial,Helvetica,sans-serif","font-size":fmt(size),"font-weight":bold?700:400,"text-anchor":anchor,fill:stroke?"none":color,...(stroke?{stroke,"stroke-width":.45,"stroke-dasharray":dash==="solid"?"none":dash||"1.3 1.5","stroke-linecap":"round","stroke-linejoin":"round"}:{})},escapeXml(value));
 }
 function circle(cx:number,cy:number,radius:number,fill="none",stroke="#94a3b8",th=.3){
  add("circle",{cx:fmt(cx),cy:fmt(cy),r:fmt(radius),fill,stroke,"stroke-width":th});
 }
 function guideline(y:number){
  line(m,y-10,r,y-10,"#ccd5e0",.22);line(m,y-5,r,y-5,"#b4c3d3",.22,"1 1.5");line(m,y,r,y,"#8fa1b6",.35);
 }
 function smallName(x:number,y:number,color=ink,outline=false,large=14){
  const size=Math.min(large,Math.max(4.5,(inner-12)/Math.max(3,name.length*.62)));
  txt(name,x,y,size,true,color,"start",outline?"#94a3b8":"",outline?"1.1 1.5":"");
 }
 rect(0,0,w,h,bg,bg);
 txt((s.heading.trim()||defaults[id]||"ACTIVIDAD").slice(0,60),m,m+4.5,5.5,true);
 line(m,m+9,r,m+9,ink,.45);
 txt("NOMBRE",m,top,2.9,true);
 line(m+20,top+.5,r*.66,top+.5);
 txt("FECHA",r*.69,top,2.9,true);
 line(r*.78,top+.5,r,top+.5);
 txt(id==="tareas-ninos"?"Cada día cuenta. ¡Seguí adelante!":id==="rutina-infantil"?"Una tarea a la vez. ¡Vos podés!":"Aprendé jugando, a tu propio ritmo.",m,top+12,3.2,false,"#64748b");
 const base=top+21;
 if(id==="trazado-nombre"||id==="nombre-grande"||id==="nombre-arcoiris"){
  const total=id==="nombre-grande"?5:id==="nombre-arcoiris"?6:8;
  const gap=Math.min(id==="nombre-grande"?36:28,(footer-base-8)/total);
  for(let i=0;i<total;i++){
   const y=base+gap*(i+1)-8;
   guideline(y);
   if(id==="nombre-grande"&&i===total-1)continue;
   if(id==="nombre-arcoiris")circle(m+5,y-7,3,["#e8798a","#eba54a","#e7ca59","#63ba9e","#79a4d4","#b69bd1"][i],"#a1aab7",.17);
   const x=m+(id==="nombre-arcoiris"?15:5);
   smallName(x,y-1.5,ink,i>0||id==="nombre-arcoiris",id==="nombre-grande"?22:16);
  }
 }else if(id==="nombre-cajas"){
  const length=Math.max(1,letters.length);
  const count=Math.min(12,length),cell=Math.min(19,(inner-6)/Math.max(1,count)),start=m+Math.max(0,(inner-cell*count)/2);
  txt("Observá cada letra, repasala y escribila debajo.",m,base+4,3.3);
  for(let pass=0;pass<Math.ceil(length/12);pass++){
   const slice=letters.slice(pass*12,pass*12+12),y=base+18+pass*49;
   slice.forEach((c,i)=>{const x=start+i*cell;rect(x,y,cell-1,18);txt(c,x+(cell-1)/2,y+13,11,true,ink,"middle");rect(x,y+20,cell-1,18)});
  }
  for(let i=0;i<3;i++){const y=base+145+i*22;guideline(y)}
 }else if(id==="nombre-mira-copia"){
  for(let k=0;k<3;k++){
   const y=base+15+k*65;
   txt("1 · MIRO",m,y-6,3.1,true);smallName(m+5,y+12,ink,false,12);
   txt("2 · REPASO",m,y+23,3.1,true);guideline(y+42);smallName(m+5,y+40,ink,true,12);
   txt("3 · ESCRIBO",m,y+54,3.1,true);guideline(y+73);
  }
 }else if(id==="nombre-escribir"){
  txt("MI MODELO",m,base+4,3.1,true);smallName(m+5,base+21,ink,false,15);
  for(let i=0;i<9;i++){const y=base+43+i*22;guideline(y);if(i<2)smallName(m+5,y-2,ink,true,13)}
 }else if(id==="nombre-colorear"||id==="nombre-plastilina"){
  const rows=id==="nombre-colorear"?3:Math.ceil(letters.length/4),gap=Math.min(61,(footer-base-8)/Math.max(1,rows));
  txt(id==="nombre-colorear"?"Pintá cada letra con tus colores favoritos.":"Formá las letras con tiras de masa sobre el papel.",m,base+4,3.3);
  if(id==="nombre-colorear"){
   for(let i=0;i<rows;i++){
    const y=base+18+i*gap,scale=Math.min(33,inner/Math.max(1,name.length*.62));
    txt(name,m+inner/2,y+Math.min(35,gap*.65),scale,true,ink,"middle","#9faac0","solid");
    line(m,y+gap-6,r,y+gap-6,"#e0e6ed",.2);
   }
  }else{
   for(let k=0;k<rows;k++){
    const chunk=letters.slice(k*4,k*4+4),y=base+18+k*gap,cw=inner/Math.max(1,chunk.length);
    chunk.forEach((l,i)=>{rect(m+i*cw,y,cw-2,gap-5,"#fff","#c4cbd5",.28,3);txt(l,m+i*cw+cw/2-1,y+gap*.68,Math.min(32,gap*.58),true,ink,"middle","#9baabf","solid")});
   }
  }
 }else if(id==="nombre-inicial"){
  const first=letters[0]||"A";
  txt("Pintá tu inicial y después repasá tu nombre.",m,base+4,3.3);
  rect(m+5,base+15,inner-10,125,"none","#e0e7ef",.3,5);
  txt(first,m+inner/2,base+120,105,true,ink,"middle","#8794a6","solid");
  txt("AHORA ESCRIBO MI NOMBRE",m,base+156,3.1,true);
  guideline(base+180);smallName(m+4,base+177,ink,true,16);
  guideline(base+210);
 }else if(id==="nombre-buscar-letras"){
  const unique=[...new Set(letters)];
  const alphabet="ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
  txt("Rodeá todas las letras de tu nombre.",m,base+4,3.4);
  txt("BUSCO:",m,base+17,3.1,true);
  txt(unique.join("   "),m+22,base+17,Math.min(7,inner/Math.max(3,unique.length*2.3)),true);
  const cols=9,rows=8,gapX=inner/cols,gapY=17,gridY=base+34;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
   const n=j*cols+i,chosen=n%4===0?unique[(j+i)%Math.max(1,unique.length)]||"A":alphabet[(n*7+5)%alphabet.length];
   const x=m+i*gapX,y=gridY+j*gapY;rect(x,y,gapX-1,gapY-1,"none","#d3dae3",.18,2);
   txt(chosen,x+(gapX-1)/2,y+11,7,true,ink,"middle");
  }
 }else if(id==="nombre-buscar"){
  txt("Observá el modelo y rodeá los nombres iguales.",m,base+3,3.2);
  txt(name,m+inner/2,base+19,11,true,ink,"middle");
  const others=[name.split("").reverse().join(""),name+"A",name.slice(1)||"A",name.slice(0,-1)+"O"];
  const cols=3,rows=6,cw=inner/cols,rh=26,y0=base+33;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
   const n=j*cols+i,x=m+i*cw,y=y0+j*rh,match=n%3===0;
   const value=match?name:others[(n+j)%others.length];
   rect(x+2,y,cw-4,rh-3,"none","#b6c3d1",.28,3);
   txt(value.slice(0,22),x+cw/2,y+rh*.61,Math.min(7,(cw-10)/Math.max(1,value.length*.68)),true,ink,"middle");
  }
 }else if(id==="nombre-recortar"){
  const max=Math.min(14,letters.length),cw=Math.min(17,inner/Math.max(1,max)),start=m+(inner-cw*max)/2;
  txt("Recortá las fichas y ponelas en orden.",m,base+3,3.3);
  txt("ESPACIOS PARA ORDENAR",m,base+19,3.1,true);
  for(let i=0;i<max;i++)rect(start+i*cw,base+28,cw-1,22,"none","#94a3b8",.3,2);
  txt("LETRAS PARA RECORTAR",m,base+92,3.1,true);
  const shuffled=letters.slice(0,max).sort((a,b)=>((letters.indexOf(a)*7+3)%max)-((letters.indexOf(b)*7+3)%max));
  shuffled.forEach((c,i)=>{const x=start+i*cw;rect(x,base+103,cw-1,24,"none","#8699ad",.35,1,"1.2 1.2");txt(c,x+(cw-1)/2,base+120,12,true,ink,"middle")});
  txt("Consejo: ordená primero y pegá después.",m,base+160,3.1);
  for(let i=0;i<3;i++)guideline(base+185+i*20);
 }else if(id==="numeros-repasar"){
  txt("Repasá cada número y escribilo de nuevo.",m,base+3,3.3);
  const cw=inner/2,step=40;
  for(let n=0;n<10;n++){
   const col=n%2,row=Math.floor(n/2),x=m+col*cw,y=base+17+row*step;
   rect(x,y,cw-3,step-3,"none","#e1e6eb",.23,2);
   txt(String(n),x+14,y+26,22,true,ink,"middle","#95a4b7","1.5 1.5");
   line(x+30,y+29,x+cw-10,y+29,"#8fa1b6",.3);
  }
 }else if(id==="tareas-ninos"){
  const ds=["L","M","X","J","V","S","D"],left=m+inner*.44,cw=(r-left)/7,start=base+17;
  txt("MARCÁ CADA DÍA QUE COMPLETES UNA TAREA",m,base+4,3.2,true);
  txt("TAREA",m,start-5,3.1,true);
  ds.forEach((d,i)=>txt(d,left+i*cw+cw/2,start-5,3.3,true,ink,"middle"));
  for(let i=0;i<7;i++){
   const y=start+i*23;rect(m,y,inner,22,i%2===0?"#f4f6f8":"none","#e1e6ec",.18,2);
   txt(tasks[i]||"Nueva tarea",m+3,y+13,Math.min(3.5,inner*.40/Math.max(1,(tasks[i]||"Tarea").length*.65)),false);
   ds.forEach((_,j)=>rect(left+j*cw+cw*.28,y+7,cw*.44,cw*.44,"none","#7e91a6",.25,1));
  }
  txt("MI META DE LA SEMANA",m,base+197,3.1,true);line(m,base+210,r,base+210);
 }else if(id==="rutina-infantil"){
  const labels=["MAÑANA","TARDE","NOCHE"],y0=base+12;
  labels.forEach((title,index)=>{
   const y=y0+index*75;rect(m,y,inner,68,"none","#d4dfe9",.3,4);
   rect(m,y,inner,11,"#e8eef5","#e8eef5",.1,3);
   txt(title,m+5,y+7.5,3.3,true);
   for(let j=0;j<2;j++){
    const ix=index*2+j,yy=y+24+j*24;
    rect(m+6,yy-4,4,4,"none","#7d92a8",.28,1);
    txt(tasks[ix]||"Mi tarea",m+16,yy,3.5);
    line(m+16,yy+3,r-7,yy+3,"#d1d9e2",.2);
   }
  });
 }
 line(m,footer-3,r,footer-3,"#e2e8f0",.2);
 txt("Liago",w/2,footer+2,2.8,false,"#aeb5bf","middle");
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+fmt(paperW)+'mm" height="'+fmt(paperH)+'mm" viewBox="0 0 210 297" preserveAspectRatio="xMidYMid meet">'+out.join("")+"</svg>";
}
