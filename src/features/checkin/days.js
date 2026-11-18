import { addDays, fmtDay, todayKey } from '../../lib/dates.js';
import { avg } from '../../lib/stats.js';
import { esc, r1 } from '../../lib/utils.js';
import { S } from '../../state/store.js';
import { lineChart } from '../../ui/charts.js';
import { empty } from '../../ui/components.js';
import { pageHead } from '../../ui/page.js';

export function viewDays() {
  const ks = Object.keys(S.checkins).sort(), recent = ks.slice(-60);
  const P = recent.map(k => ({ x: k, y: S.checkins[k].perf })), F = recent.map(k => ({ x: k, y: S.checkins[k].feel }));
  const a30 = ks.filter(k => k >= addDays(todayKey(), -29));
  return `${pageHead('Mis días', `${ks.length} cierres`, `<button class="btn sm" data-act="checkin">Hoy</button>`, true)}
  ${ks.length ? `<div class="grid2"><div class="card"><div class="eyebrow">Rendimiento · 30 d</div><div class="num u-fs-30">${r1(avg(a30.map(k => S.checkins[k].perf)) || 0)}</div></div><div class="card"><div class="eyebrow">Sentimiento · 30 d</div><div class="num u-fs-30">${r1(avg(a30.map(k => S.checkins[k].feel)) || 0)}</div></div></div>
  <div class="card"><div class="eyebrow">Rendimiento</div>${lineChart(P, { min: 1, max: 10, fmt: r1 })}</div><div class="card"><div class="eyebrow">Sentimiento</div>${lineChart(F, { min: 1, max: 10, fmt: r1 })}</div>
  <div class="card"><div class="list">${[...ks].reverse().map(k => { const c = S.checkins[k]; return `<button class="row tap u-w-100pct u-ta-left u-ai-flex-start" data-act="checkin" data-day="${k}"><div class="grow"><b>${fmtDay(k)}</b><div class="small muted u-mt-2">${c.text ? esc(c.text.slice(0, 120)) + (c.text.length > 120 ? '…' : '') : 'Sin texto'}</div></div><div class="u-ta-right"><div class="num">${c.perf} · ${c.feel}</div><div class="tiny muted">rend. · sent.</div></div></button>`; }).join('')}</div></div>`
    : `<div class="card">${empty('pen', 'Todavía no cerraste ningún día', 'Al final del día contá cómo fue: con el tiempo vas a ver patrones.')}<button class="btn block" data-act="checkin">Cerrar hoy</button></div>`}`;
}
