// Clasificación de navegación: no altera los IDs ni los grupos históricos de las plantillas.
export const categories=[
 {id:"planificacion",name:"Planificación y calendarios",hint:"Agendas, planes diarios y semanales"},
 {id:"habitos",name:"Hábitos y seguimiento",hint:"Rutinas, desafíos y objetivos"},
 {id:"escritura",name:"Escritura y notas",hint:"Hojas rayadas, listas y apuntes"},
 {id:"aprendizaje",name:"Aprendizaje y caligrafía",hint:"Letras, trazado y práctica escolar"},
 {id:"matematicas",name:"Cuadrículas y técnica",hint:"Gráficos, números y papel técnico"},
 {id:"trabajo",name:"Trabajo y finanzas",hint:"Presupuestos, facturas y controles"},
 {id:"hogar",name:"Hogar y familia",hint:"Tareas, plantas y cocina"},
 {id:"lectura",name:"Lectura y entretenimiento",hint:"Libros, películas y lecturas"},
 {id:"musica",name:"Música y partituras",hint:"Pentagramas, guitarra y acordes"},
 {id:"creatividad",name:"Diseño y creatividad",hint:"Cómics, historias y storyboards"},
 {id:"deportes",name:"Deportes",hint:"Anotaciones y resultados"}
] as const;
export type CategoryId=typeof categories[number]["id"];
const groups:Record<string,CategoryId>={
 "Planificación":"planificacion","Lectura":"lectura","Registros":"hogar",
 "Música editable":"musica","Estudio visual":"creatividad","Deportes":"deportes",
 "Escritura y notas":"escritura","Matemáticas y técnica":"matematicas",
 "Práctica de escritura":"aprendizaje","Padres e hijos":"aprendizaje","Papel de música":"musica",
 "Formularios financieros":"trabajo","Diseños creativos":"creatividad",
 "Más estructuras de papel":"escritura"
};
const specific:Record<string,CategoryId>={
 "habitos":"habitos","reto":"habitos","entrenamiento":"habitos",
 "tareas-ninos":"hogar","rutina-infantil":"hogar","plantas":"hogar","receta":"hogar","peliculas":"lectura",
 "calendario":"planificacion","fichas":"aprendizaje","cornell":"escritura",
 "hexagono":"matematicas","polar":"matematicas","historias":"creatividad",
 "frances":"aprendizaje","caligrafia":"aprendizaje","acordes":"musica","conjunto":"musica",
 "contable":"trabajo","carta":"escritura","puntos":"matematicas",
 "trazado-nombre":"aprendizaje","trazado-lineas":"aprendizaje",
 "mi-zi-ge":"aprendizaje","comic":"creatividad","tira-comica":"creatividad"
};
const variantFamilies:Record<string,CategoryId>={
 "Papel pautado":"escritura","Cuadrícula de puntos":"matematicas",
 "Blanco y listas":"escritura","Reportero y taquigrafía":"escritura",
 "Cuadrícula cuadrada":"matematicas","Planos de coordenadas":"matematicas",
 "Rectas numéricas":"matematicas","Cuadrículas con líneas guía":"matematicas",
 "Cuadrículas isométricas":"matematicas","Papel logarítmico":"matematicas",
 "Hoja de trazado de nombres":"aprendizaje","Hoja de trazado de líneas":"aprendizaje",
 "Papel Mi Zi Ge":"aprendizaje","Papel pautado manuscrito":"musica",
 "TAB de guitarra con notación":"musica","Registro de cheques":"trabajo",
 "Seguimiento de facturas":"trabajo","Tabla de tareas para niños":"hogar",
 "Hoja de presupuesto":"trabajo","Storyboard":"creatividad",
 "Fichas 4×6":"aprendizaje","Más estructuras de papel":"escritura"
};
const aliases:Record<string,string>={
 "habitos":"registro de habitos habit tracker seguimiento de habitos rutina rutinas costumbres mensual",
 "plan-diario":"agenda diario horario prioridades tareas jornada planner",
 "plan-semanal":"agenda semanal semana organizador",
 "plan-mensual":"mes calendario mensual planificador",
 "plan-anual":"año anual calendario planificador",
 "plan-proyecto":"proyecto objetivos hitos metas riesgos recursos",
 "reto":"desafío desafio habitos seguimiento reto",
 "calendario":"mes fechas dias calendario mensual",
 "pautado":"rayas rayado lineas renglones cuaderno hojas",
 "pautado-primaria":"escolar niños renglones escritura",
 "lista":"checklist tareas pendientes casillas lista",
 "lista-numerada":"tareas numeracion lista",
 "puntos":"dot grid bullet journal puntos puntitos",
 "cuadricula":"cuadriculado milimetrado matematicas grafica grilla",
 "isometrico":"dibujo 3d geometria",
 "trazado-nombre":"letras nombres caligrafia escuela",
 "letter-tracing-worksheet":"abecedario letras alfabeto escribir niños",
 "trazado-lineas":"escritura primaria preescolar caligrafia",
 "cheques":"finanzas cuenta registro pagos",
 "facturas":"cuentas cobros pagos seguimiento",
 "presupuesto":"gastos dinero mensual ahorro",
 "tareas-ninos":"niños familia hogar tareas rutina",
 "rutina-infantil":"mañana tarde noche hábitos niños escuela hogar",
 "nombre-cajas":"letras en casillas nombre preescolar primaria",
 "nombre-recortar":"recortar pegar letras nombre papel",
 "nombre-buscar":"buscar encontrar reconocimiento de nombres",
 "nombre-buscar-letras":"letras alfabeto cuadrícula buscar",
 "nombre-mira-copia":"ver copiar repasar escribir",
 "nombre-escribir":"escribir caligrafia independiente",
 "nombre-colorear":"dibujar pintar colores letras",
 "nombre-plastilina":"masa moldear modelar letras",
 "nombre-arcoiris":"colores repasado letras",
 "numeros-repasar":"números 0 a 9 números trazado conteo"
};
export function categoryForTemplate(template:{id:string;group:string}):CategoryId{
 return specific[template.id]||groups[template.group]||"escritura";
}
export function categoryForVariant(variant:{template:string;family:string}):CategoryId{
 return variant.family==="Más estructuras de papel"
 ?specific[variant.template]||"escritura"
 :variantFamilies[variant.family]||specific[variant.template]||"escritura";
}
export function categoryLabel(id:string):string{
 return categories.find(c=>c.id===id)?.name||id;
}
export function normalizeSearch(text:string):string{
 return text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
export function searchMatches(query:string,parts:Array<string|undefined>):boolean{
 const terms=normalizeSearch(query).split(/\s+/).filter(Boolean);
 if(terms.length===0)return true;
 const haystack=normalizeSearch(parts.filter(Boolean).join(" "));
 return terms.every(term=>haystack.includes(term));
}
export function templateMatches(template:{id:string;name:string;group:string},query:string):boolean{
 return searchMatches(query,[template.name,template.group,categoryLabel(categoryForTemplate(template)),template.id,aliases[template.id]]);
}
export function variantMatches(variant:{id:string;name:string;family:string;template:string;paper:string},query:string):boolean{
 return searchMatches(query,[variant.name,variant.family,variant.paper,categoryLabel(categoryForVariant(variant)),aliases[variant.template]]);
}
