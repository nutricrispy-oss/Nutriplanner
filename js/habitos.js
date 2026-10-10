import {esc} from './nutricion.js';
const hm=t=>{const m=String(t).trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);return m?+m[1]*60+ +m[2]:null;};
const fh=min=>{min=((min%1440)+1440)%1440;return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0');};
export const hmValido=t=>hm(t)!==null;
export function aguaObjetivo(p){
  if(!p||(p.condiciones||[]).includes('Enfermedad renal'))return null;
  if(+p.agua>0)return +p.agua;
  if(!(+p.peso>0))return 2000;
  return Math.min(3500,Math.max(1500,Math.round(p.peso*35/250)*250));
}
export function ventana(p){
  if(!p?.ayuno?.on)return null;
  const [ay,co]=String(p.ayuno.prot).split(':').map(Number),ini=hm(p.ayuno.inicio);
  return ini===null||!co?null:{ini,fin:ini+co*60,co,ay};
}
export function estadoAyuno(p,ahora=new Date()){
  const v=ventana(p);if(!v)return null;
  const d=(((ahora.getHours()*60+ahora.getMinutes())-v.ini)%1440+1440)%1440,dentro=d<v.co*60,r=dentro?v.co*60-d:1440-d;
  return {dentro,txt:dentro?`Ventana de comida abierta. Se cierra en ${Math.floor(r/60)} h ${r%60} min.`:`En ayuno. La ventana abre en ${Math.floor(r/60)} h ${r%60} min.`,rango:`${fh(v.ini)} a ${fh(v.fin)}`,prot:p.ayuno.prot};
}
export function horaSugerida(p,i,n){
  const v=ventana(p);if(!v)return '';
  return fh(n>1?v.ini+Math.round(i*(v.co*60-60)/(n-1)/15)*15:v.ini);
}
export function habitosForm(cont,p,guardarPerfil){
  if(!p){cont.innerHTML='<div class="card"><h2>Hábitos diarios</h2><p class="mut">Crea tu perfil para configurar agua, fibra y ayuno.</p></div>';return;}
  const a=p.ayuno||{on:false,prot:'16:8',inicio:'12:00'},cond=p.condiciones||[],renal=cond.includes('Enfermedad renal'),tca=cond.includes('Antecedentes de trastornos alimentarios');
  cont.innerHTML=`<div class="card"><h2>Hábitos diarios</h2>
  ${renal?'<p class="mut">Con enfermedad renal, la cantidad de líquidos debe indicarla tu profesional. Aquí solo llevarás un registro de agua.</p>':`<label for="h-agua">Agua al día (ml)</label><input id="h-agua" type="number" inputmode="numeric" min="500" max="6000" step="50" value="${aguaObjetivo(p)}"><p class="mut">Estimación orientativa (unos 35 ml por kg). Ajusta según calor, ejercicio e indicación de tu profesional.</p>`}
  <label for="h-fibra">Fibra mínima al día (g)</label><input id="h-fibra" type="number" inputmode="numeric" min="15" max="60" value="${p.fibra||25}">
  <label class="chk" style="margin-top:14px"><input type="checkbox" id="h-ay" ${a.on&&!tca?'checked':''} ${tca?'disabled':''}>Ayuno intermitente por horas</label>
  ${tca?'<p class="mut">Por los antecedentes que indicaste en tu perfil, no recomendamos el ayuno intermitente. Consulta con un profesional.</p>':''}
  <div id="h-ayc" ${a.on&&!tca?'':'hidden'}><label for="h-pr">Protocolo (horas de ayuno : horas de comida)</label><select id="h-pr">${['12:12','14:10','16:8','18:6'].map(x=>`<option ${x===a.prot?'selected':''}>${x}</option>`).join('')}</select>
  <label for="h-in">Inicio de la ventana de comida (hh:mm)</label><input id="h-in" inputmode="numeric" placeholder="12:00" value="${esc(a.inicio)}">
  <p class="mut">No es adecuado en embarazo, lactancia, antecedentes de trastornos alimentarios ni para menores. Con diabetes u otras condiciones, consulta antes a tu equipo médico.</p></div>
  <p class="err" id="h-e" role="alert"></p><button class="btn blk" id="h-g">Guardar hábitos</button></div>`;
  const q=s=>cont.querySelector(s);
  q('#h-ay').onchange=e=>{q('#h-ayc').hidden=!e.target.checked;};
  q('#h-g').onclick=()=>{
    const f=+q('#h-fibra').value,n=Object.assign({},p),on=q('#h-ay').checked;
    if(!(f>=15&&f<=60))return q('#h-e').textContent='La fibra mínima debe estar entre 15 y 60 g.';
    if(!renal){const ag=+q('#h-agua').value;if(!(ag>=500&&ag<=6000))return q('#h-e').textContent='El agua debe estar entre 500 y 6000 ml.';n.agua=Math.round(ag);}
    n.fibra=Math.round(f);
    if(on){const ini=q('#h-in').value.trim();if(!hmValido(ini))return q('#h-e').textContent='Hora de inicio inválida. Usa hh:mm, por ejemplo 12:00.';
      if(!a.on&&cond.some(c=>c!=='Antecedentes de trastornos alimentarios')&&!confirm('Indicaste una condición de salud en tu perfil. El ayuno intermitente puede no ser adecuado: consulta antes con tu profesional. ¿Activarlo de todos modos?'))return;
      n.ayuno={on:true,prot:q('#h-pr').value,inicio:ini.length===4?'0'+ini:ini};}
    else n.ayuno={on:false,prot:a.prot,inicio:a.inicio};
    q('#h-e').textContent='';guardarPerfil(n);
  };
}
