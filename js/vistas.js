import {leer,guardar,borrar,todo} from './db.js';
import {ALIMENTOS,RECETAS,FUENTE} from './datos.js';
import {calc,escala,r1,esc,linea} from './nutricion.js';
import * as M from './menu.js';
import {historialView} from './historial.js';
import * as H from './habitos.js';
export const ctx={pesos:[],despensa:{},incluirMar:false,perfil:null,recetas:[],porId:{},mapa:{},favs:[],semana:null};
const TAGS={desayuno:'Desayuno',almuerzo:'Almuerzo',cena:'Cena',colacion:'Colación'};
const hoy=()=>M.fechaISO(), idxHoy=()=>(new Date().getDay()+6)%7;
const esActual=()=>ctx.semana&&ctx.semana.lunes===M.lunesDe();
const fechaDia=i=>{const d=new Date(ctx.semana.lunes+'T12:00:00');d.setDate(d.getDate()+i);return M.fechaISO(d);};
const guardarSemana=()=>guardar('menus','semana-'+ctx.semana.lunes,ctx.semana);
const registro=async f=>(await leer('menus','registro-'+f))||{extras:[]};
const pc=(a,b)=>b?Math.round(a/b*100):0;
const sg=x=>(x>=0?'+':'−')+r1(Math.abs(x));
export async function cargar(perfil){
  ctx.perfil=perfil;
  const extra=await todo('alimentos'),propias=await todo('recetas');
  ctx.mapa={};[...ALIMENTOS,...extra].forEach(a=>ctx.mapa[a.id]=a);
  ctx.recetas=[...RECETAS,...propias];ctx.porId=Object.fromEntries(ctx.recetas.map(r=>[r.id,r]));
  ctx.favs=(await leer('ajustes','favs'))||[];
  ctx.despensa=(await leer('despensa','inv'))||{};
  ctx.pesos=(await todo('peso')).filter(x=>x&&x.f&&x.kg).sort((a,b)=>a.f.localeCompare(b.f)||a.ts-b.ts);
  ctx.semana=(await leer('menus','semana-'+M.lunesDe()))||null;
}
export function modal(html){
  const d=document.createElement('div');d.className='modal';
  d.innerHTML=`<div class="hoja" role="dialog" aria-modal="true">${html}</div>`;
  d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-x]'))d.remove();});
  document.body.append(d);return d;
}
const barra=(l,v,o,u)=>{const p=o?Math.min(100,Math.round(v/o*100)):0;return `<div class="bl"><span>${l}</span><span>${Math.round(v)}${o?' / '+Math.round(o):''} ${u}</span></div><div class="bar"><i style="width:${p}%"></i></div>`;};
const barras=t=>[['Calorías','kcal',ctx.perfil.kcal,'kcal'],['Proteínas','p',ctx.perfil.prot,'g'],['Carbohidratos','c',ctx.perfil.carb,'g'],['Grasas','g',ctx.perfil.grasa,'g'],['Fibra (mín.)','fi',ctx.perfil.fibra||25,'g']].map(([l,k,o,u])=>barra(l,t[k],+o||0,u)).join('');
async function consumido(fecha,dia){
  const t=dia?M.totalDia(dia,ctx,true):calc([],ctx.mapa),reg=await registro(fecha);
  const e=calc(reg.extras.map(x=>[x.id,x.g]),ctx.mapa);for(const k in t)t[k]+=e[k];
  return {t,reg};
}
const sinPerfil=c=>{c.innerHTML=`<div class="card"><h2>Primero crea tu perfil</h2><p class="mut">Necesitamos tus objetivos para armar el menú.</p><a class="btn blk" href="#inicio">Ir a Inicio</a></div>`;};

