import { DATA } from '../../data/content.js';
import { dayOfYear, fmtDay, todayKey } from '../../lib/dates.js';
import { esc } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { chips, empty } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';

/* ---------- bible ---------- */
const verseObj = a => ({ reference: a[0], text: a[1], theme: a[2], reflection: a[3] });

function verseCard(v, big) {
  const fav = S.favVerses.includes(v.reference);
  return `<div class="card ${big ? 'verse' : ''}"><div class="row between"><span class="pill">${esc(v.theme)}</span><button class="icon-btn tap ${fav ? 'is-on' : ''}" data-act="fav-verse" data-ref="${esc(v.reference)}" aria-label="Favorito">${ic('star')}</button></div>
  <p class="quote u-m-12-0 ${big ? 'quote-lg' : ''}">“${esc(v.text)}”</p><b class="small accent">${esc(v.reference)} · KJV</b>
  <div class="hr"></div><p class="muted small">${esc(v.reflection)}</p></div>`;
}

export function viewBible() {
  const tab = U.bibleTab, v = verseObj(DATA.verses[(dayOfYear(todayKey()) + new Date().getFullYear()) % DATA.verses.length]);
  let body = '';
  if (tab === 'today') { const read = S.readVerses[todayKey()] === v.reference; body = `${verseCard(v, true)}<button class="btn ${read ? 'soft' : ''} block" data-act="mark-read" data-ref="${esc(v.reference)}">${read ? 'Leído hoy ✓' : 'Marcar como leído'}</button>`; }
  if (tab === 'library') { const th = U.bibleTheme, l = DATA.verses.map(verseObj).filter(x => th === 'all' || x.theme === th); body = `${chips([['all', 'Todos'], ...DATA.themes.map(t => [t, t])], th, 'bth')}<div class="u-mt-10">${l.map(x => verseCard(x)).join('')}</div>`; }
  if (tab === 'favs') { const l = DATA.verses.map(verseObj).filter(x => S.favVerses.includes(x.reference)); body = l.length ? l.map(x => verseCard(x)).join('') : `<div class="card">${empty('star', 'Sin favoritos', 'Tocá la estrella en cualquier versículo.')}</div>`; }
  if (tab === 'hist') { const ks = Object.keys(S.readVerses).sort().reverse(); body = `<div class="card">${ks.length ? `<div class="list">${ks.map(k => `<div class="row between"><span>${fmtDay(k)}</span><b class="accent">${esc(S.readVerses[k])}</b></div>`).join('')}</div>` : empty('book', 'Sin lecturas', 'Marcá el versículo del día como leído.')}</div>`; }
  return `${pageHead('Biblia', 'Versión King James (dominio público)', '', true)}<div class="seg rise u-mb-16">${[['today', 'Hoy'], ['library', 'Biblioteca'], ['favs', 'Favoritos'], ['hist', 'Historial']].map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-bt="${k}">${l}</button>`).join('')}</div>${body}
  <p class="tiny muted u-mt-6">Los versículos son texto real con su referencia. Las reflexiones son pensamientos originales breves y no son Escritura.</p>`;
}

document.addEventListener('click', e => { let c = e.target.closest('[data-bt]'); if (c) { U.bibleTab = c.dataset.bt; render(true); } c = e.target.closest('[data-bth]'); if (c) { U.bibleTheme = c.dataset.bth; render(true); } });

ACT['fav-verse'] = el => { const r = el.dataset.ref, i = S.favVerses.indexOf(r); if (i >= 0) S.favVerses.splice(i, 1); else S.favVerses.push(r); save(); render(true); };

ACT['mark-read'] = el => { const k = todayKey(); if (S.readVerses[k]) delete S.readVerses[k]; else { S.readVerses[k] = el.dataset.ref; const h = S.habits.find(x => x.key === 'bible'); if (h) { const l = S.habitLogs[k] || (S.habitLogs[k] = []); if (!l.includes(h.id)) l.push(h.id); } } save(); render(true); };
