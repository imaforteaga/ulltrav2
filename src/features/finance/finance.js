import { applyRecurring, fin, goalProgress, monthName, shiftMonth, sumTx, weeklySpending } from '../../domain/finance.js';
import { MONTHS, fmtDay, todayKey } from '../../lib/dates.js';
import { $, $$ } from '../../lib/dom.js';
import { clamp, esc, num, r0, uid } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { empty, sectionTitle } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

const money = (n, sign = false) => { const f = fin(S), v = Math.round(Math.abs(n) * 100) / 100; return `${sign && n > 0 ? '+' : n < 0 ? '−' : ''}${f.cur}${v.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`; };

const monthKey = () => U.finMonth || (U.finMonth = todayKey().slice(0, 7));

const monthTx = m => fin(S).tx.filter(t => t.date.slice(0, 7) === m);

function groupedChart(rows, { h = 150 } = {}) {      // rows: [{l, a, b}]  a = ingresos, b = gastos
  const W = 600, pb = 20, max = Math.max(1, ...rows.flatMap(r => [r.a, r.b])), bw = W / rows.length, inner = h - pb - 8;
  return `<svg class="chart u-d-block" viewBox="0 0 ${W} ${h}" width="100%">${rows.map((r, i) => {
    const w = Math.min(bw * .3, 26), cx = i * bw + bw / 2, ha = inner * r.a / max, hb = inner * r.b / max;
    return `<rect x="${(cx - w - 2).toFixed(1)}" y="${(h - pb - ha).toFixed(1)}" width="${w.toFixed(1)}" height="${ha.toFixed(1)}" rx="5" fill="var(--accent)" style="--d:${i * 40}ms"/>
      <rect x="${(cx + 2).toFixed(1)}" y="${(h - pb - hb).toFixed(1)}" width="${w.toFixed(1)}" height="${hb.toFixed(1)}" rx="5" fill="var(--text2)" opacity=".7" style="--d:${i * 40 + 20}ms"/>
      <text x="${cx.toFixed(1)}" y="${h - 5}" font-size="11" fill="var(--text2)" text-anchor="middle">${esc(r.l)}</text>`;
  }).join('')}</svg>`;
}

