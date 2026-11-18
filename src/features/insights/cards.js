// Cards that turn logged data into calm suggestions: "Cómo estoy hoy", adaptive calories, patterns, weekly review.
// Every one of them only SUGGESTS; nothing changes until the user taps the button.
import { adaptiveSuggestion, applyAdaptive, snoozeAdaptive } from '../../domain/adaptive.js';
import { findPatterns } from '../../domain/patterns.js';
import { readiness } from '../../domain/readiness.js';
import { habitStrength, streakWithGrace } from '../../domain/streak.js';
import { weeklyDue, weeklyReview } from '../../domain/weekly.js';
import { weeklySpending } from '../../domain/finance.js';
import { todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { esc } from '../../lib/utils.js';
import { S, save } from '../../state/store.js';
import { ACT } from '../../ui/actions.js';
import { ic } from '../../ui/icons.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

const prefs = () => S.prefs || (S.prefs = {});
const LV = { suave: [1, 'Suave'], normal: [2, 'Normal'], 'a fondo': [3, 'A fondo'] };

/* ---------- Cómo estoy hoy ---------- */
export function readinessCard() {
  const r = readiness(S, todayKey()); if (!r || r.hidden) return '';
  const [n, word] = LV[r.level];
  return `<div class="card ready lv-${n}" data-key="ready"><div class="row between"><div class="eyebrow">Cómo estoy hoy</div><span class="pill">${word}</span></div>
    <div class="meter u-mt-12" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}" style="--d:${i * 90}ms"></i>`).join('')}</div>
    <p class="u-mt-12">${esc(r.text)}</p>
    <div class="tiny muted u-mt-8">${r.facts.length ? esc(r.facts.join(' · ')) + ' · ' : ''}Para dormir ${r.target} h, acostate a las <b>${r.bedtime}</b> (te levantás a las ${r.wake}).</div>
    <div class="row u-mt-12"><button class="btn ghost sm" data-act="ready-wake">Cambiar hora de despertar</button><button class="btn ghost sm" data-act="ready-hide">Ocultar</button></div></div>`;
}
ACT['ready-hide'] = () => { prefs().hideReadiness = true; save(); toast('La podés volver a mostrar desde Perfil'); render(true); };
ACT['ready-show'] = () => { delete prefs().hideReadiness; save(); render(true); };
ACT['ready-wake'] = () => openSheet(`<h2 class="h2 u-mb-6">Hora de despertar</h2><p class="muted small u-mb-14">La uso para sugerirte a qué hora acostarte.</p><div class="field"><input type="time" id="rw-t" value="${prefs().wake || '07:00'}"></div><button class="btn block" data-act="ready-wake-save">Guardar</button>`);
ACT['ready-wake-save'] = () => { prefs().wake = $('#rw-t').value || '07:00'; save(); closeSheet(); toast('Guardado'); render(true); };

/* ---------- meta de calorías adaptativa ---------- */
export function adaptiveCard() {
  const a = adaptiveSuggestion(S, todayKey()); if (a.status !== 'adjust') return '';
  return `<div class="card sug" data-key="adaptive"><div class="eyebrow">Sugerencia · meta de calorías</div><div class="row between u-mt-8"><div class="num u-fs-30">${a.delta > 0 ? '+' : '−'}${Math.abs(a.delta)} <span class="muted small">kcal</span></div><div class="tiny muted u-ta-right">${a.current} → ${a.next}</div></div>
    <p class="small u-mt-8">${esc(a.text)}</p><div class="tiny muted u-mt-6">Ajusto también los carbohidratos; proteína y grasa quedan igual.</div>
    <div class="row u-mt-12"><button class="btn sm grow" data-act="adapt-apply">Aplicar</button><button class="btn ghost sm grow" data-act="adapt-snooze">Ahora no</button></div></div>`;
}
ACT['adapt-apply'] = () => { const a = adaptiveSuggestion(S, todayKey()); if (a.status !== 'adjust') return; applyAdaptive(S, a, todayKey()); save(); toast(`Meta: ${a.next} kcal`); render(true); };
ACT['adapt-snooze'] = () => { snoozeAdaptive(S, todayKey()); save(); toast('Te lo vuelvo a mostrar en una semana'); render(true); };

/* ---------- patrones ---------- */
export const patternsList = () => findPatterns(S, todayKey());
export function patternsBlock(title = 'Lo que se nota en tus datos') {
  const f = patternsList();
  return `<div class="card"><h2 class="h2 u-mb-8">${title}</h2>${f.length ? f.map(x => `<p class="small u-mb-8" data-key="pt-${x.id}">${ic('spark', 14)} ${esc(x.text)}</p>`).join('') : '<p class="small muted">Cuando tengas unos 8 días de cierres con cada situación (por ejemplo, días con buen y con poco sueño), acá van a aparecer tus patrones. Por ahora no hay datos suficientes y prefiero no inventar.</p>'}
    <p class="tiny muted u-mt-8">Son coincidencias en tus propios registros, no causas ni consejo médico.</p></div>`;
}

/* ---------- resumen semanal ---------- */
export function weeklyCard() {
  const t = todayKey(); if (!weeklyDue(S, t)) return '';
  const r = weeklyReview(S, t); if (!r) return '';
  const money = weeklySpending(S, r.end), adj = r.adjust;
  return `<div class="card sug" data-key="weekly"><div class="eyebrow">Resumen de la semana</div>
    <div class="grid2 u-mt-10"><div><div class="tiny muted">Lo mejor</div><b>${r.best ? esc(r.best.title) : '–'}</b>${r.best ? `<span class="tiny muted"> ${r.best.pct} %</span>` : ''}</div>
    <div><div class="tiny muted">Lo que más se movió</div><b>${r.worst ? esc(r.worst.title) : '–'}</b>${r.worst ? `<span class="tiny muted"> ${r.worst.pct} %</span>` : ''}</div></div>
    <div class="tiny muted u-mt-8">Entrenaste ${r.trained} de ${r.goalT} días · ${r.consistency} de ${r.days} días constantes</div>
    ${money ? `<p class="small u-mt-8">${esc(money.text)}</p>` : ''}
    <div class="hr"></div><div class="eyebrow">Un solo ajuste para la próxima</div><p class="u-mt-6">${esc(adj.text)}</p>
    <div class="row u-mt-12">${adj.fix ? `<button class="btn sm grow" data-act="weekly-fix">${adj.fix.label}</button>` : ''}<button class="btn ${adj.fix ? 'ghost' : ''} sm grow" data-act="weekly-done">Listo</button></div></div>`;
}
ACT['weekly-done'] = () => { const r = weeklyReview(S, todayKey()); prefs().weeklySeen = r ? r.end : todayKey(); save(); render(true); };
ACT['weekly-fix'] = () => {
  const r = weeklyReview(S, todayKey()), fix = r && r.adjust && r.adjust.fix; if (!fix) return;
  if (fix.kind === 'kcal') { const a = adaptiveSuggestion(S, todayKey()); if (a.status === 'adjust') applyAdaptive(S, a, todayKey()); }
  prefs().weeklySeen = r.end; save(); toast('Listo, aplicado'); render(true);
};

/* ---------- racha indulgente + fuerza del hábito ---------- */
export const graceOn = () => prefs().grace !== false;
export function habitStat(E, h, k = todayKey()) {
  const g = streakWithGrace(d => E.isDone(h, d), k, { grace: graceOn(), startKey: E.startKey });
  return { streak: g.streak, forgiven: g.forgiven, strength: habitStrength(d => E.isDone(h, d), k, { startKey: E.startKey }) };
}
