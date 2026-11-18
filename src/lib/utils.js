export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const r1 = n => Math.round(n * 10) / 10;

export const r0 = n => Math.round(n);

export const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };

export const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
