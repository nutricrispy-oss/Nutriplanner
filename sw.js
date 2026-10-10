const V='nutriplanner-v5';
const ARCHIVOS=['./','index.html','manifest.json','css/app.css','js/app.js','js/db.js','js/perfil.js','js/vistas.js','js/seguridad.js','js/respaldo.js','js/habitos.js','js/progreso.js','js/exportar.js','js/compras.js','js/historial.js','js/menu.js','js/nutricion.js','js/datos.js','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(ARCHIVOS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data==='actualizar')self.skipWaiting();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(e.request,cp));return res;}).catch(()=>caches.match('index.html'))));
});
