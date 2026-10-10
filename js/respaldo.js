import {volcar,restaurar,leer,guardar,LISTA_ALMACENES} from './db.js';
import {modal} from './vistas.js';
import {esc} from './nutricion.js';
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
export async function respaldoCard(cont,ajustes,guardarAjustes){
  cont.innerHTML=`<div class="card"><h2>Copia de seguridad</h2><p class="mut">${ajustes.ultimoRespaldo?`Última copia exportada: ${fF(ajustes.ultimoRespaldo)}.`:'Aún no exportaste ninguna copia.'}</p>
  <div class="fila"><button class="btn" data-a="exp">Exportar copia</button><button class="btn sec" data-a="imp">Importar copia</button></div><input type="file" id="rf" accept=".json,application/json" hidden>
  <p class="mut" style="margin-top:12px">No hay copia automática en la nube. Tus datos viven solo en este dispositivo y pueden perderse si borras los datos del navegador, desinstalas la app o cambias de teléfono sin respaldo. El PIN no se incluye en la copia.</p></div>`;
  const f=cont.querySelector('#rf');
  cont.onclick=async e=>{const a=e.target.closest('[data-a]')?.dataset.a;
    if(a==='exp'){descargar(await crearRespaldo(),`nutriplanner-respaldo-${new Date().toISOString().slice(0,10)}.json`);ajustes.ultimoRespaldo=new Date().toISOString();await guardarAjustes();return respaldoCard(cont,ajustes,guardarAjustes);}
    if(a==='imp'){f.value='';f.click();}};
  f.onchange=async()=>{
    const file=f.files[0];if(!file)return;
    if(file.size>20e6)return alert('El archivo es demasiado grande para ser un respaldo.');
    let o;try{o=JSON.parse(await file.text());}catch{return alert('No se pudo leer el archivo: no es un JSON válido.');}
    const v=validarRespaldo(o);if(!v.ok)return alert(v.error);
    const r=v.resumen,mod=modal(`<h2>Restaurar copia</h2><p class="mut">Respaldo del ${fF(o.fecha||'')}.</p><div class="kv"><span>Perfil</span><b>${r.perfil?'Sí':'No'}</b></div><div class="kv"><span>Semanas de menú</span><b>${r.semanas}</b></div><div class="kv"><span>Recetas propias</span><b>${r.recetas}</b></div><div class="kv"><span>Registros de peso</span><b>${r.pesos}</b></div><div class="kv"><span>Alimentos propios</span><b>${r.alimentos}</b></div><div class="kv"><span>Listas guardadas</span><b>${r.listas}</b></div>
    <div class="nota"><b>Atención:</b> esto reemplaza los datos actuales de la app. Antes se descargará una copia de tus datos actuales, por si necesitas volver atrás.</div><div class="fila"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Reemplazar mis datos</button></div>`);
    mod.addEventListener('click',async ev=>{if(!ev.target.closest('[data-ok]'))return;
      try{descargar(await crearRespaldo(),`nutriplanner-copia-previa-${Date.now()}.json`);}catch{if(!confirm('No se pudo guardar la copia previa. ¿Continuar de todos modos?'))return;}
      const datos=o.datos,pin=await leer('ajustes','pin');
      datos.ajustes=Object.assign({},datos.ajustes||{});if(pin)datos.ajustes.pin=pin;
      try{await restaurar(datos);}catch{return alert('No se pudo restaurar. Tus datos actuales no se modificaron.');}
      alert('Copia restaurada. La app se reiniciará.');location.reload();});
  };
}