export function viewFinance() {
  const f = fin(S), m = monthKey(), txs = monthTx(m), inc = sumTx(txs, 'in'), out = sumTx(txs, 'out'), bal = inc - out, isNow = m === todayKey().slice(0, 7);
  // gastos por categoría
  const byCat = {}; txs.filter(t => t.type === 'out').forEach(t => byCat[t.cat] = (byCat[t.cat] || 0) + t.amount);
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  // últimos 6 meses
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(m, i - 5)), rows = months.map(k => ({ l: MONTHS[+k.slice(5) - 1].slice(0, 3), a: sumTx(monthTx(k), 'in'), b: sumTx(monthTx(k), 'out') }));
  // insights
  const prev = sumTx(monthTx(shiftMonth(m, -1)), 'out'), dim = isNow ? new Date().getDate() : new Date(+m.slice(0, 4), +m.slice(5), 0).getDate(), ins = [];
  if (out > 0) ins.push(`Gastaste ${money(out / dim)} por día en promedio.`);
  if (cats.length) ins.push(`Tu mayor gasto: ${esc(cats[0][0])} (${r0(cats[0][1] / out * 100)} % del total).`);
  if (prev > 0 && out > 0) { const d = (out - prev) / prev * 100; ins.push(`${Math.abs(d) < 1 ? 'Igual que' : d > 0 ? `${r0(d)} % más que` : `${r0(-d)} % menos que`} el mes pasado (${money(prev)}).`); }
  if (inc > 0 && out > 0) ins.push(`Ahorraste el ${r0(Math.max(0, bal) / inc * 100)} % de lo que ganaste.`);
  const wk = weeklySpending(S, todayKey());
  // movimientos agrupados por día
  const days = {}; txs.forEach(t => (days[t.date] = days[t.date] || []).push(t));
  const dayKeys = Object.keys(days).sort().reverse();
  return `${pageHead('Finanzas', monthName(m), `<div class="row"><button class="icon-btn tap" data-act="fin-month" data-d="-1" aria-label="Mes anterior">${ic('left')}</button><button class="icon-btn tap" data-act="fin-month" data-d="1" aria-label="Mes siguiente" ${isNow ? 'disabled' : ''}>${ic('right')}</button></div>`)}
  <div class="card"><div class="eyebrow">Balance del mes</div><div class="num u-fs-42 u-m-4-0-12 ${bal < 0 ? 'is-danger' : ''}">${money(bal, true)}</div>
    <div class="grid2"><div><div class="tiny muted">Ingresos</div><div class="num accent u-fs-24">${money(inc)}</div></div><div><div class="tiny muted">Gastos</div><div class="num u-fs-24">${money(out)}</div></div></div></div>
  <div class="row rise u-mb-14"><button class="btn grow" data-act="fin-add" data-type="out">− Gasto</button><button class="btn soft grow" data-act="fin-add" data-type="in">+ Ingreso</button></div>
  <div class="card"><div class="row between u-mb-10"><h2 class="h2">Gastos por categoría</h2><button class="btn ghost sm" data-act="fin-cats">Categorías</button></div>
    ${cats.length ? `<div class="col u-gap-14">${cats.map(([c, v]) => { const b = f.budgets[c]; return `<div><div class="row between small"><span>${esc(c)}</span><span><b>${money(v)}</b> <span class="muted">· ${r0(v / out * 100)} %${b ? ` · tope ${money(b)}` : ''}</span></span></div>
      <div class="bar u-mt-6"><i data-w="${r0(clamp(b ? v / b : v / out) * 100)}" class="${b && v > b ? 'over' : ''}"></i></div></div>`; }).join('')}</div>` : empty('wallet', 'Sin gastos este mes', 'Tocá «− Gasto» para anotar el primero.')}</div>
  <div class="card"><div class="row between"><div class="eyebrow">Últimos 6 meses</div><div class="row tiny muted u-gap-10"><span><i class="u-d-inline-block u-w-8 u-h-8 u-border-radius-3 u-bg-accent"></i> ingresos</span><span><i class="u-d-inline-block u-w-8 u-h-8 u-border-radius-3 u-bg-text2"></i> gastos</span></div></div>${groupedChart(rows)}</div>
  ${isNow && wk ? `<div class="card sug" data-key="fin-week"><div class="eyebrow">Resumen de la semana</div><p class="u-mt-6">${esc(wk.text)}</p><div class="tiny muted u-mt-6">Total de los últimos 7 días: ${money(wk.total)}</div></div>` : ''}
  ${goalCard()}${recurringCard()}
  ${ins.length ? `<div class="card"><h2 class="h2 u-mb-8">Resumen</h2>${ins.map(t => `<p class="small u-mb-6">• ${t}</p>`).join('')}</div>` : ''}
  ${sectionTitle('Movimientos')}
  ${dayKeys.length ? dayKeys.map(k => `<div class="card"><div class="row between u-mb-6"><b class="small">${fmtDay(k)}</b><span class="tiny muted">${money(sumTx(days[k], 'in') - sumTx(days[k], 'out'), true)}</span></div><div class="list">
    ${days[k].map(t => `<button class="row tap u-w-100pct u-ta-left" data-key="t-${t.id}" data-act="fin-edit" data-id="${t.id}"><div class="grow"><div class="u-fw-450">${esc(t.cat)}</div>${t.note ? `<div class="tiny muted">${esc(t.note)}</div>` : ''}</div><b class="num ${t.type === 'in' ? 'accent' : ''}">${t.type === 'in' ? '+' : '−'}${money(t.amount)}</b></button>`).join('')}</div></div>`).join('')
    : `<div class="card">${empty('wallet', 'Sin movimientos', 'Anotá lo que ganás y lo que gastás.')}</div>`}`;
}

ACT['fin-month'] = el => { const n = shiftMonth(monthKey(), +el.dataset.d); if (n > todayKey().slice(0, 7)) return; U.finMonth = n; render(true); };

