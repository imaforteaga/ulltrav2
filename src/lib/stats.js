export const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;

export const hm = t => { const [h, m] = (t || '00:00').split(':').map(Number); return h * 60 + m; };

export const levelWord = v => v <= 2 ? 'Muy bajo' : v <= 4 ? 'Bajo' : v <= 6 ? 'Normal' : v <= 8 ? 'Bueno' : 'Excelente';
