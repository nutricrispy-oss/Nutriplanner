# NutriPlanner v0.7

Planificador nutricional personal (PWA). Funciona sin conexión y guarda los datos solo en tu dispositivo.

## Estructura
```
index.html  manifest.json  sw.js  README.md
css/app.css
icons/ (192, 512, maskable)
js/ app.js (arranque y rutas) · db.js (IndexedDB) · datos.js (alimentos y recetas)
    nutricion.js · menu.js (generador y balance de macros) · vistas.js (Inicio, Menú, Recetas, Calculadora, ¿Qué cocino?)
    compras.js (lista y despensa) · historial.js (calendario) · progreso.js (peso) · habitos.js (agua, fibra, ayuno)
    gdrive.js (copia en Google Drive) · exportar.js (PDF/imprimir/compartir) · seguridad.js (PIN) · respaldo.js (copias) · perfil.js (asistente)
```

## Instalar y publicar en GitHub Pages
1. Crea un repositorio y sube el contenido de esta carpeta a la raíz.
2. Settings > Pages > Source: rama main, carpeta / (root).
3. Abre https://USUARIO.github.io/REPO/ en Chrome (Android) y toca Ajustes > "Instalar en pantalla de inicio" (o el menú del navegador).
4. Para publicar cambios: sube los archivos y aumenta el número de `V` en sw.js (nutriplanner-v7, v8…). La app avisará "Hay una versión nueva".
Para probar en local: `python3 -m http.server 8000` y abrir http://localhost:8000.

## Manual breve
- **Inicio:** próxima comida, progreso del día (calorías, macros, fibra), agua, ayuno y peso.
- **Mi menú:** "Generar menú semanal"; por comida: marcar hecha, cambiar (3 alternativas) o ver/editar (porciones, cantidades, cambiar ingrediente). También regenerar día, semana nueva, copiar semana anterior, balancear porciones y exportar (PDF compacto o detallado, imprimir, compartir). Pestaña Historial: calendario y semanas guardadas.
- **Compras:** lista automática por sección, con personas, precios (que cargas tú), "Ya tengo", compartir, imprimir y listas guardadas. Pestaña Despensa: cantidades y vencimientos (dd/mm/aaaa).
- **Recetas:** buscador con filtros, favoritas, recetas propias, **Calculadora** (alimentos del día, alimentos propios) y **¿Qué cocino?** (recetas según los ingredientes que tienes).
- **Mi progreso:** registro de peso y medidas, gráfico, historial y exportación CSV.
- **Ajustes:** tema, nombre de la app, pescados de mar, PIN, copia de seguridad, hábitos (agua, fibra, ayuno) y perfil.

## Copia de seguridad
Ajustes > Copia de seguridad > "Exportar copia" descarga un archivo JSON. Para restaurar: "Importar copia"; la app valida el archivo, muestra su contenido, avisa que reemplaza tus datos y descarga antes una copia de los datos actuales. El PIN no se incluye. No hay copia automática en la nube: si borras los datos del navegador, desinstalas la app o cambias de teléfono sin respaldo, los datos se pierden. Conviene exportar una copia cada semana.

## Funciones implementadas
Perfil y asistente, generador semanal con balance de calorías, macros y fibra, sustituciones, recetario (76 recetas) y recetas propias, calculadora nutricional, lista de compras, despensa, precios, calendario e historial, seguimiento de peso, PDF compacto/detallado, agua, fibra mínima, ayuno por horas, ¿Qué cocino?, PIN, copias de seguridad, modo oscuro, instalación y modo sin conexión.

## Pendiente o dependiente de servicios externos
- Consultas de platos (milanesa, pastel…), IA y fotos de platos: no incluidos. La IA requiere un servicio intermedio con clave de API (no puede ir en el navegador), tiene costo por uso, necesita internet y consentimiento para enviar datos.
- Recordatorios con notificaciones, código de barras y respaldo en la nube: no incluidos.
- Los valores nutricionales son una tabla propia de referencia (basada en USDA, redondeada). Surubí, mondongo, lengua y queso Paraguay son aproximaciones. Son estimaciones, no mediciones.

