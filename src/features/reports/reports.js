import { dayNutrition, waterOn } from '../../domain/nutrition.js';
import { makeEngine } from '../../domain/score-engine.js';
import { sessionVolume, sortedW } from '../../domain/training.js';
import { DOW, DOWL, lastDays, pk } from '../../lib/dates.js';
import { avg } from '../../lib/stats.js';
import { r0, r1 } from '../../lib/utils.js';
import { patternsBlock } from '../insights/cards.js';
import { S } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { barChart, lineChart } from '../../ui/charts.js';
import { empty } from '../../ui/components.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';

/* ---------- reports ---------- */
export function viewReports() {
  const E = makeEngine(S), per = U.repPer || 'week', n = per === 'month' ? 30 : 7, days = lastDays(n).filter(k => k >= E.startKey), P = S.profile;
  if (!days.length) return `${pageHead('Reportes', '', '', true)}<div class="card">${empty('chart', 'Todavía no hay datos', 'Usá la app unos días.')}</div>`;
  const N = days.map(k => ({ k, n: dayNutrition(S, k), w: waterOn(S, k), sl: S.sleep[k], tr: E.workoutsBy[k] || 0, mb: E.mobBy[k] || 0, ci: S.checkins[k] }));
  const logged = N.filter(d => d.n.n > 0), tr = N.reduce((a, d) => a + d.tr, 0), mb = N.reduce((a, d) => a + d.mb, 0);
  const vol = S.sessions.filter(s => s.finished && days.includes(s.date)).reduce((a, s) => a + sessionVolume(s), 0);
  const hs = E.habitsActive, hr = hs.length ? avg(days.map(k => hs.filter(h => E.isDone(h, k)).length / hs.length)) : null;
  const wts = sortedW(S).filter(w => w.date >= days[0]), dW = wts.length > 1 ? wts[wts.length - 1].kg - wts[0].kg : null;
  const cis = N.filter(d => d.ci), tile = (l, v, s = '') => `<div class="card u-m-0"><div class="eyebrow">${l}</div><div class="num u-fs-26 u-mt-2">${v}</div><div class="tiny muted">${s}</div></div>`;
  const lab = d => per === 'month' ? ((+d.k.slice(8)) % 5 === 0 ? d.k.slice(8) : '') : DOW[pk(d.k).getDay()][0].toUpperCase();
  return `${pageHead('Reportes', per === 'month' ? 'Últimos 30 días' : 'Últimos 7 días', '', true)}
  <div class="seg rise u-mb-16"><button class="${per === 'week' ? 'on' : ''}" data-rp="week">Semana</button><button class="${per === 'month' ? 'on' : ''}" data-rp="month">Mes</button></div>
  <div class="grid2 u-mb-14">${tile('Calorías (prom.)', logged.length ? r0(avg(logged.map(d => d.n.kcal))) : '–', `meta ${P.kcal} · ${logged.length} días con registro`)}${tile('Proteína (prom.)', logged.length ? r0(avg(logged.map(d => d.n.p))) + ' g' : '–', `meta ${P.protein} g`)}
  ${tile('Agua (prom.)', r1(avg(N.map(d => d.w)) / 1000) + ' l', `meta ${r1(P.water / 1000)} l`)}${tile('Sueño (prom.)', avg(N.filter(d => d.sl != null).map(d => d.sl)) != null ? r1(avg(N.filter(d => d.sl != null).map(d => d.sl))) + ' h' : '–', `meta ${P.sleepTarget} h`)}
  ${tile('Entrenos', tr, `volumen ${vol >= 1000 ? r1(vol / 1000) + ' t' : r0(vol) + ' kg'}`)}${tile('Movilidad', mb, 'sesiones')}${tile('Hábitos', hr != null ? r0(hr * 100) + ' %' : '–', 'cumplidos')}${tile('Peso', dW != null ? (dW > 0 ? '+' : '') + r1(dW) + ' kg' : '–', 'cambio en el período')}
  ${tile('Rendimiento', cis.length ? r1(avg(cis.map(d => d.ci.perf))) : '–', `${cis.length} cierres`)}${tile('Sentimiento', cis.length ? r1(avg(cis.map(d => d.ci.feel))) : '–', 'prom. sobre 10')}</div>
  <div class="card"><div class="eyebrow">Calorías por día</div>${barChart(N.map(d => ({ v: d.n.kcal, l: lab(d), hl: d.n.kcal > 0 })), { max: Math.max(P.kcal * 1.2, ...N.map(d => d.n.kcal)), line: P.kcal })}</div>
  <div class="card"><div class="eyebrow">Proteína por día (g)</div>${barChart(N.map(d => ({ v: d.n.p, l: lab(d), hl: d.n.p >= .9 * P.protein })), { max: Math.max(P.protein * 1.2, ...N.map(d => d.n.p)), line: P.protein })}</div>
  <div class="card"><div class="eyebrow">Agua por día (ml)</div>${barChart(N.map(d => ({ v: d.w, l: lab(d), hl: d.w >= .9 * P.water })), { max: Math.max(P.water * 1.2, ...N.map(d => d.w)), line: P.water })}</div>
  ${cis.length >= 2 ? `<div class="card"><div class="eyebrow">Rendimiento</div>${lineChart(cis.map(d => ({ x: d.k, y: d.ci.perf })), { min: 1, max: 10 })}<div class="eyebrow u-mt-12">Sentimiento</div>${lineChart(cis.map(d => ({ x: d.k, y: d.ci.feel })), { min: 1, max: 10 })}</div>` : ''}
  ${patternsBlock()}`;
}

document.addEventListener('click', e => { const c = e.target.closest('[data-rp]'); if (c) { U.repPer = c.dataset.rp; render(true); } });
