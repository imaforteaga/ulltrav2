# Ultra

App personal de entrenamiento, nutrición, hábitos, finanzas y cierre del día. PWA estática en español (Argentina): **todo vive en el dispositivo** (IndexedDB `forge-web` + localStorage `forge-state`), sin servidor, cuentas ni analítica. Funciona sin internet.

## Correr

```sh
npm run serve          # http://localhost:8080/ultra/
```
Sin build ni dependencias: son módulos ES nativos. El servidor imita GitHub Pages (sirve bajo `/ultra/`), así que cualquier ruta absoluta que se cuele falla acá igual que en producción.

## Probar

```sh
npm test               # unitarios (node:test, sin instalar nada): motor del score, nutrición, finanzas, recordatorios, migración
npm install && npx playwright install chromium
npm run test:e2e       # flujos y animaciones en un iPhone 390×844 y en escritorio
```
Los e2e cubren: onboarding, registrar comida, entreno completo, cierre del día, finanzas, persistencia al recargar, datos del formato anterior, backup/restauración, modo offline, y el comportamiento del movimiento (sin repetir entradas, anillos que transicionan, FLIP, arrastrar la hoja para cerrar, `prefers-reduced-motion`).

## Publicar en GitHub Pages (`/ultra/`)

1. Repo `ultra` en GitHub, subí el contenido de esta carpeta a `main`.
2. Settings → Pages → Source: **GitHub Actions**. El workflow `.github/workflows/pages.yml` corre los tests, regenera `sw.js` y publica.
3. Manual, sin Actions: `npm run build` (regenera `sw.js`) y publicá la raíz tal cual (`index.html`, `sw.js`, `manifest.webmanifest`, `icon-*.png`, `src/`, `styles/`, `assets/`).
4. En el iPhone: Safari → abrir la URL → Compartir → Agregar a pantalla de inicio.

**Importante:** si cambiás cualquier archivo de `src/`, `styles/` o `assets/`, corré `npm run build`. El service worker precachea la lista exacta de archivos y su nombre de caché es un hash; sin regenerarlo, el iPhone seguiría mostrando la versión vieja.

## Estructura

```
index.html  sw.js (generado)  manifest.webmanifest
src/
  main.js                 arranque
  app/routes.js           tabla ruta → pantalla (+ register.js: módulos que solo registran acciones)
  state/                  store (S, save, subscribe), schema (blankState + migrate), storage (IndexedDB/localStorage), ui-state
  domain/                 funciones PURAS y testeadas: score-engine, nutrition, training, finance, reminders, verses, constants
  features/<área>/        una pantalla o responsabilidad por archivo (home, nutrition, training, progress, habits, bible, journal,
                          milestones, score, calendar, profile, reminders, checkin, reports, finance, onboarding)
  ui/                     render (router + diff), morph (DOM diff), motion, sheet, toast, celebrate, components, charts, icons, actions
  lib/  services/  data/  utilidades, fotos/audio, contenido (versículos, alimentos)
styles/  tokens → base → components → motion → utilities   (cascade layers)
tests/   unit/ (node:test)   e2e/ (Playwright)
```

### Cómo funciona

- **Estado:** `S` es un único objeto vivo que nunca se reasigna (restaurar un backup intercambia su contenido con `replaceState`). `save()` programa la escritura (debounce 250 ms) y avisa a los suscriptores.
- **Vistas:** funciones que devuelven HTML. `render(true)` ya **no repinta**: `ui/morph.js` compara el HTML nuevo con el DOM vivo y toca solo lo que cambió. Los nodos que no cambian conservan foco, scroll y transiciones en curso.
- **Acciones:** delegación por `data-act` (`ACT['nombre'] = el => …`) y `data-oninput` (`ON_INPUT`). No quedan manejadores `onclick=` en línea ni globales en `window`.
- **Funciones puras:** `makeEngine(S, today)`, `dayNutrition(S, k)`, `pendingReminders(S, now)`, etc. reciben el estado y la fecha; no leen el reloj ni el DOM.

## Sistema de movimiento

Todo vive en `styles/tokens.css` (JS lo lee de ahí) y `styles/motion.css`.

| Token | Valor | Uso |
|---|---|---|
| `--dur-fast / base / slow` | 150 / 280 / 480 ms | presión, cambios de estado, entradas y hojas |
| `--dur-ring` | 900 ms | anillos y barras que alcanzan un valor nuevo |
| `--stagger` | 50 ms | retardo entre hermanos al entrar a una pantalla |
| `--ease-out` | `cubic-bezier(.22,.8,.24,1)` | curva por defecto |
| `--ease-spring` | `linear(…)` con ~6 % de rebote (fallback cubic-bezier) | pequeños "pops" (nav, dots) |
| `--ease-sheet` | `cubic-bezier(.2,.9,.3,1)` | hojas: asienta sin pasarse del borde |

**Regla:** las *entradas* se animan solo al **navegar** (`<main class="anim">` dura ~1,1 s y después se quita). Los *cambios de datos* se animan por **transición** sobre los elementos existentes: el anillo pasa de 40 % a 55 %, los números cuentan, las barras se deslizan, las filas con `data-key` se reordenan con FLIP y la fila borrada se desvanece. Navegar usa View Transitions (fade del área de contenido; la barra no se mueve) donde existen y cae al stagger CSS donde no. Solo `transform` y `opacity`, con tres excepciones deliberadas: el `stroke-dashoffset` de anillos/trazo de línea y el `clip-path` del comparador de fotos. `prefers-reduced-motion` apaga todo.

## Datos y migración

El modelo **no cambió** (`v: 1`): los datos guardados y los backups JSON anteriores cargan tal cual. `state/schema.js` → `migrate()` normaliza cualquier estado viejo/parcial (campos nuevos con su valor por defecto, contenedores del tipo correcto) y es idempotente; hay un registro `MIGRATIONS` listo para cuando el modelo cambie. Probado con un estado de la versión inicial (`tests/unit/schema.test.js`, `tests/e2e/flows.test.js`). Hay un test que fija la lista de claves del estado para que nadie las renombre sin querer.

## Qué cambió respecto de la versión anterior

- Un solo `index.html` con 1.300 líneas de script → ~65 módulos ES, sin globales.
- ~280 estilos en línea → clases (utilidades generadas + componentes) y variables CSS; modo claro/oscuro con los mismos colores.
- Re-render total → diff del DOM. Capturas de 9 pantallas, claro y oscuro, píxel a píxel contra la versión anterior: idénticas.
- Mejoras menores: los gráficos de línea ahora se ven con "reducir movimiento" (antes quedaban invisibles); restaurar un backup también actualiza la copia de localStorage; áreas de toque de 44 px.
