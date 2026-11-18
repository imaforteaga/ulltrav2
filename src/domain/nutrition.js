import { clamp } from '../lib/utils.js';

/* ---- nutrition helpers ---- */
export function dayNutrition(S, k) {
  const es = S.foods.filter(f => f.date === k);
  return es.reduce((a, f) => ({ kcal: a.kcal + f.kcal, p: a.p + f.p, c: a.c + f.c, f: a.f + f.f, fi: a.fi + (f.fi || 0), n: a.n + 1 }), { kcal: 0, p: 0, c: 0, f: 0, fi: 0, n: 0 });
}

export const waterOn = (S, k) => S.water.filter(w => w.date === k).reduce((a, w) => a + w.ml, 0);

export function suggestTargets(obj, kg, cm, age, days) {
  const bmr = 10 * kg + 6.25 * cm - 5 * age - 78, maint = bmr * (1.2 + .075 * clamp(days, 0, 7));
  const gain = ['muscleGain', 'strength'].includes(obj), lose = obj === 'fatLoss';
  const kcal = Math.max(1200, Math.round((maint + (gain ? 300 : lose ? -450 : 0)) / 50) * 50);
  const protein = Math.round(kg * (lose ? 2.2 : 2)), fat = Math.max(Math.round(kg * .9), Math.round(kcal * .22 / 9));
  return { kcal, protein, fat, carbs: Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4)), water: Math.max(1500, Math.round(kg * 35 / 250) * 250) };
}
