import { MEALS } from '../../domain/constants.js';
import { copyEntries, yesterdayMeal } from '../../domain/meals.js';
import { adaptiveCard } from '../insights/cards.js';
import { dayNutrition, suggestTargets, waterOn } from '../../domain/nutrition.js';
import { DOW, addDays, fmtDay, lastDays, pk, todayKey } from '../../lib/dates.js';
import { $$ } from '../../lib/dom.js';
import { esc, num, r0, uid } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { barChart } from '../../ui/charts.js';
import { bar, ring } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- nutrition ---------- */
export function viewNutrition() {
  const k = U.nutDate, P = S.profile, n = dayNutrition(S, k), isToday = k === todayKey(), w = waterOn(S, k);
  const days = lastDays(7).map(d => ({ v: dayNutrition(S, d).kcal, l: DOW[pk(d).getDay()][0].toUpperCase(), hl: d === k }));
  const left = P.kcal - n.kcal;
  const meals = MEALS.map(([m, label]) => {
    const es = S.foods.filter(f => f.date === k && f.meal === m), kc = es.reduce((a, f) => a + f.kcal, 0), yest = yesterdayMeal(S, k, m);
    return `<div class="card"><div class="row between"><div><h3 class="h2 u-fs-17">${label}</h3><div class="tiny muted">${r0(kc)} kcal</div></div>
      <div class="row u-gap-6">${!es.length && yest.length ? `<button class="btn soft sm" data-act="repeat-meal" data-meal="${m}" aria-label="Repetir ${label} de ayer">${ic('repeat', 14)} Repetir ayer</button>` : ''}<button class="icon-btn tap" data-act="add-meal" data-meal="${m}" aria-label="Agregar a ${label}">${ic('plus')}</button></div></div>
      ${es.length ? `<div class="list u-mt-8">${es.map(f => `<div class="row" data-key="f-${f.id}"><div class="grow tap u-cur-pointer" data-act="edit-food" data-id="${f.id}"><div class="u-fw-450">${esc(f.name)}</div><div class="tiny muted">${f.qty ? esc(f.qty) + ' · ' : ''}P ${r0(f.p)} · C ${r0(f.c)} · G ${r0(f.f)}</div></div>
        <span class="num">${r0(f.kcal)}</span><button class="icon-btn tap u-w-30 u-h-30 u-bg-none" data-act="del-food" data-id="${f.id}" aria-label="Quitar">${ic('x')}</button></div>`).join('')}</div>` : ''}</div>`;
  }).join('');
  const macros = [['Proteína', n.p, P.protein], ['Carbohidratos', n.c, P.carbs], ['Grasa', n.f, P.fat]];
  return `${pageHead('Nutrición', '', `<div class="row"><button class="icon-btn tap" data-act="nut-day" data-d="-1">${ic('left')}</button><button class="icon-btn tap" data-act="nut-day" data-d="1" ${isToday ? 'disabled' : ''}>${ic('right')}</button></div>`)}
  <div class="muted small rise u-m-10-0-16">${isToday ? 'Hoy · ' : ''}${fmtDay(k)}</div>
  ${isToday ? adaptiveCard() : ''}
  <div class="card"><div class="row u-gap-20">${ring(P.kcal ? n.kcal / P.kcal : 0, 118, 10, `<div class="num u-fs-26">${r0(Math.abs(left))}</div><div class="tiny muted">${left >= 0 ? 'restantes' : 'de más'}</div>`)}
    <div class="grow col u-gap-12">${macros.map(([t, v, g]) => `<div><div class="row between small"><span>${t}</span><span class="muted">${r0(v)} / ${g} g</span></div>${bar(g ? v / g : 0)}</div>`).join('')}</div></div>
    <div class="hr"></div><div class="row between small"><span class="muted">${r0(n.kcal)} de ${P.kcal} kcal</span><span class="muted">Fibra ${r0(n.fi)} g</span></div></div>
  <div class="card"><div class="row between"><div class="row"><div class="badge">${ic('drop')}</div><div><b>Agua</b><div class="tiny muted"><span class="num">${w}</span> / ${P.water} ml</div></div></div>
    <div class="row u-gap-6">${[250, 500].map(m => `<button class="btn soft sm" data-act="water-add" data-ml="${m}">+${m}</button>`).join('')}<button class="icon-btn tap" data-act="water-undo" title="Deshacer">${ic('swap')}</button></div></div>
    <div class="u-mt-12">${bar(w / P.water)}</div></div>
  <div class="row between rise u-m-6-0-12"><h2 class="h2">Comidas</h2><div class="row u-gap-6"><button class="btn ghost sm" data-act="fav-meals">Favoritas</button><button class="btn ghost sm" data-act="custom-foods">Mis alimentos</button></div></div>
  ${meals}
  <div class="card"><div class="eyebrow">Calorías · últimos 7 días</div>${barChart(days, { max: Math.max(P.kcal * 1.2, ...days.map(d => d.v)), line: P.kcal })}</div>
  <div class="card row between"><div><b>Metas</b><div class="tiny muted">${P.kcal} kcal · P ${P.protein} · C ${P.carbs} · G ${P.fat} · ${P.water} ml</div></div><button class="btn ghost sm" data-act="edit-goals">Editar</button></div>`;
}

