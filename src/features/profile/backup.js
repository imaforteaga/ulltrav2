import { fmtShort, pk, todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { blankState, migrate } from '../../state/schema.js';
import { DB, persistLocal } from '../../state/storage.js';
import { S, replaceState, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { render, route } from '../../ui/render.js';
import { applyTheme } from '../../ui/theme.js';
import { toast } from '../../ui/toast.js';

ACT.export = async () => {
  const photos = {}; for (const { key, val } of await DB.all('photos')) photos[key] = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(val); });
  const blob = new Blob([JSON.stringify({ app: 'forge-web', version: 1, exportedAt: new Date().toISOString(), state: S, photos })], { type: 'application/json' });
  S.lastExport = todayKey(); save();
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ultra-copia-${todayKey()}.json`; a.click(); toast('Copia exportada'); if (route() === 'profile' || route() === 'home') render(true);
};

ACT.import = () => $('#imp-f').click();

document.addEventListener('change', async e => {
  if (e.target.id !== 'imp-f') return; const f = e.target.files[0]; if (!f) return;
  try { const j = JSON.parse(await f.text()); if (j.app !== 'forge-web' || !j.state) throw 0; if (!confirm('Esto reemplaza los datos actuales. ¿Continuar?')) return;
    await DB.clear(); for (const [id, d] of Object.entries(j.photos || {})) await DB.put('photos', id, await (await fetch(d)).blob()); replaceState(migrate(j.state)); await DB.put('kv', 'state', S); persistLocal(); applyTheme(); toast('Copia restaurada'); location.hash = '#/home'; render(); }
  catch (err) { toast('Ese archivo no es una copia válida de Ultra'); }
});

ACT.wipe = async () => { if (!confirm('Se borrarán TODOS tus datos y fotos de este navegador. ¿Seguro?')) return; if (!confirm('Última confirmación: no se puede deshacer.')) return; await DB.clear(); replaceState(blankState()); applyTheme(); U.ob = { step: 0, objective: 'recomposition', days: 3 }; location.hash = '#/home'; render(); };

export function backupCard() {
  if (!S.profile) return '';
  const age = S.lastExport ? (pk(todayKey()) - pk(S.lastExport)) / 864e5 : Infinity, hasData = S.foods.length + S.sessions.length + S.weights.length + S.photoMeta.length + Object.keys(S.checkins).length > 5;
  if (!hasData || age < 14) return '';
  return `<div class="card row between"><div><b>Hacé una copia de seguridad</b><div class="tiny muted">${S.lastExport ? 'Última: ' + fmtShort(S.lastExport) : 'Todavía no exportaste ninguna'}</div></div><button class="btn soft sm" data-act="export">Exportar</button></div>`;
}
