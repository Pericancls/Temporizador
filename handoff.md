# Handoff — App Temporizador de David

> Léelo completo antes de tocar algo. Resume ~120 versiones de trabajo y la forma en que trabajamos.
> Última versión publicada: **v121** (26 nov 2026).

---

## 1) Objetivo

**De la app:** David (dueño de PICUM, carpintería, y estudiante de maestría en ITESO) usa esta app para planear su día, cronometrar cada actividad por bloques y registrar en qué se le fue el tiempo, para estimar mejor y concentrarse más.

**Sus 5 objetivos, como él los dijo:**
1. "periodos de enfoque objetivo maximizarlos a un máximo de dos horas de periodo de enfoque. va de la mano reducir las interrupciones entre las tareas. lo ideal es que si se inicia la tarea se termina."
2. "respetar el tiempo entre tareas. se da un descanso opcional de 7-10 hasta 20 min debería de estar bien pero no más que eso."
3. "registrar las parálisis de actividad. escribir si es por falta de material, miedo, parálisis, falta de preparación. la idea es que todas esas notas se analicen y vayamos descubriendo patrones."
4. "ser constante, trackeo de hábitos, esta casi no la hemos trabajado, se queda en stand by, solo está la de ejercicio."
5. "hay que simplificar la herramienta para que no sea objeto de distracción."

**Del siguiente chat:** seguir mejorando la app al ritmo de David (cambios pequeños y seguidos, publicados en el momento) y llevarla hacia esos 5 objetivos sin volverla más complicada.

### Cómo trabajamos (la dinámica, importante)
- **Idioma y tono:** español mexicano informal. Respuestas **cortas**, legibles en el iPhone; tablas cortas o viñetas. Nada de explicar el proceso paso a paso.
- **David pide un cambio → se hace, se prueba, se publica y se le da el link** `https://pericancls.github.io/Temporizador/?v=NNN` (el `?v=` evita la caché). No pedir permiso para cosas claras; preguntar solo si de verdad es ambiguo.
- **Antes de decirle que abra algo, verificar** que `origin/main` tenga el `APP_VER` nuevo y que el cambio realmente se vea. Nunca mandarlo a revisar algo que quedó igual.
- **Cambios chicos** (texto, color, un botón): prueba rápida y publicar, sin capturas. **Funciones nuevas:** prueba completa con Playwright y captura para mandarle (SendUserFile).
- Muchas veces manda **capturas de pantalla** de su iPhone o compu señalando qué cambiar. "A la derecha/izquierda" se refiere a la pantalla que él ve.
- Cambia de idea rápido ("no, mejor…"). Hacer lo último que pidió.
- Corregirlo y sugerir mejoras cuando algo choque con sus objetivos (sobre todo el 5, simplificar). No darle la razón en todo.
- **No borrar funciones ni datos sin confirmarlo con él.**
- Cada versión va en un commit `vNNN: descripción corta` con las líneas de atribución que pida el sistema.
- Él usa el botón 🛠️ "Mejorar la app 30 min" para cronometrar estas sesiones.

---

## 2) Estado actual

- **Repo:** `Pericancls/Temporizador` (GitHub, rama `main`), publicado con **GitHub Pages**: https://pericancls.github.io/Temporizador/
- **Versión publicada:** v121 (`APP_VER=121` en `index.html`).
- **Sincronización:** Firebase (proyecto de David). Login con Google (`signInWithPopup`) y Firestore en `users/{uid}` con `{plans, log, brk, recs, bl, notes, dnotes, qb, acts, updated}`. Guardado automático, sin botón de guardar.
- **La usa en:** iPhone (principal), iPad Air y compu Windows con Chrome. En compu (`min-width:1100px` + puntero fino) tiene un diseño de 3 columnas.

### Pestañas (barra de abajo, en este orden)
| Pestaña | Qué hace |
|---|---|
| 📓 Registro | Calendario, lista del día, línea de 24 h, edición de bloques y notas del día (abajo a la izquierda) |
| ⏱ Temporizador | Iniciar libre, minutos rápidos, 🔁 recurrentes, ☕ descanso y **botones rápidos propios** (Ejercicio 25, Desayuno 40, Mejorar la app 30, Baño 10; se agregan, editan y borran) |
| 📥 Backlog (solo iPhone) | Backlog + cuadro amarillo de fin de semana (máx. 5 por día y 10 en total) |
| 📋 Actividades | Lista del día. Fila: **hora azul arriba / minutos verdes abajo** (antes del nombre), nombre, 🔒 🚗 📝 en fila, pastilla de tiempo en vivo, ↺ reset, ▶. En pausa muestra **"21/34 min"** (rojo si se pasa). Botón MM para ver Minuto a minuto en iPhone/iPad. Deslizar a la derecha = día siguiente; a la izquierda = Backlog |
| 📅 Panorámica | Semana / mes; tocar un hueco crea una actividad de 30 min |
| 📊 Reportes | Dónde se fue tu tiempo, uso del día hábil |