ACT['nut-day'] = el => { const d = addDays(U.nutDate, +el.dataset.d); if (d > todayKey()) return; U.nutDate = d; render(true); };

ACT['repeat-meal'] = el => {
  const src = yesterdayMeal(S, U.nutDate, el.dataset.meal); if (!src.length) return;
  S.foods.push(...copyEntries(src, U.nutDate, el.dataset.meal, uid)); save(); toast(`Repetí lo de ayer (${r0(src.reduce((a, f) => a + f.kcal, 0))} kcal)`); render(true);
};

ACT['water-add'] = el => { S.water.push({ id: uid(), date: U.nutDate, ml: +el.dataset.ml }); save(); render(true); };

ACT['water-undo'] = () => { const l = S.water.filter(w => w.date === U.nutDate); if (!l.length) return; S.water = S.water.filter(w => w.id !== l[l.length - 1].id); save(); render(true); };

ACT['del-food'] = el => { S.foods = S.foods.filter(f => f.id !== el.dataset.id); save(); render(true); };

ACT['edit-goals'] = () => { const P = S.profile; openSheet(`<h2 class="h2 u-mb-14">Metas nutricionales</h2><div class="grid2">
  ${[['kcal', 'Calorías', P.kcal], ['protein', 'Proteína (g)', P.protein], ['carbs', 'Carbohidratos (g)', P.carbs], ['fat', 'Grasa (g)', P.fat], ['water', 'Agua (ml)', P.water], ['sleepTarget', 'Sueño (h)', P.sleepTarget]].map(([k, l, v]) => `<div class="field"><label>${l}</label><input type="number" step="any" data-g="${k}" value="${v}"></div>`).join('')}</div>
  <div class="row"><button class="btn ghost grow" data-act="suggest-goals">Sugerir según mi peso</button><button class="btn grow" data-act="save-goals">Guardar</button></div>`); };

ACT['suggest-goals'] = () => {
  const w = [...S.weights].sort((a, b) => a.date.localeCompare(b.date)).pop(); if (!w) return toast('Registrá tu peso primero');
  const t = suggestTargets(S.profile.objective, w.kg, S.profile.height, S.profile.age, S.profile.trainingDays);
  const m = { kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat, water: t.water }; $$('[data-g]').forEach(i => { if (m[i.dataset.g] != null) i.value = m[i.dataset.g]; });
};

ACT['save-goals'] = () => { $$('[data-g]').forEach(i => { const v = num(i.value); if (v) S.profile[i.dataset.g] = v; }); save(); closeSheet(); render(true); };
