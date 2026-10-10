import {leer,guardar,borrar} from './db.js';
import {modal} from './vistas.js';
const enc=new TextEncoder();
const b64=u=>btoa(String.fromCharCode(...u)),ub=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export const pinValido=p=>/^\d{4,6}$/.test(p);
async function derivar(pin,salt,it){
  const k=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:it,hash:'SHA-256'},k,256));
}
export async function crearPin(pin,it=150000){
  const salt=crypto.getRandomValues(new Uint8Array(16));
  return {salt:b64(salt),hash:b64(await derivar(pin,salt,it)),it,v:1};
}
export async function verificarPin(pin,reg){
  const h=await derivar(pin,ub(reg.salt),reg.it),g=ub(reg.hash);let d=h.length^g.length;
  for(let i=0;i<h.length;i++)d|=h[i]^g[i];
  return d===0;
}
export const hayPin=()=>leer('ajustes','pin');
/* Pantalla de bloqueo: se resuelve al desbloquear. */
export function exigirPin(reg){
  return new Promise(ok=>{
    document.body.classList.add('bloqueada');
    const o=document.createElement('div');o.className='bloqueo';
    o.innerHTML=`<div class="card" role="dialog" aria-modal="true" aria-label="Aplicación bloqueada" style="width:100%;max-width:360px"><h2>NutriPlanner bloqueada</h2><label for="bp">Ingresa tu PIN</label><input id="bp" type="password" inputmode="numeric" autocomplete="off" maxlength="6"><p class="err" id="be" role="alert"></p><button class="btn blk" id="bg">Desbloquear</button></div>`;
    document.body.append(o);
    const q=s=>o.querySelector(s);q('#bp').focus();
    const probar=async()=>{
      const est=(await leer('ajustes','pin-intentos'))||{n:0,hasta:0},falta=Math.ceil((est.hasta-Date.now())/1000);
      if(falta>0)return q('#be').textContent=`Demasiados intentos. Espera ${falta} s.`;
      if(await verificarPin(q('#bp').value,reg)){await borrar('ajustes','pin-intentos');o.remove();document.body.classList.remove('bloqueada');return ok();}
      est.n++;if(est.n>=5)est.hasta=Date.now()+Math.min(300,30*2**(est.n-5))*1000;
      await guardar('ajustes','pin-intentos',est);q('#be').textContent='PIN incorrecto.';q('#bp').value='';
    };
    q('#bg').onclick=probar;q('#bp').onkeydown=e=>{if(e.key==='Enter')probar();};
  });
}
/* Tarjeta de seguridad en Ajustes. */
export async function pinCard(cont,refrescar){
  const reg=await hayPin();
  cont.innerHTML=`<div class="card"><h2>Seguridad</h2>${reg?`<p>El bloqueo con PIN está activado.</p><div class="fila"><button class="btn sec" data-a="bloq">Bloquear ahora</button><button class="btn sec" data-a="cambiar">Cambiar PIN</button></div><button class="btn sec blk" data-a="quitar" style="margin-top:10px">Desactivar PIN</button>`:`<p class="mut">Protege la app con un PIN de 4 a 6 dígitos.</p><button class="btn blk" data-a="activar">Activar PIN</button>`}
  <p class="mut" style="margin-top:12px">El PIN no se guarda en texto plano, pero no es una protección absoluta: los datos locales también dependen de la seguridad de tu dispositivo. Si olvidas el PIN, la única salida es borrar los datos de la app, por eso conviene tener una copia de seguridad.</p></div>`;
  cont.onclick=e=>{const a=e.target.closest('[data-a]')?.dataset.a;if(!a)return;
    if(a==='bloq')return window.dispatchEvent(new Event('bloquear-ahora'));
    const pedirActual=a!=='activar',nuevo=a!=='quitar';
    const mod=modal(`<h2>${a==='activar'?'Activar PIN':a==='cambiar'?'Cambiar PIN':'Desactivar PIN'}</h2>${pedirActual?'<label for="p0">PIN actual</label><input id="p0" type="password" inputmode="numeric" maxlength="6" autocomplete="off">':''}${nuevo?'<label for="p1">PIN nuevo (4 a 6 dígitos)</label><input id="p1" type="password" inputmode="numeric" maxlength="6" autocomplete="off"><label for="p2">Repite el PIN nuevo</label><input id="p2" type="password" inputmode="numeric" maxlength="6" autocomplete="off">':''}<p class="err" id="pe" role="alert"></p><div class="fila"><button class="btn sec" data-x>Cancelar</button><button class="btn" data-ok>Guardar</button></div>`);
    mod.addEventListener('click',async ev=>{if(!ev.target.closest('[data-ok]'))return;const q=s=>mod.querySelector(s);
      if(pedirActual&&!(await verificarPin(q('#p0').value,reg)))return q('#pe').textContent='El PIN actual no es correcto.';
      if(nuevo){const p1=q('#p1').value;if(!pinValido(p1))return q('#pe').textContent='El PIN debe tener de 4 a 6 dígitos.';if(p1!==q('#p2').value)return q('#pe').textContent='Los PIN no coinciden.';await guardar('ajustes','pin',await crearPin(p1));}
      else await borrar('ajustes','pin');
      mod.remove();refrescar();});
  };
}
