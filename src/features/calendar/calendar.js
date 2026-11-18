import { dayNutrition, waterOn } from '../../domain/nutrition.js';
import { makeEngine } from '../../domain/score-engine.js';
import { MONTHS, fmtDay, pad, todayKey } from '../../lib/dates.js';
import { esc, r0, r1 } from '../../lib/utils.js';
import { S } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';

/* ---------- calendar ---------- */
export function viewCalendar() {
  const E = makeEngine(S), [y, m] = U.calMonth.split('-').map(Number), first = new Date(y, m - 1, 1), lead = (first.getDay() + 6) % 7, n = new Date(y, m, 0).getDate(), t = todayKey();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: n }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`)];
  const sel = U.calSel, N = dayNutrition(S, sel), ds = E.daily(sel), tr = S.sessions.filter(s => s.finished && s.date === sel), mb = S.mobSessions.filter(s => s.date === sel), jr = S.journal.filter(j => j.date === sel), wt = S.weights.find(x => x.date === sel);
  return `${pageHead('Calendario', '', `<div class="row"><button class="icon-btn tap" data-act="cal-m" data-d="-1">${ic('left')}</button><button class="icon-btn tap" data-act="cal-m" data-d="1">${ic('right')}</button></div>`, true)}
  <div class="card"><div class="h2 u-ta-center u-mb-12 u-text-transform-capitalize">${MONTHS[m - 1]} ${y}</div><div class="cal">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<div class="w">${d}</div>`).join('')}
  ${cells.map(k => { if (!k) return '<div></div>'; const fut = k > t, sc = fut || k < E.startKey ? null : E.daily(k).total, a = sc == null ? 0 : .12 + .7 * (sc / 100);
    return `<button class="d ${k === t ? 'today' : ''} ${k === sel ? 'sel' : ''} ${sc != null && sc > 60 ? 'hi' : ''} ${fut ? 'fut' : ''}" style="--a:${sc == null ? 0 : r0(a * 100)}%" data-act="cal-sel" data-k="${k}">${+k.slice(8)}</button>`; }).join('')}</div></div>
  <div class="card"><div class="row between"><h2 class="h2">${fmtDay(sel)}</h2><span class="num u-fs-26">${ds.total != null ? r0(ds.total) : '–'}</span></div>
    <div class="list u-mt-8">
    <div class="row between"><span>Calorías</span><b>${r0(N.kcal)} / ${S.profile.kcal}</b></div><div class="row between"><span>Proteína</span><b>${r0(N.p)} g</b></div><div class="row between"><span>Agua</span><b>${waterOn(S, sel)} ml</b></div>
    <div class="row between"><span>Sueño</span><b>${S.sleep[sel] != null ? S.sleep[sel] + ' h' : '–'}</b></div><div class="row between"><span>Peso</span><b>${wt ? r1(wt.kg) + ' kg' : '–'}</b></div>
    <div class="row between"><span>Entrenos</span><b>${tr.length ? tr.map(s => esc(s.name)).join(', ') : '–'}</b></div><div class="row between"><span>Movilidad</span><b>${mb.length ? mb.map(s => esc(s.name)).join(', ') : '–'}</b></div>
    <div class="row between"><span>Hábitos</span><b>${E.habitsActive.filter(h => E.isDone(h, sel)).length}/${E.habitsActive.length}</b></div>${jr.length ? `<div class="row between"><span>Diario</span><b>${jr.length} entrada</b></div>` : ''}
    <div class="row between"><span>Rendimiento / sentimiento</span><b>${S.checkins[sel] ? S.checkins[sel].perf + ' / ' + S.checkins[sel].feel : '–'}</b></div></div>${S.checkins[sel]?.text ? `<p class="small muted u-mt-10">${esc(S.checkins[sel].text)}</p>` : ''}<button class="btn ghost sm u-mt-12" data-act="checkin" data-day="${sel}">${S.checkins[sel] ? 'Editar cierre del día' : 'Cerrar este día'}</button></div>`;
}

ACT['cal-sel'] = el => { U.calSel = el.dataset.k; render(true); };

ACT['cal-m'] = el => { const [y, m] = U.calMonth.split('-').map(Number), d = new Date(y, m - 1 + +el.dataset.d, 1); U.calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; render(true); };
