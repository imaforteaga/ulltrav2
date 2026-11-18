// Persistence: IndexedDB `forge-web` (stores `kv` + `photos`, key `state`) and localStorage `forge-state`.
// Names and keys are unchanged from the previous version on purpose: existing data keeps loading.
import { S, replaceState, onSave } from './store.js';
import { migrate } from './schema.js';

export const storage = { ok: true };

export const DB = {
  db: null,
  open() {
    return new Promise(res => {
      try {
        const rq = indexedDB.open('forge-web', 1);
        rq.onupgradeneeded = () => { rq.result.createObjectStore('kv'); rq.result.createObjectStore('photos'); };
        rq.onsuccess = () => { DB.db = rq.result; res(true); };
        rq.onerror = () => res(false);
      } catch (e) { res(false); }
    });
  },
  tx(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = DB.db.transaction(store, mode); const s = t.objectStore(store);
      const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error);
    });
  },
  async get(store, key) {
    if (!DB.db) return store === 'kv' ? JSON.parse(localStorage.getItem('forge-' + key) || 'null') : null;
    return DB.tx(store, 'readonly', s => s.get(key));
  },
  async put(store, key, val) {
    if (!DB.db) { if (store === 'kv') localStorage.setItem('forge-' + key, JSON.stringify(val)); return; }
    return DB.tx(store, 'readwrite', s => s.put(val, key));
  },
  async del(store, key) { if (DB.db) return DB.tx(store, 'readwrite', s => s.delete(key)); },
  async all(store) {
    if (!DB.db) return [];
    return new Promise(res => {
      const out = []; const t = DB.db.transaction(store, 'readonly');
      t.objectStore(store).openCursor().onsuccess = e => { const c = e.target.result; if (c) { out.push({ key: c.key, val: c.value }); c.continue(); } else res(out); };
    });
  },
  async clear() { if (DB.db) { await DB.tx('kv', 'readwrite', s => s.clear()); await DB.tx('photos', 'readwrite', s => s.clear()); } localStorage.removeItem('forge-state'); },
};

export function persistLocal() { try { localStorage.setItem('forge-state', JSON.stringify(S)); return true; } catch (e) { return false; } }

let saveT = null;
export async function persistNow() {
  clearTimeout(saveT); S.savedAt = Date.now();
  const a = persistLocal(); let b = false;
  try { if (DB.db) { await DB.tx('kv', 'readwrite', s => s.put(S, 'state')); b = true; } } catch (e) { console.error(e); }
  storage.ok = a || b;
}
onSave(() => { clearTimeout(saveT); saveT = setTimeout(persistNow, 250); });

/** Loads the newest copy between IndexedDB and localStorage, migrates it, and writes it back to both. */
export async function loadState() {
  const ok = await DB.open();
  let a = null, b = null;
  try { b = JSON.parse(localStorage.getItem('forge-state') || 'null'); } catch (e) { }
  try { if (ok) a = await DB.tx('kv', 'readonly', s => s.get('state')); } catch (e) { }
  const best = [a, b].filter(Boolean).sort((x, y) => (y.savedAt || 0) - (x.savedAt || 0))[0];
  if (best) replaceState(migrate(best));
  try { localStorage.setItem('forge-probe', '1'); localStorage.removeItem('forge-probe'); } catch (e) { storage.ok = ok; }
  if (best) { persistLocal(); try { if (ok) await DB.tx('kv', 'readwrite', s => s.put(S, 'state')); } catch (e) { } }
}

/** Flush when the page is hidden or closed (iOS can kill a PWA without warning). */
export function installPersistenceHooks() {
  window.addEventListener('pagehide', () => { persistLocal(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.profile) { persistLocal(); persistNow(); } });
}
