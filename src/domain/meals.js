// Faster food logging: recent/frequent foods, "repeat yesterday's meal", quick kcal/protein entries. Pure.
import { addDays } from '../lib/dates.js';

const sig = f => `${f.name}|${f.qty || ''}`;

/** Most frequent foods in the last `days` days (same name+qty counts together), ties broken by recency. */
export function frequentFoods(S, today, { days = 30, max = 6 } = {}) {
  const from = addDays(today, -days), m = new Map();
  S.foods.filter(f => f.date >= from && f.date <= today && f.qty !== 'rápida').forEach(f => {
    const k = sig(f), cur = m.get(k) || { food: f, n: 0, last: '' }; cur.n++; if (f.date >= cur.last) { cur.last = f.date; cur.food = f; } m.set(k, cur);
  });
  return [...m.values()].sort((a, b) => b.n - a.n || b.last.localeCompare(a.last)).slice(0, max).map(x => ({ ...x.food, count: x.n }));
}

/** Most recent distinct foods. */
export function recentFoods(S, { max = 6 } = {}) {
  const seen = new Set(), out = [], byDate = S.foods.map((f, i) => ({ f, i })).sort((a, b) => b.f.date.localeCompare(a.f.date) || b.i - a.i);
  for (const { f } of byDate) { const k = sig(f); if (out.length >= max) break; if (f.qty === 'rápida' || seen.has(k)) continue; seen.add(k); out.push(f); }
  return out;
}

export const mealOn = (S, date, meal) => S.foods.filter(f => f.date === date && f.meal === meal);

/** Entries to copy for "repetir lo de ayer" (same meal, previous day). */
export const yesterdayMeal = (S, today, meal) => mealOn(S, addDays(today, -1), meal);

/** Builds the copies (new ids, new date). Does not mutate S. */
export const copyEntries = (entries, date, meal, uid) => entries.map(e => ({ ...e, id: uid(), date, meal }));

/** A food entry for a quick "just kcal / protein" log. Values are the user's own estimate. */
export const quickEntry = ({ kcal = 0, p = 0, name = 'Carga rápida' }, date, meal, id) => ({ id, date, meal, name: name || 'Carga rápida', qty: 'rápida', kcal: +kcal || 0, p: +p || 0, c: 0, f: 0, fi: 0 });
