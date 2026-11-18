import { MOODS } from '../../domain/constants.js';
import { fmtDay, todayKey } from '../../lib/dates.js';
import { $, $$ } from '../../lib/dom.js';
import { esc, uid } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { empty } from '../../ui/components.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- journal ---------- */
export function viewJournal() {
  const q = U.jq.toLowerCase(), l = [...S.journal].sort((a, b) => b.date.localeCompare(a.date)).filter(j => !q || [j.text, j.wins, j.improve].join(' ').toLowerCase().includes(q) || fmtDay(j.date).includes(q));
  return `${pageHead('Diario', 'Un espacio para reflexionar', `<button class="btn sm" data-act="edit-journal" data-id="">Escribir</button>`, true)}
  <input type="text" id="j-q" placeholder="Buscar en el diario…" value="${esc(U.jq)}" class="u-mb-14">
  ${l.length ? l.map(j => `<div class="card tap u-cur-pointer" data-key="j-${j.id}" data-act="edit-journal" data-id="${j.id}"><div class="row between"><b>${fmtDay(j.date)}</b><span class="pill">${MOODS[(j.mood || 3) - 1]}</span></div>
    <p class="muted small u-mt-8 u-d-webkit-box u-clamp-3 u-boxorient-vertical u-overflow-hidden">${esc(j.text || j.wins || j.improve || '')}</p></div>`).join('') : `<div class="card">${empty('pen', 'Tu diario está vacío', 'Escribí cómo te fue hoy: logros, aprendizajes, gratitud.')}</div>`}`;
}

document.addEventListener('input', e => { if (e.target.id === 'j-q') { U.jq = e.target.value; const pos = e.target.selectionStart; render(true); const i = $('#j-q'); i.focus(); i.setSelectionRange(pos, pos); } });

ACT['edit-journal'] = el => { const j = S.journal.find(x => x.id === el.dataset.id) || { id: '', date: todayKey(), mood: 3, text: '', wins: '', improve: '' }; U.jm = j.mood;
  openSheet(`<h2 class="h2 u-mb-14">${j.id ? 'Entrada' : 'Nueva entrada'}</h2><div class="field"><label>Fecha</label><input type="date" id="j-d" value="${j.date}"></div>
  <div class="field"><label>¿Cómo te sentiste?</label><div class="chips" id="j-m">${MOODS.map((m, i) => `<button class="chip tap ${i + 1 === j.mood ? 'on' : ''}" data-jm="${i + 1}">${m}</button>`).join('')}</div></div>
  <div class="field"><label>Logros de hoy</label><textarea id="j-w" class="u-minh-70">${esc(j.wins || '')}</textarea></div><div class="field"><label>Qué mejorar</label><textarea id="j-i" class="u-minh-70">${esc(j.improve || '')}</textarea></div>
  <div class="field"><label>Reflexión</label><textarea id="j-t">${esc(j.text || '')}</textarea></div>
  <div class="row">${j.id ? `<button class="btn danger" data-act="del-journal" data-id="${j.id}">Borrar</button>` : ''}<button class="btn grow" data-act="save-journal" data-id="${j.id}">Guardar</button></div>`); };

document.addEventListener('click', e => { const c = e.target.closest('[data-jm]'); if (c) { U.jm = +c.dataset.jm; $$('#j-m .chip').forEach(b => b.classList.toggle('on', b === c)); } });

ACT['save-journal'] = el => { const o = { date: $('#j-d').value || todayKey(), mood: U.jm || 3, wins: $('#j-w').value.trim(), improve: $('#j-i').value.trim(), text: $('#j-t').value.trim() };
  if (!o.wins && !o.improve && !o.text) return toast('Escribí algo');
  if (el.dataset.id) Object.assign(S.journal.find(x => x.id === el.dataset.id), o); else S.journal.push({ id: uid(), ...o }); save(); closeSheet(); toast('Entrada guardada'); render(true); };

ACT['del-journal'] = el => { S.journal = S.journal.filter(x => x.id !== el.dataset.id); save(); closeSheet(); render(true); };