/* ---------- INICIO ---------- */
export async function inicioView(c){
  const p=ctx.perfil,dia=esActual()?ctx.semana.dias[idxHoy()]:null,{t}=await consumido(hoy(),dia);
  const prox=dia&&Object.keys(M.SLOTS).find(s=>dia.comidas[s]&&!dia.comidas[s].hecha);
  const aguaF='agua-'+hoy(),ag=(await leer('menus',aguaF))||{ml:0},obj=H.aguaObjetivo(p),ay=H.estadoAyuno(p);
  const pu=ctx.pesos.length?ctx.pesos[ctx.pesos.length-1].kg:p.peso;
  c.innerHTML=`<div class="card"><h2>Hola, ${esc(p.nombre)}</h2>${dia?`<p class="mut">Tu menú semanal está listo.</p>${prox?`<div class="nota"><b>Próxima comida:</b> ${M.SLOTS[prox]}, ${esc(ctx.porId[dia.comidas[prox].rid]?.n)}</div>`:'<p>Ya registraste todas las comidas de hoy.</p>'}<a class="btn blk" href="#menu">Ver mi menú</a>`:`<p class="mut">Aún no tienes menú para esta semana.</p><a class="btn blk" href="#menu">Generar menú semanal</a>`}</div>
  ${ay?`<div class="card"><h2>Ayuno ${esc(ay.prot)}</h2><p>${esc(ay.txt)}</p><p class="mut">Ventana de comida: ${ay.rango}</p></div>`:''}
  <div class="card"><h2>Progreso de hoy</h2>${barras(t)}<p class="mut">Cuenta las comidas marcadas como hechas y los alimentos que agregues en la calculadora.</p></div>
  <div class="card"><h2>Agua</h2>${barra('Hoy',ag.ml,obj||0,'ml')}${obj?'':'<p class="mut">La cantidad de líquidos la indica tu profesional; aquí solo llevas el registro.</p>'}<div class="fila"><button class="btn sec mini" data-ag="250">+250 ml</button><button class="btn sec mini" data-ag="500">+500 ml</button><button class="btn sec mini" data-ag="-250" aria-label="Deshacer 250 ml">Deshacer</button></div></div>
  <div class="card"><h2>Peso</h2><div class="kv"><span>Más reciente</span><b>${pu??'—'} kg</b></div><div class="kv"><span>Objetivo</span><b>${p.pesoObj||'—'} kg</b></div></div>
  <a class="btn sec blk" href="#compras">Lista de compras</a>`;
  c.onclick=async e=>{const b=e.target.closest('[data-ag]');if(!b)return;ag.ml=Math.max(0,Math.min(10000,ag.ml+ +b.dataset.ag));await guardar('menus',aguaF,ag);inicioView(c);};
}

