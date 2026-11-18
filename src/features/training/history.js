import { exerciseHistory } from '../../domain/training.js';
import { sessionRow } from './training.js';
import { fmtShort } from '../../lib/dates.js';
import { esc, r0 } from '../../lib/utils.js';
import { S } from '../../state/store.js';
import { ACT } from '../../ui/actions.js';
import { barChart, lineChart } from '../../ui/charts.js';
import { empty } from '../../ui/components.js';
import { pageHead } from '../../ui/page.js';
import { openSheet } from '../../ui/sheet.js';

/* history & exercises */
export function viewHistory() { const l = S.sessions.filter(s => s.finished).sort((a, b) => b.date.localeCompare(a.date));
  return `${pageHead('Historial', `${l.length} sesiones`, '', true)}<div class="card">${l.length ? `<div class="list">${l.map(sessionRow).join('')}</div>` : empty('dumbbell', 'Sin sesiones', 'Terminá una sesión para verla aquí.')}</div>`; }

export function viewExercises() {
  const names = [...new Set(S.sessions.filter(s => s.finished).flatMap(s => s.exercises.map(e => e.name)))].sort();
  return `${pageHead('Ejercicios', 'Tus récords y progreso', '', true)}<div class="card">${names.length ? `<div class="list">${names.map(n => { const h = exerciseHistory(S, n); return `<button class="row tap u-w-100pct u-ta-left" data-act="ex-detail" data-n="${esc(n)}"><div class="grow"><b>${esc(n)}</b><div class="tiny muted">${h.length} sesiones</div></div><div class="u-ta-right"><div class="num">${r0(Math.max(...h.map(x => x.best)))} kg</div><div class="tiny muted">1RM est.</div></div></button>`; }).join('')}</div>` : empty('chart', 'Sin datos', 'Completá series para ver tus récords.')}</div>`;
}

ACT['ex-detail'] = el => { const n = el.dataset.n, h = exerciseHistory(S, n); openSheet(`<h2 class="h2">${esc(n)}</h2><div class="grid3 u-m-12-0"><div><div class="num u-fs-24">${r0(Math.max(...h.map(x => x.best)))}</div><div class="tiny muted">mejor 1RM est.</div></div><div><div class="num u-fs-24">${Math.max(...h.map(x => x.top))}</div><div class="tiny muted">mayor peso (kg)</div></div><div><div class="num u-fs-24">${h.length}</div><div class="tiny muted">sesiones</div></div></div>
  <div class="eyebrow">1RM estimado (Epley)</div>${lineChart(h.map(x => ({ x: x.date, y: x.best })), { unit: ' kg', fmt: r0 })}<div class="eyebrow u-mt-12">Volumen por sesión</div>${barChart(h.slice(-10).map(x => ({ v: x.vol, l: fmtShort(x.date).split(' ')[0] })))}`); };