/* alta y edición de movimientos */
const finForm = (t) => {
  const f = fin(S), list = f.cats[t.type];
  return `<div class="seg u-mb-14"><button class="${t.type === 'out' ? 'on' : ''}" data-act="fin-type" data-type="out">Gasto</button><button class="${t.type === 'in' ? 'on' : ''}" data-act="fin-type" data-type="in">Ingreso</button></div>
  <div class="field"><label>Monto (${esc(f.cur)})</label><input type="number" inputmode="decimal" step="any" id="fx-a" class="fin-amt" placeholder="0" value="${t.amount || ''}"></div>
  <div class="field"><label>Categoría</label><div class="chips u-flex-wrap-wrap u-overflow-visible">${list.map(c => `<button class="chip tap ${c === t.cat ? 'on' : ''}" data-act="fin-cat" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
  <div class="grid2"><div class="field"><label>Fecha</label><input type="date" id="fx-d" value="${t.date}"></div><div class="field"><label>Nota (opcional)</label><input type="text" id="fx-n" value="${esc(t.note || '')}" placeholder="Ej: cena con amigos"></div></div>
  <div class="row">${t.id ? `<button class="btn danger" data-act="fin-del" data-id="${t.id}">Borrar</button>` : ''}<button class="btn grow" data-act="fin-save">Guardar</button></div>`;
};

const readFinDraft = () => { const d = U.finDraft; d.amount = num($('#fx-a').value) || 0; d.date = $('#fx-d').value || todayKey(); d.note = $('#fx-n').value.trim(); return d; };

const drawFin = () => openSheet(`<h2 class="h2 u-mb-14">${U.finDraft.id ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>${finForm(U.finDraft)}`, () => { const a = $('#fx-a'); if (a && !U.finDraft.amount) a.focus(); });

ACT['fin-add'] = el => { const type = el.dataset.type, m = monthKey(); U.finDraft = { id: '', type, cat: fin(S).cats[type][0], amount: 0, note: '', date: m === todayKey().slice(0, 7) ? todayKey() : m + '-01' }; drawFin(); };

ACT['fin-edit'] = el => { U.finDraft = { ...fin(S).tx.find(t => t.id === el.dataset.id) }; drawFin(); };

ACT['fin-type'] = el => { readFinDraft(); const d = U.finDraft; d.type = el.dataset.type; if (!fin(S).cats[d.type].includes(d.cat)) d.cat = fin(S).cats[d.type][0]; drawFin(); };

ACT['fin-cat'] = el => { readFinDraft(); U.finDraft.cat = el.dataset.c; drawFin(); };

ACT['fin-save'] = () => {
  const d = readFinDraft(); if (!d.amount || d.amount <= 0) return toast('Ingresá un monto');
  const f = fin(S), rec = { id: d.id || uid(), type: d.type, cat: d.cat, amount: d.amount, date: d.date, note: d.note };
  if (d.id) f.tx = f.tx.map(t => t.id === d.id ? rec : t); else f.tx.push(rec);
  U.finMonth = rec.date.slice(0, 7); save(); closeSheet(); toast(d.type === 'in' ? 'Ingreso guardado' : 'Gasto guardado'); render(true);
};

ACT['fin-del'] = el => { fin(S).tx = fin(S).tx.filter(t => t.id !== el.dataset.id); save(); closeSheet(); render(true); };

/* categorías, topes y moneda */
function drawFinCats() {
  const f = fin(S), sec = (type, title) => `<div class="eyebrow u-m-14-0-8">${title}</div><div class="list">${f.cats[type].map(c => `<div class="row"><div class="grow">${esc(c)}</div>
    ${type === 'out' ? `<input type="number" inputmode="decimal" class="u-w-110" placeholder="Tope/mes" data-budget="${esc(c)}" value="${f.budgets[c] || ''}">` : ''}
    <button class="icon-btn tap u-bg-none u-w-30 u-h-30" data-act="fin-cat-del" data-type="${type}" data-c="${esc(c)}" aria-label="Quitar ${esc(c)}">${ic('x')}</button></div>`).join('')}</div>
    <div class="row u-mt-8"><input type="text" id="nc-${type}" placeholder="Nueva categoría"><button class="btn soft sm" data-act="fin-cat-add" data-type="${type}">Agregar</button></div>`;
  openSheet(`<h2 class="h2 u-mb-4">Categorías</h2><p class="muted small">Elegí un tope mensual si querés que te avise cuando te pasás.</p>
    <div class="field u-mt-12"><label>Símbolo de moneda</label><input type="text" id="fin-cur" maxlength="5" value="${esc(f.cur)}" class="u-w-110"></div>${sec('out', 'Gastos')}${sec('in', 'Ingresos')}
    <button class="btn block u-mt-18" data-act="fin-cats-done">Listo</button>`);
}

ACT['fin-cats'] = drawFinCats;

function readFinCats() { const f = fin(S); f.cur = ($('#fin-cur')?.value || '$').trim() || '$'; $$('[data-budget]').forEach(i => { const v = num(i.value); if (v > 0) f.budgets[i.dataset.budget] = v; else delete f.budgets[i.dataset.budget]; }); }

ACT['fin-cat-add'] = el => { readFinCats(); const i = $('#nc-' + el.dataset.type), n = i.value.trim(), l = fin(S).cats[el.dataset.type]; if (!n) return; if (l.some(c => c.toLowerCase() === n.toLowerCase())) return toast('Esa categoría ya existe'); l.push(n); save(); drawFinCats(); };

ACT['fin-cat-del'] = el => { readFinCats(); const l = fin(S).cats[el.dataset.type]; if (l.length <= 1) return toast('Dejá al menos una categoría'); if (!confirm(`¿Quitar «${el.dataset.c}»? Los movimientos que ya anotaste se conservan.`)) return; fin(S).cats[el.dataset.type] = l.filter(c => c !== el.dataset.c); save(); drawFinCats(); };

ACT['fin-cats-done'] = () => { readFinCats(); save(); closeSheet(); render(true); };

document.addEventListener('change', e => { const t = e.target; if (t.dataset && (t.dataset.budget !== undefined) || t.id === 'fin-cur') { readFinCats(); save(); } });


/* ---------- gastos recurrentes ---------- */
function recurringCard() {
  const rs = fin(S).recurring;
  return `<div class="card" data-key="fin-rec"><div class="row between u-mb-6"><h2 class="h2">Gastos fijos</h2><button class="btn ghost sm" data-act="rec-edit" data-id="">${ic('plus', 14)} Nuevo</button></div>
    ${rs.length ? `<div class="list">${rs.map(r => `<div class="row" data-key="rc-${r.id}"><button class="check ${r.active === false ? '' : 'on'}" data-act="rec-toggle" data-id="${r.id}" aria-label="Activar o pausar ${esc(r.name || r.cat)}">${ic('check')}</button><button class="grow tap u-ta-left" data-act="rec-edit" data-id="${r.id}"><div class="u-fw-450">${esc(r.name || r.cat)}</div><div class="tiny muted">${esc(r.cat)} · el día ${r.day} de cada mes${r.active === false ? ' · en pausa' : ''}</div></button><b class="num ${r.type === 'in' ? 'accent' : ''}">${r.type === 'in' ? '+' : '−'}${money(r.amount)}</b></div>`).join('')}</div>`
      : '<p class="small muted">Alquiler, suscripciones, gym… Se cargan solos cada mes y los podés editar o pausar.</p>'}</div>`;
}

const recDraft = () => U.recDraft || (U.recDraft = { id: '', type: 'out', name: '', cat: fin(S).cats.out[0], amount: 0, day: 1 });
const drawRec = () => { const d = recDraft(), f = fin(S);
  openSheet(`<h2 class="h2 u-mb-14">${d.id ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}</h2>
  <div class="seg u-mb-14"><button class="${d.type === 'out' ? 'on' : ''}" data-act="rec-type" data-type="out">Gasto</button><button class="${d.type === 'in' ? 'on' : ''}" data-act="rec-type" data-type="in">Ingreso</button></div>
  <div class="field"><label>Nombre</label><input type="text" id="rc-n" value="${esc(d.name)}" placeholder="Ej: Alquiler, Netflix"></div>
  <div class="grid2"><div class="field"><label>Monto (${esc(f.cur)})</label><input type="number" inputmode="decimal" step="any" id="rc-a" value="${d.amount || ''}"></div><div class="field"><label>Día del mes</label><input type="number" inputmode="numeric" min="1" max="31" id="rc-d" value="${d.day}"></div></div>
  <div class="field"><label>Categoría</label><select id="rc-c">${f.cats[d.type].map(c => `<option ${c === d.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
  <p class="tiny muted u-mb-12">Si el mes no tiene ese día (por ejemplo 31 en febrero), se carga el último día del mes.</p>
  <div class="row">${d.id ? `<button class="btn danger" data-act="rec-del" data-id="${d.id}">Borrar</button>` : ''}<button class="btn grow" data-act="rec-save">Guardar</button></div>`); };
const readRec = () => { const d = recDraft(); d.name = $('#rc-n').value.trim(); d.amount = num($('#rc-a').value) || 0; d.day = Math.min(31, Math.max(1, Math.round(num($('#rc-d').value) || 1))); d.cat = $('#rc-c').value; return d; };

ACT['rec-edit'] = el => { const r = fin(S).recurring.find(x => x.id === el.dataset.id); U.recDraft = r ? { ...r } : null; drawRec(); };
ACT['rec-type'] = el => { readRec(); const d = recDraft(); d.type = el.dataset.type; d.cat = fin(S).cats[d.type][0]; drawRec(); };
ACT['rec-save'] = () => {
  const d = readRec(); if (!d.amount) return toast('Ingresá un monto'); const f = fin(S);
  const rec = { ...d, id: d.id || uid(), name: d.name || d.cat, active: d.active !== false, from: d.from || todayKey().slice(0, 7), gen: d.gen || [] };
  if (d.id) f.recurring = f.recurring.map(r => r.id === d.id ? rec : r); else f.recurring.push(rec);
  U.recDraft = null; const n = applyRecurring(S, todayKey()); save(); closeSheet(); toast(n ? 'Guardado y cargado este mes' : 'Gasto fijo guardado'); render(true);
};
ACT['rec-del'] = el => { fin(S).recurring = fin(S).recurring.filter(r => r.id !== el.dataset.id); U.recDraft = null; save(); closeSheet(); render(true); };
ACT['rec-toggle'] = el => { const r = fin(S).recurring.find(x => x.id === el.dataset.id); r.active = r.active === false; if (r.active) applyRecurring(S, todayKey()); save(); render(true); };

/* ---------- meta de ahorro ---------- */
function goalCard() {
  const g = fin(S).goal, p = goalProgress(g, todayKey()), cur = fin(S).cur;
  if (!p) return `<button class="card tap tile" data-act="goal-edit" data-key="fin-goal"><div class="row"><div class="badge">${ic('target')}</div><div><b>Meta de ahorro</b><div class="tiny muted">Poné un objetivo y una fecha; la barra avanza cuando sumás.</div></div></div></button>`;
  return `<div class="card" data-key="fin-goal"><div class="row between"><div><div class="eyebrow">Meta de ahorro</div><b class="h2">${esc(g.name || 'Mi meta')}</b></div><button class="icon-btn tap" data-act="goal-edit" aria-label="Editar meta">${ic('pen')}</button></div>
    <div class="row between u-mt-12"><span class="num u-fs-26">${money(p.saved)}</span><span class="muted small">de ${money(g.target)} · ${r0(p.pct * 100)} %</span></div><div class="bar u-mt-8"><i data-w="${r0(p.pct * 100)}"></i></div>
    <div class="tiny muted u-mt-8">${p.done ? '¡Llegaste! Podés ponerte una meta nueva.' : g.due ? `Para ${monthName(g.due)}: ${money(p.perMonth)} por mes (faltan ${money(p.left)}). Es una cuenta aproximada.` : `Faltan ${money(p.left)}.`}</div>
    ${p.done ? '' : `<button class="btn soft sm u-mt-12" data-act="goal-add">+ Sumar ahorro</button>`}</div>`;
}
ACT['goal-edit'] = () => { const g = fin(S).goal || { name: '', target: '', saved: 0, due: '' };
  openSheet(`<h2 class="h2 u-mb-14">Meta de ahorro</h2><div class="field"><label>¿Para qué?</label><input type="text" id="gl-n" value="${esc(g.name)}" placeholder="Ej: Viaje, notebook, fondo de emergencia"></div>
  <div class="grid2"><div class="field"><label>Objetivo (${esc(fin(S).cur)})</label><input type="number" inputmode="decimal" id="gl-t" value="${g.target || ''}"></div><div class="field"><label>Ya ahorrado</label><input type="number" inputmode="decimal" id="gl-s" value="${g.saved || ''}"></div></div>
  <div class="field"><label>Fecha objetivo (mes)</label><input type="month" id="gl-d" value="${g.due || ''}"></div>
  <div class="row">${fin(S).goal ? `<button class="btn danger" data-act="goal-del">Quitar</button>` : ''}<button class="btn grow" data-act="goal-save">Guardar</button></div>`); };
ACT['goal-save'] = () => { const t = num($('#gl-t').value) || 0; if (t <= 0) return toast('Ingresá el objetivo'); fin(S).goal = { name: $('#gl-n').value.trim(), target: t, saved: num($('#gl-s').value) || 0, due: $('#gl-d').value || '' }; save(); closeSheet(); render(true); };
ACT['goal-del'] = () => { fin(S).goal = null; save(); closeSheet(); render(true); };
ACT['goal-add'] = () => openSheet(`<h2 class="h2 u-mb-14">Sumar ahorro</h2><div class="field"><label>Monto (${esc(fin(S).cur)})</label><input type="number" inputmode="decimal" id="ga-a" class="fin-amt" placeholder="0"></div><button class="btn block" data-act="goal-add-save">Sumar</button>`, () => $('#ga-a')?.focus());
ACT['goal-add-save'] = () => { const a = num($('#ga-a').value) || 0; if (a <= 0) return toast('Ingresá un monto'); const g = fin(S).goal; g.saved = (g.saved || 0) + a; save(); closeSheet(); toast('¡Sumado!'); render(true); };
