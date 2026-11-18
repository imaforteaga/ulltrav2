import { S } from '../state/store.js';

export function applyTheme() {
  const t = S.theme || 'auto';
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
}
