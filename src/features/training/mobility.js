import { DATA } from '../../data/content.js';
import { MCAT } from '../../domain/constants.js';
import { makeEngine } from '../../domain/score-engine.js';
import { fmtDur, lastDays, todayKey } from '../../lib/dates.js';
import { $ } from '../../lib/dom.js';
import { esc, num, r0, uid } from '../../lib/utils.js';
import { beep } from '../../services/audio.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { celebrate } from '../../ui/celebrate.js';
import { chips, ring } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { animateIn } from '../../ui/motion.js';
import { render } from '../../ui/render.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- mobility ---------- */
const allMob = () => [...DATA.mobility.map(m => ({ ...m, builtIn: true })), ...S.customMob];

export function viewMobility() {
  const E = makeEngine(S), wk = lastDays(7).reduce((a, k) => a + (E.mobBy[k] || 0), 0), cat = U.mobCat || 'all';
  const list = allMob().filter(m => cat === 'all' || m.cat === cat);
  return `<div class="card row between"><div><div class="eyebrow">Esta semana</div><div class="num u-fs-28">${wk}<span class="muted small"> / ${S.profile.mobilityTarget || 4} sesiones</span></div></div><button class="btn soft sm" data-act="mob-manual">Registrar manual</button></div>
  ${chips([['all', 'Todas'], ...Object.entries(MCAT)], cat, 'mcat')}
  <div class="u-mt-8">${list.map(m => { const secs = m.steps.reduce((a, s) => a + s[1], 0); return `<div class="card tap u-cur-pointer" data-act="mob-open" data-id="${m.id}"><div class="row between"><div class="grow"><b>${esc(m.name)}</b><div class="tiny muted">${MCAT[m.cat]} · ${m.steps.length} pasos · ${r0(secs / 60)} min</div></div><span class="icon-btn">${ic('play')}</span></div></div>`; }).join('')}</div>`;
}

document.addEventListener('click', e => { const c = e.target.closest('[data-mcat]'); if (c) { U.mobCat = c.dataset.mcat; render(true); } });

ACT['mob-manual'] = () => openSheet(`<h2 class="h2 u-mb-14">Registrar movilidad</h2><div class="field"><label>Minutos</label><input type="number" id="mm-m" value="10"></div><div class="field"><label>Nota (opcional)</label><input type="text" id="mm-n" placeholder="Ej: cadera y espalda"></div><button class="btn block" data-act="mob-manual-save">Guardar</button>`);

ACT['mob-manual-save'] = () => { S.mobSessions.push({ id: uid(), date: todayKey(), name: $('#mm-n').value.trim() || 'Movilidad', seconds: (num($('#mm-m').value) || 10) * 60 }); save(); closeSheet(); toast('Sesión registrada'); render(true); };

let mobTimer = null;

ACT['mob-open'] = el => { const m = allMob().find(x => x.id === el.dataset.id); openSheet(`<h2 class="h2">${esc(m.name)}</h2><div class="muted small u-m-4-0-14">${MCAT[m.cat]}</div><div class="list">${m.steps.map((s, i) => `<div class="row u-ai-flex-start"><span class="muted small u-w-20">${i + 1}</span><div class="grow"><b>${esc(s[0])}</b><div class="small muted">${esc(s[2])}</div></div><span class="small muted">${fmtDur(s[1])}</span></div>`).join('')}</div><button class="btn block u-mt-16" data-act="mob-play" data-id="${m.id}">Empezar</button>`); };

ACT['mob-play'] = el => {
  const m = allMob().find(x => x.id === el.dataset.id); let i = 0, left = m.steps[0][1], paused = false, total = 0;
  const draw = () => { const s = m.steps[i]; $('#mp').innerHTML = `<div class="eyebrow">Paso ${i + 1} de ${m.steps.length}</div><h2 class="title u-m-8-0-6 u-fs-26">${esc(s[0])}</h2><p class="muted u-minh-44">${esc(s[2])}</p>
    <div class="u-d-grid u-place-items-center u-m-14-0">${ring(1 - left / s[1], 190, 10, `<div class="num u-fs-48" id="mp-t">${fmtDur(left)}</div>`)}</div>
    <div class="row u-jc-center"><button class="btn ghost" data-act="mp-pause">${paused ? 'Seguir' : 'Pausa'}</button><button class="btn" data-act="mp-skip">Siguiente</button></div>`; animateIn($('#mp')); };
  openSheet(`<div id="mp"></div>`, () => { draw(); });
  const finish = () => { clearInterval(mobTimer); S.mobSessions.push({ id: uid(), date: todayKey(), name: m.name, seconds: total }); save(); closeSheet(); celebrate('Sesión completa', m.name); render(true); };
  const next = () => { i++; if (i >= m.steps.length) return finish(); left = m.steps[i][1]; beep(); draw(); };
  clearInterval(mobTimer);
  mobTimer = setInterval(() => { if (!$('#mp')) return clearInterval(mobTimer); if (paused) return; left--; total++; if (left <= 0) return next(); const t = $('#mp-t'); if (t) { t.textContent = fmtDur(left); const f = $('#mp .fg'); if (f) f.style.strokeDashoffset = (+f.dataset.c) * (left / m.steps[i][1]); } }, 1000);
  ACT['mp-pause'] = b => { paused = !paused; b.textContent = paused ? 'Seguir' : 'Pausa'; }; ACT['mp-skip'] = () => { total += left; next(); };
};
