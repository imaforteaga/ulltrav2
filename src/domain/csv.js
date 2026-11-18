// CSV export (generated in the browser; nothing is sent anywhere). UTF-8 with BOM so Excel reads accents.
import { sortedW, doneSets } from './training.js';
import { fin } from './finance.js';
import { num } from '../lib/utils.js';

const cell = v => {
  if (v == null) return '';
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s) && isNaN(Number(s))) s = "'" + s;       // spreadsheet formula injection
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCSV = (header, rows) => '﻿' + [header, ...rows].map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
const r2 = n => Math.round((+n || 0) * 100) / 100;

export const weightsCSV = S => toCSV(['fecha', 'peso_kg'], sortedW(S).map(w => [w.date, w.kg]));

export const foodsCSV = S => toCSV(['fecha', 'comida', 'alimento', 'cantidad', 'kcal', 'proteina_g', 'carbohidratos_g', 'grasa_g'],
  [...S.foods].sort((a, b) => a.date.localeCompare(b.date)).map(f => [f.date, f.meal, f.name, f.qty || '', r2(f.kcal), r2(f.p), r2(f.c), r2(f.f)]));

export const sessionsCSV = S => toCSV(['fecha', 'sesion', 'ejercicio', 'serie', 'kg', 'reps'],
  S.sessions.filter(s => s.finished).sort((a, b) => a.date.localeCompare(b.date)).flatMap(s => s.exercises.flatMap(e => doneSets(e).map((x, i) => [s.date, s.name, e.name, i + 1, num(x.kg) ?? '', num(x.reps) ?? '']))));

export const financeCSV = S => toCSV(['fecha', 'tipo', 'categoria', 'monto', 'nota'],
  [...fin(S).tx].sort((a, b) => a.date.localeCompare(b.date)).map(t => [t.date, t.type === 'in' ? 'ingreso' : 'gasto', t.cat, t.amount, t.note || '']));

export const answersCSV = (S, questions) => toCSV(['pregunta', 'respuesta', 'fecha'],
  questions.filter(q => S.about && S.about[q.id] && S.about[q.id].v !== undefined).map(q => [q.q, [].concat(S.about[q.id].v).join(' | '), S.about[q.id].at]));

export const CSV_SETS = { pesos: ['Pesos', weightsCSV], comidas: ['Comidas', foodsCSV], sesiones: ['Sesiones de entreno', sessionsCSV], finanzas: ['Finanzas', financeCSV] };
