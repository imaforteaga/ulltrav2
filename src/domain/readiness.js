// "Cómo estoy hoy": a calm, worded read of how hard to push today. No score, no red.
// Inputs: last night's sleep vs target, the latest day-closing, and yesterday's / recent training load.
import { addDays } from '../lib/dates.js';
import { f1 } from '../lib/format.js';
import { sessionVolume } from './training.js';

const hm = t => { const [h, m] = String(t || '07:00').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const clock = mins => { const m = ((mins % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

/** When to go to bed to get `target` hours if waking at `wake` (plus ~15 min to fall asleep). */
export const bedtime = (target = 8, wake = '07:00') => clock(hm(wake) - Math.round(target * 60) - 15);

export function trainingLoad(S, today) {
  const done = S.sessions.filter(s => s.finished), y = addDays(today, -1), yv = done.filter(s => s.date === y).reduce((a, s) => a + sessionVolume(s), 0);
  const prev = done.filter(s => s.date < y && s.date >= addDays(today, -35)), avgVol = prev.length ? prev.reduce((a, s) => a + sessionVolume(s), 0) / prev.length : 0;
  let streak = 0; const days = new Set(done.map(s => s.date)); while (streak < 14 && days.has(addDays(today, -1 - streak))) streak++;
  const twoOff = !days.has(y) && !days.has(addDays(today, -2));
  return { yesterdayVol: yv, avgVol, heavy: yv > 0 && (avgVol ? yv >= avgVol * 1.2 : yv >= 6000), streak, twoOff };
}

export function readiness(S, today) {
  const P = S.profile || {}, target = P.sleepTarget || 8, prefs = S.prefs || {};
  let pts = 0; const bad = [], good = [], facts = [];
  const sleep = S.sleep[today];
  if (sleep != null) {
    if (sleep <= target - 1.5) { pts -= 2; bad.push('dormiste poco'); } else if (sleep < target - .5) { pts -= 1; bad.push('dormiste un poco menos de lo que necesitás'); } else if (sleep >= target) { pts += 1; good.push('dormiste bien'); }
    facts.push(`${f1(sleep)} h de sueño`);
  }
  let ci = null; for (const d of [addDays(today, -1), today]) if (S.checkins[d]) ci = S.checkins[d];
  if (ci) {
    const m = (ci.perf + ci.feel) / 2;
    if (m <= 4.5) { pts -= 1; bad.push('tu último cierre fue de poca energía'); } else if (m >= 7.5) { pts += 1; good.push('te sentiste bien en tu último cierre'); }
    facts.push(`cierre ${ci.perf}/${ci.feel}`);
  }
  const t = trainingLoad(S, today), any = S.sessions.some(s => s.finished);
  if (any) {
    if (t.heavy) { pts -= 1; bad.push('ayer entrenaste fuerte'); } else if (t.streak >= 3) { pts -= 1; bad.push(`llevás ${t.streak} días seguidos entrenando`); } else if (t.twoOff) { pts += 1; good.push('descansaste los últimos días'); }
  }
  const signals = (sleep != null) + !!ci + (any && (t.heavy || t.streak >= 3 || t.twoOff));
  if (!signals) return null;
  const level = pts <= -2 ? 'suave' : pts >= 2 ? 'a fondo' : 'normal';
  const cap = s => s[0].toUpperCase() + s.slice(1), join = a => a.length > 1 ? `${a.slice(0, -1).join(', ')} y ${a[a.length - 1]}` : a[0];
  const text = level === 'suave' ? `${cap(join(bad))}: hoy conviene una sesión más liviana o movilidad.`
    : level === 'a fondo' ? `${cap(join(good))}: es un buen día para exigirte un poco más.`
    : (bad.length || good.length) ? `${cap(join([...good, ...bad]))}. Seguí tu plan de siempre y escuchá cómo te sentís.` : 'Todo en orden: seguí tu plan de siempre.';
  return { level, text, facts, bedtime: bedtime(target, prefs.wake), wake: prefs.wake || '07:00', target, hidden: !!prefs.hideReadiness };
}
