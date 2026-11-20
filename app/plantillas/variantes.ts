export type PaperVariant = {
 id:string; name:string; family:string; template:string; paper:string;
 landscape:boolean; spacing:number; margin:number; ink:string; subtitle?:string;
};
type Family = {family:string;template:string;count:number;names:string[];spaces?:number[];papers?:string[];style?:string};
const families:Family[]=[
 {family:"Papel pautado",template:"pautado",count:75,names:["College ruled","Wide ruled","Narrow ruled","Papel con margen","Papel de composición","Papel de recambio","Papel para reportero","Papel primario","Papel de cuaderno"],spaces:[5,6.35,7.1,8.7,10],papers:["A4","Carta","A5","Oficio","A3"]},
 {family:"Cuadrícula de puntos",template:"puntos",count:41,names:["Puntos finos","Dot grid 5 mm","Puntos 1/4 pulgada","Puntos 1/3 pulgada","Puntos media pulgada"],spaces:[3,4,5,5.08,6.35,8.47,10,12.7],papers:["A4","Carta","A5","A3"]},
 {family:"Blanco y listas",template:"blanco",count:5,names:["Papel blanco","Lista de comprobación","Lista pautada","Lista numerada","Lista de tareas"]},
 {family:"Reportero y taquigrafía",template:"gregg",count:3,names:["Papel Gregg","Papel de reportero","Papel de taquigrafía"]},
 {family:"Cuadrícula cuadrada",template:"cuadricula",count:152,names:["Cuadrícula estándar","Cuadrícula de guías gruesas","Cuadrícula milimetrada","Cuadrícula para diseño"],spaces:[2,2.5,3,4,5,5.08,6.35,8.47,10,12.7,25.4],papers:["A4","Carta","A5","Oficio","A3","A6"]},
 {family:"Planos de coordenadas",template:"cartesiano",count:3,names:["Papel cartesiano","Plano cartesiano","Primer cuadrante"]},
 {family:"Rectas numéricas",template:"recta",count:4,names:["Recta numérica en blanco","Recta numérica hasta 100","Recta de fracciones (octavos)","Recta numérica escolar"]},
 {family:"Cuadrículas con líneas guía",template:"tecnico",count:2,names:["Papel para punto de cruz","Papel técnico (cada 5 en negrita)"]},
 {family:"Cuadrículas isométricas",template:"isometrico",count:5,names:["Puntos isométricos 5 mm","Puntos isométricos 1/4 pulgada","Papel isométrico de líneas","Puntos isométricos gris","Papel isométrico técnico"]},
 {family:"Papel logarítmico",template:"logaritmico",count:4,names:["Papel logarítmico","Semi-log eje Y","Semi-log eje X","Log-log (1 década)"]},
 {family:"Hoja de trazado de nombres",template:"trazado-nombre",count:3,names:["Trazado de letras","Trazado de nombres","Trazado de números"]},
 {family:"Hoja de trazado de líneas",template:"trazado-lineas",count:5,names:["Práctica cursiva","D'Nealian","Papel infantil","Papel preescolar","Pauta de escritura triple"]},
 {family:"Papel Mi Zi Ge",template:"mi-zi-ge",count:4,names:["Hui Gong Ge","Jiu Gong Ge","Mi Zi Ge","Tian Zi Ge"]},
 {family:"Papel pautado manuscrito",template:"pentagrama",count:7,names:["Pauta con clave de fa","Pentagramas grandes","Pauta manuscrita","Pauta musical","Percusión","Pauta doble para piano","Pauta con clave de sol"]},
 {family:"TAB de guitarra con notación",template:"guitarra",count:6,names:["TAB de bajo 4 cuerdas","TAB de bajo 5 cuerdas","TAB de guitarra 6 cuerdas","TAB con notación","TAB de ukelele","Ukelele con pentagrama"]},
 {family:"Registro de cheques",template:"cheques",count:2,names:["Registro de cheques","Registro de cheques grande"]},
 {family:"Seguimiento de facturas",template:"facturas",count:2,names:["Seguimiento de facturas","Seguimiento de facturas grande"]},
 {family:"Tabla de tareas para niños",template:"tareas-ninos",count:2,names:["Tabla de tareas familiar","Tabla de tareas para niños"]},
 {family:"Hoja de presupuesto",template:"presupuesto",count:2,names:["Hoja de presupuesto","Presupuesto mensual"]},
 {family:"Storyboard",template:"comic",count:2,names:["Tira cómica","Storyboard"]},
 {family:"Fichas 4×6",template:"fichas",count:2,names:["Fichas 3×5","Fichas 4×6"]},
 {family:"Más estructuras de papel",template:"cornell",count:11,names:["Papel caligrafía","Partitura vocal SATB","Notas Cornell","Cuadrículas hexagonales","Gráficos polares","Historias con cuadro","Papel pautado francés","Caligrafía ornamental","Diagramas de acordes","Papel contable","Papel carta"]}
];
const extraTemplate:Record<string,string>={
 "Papel blanco":"blanco","Lista de comprobación":"lista","Lista pautada":"pautado","Lista numerada":"lista-numerada","Lista de tareas":"lista",
 "Papel para punto de cruz":"cuadricula","Papel técnico (cada 5 en negrita)":"tecnico",
 "Papel cartesiano":"cartesiano","Plano cartesiano":"cartesiano","Primer cuadrante":"cartesiano",
 "Recta numérica en blanco":"recta","Recta numérica hasta 100":"recta","Recta de fracciones (octavos)":"recta","Recta numérica escolar":"recta",
 "Papel isométrico de líneas":"isometrico",
 "Trazado de letras":"trazado-nombre","Trazado de nombres":"trazado-nombre","Trazado de números":"trazado-nombre",
 "Pauta con clave de fa":"pentagrama","Pauta manuscrita":"pentagrama","Pauta musical":"pentagrama","Percusión":"pentagrama","Pauta doble para piano":"piano","Pauta con clave de sol":"pentagrama",
 "TAB de bajo 4 cuerdas":"bajo","TAB de bajo 5 cuerdas":"bajo","TAB de guitarra 6 cuerdas":"guitarra","TAB con notación":"tab-notacion","TAB de ukelele":"ukelele","Ukelele con pentagrama":"ukelele",
 "Papel caligrafía":"caligrafia","Partitura vocal SATB":"conjunto","Notas Cornell":"cornell","Cuadrículas hexagonales":"hexagono","Gráficos polares":"polar","Historias con cuadro":"historias","Papel pautado francés":"frances","Caligrafía ornamental":"caligrafia","Diagramas de acordes":"acordes","Papel contable":"contable","Papel carta":"carta",
 "Tira cómica":"tira-comica","Storyboard":"comic",
};
const colors=["#333f53","#000000","#475569","#2153a4","#668070"];
const slug=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export const paperVariants:PaperVariant[]=families.flatMap(f=>{
 const papers=f.papers||["A4","Carta","A5"];
 const spaces=f.spaces||[5,7.1,8.7,10,12.7];
 return Array.from({length:f.count},(_,index)=>{
 const label=f.names[index%f.names.length];
 // Every preset has its own deterministic combination of format, spacing and margins.
 const paper=papers[Math.floor(index/f.names.length)%papers.length];
 const spacing=spaces[Math.floor(index/(f.names.length*papers.length))%spaces.length];
 const landscape=Math.floor(index/(f.names.length*papers.length*spaces.length))%2===1;
 const margin=[10,12,15,20,25][Math.floor(index/(f.names.length*papers.length*spaces.length*2))%5];
 const template=extraTemplate[label]||(
 f.family==="Cuadrícula cuadrada"&&label.includes("gruesas")?"tecnico":f.template);
 const suffix=f.count>f.names.length?` · ${paper} · ${spacing} mm · ${landscape?"horizontal":"vertical"} · ${margin} mm margen`:"";
 return {id:`v-${slug(f.family)}-${index+1}`,name:label+suffix,family:f.family,template,paper,landscape,spacing,margin,ink:colors[index%colors.length],subtitle:label.includes("nombres")?"Adrián":undefined};
 });
});
export const variantFamilies=families.map(f=>({name:f.family,count:f.count}));
export const variantTotal=paperVariants.length;
