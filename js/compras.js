import {leer,guardar,borrar,todo} from './db.js';
import {ctx,modal,ops} from './vistas.js';
import {r1,esc} from './nutricion.js';
import {seccion,SECCIONES} from './datos.js';
let est=null,pest='lista';
export function necesidades(semana,porId,soloPend=false){
  const m={};if(!semana)return m;
  for(const d of semana.dias)for(const x of Object.values(d.comidas)){
    if(soloPend&&x.hecha)continue;const r=porId[x.rid];if(!r)continue;
    for(const [id,g] of (x.ing||r.ing))m[id]=(m[id]||0)+g*x.factor/r.por;
  }
  return m;
}
export const fmt=(g,id)=>(g>=1000?`${r1(g/1000)} kg`:`${Math.round(g)} g`)+(id==='huevo'?` (≈ ${Math.ceil(g/50)} huevos)`:'');
export const parseF=t=>{const m=String(t).trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);if(!m)return null;const [d,mo,y]=[+m[1],+m[2],+m[3]],dt=new Date(y,mo-1,d);
  if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==d)return null;return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;};
const fmtF=i=>i?i.split('-').reverse().join('/'):'';
const gs=n=>'Gs. '+Math.round(n).toLocaleString('es-PY');
async function cargarEst(){
  const e=await leer('compras','estado');const l=ctx.semana?.lunes;
  est=e&&e.lunes===l?e:{lunes:l,personas:1,soloPend:false,comprados:{},quitados:{},manuales:[]};
}
const gEst=()=>guardar('compras','estado',est);
export function armarLista(inv,precios,semana,porId,mapa,e){
  const nec=necesidades(semana,porId,e.soloPend),items=[];
  for(const id in nec){const need=nec[id]*e.personas,stock=inv[id]?.g||0,falta=Math.max(0,need-stock),a=mapa[id];
    const pr=precios[id]?.p;items.push({id,n:a?.n||id,sec:seccion(a),need,stock,falta,costo:pr?falta/1000*pr:null,sinPrecio:!pr&&falta>0});}
  return items;
}
function texto(items,e){
  let t=`Lista de compras${ctx.semana?' (semana del '+fmtF(ctx.semana.lunes)+')':''}\n`;
  for(const s in SECCIONES){const L=items.filter(i=>i.sec===s&&!e.quitados[i.id]&&i.falta>0),M=e.manuales.filter(m=>m.sec===s);
    if(!L.length&&!M.length)continue;t+=`\n${SECCIONES[s]}\n`;
    L.forEach(i=>t+=`${e.comprados[i.id]?'✓':'☐'} ${i.n}: ${fmt(i.falta,i.id)}\n`);
    M.forEach(m=>t+=`${m.comprado?'✓':'☐'} ${m.n}${m.q?': '+m.q:''}\n`);}
  return t;
}
async function compartir(t){
  if(navigator.share){try{await navigator.share({title:'Lista de compras',text:t});return;}catch(e){if(e.name==='AbortError')return;}}
  window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');
}
export async function comprasView(c){
  if(!ctx.perfil){c.innerHTML=`<div class="card"><h2>Primero crea tu perfil</h2><a class="btn blk" href="#inicio">Ir a Inicio</a></div>`;return;}
  c.innerHTML=`<div class="seg no-print"><button class="btn ${pest==='lista'?'':'sec'}" data-tab="lista">Lista</button><button class="btn ${pest==='desp'?'':'sec'}" data-tab="desp">Despensa</button></div><div id="sub"></div>`;
  c.onclick=e=>{const b=e.target.closest('[data-tab]');if(b){pest=b.dataset.tab;comprasView(c);}};
  const sub=c.querySelector('#sub');
  if(pest==='lista')await lista(sub);else await despensa(sub);
}
async function lista(sub){
  if(!ctx.semana){sub.innerHTML=`<div class="card"><h2>Lista de compras</h2><p class="mut">Genera primero tu menú semanal para armar la lista.</p><a class="btn blk" href="#menu">Ir a Mi menú</a></div>`;return;}
  await cargarEst();const inv=(await leer('despensa','inv'))||{},precios=(await leer('compras','precios'))||{};ctx.despensa=inv;
  const items=armarLista(inv,precios,ctx.semana,ctx.porId,ctx.mapa,est),vis=items.filter(i=>!est.quitados[i.id]);
  const total=vis.reduce((s,i)=>s+(i.costo||0),0),sinP=vis.filter(i=>i.sinPrecio).length,nq=Object.keys(est.quitados).length;
  const fila=i=>`<div class="item ${est.comprados[i.id]||i.falta===0?'ok':''}"><label class="chk"><input type="checkbox" data-co="${i.id}" ${est.comprados[i.id]?'checked':''}><span>${esc(i.n)}</span></label><div class="q">${i.falta>0?fmt(i.falta,i.id):'Ya lo tienes'}${i.costo?` · ${gs(i.costo)}`:''}</div><div class="acc no-print"><button class="btn sec mini" data-pr="${i.id}">Precio</button>${i.falta>0?`<button class="btn sec mini" data-ya="${i.id}">Ya tengo</button>`:''}<button class="btn sec mini" data-qt="${i.id}" aria-label="Quitar ${esc(i.n)}">Quitar</button></div></div>`;
  sub.innerHTML=`<h2 class="solo-print">Lista de compras · semana del ${fmtF(ctx.semana.lunes)}</h2>
  <div class="card no-print"><div class="dos"><div><label for="np">Personas</label><input id="np" type="number" inputmode="numeric" min="1" max="20" value="${est.personas}"></div><div><label class="chk" style="margin-top:36px"><input type="checkbox" id="sp" ${est.soloPend?'checked':''}>Solo comidas pendientes</label></div></div></div>
  <div class="card"><h2>Costo estimado</h2><p><b>${total?gs(total):'Sin precios registrados'}</b></p><p class="mut">${sinP?`${sinP} producto(s) sin precio. Toca "Precio" para cargarlo (Gs. por kg o litro).`:'Calculado con los precios que registraste.'} Se descuenta lo que tienes en la despensa.</p></div>
  ${Object.keys(SECCIONES).map(s=>{const L=vis.filter(i=>i.sec===s),M=est.manuales.filter(m=>m.sec===s);if(!L.length&&!M.length)return '';
   return `<div class="card"><h2>${SECCIONES[s]}</h2>${L.map(fila).join('')}${M.map(m=>`<div class="item ${m.comprado?'ok':''}"><label class="chk"><input type="checkbox" data-mc="${m.id}" ${m.comprado?'checked':''}><span>${esc(m.n)}</span></label><div class="q">${esc(m.q||'')}</div><div class="acc no-print"><button class="btn sec mini" data-mq="${m.id}">Quitar</button></div></div>`).join('')}</div>`;}).join('')}
  <div class="card no-print"><h2>Agregar producto</h2><label for="mn">Nombre</label><input id="mn"><div class="dos"><div><label for="mq">Cantidad</label><input id="mq" placeholder="Ej.: 2 kg"></div><div><label for="ms">Sección</label><select id="ms">${ops(Object.entries(SECCIONES))}</select></div></div><p class="err" id="me" role="alert"></p><button class="btn blk" data-am>Agregar</button></div>
  ${nq?`<button class="btn sec blk no-print" data-rs>Restaurar ${nq} producto(s) quitado(s)</button>`:''}
  <div class="fila no-print"><button class="btn" data-sh>Compartir lista de compras</button><button class="btn sec" data-pt>Imprimir / PDF</button></div>
  <div class="fila no-print"><button class="btn sec" data-gl>Guardar lista</button><button class="btn sec" data-ls>Listas guardadas</button></div>`;
  const re=()=>lista(sub);
  sub.onchange=async e=>{const t=e.target;
    if(t.dataset.co){est.comprados[t.dataset.co]=t.checked;await gEst();return re();}
    if(t.dataset.mc){est.manuales.find(m=>m.id===t.dataset.mc).comprado=t.checked;await gEst();return re();}
    if(t.id==='np'){const v=Math.round(+t.value);if(v>=1&&v<=20){est.personas=v;await gEst();}return re();}
    if(t.id==='sp'){est.soloPend=t.checked;await gEst();return re();}};
  sub.onclick=async e=>{const g=k=>e.target.closest(`[data-${k}]`)?.dataset[k];
    if(g('qt')){est.quitados[g('qt')]=true;await gEst();return re();}
    if(g('mq')){est.manuales=est.manuales.filter(m=>m.id!==g('mq'));await gEst();return re();}
    if(e.target.closest('[data-rs]')){est.quitados={};await gEst();return re();}
    if(g('ya')){const i=items.find(x=>x.id===g('ya'));inv[i.id]={...(inv[i.id]||{}),g:Math.ceil((inv[i.id]?.g||0)+i.falta)};await guardar('despensa','inv',inv);return re();}
    if(g('pr'))return precio(g('pr'),precios,re);
    if(e.target.closest('[data-am]')){const n=sub.querySelector('#mn').value.trim();if(!n)return sub.querySelector('#me').textContent='Escribe el nombre del producto.';
      est.manuales.push({id:'m'+Date.now(),n,q:sub.querySelector('#mq').value.trim(),sec:sub.querySelector('#ms').value,comprado:false});await gEst();return re();}
    if(e.target.closest('[data-sh]'))return compartir(texto(items,est));
    if(e.target.closest('[data-pt]'))return window.print();
    if(e.target.closest('[data-gl]')){const n=prompt('Nombre para esta lista (opcional):');if(n===null)return;const f=new Date().toISOString();await guardar('compras','lista-'+Date.now(),{n:n.trim()||'Lista del '+fmtF(f.slice(0,10)),fecha:f,texto:texto(items,est)});return alert('Lista guardada.');}
    if(e.target.closest('[data-ls]'))return guardadas();};
}
function precio(id,precios,re){
  const a=ctx.mapa[id],h=precios[id]?.hist||[];
  const mod=modal(`<h2>Precio de ${esc(a?.n||id)}</h2><label for="pp">Gs. por kg o litro</label><input id="pp" type="number" inputmode="numeric" min="1" max="10000000" value="${precios[id]?.p||''}"><p class="err" id="pe" role="alert"></p>${h.length?`<h3>Historial</h3>${h.slice(-5).reverse().map(x=>`<div class="kv"><span>${fmtF(x.f)}</span><b>${gs(x.p)}</b></div>`).join('')}`:''}<div class="fila"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar</button></div>`);
  mod.addEventListener('click',async e=>{if(!e.target.closest('[data-ok]'))return;const v=Math.round(+mod.querySelector('#pp').value);
    if(!(v>0&&v<=1e7))return mod.querySelector('#pe').textContent='Ingresa un precio válido.';
    const p=precios[id]||{hist:[]};if(!p.hist.length||p.hist[p.hist.length-1].p!==v)p.hist.push({f:new Date().toISOString().slice(0,10),p:v});p.p=v;precios[id]=p;
    await guardar('compras','precios',precios);mod.remove();re();});
}
async function guardadas(){
  const L=(await todo('compras')).filter(x=>x&&x.texto&&x.fecha).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const mod=modal(`<h2>Listas guardadas</h2>${L.map((l,i)=>`<div class="card"><b>${esc(l.n)}</b><div class="fila"><button class="btn sec mini" data-v="${i}">Ver</button><button class="btn sec mini" data-s="${i}">Compartir</button><button class="btn sec mini" data-d="${i}">Eliminar</button></div></div>`).join('')||'<p class="mut">Aún no guardaste listas.</p>'}<button class="btn sec blk" data-x>Cerrar</button>`);
  const claves=(await keys());
  mod.addEventListener('click',async e=>{const g=k=>e.target.closest(`[data-${k}]`)?.dataset[k];
    if(g('v')!==undefined)return modal(`<h2>${esc(L[g('v')].n)}</h2><pre class="pre">${esc(L[g('v')].texto)}</pre><button class="btn blk" data-x>Cerrar</button>`);
    if(g('s')!==undefined)return compartir(L[g('s')].texto);
    if(g('d')!==undefined&&confirm('¿Eliminar esta lista guardada?')){const k=claves.find(x=>x.v.fecha===L[g('d')].fecha);if(k)await borrar('compras',k.k);mod.remove();guardadas();}});
}
async function keys(){ // pares clave/valor de listas guardadas
  const db=await new Promise((ok,ko)=>{const r=indexedDB.open('nutriplanner');r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error);});
  return new Promise(ok=>{const out=[],q=db.transaction('compras').objectStore('compras').openCursor();q.onsuccess=()=>{const c=q.result;if(!c)return ok(out);if(String(c.key).startsWith('lista-'))out.push({k:c.key,v:c.value});c.continue();};});
}
async function despensa(sub){
  const inv=(await leer('despensa','inv'))||{};ctx.despensa=inv;
  const hoy=new Date().toISOString().slice(0,10),en3=new Date(Date.now()+3*864e5).toISOString().slice(0,10);
  const ids=Object.keys(inv).filter(i=>inv[i].g>0).sort((a,b)=>(ctx.mapa[a]?.n||a).localeCompare(ctx.mapa[b]?.n||b));
  sub.innerHTML=`<div class="card"><h2>Despensa</h2><p class="mut">Lo que tienes en casa se descuenta de la lista de compras y el generador lo prioriza.</p><button class="btn blk" data-add>Agregar a la despensa</button></div>
  ${ids.map(i=>{const x=inv[i],v=x.vence,aviso=v&&v<hoy?'<span class="err"> · vencido</span>':v&&v<=en3?'<span class="err"> · vence pronto</span>':'';return `<div class="card"><b>${esc(ctx.mapa[i]?.n||i)}</b><p class="mut">${fmt(x.g,i)}${v?' · vence '+fmtF(v):''}${aviso}</p><div class="fila"><button class="btn sec mini" data-ed="${i}">Editar</button><button class="btn sec mini" data-rm="${i}">Quitar</button></div></div>`;}).join('')||'<p class="mut">Tu despensa está vacía.</p>'}`;
  const form=(id)=>{const x=inv[id]||{};
    const mod=modal(`<h2>${id?'Editar':'Agregar'} alimento</h2><label for="di">Alimento</label><select id="di" ${id?'disabled':''}>${Object.values(ctx.mapa).sort((a,b)=>a.n.localeCompare(b.n)).map(a=>`<option value="${a.id}" ${a.id===id?'selected':''}>${esc(a.n)}</option>`).join('')}</select><label for="dg">Cantidad (g o ml)</label><input id="dg" type="number" inputmode="decimal" min="1" max="100000" value="${x.g||''}"><label for="dv">Vencimiento (opcional)</label><input id="dv" inputmode="numeric" placeholder="dd/mm/aaaa" value="${fmtF(x.vence)}"><p class="err" id="de" role="alert"></p><div class="fila"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar</button></div>`);
    mod.addEventListener('click',async e=>{if(!e.target.closest('[data-ok]'))return;const q=s=>mod.querySelector(s),g=+q('#dg').value,vt=q('#dv').value.trim(),v=vt?parseF(vt):'';
      if(!(g>0&&g<=1e5))return q('#de').textContent='Ingresa una cantidad válida.';if(v===null)return q('#de').textContent='Fecha inválida. Usa dd/mm/aaaa.';
      const k=q('#di').value;inv[k]={g,vence:v};await guardar('despensa','inv',inv);mod.remove();despensa(sub);});
  };
  sub.onclick=async e=>{const g=k=>e.target.closest(`[data-${k}]`)?.dataset[k];
    if(e.target.closest('[data-add]'))return form(null);if(g('ed'))return form(g('ed'));
    if(g('rm')&&confirm('¿Quitar este alimento de la despensa?')){delete inv[g('rm')];await guardar('despensa','inv',inv);return despensa(sub);}};
}
