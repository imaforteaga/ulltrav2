import { TTYPE } from '../../domain/constants.js';
import { makeEngine } from '../../domain/score-engine.js';
import { doneSets, sessionVolume } from '../../domain/training.js';
import { viewMobility } from './mobility.js';
import { readinessCard } from '../insights/cards.js';
import { exerciseBudget } from '../../domain/about.js';
import { DOWL, addDays, fmtDay, fmtDur, fmtShort, lastDays, todayKey } from '../../lib/dates.js';
import { esc, num, r0, r1 } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { empty, sectionTitle } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';

/* ---------- training tab ---------- */
export function viewTraining() {
  const gym = U.trainTab === 'gym';
  return `${pageHead('Entrenar', '', '')}
  <div class="seg rise u-mb-18"><button class="${gym ? 'on' : ''}" data-act="train-tab" data-v="gym">Gimnasio</button><button class="${gym ? '' : 'on'}" data-act="train-tab" data-v="mob">Movilidad</button></div>
  ${gym ? viewGym() : viewMobility()}`;
}

ACT['train-tab'] = el => { U.trainTab = el.dataset.v; render(true); };

export function viewGym() {
  const E = makeEngine(S), wk = lastDays(7).reduce((a, k) => a + (E.workoutsBy[k] || 0), 0), vol = S.sessions.filter(s => s.finished && s.date >= addDays(todayKey(), -6)).reduce((a, s) => a + sessionVolume(s), 0);
  const active = S.active ? `<div class="card u-bc-accent"><div class="row between"><div><div class="eyebrow">Sesión en curso</div><b>${esc(S.active.name)}</b></div><button class="btn sm" data-act="go" data-v="#/training/session">Continuar</button></div></div>` : '';
  const last = S.sessions.filter(s => s.finished).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 3);
  return `${active}${readinessCard()}<div class="grid3 u-mb-14"><div class="card u-m-0"><div class="eyebrow">Semana</div><div class="num u-fs-26">${wk}<span class="muted small">/${S.profile.trainingDays}</span></div></div>
    <div class="card u-m-0"><div class="eyebrow">Volumen</div><div class="num u-fs-26">${vol >= 1000 ? r1(vol / 1000) + 't' : r0(vol)}</div></div>
    <div class="card u-m-0"><div class="eyebrow">Sesiones</div><div class="num u-fs-26">${S.sessions.filter(s => s.finished).length}</div></div></div>
  <div class="row u-mb-6"><button class="btn grow" data-act="start-free">Sesión libre</button><button class="btn soft grow" data-act="templates">Plantillas</button></div>
  ${sectionTitle('Mis rutinas', `<button class="btn ghost sm" data-act="edit-routine" data-id="">Nueva</button>`)}
  ${S.routines.length ? S.routines.map(r => `<div class="card"><div class="row between"><div class="grow"><b>${esc(r.name)}</b><div class="tiny muted">${TTYPE[r.type] || r.type} · ${r.exercises.length} ejercicios${r.weekday != null ? ' · ' + DOWL[r.weekday] : ''}</div>${S.prefs && S.prefs.timeCap && r.exercises.length > exerciseBudget(S.prefs.timeCap) + 1 ? `<div class="tiny muted">Tiene más ejercicios de los que entran en tus ${S.prefs.timeCap} min (unos ${exerciseBudget(S.prefs.timeCap)}).</div>` : ''}</div>
      <button class="icon-btn tap" data-act="edit-routine" data-id="${r.id}" aria-label="Editar">${ic('pen')}</button><button class="btn sm" data-act="start-routine" data-id="${r.id}">Empezar</button></div></div>`).join('') : `<div class="card">${empty('dumbbell', 'Sin rutinas todavía', 'Creá una o elegí una plantilla.')}</div>`}
  ${sectionTitle('Historial')}
  ${last.length ? `<div class="card"><div class="list">${last.map(s => sessionRow(s)).join('')}</div></div>` : ''}
  <div class="grid2"><button class="card tap tile" data-act="go" data-v="#/training/history"><b>Todo el historial</b><div class="tiny muted">Sesiones y detalle</div></button><button class="card tap tile" data-act="go" data-v="#/training/exercises"><b>Ejercicios y récords</b><div class="tiny muted">Progreso por ejercicio</div></button></div>`;
}

export const sessionRow = s => `<button class="row tap u-w-100pct u-ta-left" data-key="s-${s.id}" data-act="session-detail" data-id="${s.id}"><div class="grow"><b>${esc(s.name)}</b><div class="tiny muted">${fmtShort(s.date)} · ${fmtDur(s.durationSec || 0)} · ${r0(sessionVolume(s))} kg de volumen</div></div>${ic('right', 16)}</button>`;

ACT['session-detail'] = el => { const s = S.sessions.find(x => x.id === el.dataset.id); openSheet(`<div class="row between"><h2 class="h2">${esc(s.name)}</h2><div class="row u-gap-6"><button class="icon-btn tap" data-act="session-edit" data-id="${s.id}" aria-label="Editar">${ic('pen')}</button><button class="icon-btn tap" data-act="del-session" data-id="${s.id}">${ic('trash')}</button></div></div><div class="muted small u-m-4-0-14">${fmtDay(s.date)} · ${fmtDur(s.durationSec || 0)}</div>
  ${s.exercises.map(e => `<div class="u-mb-12"><b>${esc(e.name)}</b><div class="small muted">${doneSets(e).map(x => `${num(x.kg) ? x.kg + ' kg × ' : ''}${x.reps}`).join(' · ') || 'sin series'}</div></div>`).join('')}`); };

ACT['del-session'] = el => { S.sessions = S.sessions.filter(x => x.id !== el.dataset.id); save(); closeSheet(); render(true); };
