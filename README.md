# NutriPlanner (Fase 1)
Incluye: PWA instalable, navegación inferior, modo claro/oscuro, asistente de perfil (datos, objetivos, preferencias, cocina, salud opcional), estimación orientativa de calorías/macros, almacenamiento local (IndexedDB) y funcionamiento sin conexión.
Pendiente: menús, recetas, compras, progreso, PDF, PIN y copia de seguridad (Fases 2 a 5). Más adelante: IA y funciones avanzadas.

## Probar en local
`python3 -m http.server 8000` y abrir http://localhost:8000 (el service worker requiere localhost o HTTPS).

## Publicar en GitHub Pages
1. Crea un repositorio y sube el contenido de esta carpeta a la raíz.
2. Settings > Pages > Source: rama main, carpeta / (root).
3. Abre la URL https://USUARIO.github.io/REPO/ en Chrome (Android) y usa Ajustes > Instalar, o el menú del navegador > Agregar a pantalla de inicio.
4. Al publicar cambios, sube el número de `V` en sw.js (nutriplanner-v2, v3...) para que se actualice.
