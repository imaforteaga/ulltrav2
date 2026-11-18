import { pendingReminders, remCfg } from '../../domain/reminders.js';
import { todayKey } from '../../lib/dates.js';
import { $, $$ } from '../../lib/dom.js';
import { esc, uid } from '../../lib/utils.js';
import { beep } from '../../services/audio.js';
import { S, save } from '../../state/store.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { empty, sectionTitle } from '../../ui/components.js';
import { ic } from '../../ui/icons.js';
import { pageHead } from '../../ui/page.js';
import { render, route } from '../../ui/render.js';
import { toast } from '../../ui/toast.js';

const notifState = () => ('Notification' in window) ? Notification.permission : 'no';

function fireReminder(p) {
  remindToast(p); beep(); document.title = '● Ultra';
  try { if (notifState() === 'granted') {
    const o = { body: p.body, tag: p.key, icon: 'icon-192.png' };
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then(r => r ? r.showNotification('Ultra · ' + p.title, o) : new Notification('Ultra · ' + p.title, o)).catch(() => { });
    else new Notification('Ultra · ' + p.title, o);
  } } catch (e) { }
}

function remindToast(p) {
  $$('.rtoast').forEach(t => t.remove()); const t = document.createElement('div'); t.className = 'rtoast';
  t.innerHTML = `<div class="badge">${ic('flame')}</div><div class="grow"><b>${esc(p.title)}</b><div class="small muted">${esc(p.body)}</div></div><button class="btn sm" data-rt>${p.btn || 'Ver'}</button><button class="icon-btn tap u-bg-none" data-rx>${ic('x')}</button>`;
  t.onclick = e => { if (e.target.closest('[data-rt]')) { runPending(p); t.remove(); } else if (e.target.closest('[data-rx]')) t.remove(); };
  document.body.appendChild(t); setTimeout(() => t.remove(), 20000);
}

function runPending(p) {
  if (p.act === 'add-meal') { U.nutDate = todayKey(); ACT['add-meal']({ dataset: { meal: p.meal } }); }
  else if (p.act === 'checkin') ACT.checkin({ dataset: {} });
  else if (p.act === 'go-bible') location.hash = '#/home/bible';
  else if (p.act === 'go-weekly') location.hash = '#/home';
  else if (p.act === 'add-water-r') { S.water.push({ id: uid(), date: todayKey(), ml: 250 }); save(); toast('+250 ml'); render(true); }
  else if (p.act === 'supp-take') { const l = S.supLogs[todayKey()] || (S.supLogs[todayKey()] = []); if (!l.includes(p.id)) l.push(p.id); save(); toast('Registrado ✓'); render(true); }
}

let lastSig = '';

export function remTick() {
  if (!S.profile) return;
  const now = new Date(), nm = now.getHours() * 60 + now.getMinutes(), day = todayKey();
  if (!S.reminderFired || S.reminderFired.day !== day) S.reminderFired = { day, keys: {} };
  const f = S.reminderFired.keys, pend = pendingReminders(S, now); let dirty = false;
  pend.forEach(p => {
    const since = nm - p.mins;
    if (since >= 0 && since <= 120 && !f[p.key + '#1']) { f[p.key + '#1'] = 1; dirty = true; fireReminder(p); }
    else if (since >= 45 && since <= 180 && !f[p.key + '#2'] && f[p.key + '#1']) { f[p.key + '#2'] = 1; dirty = true; fireReminder(p); }
  });
  if (dirty) save();
  const sig = pend.map(p => p.key).join(',');
  if (sig !== lastSig) { lastSig = sig; if (route() === 'home' && !$('#sheet.open')) render(true); if (!sig) document.title = 'Ultra'; }
}

setInterval(remTick, 20000);

document.addEventListener('visibilitychange', () => { if (!document.hidden) { remTick(); document.title = 'Ultra'; } });

export function pendingCard() {
  const p = pendingReminders(S); if (!p.length) return '';
  return `<div class="card u-bc-accent"><div class="row between"><div class="eyebrow">Pendientes de hoy</div><span class="pill">${p.length}</span></div><div class="list u-mt-6">
    ${p.map((x, i) => `<div class="row"><div class="grow"><b>${esc(x.title)}</b><div class="tiny muted">${esc(x.body)}</div></div><button class="btn soft sm" data-act="run-pending" data-i="${i}">${x.btn}</button></div>`).join('')}</div></div>`;
}

