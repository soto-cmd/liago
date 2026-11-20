// Ilustraciones SVG originales y vectoriales de Liago, sin recursos externos.
export const kidsThemes=[
{id:"simple",label:"Sencillo"},{id:"arcoiris",label:"Arcoíris"},
{id:"animales",label:"Animales"},{id:"espacio",label:"Espacio"},
{id:"jardin",label:"Jardín"},{id:"estaciones",label:"Estaciones"},
{id:"celebracion",label:"Celebración"}] as const;
export type KidsTheme=typeof kidsThemes[number]["id"];
const palettes:Record<KidsTheme,[string,string,string]>={
simple:["#f3f5f8","#65738b","#b1c1d2"],
arcoiris:["#f5f1fb","#62618c","#b78dbb"],
animales:["#fbf3e7","#87664e","#c99966"],
espacio:["#eef1fc","#525f92","#8f9bdd"],
jardin:["#eef8ef","#4b7967","#7eaf87"],
estaciones:["#fff7e9","#946f54","#d4a16e"],
celebracion:["#fff0f6","#8b6289","#d38dad"]};
function star(x:number,y:number,c:string){
return '<path transform="translate('+x+' '+y+')" d="M0 -4 L1.4 -1.3 4.2 -1 2 1 2.7 4 0 2.6 -2.7 4 -2 1 -4.2 -1 -1.4 -1.3Z" fill="'+c+'" stroke="#998aa8" stroke-width=".4"/>';
}
function rainbow(){
const colors=["#dd90a5","#e3b57b","#e8d18e","#91b9a0","#92b6df","#b4a2d2"];
return colors.map((c,i)=>'<path d="M'+(-13+i*1.7)+' 9 A'+(13-i*1.7)+' '+(13-i*1.7)+' 0 0 1 '+(13-i*1.7)+' 9" fill="none" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round"/>').join("")+
'<path d="M-18 10Q-19 5 -15 5Q-12 0 -9 5Q-4 4 -5 10Z M5 10Q4 5 8 5Q12 0 15 5Q19 5 18 10Z" fill="white" stroke="#9dadc4" stroke-width=".6"/>';
}
function animal(kind:"fox"|"bear"|"rabbit"){
let shape=kind==="fox"?'<path d="M-9 -5L-8 -12L-2 -9L3 -9L8 -12L9 -5Q10 7 0 9Q-10 7 -9 -5" fill="#efbc8b"/><path d="M-9 -4Q0 2 9 -4Q6 9 0 9Q-6 9 -9 -4" fill="#fff1e0"/>':kind==="bear"?'<circle cx="-7" cy="-7" r="4" fill="#c79b74"/><circle cx="7" cy="-7" r="4" fill="#c79b74"/><circle r="9" fill="#dcbb9b"/><ellipse cy="4" rx="5" ry="3" fill="#f8e6ce"/>':'<ellipse cx="-5" cy="-13" rx="3.3" ry="10" fill="#fff" stroke="#c7aaa0" stroke-width=".6"/><ellipse cx="5" cy="-13" rx="3.3" ry="10" fill="#fff" stroke="#c7aaa0" stroke-width=".6"/><circle r="9" fill="#fffaf5" stroke="#c7aaa0" stroke-width=".6"/>';
return '<g stroke="#aa897a" stroke-width=".6">'+shape+'<circle cx="-3" cy="0" r=".8" fill="#4d5262" stroke="none"/><circle cx="3" cy="0" r=".8" fill="#4d5262" stroke="none"/><path d="M-2 3Q0 5 2 3" fill="none"/><circle cx="-6" cy="3" r="1.4" fill="#eeb6b8" stroke="none"/><circle cx="6" cy="3" r="1.4" fill="#eeb6b8" stroke="none"/></g>';
}
function flower(){
let petals="";for(let i=0;i<6;i++)petals+='<ellipse transform="rotate('+(i*60)+')" cx="0" cy="-5" rx="2.5" ry="4" fill="'+(i%2?"#e8aec4":"#f6c7b5")+'" stroke="#d49db4" stroke-width=".4"/>';
return '<g>'+petals+'<circle r="2.3" fill="#f3d78d"/><path d="M0 6V16 M0 12Q-7 6 -6 12Q-3 15 0 12 M0 12Q7 6 7 12Q4 15 0 12" stroke="#6ca184" fill="#b2d5ad" stroke-width=".6"/></g>';
}
function leaf(c="#9bc79c"){return '<path d="M0 10Q-12 -2 0 -12Q12 -2 0 10Z" fill="'+c+'" stroke="#6c9984" stroke-width=".7"/><path d="M0 10V-6M0 4L-4 -2M0 0L4 -5" fill="none" stroke="#6c9984" stroke-width=".5"/>';}
function sun(){return '<circle r="5" fill="#f6dda1" stroke="#d8ac6e" stroke-width=".6"/><path d="M0 -9V-7M0 7V9M-9 0H-7M7 0H9 M-6 -6L-5 -5M6 6L5 5 M6 -6L5 -5M-6 6L-5 5" stroke="#d8ac6e" stroke-width=".8" stroke-linecap="round"/><path d="M-2 1Q0 3 2 1" fill="none" stroke="#a7815c" stroke-width=".5"/>';}
function moon(){return '<path d="M5 -9Q-5 -6 -4 2Q-2 10 6 8Q0 14 -7 8Q-15 -4 -2 -11Q2 -12 5 -9Z" fill="#e1d9f7" stroke="#949ac6" stroke-width=".7"/>';}
function balloon(c:string){return '<ellipse cy="-3" rx="5" ry="7" fill="'+c+'" stroke="#b78dab" stroke-width=".6"/><path d="M0 4L-1 6H1Z M0 6Q6 14 0 19" stroke="#ad879f" fill="none" stroke-width=".6"/><ellipse cx="-2" cy="-5" rx="1" ry="2.5" fill="#fff" opacity=".7"/>';}
function motif(theme:KidsTheme):string{
switch(theme){
case "arcoiris":return '<g transform="translate(22 12)">'+rainbow()+'</g><g transform="translate(4 5) scale(.5)">'+sun()+'</g>'+star(43,5,"#f1dba8");
case "animales":return '<g transform="translate(8 14) scale(.7)">'+animal("fox")+'</g><g transform="translate(25 14) scale(.7)">'+animal("bear")+'</g><g transform="translate(43 14) scale(.7)">'+animal("rabbit")+'</g>';
case "espacio":return '<g transform="translate(20 14)"><circle r="8" fill="#b5c9ed" stroke="#798cb4" stroke-width=".8"/><ellipse rx="14" ry="4" transform="rotate(-23)" fill="none" stroke="#d6aecd" stroke-width="2.2"/></g><g transform="translate(40 12) rotate(25)"><path d="M0 -10Q8 -2 5 6H-5Q-8 -2 0 -10Z" fill="#fff" stroke="#8b98c1" stroke-width=".7"/><circle cy="-1" r="2.6" fill="#a9d9ed"/><path d="M-5 2L-9 8H-5M5 2L9 8H5" fill="#e9b8ca"/><path d="M-2 6L0 12L2 6" fill="#f6cb8d"/></g>'+star(6,4,"#e4c588");
case "jardin":return '<g transform="translate(8 12) scale(.75)">'+flower()+'</g><g transform="translate(30 11) scale(1)">'+flower()+'</g><g transform="translate(44 13) scale(.72)">'+leaf()+'</g>';
case "estaciones":return '<g transform="translate(8 11) scale(.8)">'+sun()+'</g><g transform="translate(26 12)"><path d="M-11 5Q-13 0 -7 -2Q-5 -10 1 -7Q6 -9 9 -2Q15 -1 12 5Z" fill="#fff" stroke="#a0b9cd" stroke-width=".8"/><path d="M-5 8L-7 13M2 8L0 13M9 8L7 13" stroke="#8db8db" stroke-width="1"/></g><g transform="translate(44 10) scale(.7)">'+leaf("#ddb47d")+'</g>';
case "celebracion":return '<path d="M3 0L8 14L13 0Z" fill="#e7b3c6"/><path d="M15 0L20 14L25 0Z" fill="#dac5ee"/><path d="M27 0L32 14L37 0Z" fill="#f2d59c"/><g transform="translate(43 8)">'+balloon("#f1b9ce")+'</g>'+star(9,24,"#e7c386");
default:return "";
}}
export function renderKidsDecoration(theme:KidsTheme):string {
if(theme==="simple")return "";
const colors=palettes[theme]||palettes.simple,art=motif(theme);
const accents=Array.from({length:6},(_,i)=>{
const y=77+i*36;
const symbol=theme==="arcoiris"?'<g transform="scale(.25)">'+rainbow()+'</g>':theme==="animales"?'<g transform="scale(.35)">'+animal("rabbit")+'</g>':theme==="espacio"?star(0,0,"#c3cbef"):theme==="jardin"?'<g transform="scale(.35)">'+flower()+'</g>':theme==="estaciones"?'<g transform="scale(.42)">'+leaf("#e4be8c")+'</g>':star(0,0,"#e7b5cd");
return '<g transform="translate(6 '+y+')">'+symbol+'</g><g transform="translate(204 '+y+')">'+symbol+'</g>';
}).join("");
return '<g aria-hidden="true"><rect x="8" y="8" width="194" height="46" rx="7" fill="'+colors[0]+'" stroke="'+colors[2]+'" stroke-width=".3"/><rect x="9" y="62" width="192" height="215" rx="3" fill="none" stroke="'+colors[2]+'" stroke-width=".28"/><g transform="translate(145 9) scale(.88)">'+art+'</g>'+accents+'<path d="M12 284H198" stroke="'+colors[2]+'" stroke-width=".3"/><g transform="translate(171 284) scale(.35)">'+art+'</g></g>';
}
export function kidsThemeInk(theme:KidsTheme):string{return (palettes[theme]||palettes.simple)[1];}
