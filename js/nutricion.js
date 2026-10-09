export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const r1=x=>Math.round((+x||0)*10)/10;
const CL=['kcal','p','c','fi','g'];
export function calc(ings,mapa){
  const t={kcal:0,p:0,c:0,fi:0,g:0};
  for(const [id,gr] of ings){const a=mapa[id];if(!a)continue;const k=(+gr||0)/100;CL.forEach(x=>t[x]+=(a[x]||0)*k);}
  t.cn=Math.max(0,t.c-t.fi);return t;
}
export function escala(t,f){const o={};for(const k of [...CL,'cn'])o[k]=t[k]*f;return o;}
export const linea=t=>`${Math.round(t.kcal)} kcal · P ${r1(t.p)} g · C ${r1(t.c)} g (neto ${r1(t.cn)}) · Fibra ${r1(t.fi)} g · G ${r1(t.g)} g`;
