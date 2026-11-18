import { OBJ } from '../../domain/constants.js';
import { CATS, CAT_KEYS, makeEngine } from '../../domain/score-engine.js';
import { sortedW } from '../../domain/training.js';
import { fmtShort } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { esc, num, r1 } from '../../lib/utils.js';
import { storage } from '../../state/storage.js';
import { csvCard } from './csv.js';
import { S, save } from '../../state/store.js';
import { ACT } from '../../ui/actions.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { applyTheme } from '../../ui/theme.js';
import { toast } from '../../ui/toast.js';

/* ---------- profile ---------- */
export function viewProfile() {
  const P = S.profile, E = makeEngine(S), w = sortedW(S).pop();
  const row = (icn, t, sub, act, v) => `<button class="row tap u-w-100pct u-ta-left" data-act="${act}" ${v ? `data-v="${v}"` : ''}><div class="badge">${ic(icn)}</div><div class="grow"><div class="u-fw-450">${t}</div><div class="tiny muted">${sub}</div></div>${ic('right', 16)}</button>`;
  return `${pageHead('Perfil')}<div class="card row"><div class="badge u-w-60 u-h-60 u-bg-accent u-c-fff u-fs-24 u-fw-300">${esc((P.name || 'F')[0].toUpperCase())}</div><div class="grow"><div class="h2">${esc(P.name || 'Sin nombre')}</div><div class="small muted">${OBJ[P.objective]} · ${w ? r1(w.kg) + ' kg' : ''} · ${P.height} cm</div></div><button class="btn ghost sm" data-act="edit-profile">Editar</button></div>
  <div class="card"><div class="list">
    ${row('pen', 'Mis días', 'Rendimiento y sentimiento', 'go', '#/home/days')}${row('chart', 'Reportes', 'Semana y mes, con patrones', 'go', '#/home/reports')}${row('flame', 'Recordatorios', 'Creatina, suplementos, comidas', 'go', '#/profile/reminders')}${row('score', 'Transformation Score', 'Personalizá categorías y metas', 'go', '#/home/score')}${row('cal', 'Calendario', 'Mirá cualquier día', 'go', '#/home/calendar')}${row('flag', 'Hitos', `${S.milestones.filter(m => !m.completedAt).length} activos`, 'go', '#/home/milestones')}
    ${row('book', 'Biblia', 'Versículo del día y biblioteca', 'go', '#/home/bible')}${row('pen', 'Diario', `${S.journal.length} entradas`, 'go', '#/home/journal')}${row('list', 'Hábitos y suplementos', '', 'go', '#/home/habits')}</div></div>
  <div class="card"><div class="eyebrow u-mb-10">Apariencia</div><div class="seg">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([k, l]) => `<button class="${(S.theme || 'auto') === k ? 'on' : ''}" data-theme="${k}">${l}</button>`).join('')}</div></div>
  <div class="card"><div class="eyebrow u-mb-10">Ayudas</div>
    <div class="row between u-p-7-0"><span>Día de gracia por semana en las rachas</span><button class="check ${(S.prefs || {}).grace === false ? '' : 'on'}" data-act="pref-toggle" data-k="grace" data-off="1" aria-label="Día de gracia">${ic('check')}</button></div>
    <div class="row between u-p-7-0"><span>Mostrar «Cómo estoy hoy»</span><button class="check ${(S.prefs || {}).hideReadiness ? '' : 'on'}" data-act="pref-toggle" data-k="hideReadiness" aria-label="Cómo estoy hoy">${ic('check')}</button></div>
    <div class="row between u-p-7-0"><span>Tono calmado (sin frases de empuje)</span><button class="check ${(S.prefs || {}).calm ? 'on' : ''}" data-act="pref-toggle" data-k="calm" data-on="1" aria-label="Tono calmado">${ic('check')}</button></div></div>
  <div class="card"><div class="eyebrow u-mb-10">Score personalizado</div>${CAT_KEYS.map(c => `<div class="row between u-p-7-0"><span class="row u-gap-10"><span class="accent">${ic(CATS[c].i, 18)}</span>${CATS[c].t}</span><button class="check ${(P.disabledCats || []).includes(c) ? '' : 'on'}" data-act="toggle-cat" data-c="${c}">${ic('check')}</button></div>`).join('')}
    <div class="hr"></div><div class="grid2"><div class="field u-m-0"><label>Entrenos / semana</label><input type="number" min="1" max="7" data-pf="trainingDays" value="${P.trainingDays}"></div><div class="field u-m-0"><label>Movilidad / semana</label><input type="number" min="1" max="14" data-pf="mobilityTarget" value="${P.mobilityTarget || 4}"></div></div></div>
  ${csvCard()}
  <div class="card"><div class="eyebrow u-mb-6">Tus datos</div><p class="small muted u-mb-6">Todo se guarda automáticamente en este navegador y en este dispositivo. Si borrás los datos del sitio, se pierde: hacé copias de seguridad.</p>
    <p class="tiny u-mb-12 ${storage.ok ? 'accent' : 'is-danger'}">${storage.ok ? '✓ Guardado automático activo' : '⚠ Este navegador no está guardando datos'}${S.savedAt ? ' · último guardado ' + new Date(S.savedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}${S.lastExport ? ' · última copia: ' + fmtShort(S.lastExport) : ' · todavía sin copia exportada'}</p>
    <div class="row u-flex-wrap-wrap"><button class="btn soft grow" data-act="export">${ic('download', 16)} Exportar copia</button><button class="btn ghost grow" data-act="import">${ic('upload', 16)} Restaurar copia</button></div>
    <button class="btn danger block u-mt-10" data-act="wipe">Borrar todos los datos</button></div>
  <p class="tiny muted u-ta-center">Ultra · los valores nutricionales son aproximados y las metas no son consejo médico.</p>`;
}

