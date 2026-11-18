// Bottom sheet. Phone layout: slides up with a spring curve and can be dragged down to dismiss
// (grab handle, or anywhere on the panel while it is scrolled to the top). ≥900px it is a centered modal.
import { $ } from '../lib/dom.js';
import { morph } from './morph.js';
import { reduced } from './motion.js';

let closeT = null;
const closeHooks = new Set();
/** Run something whenever the sheet closes (e.g. stop the camera). */
export const onSheetClose = fn => { closeHooks.add(fn); };
const isDesktop = () => window.matchMedia('(min-width:900px)').matches;

export function openSheet(html, mount) {
  const sh = $('#sheet'); clearTimeout(closeT);
  const already = sh.classList.contains('open') && !sh.classList.contains('closing');
  sh.classList.remove('closing');
  if (already) {                         // swap content in place: keeps scroll, focus and the open animation untouched
    const panel = $('.panel', sh);
    panel.style.transform = ''; sh.querySelector('.scrim').style.opacity = '';
    morph(panel, `<div class="grab"></div>${html}`);
  } else {
    sh.innerHTML = `<div class="scrim" data-close></div><div class="panel" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
    sh.classList.add('open');
    attachDrag(sh);
  }
  if (mount) mount($('.panel', sh));
}

export function closeSheet() {
  const sh = $('#sheet'); if (!sh.classList.contains('open') || sh.classList.contains('closing')) return;
  closeHooks.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  const panel = $('.panel', sh), scrim = $('.scrim', sh);
  if (panel) { panel.style.transition = ''; panel.style.transform = ''; }
  if (scrim) scrim.style.opacity = '';
  sh.classList.add('closing'); clearTimeout(closeT);
  closeT = setTimeout(() => { sh.classList.remove('open', 'closing'); sh.innerHTML = ''; }, reduced() ? 0 : 280);
}

function attachDrag(sh) {
  const panel = $('.panel', sh), scrim = $('.scrim', sh);
  let y0 = 0, dy = 0, lastY = 0, lastT = 0, vy = 0, dragging = false, armed = false, grab = false;

  const begin = (y, fromGrab) => {
    if (isDesktop()) return;
    armed = true; dragging = false; grab = fromGrab; y0 = lastY = y; lastT = performance.now(); dy = 0; vy = 0;
  };
  const move = (y, e) => {
    if (!armed) return;
    const d = y - y0;
    if (!dragging) {
      if (d > 6 && (grab || panel.scrollTop <= 0)) { dragging = true; panel.style.transition = 'none'; }
      else if (d < -6 || (!grab && panel.scrollTop > 0)) { armed = false; return; }
      else return;
    }
    if (e.cancelable) e.preventDefault();
    const now = performance.now(); vy = (y - lastY) / Math.max(1, now - lastT); lastY = y; lastT = now;
    dy = Math.max(0, d);
    panel.style.transform = `translateY(${dy}px)`;
    scrim.style.opacity = String(Math.max(0, 1 - dy / (panel.offsetHeight * .9)));
  };
  const end = () => {
    if (!armed) return; armed = false;
    if (!dragging) return; dragging = false;
    if (dy > Math.min(140, panel.offsetHeight * .3) || vy > .55) {      // dismissed: continue the gesture, don't restart it
      panel.style.transition = 'transform var(--dur-base) var(--ease-in)'; panel.style.transform = 'translateY(100%)';
      scrim.style.transition = 'opacity var(--dur-base) linear'; scrim.style.opacity = '0';
      setTimeout(() => { sh.classList.add('closing'); closeSheetNow(sh); }, 230);
    } else {                                                             // not far enough: spring back
      panel.style.transition = 'transform var(--dur-slow) var(--ease-spring)'; panel.style.transform = '';
      scrim.style.opacity = '';
    }
  };

  panel.addEventListener('touchstart', e => begin(e.touches[0].clientY, !!e.target.closest('.grab')), { passive: true });
  panel.addEventListener('touchmove', e => move(e.touches[0].clientY, e), { passive: false });
  panel.addEventListener('touchend', end); panel.addEventListener('touchcancel', end);
  panel.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.target.closest('.grab')) { panel.setPointerCapture(e.pointerId); begin(e.clientY, true); } });
  panel.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') move(e.clientY, e); });
  panel.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') end(); });
}

function closeSheetNow(sh) {
  closeHooks.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  sh.classList.remove('open', 'closing'); sh.innerHTML = '';
}
