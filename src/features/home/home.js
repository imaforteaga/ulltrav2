import { aboutTile } from '../about/about.js';
import { dayNutrition, waterOn } from '../../domain/nutrition.js';
import { makeEngine } from '../../domain/score-engine.js';
import { motivation, verseOfDay } from '../../domain/verses.js';
import { checkinCard } from '../checkin/checkin.js';
import { adaptiveCard, habitStat, readinessCard, weeklyCard } from '../insights/cards.js';
import { backupCard } from '../profile/backup.js';
import { pendingCard } from '../reminders/reminders.js';
import { DOW, fmtDay, pk, todayKey } from '../../lib/dates.js';
import { esc, r0, r1 } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { ACT } from '../../ui/actions.js';
import { barChart, lineChart } from '../../ui/charts.js';
import { ring } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { toast } from '../../ui/toast.js';

const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : h < 22 ? 'Buenas noches' : 'Buenas noches'; };

/* ---------- home ---------- */
export function viewHome() {
  const E = makeEngine(S), k = todayKey(), P = S.profile, n = dayNutrition(S, k), w = waterOn(S, k), v = verseOfDay();
  const sc = E.today().total, wk = E.week();
  const wts = [...S.weights].sort((a, b) => a.date.localeCompare(b.date));
  const todays = S.routines.find(r => r.weekday === new Date().getDay());
  const quick = [['fork', 'Comida', 'add-meal'], ['scale', 'Peso', 'add-weight'], ['dumbbell', 'Entrenar', 'go', '#/training'], ['camera', 'Foto', 'go', '#/progress/photos'],
    ['drop', '+250 ml', 'add-water'], ['list', 'Hábitos', 'go', '#/home/habits'], ['moon', 'Sueño', 'add-sleep'], ['pen', 'Diario', 'go', '#/home/journal']];
  const ring3 = [['Calorías', n.kcal, P.kcal, r0(n.kcal), 'kcal'], ['Proteína', n.p, P.protein, r0(n.p) + 'g', `de ${P.protein} g`], ['Agua', w, P.water, (w / 1000).toFixed(1) + 'l', `de ${(P.water / 1000).toFixed(1)} l`]];
  const week = E.series(7).map(d => ({ v: d.total || 0, l: DOW[pk(d.day).getDay()][0].toUpperCase(), hl: d.day === k }));
  const habits = E.habitsActive;
  return `${pageHead(`${greeting()}${P.name ? ', ' + esc(P.name) : ''}`, fmtDay(k))}
  ${pendingCard()}${weeklyCard()}${readinessCard()}${adaptiveCard()}${backupCard()}
  <div class="card verse"><div class="eyebrow">Versículo del día · ${esc(v.theme)}</div>
    <p class="quote u-m-10-0-8">“${esc(v.text)}”</p><div class="row between"><b class="small accent">${esc(v.reference)}</b>
    <button class="icon-btn tap" data-act="go" data-v="#/home/bible" aria-label="Biblia">${ic('right')}</button></div>
    ${(S.prefs || {}).calm ? '' : `<div class="hr"></div><p class="muted small">${esc(motivation())}</p>`}</div>
  <div class="card"><div class="grid3">${ring3.map(([t, val, goal, mid, d]) => `<div class="col u-ai-center u-gap-8 u-ta-center">${ring(goal ? val / goal : 0, 92, 8, `<div class="num u-fs-20">${mid}</div>`)}<div><b class="small">${t}</b><div class="tiny muted">${d === 'kcal' ? `de ${P.kcal}` : d}</div></div></div>`).join('')}</div></div>
  <div class="grid4 rise u-mb-14">${quick.map(([i, t, a, v]) => `<button class="card tap col u-m-0 u-ai-center u-gap-8 u-p-14-6" data-act="${a}" ${v ? `data-v="${v}"` : ''}><div class="badge">${ic(i)}</div><span class="tiny">${t}</span></button>`).join('')}</div>
  <button class="card tap tile" data-act="go" data-v="#/home/score"><div class="row between"><div><div class="eyebrow">Transformation Score</div>
    <div class="row u-ai-baseline u-gap-8 u-mt-6"><span class="num u-fs-40">${sc == null ? '–' : r0(sc)}</span><span class="muted small">hoy · semana ${r0(wk.overall)}</span></div>
    <div class="small muted">${E.label(wk.overall)}</div></div>${ring(wk.overall / 100, 84, 8, `<span class="num u-fs-18">${r0(wk.overall)}</span>`)}</div></button>
  ${checkinCard()}
  <div class="grid2"><button class="card tap tile" data-act="go" data-v="#/home/reports"><div class="row"><div class="badge">${ic('chart')}</div><div><b>Reportes</b><div class="tiny muted">Semana y mes</div></div></div></button>
  ${aboutTile()}
  <button class="card tap tile" data-act="go" data-v="#/home/days"><div class="row"><div class="badge">${ic('pen')}</div><div><b>Mis días</b><div class="tiny muted">Rendimiento y ánimo</div></div></div></button></div>
  <div class="card"><div class="row between"><div><div class="eyebrow">Entrenamiento de hoy</div><div class="h2 u-mt-4">${todays ? esc(todays.name) : 'Sin rutina para hoy'}</div>
    <div class="muted small">${todays ? `${todays.exercises.length} ejercicios` : 'Elegí una rutina o empezá una sesión libre'}</div></div>
    <button class="btn sm" data-act="${todays ? 'start-routine' : 'go'}" data-id="${todays ? todays.id : ''}" data-v="#/training">${todays ? 'Empezar' : 'Entrenar'}</button></div></div>
  <div class="card"><div class="row between"><h2 class="h2">Hábitos de hoy</h2><span class="muted small">${habits.filter(h => E.isDone(h, k)).length}/${habits.length}</span></div>
    <div class="list u-mt-6">${habits.map(h => habitRow(E, h, k)).join('') || '<div class="muted small">Sin hábitos</div>'}</div></div>
  <div class="grid2"><div class="card"><div class="eyebrow">Peso</div><div class="row u-ai-baseline u-gap-6 u-m-4-0-6"><span class="num u-fs-30">${wts.length ? r1(wts[wts.length - 1].kg) : '–'}</span><span class="muted small">kg</span></div>
    ${lineChart(wts.map(x => ({ x: x.date, y: x.kg })), { h: 90 })}</div>
    <div class="card"><div class="eyebrow">Tu semana</div>${barChart(week, { h: 140, max: 100, line: 60 })}</div></div>`;
}

function habitRow(E, h, k) {
  const done = E.isDone(h, k), auto = E.isAuto(h, k), hs = habitStat(E, h, k), st = hs.streak;
  return `<div class="row" data-key="hb-${h.id}"><button class="check ${done ? 'on' : ''}" data-act="toggle-habit" data-id="${h.id}" data-day="${k}" aria-label="${esc(h.name)}">${ic('check')}</button>
    <div class="grow"><div class="u-fw-450">${esc(h.name)}</div><div class="tiny muted">${auto ? 'Automático · ' : ''}${st ? `racha de ${st} día${st > 1 ? 's' : ''}${hs.forgiven.length ? ' · con día de gracia' : ''} · fuerza ${hs.strength} %` : 'sin racha'}</div></div></div>`;
}

ACT['toggle-habit'] = el => {
  const k = el.dataset.day, id = el.dataset.id, h = S.habits.find(x => x.id === id), E = makeEngine(S);
  if (E.isAuto(h, k) && !(S.habitLogs[k] || []).includes(id)) return toast('Este hábito se completa solo con tus registros');
  const l = S.habitLogs[k] || (S.habitLogs[k] = []); const i = l.indexOf(id); if (i >= 0) l.splice(i, 1); else l.push(id);
  save(); render(true);
};
