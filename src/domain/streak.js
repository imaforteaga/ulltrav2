// Forgiving streaks: one "grace day" per calendar week (Mon–Sun) does not break the streak, and a 30-day
// "habit strength" that weighs recent days more. Pure: it takes an `isDone(k)` function, not the engine.
import { addDays, lastDays, pk } from '../lib/dates.js';

const weekOf = k => { const d = pk(k), w = (d.getDay() + 6) % 7; return addDays(k, -w); };

/** Consecutive days done, counting back from today (today is skipped if still pending). With `grace`, one missed day per week is forgiven. */
export function streakWithGrace(isDone, today, { grace = true, startKey = '0000-01-01' } = {}) {
  let d = today, n = 0, used = new Set(), forgiven = [];
  if (!isDone(d)) d = addDays(d, -1);
  for (let i = 0; i < 2000 && d >= startKey; i++) {
    if (isDone(d)) { n++; }
    else if (grace && !used.has(weekOf(d)) && isDone(addDays(d, -1))) { used.add(weekOf(d)); forgiven.push(d); }
    else break;
    d = addDays(d, -1);
  }
  return { streak: n, forgiven };
}

/** 0–100. Each day counts with weight 0.5^(age/halfLife): yesterday matters more than three weeks ago. Days before `startKey` are ignored. */
export function habitStrength(isDone, today, { days = 30, halfLife = 10, startKey = '0000-01-01' } = {}) {
  let num = 0, den = 0;
  lastDays(days, today).forEach((k, i, a) => { if (k < startKey) return; const w = Math.pow(.5, (a.length - 1 - i) / halfLife); den += w; if (isDone(k)) num += w; });
  return den ? Math.round(num / den * 100) : 0;
}

export const strengthWord = p => p >= 85 ? 'muy firme' : p >= 65 ? 'firme' : p >= 40 ? 'tomando forma' : 'recién empieza';