document.addEventListener('click', e => { const c = e.target.closest('[data-theme]'); if (c) { S.theme = c.dataset.theme; applyTheme(); save(); render(true); } });

document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.pf) { const v = num(t.value); if (v) { S.profile[t.dataset.pf] = v; save(); toast('Guardado'); } } });

ACT['pref-toggle'] = el => { const p = S.prefs || (S.prefs = {}), k = el.dataset.k; if (k === 'grace') p.grace = p.grace === false; else if (k === 'hideReadiness') p.hideReadiness = !p.hideReadiness; else p[k] = !p[k]; save(); render(true); };

ACT['toggle-cat'] = el => { const P = S.profile, c = el.dataset.c, d = new Set(P.disabledCats || []); if (d.has(c)) d.delete(c); else { if (d.size >= CAT_KEYS.length - 1) return toast('Dejá al menos una categoría'); d.add(c); } P.disabledCats = [...d]; save(); render(true); };

ACT['edit-profile'] = () => { const P = S.profile, w = sortedW(S).pop(); openSheet(`<h2 class="h2 u-mb-14">Editar perfil</h2><div class="field"><label>Nombre</label><input type="text" id="p-n" value="${esc(P.name)}"></div>
  <div class="field"><label>Objetivo</label><select id="p-o">${Object.entries(OBJ).map(([k, v]) => `<option value="${k}" ${k === P.objective ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
  <div class="grid2"><div class="field"><label>Edad</label><input type="number" id="p-a" value="${P.age}"></div><div class="field"><label>Altura (cm)</label><input type="number" id="p-h" value="${P.height}"></div></div><button class="btn block" data-act="save-profile">Guardar</button>`); };

ACT['save-profile'] = () => { const P = S.profile; P.name = $('#p-n').value.trim(); P.objective = $('#p-o').value; P.age = num($('#p-a').value) || P.age; P.height = num($('#p-h').value) || P.height; save(); closeSheet(); render(true); };
