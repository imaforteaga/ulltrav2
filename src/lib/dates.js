export const pad = n => String(n).padStart(2, '0');

export const dk = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const pk = k => new Date(k + 'T00:00:00');

export const todayKey = () => dk();

export const addDays = (k, n) => { const d = pk(k); d.setDate(d.getDate() + n); return dk(d); };

export const lastDays = (n, end = todayKey()) => Array.from({ length: n }, (_, i) => addDays(end, -(n - 1 - i)));

export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const DOWL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const fmtDay = k => { const d = pk(k); return `${DOWL[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`; };

export const fmtShort = k => { const d = pk(k); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };

export const fmtDur = s => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : m > 0 ? `${m}:${pad(s % 60)}` : `${s}s`; };

export const dayOfYear = k => { const d = pk(k); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); };
