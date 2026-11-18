import { sortedW } from '../../domain/training.js';
import { addDays, fmtDay, todayKey } from '../../lib/dates.js';
import { r1 } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { lineChart } from '../../ui/charts.js';
import { chips, empty, sectionTitle } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';

/* ---------- progress ---------- */
export function viewProgress() {
  const w = sortedW(S), range = U.wRange || 90, from = addDays(todayKey(), -range), pts = w.filter(x => range >= 9999 || x.date >= from).map(x => ({ x: x.date, y: x.kg }));
  const cur = w.length ? w[w.length - 1].kg : null, ch = w.length > 1 ? cur - w[0].kg : 0, mn = w.length ? Math.min(...w.map(x => x.kg)) : null;
  const photos = [...S.photoMeta].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  return `${pageHead('Progreso', 'Tu transformación, a tu ritmo')}
  <div class="card"><div class="row between"><div><div class="eyebrow">Peso</div><div class="row u-ai-baseline u-gap-6"><span class="num u-fs-38">${cur != null ? r1(cur) : '–'}</span><span class="muted">kg</span></div><div class="small muted">${w.length > 1 ? `${ch > 0 ? '+' : ''}${r1(ch)} kg desde el inicio · mínimo ${r1(mn)}` : 'Registrá más pesos para ver la tendencia'}</div></div><button class="btn soft sm" data-act="add-weight">+ Peso</button></div>
    <div class="u-m-10-0-4">${chips([[30, '30 d'], [90, '90 d'], [365, '1 año'], [9999, 'Todo']], range, 'wr')}</div>${lineChart(pts, { unit: ' kg' })}</div>
  <div class="grid2"><button class="card tap tile" data-act="go" data-v="#/progress/body"><div class="row"><div class="badge">${ic('scale')}</div><div><b>Medidas</b><div class="tiny muted">Cintura, pecho, brazo…</div></div></div></button>
  <button class="card tap tile" data-act="go" data-v="#/home/milestones"><div class="row"><div class="badge">${ic('flag')}</div><div><b>Hitos</b><div class="tiny muted">${S.milestones.filter(m => !m.completedAt).length} activos</div></div></div></button></div>
  ${sectionTitle('Fotos de progreso', `<div class="row u-gap-6"><button class="btn ghost sm" data-act="go" data-v="#/progress/photos">Ver todas</button><button class="btn sm" data-act="add-photo">+ Foto</button></div>`)}
  ${photos.length ? `<div class="photo-grid u-grid-template-columns-repeat4-1fr">${photos.map(p => `<div class="photo tap" data-photo="${p.id}" data-act="photo-open" data-id="${p.id}"></div>`).join('')}</div>` : `<div class="card">${empty('camera', 'Sin fotos todavía', 'Tus fotos se guardan solo en este navegador.')}</div>`}
  ${w.length ? `<div class="sec"><h2 class="h2">Registros de peso</h2></div><div class="card"><div class="list">${[...w].reverse().slice(0, 8).map(x => `<div class="row between"><span>${fmtDay(x.date)}</span><span class="row"><b class="num">${r1(x.kg)} kg</b><button class="icon-btn tap u-w-28 u-h-28 u-bg-none" data-act="del-weight" data-id="${x.id}">${ic('x')}</button></span></div>`).join('')}</div></div>` : ''}`;
}

document.addEventListener('click', e => { const c = e.target.closest('[data-wr]'); if (c) { U.wRange = +c.dataset.wr; render(true); } });

ACT['del-weight'] = el => { S.weights = S.weights.filter(x => x.id !== el.dataset.id); save(); render(true); };
