import { dayNutrition, waterOn } from './nutrition.js';
import { addDays, lastDays, pk, todayKey } from '../lib/dates.js';

/* ===== Transformation Score engine (port of the iOS ScoreEngine) ===== */
export const CATS = {
  nutrition: { t: 'Nutrición', i: 'fork', ex: 'Calorías cerca de tu meta (±10 % cuenta como en meta) y proteína ≥ 90 % de la meta.', tip: 'Registrá las comidas a medida que comés, proteína primero.' },
  workouts: { t: 'Entrenos', i: 'dumbbell', ex: 'Sesiones completadas frente a tu meta semanal. Los días programados que salteás restan.', tip: 'Agendá tu próxima sesión ahora; incluso una corta cuenta.' },
  mobility: { t: 'Movilidad', i: 'stretch', ex: 'Sesiones de movilidad frente a una meta semanal.', tip: 'Diez minutos de movilidad a la mañana o a la noche alcanzan.' },
  hydration: { t: 'Hidratación', i: 'drop', ex: 'Agua registrada frente a tu meta diaria (90 % cuenta como completo).', tip: 'Tené una botella a la vista y usá los botones rápidos.' },
  sleep: { t: 'Sueño', i: 'moon', ex: 'Horas dormidas frente a tu meta (90 % cuenta como completo). Los días sin registro se ignoran.', tip: 'Cuidá un horario de sueño constante esta noche.' },
  habits: { t: 'Hábitos', i: 'list', ex: 'Proporción de hábitos que suman al score completados cada día.', tip: 'Elegí el hábito que más salteás y hacelo primero.' },
  goals: { t: 'Metas', i: 'flag', ex: 'Cuántos de tus hitos activos avanzaron en los últimos 7 días.', tip: 'Registrá una pequeña actualización en un hito hoy.' }
};

export const CAT_KEYS = Object.keys(CATS);

export const DEFAULT_HABITS = [
  ['Tomar suficiente agua', 'water'], ['Tomar creatina', 'creatine'], ['Tomar suplementos', 'supplements'], ['Completar el entrenamiento', 'training'],
  ['Estirar', 'stretch'], ['Dormir lo suficiente', 'sleep'], ['Comer suficiente proteína', 'protein'], ['Leer la Biblia', 'bible']
];

export const HABIT_AUTO = {
  water: 'Se completa solo al llegar al 90 % de tu meta de agua.', training: 'Se completa solo al terminar un entrenamiento.',
  stretch: 'Se completa solo al registrar una sesión de movilidad.', protein: 'Se completa solo al llegar al 90 % de tu meta de proteína.',
  sleep: 'Se completa solo si registrás suficientes horas de sueño.', supplements: 'Se completa solo cuando registrás todos los suplementos del día.',
  creatine: 'Se completa al registrar un suplemento de creatina (o marcalo a mano).', bible: 'Marcalo a mano o tocá «Marcar como leído» en la Biblia.'
};

