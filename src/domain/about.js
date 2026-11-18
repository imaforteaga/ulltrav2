// "Conocerme": a small bank of questions whose answers the app uses to give better suggestions.
// Pure: everything takes the state and the date as arguments.
import { lastDays } from '../lib/dates.js';
import { dayNutrition } from './nutrition.js';

export const REVIEW_DAYS = 60;            // an answer older than this is offered again ("¿sigue siendo así?")
const num = (...a) => a.map(String);
const mk = (id, cat, q, type, opts, why) => ({ id, cat, q, type, opts: opts || [], why });

export const CATS = { goals: 'Objetivos', train: 'Entrenamiento', food: 'Comida', sleep: 'Sueño y energía', mind: 'Mente y motivación', money: 'Plata', app: 'Sobre Ultra' };

export const QUESTIONS = [
  mk('foco', 'goals', '¿Qué querés mejorar primero?', 'one', [['fuerza', 'Fuerza'], ['estetica', 'Estética'], ['energia', 'Energía'], ['salud', 'Salud'], ['constancia', 'Constancia']], 'Para priorizar qué te muestro primero.'),
  mk('meta_12m', 'goals', '¿Cómo te imaginás dentro de 12 meses si todo sale bien?', 'text', 0, 'Para recordártelo cuando flaquees.'),
  mk('por_que', 'goals', '¿Por qué es importante para vos?', 'text', 0, 'Es lo que te va a sostener en los días difíciles.'),
  mk('dias_real', 'train', '¿Cuántos días por semana podés entrenar de verdad?', 'one', num(2, 3, 4, 5, 6).map(v => [v, v]), 'Para que tu plan sea realista.'),
  mk('lugar', 'train', '¿Dónde entrenás?', 'one', [['gym', 'Gimnasio'], ['casa', 'En casa'], ['ambos', 'Ambos']], 'Para sugerir ejercicios que puedas hacer.'),
  mk('tiempo', 'train', '¿Cuánto tiempo tenés por sesión?', 'one', [['30', '30 min'], ['45', '45 min'], ['60', '60 min'], ['90', '90 min']], 'Para ajustar la duración.'),
  mk('lesion', 'train', '¿Tenés alguna molestia o lesión?', 'multi', [['hombro', 'Hombro'], ['espalda', 'Espalda'], ['rodilla', 'Rodilla'], ['muneca', 'Muñeca'], ['ninguna', 'Ninguna']], 'Para tenerlo presente al elegir ejercicios.'),
  mk('dificil', 'food', '¿Qué se te hace más difícil de la comida?', 'one', [['proteina', 'Llegar a la proteína'], ['horarios', 'Los horarios'], ['antojos', 'Los antojos'], ['cocinar', 'Cocinar'], ['afuera', 'Comer afuera']], 'Para enfocar los consejos.'),
  mk('restric', 'food', '¿Evitás algo al comer?', 'multi', [['lactosa', 'Lactosa'], ['gluten', 'Gluten'], ['carne', 'Carne'], ['ninguna', 'Nada']], 'Para no sugerirte lo que no comés.'),
  mk('sueno_pref', 'sleep', '¿Cuántas horas necesitás para sentirte bien?', 'one', num(6, 7, 8, 9).map(v => [v, v + ' h']), 'Para calibrar tu meta de sueño.'),
  mk('energia_tarde', 'sleep', '¿Cómo está tu energía a la tarde, en general? (1 = muy baja, 10 = excelente)', 'scale', 0, 'Para cruzarlo con tu sueño y tu comida.'),
  mk('estres', 'sleep', '¿Qué tan estresado/a estás últimamente? (1 = nada, 10 = muchísimo)', 'scale', 0, 'El estrés cambia cuánto conviene exigirte.'),
  mk('fe_hora', 'mind', '¿Cuándo preferís leer la Biblia?', 'one', [['manana', 'A la mañana'], ['tarde', 'A la tarde'], ['noche', 'A la noche'], ['libre', 'Sin horario']], 'Para ubicar el recordatorio.'),
  mk('motiva', 'mind', '¿Qué te motiva más?', 'multi', [['progreso', 'Ver mi progreso'], ['rachas', 'Las rachas'], ['logros', 'Los logros'], ['recordatorios', 'Recordatorios'], ['calma', 'Que no me insistan']], 'Para elegir cómo acompañarte.'),
  mk('plata_meta', 'money', '¿Qué querés lograr con tu plata?', 'one', [['ahorrar', 'Ahorrar'], ['ordenar', 'Ordenar gastos'], ['deudas', 'Salir de deudas'], ['invertir', 'Invertir']], 'Para que Finanzas te muestre lo que importa.'),
  mk('plata_estres', 'money', '¿Qué tanto te preocupa la plata? (1 = nada, 10 = muchísimo)', 'scale', 0, 'Para dosificar lo que te muestro.'),
  mk('recordatorios', 'app', '¿Te sirven los recordatorios?', 'one', [['si', 'Me ayudan'], ['pocos', 'Prefiero pocos'], ['no', 'Ninguno']], 'Para ajustar la cantidad.'),
  mk('desayuno', 'food', '¿Desayunás todos los días?', 'one', [['si', 'Sí'], ['a_veces', 'A veces'], ['no', 'Casi nunca']], 'Para saber si tiene sentido recordarte el desayuno.'),
  mk('cena_hora', 'food', '¿A qué hora cenás normalmente?', 'one', [['temprano', 'Antes de las 21'], ['normal', 'Entre 21 y 23'], ['tarde', 'Después de las 23']], 'Para ubicar el recordatorio de la cena y de dormir.'),
  mk('despertar', 'sleep', '¿A qué hora te levantás normalmente?', 'one', [['06:00', '6:00'], ['07:00', '7:00'], ['08:00', '8:00'], ['09:00', '9:00']], 'Para sugerirte a qué hora acostarte.'),
  mk('cansancio', 'sleep', '¿Cuándo sentís más cansancio en el día?', 'one', [['manana', 'A la mañana'], ['tarde', 'A la tarde'], ['noche', 'A la noche'], ['nunca', 'Casi nunca']], 'Para cruzarlo con tu sueño y tus comidas.'),
  mk('socializar', 'mind', '¿Entrenás mejor solo/a o acompañado/a?', 'one', [['solo', 'Solo/a'], ['acompanado', 'Acompañado/a'], ['igual', 'Me da igual']], 'Para no proponerte lo que no te sirve.'),
  mk('ahorro_meta', 'money', '¿Tenés algo puntual para ahorrar (viaje, equipo, fondo)?', 'text', 0, 'Para proponerte una meta de ahorro en Finanzas.'),
  mk('libre', 'app', '¿Qué le falta a Ultra para que la uses todos los días?', 'text', 0, 'Esto es oro: guía qué mejorar.'),
];
const byId = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
export const question = id => byId[id];

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
export const answerOf = (S, id) => (S.about || {})[id] && (S.about[id].v !== undefined) ? S.about[id] : null;
export const isDue = (S, id, today) => { const a = answerOf(S, id); return !!a && daysBetween(a.at, today) >= REVIEW_DAYS; };
const snoozed = (S, id, today) => ((S.about || {})[id] || {}).skip === today;

