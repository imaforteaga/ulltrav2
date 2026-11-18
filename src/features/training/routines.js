import { DATA } from '../../data/content.js';
import { TTYPE } from '../../domain/constants.js';
import { allExerciseNames } from '../../domain/training.js';
import { DOWL } from '../../lib/dates.js';
import { $, $$ } from '../../lib/dom.js';
import { esc, num, uid } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { ic } from '../../ui/icons.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* routines */
ACT.templates = () => openSheet(`<h2 class="h2 u-mb-12">Plantillas</h2><div class="list">${DATA.templates.map((t, i) => `<div class="row"><div class="grow"><b>${esc(t.name)}</b><div class="tiny muted">${TTYPE[t.type]} · ${t.exercises.map(e => e.name).slice(0, 3).join(', ')}…</div></div><button class="btn soft sm" data-act="use-template" data-i="${i}">Agregar</button></div>`).join('')}</div>`);

ACT['use-template'] = el => { const t = DATA.templates[+el.dataset.i]; S.routines.push({ id: uid(), name: t.name, type: t.type, weekday: null, exercises: t.exercises.map(e => ({ ...e })) }); save(); closeSheet(); toast('Rutina agregada'); render(true); };

ACT['edit-routine'] = el => {
  const r = S.routines.find(x => x.id === el.dataset.id) || { id: '', name: '', type: 'hypertrophy', weekday: null, exercises: [{ name: '', sets: 3, reps: 10, rest: 90, timed: false }] };
  U.edRoutine = JSON.parse(JSON.stringify(r)); drawRoutineEditor();
};

function drawRoutineEditor() {
  const r = U.edRoutine;
  openSheet(`<h2 class="h2 u-mb-14">${r.id ? 'Editar rutina' : 'Nueva rutina'}</h2>
  <div class="field"><label>Nombre</label><input type="text" id="r-n" value="${esc(r.name)}" placeholder="Push, Pierna…"></div>
  <div class="grid2"><div class="field"><label>Tipo</label><select id="r-t">${Object.entries(TTYPE).map(([k, v]) => `<option value="${k}" ${k === r.type ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
  <div class="field"><label>Día fijo</label><select id="r-d"><option value="">Ninguno</option>${DOWL.map((d, i) => `<option value="${i}" ${r.weekday === i ? 'selected' : ''}>${d}</option>`).join('')}</select></div></div>
  <div class="eyebrow u-mb-8">Ejercicios</div><datalist id="exl">${allExerciseNames(S).map(n => `<option value="${esc(n)}">`).join('')}</datalist>
  ${r.exercises.map((e, i) => `<div class="card u-p-12 u-mb-10"><div class="row"><input type="text" list="exl" data-ex="${i}" data-f="name" value="${esc(e.name)}" placeholder="Ejercicio"><button class="icon-btn tap" data-act="rt-del-ex" data-i="${i}">${ic('x')}</button></div>
    <div class="grid3 u-mt-8">${[['sets', 'Series'], ['reps', e.timed ? 'Minutos' : 'Reps'], ['rest', 'Descanso s']].map(([f, l]) => `<div class="field u-m-0"><label>${l}</label><input type="number" data-ex="${i}" data-f="${f}" value="${e[f]}"></div>`).join('')}</div></div>`).join('')}
  <button class="btn ghost block u-mb-14" data-act="rt-add-ex">+ Ejercicio</button>
  <div class="row">${r.id ? `<button class="btn danger" data-act="rt-delete">Borrar</button>` : ''}<button class="btn grow" data-act="rt-save">Guardar</button></div>`);
}

function readRoutineForm() { const r = U.edRoutine; r.name = $('#r-n').value; r.type = $('#r-t').value; const d = $('#r-d').value; r.weekday = d === '' ? null : +d;
  $$('[data-ex]').forEach(i => { const e = r.exercises[+i.dataset.ex]; e[i.dataset.f] = i.dataset.f === 'name' ? i.value : (num(i.value) ?? 0); }); }

ACT['rt-add-ex'] = () => { readRoutineForm(); U.edRoutine.exercises.push({ name: '', sets: 3, reps: 10, rest: 90, timed: false }); drawRoutineEditor(); };

ACT['rt-del-ex'] = el => { readRoutineForm(); U.edRoutine.exercises.splice(+el.dataset.i, 1); drawRoutineEditor(); };

ACT['rt-save'] = () => { readRoutineForm(); const r = U.edRoutine; r.exercises = r.exercises.filter(e => e.name.trim()); if (!r.name.trim()) return toast('Poné un nombre'); if (!r.exercises.length) return toast('Agregá al menos un ejercicio');
  if (r.id) S.routines = S.routines.map(x => x.id === r.id ? r : x); else { r.id = uid(); S.routines.push(r); } save(); closeSheet(); render(true); };

ACT['rt-delete'] = () => { S.routines = S.routines.filter(x => x.id !== U.edRoutine.id); save(); closeSheet(); render(true); };
