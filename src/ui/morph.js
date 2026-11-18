// A small DOM differ. Given the live container and the HTML a view just produced, it updates only what
// changed (text, attributes, added/removed nodes) and keeps every other node — and therefore its focus,
// scroll position and running CSS transitions — exactly as it was.
//   • elements with data-key (or id) are matched by key, so lists can reorder/add/remove cleanly
//   • everything else is matched by position and tag
import { tweenNumber, flash } from './motion.js';

const styleMemo = new WeakMap();     // last inline style a template produced for an element (JS-driven styles survive)

export const parseHTML = html => { const t = document.createElement('template'); t.innerHTML = html; return t.content; };
export const rememberStyles = root => root.querySelectorAll('[style]').forEach(el => styleMemo.set(el, el.getAttribute('style')));

export function morph(root, html) { morphChildren(root, parseHTML(html)); }

const keyOf = n => n.nodeType === 1 ? (n.getAttribute('data-key') || n.id || null) : null;
const same = (a, b) => a.nodeType === b.nodeType && a.nodeName === b.nodeName && a.namespaceURI === b.namespaceURI;

function morphChildren(from, to) {
  const olds = Array.from(from.childNodes), keyed = new Map();
  for (const o of olds) { const k = keyOf(o); if (k != null) keyed.set(k, o); }
  const used = new Set(), result = []; let p = 0;
  for (const n of Array.from(to.childNodes)) {
    const k = keyOf(n); let m = null;
    if (k != null) { m = keyed.get(k); if (m && (used.has(m) || !same(m, n))) m = null; }
    else {
      while (p < olds.length && (used.has(olds[p]) || keyOf(olds[p]) != null)) p++;
      const c = olds[p]; if (c && same(c, n)) { m = c; p++; }
    }
    if (m) { used.add(m); morphNode(m, n); result.push(m); } else result.push(n);
  }
  let ref = from.firstChild;
  for (const node of result) { if (node === ref) ref = ref.nextSibling; else from.insertBefore(node, ref); }
  for (const o of olds) if (!used.has(o)) o.remove();
}

function morphNode(a, b) {
  if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue && !tweenNumber(a, b.nodeValue)) a.nodeValue = b.nodeValue; return; }
  syncAttrs(a, b);
  const tag = a.localName, focused = a === document.activeElement;
  if (tag === 'textarea') { if (!focused) a.value = b.value; return; }
  morphChildren(a, b);
  if (tag === 'select') { if (!focused) a.value = b.value; }
  else if (tag === 'input' && !focused) {
    if (a.type === 'checkbox' || a.type === 'radio') a.checked = b.hasAttribute('checked');
    else if (a.type !== 'file') { const v = b.getAttribute('value') ?? ''; if (a.value !== v) a.value = v; }
  }
}

function syncAttrs(a, b) {
  for (const at of Array.from(a.attributes)) {
    if (at.name === 'style' || b.hasAttribute(at.name)) continue;
    a.removeAttribute(at.name);
  }
  for (const at of Array.from(b.attributes)) {
    if (at.name === 'style') {                                   // only touch style when the template's own value changed
      if (styleMemo.get(a) !== at.value) { a.setAttribute('style', at.value); styleMemo.set(a, at.value); }
      continue;
    }
    if (at.name === 'class') {                                   // keep transient fx-* classes added by motion helpers
      const keep = Array.from(a.classList).filter(c => c.startsWith('fx-')).join(' ');
      const want = (at.value + ' ' + keep).trim();
      if (a.getAttribute('class') !== want && a.getAttribute('class') !== at.value) a.setAttribute('class', want);
      continue;
    }
    if (a.getAttribute(at.name) !== at.value) {
      a.setAttribute(at.name, at.value);
      if (at.name === 'd' || at.name === 'height') flash(a.closest('svg.chart'));
    }
  }
  if (!b.hasAttribute('style') && a.hasAttribute('style') && styleMemo.has(a)) { a.removeAttribute('style'); styleMemo.delete(a); }
}
