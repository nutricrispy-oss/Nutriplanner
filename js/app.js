import {leer,guardar,pedirPersistencia} from './db.js';
import {asistente} from './perfil.js';
const $=s=>document.querySelector(s), vista=$('#vista');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TITULOS={inicio:'Inicio',menu:'Mi menú',compras:'Compras',progreso:'Mi progreso',recetas:'Recetas',config:'Ajustes'};
const FASE={menu:['Generador de menús semanales','Fase 2'],recetas:['Recetario y calculadora nutricional','Fase 2'],compras:['Lista de compras, despensa y calendario','Fase 3'],progreso:['Seguimiento de peso y gráficos','Fase 4']};
let perfil=null,ajustes={tema:'claro',nombreApp:'NutriPlanner'},instalar=null;

function aplicarAjustes(){
  document.documentElement.dataset.tema=ajustes.tema;
  $('#titulo-app').textContent=ajustes.nombreApp; document.title=ajustes.nombreApp;
  document.querySelector('meta[name=theme-color]').content=ajustes.tema==='oscuro'?'#0f1714':'#2e7d5b';
}
const guardarAjustes=()=>guardar('ajustes','general',ajustes);

function inicio(){
  if(!perfil){
    vista.innerHTML=`<div class="card"><h2>Te damos la bienvenida</h2><p>Cuéntanos lo básico para organizar tu alimentación. Tus datos se guardan solo en este dispositivo.</p><button class="btn blk" id="empezar">Configurar mi perfil</button></div>`;
    $('#empezar').onclick=editarPerfil; return;
  }
  const p=perfil, g=v=>v||v===0?v:'—';
  vista.innerHTML=`<div class="card"><h2>Hola, ${esc(p.nombre)}</h2><p class="mut">Tu perfil está listo. El menú semanal llegará en la siguiente fase.</p></div>
  <div class="card"><h2>Objetivos diarios</h2>
   <div class="kv"><span>Calorías</span><b>${g(p.kcal)} kcal</b></div><div class="kv"><span>Proteínas</span><b>${g(p.prot)} g</b></div>
   <div class="kv"><span>Carbohidratos</span><b>${g(p.carb)} g</b></div><div class="kv"><span>Grasas</span><b>${g(p.grasa)} g</b></div>
   <p class="mut">Valores orientativos; no reemplazan la indicación de un profesional.</p></div>
  <div class="card"><h2>Peso</h2><div class="kv"><span>Actual</span><b>${g(p.peso)} kg</b></div><div class="kv"><span>Objetivo</span><b>${g(p.pesoObj)} kg</b></div></div>`;
}
function editarPerfil(){
  $('#titulo-vista').textContent='Mi perfil';
  asistente(vista,perfil,async d=>{perfil=d;perfil.actualizado=new Date().toISOString();await guardar('perfil','principal',perfil);location.hash='#inicio';render();});
}
function config(){
  vista.innerHTML=`<div class="card"><h2>Apariencia</h2><div class="seg"><button class="btn ${ajustes.tema==='claro'?'':'sec'}" data-t="claro">Claro</button><button class="btn ${ajustes.tema==='oscuro'?'':'sec'}" data-t="oscuro">Oscuro</button></div>
   <label for="nom">Nombre de la app</label><input id="nom" value="${esc(ajustes.nombreApp)}" maxlength="30"></div>
  <div class="card"><h2>Perfil</h2><button class="btn sec blk" id="ep">${perfil?'Editar mi perfil':'Crear mi perfil'}</button></div>
  <div class="card"><h2>Aplicación</h2><button class="btn sec blk" id="inst" ${instalar?'':'hidden'}>Instalar en pantalla de inicio</button>
   <p class="mut" id="est">Versión 0.1 (Fase 1). Funciona sin conexión.</p></div>
  <div class="card"><h2>Privacidad</h2><p class="mut">Tus datos se guardan solo en este dispositivo y no se envían a ningún servidor. Pueden perderse si borras los datos del navegador o desinstalas la app; la copia de seguridad llegará en la Fase 5. Esta app no sustituye a un médico o nutricionista.</p></div>`;
  vista.querySelectorAll('[data-t]').forEach(b=>b.onclick=async()=>{ajustes.tema=b.dataset.t;aplicarAjustes();await guardarAjustes();config();});
  $('#nom').onchange=async e=>{ajustes.nombreApp=e.target.value.trim()||'NutriPlanner';aplicarAjustes();await guardarAjustes();};
  $('#ep').onclick=()=>{location.hash='#inicio';editarPerfil();};
  $('#inst').onclick=async()=>{if(instalar){instalar.prompt();await instalar.userChoice;instalar=null;config();}};
}
function render(){
  const v=(location.hash||'#inicio').slice(1), k=TITULOS[v]?v:'inicio';
  document.querySelectorAll('.nav a').forEach(a=>{a.classList.toggle('on',a.dataset.v===k);a.toggleAttribute('aria-current',a.dataset.v===k);});
  $('#titulo-vista').textContent=TITULOS[k];
  if(k==='inicio')inicio(); else if(k==='config')config();
  else vista.innerHTML=`<div class="card"><h2>${FASE[k][0]}</h2><p class="mut">Esta sección se construirá en la ${FASE[k][1]}.</p></div>`;
}
function conexion(){
  const a=$('#aviso'),f=()=>{a.hidden=navigator.onLine;a.textContent='Sin conexión: tus datos guardados siguen disponibles.';};
  addEventListener('online',f);addEventListener('offline',f);f();
}
function sw(){
  if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.register('sw.js').then(r=>{
    const aviso=w=>{const a=$('#aviso');a.hidden=false;a.innerHTML='Hay una versión nueva <button>Actualizar</button>';a.querySelector('button').onclick=()=>w.postMessage('actualizar');};
    if(r.waiting&&navigator.serviceWorker.controller)aviso(r.waiting);
    r.addEventListener('updatefound',()=>{const w=r.installing;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)aviso(w);});});
  });
  let rec=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!rec){rec=true;location.reload();}});
}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();instalar=e;});
addEventListener('hashchange',render);
(async()=>{
  try{ajustes=Object.assign(ajustes,await leer('ajustes','general')||{});perfil=await leer('perfil','principal')||null;pedirPersistencia();}
  catch(e){vista.innerHTML='<div class="card"><h2>No se pudo abrir el almacenamiento</h2><p class="err">Revisa que el navegador permita guardar datos en este sitio.</p></div>';}
  aplicarAjustes();conexion();sw();render();
})();
