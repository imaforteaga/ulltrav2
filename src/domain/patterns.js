// "Patrones": crosses the daily check-ins with sleep, training and food and states 2–3 observations.
// Pure. Wording is an observation, never a cause. Nothing is shown without enough data.
import { addDays, lastDays } from '../lib/dates.js';
import { f1 } from '../lib/format.js';
import { avg } from '../lib/stats.js';
import { dayNutrition } from './nutrition.js';

export const MIN_GROUP = 8;      // days needed in EACH group before a comparison is shown
export const MIN_DIFF = 0.8;     // minimum gap (on a 1–10 scale) so noise is not reported

/** One row per day that has a check-in, with whatever else was logged that day. */
export function dayRows(S, today, window = 60) {
  const P = S.profile || {}, done = new Set(S.sessions.filter(s => s.finished).map(s => s.date));
  return lastDays(window, today).filter(k => S.checkins[k]).map(k => {
    const n = dayNutrition(S, k);
    return { k, perf: S.checkins[k].perf, feel: S.checkins[k].feel, sleep: S.sleep[k] ?? null, trained: done.has(k),
      protein: n.n ? n.p : null, kcal: n.n ? n.kcal : null, goalP: P.protein || 0, goalK: P.kcal || 0 };
  });
}

const WHAT = { perf: 'tu rendimiento', feel: 'tu sentimiento' };

function compare(rows, { id, test, metric, yes, no }) {
  const A = [], B = [];
  rows.forEach(r => { const t = test(r); if (t === true) A.push(r[metric]); else if (t === false) B.push(r[metric]); });
  if (A.length < MIN_GROUP || B.length < MIN_GROUP) return null;
  const a = avg(A), b = avg(B), diff = a - b;
  if (Math.abs(diff) < MIN_DIFF) return null;
  return { id: `${id}-${metric}`, metric, a, b, na: A.length, nb: B.length, diff,
    text: `${yes}, ${WHAT[metric]} promedia ${f1(a)} vs ${f1(b)} ${no} (${A.length} y ${B.length} días).` };
}

/** Up to `max` findings, strongest first, at most one per condition. */
export function findPatterns(S, today, { window = 60, max = 3 } = {}) {
  const rows = dayRows(S, today, window), P = S.profile || {};
  if (rows.length < MIN_GROUP * 2) return [];
  const thr = Math.max(6, (P.sleepTarget || 8) - 0.5), thrTxt = f1(thr);
  const defs = [
    { id: 'sleep', test: r => r.sleep == null ? null : r.sleep >= thr, yes: `Los días que dormís ≥ ${thrTxt} h`, no: 'cuando dormís menos' },
    { id: 'train', test: r => r.trained, yes: 'Los días que entrenás', no: 'los días sin entreno' },
    { id: 'prot', test: r => r.protein == null || !r.goalP ? null : r.protein >= .9 * r.goalP, yes: 'Los días que llegás a tu proteína', no: 'cuando no llegás' },
    { id: 'kcal', test: r => r.kcal == null || !r.goalK ? null : Math.abs(r.kcal / r.goalK - 1) <= .1, yes: 'Los días que comés cerca de tu meta de calorías', no: 'cuando te alejás' },
  ];
  const all = [];
  for (const d of defs) for (const metric of ['perf', 'feel']) { const c = compare(rows, { ...d, metric }); if (c) all.push(c); }
  all.sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));
  const seen = new Set(), out = [];
  for (const f of all) { const cond = f.id.split('-')[0]; if (seen.has(cond)) continue; seen.add(cond); out.push(f); if (out.length >= max) break; }
  return out;
}

export const patternsSince = (S, today) => addDays(today, -59);
