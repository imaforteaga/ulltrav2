import { sortedW } from '../../domain/training.js';
import { fmtDay, todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { clamp, esc, num, r0, r1, uid } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { ACT } from '../../ui/actions.js';
import { celebrate } from '../../ui/celebrate.js';
import { lineChart } from '../../ui/charts.js';
import { bar, empty, sectionTitle } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- milestones ---------- */
const msProgress = m => { const d = m.target - m.start; return d === 0 ? 1 : clamp((m.current - m.start) / d); };

export function syncMilestones() {
  let changed = false;
  S.milestones.filter(m => !m.completedAt).forEach(m => {
    let v = null;
    if (m.source === 'weight') { const w = sortedW(S).pop(); v = w ? w.kg : null; }
    if (m.source === 'workouts') v = S.sessions.filter(s => s.finished && s.date.slice(0, 7) === todayKey().slice(0, 7)).length;
    if (v != null && v !== m.current) { m.current = v; (m.updates = m.updates || []).push({ date: todayKey(), value: v }); changed = true; }
    if (msProgress(m) >= 1 && !m.completedAt) { m.completedAt = todayKey(); changed = true; setTimeout(() => celebrate('Hito alcanzado', m.title), 500); }
  });
  if (changed) save();
}

export function viewMilestones() {
  const act = S.milestones.filter(m => !m.completedAt), done = S.milestones.filter(m => m.completedAt);
  const card = m => `<div class="card tap u-cur-pointer" data-act="ms-open" data-id="${m.id}"><div class="row between"><b>${esc(m.title)}</b><span class="num">${r0(msProgress(m) * 100)}%</span></div>
    <div class="tiny muted u-m-3-0-10">${r1(m.start)} → ${r1(m.target)} ${esc(m.unit || '')} · ahora ${r1(m.current)}</div>${bar(msProgress(m))}</div>`;
  return `${pageHead('Hitos', 'Metas medibles', `<button class="btn sm" data-act="ms-new">Nuevo</button>`, true)}
  ${act.length ? act.map(card).join('') : `<div class="card">${empty('flag', 'Sin hitos activos', 'Creá una meta: un peso objetivo, entrenos del mes, un récord…')}</div>`}
  ${done.length ? sectionTitle('Completados') + done.map(m => `<div class="card row between"><div><b>${esc(m.title)}</b><div class="tiny muted">${fmtDay(m.completedAt)}</div></div><div class="badge u-bg-accent u-c-fff">${ic('check')}</div></div>`).join('') : ''}`;
}

ACT['ms-new'] = () => { const w = sortedW(S).pop(); openSheet(`<h2 class="h2 u-mb-12">Nuevo hito</h2><div class="field"><label>Tipo</label><select id="ms-type"><option value="manual">Personalizado (lo actualizo yo)</option><option value="weight">Peso corporal (automático)</option><option value="workouts">Entrenos este mes (automático)</option></select></div>
  <div class="field"><label>Título</label><input type="text" id="ms-t" placeholder="Llegar a 80 kg"></div><div class="grid3"><div class="field"><label>Inicio</label><input type="number" step="any" id="ms-s" value="${w ? w.kg : 0}"></div><div class="field"><label>Meta</label><input type="number" step="any" id="ms-g"></div><div class="field"><label>Unidad</label><input type="text" id="ms-u" placeholder="kg"></div></div>
  <button class="btn block" data-act="ms-save">Crear</button>`); };

ACT['ms-save'] = () => { const t = $('#ms-t').value.trim(), s = num($('#ms-s').value), g = num($('#ms-g').value); if (!t || s == null || g == null) return toast('Completá título, inicio y meta'); const type = $('#ms-type').value;
  S.milestones.push({ id: uid(), title: t, unit: $('#ms-u').value.trim(), start: s, target: g, current: s, source: type, createdAt: todayKey(), completedAt: null, updates: [] }); syncMilestones(); save(); closeSheet(); render(true); };

ACT['ms-open'] = el => { const m = S.milestones.find(x => x.id === el.dataset.id); openSheet(`<div class="row between"><h2 class="h2">${esc(m.title)}</h2><button class="icon-btn tap" data-act="ms-del" data-id="${m.id}">${ic('trash')}</button></div>
  <div class="muted small u-m-4-0-12">${r1(m.start)} → ${r1(m.target)} ${esc(m.unit || '')}${m.source !== 'manual' ? ' · automático' : ''}</div>${bar(msProgress(m))}
  <div class="eyebrow u-mt-16">Evolución</div>${lineChart([{ x: m.createdAt, y: m.start }, ...(m.updates || []).map(u => ({ x: u.date, y: u.value }))].filter((p, i, a) => i === 0 || p.x >= a[0].x))}
  ${m.source === 'manual' && !m.completedAt ? `<div class="field u-mt-12"><label>Nuevo valor</label><input type="number" step="any" id="ms-nv" value="${m.current}"></div><button class="btn block" data-act="ms-update" data-id="${m.id}">Registrar avance</button>` : ''}`); };

ACT['ms-update'] = el => { const m = S.milestones.find(x => x.id === el.dataset.id), v = num($('#ms-nv').value); if (v == null) return; m.current = v; (m.updates = m.updates || []).push({ date: todayKey(), value: v }); syncMilestones(); save(); closeSheet(); render(true); };

ACT['ms-del'] = el => { S.milestones = S.milestones.filter(x => x.id !== el.dataset.id); save(); closeSheet(); render(true); };
