import { MEALS } from '../../domain/constants.js';
import { $ } from '../../lib/dom.js';
import { esc, num, r0, r1 } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT, ON_INPUT } from '../../ui/actions.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- edit food ---------- */
ACT['edit-food'] = el => {
  const f = S.foods.find(x => x.id === el.dataset.id); if (!f) return; U.ef = f;
  const meal = `<div class="field"><label>Comida</label><select id="ef-m">${MEALS.map(([k, l]) => `<option value="${k}" ${k === f.meal ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
  openSheet(`<h2 class="h2 u-mb-4">${esc(f.name)}</h2><div class="muted small u-mb-14">${esc(f.qty || '')}</div>${meal}
  ${f.per ? `<div class="field"><label>Cantidad (g)</label><input type="number" step="any" id="ef-g" value="${r1(f.g)}" data-oninput="efPreview"></div><div id="ef-p" class="card u-p-14"></div>`
      : `<div class="grid2">${[['kcal', 'Calorías'], ['p', 'Proteína'], ['c', 'Carbohidratos'], ['f', 'Grasa']].map(([k, l]) => `<div class="field"><label>${l}</label><input type="number" step="any" id="ef-${k}" value="${r1(f[k])}"></div>`).join('')}</div>`}
  <div class="row"><button class="btn danger" data-act="del-food-sheet" data-id="${f.id}">Quitar</button><button class="btn grow" data-act="ef-save">Guardar</button></div>`, () => { if (f.per) efPreview(); });
};

function efCalc() { const f = U.ef, g = num($('#ef-g').value) || 0, k = g / 100; return { g, kcal: f.per.kcal * k, p: f.per.p * k, c: f.per.c * k, f: f.per.f * k, fi: (f.per.fi || 0) * k }; }

function efPreview() { const x = efCalc(); $('#ef-p').innerHTML = `<div class="row between"><b class="num u-fs-24">${r0(x.kcal)} kcal</b><span class="muted small">P ${r0(x.p)} · C ${r0(x.c)} · G ${r0(x.f)}</span></div>`; }
ON_INPUT.efPreview = efPreview;

ACT['ef-save'] = () => { const f = U.ef; f.meal = $('#ef-m').value;
  if (f.per) { const x = efCalc(); Object.assign(f, { g: x.g, kcal: x.kcal, p: x.p, c: x.c, f: x.f, fi: x.fi, qty: `${r0(x.g)} g` }); }
  else ['kcal', 'p', 'c', 'f'].forEach(k => f[k] = num($('#ef-' + k).value) || 0);
  save(); closeSheet(); toast('Actualizado'); render(true); };

ACT['del-food-sheet'] = el => { S.foods = S.foods.filter(f => f.id !== el.dataset.id); save(); closeSheet(); render(true); };
