// Imprimibles educativos originales de Liago: SVG vectorial sin servicios externos.
export const learningIds = [
 "aprender-inicial","aprender-buscar-letras","aprender-abecedario",
 "aprender-numeros","aprender-contar","aprender-sumas",
 "aprender-restas","aprender-formas","aprender-relacionar"
] as const;
export type LearningId = typeof learningIds[number];
export const isLearningId = (id:string):id is LearningId => learningIds.some(value=>value===id);
type Settings={heading:string;subtitle:string;traceInput?:string;ink:string;background:string;paper:string;landscape:boolean};
const alphabet="ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
const n=(x:number)=>Math.round(x*100)/100;
export function learningSvg(id:LearningId,s:Settings,w:number,h:number):string{
 // Coordenadas lógicas A4: se escala a las medidas reales que eligió la persona.
 const scale=Math.min(w/210,h/297),pageW=w/scale,pageH=h/scale;
 const left=14,right=pageW-14,width=right-left;
 const ink=/^#[0-9a-f]{3,8}$/i.test(s.ink)?s.ink:"#26354a";
 const bg=/^#[0-9a-f]{3,8}$/i.test(s.background)?s.background:"#ffffff";
 let art="";
 const txt=(content:string,x:number,y:number,size=4,bold=false,anchor="start",color=ink,extra="")=>{
  art+=`<text x="${n(x)}" y="${n(y)}" fill="${color}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${bold?"700":"400"}" text-anchor="${anchor}" ${extra}>${esc(content)}</text>`;
 };
 const ln=(x1:number,y1:number,x2:number,y2:number,stroke="#b6c0cc",sw=.3,dash="")=>{
  art+=`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${sw}" ${dash?`stroke-dasharray="${dash}"`:""}/>`;
 };
 const rect=(x:number,y:number,bw:number,bh:number,fill="none",stroke="#bdc7d0",radius=1.8)=>{
  art+=`<rect x="${n(x)}" y="${n(y)}" width="${n(bw)}" height="${n(bh)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width=".4"/>`;
 };
 const circle=(x:number,y:number,r:number,stroke=ink,fill="none",sw=.4)=>{art+=`<circle cx="${n(x)}" cy="${n(y)}" r="${r}" stroke="${stroke}" stroke-width="${sw}" fill="${fill}"/>`};
 const lineGuides=(x:number,y:number,full:number)=>{ln(x,y,x+full,y,"#cad2db");ln(x,y-8,x+full,y-8,"#cbd2db",.23,"1.5 1.5");ln(x,y-17,x+full,y-17,"#cad2db")};
 const seedName=(s.traceInput||s.subtitle||"LIA").trim().slice(0,22)||"LIA";
 const heading:Record<LearningId,string>={
  "aprender-inicial":"MI PRIMERA LETRA",
  "aprender-buscar-letras":"ENCUENTRA LAS LETRAS",
  "aprender-abecedario":"APRENDO EL ABECEDARIO",
  "aprender-numeros":"APRENDO LOS NÚMEROS",
  "aprender-contar":"CUENTO Y ESCRIBO",
  "aprender-sumas":"PRACTICO SUMAS",
  "aprender-restas":"PRACTICO RESTAS",
  "aprender-formas":"CONOZCO LAS FORMAS",
  "aprender-relacionar":"UNO NÚMERO Y CANTIDAD"
 };
 txt((s.heading.trim()||heading[id]).toUpperCase().slice(0,52),left,23,6,true);
 ln(left,29,right,29,"#607389",.55);
 txt("Nombre:",left,37,2.9);ln(left+16,38,left+103,38);
 txt("Fecha:",right-61,37,2.9);ln(right-48,38,right,38);
 const innerTop=48;
 if(id==="aprender-inicial"){
  const name=seedName.toLocaleUpperCase("es");
  txt("Mirá la inicial de tu nombre, coloreala y después escribí tu nombre.",left,47,3.2);
  const first=name[0]||"L";
  txt(first,pageW/2,128,104,true,"middle","#ffffff",'stroke="#49637e" stroke-width="1.1"');
  txt("MI NOMBRE",left,159,3.6,true);
  txt(name,left,180,20,true,"start","#cbd3db",'stroke="#9aa8b9" stroke-width=".4" stroke-dasharray="1.2 1.2"');
  for(let i=0;i<3;i++)lineGuides(left,202+i*26,width);
  txt("Pintá tu letra favorita y volvé a escribir tu nombre.",left,281,3);
 }else if(id==="aprender-buscar-letras"){
  const selected=[...new Set(seedName.toUpperCase().split("").filter(a=>alphabet.includes(a)))].slice(0,10);
  const targets=selected.length?selected:["L","I","A"];
  txt("Rodeá las letras que forman tu nombre:",left,49,3.3);
  txt(seedName.toUpperCase(),left+98,50,6.5,true);
  txt("BUSCÁ ESTAS LETRAS:",left,67,3,true);
  targets.forEach((letter,i)=>{rect(left+i*16,72,13,13,"#f0f4f8");txt(letter,left+i*16+6.5,81.3,6,true,"middle")});
  const cols=9,rows=8,step=Math.min(18,width/cols);
  const baseX=(pageW-cols*step)/2+step/2;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const pos=row*cols+col,index=(pos*17+row*13+col*7)%alphabet.length;
   const letter=pos%4===0?targets[(pos+row)%targets.length]:alphabet[index];
   const x=baseX+col*step,y=103+row*18;
   circle(x,y,6.9,"#c5cdd7");
   txt(letter,x,y+2,6,true,"middle");
  }
  txt("¿Cuántas letras encontraste?",left,265,3.5);rect(left+84,257,20,12);
 }else if(id==="aprender-abecedario"){
  txt("Repasá cada letra y escribí una palabra que empiece con ella.",left,48,3.2);
  const cols=5,gap=3,cw=(width-(cols-1)*gap)/cols,ch=35;
  alphabet.forEach((letter,i)=>{const col=i%cols,row=Math.floor(i/cols),x=left+col*(cw+gap),y=55+row*39;
   rect(x,y,cw,ch,"#fbfcfd");txt(letter,x+5,y+16,15,true,"start","#cbd3dc",'stroke="#a8b5c4" stroke-width=".4" stroke-dasharray="1.5 1.5"');ln(x+4,y+28,x+cw-4,y+28);
  });
 }else if(id==="aprender-numeros"){
  txt("Contá, repasá los números y escribilos en las líneas.",left,48,3.2);
  const cols=4,gap=5,cw=(width-3*gap)/cols,ch=36;
  for(let num=1;num<=20;num++){const row=Math.floor((num-1)/cols),col=(num-1)%cols,x=left+col*(cw+gap),y=56+row*44;
   rect(x,y,cw,ch);txt(String(num),x+7,y+23,19,true,"start","#d0d7df",'stroke="#a2aebd" stroke-width=".5" stroke-dasharray="1.5 1.5"');
   ln(x+4,y+31,x+cw-4,y+31);
  }
 }else if(id==="aprender-contar"){
  txt("Contá los objetos, anotá la cantidad y después colorealos.",left,48,3.2);
  const quantities=[2,4,6,3,5,8];
  quantities.forEach((quantity,i)=>{const y=62+i*34;rect(left,y,width,28,"#fbfcfd");
   for(let k=0;k<quantity;k++){const x=left+12+k*15;
    circle(x,y+14,4.2,"#49637e");}
   txt("¿Cuántos hay?",right-64,y+17,3.2);rect(right-23,y+6,17,16);
  });
 }else if(id==="aprender-sumas"||id==="aprender-restas"){
  const subtract=id==="aprender-restas";
  txt(subtract?"Resolvé las restas y escribí el resultado.":"Resolvé las sumas y escribí el resultado.",left,48,3.2);
  const problems=Array.from({length:12},(_,i)=>{const a=subtract?5+(i*3)%15:1+(i*7)%10;const b=subtract?1+(i*5)%a:1+(i*3)%10;return [a,b]});
  problems.forEach(([a,b],i)=>{const col=i%2,row=Math.floor(i/2),cw=(width-8)/2,x=left+col*(cw+8),y=58+row*35;
   rect(x,y,cw,29,"#fbfcfd");
   txt(`${a} ${subtract?"−":"+"} ${b} =`,x+8,y+18,9,true);
   ln(x+cw-31,y+22,x+cw-6,y+22,"#607389",.5);
  });
 }else if(id==="aprender-formas"){
  txt("Observá, repasá el contorno y coloreá las figuras.",left,48,3.2);
  const names=["CÍRCULO","CUADRADO","TRIÁNGULO","RECTÁNGULO","ROMBO","ÓVALO"];
  names.forEach((label,i)=>{const col=i%2,row=Math.floor(i/2),cw=(width-10)/2,x=left+col*(cw+10),y=58+row*70,cx=x+cw/2,cy=y+31;
   rect(x,y,cw,62,"#fbfcfd");
   if(i===0)circle(cx,cy,17,"#607389");
   if(i===1)rect(cx-17,cy-17,34,34,"none","#607389",0);
   if(i===2)art+=`<polygon points="${cx},${cy-20} ${cx-20},${cy+16} ${cx+20},${cy+16}" fill="none" stroke="#607389" stroke-width=".5"/>`;
   if(i===3)rect(cx-25,cy-14,50,28,"none","#607389",0);
   if(i===4)art+=`<polygon points="${cx},${cy-20} ${cx-20},${cy} ${cx},${cy+20} ${cx+20},${cy}" fill="none" stroke="#607389" stroke-width=".5"/>`;
   if(i===5)art+=`<ellipse cx="${cx}" cy="${cy}" rx="24" ry="15" fill="none" stroke="#607389" stroke-width=".5"/>`;
   txt(label,cx,y+57,3.5,true,"middle");
  });
 }else if(id==="aprender-relacionar"){
  txt("Uní cada número con el grupo que tiene la misma cantidad.",left,48,3.2);
  const values=[3,1,5,2,4],mixed=[4,2,5,1,3];
  values.forEach((number,i)=>{const y=69+i*40;
   circle(left+23,y,13,"#607389");
   txt(String(number),left+23,y+4.5,12,true,"middle");
  });
  mixed.forEach((quantity,i)=>{const y=69+i*40;
   rect(right-84,y-13,78,26,"#fbfcfd");
   const start=right-78;
   for(let j=0;j<quantity;j++)circle(start+9+j*14,y,4,"#607389");
  });
  txt("Usá una regla para trazar líneas entre las columnas.",left,280,3.1);
 }
 txt("Liago",pageW/2,pageH-8,2.8,false,"middle","#a9b2be");
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}mm" height="${n(h)}mm" viewBox="0 0 ${n(pageW)} ${n(pageH)}"><rect width="100%" height="100%" fill="${bg}"/>${art}</svg>`;
}
