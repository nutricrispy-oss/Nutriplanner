import {guardar,borrar} from './db.js';
import {ctx,modal,cargar} from './vistas.js';
import {r1,esc} from './nutricion.js';
import {parseF} from './compras.js';
import {lunesDe,fechaISO} from './menu.js';
const fF=i=>i.split('-').reverse().join('/');
const num=x=>String(r1(x)).replace('.',',');
const kg=x=>num(x)+' kg';
const sg=x=>(x>0?'+':x<0?'−':'')+num(Math.abs(x))+' kg';
function grafico(L,obj){
  const W=320,H=180,x0=40,x1=W-12,y0=14,y1=H-28,vs=L.map(x=>x.kg);if(obj)vs.push(obj);
  let mn=Math.min(...vs),mx=Math.max(...vs);if(mx-mn<1){mn-=.5;mx+=.5;}const pd=(mx-mn)*.12;mn-=pd;mx+=pd;
  const T=f=>new Date(f+'T12:00:00').getTime(),t0=T(L[0].f),t1=T(L[L.length-1].f);
  const X=f=>L.length>1&&t1>t0?x0+(T(f)-t0)/(t1-t0)*(x1-x0):(x0+x1)/2,Y=k=>y1-(k-mn)/(mx-mn)*(y1-y0);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolución del peso, de ${kg(L[0].kg)} a ${kg(L[L.length-1].kg)}" class="graf">
  <line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="var(--ln)"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="var(--ln)"/>
  <text x="${x0-4}" y="${y0+4}" text-anchor="end" font-size="10" fill="var(--mut)">${r1(mx)}</text><text x="${x0-4}" y="${y1}" text-anchor="end" font-size="10" fill="var(--mut)">${r1(mn)}</text>
  ${obj?`<line x1="${x0}" y1="${Y(obj).toFixed(1)}" x2="${x1}" y2="${Y(obj).toFixed(1)}" stroke="var(--mut)" stroke-dasharray="4 4"/><text x="${x1}" y="${(Y(obj)-4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--mut)">objetivo</text>`:''}
  ${L.length>1?`<polyline points="${L.map(p=>`${X(p.f).toFixed(1)},${Y(p.kg).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--ac)" stroke-width="2.5"/>`:''}
  ${L.map(p=>`<circle cx="${X(p.f).toFixed(1)}" cy="${Y(p.kg).toFixed(1)}" r="4" fill="var(--ac)"/>`).join('')}
  <text x="${x0}" y="${H-8}" font-size="10" fill="var(--mut)">${fF(L[0].f).slice(0,5)}</text><text x="${x1}" y="${H-8}" text-anchor="end" font-size="10" fill="var(--mut)">${fF(L[L.length-1].f).slice(0,5)}</text></svg>`;
}
export async function progresoView(c){
  if(!ctx.perfil){c.innerHTML=`<div class="card"><h2>Primero crea tu perfil</h2><a class="btn blk" href="#inicio">Ir a Inicio</a></div>`;return;}
  const L=ctx.pesos,p=ctx.perfil,ini=L.length?L[0].kg:null,ult=L.length?L[L.length-1].kg:null,ant=L.length>1?L[L.length-2].kg:null,obj=+p.pesoObj>0?+p.pesoObj:null;
  c.innerHTML=`<div class="card"><h2>Mi progreso</h2>
  ${L.length?`<div class="kv"><span>Peso inicial</span><b>${kg(ini)}</b></div><div class="kv"><span>Peso más reciente</span><b>${kg(ult)}</b></div>${ant!==null?`<div class="kv"><span>Desde el registro anterior</span><b>${sg(ult-ant)}</b></div><div class="kv"><span>Variación acumulada</span><b>${sg(ult-ini)}</b></div>`:''}${obj?`<div class="kv"><span>Peso objetivo</span><b>${kg(obj)}</b></div>`:''}`:`<p class="mut">Aún no registraste tu peso.${p.peso?` Tu perfil indica ${kg(p.peso)} como referencia.`:''}</p>`}
  <button class="btn blk" data-nuevo style="margin-top:12px">Registrar peso</button></div>
  ${L.length?`<div class="card"><h2>Evolución</h2>${grafico(L,obj)}</div>`:''}
  <div class="nota">El peso puede variar de un día a otro por la hidratación, la digestión y otros factores. Un registro aislado no dice mucho: lo útil es la tendencia en varias semanas.</div>
  ${L.length?`<div class="card"><h2>Historial</h2>${L.slice().reverse().map(x=>`<div class="kv"><span>${fF(x.f)}${x.cintura?` · cintura ${num(x.cintura)} cm`:''}${x.cadera?` · cadera ${num(x.cadera)} cm`:''}</span><span><b>${kg(x.kg)}</b> <button class="btn sec mini" data-del="${x.ts}" aria-label="Eliminar registro del ${fF(x.f)}">Eliminar</button></span></div>`).join('')}<button class="btn sec blk" data-csv style="margin-top:12px">Exportar historial (CSV)</button></div>`:''}`;
  c.onclick=async e=>{
    if(e.target.closest('[data-nuevo]'))return formulario(c);
    const d=e.target.closest('[data-del]');
    if(d&&confirm('¿Eliminar este registro?')){await borrar('peso','p'+d.dataset.del);await cargar(ctx.perfil);return progresoView(c);}
    if(e.target.closest('[data-csv]')){
      const t='fecha,peso_kg,cintura_cm,cadera_cm\n'+L.map(x=>[x.f,x.kg,x.cintura||'',x.cadera||''].join(',')).join('\n');
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv'}));a.download='historial-peso.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    }
  };
}
function formulario(c){
  const hoy=fechaISO(),mod=modal(`<h2>Registrar peso</h2><label for="pf">Fecha (dd/mm/aaaa)</label><input id="pf" inputmode="numeric" value="${fF(hoy)}"><label for="pk">Peso (kg)</label><input id="pk" type="number" inputmode="decimal" min="30" max="300" step="0.1"><div class="dos"><div><label for="pc">Cintura (cm, opcional)</label><input id="pc" type="number" inputmode="decimal" min="40" max="250" step="0.5"></div><div><label for="ph">Cadera (cm, opcional)</label><input id="ph" type="number" inputmode="decimal" min="40" max="250" step="0.5"></div></div><p class="err" id="pe" role="alert"></p><div class="fila"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar</button></div>`);
  mod.addEventListener('click',async e=>{
    if(!e.target.closest('[data-ok]'))return;const q=s=>mod.querySelector(s),f=parseF(q('#pf').value),k=+q('#pk').value,ci=q('#pc').value,ca=q('#ph').value;
    if(!f)return q('#pe').textContent='Fecha inválida. Usa dd/mm/aaaa.';
    if(f>hoy)return q('#pe').textContent='La fecha no puede ser futura.';
    if(!(k>=30&&k<=300))return q('#pe').textContent='El peso debe estar entre 30 y 300 kg.';
    if(ci!==''&&!(+ci>=40&&+ci<=250))return q('#pe').textContent='Revisa la medida de cintura.';
    if(ca!==''&&!(+ca>=40&&+ca<=250))return q('#pe').textContent='Revisa la medida de cadera.';
    const sem=lunesDe(new Date(f+'T12:00:00'));
    if(ctx.pesos.some(x=>lunesDe(new Date(x.f+'T12:00:00'))===sem)&&!confirm('Ya hay un registro en esa semana. ¿Agregar otro de todos modos? Los anteriores se conservan.'))return;
    const ts=Date.now();await guardar('peso','p'+ts,{ts,f,kg:Math.round(k*10)/10,cintura:ci===''?null:+ci,cadera:ca===''?null:+ca});
    await cargar(ctx.perfil);mod.remove();progresoView(c);
  });
}
