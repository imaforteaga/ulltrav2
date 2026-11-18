import { SITES } from '../../domain/constants.js';
import { fmtDay, todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { num, r1, uid } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { lineChart } from '../../ui/charts.js';
import { chips, empty } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

export function viewBody() {
  const site = U.site || 'waist', pts = S.measures.filter(m => m.site === site).sort((a, b) => a.date.localeCompare(b.date));
  return `${pageHead('Medidas', 'En centímetros', `<button class="btn sm" data-act="add-measure">+ Medida</button>`, true)}${chips(SITES, site, 'site')}
  <div class="card u-mt-8"><div class="eyebrow">${SITES.find(s => s[0] === site)[1]}</div>${lineChart(pts.map(m => ({ x: m.date, y: m.value })), { unit: ' cm' })}</div>
  <div class="card">${pts.length ? `<div class="list">${[...pts].reverse().map(m => `<div class="row between"><span>${fmtDay(m.date)}</span><span class="row"><b class="num">${r1(m.value)} cm</b><button class="icon-btn tap u-w-28 u-h-28 u-bg-none" data-act="del-measure" data-id="${m.id}">${ic('x')}</button></span></div>`).join('')}</div>` : empty('scale', 'Sin medidas', 'Registrá la primera para empezar.')}</div>`;
}

document.addEventListener('click', e => { const c = e.target.closest('[data-site]'); if (c) { U.site = c.dataset.site; render(true); } });

ACT['add-measure'] = () => openSheet(`<h2 class="h2 u-mb-14">Nueva medida</h2><div class="field"><label>Zona</label><select id="ms-s">${SITES.map(([k, l]) => `<option value="${k}" ${k === (U.site || 'waist') ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
  <div class="field"><label>Medida (cm)</label><input type="number" step="0.1" id="ms-v"></div><div class="field"><label>Fecha</label><input type="date" id="ms-d" value="${todayKey()}"></div><button class="btn block" data-act="save-measure">Guardar</button>`);

ACT['save-measure'] = () => { const v = num($('#ms-v').value); if (!v) return toast('Ingresá la medida'); S.measures.push({ id: uid(), site: $('#ms-s').value, value: v, date: $('#ms-d').value || todayKey() }); U.site = $('#ms-s').value; save(); closeSheet(); render(true); };

ACT['del-measure'] = el => { S.measures = S.measures.filter(x => x.id !== el.dataset.id); save(); render(true); };
