// Motion helpers. All the numbers (durations, easings, stagger) live in styles/tokens.css as CSS
// variables; JS reads them from there so the two can never drift apart.
//
// Rule of thumb used across the app:
//   • entrances (stagger, view transition) → only when the route changes
//   • data changes → transitions on the elements that already exist (rings, bars, numbers, FLIP lists)
//   • only `transform` and `opacity` are animated, except rings/line-draws (SVG stroke-dashoffset)
import { $$ } from '../lib/dom.js';

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const cssMs = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v); if (isNaN(n)) return fallback;
  return /ms$/.test(v) ? n : n * 1000;
};
const cssEase = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** Sets rings and bars to their final values. Elements that already exist transition from where they were. */
export function animateIn(root = document) {
  const entering = root.classList && root.classList.contains('anim');
  const apply = () => {
    $$('.ring .fg', root).forEach(e => {
      e.style.strokeDashoffset = (+e.dataset.c) * (1 - +e.dataset.p);
      const ring = e.closest('.ring'); if (ring) ring.classList.toggle('full', +e.dataset.p >= .999);    // one-time halo when a goal is reached
    });
    $$('.bar>i[data-w]', root).forEach(e => { e.style.setProperty('--p', +e.dataset.w / 100); e.style.transform = `translateX(${+e.dataset.w - 100}%)`; });
  };
  requestAnimationFrame(() => requestAnimationFrame(() => { apply(); if (entering) countUp(root); }));
}

/** On arrival, plain numbers inside `.num` count up from zero (navigation only; data changes use tweenNumber). */
const PLAIN = /^-?\d+(\.\d+)?$/;
export function countUp(root) {
  if (reduced()) return;
  $$('.num', root).forEach((el, i) => {
    const node = el.firstChild; if (!node || node.nodeType !== 3 || !PLAIN.test(node.nodeValue.trim())) return;
    const target = node.nodeValue, to = parseFloat(target), dec = (target.split('.')[1] || '').length;
    if (!to || Math.abs(to) > 99999) return;
    const dur = 650 + Math.min(i, 6) * 40, t0 = performance.now() + Math.min(i, 8) * 30; node.nodeValue = (0).toFixed(dec);
    const step = now => { const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3); node.nodeValue = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); else node.nodeValue = target; };
    requestAnimationFrame(step);
  });
}

/** Pop + halo on a check that was just turned on. Watches class changes only, so first paint and navigation never trigger it. */
export function watchChecks(root) {
  if (!root || root.__wc) return; root.__wc = true;
  new MutationObserver(list => list.forEach(m => {
    const el = m.target; if (!el.classList || !el.classList.contains('check') || !el.classList.contains('on') || /(^| )on( |$)/.test(m.oldValue || '') || reduced()) return;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 700);
  })).observe(root, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
}

/** Wraps a DOM swap in a View Transition when the browser has them (Safari 18+, Chrome 111+); otherwise runs it directly. */
export function viewTransition(update, dir = 'fwd') {
  if (!document.startViewTransition || reduced()) { update(); return; }
  const root = document.documentElement;
  root.dataset.dir = dir; root.classList.add('vt');
  const t = document.startViewTransition(() => { update(); });
  t.finished.finally(() => root.classList.remove('vt'));
}

/** Counts a number up/down instead of swapping it. Only for plain numbers ("1850", "2.4") with identical prefix/suffix. */
const NUM = /^(\D*?)(-?\d+(?:\.\d+)?)(\D*)$/;
export function tweenNumber(node, next) {
  if (reduced()) return false;
  const a = NUM.exec(node.nodeValue || ''), b = NUM.exec(next);
  if (!a || !b || a[1] !== b[1] || a[3] !== b[3]) return false;
  const from = parseFloat(a[2]), to = parseFloat(b[2]); if (from === to) return false;
  const dec = (b[2].split('.')[1] || '').length, dur = cssMs('--dur-base', 280) + 140, t0 = performance.now();
  cancelAnimationFrame(node.__tw);
  const step = now => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    node.nodeValue = b[1] + (from + (to - from) * e).toFixed(dec) + b[3];
    if (k < 1) node.__tw = requestAnimationFrame(step); else node.nodeValue = next;
  };
  node.__tw = requestAnimationFrame(step);
  return true;
}

/* ---------- FLIP for keyed lists ([data-key]) ---------- */
export function flipCapture(root) {
  const m = new Map();
  root.querySelectorAll('[data-key]').forEach(el => m.set(el.dataset.key, { el, rect: el.getBoundingClientRect() }));
  return m;
}
export function flipPlay(root, before) {
  if (reduced() || !before.size && !root.querySelector('[data-key]')) return;
  const dur = cssMs('--dur-base', 280) + 40, ease = cssEase('--ease-out', 'cubic-bezier(.22,.8,.24,1)');
  const seen = new Set();
  root.querySelectorAll('[data-key]').forEach(el => {
    seen.add(el.dataset.key);
    const prev = before.get(el.dataset.key);
    if (!prev) { if (before.size) enter(el); return; }
    const r = el.getBoundingClientRect(), dx = prev.rect.left - r.left, dy = prev.rect.top - r.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: dur, easing: ease });
  });
  before.forEach((v, key) => { if (!seen.has(key)) ghost(v, dur); });
}
function enter(el) {
  el.classList.add('fx-in');
  el.addEventListener('animationend', () => el.classList.remove('fx-in'), { once: true });
}
function ghost({ el, rect }, dur) {                 // a removed row fades out where it was while the others slide up
  const g = el.cloneNode(true);
  Object.assign(g.style, { position: 'fixed', left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px', margin: '0', pointerEvents: 'none', zIndex: 5 });
  document.body.appendChild(g);
  g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur * .6, easing: 'ease-out' }).onfinish = () => g.remove();
}

/** Brief fade on an element whose data was replaced (chart redrawn), so the change reads as a transition. */
export function flash(el) {
  if (!el || reduced()) return;
  el.classList.remove('fx-fade'); void el.getBoundingClientRect(); el.classList.add('fx-fade');
  el.addEventListener('animationend', () => el.classList.remove('fx-fade'), { once: true });
}
