# Handoff: estado del trabajo sobre Ultra (v2 → v2 + mejoras)

## Hecho (73 tests unitarios en verde, `npm test`)
Dominio puro + tests (`src/domain/`, `tests/unit/insights.test.js`, `tests/unit/habits-meals-finance.test.js`):
patterns, adaptive (+applyAdaptive/snooze), readiness (+bedtime), progression (+aches), streak (día de gracia + fuerza del hábito),
meals (frecuentes, recientes, repetir ayer, carga rápida), finance (recurrentes, meta de ahorro, resumen semanal), weekly (un solo ajuste),
csv, about (nuevas preguntas, sugerencias con `fix`, `applyFix`). Migración v1→v2 (`prefs`, `fin.recurring`, `fin.goal`) con test.
Recordatorios nuevos: `bible` y `weekly` (apagados por defecto).

Pantallas ya cableadas (SIN verificar en navegador):
- `features/insights/cards.js`: tarjetas Cómo estoy hoy, meta adaptativa, patrones, resumen semanal, racha/fuerza.
- Inicio, Entrenar, Nutrición (adaptativa + «Repetir ayer»), Reportes (patrones), Hábitos, Conocerme (sugerencias, patrones, exportar respuestas),
  Sesión (chip de peso sugerido, aviso de molestia, filtro "para casa"), add-meal (frecuentes + carga rápida), Finanzas (gastos fijos, meta, resumen),
  Perfil (CSV + opciones), `main.js` (genera recurrentes al abrir).
- Animaciones nuevas (CSS/JS, sin probar): transición direccional entre pantallas, indicador deslizante en la barra, conteo de números al entrar,
  pop/halo en checks y anillos al 100 %, filas que entran en cascada, press con resorte.

## Verificado (sesión de revisión)
Probado en Chromium 390×844, claro y oscuro, con 4 semanas de datos de prueba y sin errores de consola: Inicio, Nutrición (meta adaptativa, «Repetir ayer», carga rápida, frecuentes), Entrenar (Cómo estoy hoy, peso sugerido en la sesión), Finanzas (gasto fijo, meta), Conocerme (patrones), Reportes, Biblia. 73 unitarios en verde.
Tipografía: SF Pro (sistema en iPhone; Inter embebida donde no existe) + Newsreader (serif, embebida en `assets/fonts/`) para títulos, versículos y la marca.
Arreglado: coma/punto suelto en filas de comida sin cantidad, título de la hoja «Agregar comida» partido en dos líneas.
Aún sin correr: `npm run test:e2e` (hace falta `npm install` y Chromium).

## Pendiente
1. `npm install` (o symlink a playwright) y correr `npm run test:e2e`; arreglar lo que rompan los cambios (ojo: `.num` ahora cuenta desde 0 al navegar; `.anim .list > *`).
2. Revisar a mano en 390×844 (claro/oscuro) que `render(true)` no repita entradas y que el chip de sugerencia / carga rápida se vean bien.
3. Tests e2e nuevos: repetir ayer, carga rápida (≤2 toques), progresión, recurrentes, CSV.
4. Ítem 9: el filtro `timeCap`/`homeOnly` es básico; `homeFriendly` usa nombres en inglés de `content.js`.
5. Revisar que `weekly.js` ↔ `reminders.js` no generen import circular en el navegador.
6. `npm run build` al final (regenera sw.js; ya corrido una vez, repetirlo tras cualquier cambio).
7. Generar un HTML único para verlo en el chat (no se hizo).