let sel=idxHoy();
let modoMenu='semana';
export async function menuView(c){
  if(!ctx.perfil)return sinPerfil(c);
  c.innerHTML=`<div class="seg"><button class="btn ${modoMenu==='semana'?'':'sec'}" data-modo="semana">Semana</button><button class="btn ${modoMenu==='hist'?'':'sec'}" data-modo="hist">Historial</button></div><div id="mm"></div>`;
  c.onclick=e=>{const b=e.target.closest('[data-modo]');if(b){modoMenu=b.dataset.modo;menuView(c);}};
  const mm=c.querySelector('#mm');
  if(modoMenu==='hist')await historialView(mm);else await menuSemana(mm);
}
async function menuSemana(c){
  if(!ctx.perfil)return sinPerfil(c);
  c.onclick=e=>acciones(e,c);
  if(!ctx.semana){c.innerHTML=`<div class="card"><h2>Tu menú semanal</h2><p class="mut">Genera una semana según tus objetivos y preferencias. Después puedes cambiar cualquier comida.</p><button class="btn blk" data-act="gen">Generar menú semanal</button><button class="btn sec blk" data-act="copiar" style="margin-top:10px">Copiar semana anterior</button></div>`;return;}
  const dia=ctx.semana.dias[sel],{t:cons}=await consumido(fechaDia(sel),dia),plan=M.totalDia(dia,ctx);
  const slots=Object.keys(M.SLOTS).filter(s=>dia.comidas[s]);
  c.innerHTML=`<div class="dias">${M.DIAS.map((d,i)=>`<button class="${i===sel?'on':''}" data-act="dia" data-i="${i}" ${i===sel?'aria-current="true"':''}>${d}</button>`).join('')}</div>
  <div class="card"><h2>${M.DIAS[sel]} ${fechaDia(sel).slice(8)}/${fechaDia(sel).slice(5,7)}</h2><p class="mut">Planificado: ${Math.round(plan.kcal)} kcal · P ${r1(plan.p)} g · C neto ${r1(plan.cn)} g · Fibra ${r1(plan.fi)} g</p><p class="mut">Reparto de calorías: P ${pc(plan.p*4,plan.kcal)}% · C ${pc(plan.c*4,plan.kcal)}% · G ${pc(plan.g*9,plan.kcal)}%</p>${barras(cons)}<p class="mut">Barras: lo realmente consumido (comidas hechas + extras).</p></div>
  ${slots.map((s,ix)=>{const m=dia.comidas[s],r=ctx.porId[m.rid],n=M.nutMeal(m,ctx);return `<div class="card meal ${m.hecha?'hecha':''}"><div class="mh"><b>${M.SLOTS[s]}</b><span class="mut">${H.horaSugerida(ctx.perfil,ix,slots.length)?'≈ '+H.horaSugerida(ctx.perfil,ix,slots.length)+' · ':''}${r.t} min</span></div><h3>${esc(r.n)}</h3><p class="mut">${m.factor} porc. · ${linea(n)}</p><div class="fila"><button class="btn ${m.hecha?'sec':''} mini" data-act="hecha" data-s="${s}">${m.hecha?'Desmarcar':'Marcar hecha'}</button><button class="btn sec mini" data-act="cambiar" data-s="${s}">Cambiar</button><button class="btn sec mini" data-act="editar" data-s="${s}">Ver / editar</button></div></div>`;}).join('')||'<div class="card"><p class="mut">No hay recetas compatibles con tus restricciones. Agrega una propia en Recetas.</p></div>'}
  <div class="fila"><button class="btn sec" data-act="genDia">Regenerar este día</button><button class="btn sec" data-act="gen">Semana nueva</button></div>
  <button class="btn sec blk" data-act="bal" style="margin-top:10px">Balancear porciones del día</button>
  <button class="btn sec blk" data-act="copiar" style="margin-top:10px">Copiar semana anterior</button>
  <div class="card"><h2>Exportar</h2><label class="chk"><input type="checkbox" id="inclLista">Incluir lista de compras</label><div class="fila"><button class="btn mini" data-act="pdf">Guardar PDF</button><button class="btn sec mini" data-act="imp">Imprimir</button><button class="btn sec mini" data-act="comp">Compartir</button></div></div>`;
}
async function acciones(e,c){
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,s=b.dataset.s;
  if(a==='dia'){sel=+b.dataset.i;return menuSemana(c);}
  if(a==='gen'){if(ctx.semana&&!confirm('Esto reemplaza el menú de esta semana, incluidas las comidas marcadas. ¿Continuar?'))return;ctx.semana=M.generarSemana(ctx);await guardarSemana();return menuSemana(c);}
  if(a==='genDia'){if(!confirm('¿Regenerar este día?'))return;const u={};ctx.semana.dias.forEach((d,i)=>{if(i!==sel)Object.values(d.comidas).forEach(m=>u[m.rid]=(u[m.rid]||0)+1);});ctx.semana.dias[sel]=M.armarDia(ctx,u);await guardarSemana();return menuSemana(c);}
  if(a==='copiar'){
    const p=new Date(M.lunesDe()+'T12:00:00');p.setDate(p.getDate()-7);
    const ant=await leer('menus','semana-'+M.fechaISO(p));
    if(!ant)return alert('No hay una semana anterior guardada.');
    if(ctx.semana&&!confirm('Esto reemplaza el menú de esta semana. ¿Continuar?'))return;
    ctx.semana=JSON.parse(JSON.stringify(ant));ctx.semana.lunes=M.lunesDe();ctx.semana.dias.forEach(d=>Object.values(d.comidas).forEach(m=>m.hecha=false));
    await guardarSemana();return menuSemana(c);
  }
  if(a==='hecha'){const m=ctx.semana.dias[sel].comidas[s];m.hecha=!m.hecha;await guardarSemana();return menuSemana(c);}
  if(a==='bal'){M.balancear(ctx.semana.dias[sel].comidas,ctx);await guardarSemana();return menuSemana(c);}
  if(a==='pdf'||a==='imp'||a==='comp'){const x=await import('./exportar.js');return x.exportarMenu(a,!!c.querySelector('#inclLista')?.checked);}
  if(a==='cambiar')return cambiar(s,c);
  if(a==='editar')return editar(s,c);
}
function cambiar(s,c){
  const dia=ctx.semana.dias[sel],m=dia.comidas[s],mod=modal(''),h=mod.firstChild;
  const draw=()=>{const alts=M.alternativas(s,ctx,m.rid,3);
    h.innerHTML=`<h2>Alternativas: ${M.SLOTS[s]}</h2>${alts.length?alts.map(r=>{const n=M.nutPorcion(r,ctx);return `<div class="card"><b>${esc(r.n)}</b><p class="mut">${Math.round(n.kcal)} kcal · P ${r1(n.p)} g · C neto ${r1(n.cn)} g · ${r.t} min</p><button class="btn blk" data-pick="${r.id}">Usar esta</button></div>`;}).join(''):'<p class="mut">No hay otras recetas compatibles. Agrega una propia en Recetas.</p>'}<p class="mut">Se ajustan las porciones para conservar las calorías de la comida original.</p><div class="fila"><button class="btn sec" data-more>Ver otras</button><button class="btn sec" data-x>Cerrar</button></div>`;};
  h.onclick=async e=>{
    if(e.target.closest('[data-more]'))return draw();
    const b=e.target.closest('[data-pick]');if(!b)return;
    M.cambiarComida(dia,s,b.dataset.pick,ctx);await guardarSemana();mod.remove();menuSemana(c);
  };
  draw();
}
function editar(s,c){
  const dia=ctx.semana.dias[sel],m=dia.comidas[s],r=ctx.porId[m.rid];
  const ing=JSON.parse(JSON.stringify(m.ing||r.ing));let factor=m.factor,msg='';
  const mod=modal(''),h=mod.firstChild;
  const tot=()=>linea(escala(calc(ing,ctx.mapa),factor/r.por));
  const draw=()=>{h.innerHTML=`<h2>${esc(r.n)}</h2><p class="mut">${r.t} min · receta para ${r.por} porc.</p>
  <label for="ef">Porciones que comerás</label><input id="ef" type="number" inputmode="decimal" step="0.25" min="0.25" max="6" value="${factor}">
  <h3>Ingredientes (g o ml de la receta completa)</h3>${ing.map(([id,g],i)=>{const n=esc(ctx.mapa[id]?.n||id);return `<div class="ing"><span>${n}</span><input type="number" inputmode="decimal" min="1" max="5000" data-g="${i}" value="${g}" aria-label="Cantidad de ${n}"><button class="btn sec mini" data-sub="${i}">Cambiar</button></div>`;}).join('')}
  <div class="nota" id="tot">${tot()}</div><h3>Preparación</h3><ol>${r.pasos.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>${msg?`<p class="err" role="alert">${esc(msg)}</p>`:''}<div class="fila"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar cambios</button></div>`;};
  h.oninput=e=>{const t=e.target;if(t.dataset.g!==undefined)ing[+t.dataset.g][1]=+t.value;else if(t.id==='ef')factor=+t.value;h.querySelector('#tot').textContent=tot();};
  h.onclick=async e=>{
    const sb=e.target.closest('[data-sub]'),pk=e.target.closest('[data-new]');
    if(sb){const i=+sb.dataset.sub,o=M.sustitutos(ing[i][0],ing[i][1],ctx);
      h.innerHTML=`<h2>Cambiar ${esc(ctx.mapa[ing[i][0]]?.n)}</h2><p class="mut">Cambio nutricional con la misma cantidad (${ing[i][1]} g):</p>${o.map(x=>`<div class="card"><b>${esc(x.n)}</b><p class="mut">${sg(x.d.kcal)} kcal · P ${sg(x.d.p)} g · C ${sg(x.d.c)} g</p><button class="btn blk" data-new="${i}:${x.id}">Usar este</button></div>`).join('')||'<p class="mut">No hay sustitutos compatibles.</p>'}<button class="btn sec blk" data-back>Volver</button>`;return;}
    if(pk){const [i,id]=pk.dataset.new.split(':');ing[+i][0]=id;return draw();}
    if(e.target.closest('[data-back]'))return draw();
    if(e.target.closest('[data-ok]')){
      if(!(factor>=.25&&factor<=6))msg='Las porciones deben estar entre 0,25 y 6.';
      else if(ing.some(x=>!(x[1]>0&&x[1]<=5000)))msg='Cada cantidad debe estar entre 1 y 5000.';
      else{m.ing=ing;m.factor=factor;await guardarSemana();mod.remove();return menuSemana(c);}
      draw();
    }
  };
  draw();
}

