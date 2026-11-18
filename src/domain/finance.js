import { MONTHS, addDays, lastDays, pad } from '../lib/dates.js';
import { f0 } from '../lib/format.js';

/* ===== Finanzas: ingresos, gastos, categorías y presupuestos ===== */
const FIN_DEFAULT_CATS = {
  out: ['Comida', 'Uber / Transporte', 'Salidas', 'Marihuana', 'Suscripciones', 'Salud', 'Gym y suplementos', 'Compras', 'Alquiler y servicios', 'Otros'],
  in: ['Sueldo', 'Freelance', 'Ventas', 'Regalo', 'Otros']
};

export function fin(S) {
  if (!S.fin) S.fin = { cur: '$', tx: [], cats: { out: [...FIN_DEFAULT_CATS.out], in: [...FIN_DEFAULT_CATS.in] }, budgets: {}, recurring: [], goal: null };
  if (!Array.isArray(S.fin.recurring)) S.fin.recurring = [];
  if (S.fin.goal === undefined) S.fin.goal = null;
  return S.fin;
}

export const shiftMonth = (m, d) => { const [y, mo] = m.split('-').map(Number), dt = new Date(y, mo - 1 + d, 1); return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`; };

export const monthName = m => `${MONTHS[+m.slice(5) - 1]} ${m.slice(0, 4)}`;

export const sumTx = (txs, type) => txs.filter(t => t.type === type).reduce((a, t) => a + t.amount, 0);


/* ===== Gastos recurrentes: se crean solos cada mes, en el día indicado (clamp a fin de mes) ===== */
export const dim = m => new Date(+m.slice(0, 4), +m.slice(5), 0).getDate();
export const recurringDate = (m, day) => `${m}-${pad(Math.min(Math.max(1, day), dim(m)))}`;

/** Transactions that should exist by `today` and have not been created yet. Pure: does not touch S. */
export function dueRecurring(S, today) {
  const f = fin(S), cur = today.slice(0, 7), out = [];
  for (const r of f.recurring) {
    if (r.active === false || !(r.amount > 0)) continue;
    const gen = new Set(r.gen || []);
    for (let m = r.from || cur, n = 0; m <= cur && n < 36; m = shiftMonth(m, 1), n++) {
      const date = recurringDate(m, r.day || 1);
      if (gen.has(m) || date > today) continue;
      out.push({ rid: r.id, month: m, tx: { id: `r-${r.id}-${m}`, type: r.type || 'out', cat: r.cat, amount: r.amount, date, note: r.note || r.name || '', rid: r.id } });
    }
  }
  return out;
}

/** Creates the due transactions and remembers which months were generated (so deleting one does not bring it back). Returns how many. */
export function applyRecurring(S, today) {
  const f = fin(S), due = dueRecurring(S, today);
  due.forEach(d => { f.tx.push(d.tx); const r = f.recurring.find(x => x.id === d.rid); (r.gen = r.gen || []).push(d.month); });
  return due.length;
}

/* ===== Meta de ahorro ===== */
export function goalProgress(goal, today) {
  if (!goal || !(goal.target > 0)) return null;
  const saved = Math.max(0, goal.saved || 0), pct = Math.min(1, saved / goal.target), left = Math.max(0, goal.target - saved);
  let months = null, perMonth = null;
  if (goal.due) { months = Math.max(0, (+goal.due.slice(0, 4) - +today.slice(0, 4)) * 12 + (+goal.due.slice(5, 7) - +today.slice(5, 7))); perMonth = left > 0 ? Math.ceil(left / Math.max(1, months)) : 0; }
  return { pct, saved, left, months, perMonth, done: saved >= goal.target };
}

/* ===== Resumen semanal de gastos ===== */
export function weeklySpending(S, today) {
  const out = fin(S).tx.filter(t => t.type === 'out'), thisWk = new Set(lastDays(7, today)), prevDays = lastDays(28, addDays(today, -7));
  const sumBy = (set, cat) => out.filter(t => set.has(t.date) && (!cat || t.cat === cat)).reduce((a, t) => a + t.amount, 0);
  const prevSet = new Set(prevDays), total = sumBy(thisWk);
  if (!(total > 0)) return null;
  const cats = {}; out.filter(t => thisWk.has(t.date)).forEach(t => { cats[t.cat] = (cats[t.cat] || 0) + t.amount; });
  const [cat, amount] = Object.entries(cats).sort((a, b) => b[1] - a[1])[0], avg = sumBy(prevSet, cat) / 4, cur = fin(S).cur;
  const res = { total, cat, amount, avg, pct: avg > 0 ? (amount - avg) / avg * 100 : null };
  const base = `Esta semana gastaste ${cur}${f0(total)}; lo más grande fue ${cat} (${cur}${f0(amount)})`;
  res.text = avg > 0 ? `Gastaste ${cur}${f0(amount)} en ${cat}, ${Math.abs(res.pct) < 5 ? 'casi igual que' : res.pct > 0 ? `un ${f0(res.pct)} % más que` : `un ${f0(-res.pct)} % menos que`} tu promedio de las últimas 4 semanas.` : `${base}.`;
  return res;
}
