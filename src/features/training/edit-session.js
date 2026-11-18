import { $$ } from '../../lib/dom.js';
import { esc } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { ACT } from '../../ui/actions.js';
import { ic } from '../../ui/icons.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- edit finished session ---------- */
ACT['session-edit'] = el => {
  const s = S.sessions.find(x => x.id === el.dataset.id);
  openSheet(`<h2 class="h2 u-mb-12">Editar · ${esc(s.name)}</h2>${s.exercises.map((e, i) => `<div class="u-mb-14"><b>${esc(e.name)}</b><div class="set tiny muted u-mt-6"><span>#</span><span class="u-ta-center">kg</span><span class="u-ta-center">reps</span><span></span></div>
    ${e.sets.map((x, j) => `<div class="set"><span class="muted small">${j + 1}</span><input type="number" step="any" data-se="${i},${j},kg" value="${esc(x.kg)}"><input type="number" step="any" data-se="${i},${j},reps" value="${esc(x.reps)}"><button class="icon-btn tap u-w-30 u-h-30 u-bg-none" data-act="se-del" data-i="${i}" data-j="${j}" data-id="${s.id}">${ic('x')}</button></div>`).join('')}</div>`).join('')}
  <button class="btn block" data-act="se-save" data-id="${s.id}">Guardar</button>`);
};

ACT['se-save'] = el => { const s = S.sessions.find(x => x.id === el.dataset.id); $$('[data-se]').forEach(i => { const [a, b, f] = i.dataset.se.split(','); s.exercises[+a].sets[+b][f] = i.value; }); save(); closeSheet(); toast('Sesión actualizada'); render(true); };

ACT['se-del'] = el => { const s = S.sessions.find(x => x.id === el.dataset.id); $$('[data-se]').forEach(i => { const [a, b, f] = i.dataset.se.split(','); s.exercises[+a].sets[+b][f] = i.value; });
  s.exercises[+el.dataset.i].sets.splice(+el.dataset.j, 1); s.exercises = s.exercises.filter(e => e.sets.length); save(); if (!s.exercises.length) { S.sessions = S.sessions.filter(x => x.id !== s.id); closeSheet(); render(true); } else ACT['session-edit']({ dataset: { id: s.id } }); };
