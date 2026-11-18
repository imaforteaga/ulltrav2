import { DB } from '../state/storage.js';

/* ---- photos ---- */
export const photoURLs = {};

export async function photoURL(id) {
  if (photoURLs[id]) return photoURLs[id];
  const b = await DB.get('photos', id); if (!b) return '';
  return (photoURLs[id] = URL.createObjectURL(b));
}

export function resizeImage(file, max = 1600) {
  return new Promise((res, rej) => {
    const img = new Image(); const u = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => { URL.revokeObjectURL(u); b ? res(b) : rej(new Error('blob')); }, 'image/jpeg', .86);
    };
    img.onerror = () => rej(new Error('img')); img.src = u;
  });
}