ACT['run-pending'] = el => runPending(pendingReminders(S)[+el.dataset.i]);

ACT['add-water-r'] = () => runPending({ act: 'add-water-r' });

export function viewReminders() {
  const cfg = remCfg(S), st = notifState();
  const stTxt = st === 'granted' ? 'Activadas' : st === 'denied' ? 'Bloqueadas por el navegador' : st === 'no' ? 'No disponibles en este navegador / archivo' : 'Sin activar';
  return `${pageHead('Recordatorios', 'Para que no se te pase nada', '', true)}
  <div class="card"><div class="row between"><div><b>Avisos del sistema</b><div class="tiny muted">${stTxt}</div></div>${st === 'default' ? `<button class="btn sm" data-act="notif-ask">Activar</button>` : ''}<button class="btn ghost sm" data-act="notif-test">Probar</button></div>
    <p class="tiny muted u-mt-10">Los avisos salen <b>mientras Ultra esté abierta</b> (en una pestaña o como app, aunque esté en segundo plano). En iPhone el sistema suspende la app enseguida, así que ahí cuenta sobre todo la tarjeta de <b>Pendientes</b> que ves al abrirla. Los avisos con la app cerrada requieren la versión nativa. ${location.protocol === 'file:' ? 'Nota: al abrirla como archivo, Chrome puede bloquear los avisos del sistema; igual vas a ver el aviso dentro de la app y escuchar el sonido.' : ''}</p></div>
  ${sectionTitle('Comidas y día')}
  <div class="card"><div class="list">${Object.entries(cfg).map(([k, c]) => `<div class="row"><button class="check ${c.on ? 'on' : ''}" data-act="rem-toggle" data-k="${k}">${ic('check')}</button><div class="grow"><div class="u-fw-450">${c.label}</div></div><input type="time" class="u-w-112" data-rem-time="${k}" value="${c.time}"></div>`).join('')}</div></div>
  ${sectionTitle('Suplementos')}
  <div class="card">${S.supplements.length ? `<div class="list">${S.supplements.map(s => `<div class="row"><button class="check ${s.remind !== false ? 'on' : ''}" data-act="supp-rem" data-id="${s.id}">${ic('check')}</button><div class="grow"><div class="u-fw-450">${esc(s.name)}</div><div class="tiny muted">${esc(s.dose || '')}</div></div><input type="time" class="u-w-112" data-supp-time="${s.id}" value="${s.time || '09:00'}"></div>`).join('')}</div>` : empty('pill', 'Sin suplementos', 'Agregalos en Hábitos y suplementos.')}</div>
  <p class="tiny muted">Si algo sigue pendiente, el aviso se repite una vez a los 45 minutos.</p>`;
}

document.addEventListener('change', e => { const t = e.target;
  if (t.dataset && t.dataset.remTime) { S.reminders = S.reminders || {}; S.reminders[t.dataset.remTime] = { ...(S.reminders[t.dataset.remTime] || {}), time: t.value }; save(); toast('Hora guardada'); }
  if (t.dataset && t.dataset.suppTime) { S.supplements.find(s => s.id === t.dataset.suppTime).time = t.value; save(); toast('Hora guardada'); } });

ACT['rem-toggle'] = el => { const k = el.dataset.k, c = remCfg(S)[k]; S.reminders = S.reminders || {}; S.reminders[k] = { ...(S.reminders[k] || {}), on: !c.on }; save(); render(true); };

ACT['supp-rem'] = el => { const s = S.supplements.find(x => x.id === el.dataset.id); s.remind = s.remind === false; save(); render(true); };

ACT['notif-ask'] = async () => { try { const r = await Notification.requestPermission(); toast(r === 'granted' ? 'Avisos activados' : 'El navegador no los permitió'); } catch (e) { toast('Este navegador no permite avisos desde un archivo'); } render(true); };

ACT['notif-test'] = () => fireReminder({ key: 'test', title: 'Así se ve un aviso', body: 'Si lo ves, los recordatorios funcionan.', act: '', btn: 'Ok' });

ACT['supp-take'] = el => runPending({ act: 'supp-take', id: el.dataset.id });