### Funciones clave
- **Temporizador:** bloques por actividad (solo la **pausa** corta un bloque). Salir y continuar / salir y pausar, +5, 📝 Nota, **✓ Terminar actividad** (registra, tacha y pasa al descanso), barra superior con hora de inicio editable, editar o borrar bloques, **2 actividades a la vez** (barra morada), descanso con ⏭ Saltar / ☕ Descansar.
- **Minuto a minuto:** empieza en max(ahora, 5:00 am). Las actividades **con hora** van fijas; las que no tienen hora llenan los huecos en el orden de la lista y **se brincan** los bloques fijos. Una actividad con hora que ya se empezó se toma como adelantada y se acomoda como las que no tienen hora. **🔒 candado:** solo hay aviso rojo si algo choca con un bloque con candado; las que no tienen candado pueden ir en paralelo. Todo lo que tenga "traslado" en el nombre lleva candado por defecto. **🚗 traslado:** agrega 30 min antes (bloque rojo) y le pone candado.
- **Calendario:** al terminar una actividad con hora pregunta si se agrega al Calendario (.ics con alarma). Las recurrentes usan RRULE.
- **Quitado en la limpieza (v112, aprobado por David):** mini descanso, "agregar registro manual" y gráfica de control.

---

## 3) Archivos y cambios

En la v119 el archivo único se separó por secciones, sin cambiar el funcionamiento. Copia local de trabajo: `/home/claude/site` (si no existe: `git clone https://github.com/Pericancls/Temporizador.git site`).

| Archivo | Qué tiene |
|---|---|
| `index.html` | Solo las pantallas, `<script>const APP_VER=NNN</script>` y los `<script src="js/...?v=NNN">` |
| `css/app.css` | Todo el diseño (el orden importa: lo de abajo gana) |
| `js/core.js` | `$`, `load`/`store` (guardar local + sync), fechas, `plans`/`acts`, `tab()` |
| `js/actividades.js` | Lista (`render`), agregar/editar, hora, `toast()`, `progFrac`, `isLk`/`toggleLock`, `toggleTr`, reset, tiempo en vivo |
| `js/temporizador.js` | `startQuick`, corredor (`go`, `begin`, `pause`, `finish`, `endAct`), descansos, guardar/recuperar `run`, `cur2` (2ª actividad) |
| `js/recurrentes.js` | `recs` (🔁) |
| `js/minuto-a-minuto.js` | `renderPrev` (proyección: `fixAt`, `fitAt`, choques), botón MM |
| `js/backlog.js` | `bl`, arrastre en compu, fin de semana (`wk*`) |
| `js/notas.js` | `notes` (por actividad) y `dnotes` (del día) |
| `js/panoramica.js` · `js/nueva-actividad.js` · `js/reportes.js` · `js/registro.js` | Sus pantallas |
| `js/sync.js` | `pushSync`, `applyRemote`, `onLogin` (merge) |
| `js/rapidos.js` | Botones rápidos `qb` (`renderQb`, `qbForm`, `qbSave`, `qbDel`, deshacer) |
| `js/arranque.js` | Buscar actualización y arranque (siempre al final) |
| `README.md` | Mapa del código y de los datos |
| `handoff.md` | Este archivo |

**Datos** (localStorage + Firestore): `plans{fecha:[{n,m,id,t?,done?,prog?,quick?,rid?,rk?,lk?,tr?}]}`; `prog{el,rem,tot,ext,st,segs}`; `log[{d,h,n,plan,real,ext,ok,segs[{s,e}],post?,manual?}]`; `recs`, `bl`, `notes` (borrado suave y merge), `dnotes` (merge por `u`), `qb`, `brk`; `run`/`run2` para lo que está corriendo.
**Para agregar una clave nueva sincronizada:** agregarla en `store()` de `core.js` y en `sync.js` (`pushSync`, `applyRemote`, `onLogin` en sus dos `ref.set`) y en la exportación de `registro.js`.

### Cómo publicar (siempre así)
```bash
cd /home/claude/site
# 1) subir versión: APP_VER, todos los ?v= y la etiqueta >vNNN<
sed -i 's/APP_VER=121/APP_VER=122/;s/?v=121/?v=122/g;s/>v121</>v122</' index.html
# 2) probar (Playwright, abajo)
head -1 index.html   # debe ser <!DOCTYPE html>
git add -A && git commit -m "v122: ..." && git pull --rebase && git push
git fetch -q && git show origin/main:index.html | grep -o "APP_VER=[0-9]*"   # verificar
```

