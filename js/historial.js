import {leer,guardar,borrar,todo} from './db.js';
import {ctx,modal,cargar} from './vistas.js';
import {esc} from './nutricion.js';
import * as M from './menu.js';
let off=0;
const fmtF=i=>i.split('-').reverse().join('/');
const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const cuenta=s=>{let h=0,t=0;s.dias.forEach(d=>Object.values(d.comidas).forEach(m=>{t++;if(m.hecha)h++;}));return {h,t};};
const sumar=(l,n)=>{const d=new Date(l+'T12:00:00');d.setDate(d.getDate()+n);return M.fechaISO(d);};
export async function historialView(c){
  const sem=(await todo('menus')).filter(x=>x&&x.dias&&x.lunes).sort((a,b)=>b.lunes.localeCompare(a.lunes));
  const mapa={};sem.forEach(s=>s.dias.forEach((d,i)=>{const t=Object.values(d.comidas),f=sumar(s.lunes,i);mapa[f]={s,i,h:t.filter(m=>m.hecha).length,t:t.length};}));
  const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+off);const y=base.getFullYear(),mo=base.getMonth();
  const ini=(new Date(y,mo,1).getDay()+6)%7,dias=new Date(y,mo+1,0).getDate(),hoy=M.fechaISO();
  const celdas=[...Array(ini).fill('<i></i>'),...Array.from({length:dias},(_,k)=>{const f=`${y}-${String(mo+1).padStart(2,'0')}-${String(k+1).padStart(2,'0')}`,x=mapa[f];
    return `<button class="dc ${x?'con':''} ${f===hoy?'hoy':''}" ${x?`data-dia="${f}"`:'disabled'} aria-label="${k+1} de ${MESES[mo]}${x?`, ${x.h} de ${x.t} comidas hechas`:''}">${k+1}${x?`<small>${x.h}/${x.t}</small>`:''}</button>`;})];
  c.innerHTML=`<div class="card"><div class="mes"><button class="btn sec mini" data-mes="-1" aria-label="Mes anterior">‹</button><b>${MESES[mo]} ${y}</b><button class="btn sec mini" data-mes="1" aria-label="Mes siguiente">›</button></div><div class="cal">${['L','M','M','J','V','S','D'].map(d=>`<span>${d}</span>`).join('')}${celdas.join('')}</div><p class="mut">Los días con menú muestran comidas hechas / planificadas.</p></div>
  <h2>Semanas guardadas</h2>${sem.map(s=>{const n=cuenta(s);return `<div class="card"><b>${esc(s.nombre||'Semana del '+fmtF(s.lunes))}</b>${s.nombre?`<p class="mut">Semana del ${fmtF(s.lunes)}</p>`:''}<p class="mut">${n.h} hechas · ${n.t-n.h} pendientes</p><div class="fila"><button class="btn sec mini" data-ver="${s.lunes}">Ver</button><button class="btn sec mini" data-dup="${s.lunes}">Duplicar a esta semana</button></div><div class="fila"><button class="btn sec mini" data-nom="${s.lunes}">Nombrar</button><button class="btn sec mini" data-del="${s.lunes}">Eliminar</button></div></div>`;}).join('')||'<p class="mut">Aún no hay semanas guardadas. Se guardan solas al generar tu menú.</p>'}`;
  const ver=l=>{const s=sem.find(x=>x.lunes===l);if(!s)return;
    modal(`<h2>${esc(s.nombre||'Semana del '+fmtF(s.lunes))}</h2>${s.dias.map((d,i)=>`<h3>${M.DIAS[i]} ${fmtF(sumar(s.lunes,i)).slice(0,5)}</h3>${Object.keys(M.SLOTS).filter(k=>d.comidas[k]).map(k=>`<div class="kv"><span>${M.SLOTS[k]}: ${esc(ctx.porId[d.comidas[k].rid]?.n||'(receta eliminada)')}</span><b>${d.comidas[k].hecha?'✓':''}</b></div>`).join('')}`).join('')}<button class="btn blk" data-x style="margin-top:12px">Cerrar</button>`);};
  c.onclick=async e=>{const g=k=>e.target.closest(`[data-${k}]`)?.dataset[k];
    if(g('mes')){off+=+g('mes');return historialView(c);}
    if(g('dia')){return ver(mapa[g('dia')].s.lunes);}
    if(g('ver'))return ver(g('ver'));
    if(g('dup')){const o=sem.find(x=>x.lunes===g('dup')),act=M.lunesDe();
      if(o.lunes===act)return alert('Ya estás en esa semana.');
      if(ctx.semana&&!confirm('Esto reemplaza el menú de esta semana. ¿Continuar?'))return;
      const n=JSON.parse(JSON.stringify(o));n.lunes=act;delete n.nombre;n.dias.forEach(d=>Object.values(d.comidas).forEach(m=>m.hecha=false));
      await guardar('menus','semana-'+act,n);await cargar(ctx.perfil);alert('Semana duplicada. El original no se modificó.');return historialView(c);}
    if(g('nom')){const s=sem.find(x=>x.lunes===g('nom')),n=prompt('Nombre de la semana (opcional):',s.nombre||'');if(n===null)return;s.nombre=n.trim();if(!s.nombre)delete s.nombre;await guardar('menus','semana-'+s.lunes,s);await cargar(ctx.perfil);return historialView(c);}
    if(g('del')){if(!confirm('¿Eliminar esta semana guardada? Esta acción no se puede deshacer.'))return;await borrar('menus','semana-'+g('del'));await cargar(ctx.perfil);return historialView(c);}
  };
}
