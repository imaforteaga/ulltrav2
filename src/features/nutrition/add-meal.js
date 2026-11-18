import { DATA } from '../../data/content.js';
import { frequentFoods, quickEntry, recentFoods } from '../../domain/meals.js';
import { MEALS } from '../../domain/constants.js';
import { $, $$ } from '../../lib/dom.js';
import { esc, num, r0, uid } from '../../lib/utils.js';
import { todayKey } from '../../lib/dates.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT, ON_INPUT } from '../../ui/actions.js';
import { empty } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* add-meal sheet */
const foodPool = () => [...S.customFoods.map(f => ({ ...f, custom: true })), ...DATA.foods.map(f => ({ id: 'b-' + f[0], name: f[0], kcal: f[1], p: f[2], c: f[3], f: f[4], fi: f[5], serving: f[6], grams: f[7] }))];

ACT['add-meal'] = el => { U.foodMeal = el.dataset.meal || 'breakfast'; U.foodQ = ''; openSheet(`<div class="row between u-mb-12"><h2 class="h2">Agregar comida</h2><div class="seg u-w-auto">${MEALS.map(([m, l]) => `<button data-act="meal-pick" data-meal="${m}" class="${m === U.foodMeal ? 'on' : ''}">${({ breakfast: 'Des.', lunch: 'Alm.', dinner: 'Cena', snack: 'Snack' })[m]}</button>`).join('')}</div></div>
  ${freqRow()}
  <div class="quick row u-mb-12"><div class="grow"><input type="number" inputmode="numeric" id="qk-k" placeholder="kcal" aria-label="Calorías"></div><div class="grow"><input type="number" inputmode="numeric" id="qk-p" placeholder="proteína g" aria-label="Proteína"></div><button class="btn soft sm" data-act="quick-food">${ic('bolt', 14)} Carga rápida</button></div>
  <input type="text" id="food-q" placeholder="Buscar alimento…" autocomplete="off" class="u-mb-10"><div id="food-list"></div>
  <button class="btn ghost block u-mt-12" data-act="manual-food">Entrada manual</button>`, p => { fillFoods(); $('#food-q').oninput = e => { U.foodQ = e.target.value; fillFoods(); }; }); };

function freqRow() {
  const t = U.nutDate, f = frequentFoods(S, todayKey()).filter(x => x.count > 1), list = (f.length >= 3 ? f : recentFoods(S)).slice(0, 8);
  if (!list.length) return '';
  return `<div class="eyebrow u-mb-6">${f.length >= 3 ? 'Tus frecuentes' : 'Recientes'}</div><div class="chips u-mb-8">${list.map(x => `<button class="chip tap" data-act="repeat-food" data-id="${esc(x.id)}">${esc(x.name)} <span class="muted">${r0(x.kcal)}</span></button>`).join('')}</div>`;
}

ACT['repeat-food'] = el => { const f = S.foods.find(x => x.id === el.dataset.id); if (!f) return; S.foods.push({ ...f, id: uid(), date: U.nutDate, meal: U.foodMeal }); save(); closeSheet(); toast(`${f.name} agregado`); render(true); };

ACT['quick-food'] = () => { const k = num($('#qk-k').value) || 0, p = num($('#qk-p').value) || 0; if (!k && !p) return toast('Poné calorías o proteína'); S.foods.push(quickEntry({ kcal: k, p }, U.nutDate, U.foodMeal, uid())); save(); closeSheet(); toast('Carga rápida agregada (aproximada)'); render(true); };

ACT['meal-pick'] = el => { U.foodMeal = el.dataset.meal; $$('.seg button').forEach(b => b.classList.toggle('on', b === el)); };

function fillFoods() {
  const q = U.foodQ.trim().toLowerCase(); const list = foodPool().filter(f => !q || f.name.toLowerCase().includes(q)).slice(0, 40);
  $('#food-list').innerHTML = `<div class="list">${list.map(f => `<button class="row tap u-w-100pct u-ta-left" data-act="pick-food" data-id="${esc(f.id)}"><div class="grow"><div class="u-fw-450">${esc(f.name)}${f.custom ? ' <span class="pill">propio</span>' : ''}</div><div class="tiny muted">por 100 g · P ${f.p} · C ${f.c} · G ${f.f}</div></div><span class="num">${f.kcal}</span></button>`).join('') || '<div class="muted small">Sin resultados. Probá la entrada manual.</div>'}</div>`;
}

ACT['pick-food'] = el => {
  const f = foodPool().find(x => x.id === el.dataset.id); if (!f) return; U.pickFood = f;
  openSheet(`<h2 class="h2">${esc(f.name)}</h2><div class="muted small u-mb-14">${f.kcal} kcal por 100 g${f.serving ? ` · 1 porción = ${f.serving} (${f.grams} g)` : ''}</div>
  <div class="seg u-mb-12"><button class="on" data-act="qty-mode" data-m="g">Gramos</button><button data-act="qty-mode" data-m="s">Porciones</button></div>
  <div class="field"><label id="q-l">Cantidad (g)</label><input type="number" step="any" id="q-v" value="${f.grams || 100}" data-oninput="foodPreview"></div><div id="q-prev" class="card u-p-14"></div>
  <div class="row"><button class="btn ghost grow" data-act="fav-add">★ Favorita</button><button class="btn grow" data-act="save-food">Agregar</button></div>`, () => { U.qmode = 'g'; foodPreview(); });
};

ACT['qty-mode'] = el => { U.qmode = el.dataset.m; const f = U.pickFood; $$('.seg button').forEach(b => b.classList.toggle('on', b === el)); $('#q-l').textContent = U.qmode === 'g' ? 'Cantidad (g)' : 'Porciones'; $('#q-v').value = U.qmode === 'g' ? (f.grams || 100) : 1; foodPreview(); };

