import {volcar,restaurar,leer,guardar,LISTA_ALMACENES} from './db.js';
import {modal} from './vistas.js';
import {esc} from './nutricion.js';
import * as G from './gdrive.js';
export const VERSION=1;
const fF=i=>i.slice(0,10).split('-').reverse().join('/');
export async function crearRespaldo(){
  const datos=await volcar();
  for(const k of ['pin','pin-intentos'])delete datos.ajustes[k];
  return {app:'nutriplanner',version:VERSION,fecha:new Date().toISOString(),datos};
}
export function validarRespaldo(o){
  const err=m=>({ok:false,error:m});
  if(!o||typeof o!=='object'||Array.isArray(o))return err('El archivo no tiene el formato de un respaldo.');
  if(o.app!=='nutriplanner')return err('Este archivo no es un respaldo de NutriPlanner.');
  if(!Number.isInteger(o.version)||o.version<1)return err('El respaldo no indica una versión válida.');
  if(o.version>VERSION)return err('El respaldo es de una versión más nueva. Actualiza la app antes de importarlo.');
  if(!o.datos||typeof o.datos!=='object'||Array.isArray(o.datos))return err('El respaldo no contiene datos.');
  for(const a of Object.keys(o.datos)){
    if(!LISTA_ALMACENES.includes(a))return err(`El respaldo contiene una sección desconocida: ${a}.`);
    const v=o.datos[a];if(!v||typeof v!=='object'||Array.isArray(v))return err(`La sección "${a}" está dañada.`);
  }
  const d=o.datos,semanas=Object.entries(d.menus||{}).filter(([k])=>k.startsWith('semana-'));
  for(const [k,s] of semanas)if(!s||!Array.isArray(s.dias)||s.dias.length!==7||typeof s.lunes!=='string')return err(`La semana "${k}" está dañada.`);
  for(const [k,x] of Object.entries(d.peso||{}))if(!x||!(x.kg>=30&&x.kg<=300)||typeof x.f!=='string')return err(`El registro de peso "${k}" no es válido.`);
  if(d.perfil&&d.perfil.principal&&typeof d.perfil.principal!=='object')return err('El perfil está dañado.');
  const n=a=>Object.keys(d[a]||{}).length;
  return {ok:true,resumen:{perfil:!!(d.perfil&&d.perfil.principal),semanas:semanas.length,recetas:n('recetas'),pesos:n('peso'),alimentos:n('alimentos'),despensa:!!(d.despensa&&d.despensa.inv),listas:Object.keys(d.compras||{}).filter(k=>k.startsWith('lista-')).length}};
}
function descargar(obj,nombre){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj)],{type:'application/json'}));
  a.download=nombre;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000);
}
function restaurarDesde(o,origen){
  const v=validarRespaldo(o);if(!v.ok)return alert(v.error);
  const r=v.resumen,mod=modal(`<h2>Restaurar copia</h2><p class="mut">Respaldo del ${fF(o.fecha||'')} (${esc(origen)}).</p><div class="kv"><span>Perfil</span><b>${r.perfil?'Sí':'No'}</b></div><div class="kv"><span>Semanas de menú</span><b>${r.semanas}</b></div><div class="kv"><span>Recetas propias</span><b>${r.recetas}</b></div><div class="kv"><span>Registros de peso</span><b>${r.pesos}</b></div><div class="kv"><span>Alimentos propios</span><b>${r.alimentos}</b></div><div class="kv"><span>Listas guardadas</span><b>${r.listas}</b></div>
  <div class="nota"><b>Atención:</b> esto reemplaza los datos actuales de la app. Antes se descargará una copia de tus datos actuales, por si necesitas volver atrás.</div><div class="fila"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Reemplazar mis datos</button></div>`);
  mod.addEventListener('click',async ev=>{if(!ev.target.closest('[data-ok]'))return;
    try{descargar(await crearRespaldo(),`nutriplanner-copia-previa-${Date.now()}.json`);}catch{if(!confirm('No se pudo guardar la copia previa. ¿Continuar de todos modos?'))return;}
    const datos=o.datos,pin=await leer('ajustes','pin');
    datos.ajustes=Object.assign({},datos.ajustes||{});if(pin)datos.ajustes.pin=pin;
    try{await restaurar(datos);}catch{return alert('No se pudo restaurar. Tus datos actuales no se modificaron.');}
    alert('Copia restaurada. La app se reiniciará.');location.reload();});
}
export async function respaldoCard(cont,ajustes,guardarAjustes){
  const idc=ajustes.gClientId||'';
  cont.innerHTML=`<div class="card"><h2>Copia de seguridad</h2><p class="mut">${ajustes.ultimoRespaldo?`Última copia exportada: ${fF(ajustes.ultimoRespaldo)}.`:'Aún no exportaste ninguna copia.'}</p>
  <div class="fila"><button class="btn" data-a="exp">Exportar copia</button><button class="btn sec" data-a="imp">Importar copia</button></div><input type="file" id="rf" accept=".json,application/json" hidden>
  <p class="mut" style="margin-top:12px">Los datos viven en este dispositivo y pueden perderse si borras los datos del navegador, desinstalas la app o cambias de teléfono sin respaldo. El PIN no se incluye en la copia.</p></div>
  <div class="card"><h2>Copia en Google Drive</h2><p class="mut">${ajustes.ultimoDrive?`Última copia en Drive: ${fF(ajustes.ultimoDrive)}.`:'Aún no subiste ninguna copia a Drive.'} Se guarda en una carpeta privada de la app dentro de tu Drive (solo esta app la ve) y se conservan las 5 más recientes. No es automática: la subes tú cuando quieras. Requiere internet y configurar un ID de cliente de Google (ver README).</p>
  <label for="gid">ID de cliente de Google</label><input id="gid" value="${esc(idc)}" placeholder="xxxxxxxx.apps.googleusercontent.com" autocomplete="off" autocapitalize="off">
  <p class="err" id="ge" role="alert"></p>
  <div class="fila"><button class="btn" data-a="gsub">Subir a Drive</button><button class="btn sec" data-a="gres">Restaurar de Drive</button></div></div>`;
  const f=cont.querySelector('#rf'),err=m=>cont.querySelector('#ge').textContent=m;
  const guardarId=async()=>{const v=cont.querySelector('#gid').value.trim();if(!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(v)){err('Ingresa un ID de cliente válido (termina en .apps.googleusercontent.com).');return null;}
    if(v!==ajustes.gClientId){ajustes.gClientId=v;await guardarAjustes();}err('');return v;};
  cont.onclick=async e=>{const a=e.target.closest('[data-a]')?.dataset.a;
    if(a==='exp'){descargar(await crearRespaldo(),`nutriplanner-respaldo-${new Date().toISOString().slice(0,10)}.json`);ajustes.ultimoRespaldo=new Date().toISOString();await guardarAjustes();return respaldoCard(cont,ajustes,guardarAjustes);}
    if(a==='imp'){f.value='';f.click();}
    if(a==='gsub'||a==='gres'){
      if(!navigator.onLine)return err('Sin conexión: necesitas internet para usar Google Drive.');
      const id=await guardarId();if(!id)return;
      if(a==='gsub'&&!ajustes.driveConsent){
        if(!confirm('Se enviará una copia de tus datos (perfil, peso, menús y recetas) a TU cuenta de Google Drive, en una carpeta privada de la app. No se envía a ningún otro servidor. ¿Aceptas?'))return;
        ajustes.driveConsent=true;await guardarAjustes();}
      const btn=e.target.closest('button');btn.disabled=true;
      try{
        const t=await G.obtenerToken(id);
        if(a==='gsub'){
          const nombre=`nutriplanner-${new Date().toISOString().slice(0,16).replace(':','-')}.json`;
          await G.subir(t,nombre,JSON.stringify(await crearRespaldo()));
          let viejos=0;try{viejos=await G.limpiarAntiguos(t,5);}catch{}
          ajustes.ultimoDrive=new Date().toISOString();await guardarAjustes();
          alert('Copia subida a Google Drive.'+(viejos?` Se eliminaron ${viejos} copia(s) antigua(s).`:''));return respaldoCard(cont,ajustes,guardarAjustes);
        }
        const L=await G.listar(t);
        if(!L.length)return alert('No hay copias de NutriPlanner en tu Google Drive.');
        const mod=modal(`<h2>Copias en Drive</h2>${L.map((x,i)=>`<div class="card"><b>${fF(x.createdTime)}</b> <span class="mut">${esc(x.createdTime.slice(11,16))} UTC</span><div class="fila"><button class="btn mini" data-d="${i}">Restaurar esta</button></div></div>`).join('')}<button class="btn sec blk" data-x>Cerrar</button>`);
        mod.addEventListener('click',async ev=>{const b=ev.target.closest('[data-d]');if(!b)return;b.disabled=true;
          try{const o=JSON.parse(await G.descargar(t,L[+b.dataset.d].id));mod.remove();restaurarDesde(o,'Google Drive');}
          catch(x){b.disabled=false;alert('No se pudo leer esa copia: '+x.message);}});
      }catch(x){err(x.message);}finally{btn.disabled=false;}
    }};
  f.onchange=async()=>{
    const file=f.files[0];if(!file)return;
    if(file.size>20e6)return alert('El archivo es demasiado grande para ser un respaldo.');
    let o;try{o=JSON.parse(await file.text());}catch{return alert('No se pudo leer el archivo: no es un JSON válido.');}
    restaurarDesde(o,'archivo');
  };
}
