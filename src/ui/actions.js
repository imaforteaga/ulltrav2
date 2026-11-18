// Event delegation. Feature modules register handlers by name:
//   ACT['add-water'] = (el, event) => { ... }        ← <button data-act="add-water">
//   ON_INPUT.foodPreview = (el, event) => { ... }    ← <input data-oninput="foodPreview">
import { closeSheet } from './sheet.js';
import { toast } from './toast.js';

export const ACT = {};
export const ON_INPUT = {};

ACT['toggle-on'] = el => el.classList.toggle('on');

export function installActions() {
  document.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return closeSheet();
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = ACT[el.dataset.act]; if (!fn) return;
    try { const r = fn(el, e); if (r && r.catch) r.catch(console.error); } catch (err) { console.error(err); toast('Ocurrió un error'); }
  });
  document.addEventListener('input', e => {
    const name = e.target?.dataset?.oninput; const fn = name && ON_INPUT[name];
    if (fn) fn(e.target, e);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
}
