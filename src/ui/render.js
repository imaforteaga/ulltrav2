// Router + renderer.
//   • navigating to another screen → full paint + staggered entrance (inside a View Transition when available)
//   • refreshing the same screen after a tap (render(true)) → the new HTML is *diffed* into the live DOM,
//     so rings/bars/numbers transition from their previous values and list rows FLIP into place
import { S } from '../state/store.js';
import { $, $$ } from '../lib/dom.js';
import { esc } from '../lib/utils.js';
import { ic } from './icons.js';
import { LOGO } from '../data/logo.js';
import { morph, rememberStyles } from './morph.js';
import { animateIn, viewTransition, flipCapture, flipPlay, watchChecks } from './motion.js';

let cfg = null;
/** { routes: {path: viewFn}, tabs: [[key,label,icon]], onboarding: viewFn, afterRender?: root => void } */
export const configureRouter = c => { cfg = c; };
export const route = () => location.hash.replace(/^#\/?/, '') || 'home';

let lastRoute = null, settleT = null;

function paint(main, html, { entrance = true } = {}) {
  main.className = entrance ? 'anim' : '';
  main.innerHTML = html;
  rememberStyles(main);
  clearTimeout(settleT);
  if (entrance) settleT = setTimeout(() => main.classList.remove('anim'), 1100);   // stagger is a navigation-only effect
}

function syncNav(nav, tab) {
  if (!nav.firstChild) {
    nav.innerHTML = `<div class="brand"><img src="${LOGO}" alt="" width="30" height="30">Ultra</div>` +
      cfg.tabs.map(([k, l, i]) => `<button data-act="go" data-v="#/${k}" aria-label="${l}">${ic(i)}<span>${l}</span></button>`).join('');
  }
  if (!nav.querySelector('.nav-ind')) nav.insertAdjacentHTML('afterbegin', '<i class="nav-ind" aria-hidden="true"></i>');
  $$('button[data-v]', nav).forEach(b => {
    const on = b.dataset.v === `#/${tab}`;
    b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  moveIndicator(nav);
}

/** Slides the highlight behind the active tab (transform only); the first placement is instant. */
function moveIndicator(nav) {
  const b = nav.querySelector('button.on'), ind = nav.querySelector('.nav-ind'); if (!b || !ind || nav.classList.contains('hide')) return;
  const set = () => { nav.style.setProperty('--ix', b.offsetLeft + 'px'); nav.style.setProperty('--iy', b.offsetTop + 'px'); nav.style.setProperty('--iw', b.offsetWidth + 'px'); nav.style.setProperty('--ih', b.offsetHeight + 'px'); };
  set(); if (!ind.classList.contains('ready')) requestAnimationFrame(() => requestAnimationFrame(() => ind.classList.add('ready')));
}
window.addEventListener('resize', () => { const n = document.getElementById('nav'); if (n && n.firstChild) { const i = n.querySelector('.nav-ind'); if (i) i.classList.remove('ready'); moveIndicator(n); } });

export function render(keep) {
  const main = $('#main'), nav = $('#nav'); watchChecks(main);
  if (!S.profile) {
    nav.classList.add('hide');
    if (keep && main.firstChild) { morph(main, cfg.onboarding()); animateIn(main); return; }   // same step: update in place (no re-entrance)
    paint(main, cfg.onboarding()); animateIn(main);
    return;
  }
  nav.classList.remove('hide');
  const r = cfg.routes[route()] ? route() : 'home', changed = r !== lastRoute, y = window.scrollY;
  const html = () => {
    let h; try { h = cfg.routes[r](); } catch (e) { console.error(e); h = `<div class="card"><b>Algo salió mal en esta pantalla.</b><p class="small muted">${esc(e.message)}</p></div>`; }
    return `<div class="wrap">${h}</div>`;
  };
  const tab = r.split('/')[0];

  if (keep && !changed) {                                  // same screen, data changed → diff, don't repaint
    const before = flipCapture(main);
    morph(main, html());
    syncNav(nav, tab);
    flipPlay(main, before);
    window.scrollTo(0, y);
    animateIn(main); cfg.afterRender?.(main);
    return;
  }
  const enter = () => {
    paint(main, html()); syncNav(nav, tab);
    if (changed) window.scrollTo(0, 0);
    animateIn(main); cfg.afterRender?.(main);
  };
  const first = lastRoute === null, prev = lastRoute; lastRoute = r;
  const depth = x => x.split('/').length, order = x => cfg.tabs.findIndex(t => t[0] === x.split('/')[0]);
  const dir = prev && (depth(r) < depth(prev) || (depth(r) === depth(prev) && order(r) < order(prev))) ? 'back' : 'fwd';
  if (changed && !first) viewTransition(enter, dir); else enter();
}