function foodCalc() {
  const f = U.pickFood, v = num($('#q-v').value) || 0, g = U.qmode === 'g' ? v : v * (f.grams || 100), k = g / 100;
  return { name: f.name, kcal: f.kcal * k, p: f.p * k, c: f.c * k, f: f.f * k, fi: (f.fi || 0) * k, g, per: { kcal: f.kcal, p: f.p, c: f.c, f: f.f, fi: f.fi || 0 }, qty: U.qmode === 'g' ? `${r0(v)} g` : `${v} × ${f.serving || 'porción'}` };
}

function foodPreview() { const x = foodCalc(); $('#q-prev').innerHTML = `<div class="row between"><b class="num u-fs-24">${r0(x.kcal)} kcal</b><span class="muted small">P ${r0(x.p)} · C ${r0(x.c)} · G ${r0(x.f)}</span></div>`; }
ON_INPUT.foodPreview = foodPreview;

ACT['save-food'] = () => { const x = foodCalc(); S.foods.push({ id: uid(), date: U.nutDate, meal: U.foodMeal, ...x }); save(); closeSheet(); toast('Comida agregada'); render(true); };

ACT['fav-add'] = () => { const x = foodCalc(); S.favMeals.push({ id: uid(), name: x.name, items: [x] }); save(); toast('Guardada en favoritas'); };

ACT['manual-food'] = () => openSheet(`<h2 class="h2 u-mb-14">Entrada manual</h2><div class="field"><label>Nombre</label><input type="text" id="m-n"></div>
  <div class="grid2">${[['kcal', 'Calorías'], ['p', 'Proteína (g)'], ['c', 'Carbohidratos (g)'], ['f', 'Grasa (g)']].map(([k, l]) => `<div class="field"><label>${l}</label><input type="number" step="any" id="m-${k}"></div>`).join('')}</div>
  <button class="btn block" data-act="save-manual">Agregar</button>`);

ACT['save-manual'] = () => { const n = $('#m-n').value.trim() || 'Comida'; const g = k => num($('#m-' + k).value) || 0; if (!g('kcal') && !g('p')) return toast('Ingresá calorías o proteína');
  S.foods.push({ id: uid(), date: U.nutDate, meal: U.foodMeal, name: n, kcal: g('kcal'), p: g('p'), c: g('c'), f: g('f'), fi: 0, qty: 'manual' }); save(); closeSheet(); render(true); };

ACT['fav-meals'] = () => openSheet(`<h2 class="h2 u-mb-10">Comidas favoritas</h2>${S.favMeals.length ? `<div class="list">${S.favMeals.map(m => { const kc = m.items.reduce((a, i) => a + i.kcal, 0); return `<div class="row"><div class="grow"><b>${esc(m.name)}</b><div class="tiny muted">${r0(kc)} kcal</div></div><button class="btn soft sm" data-act="use-fav" data-id="${m.id}">Agregar</button><button class="icon-btn tap u-bg-none" data-act="del-fav" data-id="${m.id}">${ic('trash')}</button></div>`; }).join('')}</div>` : empty('star', 'Sin favoritas', 'Al agregar un alimento tocá ★ Favorita.')}`);

ACT['use-fav'] = el => { const m = S.favMeals.find(x => x.id === el.dataset.id); m.items.forEach(i => S.foods.push({ ...i, id: uid(), date: U.nutDate, meal: U.foodMeal })); save(); closeSheet(); toast('Agregada'); render(true); };

ACT['del-fav'] = el => { S.favMeals = S.favMeals.filter(x => x.id !== el.dataset.id); save(); ACT['fav-meals'](); };

ACT['custom-foods'] = () => openSheet(`<div class="row between u-mb-10"><h2 class="h2">Mis alimentos</h2><button class="btn sm" data-act="new-custom">Nuevo</button></div>${S.customFoods.length ? `<div class="list">${S.customFoods.map(f => `<div class="row"><div class="grow"><b>${esc(f.name)}</b><div class="tiny muted">${f.kcal} kcal / 100 g · P ${f.p} C ${f.c} G ${f.f}</div></div><button class="icon-btn tap u-bg-none" data-act="del-custom" data-id="${f.id}">${ic('trash')}</button></div>`).join('')}</div>` : empty('fork', 'Sin alimentos propios', 'Creá uno con los valores de la etiqueta (por 100 g).')}`);

ACT['new-custom'] = () => openSheet(`<h2 class="h2 u-mb-6">Nuevo alimento</h2><p class="muted small u-mb-14">Valores por 100 g.</p><div class="field"><label>Nombre</label><input type="text" id="c-n"></div>
  <div class="grid2">${[['kcal', 'Calorías'], ['p', 'Proteína'], ['c', 'Carbohidratos'], ['f', 'Grasa'], ['fi', 'Fibra'], ['grams', 'Porción (g)']].map(([k, l]) => `<div class="field"><label>${l}</label><input type="number" step="any" id="c-${k}"></div>`).join('')}</div><button class="btn block" data-act="save-custom">Guardar</button>`);

ACT['save-custom'] = () => { const n = $('#c-n').value.trim(); if (!n) return toast('Poné un nombre'); const g = k => num($('#c-' + k).value) || 0;
  S.customFoods.push({ id: 'c-' + uid(), name: n, kcal: g('kcal'), p: g('p'), c: g('c'), f: g('f'), fi: g('fi'), grams: g('grams') || 100, serving: 'porción' }); save(); ACT['custom-foods'](); };

ACT['del-custom'] = el => { S.customFoods = S.customFoods.filter(f => f.id !== el.dataset.id); save(); ACT['custom-foods'](); };