/* ---------- RECETAS + CALCULADORA ---------- */
let pest='recetas';
export async function recetasView(c){
  if(!ctx.perfil)return sinPerfil(c);
  c.innerHTML=`<div class="seg"><button class="btn ${pest==='recetas'?'':'sec'}" data-tab="recetas">Recetas</button><button class="btn ${pest==='calc'?'':'sec'}" data-tab="calc">Calculadora</button></div><div id="sub"></div>`;
  c.onclick=e=>{const b=e.target.closest('[data-tab]');if(b){pest=b.dataset.tab;recetasView(c);}};
  const sub=c.querySelector('#sub');
  if(pest==='recetas')listaRecetas(sub);else await calculadora(sub);
}
export const ops=(a)=>a.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
function listaRecetas(sub){
  sub.innerHTML=`<div class="card"><label for="q">Buscar por nombre o ingrediente</label><input id="q" type="search" placeholder="Ej.: pollo">
  <div class="dos"><div><label for="ft">Tipo</label><select id="ft"><option value="">Todos</option>${ops(Object.entries(TAGS))}</select></div><div><label for="ftm">Tiempo</label><select id="ftm"><option value="">Cualquiera</option>${ops([[15,'Hasta 15 min'],[30,'Hasta 30 min'],[60,'Hasta 60 min']])}</select></div></div>
  <div class="dos"><div><label for="fp">Proteína/porción</label><select id="fp"><option value="">Cualquiera</option>${ops([[15,'Desde 15 g'],[25,'Desde 25 g'],[35,'Desde 35 g']])}</select></div><div><label for="fk">Calorías/porción</label><select id="fk"><option value="">Cualquiera</option>${ops([[300,'Hasta 300'],[500,'Hasta 500'],[700,'Hasta 700']])}</select></div></div>
  <label class="chk"><input type="checkbox" id="fr" checked>Respetar mis restricciones</label></div>
  <button class="btn blk" data-nueva>Crear receta propia</button><div id="lista"></div>`;
  const val=id=>sub.querySelector('#'+id),
  pintar=()=>{
    const q=M.fechaISO&&val('q').value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    const L=ctx.recetas.filter(r=>{const n=M.nutPorcion(r,ctx);
      if(val('fr').checked&&M.excluida(r,ctx.perfil,ctx.mapa))return false;
      if(val('ft').value&&!r.tags.includes(val('ft').value))return false;
      if(val('ftm').value&&r.t>+val('ftm').value)return false;
      if(val('fp').value&&n.p<+val('fp').value)return false;
      if(val('fk').value&&n.kcal>+val('fk').value)return false;
      if(q){const txt=(r.n+' '+r.ing.map(([id])=>ctx.mapa[id]?.n||'').join(' ')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');if(!txt.includes(q))return false;}
      return true;});
    val('lista').innerHTML=L.map(r=>{const n=M.nutPorcion(r,ctx),f=ctx.favs.includes(r.id);return `<div class="card"><b>${esc(r.n)}</b>${r.propia?' <span class="mut">(propia)</span>':''}<p class="mut">${Math.round(n.kcal)} kcal · P ${r1(n.p)} g · C neto ${r1(n.cn)} g · ${r.t} min · ${r.tags.map(t=>TAGS[t]||t).join(', ')}</p><div class="fila"><button class="btn sec mini" data-ver="${r.id}">Ver</button><button class="btn sec mini" data-fav="${r.id}" aria-pressed="${f}">${f?'♥ Favorita':'♡ Favorita'}</button><button class="btn mini" data-add="${r.id}">Al menú</button></div></div>`;}).join('')||'<p class="mut">No hay recetas con esos filtros.</p>';
  };
  sub.oninput=sub.onchange=pintar;
  sub.onclick=async e=>{
    const g=k=>e.target.closest(`[data-${k}]`)?.dataset[k];
    if(e.target.closest('[data-nueva]'))return nuevaReceta(sub);
    if(g('ver'))return verReceta(g('ver'),sub);
    if(g('fav')){const id=g('fav');ctx.favs=ctx.favs.includes(id)?ctx.favs.filter(x=>x!==id):[...ctx.favs,id];await guardar('ajustes','favs',ctx.favs);return pintar();}
    if(g('add'))return alMenu(g('add'));
  };
  pintar();
}
function verReceta(id,sub){
  const r=ctx.porId[id],n=M.nutPorcion(r,ctx);
  const mod=modal(`<h2>${esc(r.n)}</h2><p class="mut">${r.t} min · ${r.por} porc.</p><div class="nota">Por porción: ${linea(n)}</div><h3>Ingredientes</h3><ul>${r.ing.map(([i,g])=>`<li>${esc(ctx.mapa[i]?.n||i)}: ${g} g</li>`).join('')}</ul><h3>Preparación</h3><ol>${r.pasos.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="mut">${esc(FUENTE)}</p><div class="fila">${r.propia?'<button class="btn sec" data-del>Eliminar</button>':''}<button class="btn" data-x>Cerrar</button></div>`);
  mod.onclick=async e=>{if(e.target.closest('[data-del]')&&confirm('¿Eliminar esta receta? Los menús ya guardados que la usan dejarán de mostrarla.')){await borrar('recetas',id);await cargar(ctx.perfil);mod.remove();listaRecetas(sub);}};
}
function alMenu(id){
  if(!ctx.semana)return alert('Primero genera tu menú semanal en "Mi menú".');
  const mod=modal(`<h2>Agregar al menú</h2><label for="ad">Día</label><select id="ad">${M.DIAS.map((d,i)=>`<option value="${i}" ${i===idxHoy()?'selected':''}>${d}</option>`).join('')}</select><label for="as">Comida</label><select id="as">${ops(Object.entries(M.SLOTS))}</select><div class="fila"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Agregar</button></div>`);
  mod.addEventListener('click',async e=>{if(!e.target.closest('[data-ok]'))return;const i=+mod.querySelector('#ad').value,s=mod.querySelector('#as').value,d=ctx.semana.dias[i];
    if(d.comidas[s]&&!confirm('Esa comida ya tiene una receta. ¿Reemplazarla?'))return;
    d.comidas[s]={rid:id,factor:1,hecha:false};await guardarSemana();mod.remove();alert('Receta agregada al menú.');});
}
function nuevaReceta(sub){
  const st={n:'',por:1,t:15,tags:[],pasos:'',ing:[]};let msg='';
  const mod=modal(''),h=mod.firstChild;
  const leerF=()=>{const q=s=>h.querySelector(s);if(!q('#rn'))return;st.n=q('#rn').value;st.por=+q('#rp').value;st.t=+q('#rt').value;st.pasos=q('#rs').value;st.tags=[...h.querySelectorAll('[data-tag]:checked')].map(x=>x.dataset.tag);};
  const draw=()=>{h.innerHTML=`<h2>Nueva receta</h2><label for="rn">Nombre *</label><input id="rn" value="${esc(st.n)}"><div class="dos"><div><label for="rp">Porciones</label><input id="rp" type="number" inputmode="numeric" min="1" max="20" value="${st.por}"></div><div><label for="rt">Minutos</label><input id="rt" type="number" inputmode="numeric" min="1" max="600" value="${st.t}"></div></div>
  <p><b>Etiquetas</b></p>${Object.entries(TAGS).map(([k,v])=>`<label class="chk"><input type="checkbox" data-tag="${k}" ${st.tags.includes(k)?'checked':''}>${v}</label>`).join('')}
  <h3>Ingredientes *</h3>${st.ing.map(([id,g],i)=>`<div class="kv"><span>${esc(ctx.mapa[id]?.n)} · ${g} g</span><button class="btn sec mini" data-rm="${i}">Quitar</button></div>`).join('')}
  <div class="dos"><select id="ai" aria-label="Alimento">${Object.values(ctx.mapa).sort((a,b)=>a.n.localeCompare(b.n)).map(a=>`<option value="${a.id}">${esc(a.n)}</option>`).join('')}</select><input id="ag" type="number" inputmode="decimal" placeholder="Gramos" aria-label="Gramos"></div><button class="btn sec blk" data-addi style="margin-top:8px">Agregar ingrediente</button>
  <label for="rs">Preparación (un paso por línea)</label><textarea id="rs" rows="4">${esc(st.pasos)}</textarea>${msg?`<p class="err" role="alert">${esc(msg)}</p>`:''}<div class="fila"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar receta</button></div>`;};
  h.onclick=async e=>{
    if(e.target.closest('[data-rm]')){leerF();st.ing.splice(+e.target.closest('[data-rm]').dataset.rm,1);return draw();}
    if(e.target.closest('[data-addi]')){leerF();const g=+h.querySelector('#ag').value;if(!(g>0&&g<=5000)){msg='Ingresa una cantidad entre 1 y 5000.';return draw();}msg='';st.ing.push([h.querySelector('#ai').value,g]);return draw();}
    if(e.target.closest('[data-ok]')){leerF();
      if(!st.n.trim())msg='Escribe un nombre.';else if(!st.ing.length)msg='Agrega al menos un ingrediente.';
      else if(!(st.por>=1&&st.por<=20))msg='Porciones entre 1 y 20.';else if(!(st.t>=1&&st.t<=600))msg='Minutos entre 1 y 600.';
      else{const r={id:'u'+Date.now(),n:st.n.trim(),tags:st.tags.length?st.tags:['almuerzo'],por:st.por,t:st.t,ing:st.ing,pasos:st.pasos.split('\n').map(x=>x.trim()).filter(Boolean),propia:true};
        await guardar('recetas',r.id,r);await cargar(ctx.perfil);mod.remove();return listaRecetas(sub);}
      draw();}
  };
  draw();
}
async function calculadora(sub){
  const f=hoy(),dia=esActual()?ctx.semana.dias[idxHoy()]:null,{t:cons,reg}=await consumido(f,dia),plan=dia?M.totalDia(dia,ctx):null;
  let elegido=null;
  sub.innerHTML=`<div class="card"><h2>Hoy</h2>${barras(cons)}<p class="mut">Consumido: comidas marcadas como hechas más lo que agregues aquí. Carbohidratos netos: ${r1(cons.cn)} g · Fibra: ${r1(cons.fi)} g</p>${plan?`<p class="mut">Planificado para hoy: ${Math.round(plan.kcal)} kcal · P ${r1(plan.p)} g</p>`:''}</div>
  <div class="card"><h2>Agregar alimento</h2><label for="bq">Buscar</label><input id="bq" type="search" placeholder="Ej.: huevo"><div id="res"></div><div id="sel"></div><button class="btn sec blk" data-nuevo style="margin-top:12px">Crear alimento propio</button></div>
  <div class="card"><h2>Extras de hoy</h2>${reg.extras.length?reg.extras.map((x,i)=>`<div class="kv"><span>${esc(ctx.mapa[x.id]?.n||x.id)} · ${x.g} g</span><button class="btn sec mini" data-rm="${i}">Quitar</button></div>`).join(''):'<p class="mut">Aún no agregaste alimentos fuera del menú.</p>'}</div><p class="mut">${esc(FUENTE)}</p>`;
  const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  sub.oninput=e=>{if(e.target.id!=='bq')return;const q=norm(e.target.value.trim());
    sub.querySelector('#res').innerHTML=q?Object.values(ctx.mapa).filter(a=>norm(a.n).includes(q)).slice(0,8).map(a=>`<button class="btn sec blk" style="margin-top:6px;justify-content:flex-start" data-pick="${a.id}">${esc(a.n)}</button>`).join('')||'<p class="mut">Sin resultados. Puedes crear el alimento.</p>':'';};
  sub.onclick=async e=>{
    const pk=e.target.closest('[data-pick]');
    if(pk){elegido=pk.dataset.pick;const a=ctx.mapa[elegido];sub.querySelector('#res').innerHTML='';
      sub.querySelector('#sel').innerHTML=`<p><b>${esc(a.n)}</b><br><span class="mut">Por 100 g: ${a.kcal} kcal · P ${a.p} · C ${a.c} · Fibra ${a.fi} · G ${a.g}</span></p><label for="gg">Cantidad (g o ml)</label><input id="gg" type="number" inputmode="decimal" min="1" max="5000"><p class="err" id="eg" role="alert"></p><button class="btn blk" data-ok>Agregar a hoy</button>`;return;}
    if(e.target.closest('[data-ok]')){const g=+sub.querySelector('#gg').value;if(!(g>0&&g<=5000)){sub.querySelector('#eg').textContent='Ingresa una cantidad entre 1 y 5000.';return;}
      reg.extras.push({id:elegido,g});await guardar('menus','registro-'+f,reg);return calculadora(sub);}
    const rm=e.target.closest('[data-rm]');
    if(rm){reg.extras.splice(+rm.dataset.rm,1);await guardar('menus','registro-'+f,reg);return calculadora(sub);}
    if(e.target.closest('[data-nuevo]'))return nuevoAlimento(sub);
  };
}
function nuevoAlimento(sub){
  const cats=[['proteina','Proteína'],['lacteo','Lácteo'],['verdura','Verdura'],['fruta','Fruta'],['grasa','Grasa'],['cereal','Cereal'],['legumbre','Legumbre']];
  const campos=[['kcal','Calorías (kcal)'],['p','Proteínas (g)'],['c','Carbohidratos (g)'],['fi','Fibra (g)'],['g','Grasas (g)']];
  const mod=modal(`<h2>Alimento propio</h2><p class="mut">Valores por 100 g o 100 ml, según su etiqueta.</p><label for="an">Nombre *</label><input id="an"><label for="ac">Categoría</label><select id="ac">${ops(cats)}</select>${campos.map(([k,l])=>`<label for="a-${k}">${l}</label><input id="a-${k}" type="number" inputmode="decimal" min="0" max="${k==='kcal'?900:100}" step="any">`).join('')}<p class="err" id="ae" role="alert"></p><div class="fila"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar</button></div>`);
  mod.addEventListener('click',async e=>{if(!e.target.closest('[data-ok]'))return;const q=s=>mod.querySelector(s),a={id:'a'+Date.now(),n:q('#an').value.trim(),cat:q('#ac').value,fuente:'Ingresado por el usuario'};
    if(!a.n)return q('#ae').textContent='Escribe un nombre.';
    for(const [k] of campos){const v=q('#a-'+k).value;a[k]=v===''?0:+v;if(!(a[k]>=0&&a[k]<=(k==='kcal'?900:100)))return q('#ae').textContent='Revisa los valores: kcal hasta 900 y el resto hasta 100 g.';}
    if(a.kcal===0&&a.p+a.c+a.g===0)return q('#ae').textContent='Ingresa al menos un valor nutricional.';
    await guardar('alimentos',a.id,a);await cargar(ctx.perfil);mod.remove();calculadora(sub);});
}
