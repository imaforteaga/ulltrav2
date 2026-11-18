import { CATS, QUESTIONS, answerOf, applyFix, insights, isDue, labelOf, nextQuestions, progress, question } from '../../domain/about.js';
import { answersCSV } from '../../domain/csv.js';
import { downloadText } from '../profile/csv.js';
import { patternsList } from '../insights/cards.js';
import { fmtDay, todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { esc } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { bar, sectionTitle } from '../../ui/components.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

const draftOf = q => (U.abDraft && U.abDraft.id === q.id) ? U.abDraft.vals : [].concat((answerOf(S, q.id) || {}).v ?? []);

/** The answer controls for one question; used in the page card and in the edit sheet. */
function answerUI(q, inSheet) {
  const cur = (answerOf(S, q.id) || {}).v, chip = (v, l, on, act) => `<button class="chip tap ${on ? 'on' : ''}" data-act="${act}" data-id="${q.id}" data-v="${esc(v)}">${esc(l)}</button>`;
  if (q.type === 'one') return `<div class="chips u-flex-wrap-wrap">${q.opts.map(([v, l]) => chip(v, l, String(cur) === v, 'ab-ans')).join('')}</div>`;
  if (q.type === 'scale') return `<div class="chips u-flex-wrap-wrap">${Array.from({ length: 10 }, (_, i) => chip(String(i + 1), String(i + 1), String(cur) === String(i + 1), 'ab-ans')).join('')}</div>`;
  if (q.type === 'multi') { const d = draftOf(q); return `<div class="chips u-flex-wrap-wrap">${q.opts.map(([v, l]) => chip(v, l, d.includes(v), 'ab-multi')).join('')}</div><button class="btn sm u-mt-14" data-act="ab-save" data-id="${q.id}" ${d.length ? '' : 'disabled'}>Guardar</button>`; }
  return `<textarea id="ab-t" placeholder="Escribí lo que quieras…">${esc(cur || '')}</textarea><button class="btn sm u-mt-14" data-act="ab-save" data-id="${q.id}">Guardar</button>`;
}

function commit(q, v) {
  S.about = S.about || {}; S.about[q.id] = { v, at: todayKey() }; U.abDraft = null; save();
  closeSheet(); toast('Gracias, lo tengo en cuenta'); render(true);
}

export function aboutTile() {
  const p = progress(S, todayKey()), q = nextQuestions(S, todayKey())[0];
  if (!q || p.answeredToday) return '';
  return `<button class="card tap tile" data-act="go" data-v="#/home/about"><div class="eyebrow">Conocerme · ${p.answered}/${p.total}</div><b class="u-d-block u-mt-8">${esc(q.q)}</b><div class="tiny muted u-mt-8">Respondé en 10 segundos →</div></button>`;
}

export function viewAbout() {
  const t = todayKey(), p = progress(S, t), q = nextQuestions(S, t)[0], ins = insights(S, t), pats = patternsList();
  return `${pageHead('Conocerme', 'Cuanto más sé de vos, mejor te ayudo', '', true)}
  <div class="card"><div class="row between"><b>Respondiste ${p.answered} de ${p.total}</b><span class="tiny muted">${p.due ? p.due + ' para revisar' : 'al día'}</span></div><div class="bar u-mt-12"><i data-w="${Math.round(p.answered / p.total * 100)}"></i></div></div>
  ${q ? `<div class="card" data-key="ab-now"><div class="eyebrow">${answerOf(S, q.id) ? 'Revisemos' : 'Pregunta para hoy'} · ${CATS[q.cat]}</div><h2 class="h2 u-m-8-0">${esc(q.q)}</h2><p class="tiny muted u-mb-14">${esc(q.why)}</p>${answerUI(q)}<button class="btn ghost sm u-mt-14" data-act="ab-skip" data-id="${q.id}">Más tarde</button></div>`
    : `<div class="card"><b>Por hoy no tengo más preguntas.</b><p class="small muted u-mt-8">Voy a volver a preguntarte algunas cada ${60} días para ver si algo cambió.</p></div>`}
  ${ins.length || pats.length ? sectionTitle('Lo que aprendí de vos') : ''}${pats.map(x => `<div class="card" data-key="pt-${x.id}"><b>Patrón</b><p class="small muted u-mt-8">${esc(x.text)}</p></div>`).join('')}${ins.length ? ins.map(i => `<div class="card" data-key="in-${i.id}"><b>${esc(i.title)}</b><p class="small muted u-mt-8">${esc(i.text)}</p>${i.fix ? `<button class="btn soft sm u-mt-12" data-act="ab-fix" data-id="${i.id}">${esc(i.fix.label)}</button>` : ''}</div>`).join('') : ''}
  ${sectionTitle('Tus respuestas', p.answered ? '<button class="btn ghost sm" data-act="ab-export">Exportar mis respuestas</button>' : '')}
  ${Object.entries(CATS).map(([c, name]) => { const qs = QUESTIONS.filter(x => x.cat === c && answerOf(S, x.id)); return qs.length ? `<div class="card"><div class="eyebrow u-mb-8">${name}</div><div class="list">${qs.map(x => { const a = answerOf(S, x.id); return `<button class="row between tap u-w-100pct u-ta-left" data-key="a-${x.id}" data-act="ab-edit" data-id="${x.id}"><div class="grow"><div class="small">${esc(x.q.replace(/ \(.*\)/, ''))}</div><b>${esc(labelOf(x, a.v))}</b></div>${isDue(S, x.id, t) ? '<span class="pill">Revisar</span>' : `<span class="tiny muted">${fmtDay(a.at).replace(/^\S+ /, '')}</span>`}</button>`; }).join('')}</div></div>` : ''; }).join('')}`;
}

ACT['ab-ans'] = el => commit(question(el.dataset.id), el.dataset.v);
ACT['ab-multi'] = el => {
  const q = question(el.dataset.id); let d = draftOf(q).slice(), v = el.dataset.v;
  if (d.includes(v)) d = d.filter(x => x !== v); else d = (v === 'ninguna' || v === 'libre') ? [v] : [...d.filter(x => x !== 'ninguna'), v];
  U.abDraft = { id: q.id, vals: d }; inSheetOrPage(q);
};
ACT['ab-save'] = el => { const q = question(el.dataset.id); if (q.type === 'text') { const v = $('#ab-t').value.trim(); if (!v) return toast('Escribí algo'); return commit(q, v); } commit(q, draftOf(q)); };
ACT['ab-skip'] = el => { S.about = S.about || {}; S.about[el.dataset.id] = { ...(S.about[el.dataset.id] || {}), skip: todayKey() }; save(); render(true); };
ACT['ab-edit'] = el => { const q = question(el.dataset.id); U.abDraft = null; openSheet(`<div class="eyebrow">${CATS[q.cat]}</div><h2 class="h2 u-m-8-0">${esc(q.q)}</h2><p class="tiny muted u-mb-14">${esc(q.why)}</p><div id="ab-sheet">${answerUI(q, true)}</div>`); };
ACT['ab-fix'] = el => { const i = insights(S, todayKey()).find(x => x.id === el.dataset.id); if (!i?.fix) return; applyFix(S, i.fix); save(); toast('Listo, aplicado'); render(true); };
ACT['ab-export'] = () => downloadText(`ultra-mis-respuestas-${todayKey()}.csv`, answersCSV(S, QUESTIONS));
function inSheetOrPage(q) { if ($('#ab-sheet')) $('#ab-sheet').innerHTML = answerUI(q, true); else render(true); }
