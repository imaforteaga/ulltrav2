import { LOGO } from '../../data/logo.js';
import { OBJ } from '../../domain/constants.js';
import { suggestTargets } from '../../domain/nutrition.js';
import { DEFAULT_HABITS } from '../../domain/score-engine.js';
import { todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { esc, num, uid } from '../../lib/utils.js';
import { storage } from '../../state/storage.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT, ON_INPUT } from '../../ui/actions.js';
import { ic } from '../../ui/icons.js';
import { render } from '../../ui/render.js';
import { toast } from '../../ui/toast.js';

/* ---------- onboarding ---------- */
export function viewOnboarding() {
  const o = U.ob, st = o.step;
  const dots = `<div class="row u-gap-6 u-jc-center u-mb-26">${[0, 1, 2].map(i => `<i class="dot ${i <= st ? 'on' : ''} ${i === st ? 'cur' : ''}"></i>`).join('')}</div>`;
  let body = '';
  if (st === 0) body = `<img src="${LOGO}" alt="" class="u-w-72 u-h-72 u-border-radius-18 u-d-block u-mb-18"><div class="eyebrow">Bienvenido</div><h1 class="title u-m-8-0-6">Ultra</h1>
    ${storage.ok ? '' : '<div class="card u-bc-danger u-p-12"><b class="small">Tu navegador no está guardando datos</b><div class="tiny muted">Puede ser el modo incógnito o un bloqueo de almacenamiento. Abrí Ultra en una ventana normal.</div></div>'}
    <p class="muted u-mb-26">Un sistema personal para entrenar, comer, dormir y crecer con constancia. Todo queda en este navegador, sin cuenta.</p>
    <div class="field"><label>¿Cómo te llamás?</label><input type="text" id="ob-name" value="${esc(o.name || '')}" placeholder="Tu nombre"></div>
    <div class="field"><label>Tu objetivo principal</label><div class="col u-gap-8">${Object.entries(OBJ).map(([k, v]) => `<button class="card tap row between ob-opt ${o.objective === k ? 'sel' : ''}" data-act="ob-obj" data-v="${k}"><span>${v}</span>${o.objective === k ? `<span class="accent">${ic('check', 18)}</span>` : ''}</button>`).join('')}</div></div>`;
  if (st === 1) body = `<h1 class="title u-mb-6">Tu punto de partida</h1><p class="muted u-mb-22">Sirve para estimar tus metas. Después podés editar todo.</p>
    <div class="grid2"><div class="field"><label>Edad</label><input type="number" id="ob-age" value="${o.age || ''}" placeholder="25"></div>
    <div class="field"><label>Altura (cm)</label><input type="number" id="ob-h" value="${o.height || ''}" placeholder="175"></div></div>
    <div class="field"><label>Peso actual (kg)</label><input type="number" step="0.1" id="ob-w" value="${o.weight || ''}" placeholder="75"></div>
    <div class="field"><label>Días de entrenamiento por semana: <b id="ob-dv">${o.days}</b></label><input type="range" min="1" max="7" value="${o.days}" id="ob-d" data-oninput="obDays"></div>`;
  if (st === 2) { const t = o.t; body = `<h1 class="title u-mb-6">Tus metas diarias</h1><p class="muted u-mb-22">Estimaciones de partida, no consejo médico. Ajustalas a tu criterio.</p>
    <div class="grid2"><div class="field"><label>Calorías</label><input type="number" id="t-kcal" value="${t.kcal}"></div><div class="field"><label>Proteína (g)</label><input type="number" id="t-p" value="${t.protein}"></div>
    <div class="field"><label>Carbohidratos (g)</label><input type="number" id="t-c" value="${t.carbs}"></div><div class="field"><label>Grasa (g)</label><input type="number" id="t-f" value="${t.fat}"></div>
    <div class="field"><label>Agua (ml)</label><input type="number" id="t-w" value="${t.water}"></div><div class="field"><label>Sueño (horas)</label><input type="number" step="0.5" id="t-s" value="8"></div></div>`; }
  return `<div class="wrap anim u-maxw-480 u-m-0-auto u-pt-5vh"><div class="rise">${dots}</div><div class="rise">${body}</div>
    <div class="rise row u-mt-18">${st > 0 ? `<button class="btn ghost" data-act="ob-back">Atrás</button>` : ''}<button class="btn grow" data-act="ob-next">${st === 2 ? 'Empezar' : 'Continuar'}</button></div>
    ${st === 0 ? `<div class="rise u-ta-center u-mt-16"><button class="btn ghost sm" data-act="import">Ya tengo una copia de seguridad</button></div>` : ''}</div>`;
}

ACT['ob-obj'] = el => { U.ob.name = $('#ob-name')?.value ?? U.ob.name; U.ob.objective = el.dataset.v; render(true); };
ON_INPUT.obDays = el => { $('#ob-dv').textContent = el.value; };

ACT['ob-back'] = () => { U.ob.step--; render(); };

ACT['ob-next'] = () => {
  const o = U.ob;
  if (o.step === 0) { o.name = $('#ob-name').value.trim(); o.step = 1; }
  else if (o.step === 1) {
    o.age = num($('#ob-age').value); o.height = num($('#ob-h').value); o.weight = num($('#ob-w').value); o.days = +$('#ob-d').value;
    if (!o.age || !o.height || !o.weight) return toast('Completá edad, altura y peso');
    o.t = suggestTargets(o.objective, o.weight, o.height, o.age, o.days); o.step = 2;
  } else {
    const g = id => num($(id).value);
    S.profile = { name: o.name, objective: o.objective, age: o.age, height: o.height, trainingDays: o.days, kcal: g('#t-kcal') || o.t.kcal, protein: g('#t-p') || o.t.protein,
      carbs: g('#t-c') || o.t.carbs, fat: g('#t-f') || o.t.fat, water: g('#t-w') || o.t.water, sleepTarget: g('#t-s') || 8, createdAt: todayKey(), disabledCats: [], mobilityTarget: 4 };
    S.weights.push({ id: uid(), date: todayKey(), kg: o.weight });
    S.habits = DEFAULT_HABITS.map(([name, key], i) => ({ id: uid(), name, key, active: true, counts: true, order: i }));
    save(); location.hash = '#/home'; toast('Todo listo'); return render();
  }
  render();
};
