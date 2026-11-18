import { suggestNext, achesFor, acheNote } from '../../domain/progression.js';
import { answerOf, homeFriendly } from '../../domain/about.js';
import { f1 } from '../../lib/format.js';
import { allExerciseNames, e1rm, exerciseHistory, sessionVolume } from '../../domain/training.js';
import { syncMilestones } from '../milestones/milestones.js';
import { fmtDur, todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { esc, num, r0, uid } from '../../lib/utils.js';
import { beep } from '../../services/audio.js';
import { S, save } from '../../state/store.js';
import { ACT } from '../../ui/actions.js';
import { celebrate } from '../../ui/celebrate.js';
import { empty } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- workout session ---------- */
function newSession(name, type, exs) {
  S.active = { id: uid(), date: todayKey(), name, type, start: Date.now(), rest: null, exercises: exs.map(e => makeExercise(e)) };
  save(); location.hash = '#/training/session';
}

function makeExercise(e) {
  const prev = exerciseHistory(S, e.name).pop(); const n = Math.max(1, e.sets || 3);
  return { name: e.name, rest: e.rest ?? 90, timed: !!e.timed, note: '', target: e.reps ?? null, sets: Array.from({ length: n }, (_, i) => ({ kg: prev?.sets[i]?.kg ?? prev?.sets[prev.sets.length - 1]?.kg ?? '', reps: prev?.sets[i]?.reps ?? e.reps ?? '', done: false })) };
}

ACT['start-routine'] = el => { if (S.active && !confirm('Ya hay una sesión en curso. ¿Reemplazarla?')) return; const r = S.routines.find(x => x.id === el.dataset.id); newSession(r.name, r.type, r.exercises); };

ACT['start-free'] = () => { if (S.active) return (location.hash = '#/training/session'); newSession('Sesión libre', 'hypertrophy', []); };

export function viewSession() {
  const a = S.active; if (!a) return `${pageHead('Sesión', '', '', true)}<div class="card">${empty('dumbbell', 'No hay sesión en curso', '')}</div>`;
  const rest = a.rest && a.rest.end > Date.now() ? `<div class="rest"><div class="grow"><div class="tiny u-op-p7">Descanso</div><div class="num u-fs-28" id="rest-t">${fmtDur((a.rest.end - Date.now()) / 1000)}</div></div><button class="btn sm u-bg-bg u-c-text" data-act="rest-add">+15 s</button><button class="btn sm u-bg-transparent u-c-bg u-border-1-solid-rgba255-255-255-p3" data-act="rest-skip">Saltar</button></div>` : '';
  return `${pageHead(esc(a.name), `<span id="sess-t">${fmtDur((Date.now() - a.start) / 1000)}</span> transcurridos`, '', true)}${rest}
  ${a.exercises.map((e, i) => {
    const h = exerciseHistory(S, e.name), best = h.length ? Math.max(...h.map(x => x.best)) : 0;
    const sg = suggestNext(S, e.name, e), open = e.sets.some(s => !s.done), aches = acheNote(achesFor((answerOf(S, 'lesion') || {}).v, e.name));
    return `<div class="card" data-key="ex-${i}"><div class="row between"><div><b>${esc(e.name)}</b>${best ? `<div class="tiny muted">Mejor 1RM est. ${r0(best)} kg</div>` : ''}</div><button class="icon-btn tap" data-act="sess-del-ex" data-i="${i}">${ic('x')}</button></div>
      ${sg && open ? `<button class="chip soft tap u-mt-8" data-act="prog-use" data-i="${i}" data-kg="${sg.kg}">${ic('target', 14)} Sugerido hoy: ${f1(sg.kg)} kg${sg.dir === 'up' ? ' (+' + f1(sg.kg - sg.last.kg) + ')' : ''} · tocá para usarlo</button><div class="tiny muted u-mt-4">${esc(sg.text)}</div>` : ''}${aches ? `<div class="tiny muted u-mt-6">${ic('flag', 12)} ${esc(aches)}</div>` : ''}
      <div class="set tiny muted u-m-10-0-4"><span>#</span><span class="u-ta-center">${e.timed ? '—' : 'kg'}</span><span class="u-ta-center">${e.timed ? 'min' : 'reps'}</span><span></span></div>
      ${e.sets.map((s, j) => `<div class="set ${s.done ? 'done' : ''}"><span class="muted small">${j + 1}</span><input type="number" step="any" inputmode="decimal" data-s="${i},${j},kg" value="${esc(s.kg)}" ${e.timed ? 'disabled' : ''}><input type="number" step="any" inputmode="decimal" data-s="${i},${j},reps" value="${esc(s.reps)}">
        <button class="check ${s.done ? 'on' : ''}" data-act="set-done" data-i="${i}" data-j="${j}">${ic('check')}</button></div>`).join('')}
      <div class="row u-mt-6"><button class="btn ghost sm" data-act="set-add" data-i="${i}">+ Serie</button><button class="btn ghost sm" data-act="set-rm" data-i="${i}">− Serie</button></div></div>`;
  }).join('')}
  <button class="btn ghost block u-mb-12" data-act="sess-add-ex">+ Agregar ejercicio</button>
  <div class="row"><button class="btn danger" data-act="sess-cancel">Descartar</button><button class="btn grow" data-act="sess-finish">Terminar sesión</button></div>`;
}

document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.s && S.active) { const [i, j, f] = t.dataset.s.split(','); S.active.exercises[+i].sets[+j][f] = t.value; save(); } });

