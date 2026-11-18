// Number formatting for es-AR copy: decimal comma, thousands dot.
export const f1 = n => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
export const f0 = n => Math.round(n).toLocaleString('es-AR');
export const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