## Qué se probó
Probado automáticamente (lógica y datos, con IndexedDB simulado): perfil, generación y recuperación de la semana, exclusiones, cálculo nutricional, cambio de comida y de ingredientes, lista sin duplicados, despensa, registro de peso, respaldo y restauración (conserva el PIN), hash del PIN, validación de archivos dañados, ¿Qué cocino?, ayuno y agua.
**No probado en un navegador ni en un celular real:** pantallas y diseño, gráfico, instalación como PWA, modo sin conexión, bloqueo con PIN en pantalla, descarga/importación de archivos, impresión y PDF, compartir. Revísalos en tu Android y reporta lo que falle.

## Aviso
NutriPlanner organiza tu alimentación; no diagnostica ni prescribe, y no sustituye a un médico o nutricionista. No calcula dosis de insulina. Con embarazo, enfermedad renal, diabetes, antecedentes de trastornos alimentarios u otras condiciones, consulta antes de fijar objetivos restrictivos o ayuno.


## Novedades v0.7
- **Índice glucémico (IG):** cada alimento con IG conocido (tabla de la Fundación para la Salud) muestra su nivel (bajo ≤ 55, moderado 56 a 69, alto ≥ 70). Cada comida y cada día muestran un IG medio ponderado por carbohidratos y las raciones de HC (1 ración = 10 g). El generador prefiere platos de IG bajo y evita los de IG alto con muchos carbohidratos; se puede desactivar en Ajustes. En Compras, los productos llevan su IG y los de IG alto sugieren una alternativa más baja. Al cambiar un ingrediente, los sustitutos de IG más bajo salen primero. El IG de un plato mixto es aproximado.
- **Tabla HC** (Recetas > Tabla HC): 127 alimentos de la tabla, con buscador, filtro de IG y cálculo de HC para tu porción. Es una transcripción parcial: verifica con el documento original.
- **Modelo del plato** (Mi menú > "Modelo del plato e índice glucémico") y distribución del plato en cada comida (Ver / editar).
- **Identificador propio:** el manifest tiene `id: nutriplanner-app`; la base de datos se llama `nutriplanner` y las cachés empiezan con `nutriplanner-`. Esta app solo borra sus propias cachés, por lo que no afecta a otras apps del repositorio. Publícala en su propia carpeta (por ejemplo `/nutriplanner/`) para que su service worker quede limitado a esa carpeta.
- **Copia en Google Drive** (Ajustes > Copia de seguridad).

## Configurar la copia en Google Drive
La app usa la carpeta privada de la app en tu Drive (permiso `drive.appdata`: solo ve sus propios archivos). No incluye ninguna clave secreta: el ID de cliente es público, pero lo creas tú.
1. Entra a https://console.cloud.google.com y crea un proyecto.
2. APIs y servicios > Biblioteca > activa **Google Drive API**.
3. APIs y servicios > Pantalla de consentimiento OAuth: tipo Externo, en modo Pruebas, y agrega tu correo de Google como usuario de prueba.
4. Credenciales > Crear credenciales > ID de cliente de OAuth > Aplicación web. En "Orígenes autorizados de JavaScript" agrega solo el origen, por ejemplo `https://USUARIO.github.io` (sin ruta).
5. Copia el ID de cliente (termina en `.apps.googleusercontent.com`) y pégalo en Ajustes > Copia en Google Drive.
6. Toca "Subir a Drive" y autoriza. En modo Pruebas Google muestra "app no verificada": es normal en uso personal.
Notas: requiere internet; la autorización dura aproximadamente una hora y se vuelve a pedir; se conservan las 5 copias más recientes; el PIN no se sube; la primera subida pide tu consentimiento.
**No probado contra Google real:** solo se probó la lógica con respuestas simuladas.
