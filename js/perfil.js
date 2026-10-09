// Asistente de configuración inicial y edición del perfil.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ACT=[['1.2','Sedentaria (poco o nada de ejercicio)'],['1.375','Ligera (1-3 días por semana)'],['1.55','Moderada (3-5 días por semana)'],['1.725','Alta (6-7 días por semana)']];
const OBJ=['Pérdida de peso','Mantenimiento','Ganancia muscular','Mejora de hábitos'];
const ENF=['Bajo en carbohidratos','Moderado en carbohidratos','Personalizado'];
const COND=['Embarazo o lactancia','Enfermedad renal','Antecedentes de trastornos alimentarios','Diabetes','Otra condición médica relevante'];
const PASOS=[
 {t:'Tus datos',f:[['nombre','Nombre o apodo','text',1],['edad','Edad','number',1,10,100],['sexo','Sexo (para las estimaciones)','sel',0,['Mujer','Hombre','Prefiero no indicar']],['altura','Altura (cm)','number',1,100,230],['peso','Peso actual (kg)','number',1,25,300],['pesoObj','Peso objetivo en kg (opcional)','number',0,25,300]]},
 {t:'Tu objetivo',f:[['actividad','Nivel de actividad física','selv',1,ACT],['objetivo','Objetivo','sel',1,OBJ],['comidas','Comidas por día','number',1,2,8],['enfoque','Enfoque de carbohidratos','sel',1,ENF],['est']
  ,['kcal','Calorías diarias (opcional)','number',0,800,6000],['prot','Proteínas (g)','number',0,0,500],['carb','Carbohidratos (g)','number',0,0,800],['grasa','Grasas (g)','number',0,0,400]]},
 {t:'Preferencias',f:[['alergias','Alergias, intolerancias y restricciones','chips'],['favoritos','Alimentos favoritos','chips'],['noGusta','Alimentos que no te gustan o no quieres comer','chips'],['cuesta','Alimentos que te cuesta consumir','chips']]},
 {t:'Cocina y presupuesto',f:[['tiempo','Tiempo disponible para cocinar','sel',0,['Menos de 20 min','20 a 40 min','Más de 40 min']],['presupuesto','Presupuesto semanal aproximado (opcional)','number',0,0,1e9],['equipo','Equipamiento de cocina','chips'],['pais','País o región','text',0],['moneda','Moneda','text',0]]},
 {t:'Salud (opcional)',f:[['condiciones','¿Alguna de estas situaciones te aplica? Es opcional.','multi']]}
];
export const calcularEstimacion=p=>{
  const {edad:a,altura:h,peso:w}=p;
  if(!(a>0&&h>0&&w>0)) return {error:'Completa edad, altura y peso en el paso anterior para estimar.'};
  const s=p.sexo==='Hombre'?5:p.sexo==='Mujer'?-161:-78;
  const tmb=10*w+6.25*h-5*a+s, gasto=tmb*parseFloat(p.actividad||1.2);
  const aj=p.objetivo==='Pérdida de peso'?0.9:p.objetivo==='Ganancia muscular'?1.08:1;
  const kcal=Math.round(gasto*aj/10)*10, prot=Math.round(1.4*w);
  const pc={'Bajo en carbohidratos':.2,'Moderado en carbohidratos':.4}[p.enfoque]??.3;
  const carb=Math.round(kcal*pc/4), grasa=Math.max(0,Math.round((kcal-prot*4-carb*4)/9));
  return {kcal,prot,carb,grasa};
};
export function asistente(cont,inicial,alTerminar){
  const d=Object.assign({moneda:'Gs.',pais:'Paraguay',comidas:3,actividad:'1.375',objetivo:OBJ[3],enfoque:ENF[0],alergias:[],favoritos:[],noGusta:[],cuesta:[],equipo:[],condiciones:[]},inicial||{});
  let paso=0,msg='';
  const campo=f=>{
    const [k,l,t,req,a,b]=f; const v=d[k];
    if(k==='est') return `<button type="button" class="btn sec blk" data-est style="margin-top:14px">Estimar mis objetivos</button><p class="mut">Es una estimación orientativa, no una indicación profesional. Puedes escribir tus propios valores abajo.</p>`;
    const lb=`<label for="c-${k}">${esc(l)}${req?' *':''}</label>`;
    if(t==='sel') return lb+`<select id="c-${k}" data-k="${k}"><option value="">Elegir…</option>${a.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
    if(t==='selv') return lb+`<select id="c-${k}" data-k="${k}">${a.map(([x,y])=>`<option value="${x}" ${x==v?'selected':''}>${esc(y)}</option>`).join('')}</select>`;
    if(t==='chips') return `<label for="c-${k}">${esc(l)}</label><div class="chips">${(v||[]).map((x,i)=>`<span class="chip">${esc(x)}<button type="button" data-q="${k}:${i}" aria-label="Quitar ${esc(x)}">×</button></span>`).join('')}</div><div class="add"><input id="c-${k}" data-chip="${k}" placeholder="Escribe y toca Agregar" enterkeyhint="done"><button type="button" class="btn sec" data-a="${k}">Agregar</button></div>`;
    if(t==='multi') return `<p>${esc(l)}</p>`+COND.map((c,i)=>`<label style="display:flex;gap:10px;align-items:center;font-weight:500"><input type="checkbox" style="width:24px;min-height:24px" data-cond="${esc(c)}" ${v.includes(c)?'checked':''}>${esc(c)}</label>`).join('');
    const num=t==='number'?` inputmode="decimal" min="${a}" max="${b}" step="any"`:'';
    return lb+`<input id="c-${k}" data-k="${k}" type="${t==='number'?'number':'text'}"${num} value="${esc(v)}">`;
  };
  const dibujar=()=>{
    const P=PASOS[paso], ult=paso===PASOS.length-1;
    const riesgo=d.condiciones.length?`<div class="nota">Con estas situaciones conviene consultar a un profesional de la salud antes de fijar objetivos restrictivos. NutriPlanner organiza tu alimentación; no diagnostica ni prescribe.${d.condiciones.includes('Diabetes')?' Si tienes diabetes, coordina con tu equipo médico los cambios en carbohidratos. La app nunca calcula insulina.':''}</div>`:'';
    cont.innerHTML=`<div class="card"><div class="pasos">${PASOS.map((_,i)=>`<i class="${i<=paso?'on':''}"></i>`).join('')}</div><h2>${P.t}</h2><p class="mut">Paso ${paso+1} de ${PASOS.length}</p>${P.f.map(campo).join('')}${ult?riesgo:''}${msg?`<p class="err" role="alert">${esc(msg)}</p>`:''}<div class="fila">${paso?'<button type="button" class="btn sec" data-ant>Atrás</button>':''}<button type="button" class="btn" data-sig>${ult?'Guardar perfil':'Continuar'}</button></div></div>`;
  };
  const valido=()=>{
    for(const f of PASOS[paso].f){const [k,l,t,req,a,b]=f; if(!req||k==='est')continue; const v=d[k];
      if(v===undefined||v===''||v===null) return `Completa: ${l}`;
      if(t==='number'&&(isNaN(+v)||+v<a||+v>b)) return `${l}: valor entre ${a} y ${b}`;}
    for(const f of PASOS[paso].f){const [k,l,t,req,a,b]=f; if(t==='number'&&!req&&d[k]!==undefined&&d[k]!==''&&(+d[k]<a||+d[k]>b)) return `${l}: valor entre ${a} y ${b}`;}
    return '';
  };
  const sync=()=>cont.querySelectorAll('[data-k]').forEach(e=>{const k=e.dataset.k;d[k]=e.type==='number'?(e.value===''?'':+e.value):e.value;});
  const agregar=k=>{const e=cont.querySelector(`[data-chip="${k}"]`),v=e.value.trim();if(v&&!d[k].some(x=>x.toLowerCase()===v.toLowerCase()))d[k].push(v);sync();dibujar();cont.querySelector(`[data-chip="${k}"]`)?.focus();};
  cont.onclick=e=>{
    const b=e.target.closest('button'); if(!b)return;
    if(b.dataset.q){sync();const [k,i]=b.dataset.q.split(':');d[k].splice(+i,1);dibujar();}
    else if(b.dataset.a)agregar(b.dataset.a);
    else if(b.dataset.est){sync();const r=calcularEstimacion(d);if(r.error)msg=r.error;else{msg='';Object.assign(d,r);}dibujar();}
    else if('ant' in b.dataset){sync();msg='';paso--;dibujar();}
    else if('sig' in b.dataset){sync();msg=valido();if(!msg){if(paso<PASOS.length-1)paso++;else{alTerminar(d);return;}}dibujar();window.scrollTo(0,0);}
  };
  cont.onchange=e=>{const c=e.target.dataset.cond;if(c){d.condiciones=d.condiciones.filter(x=>x!==c);if(e.target.checked)d.condiciones.push(c);dibujar();}};
  cont.onkeydown=e=>{if(e.key==='Enter'&&e.target.dataset.chip){e.preventDefault();agregar(e.target.dataset.chip);}};
  dibujar();
}