### Plantilla de prueba (Playwright + Chrome)
```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':393,'height':852},timezone_id='America/Mexico_City',device_scale_factor=2)  # compu: 1400x900
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.route('**/*',lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
    pg.goto('file:///home/claude/site/index.html');pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(300)
    pg.evaluate("tab(1)")   # 0 Temporizador, 1 Actividades, 2 Registro, 3 Reportes, 4 Panorámica, 5 Backlog
    # ...acciones... ; pg.screenshot(path='/home/claude/x.png'); print(errs)
```
Para fijar la hora: `pg.clock.install(time=datetime(...,tzinfo=timezone.utc))` (CDMX = UTC-6). Siempre revisar que `errs` quede vacío.

---

## 4) Intentos fallidos (no repetir)

- **v99 rota:** un `sed` con `/` sin escapar (`s/</style>/…`) dañó el HTML y David vio texto crudo. Para ediciones usar **Python** (`str.replace` con `assert old in s`) o la herramienta Edit, nunca `sed` con HTML o JS. Antes de cada push, revisar `head -1` = `<!DOCTYPE html>`.
- **Toast invisible que bloqueaba clics** en Windows: necesita `pointer-events:none` cuando está oculto (v55).
- **Reescribir `innerHTML` de elementos clicables cada segundo** hace que se pierdan los clics (barras de la 2ª actividad y del descanso). Usar esqueleto fijo y actualizar solo `textContent`.
- **`toast(msg, btn, fn)`:** `fn` es un **string** para `onclick` (p. ej. `'qbUndoDo()'`), no una función. Pasar una función no hace nada; así falló el deshacer de `qb`.
- **Clase `.wk` duplicada** (grid vs botón) → se renombró a `wkb`. Revisar que una clase nueva no exista ya en `css/app.css`.
- **Otra sesión de Claude metió `AUTO_EXTRA` (+10 min)** que inflaba los tiempos. David pidió quitarlo (v63). No agregar tiempo automático.
- **Fila del iPhone muy apretada:** con los tiempos + 🔒🚗📝 al lado del nombre, el nombre quedaba de una letra por renglón. En iPhone los botones van **debajo del nombre** (`.ncol`).
- **Minuto a minuto apilaba todo** desde "ahora" y se encimaba con los bloques fijos. Se cambió a llenar huecos (`fitAt`). Las actividades con hora que se empezaron antes se toman como adelantadas (lo pidió David).
- **No se puede verificar la página publicada desde el contenedor:** `curl` y WebFetch a github.io están bloqueados. Verificar con `git show origin/main:index.html` y pedirle a David que abra `?v=NNN`.
- **Pruebas viejas que fallan sin que sea un error:** `t86` depende de la hora y `t53` usaba `dpsub`, que ya no existe.

---

## 5) Próximos pasos

1. **Limpieza parte 2** (bloque de "Mejorar la app"): partir las ~20 líneas larguísimas (más de 400 caracteres) en funciones cortas, módulo por módulo, sin cambiar el funcionamiento. Ordenar `css/app.css` por secciones con mucho cuidado (el orden de las reglas importa). Opcional: guardar las pruebas en `tests/` del repo para no perderlas.
2. **Medir los objetivos.** Ya se propuso la medición del objetivo 1 (mediana de duración de bloque, interrupciones por actividad, % de actividades terminadas en un solo bloque). David **todavía no confirmó** para seguir con el 2. Retomar con él uno por uno antes de construir.
3. **Orden propuesto para construir** (falta su OK):
   - Objetivo 3: chips de causa en las notas (falta de material / miedo / parálisis / falta de preparación) y un reporte de patrones.
   - Objetivo 2: alarma si el descanso pasa de 20 min.
   - Objetivo 1: aviso a las 2 h de enfoque y reporte semanal de los objetivos.
   - Objetivo 5: seguir quitando lo que distrae; candidatos: 2 actividades a la vez, Panorámica. **Preguntarle antes de quitar.**
   - Objetivo 4 (hábitos): en stand by. Solo existe Ejercicio.
4. Gráfica de control (si regresa): David quiere límites **fijos**. Se propuso usar % o ln(real/plan).
5. Ideas que salieron y no se hicieron: que el candado mueva automáticamente la actividad que choca (hoy solo avisa); que la proyección rellene huecos con actividades más cortas de más abajo (hoy respeta el orden de la lista).