/** Unanswered questions first (in bank order), then answers older than REVIEW_DAYS (oldest first). Skipped-today ones wait. */
export function nextQuestions(S, today, n = 1) {
  const pend = QUESTIONS.filter(q => !answerOf(S, q.id) && !snoozed(S, q.id, today));
  const due = QUESTIONS.filter(q => isDue(S, q.id, today) && !snoozed(S, q.id, today)).sort((a, b) => answerOf(S, a.id).at.localeCompare(answerOf(S, b.id).at));
  return [...pend, ...due].slice(0, n);
}
export const progress = (S, today) => ({ total: QUESTIONS.length, answered: QUESTIONS.filter(q => answerOf(S, q.id)).length, due: QUESTIONS.filter(q => isDue(S, q.id, today)).length, answeredToday: QUESTIONS.some(q => (answerOf(S, q.id) || {}).at === today) });
export const labelOf = (q, v) => q.type === 'multi' ? [].concat(v).map(x => (q.opts.find(o => o[0] === x) || [x, x])[1]).join(', ') : q.type === 'one' ? (q.opts.find(o => o[0] === String(v)) || [v, v])[1] : String(v);

const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;

/** Suggestions that combine what you told me with what you logged. They are suggestions: nothing changes unless you tap. */
export const TONE = S => { const m = [].concat((answerOf(S, 'motiva') || {}).v ?? []); return m.includes('calma') ? 'calm' : 'normal'; };
export const BIBLE_TIME = { manana: '08:00', tarde: '16:00', noche: '21:30' };
const HOME_RE = /push.?up|pull.?up|plank|lunge|bodyweight|dip|burpee|flexion|plancha|zancada|dominada|fondos/i;
export const homeFriendly = name => HOME_RE.test(name);
export const exerciseBudget = mins => Math.max(3, Math.round(mins / 9));
const REM_OFF = ['breakfast', 'lunch', 'dinner', 'water'];

