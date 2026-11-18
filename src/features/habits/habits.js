import { habitStat } from '../insights/cards.js';
import { HABIT_AUTO, makeEngine } from '../../domain/score-engine.js';
import { DOW, fmtShort, lastDays, pk, todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { esc, r0, uid } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { ACT } from '../../ui/actions.js';
import { empty, sectionTitle } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- habits & supplements ---------- */
export function viewHabits() {
  const E = makeEngine(S), k = todayKey(), hs = E.habitsActive, days = lastDays(7);
  return `${pageHead('Hábitos', 'Constancia diaria', `<button class="btn sm" data-act="edit-habit" data-id="">Nuevo</button>`, true)}
  ${hs.map(h => `<div class="card"><div class="row"><button class="check ${E.isDone(h, k) ? 'on' : ''}" data-act="toggle-habit" data-id="${h.id}" data-day="${k}">${ic('check')}</button>
    <div class="grow"><b>${esc(h.name)}</b><div class="tiny muted">${(s => `Racha ${s.streak}${s.forgiven.length ? ' (día de gracia)' : ''} · fuerza ${s.strength} % · 30 días ${r0(E.rate(h, 30) * 100)} %`)(habitStat(E, h, k))}${h.counts === false ? ' · no suma al score' : ''}</div></div>
    <button class="icon-btn tap" data-act="edit-habit" data-id="${h.id}" aria-label="Editar">${ic('pen')}</button></div>
    <div class="dayrow u-mt-12">${days.map(d => `<button class="check ${E.isDone(h, d) ? 'on' : ''} u-w-100pct u-h-26 u-border-radius-9" data-act="toggle-habit" data-id="${h.id}" data-day="${d}" title="${fmtShort(d)}"></button>`).join('')}</div>
    <div class="dayrow tiny muted u-mt-4 u-ta-center">${days.map(d => `<span>${DOW[pk(d).getDay()][0].toUpperCase()}</span>`).join('')}</div>
    ${HABIT_AUTO[h.key] ? `<div class="tiny muted u-mt-8">${HABIT_AUTO[h.key]}</div>` : ''}</div>`).join('')}
  ${sectionTitle('Suplementos', `<button class="btn ghost sm" data-act="edit-supp" data-id="">Nuevo</button>`)}
  <div class="card">${S.supplements.length ? `<div class="list">${S.supplements.map(s => { const on = (S.supLogs[k] || []).includes(s.id); return `<div class="row"><button class="check ${on ? 'on' : ''}" data-act="toggle-supp" data-id="${s.id}">${ic('check')}</button><div class="grow"><b>${esc(s.name)}</b><div class="tiny muted">${esc(s.dose || '')}</div></div><button class="icon-btn tap u-bg-none" data-act="edit-supp" data-id="${s.id}">${ic('pen')}</button></div>`; }).join('')}</div>` : empty('pill', 'Sin suplementos', 'Agregá creatina, vitaminas, etc.')}${S.supplements.some(s => /creatin/i.test(s.name)) ? '' : `<button class="btn soft block u-mt-10" data-act="edit-supp" data-id="" data-name="Creatina" data-dose="5 g">+ Agregar creatina con recordatorio</button>`}<button class="btn ghost block u-mt-8" data-act="go" data-v="#/profile/reminders">Configurar recordatorios</button></div>`;
}

ACT['edit-habit'] = el => { const h = S.habits.find(x => x.id === el.dataset.id) || { id: '', name: '', counts: true, active: true };
  openSheet(`<h2 class="h2 u-mb-14">${h.id ? 'Editar hábito' : 'Nuevo hábito'}</h2><div class="field"><label>Nombre</label><input type="text" id="h-n" value="${esc(h.name)}"></div>
  <div class="row between u-mb-10"><span>Suma al Transformation Score</span><button class="check ${h.counts !== false ? 'on' : ''}" id="h-c" data-act="toggle-on">${ic('check')}</button></div>
  <div class="row">${h.id ? `<button class="btn danger" data-act="del-habit" data-id="${h.id}">Archivar</button>` : ''}<button class="btn grow" data-act="save-habit" data-id="${h.id}">Guardar</button></div>`); };

ACT['save-habit'] = el => { const n = $('#h-n').value.trim(); if (!n) return toast('Poné un nombre'); const c = $('#h-c').classList.contains('on'), id = el.dataset.id;
  if (id) { const h = S.habits.find(x => x.id === id); h.name = n; h.counts = c; } else S.habits.push({ id: uid(), name: n, key: '', active: true, counts: c, order: S.habits.length }); save(); closeSheet(); render(true); };

ACT['del-habit'] = el => { S.habits.find(x => x.id === el.dataset.id).active = false; save(); closeSheet(); render(true); };

ACT['toggle-supp'] = el => { const k = todayKey(), l = S.supLogs[k] || (S.supLogs[k] = []), i = l.indexOf(el.dataset.id); if (i >= 0) l.splice(i, 1); else l.push(el.dataset.id); save(); render(true); };

ACT['edit-supp'] = el => { const s = S.supplements.find(x => x.id === el.dataset.id) || { id: '', name: el.dataset.name || '', dose: el.dataset.dose || '', time: '09:00', remind: true };
  openSheet(`<h2 class="h2 u-mb-14">${s.id ? 'Editar suplemento' : 'Nuevo suplemento'}</h2><div class="field"><label>Nombre</label><input type="text" id="s-n" value="${esc(s.name)}" placeholder="Creatina monohidrato"></div><div class="grid2"><div class="field"><label>Dosis</label><input type="text" id="s-d" value="${esc(s.dose || '')}" placeholder="5 g"></div><div class="field"><label>Recordar a las</label><input type="time" id="s-t" value="${s.time || '09:00'}"></div></div>
  <div class="row between u-mb-12"><span>Recordarme todos los días</span><button class="check ${s.remind !== false ? 'on' : ''}" id="s-r" data-act="toggle-on">${ic('check')}</button></div>
  <div class="row">${s.id ? `<button class="btn danger" data-act="del-supp" data-id="${s.id}">Borrar</button>` : ''}<button class="btn grow" data-act="save-supp" data-id="${s.id}">Guardar</button></div>`); };

ACT['save-supp'] = el => { const n = $('#s-n').value.trim(); if (!n) return toast('Poné un nombre'); const id = el.dataset.id;
  const extra = { time: $('#s-t').value || '09:00', remind: $('#s-r').classList.contains('on') };
  if (id) { const s = S.supplements.find(x => x.id === id); Object.assign(s, { name: n, dose: $('#s-d').value }, extra); } else S.supplements.push({ id: uid(), name: n, dose: $('#s-d').value, active: true, ...extra }); save(); closeSheet(); render(true); };

ACT['del-supp'] = el => { S.supplements = S.supplements.filter(x => x.id !== el.dataset.id); save(); closeSheet(); render(true); };
