import { ic } from './icons.js';

export const pageHead = (title, sub = '', right = '', back = false) => `<div class="head rise"><div class="row">${back ? `<button class="icon-btn tap" data-act="back" aria-label="Volver">${ic('left')}</button>` : ''}<div><h1 class="title">${title}</h1>${sub ? `<div class="muted small u-mt-4">${sub}</div>` : ''}</div></div>${right}</div>`;