export function insights(S, today) {
  const out = [], A = id => (answerOf(S, id) || {}).v, P = S.profile || {}, prefs = S.prefs || {}, rems = S.reminders || {};
  const days14 = lastDays(14, today);
  const sleepAvg = avg(days14.map(k => S.sleep[k]).filter(Boolean));
  const protAvg = avg(days14.map(k => dayNutrition(S, k)).filter(n => n.n).map(n => n.p));
  const d = A('dias_real');
  if (d && +d !== P.trainingDays) out.push({ id: 'dias', title: 'Tus días de entrenamiento', text: `Me dijiste que podés entrenar ${d} días, pero tu perfil dice ${P.trainingDays}.`, fix: { label: `Usar ${d} días`, target: 'profile', key: 'trainingDays', value: +d } });
  const h = A('sueno_pref');
  if (h && +h !== P.sleepTarget) out.push({ id: 'sueno', title: 'Tu meta de sueño', text: `Necesitás ${h} h para sentirte bien y tu meta es ${P.sleepTarget} h.`, fix: { label: `Usar ${h} h`, target: 'profile', key: 'sleepTarget', value: +h } });
  const need = +(h || P.sleepTarget || 8);
  if (+A('energia_tarde') <= 4 && sleepAvg && sleepAvg < need - 0.5) out.push({ id: 'energia', title: 'Energía y sueño', text: `Tu energía a la tarde es baja y en las últimas 2 semanas dormiste ${sleepAvg.toFixed(1)} h en promedio (necesitás ${need}). Probá adelantar la hora de dormir antes de tocar la comida.` });
  if (A('dificil') === 'proteina' && protAvg && P.protein && protAvg < P.protein * 0.8) out.push({ id: 'proteina', title: 'Proteína', text: `Te cuesta la proteína y estás en ${Math.round(protAvg)} g de ${P.protein} g. Sumar una fuente en cada comida (huevos, yogur, atún) suele ser lo más fácil.` });
  const les = [].concat(A('lesion') || []).filter(x => x !== 'ninguna');
  if (les.length) out.push({ id: 'lesion', title: 'Molestias anotadas', text: `Tengo anotado: ${les.join(', ')}. Si un ejercicio te duele, cambialo por otro; no es una indicación médica.` });
  /* Each answer that used to be only stored now becomes a suggestion you can accept (nothing changes by itself). */
  const rec = A('recordatorios'), onCount = REM_OFF.filter(k => (rems[k] || {}).on).length;
  if (rec === 'no' && onCount) out.push({ id: 'rec-no', title: 'Menos recordatorios', text: 'Dijiste que no te sirven los recordatorios, pero hay algunos prendidos.', fix: { label: 'Apagarlos', target: 'reminders', value: Object.fromEntries(REM_OFF.map(k => [k, { on: false }])) } });
  else if (rec === 'pocos' && onCount > 2) out.push({ id: 'rec-pocos', title: 'Pocos recordatorios', text: 'Preferís pocos y hay varios prendidos. Dejaría solo el del almuerzo y el cierre del día.', fix: { label: 'Dejar solo esos', target: 'reminders', value: { breakfast: { on: false }, dinner: { on: false }, water: { on: false } } } });
  if ([].concat(A('motiva') || []).includes('calma') && !prefs.calm) out.push({ id: 'calma', title: 'Tono más calmado', text: 'Elegiste que no te insistan: puedo sacar las frases de empuje y dejar solo lo esencial.', fix: { label: 'Tono calmado', target: 'prefs', key: 'calm', value: true } });
  if (A('lugar') === 'casa' && !prefs.homeOnly) out.push({ id: 'lugar', title: 'Ejercicios para casa', text: 'Entrenás en casa: al agregar ejercicios puedo mostrarte primero los que no necesitan máquinas.', fix: { label: 'Filtrar para casa', target: 'prefs', key: 'homeOnly', value: true } });
  const tm = +A('tiempo'); if (tm && prefs.timeCap !== tm) out.push({ id: 'tiempo', title: 'Duración de tus sesiones', text: `Tenés ${tm} min por sesión: unos ${exerciseBudget(tm)} ejercicios entran cómodos. Puedo avisarte si una rutina se pasa.`, fix: { label: `Usar ${tm} min`, target: 'prefs', key: 'timeCap', value: tm } });
  const fe = A('fe_hora'); if (BIBLE_TIME[fe] && (rems.bible || {}).time !== BIBLE_TIME[fe]) out.push({ id: 'fe', title: 'Recordatorio de la Biblia', text: `Preferís leer ${({ manana: 'a la mañana', tarde: 'a la tarde', noche: 'a la noche' })[fe]}. Puedo recordártelo a las ${BIBLE_TIME[fe]}.`, fix: { label: `Recordar ${BIBLE_TIME[fe]}`, target: 'reminders', value: { bible: { on: true, time: BIBLE_TIME[fe] } } } });
  const wk = A('despertar'); if (wk && prefs.wake !== wk) out.push({ id: 'despertar', title: 'Hora de acostarte', text: `Te levantás a las ${wk}: lo uso para sugerirte a qué hora dormir.`, fix: { label: `Usar ${wk}`, target: 'prefs', key: 'wake', value: wk } });
  return out;
}

/** Applies an insight's `fix` to the state. Called only after the user taps the button. */
export function applyFix(S, fix) {
  if (!fix) return;
  if (fix.target === 'reminders') { S.reminders = S.reminders || {}; for (const [k, v] of Object.entries(fix.value)) S.reminders[k] = { ...(S.reminders[k] || {}), ...v }; }
  else if (fix.target === 'prefs') { S.prefs = S.prefs || {}; S.prefs[fix.key] = fix.value; }
  else if (fix.target === 'kcal') S.profile.kcal = fix.value;
  else S.profile[fix.key] = fix.value;
}
