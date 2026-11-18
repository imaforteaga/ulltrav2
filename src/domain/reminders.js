import { waterOn } from './nutrition.js';
import { dk } from '../lib/dates.js';
import { hm } from '../lib/stats.js';
import { weeklyDue } from './weekly.js';

/* ---------- reminders ---------- */
const REM_DEF = {
  breakfast: { on: false, time: '10:30', label: 'Desayuno sin registrar' }, lunch: { on: true, time: '14:30', label: 'Almuerzo sin registrar' },
  eaten: { on: true, time: '17:00', label: 'Todavía no comiste / no anotaste nada' }, dinner: { on: true, time: '22:00', label: 'Cena sin registrar' },
  review: { on: true, time: '22:30', label: 'Cerrar el día (rendimiento y sentimiento)' }, water: { on: false, time: '18:00', label: 'Vas bajo en agua' },
  bible: { on: false, time: '21:30', label: 'Leer la Biblia' }, weekly: { on: false, time: '20:00', label: 'Resumen de la semana (domingo y lunes)' }
};

export const remCfg = S => { const r = S.reminders || {}, o = {}; for (const k in REM_DEF) o[k] = { ...REM_DEF[k], ...(r[k] || {}) }; return o; };

const REM_TXT = {
  breakfast: ['Desayuno sin registrar', 'Todavía no anotaste el desayuno.', 'add-meal', 'breakfast', 'Registrar'],
  lunch: ['¿Ya almorzaste?', 'No anotaste el almuerzo. Anotalo, o comé algo.', 'add-meal', 'lunch', 'Registrar'],
  eaten: ['Hoy todavía no anotaste comidas', '¿Comiste algo? Registralo para que el día cuente.', 'add-meal', 'snack', 'Registrar'],
  dinner: ['Cena sin registrar', 'Todavía no anotaste la cena.', 'add-meal', 'dinner', 'Registrar'],
  review: ['Cerrá tu día', 'Contá cómo rendiste, cómo te sentiste y qué pasó.', 'checkin', '', 'Cerrar día'],
  water: ['A tomar agua', 'Vas por debajo de tu meta de agua de hoy.', 'add-water-r', '', '+250 ml'],
  bible: ['Un momento para leer', 'Todavía no marcaste tu lectura de hoy.', 'go-bible', '', 'Abrir'],
  weekly: ['Tu resumen de la semana', 'Lo mejor, lo que más se movió y un solo ajuste.', 'go-weekly', '', 'Ver']
};

export function pendingReminders(S, now = new Date()) {
  const nm = now.getHours() * 60 + now.getMinutes(), k = dk(now), cfg = remCfg(S), out = [];
  const meals = new Set(S.foods.filter(f => f.date === k).map(f => f.meal)), anyFood = S.foods.some(f => f.date === k);
  const cond = { breakfast: !meals.has('breakfast'), lunch: !meals.has('lunch'), eaten: !anyFood, dinner: !meals.has('dinner'), review: !S.checkins[k], bible: !(S.habitLogs[k] || []).some(id => (S.habits.find(h => h.id === id) || {}).key === 'bible'), weekly: weeklyDue(S, k), water: waterOn(S, k) < .6 * (S.profile.water || 3000) };
  for (const key in cfg) { const c = cfg[key]; if (c.on && nm >= hm(c.time) && cond[key]) { const t = REM_TXT[key]; out.push({ key, mins: hm(c.time), title: t[0], body: t[1], act: t[2], meal: t[3], btn: t[4] }); } }
  const logged = S.supLogs[k] || [];
  S.supplements.filter(s => s.active !== false && s.remind !== false).forEach(s => {
    const time = s.time || '09:00';
    if (nm >= hm(time) && !logged.includes(s.id)) out.push({ key: 'supp-' + s.id, mins: hm(time), title: /creatin/i.test(s.name) ? 'Tomá tu creatina' : `Tomá ${s.name}`, body: s.dose ? `Dosis: ${s.dose}` : 'Marcá cuando la tomes.', act: 'supp-take', id: s.id, btn: 'Ya la tomé' });
  });
  return out.sort((a, b) => a.mins - b.mins);
}
