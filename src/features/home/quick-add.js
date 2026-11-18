import { syncMilestones } from '../milestones/milestones.js';
import { todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { num, uid } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { ACT } from '../../ui/actions.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

ACT['add-water'] = () => { S.water.push({ id: uid(), date: todayKey(), ml: 250 }); save(); toast('+250 ml de agua'); render(true); };

/* quick sheets */
ACT['add-weight'] = () => openSheet(`<h2 class="h2 u-mb-14">Registrar peso</h2><div class="field"><label>Peso (kg)</label><input type="number" step="0.1" id="w-kg" autofocus></div>
  <div class="field"><label>Fecha</label><input type="date" id="w-d" value="${todayKey()}"></div><button class="btn block" data-act="save-weight">Guardar</button>`);

ACT['save-weight'] = () => {
  const kg = num($('#w-kg').value); if (!kg) return toast('Ingresá un peso');
  const d = $('#w-d').value || todayKey(); S.weights = S.weights.filter(x => x.date !== d); S.weights.push({ id: uid(), date: d, kg });
  save(); closeSheet(); toast('Peso guardado'); render(true); syncMilestones();
};

ACT['add-sleep'] = () => openSheet(`<h2 class="h2 u-mb-14">Sueño de anoche</h2><div class="field"><label>Horas dormidas</label><input type="number" step="0.25" id="sl-h" value="${S.sleep[todayKey()] ?? ''}"></div><button class="btn block" data-act="save-sleep">Guardar</button>`);

ACT['save-sleep'] = () => { const h = num($('#sl-h').value); if (h == null) return toast('Ingresá las horas'); S.sleep[todayKey()] = h; save(); closeSheet(); toast('Sueño guardado'); render(true); };
