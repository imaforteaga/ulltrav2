import { CATS, makeEngine } from '../../domain/score-engine.js';
import { DOW, pk } from '../../lib/dates.js';
import { r0 } from '../../lib/utils.js';
import { S } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { barChart, lineChart } from '../../ui/charts.js';
import { ring } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';

/* ---------- score ---------- */
export function viewScore() {
  const E = makeEngine(S), per = U.scorePeriod, today = E.today(), P = per === 'month' ? E.month() : E.week();
  const overall = per === 'today' ? (today.total || 0) : P.overall, cats = per === 'today' ? today.values : P.cats;
  const rank = E.attention(per === 'today' ? { cats: today.values } : P).slice(0, 2).filter(x => x[1] < .85);
  const days = per === 'month' ? 30 : 14, evo = E.evolution(days), ser = E.series(per === 'month' ? 30 : 7);
  return `${pageHead('Transformation Score', 'Constancia, no perfección', '', true)}
  <div class="seg rise u-mb-16">${[['today', 'Hoy'], ['week', 'Semana'], ['month', 'Mes']].map(([k, l]) => `<button class="${k === per ? 'on' : ''}" data-sp="${k}">${l}</button>`).join('')}</div>
  <div class="card u-ta-center"><div class="u-d-grid u-place-items-center u-pt-6">${ring(overall / 100, 200, 16, `<div class="num u-fs-58 u-lh-1">${r0(overall)}</div><div class="tiny muted">de 100</div>`)}</div>
    <h2 class="h2 u-mt-14">${E.label(overall)}</h2><div class="small muted u-mt-4">${per === 'today' ? 'Hoy hasta ahora. Se actualiza a medida que registrás.' : `${P.consistent} de ${P.days} días fueron consistentes (score ≥ 60)`}</div></div>
  <div class="card"><h2 class="h2 u-mb-14">Por área</h2><div class="grid3 u-row-gap-18">${E.enabled.map(c => `<div class="col u-ai-center u-gap-8">${ring(cats[c] ?? 0, 70, 7, cats[c] != null ? `<span class="num u-fs-16">${r0(cats[c] * 100)}</span>` : '<span class="muted">–</span>')}<span class="tiny u-ta-center">${CATS[c].t}</span></div>`).join('')}</div></div>
  <div class="card"><h2 class="h2 u-mb-10">Necesita atención</h2>${rank.length ? rank.map(([c, v]) => `<div class="row u-mb-10"><div class="badge">${ic(CATS[c].i)}</div><div><b class="small">${CATS[c].t} · ${r0(v * 100)}</b><div class="tiny muted">${CATS[c].tip}</div></div></div>`).join('') : `<div class="small muted">Todo en marcha. Mantené el ritmo.</div>`}</div>
  <div class="card"><div class="eyebrow">Evolución · promedio móvil de 7 días</div>${lineChart(evo, { min: 0, max: 100, fmt: r0 })}</div>
  <div class="card"><div class="eyebrow">Puntaje diario</div>${barChart(ser.map(d => ({ v: d.total || 0, l: per === 'month' ? (+d.day.slice(8)) % 5 === 0 ? d.day.slice(8) : '' : DOW[pk(d.day).getDay()][0].toUpperCase(), hl: (d.total || 0) >= 60 })), { max: 100, line: 60 })}<div class="tiny muted">Línea punteada = 60, el umbral de «día consistente».</div></div>
  <div class="card"><h2 class="h2 u-mb-8">Cómo funciona</h2><p class="small muted">El score premia la constancia. El esfuerzo parcial suma parcialmente y llegar al 90 % de una meta cuenta como completo. Los scores semanales y mensuales combinan tu nivel promedio (70 %) con cuántos días fueron consistentes (30 %).</p>
    ${E.enabled.map(c => `<div class="row u-ai-flex-start u-gap-8 u-mt-8"><span class="accent u-w-18 u-flex-none">${ic(CATS[c].i, 16)}</span><span class="tiny muted">${CATS[c].ex}</span></div>`).join('')}
    <p class="tiny accent u-mt-12 u-fw-500">Es una medida personal de constancia. No es consejo médico ni mide tu salud o tu valor.</p></div>`;
}

document.addEventListener('click', e => { const c = e.target.closest('[data-sp]'); if (c) { U.scorePeriod = c.dataset.sp; render(true); } });
