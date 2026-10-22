// Copia de seguridad en Google Drive. Usa la carpeta privada de la app (appDataFolder): solo esta app puede ver esos archivos.
// Requiere un ID de cliente OAuth (público, no es una clave secreta) creado por el usuario en Google Cloud. Ver README.
export const SCOPE='https://www.googleapis.com/auth/drive.appdata';
let token=null,expira=0;
function cargarGIS(){
  return new Promise((ok,ko)=>{
    if(window.google&&google.accounts&&google.accounts.oauth2)return ok();
    const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
    s.onload=ok;s.onerror=()=>ko(new Error('No se pudo cargar el servicio de Google. Revisa tu conexión a internet.'));
    document.head.append(s);
  });
}
export async function obtenerToken(clientId){
  if(token&&Date.now()<expira-60000)return token;
  await cargarGIS();
  return new Promise((ok,ko)=>{
    const c=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:SCOPE,
      callback:r=>{if(r.error)return ko(new Error(r.error_description||r.error));token=r.access_token;expira=Date.now()+(r.expires_in||3600)*1000;ok(token);},
      error_callback:e=>ko(new Error(e&&e.type==='popup_closed'?'Cerraste la ventana de Google antes de autorizar.':'No se pudo autorizar con Google.'))});
    c.requestAccessToken();
  });
}
export const cerrarSesion=()=>{token=null;expira=0;};
async function api(t,url,opt={}){
  const r=await fetch(url,{...opt,headers:{Authorization:'Bearer '+t,...(opt.headers||{})}});
  if(r.status===401)cerrarSesion();
  if(!r.ok){const m=await r.text().catch(()=>'');throw new Error(`Google Drive respondió ${r.status}. ${m.slice(0,140)}`);}
  return r;
}
export function multipart(meta,contenido,limite='nutriplanner_'+Date.now()){
  const cuerpo=`--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${limite}\r\nContent-Type: application/json\r\n\r\n${contenido}\r\n--${limite}--`;
  return {cuerpo,tipo:`multipart/related; boundary=${limite}`};
}
export async function listar(t){
  const f=encodeURIComponent('files(id,name,createdTime,size)');
  const r=await api(t,`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&orderBy=createdTime%20desc&pageSize=20&fields=${f}`);
  return (await r.json()).files||[];
}
export async function subir(t,nombre,contenido){
  const {cuerpo,tipo}=multipart({name:nombre,parents:['appDataFolder']},contenido);
  const r=await api(t,'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime',{method:'POST',headers:{'Content-Type':tipo},body:cuerpo});
  return r.json();
}
export async function descargar(t,id){return (await api(t,`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`)).text();}
export async function borrarArchivo(t,id){await api(t,`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`,{method:'DELETE'});}
export async function limpiarAntiguos(t,max=5){const L=await listar(t);for(const f of L.slice(max))await borrarArchivo(t,f.id);return Math.max(0,L.length-max);}