export function makeEngine(S, today = todayKey()) {
  const P = S.profile || {};
  const startKey = (P.createdAt || today);
  const T = { kcal: P.kcal || 2500, protein: P.protein || 150, water: P.water || 3000, sleep: P.sleepTarget || 8, trainDays: Math.max(1, P.trainingDays || 3), mob: P.mobilityTarget || 4 };
  const disabled = new Set(P.disabledCats || []);
  const enabled = CAT_KEYS.filter(c => !disabled.has(c));
  const workoutsBy = {}, mobBy = {};
  S.sessions.filter(s => s.finished).forEach(s => workoutsBy[s.date] = (workoutsBy[s.date] || 0) + 1);
  S.mobSessions.forEach(s => mobBy[s.date] = (mobBy[s.date] || 0) + 1);
  const nutr = k => dayNutrition(S, k);
  const dueSupps = k => S.supplements.filter(s => s.active !== false);
  const habitsActive = S.habits.filter(h => h.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

  const isAuto = (h, k) => {
    switch (h.key) {
      case 'water': return waterOn(S, k) >= .9 * T.water;
      case 'training': return (workoutsBy[k] || 0) > 0;
      case 'stretch': return (mobBy[k] || 0) > 0;
      case 'protein': return nutr(k).p >= .9 * T.protein;
      case 'sleep': return S.sleep[k] != null && S.sleep[k] >= .9 * T.sleep;
      case 'supplements': { const d = dueSupps(k); const l = S.supLogs[k] || []; return d.length > 0 && d.every(s => l.includes(s.id)); }
      case 'creatine': { const c = S.supplements.filter(s => s.active !== false && /creatin/i.test(s.name)); const l = S.supLogs[k] || []; return c.some(s => l.includes(s.id)); }
      default: return false;
    }
  };
  const isDone = (h, k) => (S.habitLogs[k] || []).includes(h.id) || isAuto(h, k);
  const streak = h => { let d = today; if (!isDone(h, d)) d = addDays(d, -1); let n = 0; while (n < 2000 && isDone(h, d)) { n++; d = addDays(d, -1); } return n; };
  const rate = (h, days) => { const w = lastDays(days, today).filter(k => k >= startKey); return w.length ? w.filter(k => isDone(h, k)).length / w.length : 0; };
  const scoring = habitsActive.filter(h => h.counts !== false);
  const activeMilestones = k => S.milestones.filter(m => m.createdAt <= k && (!m.completedAt || m.completedAt >= k));

  function value(c, k) {
    const isToday = k === today;
    switch (c) {
      case 'nutrition': {
        const n = nutr(k); if (!n.n) return 0;
        const ratio = T.kcal > 0 ? n.kcal / T.kcal : 1; let cal;
        if (isToday && ratio <= 1.1) cal = Math.min(ratio / .9, 1); else { const dev = Math.abs(ratio - 1); cal = dev <= .1 ? 1 : Math.max(0, 1 - (dev - .1) / .4); }
        const prot = T.protein > 0 ? Math.min(n.p / (.9 * T.protein), 1) : 1; return .6 * cal + .4 * prot;
      }
      case 'workouts': { if ((workoutsBy[k] || 0) > 0) return 1; const sched = S.routines.some(r => r.weekday === pk(k).getDay()); return sched && !isToday ? 0 : null; }
      case 'mobility': return (mobBy[k] || 0) > 0 ? 1 : null;
      case 'hydration': return Math.min(waterOn(S, k) / (.9 * T.water), 1);
      case 'sleep': return S.sleep[k] != null ? Math.min(S.sleep[k] / (.9 * T.sleep), 1) : null;
      case 'habits': return scoring.length ? scoring.filter(h => isDone(h, k)).length / scoring.length : null;
      case 'goals': {
        const ms = activeMilestones(k); if (!ms.length) return null; const from = addDays(k, -6);
        return ms.filter(m => (m.updates || []).some(u => u.date >= from && u.date <= k)).length / ms.length;
      }
    }
  }
  function daily(k) {
    const values = {}; enabled.forEach(c => { const v = value(c, k); if (v != null) values[c] = v; });
    const vs = Object.values(values); return { day: k, values, total: vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length * 100 : null };
  }
  function period(days, end = today) {
    const win = lastDays(days, end).filter(k => k >= startKey);
    if (!win.length) return { overall: 0, level: 0, consistency: 0, cats: {}, consistent: 0, days: 0 };
    const sc = win.map(daily), cats = {};
    enabled.forEach(c => {
      if (c === 'workouts' || c === 'mobility') {
        const cnt = win.reduce((a, k) => a + ((c === 'workouts' ? workoutsBy : mobBy)[k] || 0), 0);
        cats[c] = Math.min(cnt / Math.max(1, (c === 'workouts' ? T.trainDays : T.mob) * win.length / 7), 1);
      } else { const v = sc.map(s => s.values[c]).filter(x => x != null); if (v.length) cats[c] = v.reduce((a, b) => a + b, 0) / v.length; }
    });
    const cv = Object.values(cats), level = cv.length ? cv.reduce((a, b) => a + b, 0) / cv.length * 100 : 0;
    const consistent = sc.filter(s => (s.total || 0) >= 60).length, consistency = consistent / win.length * 100;
    return { overall: .7 * level + .3 * consistency, level, consistency, cats, consistent, days: win.length };
  }
  const label = s => s >= 85 ? 'Constancia sobresaliente' : s >= 70 ? 'Buen ritmo' : s >= 50 ? 'Tomando impulso' : s >= 25 ? 'Empezando' : 'Un nuevo comienzo';
  return {
    T, enabled, startKey, habitsActive, isDone, isAuto, streak, rate, daily, period, label, value, workoutsBy, mobBy,
    today: () => daily(today), week: () => period(7), month: () => period(30),
    evolution: n => lastDays(n, today).filter(k => k >= startKey).map(k => ({ x: k, y: period(7, k).overall })),
    series: n => lastDays(n, today).filter(k => k >= startKey).map(daily),
    attention: p => Object.entries(p.cats).sort((a, b) => a[1] - b[1])
  };
}
