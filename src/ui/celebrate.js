import { ic } from './icons.js';
import { esc } from '../lib/utils.js';

export function celebrate(title, sub) {
  const d = document.createElement('div'); d.className = 'celebrate';
  d.setAttribute('role', 'dialog');
  d.innerHTML = `<div class="box"><div class="badge">${ic('check')}</div><div class="eyebrow">Logro</div><h2 class="h2 u-m-6-0">${esc(title)}</h2><p class="muted small">${esc(sub || '')}</p><button class="btn sm u-mt-18">Continuar</button></div>`;
  d.onclick = e => {
    if (e.target !== d && !e.target.closest('button')) return;
    d.classList.add('out'); setTimeout(() => d.remove(), 240);
  };
  document.body.appendChild(d);
}
