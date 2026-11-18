// Double progression: when every set of the last session reached the top of the rep range, suggest a little more weight.
// Otherwise repeat the weight. Always a suggestion; the app never fills the weight in by itself.
import { num } from '../lib/utils.js';
import { f1 } from '../lib/format.js';
import { doneSets, exerciseHistory } from './training.js';

export const DEFAULT_STEP = 2.5;
const topOf = r => { if (r == null || r === '') return null; const m = String(r).match(/\d+/g); return m ? Math.max(...m.map(Number)) : null; };

/** Top of the rep range for an exercise: its own target, else the routine's, else 10. */
export function repTop(S, name, ex) {
  const own = topOf(ex && ex.target); if (own) return own;
  for (const r of S.routines) { const e = r.exercises.find(x => x.name === name); if (e && topOf(e.reps)) return topOf(e.reps); }
  return 10;
}

export function suggestNext(S, name, ex) {
  const h = exerciseHistory(S, name); if (!h.length) return null;
  const last = h[h.length - 1], top = repTop(S, name, ex), step = (S.prefs && S.prefs.progStep) || DEFAULT_STEP;
  const sets = last.sets, kgs = sets.map(s => num(s.kg) || 0), kg = Math.max(...kgs); if (!kg) return null;
  const atTop = sets.every(s => num(s.reps) >= top);
  const out = { name, last: { kg, sets: sets.length, minReps: Math.min(...sets.map(s => num(s.reps))) }, top };
  return atTop ? { ...out, dir: 'up', kg: Math.round((kg + step) * 100) / 100, text: `Completaste todas las series en ${top} reps con ${f1(kg)} kg: probá ${f1(kg + step)} kg.` }
    : { ...out, dir: 'repeat', kg, text: `Repetí ${f1(kg)} kg hasta llegar a ${top} reps en todas las series.` };
}

/* ---- soft reminders for aches noted in "Conocerme" (not medical advice) ---- */
const AREA = {
  hombro: /press|raise|fly|dip|pull.?up|push.?up|shoulder|militar|lateral|fondos|dominada|flexion/i,
  espalda: /deadlift|row|squat|good.?morning|peso muerto|remo|sentadilla|hip thrust|back/i,
  rodilla: /squat|lunge|leg (press|extension)|step|jump|sentadilla|zancada|prensa|salto/i,
  muneca: /curl|press|push.?up|dip|wrist|flexion|fondos|barbell|barra/i,
};
export function achesFor(aboutAnswer, exerciseName) {
  const l = [].concat(aboutAnswer || []).filter(x => x && x !== 'ninguna');
  return l.filter(a => AREA[a] && AREA[a].test(exerciseName));
}
export const acheNote = areas => areas.length ? `Anotaste molestia en ${areas.join(' y ')}. Ajustá el peso o cambiá el ejercicio si duele. No es una indicación médica.` : '';
export { doneSets };