ACT['set-done'] = el => { const a = S.active, e = a.exercises[+el.dataset.i], s = e.sets[+el.dataset.j]; s.done = !s.done; if (s.done && e.rest > 0) a.rest = { end: Date.now() + e.rest * 1000 }; save(); render(true); };

ACT['prog-use'] = el => { const e = S.active.exercises[+el.dataset.i]; e.sets.forEach(s => { if (!s.done) s.kg = el.dataset.kg; }); save(); render(true); };

ACT['set-add'] = el => { const e = S.active.exercises[+el.dataset.i], l = e.sets[e.sets.length - 1]; e.sets.push({ kg: l?.kg ?? '', reps: l?.reps ?? '', done: false }); save(); render(true); };

ACT['set-rm'] = el => { const e = S.active.exercises[+el.dataset.i]; if (e.sets.length > 1) e.sets.pop(); save(); render(true); };

ACT['sess-del-ex'] = el => { S.active.exercises.splice(+el.dataset.i, 1); save(); render(true); };

ACT['rest-skip'] = () => { S.active.rest = null; save(); render(true); };

ACT['rest-add'] = () => { S.active.rest.end += 15000; save(); };

ACT['sess-add-ex'] = () => openSheet(`<h2 class="h2 u-mb-12">Agregar ejercicio</h2><input type="text" id="ae-q" placeholder="Buscar o escribir uno nuevo…" autocomplete="off"><div id="ae-l" class="u-mt-10"></div>`, () => {
  const draw = () => { const q = $('#ae-q').value.trim(), home = (S.prefs || {}).homeOnly, l = allExerciseNames(S).filter(n => n.toLowerCase().includes(q.toLowerCase())).sort((a, b) => home ? homeFriendly(b) - homeFriendly(a) : 0).slice(0, 30);
    $('#ae-l').innerHTML = `<div class="list">${q && !l.some(n => n.toLowerCase() === q.toLowerCase()) ? `<button class="row tap u-w-100pct u-ta-left" data-act="ae-pick" data-n="${esc(q)}"><b>+ Crear «${esc(q)}»</b></button>` : ''}${l.map(n => `<button class="row tap u-w-100pct u-ta-left" data-act="ae-pick" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>`; };
  $('#ae-q').oninput = draw; draw(); });

ACT['ae-pick'] = el => { S.active.exercises.push(makeExercise({ name: el.dataset.n, sets: 3, reps: 10, rest: 90 })); save(); closeSheet(); render(true); };

ACT['sess-cancel'] = () => { if (!confirm('¿Descartar esta sesión?')) return; S.active = null; save(); location.hash = '#/training'; };

ACT['sess-finish'] = () => {
  const a = S.active; const exs = a.exercises.map(e => ({ ...e, sets: e.sets.filter(s => s.done) })).filter(e => e.sets.length);
  if (!exs.length) return toast('Marcá al menos una serie como hecha');
  const prs = []; exs.forEach(e => { const h = exerciseHistory(S, e.name); const prev = h.length ? Math.max(...h.map(x => x.best)) : 0; const cur = Math.max(...e.sets.map(x => e1rm(num(x.kg) || 0, num(x.reps) || 0)));
    if (cur > prev && (prev > 0 || h.length === 0) && cur > 0 && h.length > 0) prs.push({ name: e.name, v: cur }); });
  const s = { id: a.id, date: a.date, name: a.name, type: a.type, exercises: exs, finished: true, durationSec: Math.round((Date.now() - a.start) / 1000) };
  S.sessions.push(s); S.active = null; save(); location.hash = '#/training'; syncMilestones();
  setTimeout(() => openSheet(`<div class="eyebrow">Sesión terminada</div><h2 class="h2 u-m-4-0-14">${esc(s.name)}</h2><div class="grid3"><div><div class="num u-fs-26">${fmtDur(s.durationSec)}</div><div class="tiny muted">Duración</div></div><div><div class="num u-fs-26">${r0(sessionVolume(s))}</div><div class="tiny muted">kg de volumen</div></div><div><div class="num u-fs-26">${exs.reduce((x, e) => x + e.sets.length, 0)}</div><div class="tiny muted">series</div></div></div>
    ${prs.length ? `<div class="hr"></div><div class="eyebrow u-mb-8">Récords nuevos</div>${prs.map(p => `<div class="row between"><span>${esc(p.name)}</span><b class="accent">${r0(p.v)} kg est.</b></div>`).join('')}` : ''}<button class="btn block u-mt-18" data-close>Listo</button>`), 60);
  if (prs.length) setTimeout(() => celebrate('Récord personal', prs.map(p => p.name).join(', ')), 350);
};

function tickTimers() {
  const a = S.active; if (!a) return; const st = $('#sess-t'); if (st) st.textContent = fmtDur((Date.now() - a.start) / 1000);
  if (a.rest) { const left = (a.rest.end - Date.now()) / 1000, t = $('#rest-t'); if (left <= 0) { a.rest = null; save(); beep(); if (location.hash === '#/training/session') render(true); } else if (t) t.textContent = fmtDur(left); }
}

setInterval(tickTimers, 500);
