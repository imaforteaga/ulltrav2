import { DATA } from '../data/content.js';
import { num } from '../lib/utils.js';

export const e1rm = (kg, reps) => reps <= 1 ? kg : kg * (1 + reps / 30);

export const sortedW = S => [...S.weights].sort((a, b) => a.date.localeCompare(b.date));

export const doneSets = ex => ex.sets.filter(s => s.done && num(s.reps) != null);

export const sessionVolume = s => s.exercises.reduce((a, e) => a + doneSets(e).reduce((b, x) => b + (num(x.kg) || 0) * num(x.reps), 0), 0);

export function exerciseHistory(S, name) {
  return S.sessions.filter(s => s.finished).sort((a, b) => a.date.localeCompare(b.date)).map(s => {
    const ex = s.exercises.find(e => e.name === name); if (!ex) return null; const ds = doneSets(ex); if (!ds.length) return null;
    return { date: s.date, best: Math.max(...ds.map(x => e1rm(num(x.kg) || 0, num(x.reps)))), top: Math.max(...ds.map(x => num(x.kg) || 0)), vol: ds.reduce((a, x) => a + (num(x.kg) || 0) * num(x.reps), 0), sets: ds };
  }).filter(Boolean);
}

export const allExerciseNames = S => { const m = new Set(); DATA.templates.forEach(t => t.exercises.forEach(e => m.add(e.name))); S.routines.forEach(r => r.exercises.forEach(e => m.add(e.name))); S.sessions.forEach(s => s.exercises.forEach(e => m.add(e.name))); return [...m].sort(); };
