import { ANGLES } from '../../domain/constants.js';
import { MONTHS, fmtDay, fmtShort, todayKey } from '../../lib/dates.js';
import { $, $$ } from '../../lib/dom.js';
import { esc, uid } from '../../lib/utils.js';
import { photoURL, photoURLs, resizeImage } from '../../services/photos.js';
import { DB } from '../../state/storage.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT, ON_INPUT } from '../../ui/actions.js';
import { chips, empty } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- photos ---------- */
export function viewPhotos() {
  const f = U.angle || 'all', list = S.photoMeta.filter(p => f === 'all' || p.angle === f).sort((a, b) => b.date.localeCompare(a.date));
  const groups = {}; list.forEach(p => (groups[p.date.slice(0, 7)] = groups[p.date.slice(0, 7)] || []).push(p));
  return `${pageHead('Fotos', `${S.photoMeta.length} guardadas en este navegador`, `<div class="row u-gap-6"><button class="btn ghost sm" data-act="go" data-v="#/progress/compare">Comparar</button><button class="btn sm" data-act="add-photo">+ Foto</button></div>`, true)}
  ${chips([['all', 'Todas'], ...ANGLES], f, 'angle')}
  ${Object.keys(groups).length ? Object.entries(groups).map(([m, ps]) => `<div class="sec"><h2 class="h2 u-fs-17">${MONTHS[+m.slice(5) - 1]} ${m.slice(0, 4)}</h2></div><div class="photo-grid">${ps.map(p => `<div class="photo tap u-cur-pointer" data-photo="${p.id}" data-act="photo-open" data-id="${p.id}"><span>${ANGLES.find(a => a[0] === p.angle)?.[1] || ''} · ${fmtShort(p.date)}</span></div>`).join('')}</div>`).join('') : `<div class="card">${empty('camera', 'Sin fotos', 'Agregá tu primera foto de progreso. Se guardan solo en este navegador.')}</div>`}`;
}

document.addEventListener('click', e => { const c = e.target.closest('[data-angle]'); if (c) { U.angle = c.dataset.angle; render(true); } });

ACT['add-photo'] = () => openSheet(`<h2 class="h2 u-mb-14">Nueva foto</h2><div class="field"><label>Imagen(es)</label><input type="file" id="ph-f" accept="image/*" multiple></div><div id="cam-area" class="u-mb-14"><button class="btn ghost block" data-act="cam-open">${ic('camera', 16)} Usar la cámara</button></div>
  <div class="grid2"><div class="field"><label>Ángulo</label><select id="ph-a">${ANGLES.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div><div class="field"><label>Fecha</label><input type="date" id="ph-d" value="${todayKey()}"></div></div>
  <div class="field"><label>Nota</label><input type="text" id="ph-n" placeholder="Opcional"></div><button class="btn block" data-act="save-photo" id="ph-b">Guardar</button>`);

ACT['save-photo'] = async () => {
  const fs = [...($('#ph-f').files || [])]; if (!fs.length && !U.camBlob) return toast('Elegí una imagen o sacá una foto'); const b = $('#ph-b'); b.disabled = true; b.textContent = 'Guardando…';
  try { if (U.camBlob) fs.push(new File([U.camBlob], 'cam.jpg', { type: 'image/jpeg' })); U.camBlob = null; for (const f of fs) { const blob = await resizeImage(f), id = uid(); await DB.put('photos', id, blob); S.photoMeta.push({ id, date: $('#ph-d').value || todayKey(), angle: $('#ph-a').value, note: $('#ph-n').value.trim() }); } save(); closeSheet(); toast('Foto guardada'); render(true); }
  catch (e) { b.disabled = false; b.textContent = 'Guardar'; toast('No se pudo guardar la imagen'); }
};

ACT['photo-open'] = async el => { const p = S.photoMeta.find(x => x.id === el.dataset.id); const u = await photoURL(p.id);
  openSheet(`<img src="${u}" class="u-w-100pct u-border-radius-18 u-max-height-62vh u-object-fit-contain u-bg-alt"><div class="row between u-m-12-0"><div><b>${ANGLES.find(a => a[0] === p.angle)?.[1]}</b><div class="small muted">${fmtDay(p.date)}</div></div><div class="row u-gap-6"><a class="icon-btn" href="${u}" download="forge-${p.date}.jpg" aria-label="Descargar">${ic('download')}</a><button class="icon-btn tap" data-act="photo-del" data-id="${p.id}" aria-label="Borrar">${ic('trash')}</button></div></div>
  <div class="field"><label>Nota</label><input type="text" id="pn" value="${esc(p.note || '')}" data-act-change="photo-note" data-id="${p.id}"></div>`); };

document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.actChange === 'photo-note') { const p = S.photoMeta.find(x => x.id === t.dataset.id); p.note = t.value; save(); toast('Nota guardada'); } });

ACT['photo-del'] = async el => { if (!confirm('¿Borrar esta foto? No se puede deshacer.')) return; S.photoMeta = S.photoMeta.filter(x => x.id !== el.dataset.id); await DB.del('photos', el.dataset.id); delete photoURLs[el.dataset.id]; save(); closeSheet(); render(true); };

export function viewCompare() {
  const ps = [...S.photoMeta].sort((a, b) => a.date.localeCompare(b.date)); if (ps.length < 2) return `${pageHead('Comparar', '', '', true)}<div class="card">${empty('camera', 'Necesitás 2 fotos', 'Agregá al menos dos fotos para compararlas.')}</div>`;
  const A = U.cmp.a || ps[0].id, B = U.cmp.b || ps[ps.length - 1].id, opt = sel => ps.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${fmtShort(p.date)} · ${ANGLES.find(a => a[0] === p.angle)?.[1]}</option>`).join('');
  return `${pageHead('Antes y después', 'Deslizá para comparar', '', true)}<div class="grid2"><div class="field"><label>Antes</label><select id="cmp-a" data-cmp="a">${opt(A)}</select></div><div class="field"><label>Después</label><select id="cmp-b" data-cmp="b">${opt(B)}</select></div></div>
  <div class="compare rise" id="cmp"><div class="img" data-photo="${B}"></div><div class="img u-clip-path-inset0-50pct-0-0" id="cmp-top" data-photo="${A}"></div><div class="handle u-left-50pct" id="cmp-h"></div></div>
  <input type="range" min="0" max="100" value="50" id="cmp-r" class="u-mt-14" data-oninput="cmpMove">`;
}

function cmpMove(v) { $('#cmp-top').style.clipPath = `inset(0 ${100 - v}% 0 0)`; $('#cmp-h').style.left = v + '%'; }
ON_INPUT.cmpMove = el => cmpMove(el.value);

document.addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.cmp) { U.cmp[t.dataset.cmp] = t.value; render(true); } });

export async function hydratePhotos(root = document) {
  for (const el of $$('[data-photo]', root)) { const id = el.dataset.photo; if (photoURLs[id]) el.style.backgroundImage = `url(${photoURLs[id]})`; }   // cached: instant
  for (const el of $$('[data-photo]', root)) { if (el.style.backgroundImage) continue; const u = await photoURL(el.dataset.photo); if (u) el.style.backgroundImage = `url(${u})`; }
}
