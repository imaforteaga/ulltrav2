// Weekly review (Sunday/Monday): what went best, what drifted most, and exactly ONE suggestion for next week.
// Pure. Combines the engine, patterns, the adaptive calorie suggestion and the answers from "Conocerme".
import { addDays, pk } from '../lib/dates.js';
import { f0, f1 } from '../lib/format.js';
import { adaptiveSuggestion } from './adaptive.js';
import { answerOf } from './about.js';
import { dayNutrition } from './nutrition.js';
import { findPatterns } from './patterns.js';
import { bedtime } from './readiness.js';
import { CATS, makeEngine } from './score-engine.js';
import { lastDays } from '../lib/dates.js';

/** The week being reviewed ends on the last Sunday (today if it is Sunday, yesterday if Monday). Null on other days. */
export function weekEnd(today) { const d = pk(today).getDay(); return d === 0 ? today : d === 1 ? addDays(today, -1) : null; }
export const weeklyDue = (S, today) => { const e = weekEnd(today); return !!e && !!S.profile && (S.prefs || {}).weeklySeen !== e && (S.prefs || {}).weeklyOff !== true; };

/** Picks the single suggestion: lowest `pri` wins (ties keep their order). */
export const pickAdjustment = cands => cands.filter(Boolean).map((c, i) => ({ c, i })).sort((a, b) => a.c.pri - b.c.pri || a.i - b.i)[0]?.c || null;

export function weeklyReview(S, today) {
  const end = weekEnd(today) || today, P = S.profile || {}, E = makeEngine(S, end), per = E.period(7, end);
  if (!per.days) return null;
  const cats = Object.entries(per.cats).sort((a, b) => b[1] - a[1]);
  const best = cats[0], worst = cats.length > 1 ? cats[cats.length - 1] : null;
  const days = lastDays(7, end), cats7 = {};
  const sleeps = days.map(k => S.sleep[k]).filter(v => v != null), sleepAvg = sleeps.length >= 3 ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : null;
  const nut = days.map(k => dayNutrition(S, k)).filter(n => n.n), protAvg = nut.length >= 3 ? nut.reduce((a, n) => a + n.p, 0) / nut.length : null;
  const trained = days.reduce((a, k) => a + (E.workoutsBy[k] || 0), 0), goalT = Math.max(1, P.trainingDays || 3);
  const ad = adaptiveSuggestion(S, end), pat = findPatterns(S, end)[0], foco = (answerOf(S, 'foco') || {}).v;
  const cands = [
    ad.status === 'adjust' ? { pri: 1, id: 'kcal', text: `${ad.delta > 0 ? 'Subí' : 'Bajá'} tu meta ${Math.abs(ad.delta)} kcal (a ${f0(ad.next)}): ${ad.text.split('. ')[0].replace(/\.$/, '')}.`, fix: { label: 'Aplicar', kind: 'kcal', value: ad.next } } : null,
    sleepAvg != null && sleepAvg < (P.sleepTarget || 8) - .5 ? { pri: 2, id: 'sleep', text: `Dormiste ${f1(sleepAvg)} h en promedio y tu meta es ${P.sleepTarget || 8}. Esta semana probá acostarte a las ${bedtime(P.sleepTarget || 8, (S.prefs || {}).wake)}.` } : null,
    protAvg != null && P.protein && protAvg < .85 * P.protein ? { pri: 3, id: 'protein', text: `Tu proteína promedió ${f0(protAvg)} g de ${P.protein}. Sumá una fuente en una sola comida (huevos, yogur, atún) y listo.` } : null,
    trained < goalT ? { pri: 4, id: 'train', text: `Entrenaste ${trained} de ${goalT} días. Elegí desde ya el día y la hora de la primera sesión de la semana.` } : null,
    pat ? { pri: 5, id: 'pattern', text: `Algo que se nota en tus datos: ${pat.text.replace(/\.$/, '')}. Probá repetirlo esta semana.` } : null,
    foco ? { pri: 6, id: 'foco', text: `Tu foco es ${({ fuerza: 'la fuerza', estetica: 'la estética', energia: 'la energía', salud: 'la salud', constancia: 'la constancia' })[foco] || foco}: elegí UNA acción chica y repetila todos los días.` } : null,
    { pri: 9, id: 'keep', text: 'La semana estuvo pareja. Mantené lo que ya funciona y no cambies nada.' },
  ];
  return { end, score: per.overall, consistency: per.consistent, days: per.days, trained, goalT,
    best: best ? { key: best[0], title: CATS[best[0]].t, pct: Math.round(best[1] * 100) } : null,
    worst: worst && worst[0] !== (best && best[0]) ? { key: worst[0], title: CATS[worst[0]].t, pct: Math.round(worst[1] * 100) } : null,
    adjust: pickAdjustment(cands) };
}
