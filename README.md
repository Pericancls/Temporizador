# Temporizador — mapa del código

App web de un solo usuario para planear el día, cronometrar actividades y registrar en qué se fue el tiempo.
Se publica con GitHub Pages en https://pericancls.github.io/Temporizador/ y se sincroniza con Firebase (login con Google).

## Archivos

| Archivo | Qué tiene |
|---|---|
| `index.html` | Solo las pantallas (HTML) y el número de versión `APP_VER` |
| `css/app.css` | Todo el diseño. El orden importa: las reglas de abajo ganan |
| `js/core.js` | Utilidades ($, guardar/cargar, fechas), datos del plan por día, cambio de pestañas |
| `js/actividades.js` | Lista del día: agregar/editar, hora, mover de día, aviso 30 min antes, reordenar, reset ↺, tiempo en vivo |
| `js/temporizador.js` | Corredor, bloques de trabajo, descansos, terminar, guardar/recuperar, voz y alarma, barra superior, 2ª actividad |
| `js/recurrentes.js` | Actividades que se repiten (🔁) |
| `js/minuto-a-minuto.js` | Proyección del día: huecos libres, hora fija, 🔒 candado, 🚗 traslado; botón MM |
| `js/backlog.js` | Backlog, arrastre en compu, cuadro amarillo de fin de semana, versión iPhone |
| `js/notas.js` | Notas por actividad (📝) y notas del día |
| `js/panoramica.js` | Vista panorámica (semana / mes) |
| `js/nueva-actividad.js` | Mini calendario y formulario "Nueva actividad" |
| `js/reportes.js` | Reportes |
| `js/registro.js` | Registro: calendario, lista del día, línea de 24 h, edición de bloques |
| `js/sync.js` | Sincronización con Firebase |
| `js/rapidos.js` | Botones rápidos del Temporizador (agregar, editar, borrar) |
| `js/arranque.js` | Buscar actualización y arranque (siempre va al final) |

Los archivos de `js/` se cargan en el orden de `index.html` y comparten variables globales.

## Cómo publicar una versión nueva

1. Subir `APP_VER` en `index.html` y el `?v=` de **todos** los `<script>` y del `<link>` al mismo número (así el celular no se queda con archivos viejos en caché).
2. Probar en el navegador.
3. `git push` a `main`. GitHub Pages tarda ~1 min; el botón "Buscar actualización" de la app detecta la versión nueva.

## Datos (localStorage y Firestore `users/{uid}`)

- `plans`: actividades por día `{ "2026-11-26": [ {n, m, id, t?, done?, prog?, quick?, rid?, lk?, tr?} ] }`
- `log`: registros terminados `{d, h, n, plan, real, ext, ok, segs:[{s,e}]}`
- `recs` recurrentes · `bl` backlog · `notes` notas por actividad · `dnotes` notas del día · `brk` minutos de descanso · `qb` botones rápidos
- `run` / `run2`: lo que está corriendo (para recuperarlo si se cierra la app)
