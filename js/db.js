// Almacenamiento local (IndexedDB). Almacenes ya creados para las fases siguientes.
const NOMBRE='nutriplanner', ALMACENES=['ajustes','perfil','menus','recetas','peso','compras','despensa','alimentos'];
let _db;
function abrir(){
  if(_db) return Promise.resolve(_db);
  return new Promise((ok,ko)=>{
    const r=indexedDB.open(NOMBRE,1);
    r.onupgradeneeded=()=>ALMACENES.forEach(a=>{if(!r.result.objectStoreNames.contains(a))r.result.createObjectStore(a)});
    r.onsuccess=()=>{_db=r.result;ok(_db)};
    r.onerror=()=>ko(r.error);
  });
}
async function tx(alm,modo,fn){
  const db=await abrir();
  return new Promise((ok,ko)=>{
    const t=db.transaction(alm,modo),q=fn(t.objectStore(alm));
    t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>ko(t.error);t.onabort=()=>ko(t.error);
  });
}
export const leer=(alm,k)=>tx(alm,'readonly',s=>s.get(k));
export const guardar=(alm,k,v)=>tx(alm,'readwrite',s=>s.put(v,k));
export const borrar=(alm,k)=>tx(alm,'readwrite',s=>s.delete(k));
export const todo=(alm)=>tx(alm,'readonly',s=>s.getAll());
export const pedirPersistencia=()=>navigator.storage&&navigator.storage.persist?navigator.storage.persist():Promise.resolve(false);
