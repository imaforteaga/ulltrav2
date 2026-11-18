// Adaptive calorie target: compares the weight TREND with what you actually ate and what your objective expects.
// Pure. Only ever returns a suggestion; applying it is the user's tap.
import { addDays, lastDays } from '../lib/dates.js';
import { f0, f1, daysBetween } from '../lib/format.js';
import { sortedW } from './training.js';
import { dayNutrition } from './nutrition.js';

export const WINDOW = 14, MIN_WEIGHINS = 4, MIN_SPAN = 9, MIN_FOOD_DAYS = 9, MIN_KCAL_LOGGED = 800, KCAL_FLOOR = 1200;

/** Least-squares slope in kg per week over [{date, kg}]. */
export function weightSlope(pts) {
  if (pts.length < 2) return null;
  const t0 = pts[0].date, xs = pts.map(p => daysBetween(t0, p.date)), ys = pts.map(p => p.kg), n = pts.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0); if (!den) return null;
  return xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den * 7;
}

/** Expected weekly change as a fraction of body weight, with the band that counts as "on track". */
export const EXPECT = {
  fatLoss: { rate: -.005, lo: -.0085, hi: -.002 },
  muscleGain: { rate: .0025, lo: .0005, hi: .006 },
  strength: { rate: .0015, lo: 0, hi: .005 },
  recomposition: { rate: 0, lo: -.0025, hi: .0025 },
  generalFitness: { rate: 0, lo: -.0025, hi: .0025 },
};

export function adaptiveSuggestion(S, today) {
  const P = S.profile; if (!P || !P.kcal) return { status: 'insufficient' };
  const prefs = S.prefs || {};
  if (prefs.adaptiveSnoozeUntil && prefs.adaptiveSnoozeUntil > today) return { status: 'snoozed' };
  if (prefs.adaptiveAppliedAt && daysBetween(prefs.adaptiveAppliedAt, today) < WINDOW) return { status: 'wait' };
  const from = addDays(today, -(WINDOW - 1)), pts = sortedW(S).filter(w => w.date >= from && w.date <= today);
  const foodDays = lastDays(WINDOW, today).map(k => dayNutrition(S, k)).filter(n => n.n && n.kcal >= MIN_KCAL_LOGGED);
  if (pts.length < MIN_WEIGHINS || daysBetween(pts[0].date, pts[pts.length - 1].date) < MIN_SPAN || foodDays.length < MIN_FOOD_DAYS) return { status: 'insufficient' };
  const slope = weightSlope(pts), kg = pts.reduce((a, p) => a + p.kg, 0) / pts.length;
  const eatKcal = foodDays.reduce((a, n) => a + n.kcal, 0) / foodDays.length, pct = slope / kg;
  const ex = EXPECT[P.objective] || EXPECT.generalFitness, base = { slope, eatKcal, pct, weighIns: pts.length, foodDays: foodDays.length };
  let delta = 0, why = '';
  const rate = `${slope >= 0 ? '+' : '−'}${f1(Math.abs(slope))} kg por semana`;
  if (pct < ex.lo) { delta = ex.lo - pct > .004 ? 150 : 100; why = P.objective === 'fatLoss' ? `Tu peso baja a ${rate}, más rápido de lo que conviene para cuidar el músculo.` : `Tu peso viene ${slope < 0 ? 'bajando' : 'casi igual'} (${rate}), por debajo de lo que busca tu objetivo.`; }
  else if (pct > ex.hi) { delta = -(pct - ex.hi > .004 ? 150 : 100); why = P.objective === 'fatLoss' ? `Tu peso viene ${slope > 0 ? 'subiendo' : 'casi igual'} (${rate}) y tu objetivo es bajar.` : `Tu peso sube a ${rate}, más rápido de lo que busca tu objetivo.`; }
  if (!delta) return { status: 'ok', ...base, text: `Tu peso va a ${rate} comiendo en promedio ${f0(eatKcal)} kcal: está dentro de lo que busca tu objetivo. Sigo mirando.` };
  const next = Math.max(KCAL_FLOOR, Math.round((P.kcal + delta) / 50) * 50), real = next - P.kcal;
  if (!real) return { status: 'ok', ...base, text: 'Tu meta ya está en el mínimo que recomiendo; no sugiero bajarla más.' };
  return { status: 'adjust', ...base, delta: real, current: P.kcal, next, text: `${why} Comés ~${f0(eatKcal)} kcal por día. Sugiero ${real > 0 ? 'subir' : 'bajar'} la meta ${Math.abs(real)} kcal (de ${f0(P.kcal)} a ${f0(next)}). Es una estimación: si no te cierra, tocá «Ahora no».` };
}

/** Applies an accepted suggestion: the new kcal target plus the difference taken from/added to carbohydrates (protein and fat stay). */
export function applyAdaptive(S, sug, today) {
  const P = S.profile, d = sug.next - P.kcal;
  P.kcal = sug.next; if (P.carbs != null) P.carbs = Math.max(0, Math.round(P.carbs + d / 4));
  S.prefs = S.prefs || {}; S.prefs.adaptiveAppliedAt = today; delete S.prefs.adaptiveSnoozeUntil;
}
export function snoozeAdaptive(S, today, days = 7) { S.prefs = S.prefs || {}; S.prefs.adaptiveSnoozeUntil = addDays(today, days); }
