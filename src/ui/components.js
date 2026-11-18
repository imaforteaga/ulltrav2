import { clamp, esc, r0 } from '../lib/utils.js';
import { badge } from './icons.js';

/* ---- components ---- */
export function ring(p, size = 96, w = 9, mid = '') {
  const r = (size - w) / 2, c = 2 * Math.PI * r;
  return `<div class="ring" style="--size:${size}px"><svg width="${size}" height="${size}">
    <circle class="bg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${w}"/>
    <circle class="fg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${w}" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-p="${clamp(p)}" data-c="${c}"/></svg>
    <div class="mid">${mid}</div></div>`;
}

export const bar = p => `<div class="bar"><i data-w="${r0(clamp(p) * 100)}"></i></div>`;

export const chips = (opts, sel, attr) => `<div class="chips">${opts.map(([v, l]) => `<button class="chip tap ${v == sel ? 'on' : ''}" data-${attr}="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;

export const empty = (icon, t, m) => `<div class="empty">${badge(icon)}<div class="u-fw-500 u-c-text">${t}</div><div class="small u-mt-4">${m || ''}</div></div>`;

export const sectionTitle = (t, right = '') => `<div class="sec"><h2 class="h2">${t}</h2>${right}</div>`;
