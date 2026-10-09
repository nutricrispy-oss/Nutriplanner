import {calc,escala} from './nutricion.js';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
export const DIAS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
export const SLOTS={desayuno:'Desayuno',mediamanana:'Media mañana',almuerzo:'Almuerzo',merienda:'Merienda',cena:'Cena'};
export function fechaISO(d=new Date()){const z=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return z.toISOString().slice(0,10);}
export function lunesDe(d=new Date()){const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return fechaISO(x);}
export const slotsPara=n=>{n=+n||3;return n<=3?['desayuno','almuerzo','cena']:n===4?['desayuno','almuerzo','merienda','cena']:['desayuno','mediamanana','almuerzo','merienda','cena'];};
const tipoDe=s=>s==='mediamanana'||s==='merienda'?'colacion':s;
const malos=p=>[...(p.alergias||[]),...(p.noGusta||[])].map(norm).filter(Boolean);
export function excluida(r,p,mapa){
  const bad=malos(p);if(!bad.length)return false;
  return bad.some(b=>norm(r.n).includes(b)||r.ing.some(([id])=>norm(mapa[id]?.n).includes(b)));
}
export const nutPorcion=(r,ctx)=>escala(calc(r.ing,ctx.mapa),1/r.por);
export function nutMeal(m,ctx){const r=ctx.porId[m.rid];if(!r)return calc([],ctx.mapa);return escala(calc(m.ing||r.ing,ctx.mapa),m.factor/r.por);}
export function totalDia(dia,ctx,soloHechas=false){
  const t=calc([],ctx.mapa);
  for(const m of Object.values(dia.comidas)){if(soloHechas&&!m.hecha)continue;const n=nutMeal(m,ctx);for(const k in t)t[k]+=n[k];}
  return t;
}
export function candidatos(slot,ctx){
  const tipo=tipoDe(slot),bajo=ctx.perfil.enfoque==='Bajo en carbohidratos';
  return ctx.recetas.filter(r=>r.tags.includes(tipo)&&!excluida(r,ctx.perfil,ctx.mapa)&&(!bajo||tipo==='colacion'||nutPorcion(r,ctx).cn<=35));
}
function puntaje(r,ctx,usados){
  let s=Math.random();
  if(ctx.favs.includes(r.id))s+=1;
  s-=2*(usados[r.id]||0);
  const cu=(ctx.perfil.cuesta||[]).map(norm).filter(Boolean);
  if(cu.some(c=>r.ing.some(([id])=>norm(ctx.mapa[id]?.n).includes(c))))s-=.5;
  return s;
}
export function elegir(slot,ctx,usados,evitar=[]){
  const c=candidatos(slot,ctx).filter(r=>!evitar.includes(r.id));
  if(!c.length)return null;
  return c.map(r=>[puntaje(r,ctx,usados),r]).sort((a,b)=>b[0]-a[0])[0][1];
}
export function ajustar(comidas,ctx){
  const T=+ctx.perfil.kcal;if(!T)return;
  const tot=Object.values(comidas).reduce((s,m)=>s+nutMeal(m,ctx).kcal,0);if(!tot)return;
  const k=Math.min(1.6,Math.max(.6,T/tot));
  for(const m of Object.values(comidas))m.factor=Math.max(.25,Math.round(m.factor*k*4)/4);
}
export function armarDia(ctx,usados){
  const comidas={};
  for(const s of slotsPara(ctx.perfil.comidas)){const r=elegir(s,ctx,usados);if(r){comidas[s]={rid:r.id,factor:1,hecha:false};usados[r.id]=(usados[r.id]||0)+1;}}
  ajustar(comidas,ctx);return {comidas};
}
export function generarSemana(ctx){const u={};return {lunes:lunesDe(),creada:new Date().toISOString(),dias:Array.from({length:7},()=>armarDia(ctx,u))};}
export function alternativas(slot,ctx,actual,n=3){
  const u={};return candidatos(slot,ctx).filter(r=>r.id!==actual).map(r=>[puntaje(r,ctx,u),r]).sort((a,b)=>b[0]-a[0]).slice(0,n).map(x=>x[1]);
}
export function cambiarComida(dia,slot,rid,ctx){
  const old=nutMeal(dia.comidas[slot],ctx).kcal,r=ctx.porId[rid];
  const base=nutPorcion(r,ctx).kcal||1;
  const f=Math.min(2,Math.max(.5,Math.round(old/base*4)/4))||1;
  dia.comidas[slot]={rid,factor:f,hecha:false};
}
export function sustitutos(id,g,ctx){
  const a=ctx.mapa[id];if(!a)return[];
  const base=calc([[id,g]],ctx.mapa),bad=malos(ctx.perfil);
  return Object.values(ctx.mapa).filter(x=>x.id!==id&&x.cat===a.cat&&!bad.some(b=>norm(x.n).includes(b)))
   .map(x=>{const t=calc([[x.id,g]],ctx.mapa);return {id:x.id,n:x.n,d:{kcal:t.kcal-base.kcal,p:t.p-base.p,c:t.c-base.c}};})
   .sort((u,v)=>Math.abs(u.d.kcal)-Math.abs(v.d.kcal)).slice(0,6);
}
