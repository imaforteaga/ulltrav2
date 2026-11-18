import { fmtDay, todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { levelWord } from '../../lib/stats.js';
import { esc } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { ACT, ON_INPUT } from '../../ui/actions.js';
import { ic } from '../../ui/icons.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- day check-in ---------- */
export function checkinCard() {
  const k = todayKey(), c = S.checkins[k];
  if (!c) return `<button class="card tap tile" data-act="checkin"><div class="row between"><div><div class="eyebrow">Cierre del día</div><div class="h2 u-mt-4">¿Cómo fue tu día?</div><div class="small muted">Rendimiento, sentimiento y unas líneas</div></div><div class="badge">${ic('pen')}</div></div></button>`;
  return `<button class="card tap tile" data-act="checkin"><div class="row between"><div><div class="eyebrow">Tu día de hoy</div><div class="row u-gap-18 u-mt-6"><div><span class="num u-fs-30">${c.perf}</span><span class="muted small">/10 rendimiento</span></div><div><span class="num u-fs-30">${c.feel}</span><span class="muted small">/10 sentimiento</span></div></div>${c.text ? `<div class="small muted u-mt-6 u-d-webkit-box u-clamp-2 u-boxorient-vertical u-overflow-hidden">${esc(c.text)}</div>` : ''}</div>${ic('right', 16)}</div></button>`;
}

ACT.checkin = el => {
  const k = (el && el.dataset && el.dataset.day) || todayKey(), c = S.checkins[k] || { perf: 7, feel: 7, text: '' };
  const sl = (id, label, v) => `<div class="field"><div class="row between"><label>${label}</label><b><span class="num u-fs-22" id="${id}-v">${v}</span><span class="muted small"> / 10 · <span id="${id}-w">${levelWord(v)}</span></span></b></div><input type="range" min="1" max="10" value="${v}" id="${id}" data-oninput="ciMove" data-id="${id}"></div>`;
  openSheet(`<div class="eyebrow">${fmtDay(k)}</div><h2 class="h2 u-m-4-0-16">¿Cómo fue tu día?</h2>${sl('ci-p', 'Rendimiento (energía, foco, entrenamiento, trabajo)', c.perf)}${sl('ci-f', 'Sentimiento (ánimo, estado emocional)', c.feel)}
  <div class="field"><label>Contá tu día</label><textarea id="ci-t" maxlength="800" placeholder="Qué pasó, qué salió bien, qué te pesó…">${esc(c.text || '')}</textarea></div>
  <div class="row">${S.checkins[k] ? `<button class="btn danger" data-act="ci-del" data-day="${k}">Borrar</button>` : ''}<button class="btn grow" data-act="ci-save" data-day="${k}">Guardar</button></div>`);
};

function ciMove(id, v) { $('#' + id + '-v').textContent = v; $('#' + id + '-w').textContent = levelWord(+v); }
ON_INPUT.ciMove = el => ciMove(el.dataset.id, el.value);

ACT['ci-save'] = el => { const k = el.dataset.day || todayKey(); S.checkins[k] = { perf: +$('#ci-p').value, feel: +$('#ci-f').value, text: $('#ci-t').value.trim(), at: Date.now() }; save(); closeSheet(); toast('Día guardado'); render(true); };

ACT['ci-del'] = el => { delete S.checkins[el.dataset.day]; save(); closeSheet(); render(true); };
