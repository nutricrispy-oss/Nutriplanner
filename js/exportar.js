import {ctx} from './vistas.js';
import * as M from './menu.js';
import {esc,r1,linea} from './nutricion.js';
import {armarLista,fmt} from './compras.js';
import {leer} from './db.js';
import {SECCIONES} from './datos.js';
import {horaSugerida} from './habitos.js';
const fF=i=>i.split('-').reverse().join('/');
const sumar=(l,n)=>{const d=new Date(l+'T12:00:00');d.setDate(d.getDate()+n);return M.fechaISO(d);};
const ings=(m,r)=>(m.ing||r.ing).map(([id,g])=>`${ctx.mapa[id]?.n||id} ${Math.round(g*m.factor/r.por)} g`).join(', ');
async function listaItems(){
  const inv=(await leer('despensa','inv'))||{},pr=(await leer('compras','precios'))||{},e=await leer('compras','estado');
  const est=e&&e.lunes===ctx.semana.lunes?e:{personas:1,soloPend:false,quitados:{},manuales:[]};
  return {items:armarLista(inv,pr,ctx.semana,ctx.porId,ctx.mapa,est).filter(i=>!est.quitados[i.id]&&i.falta>0),est};
}
async function html(conLista){
  const s=ctx.semana,p=ctx.perfil;
  let h=`<h1>Menú semanal</h1><p>${p.nombre?esc(p.nombre)+' · ':''}Semana del ${fF(s.lunes)} al ${fF(sumar(s.lunes,6))} · Generado el ${fF(M.fechaISO())}</p>`;
  s.dias.forEach((d,i)=>{
    const ks=Object.keys(M.SLOTS).filter(k=>d.comidas[k]);
    h+=`<section class="pd"><h2>${M.DIAS[i]} ${fF(sumar(s.lunes,i)).slice(0,5)}</h2>`+ks.map((k,ix)=>{const m=d.comidas[k],r=ctx.porId[m.rid];if(!r)return '';const hr=horaSugerida(p,ix,ks.length);
      return `<div class="pm"><b>${M.SLOTS[k]}${hr?' (≈ '+hr+')':''}: ${esc(r.n)}</b> · ${m.factor} porc. · ${r.t} min<br><small>${esc(ings(m,r))}</small><br><small>${esc(linea(M.nutMeal(m,ctx)))}</small></div>`;}).join('')
      +`<p><b>Total del día:</b> ${esc(linea(M.totalDia(d,ctx)))}</p></section>`;
  });
  if(conLista){const {items,est}=await listaItems();
    h+=`<section class="pd"><h2>Lista de compras</h2>`+Object.keys(SECCIONES).map(k=>{const L=items.filter(i=>i.sec===k),Mn=est.manuales.filter(m=>m.sec===k);if(!L.length&&!Mn.length)return '';
      return `<p><b>${SECCIONES[k]}</b></p><ul>${L.map(i=>`<li>${esc(i.n)}: ${fmt(i.falta,i.id)}</li>`).join('')}${Mn.map(m=>`<li>${esc(m.n)}${m.q?': '+esc(m.q):''}</li>`).join('')}</ul>`;}).join('')+'</section>';}
  return h+'<p><small>Valores nutricionales estimados con datos de referencia. No sustituyen la indicación de un médico o nutricionista.</small></p>';
}
async function texto(conLista){
  const s=ctx.semana,p=ctx.perfil;let t=`Menú semanal${p.nombre?' de '+p.nombre:''} (semana del ${fF(s.lunes)})\n`;
  s.dias.forEach((d,i)=>{t+=`\n${M.DIAS[i]}\n`;Object.keys(M.SLOTS).filter(k=>d.comidas[k]).forEach(k=>{const m=d.comidas[k];t+=`- ${M.SLOTS[k]}: ${ctx.porId[m.rid]?.n||'(receta eliminada)'} (${Math.round(M.nutMeal(m,ctx).kcal)} kcal)\n`;});});
  if(conLista){const {items,est}=await listaItems();t+='\nLista de compras\n';items.forEach(i=>t+=`☐ ${i.n}: ${fmt(i.falta,i.id)}\n`);est.manuales.forEach(m=>t+=`☐ ${m.n}${m.q?': '+m.q:''}\n`);}
  return t;
}
export async function exportarMenu(modo,conLista){
  if(!ctx.semana)return alert('Primero genera tu menú semanal.');
  if(modo==='comp'){
    const t=await texto(conLista);
    if(navigator.share){try{await navigator.share({title:'Menú semanal',text:t});return;}catch(e){if(e.name==='AbortError')return;}}
    return void window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');
  }
  let div=document.getElementById('imprimible');if(!div){div=document.createElement('div');div.id='imprimible';document.body.append(div);}
  div.innerHTML=await html(conLista);
  if(modo==='pdf')alert('En la pantalla siguiente elige "Guardar como PDF" como destino de impresión.');
  document.body.classList.add('imprimiendo');
  const fin=()=>{document.body.classList.remove('imprimiendo');div.innerHTML='';removeEventListener('afterprint',fin);};
  addEventListener('afterprint',fin);setTimeout(()=>window.print(),80);
}
