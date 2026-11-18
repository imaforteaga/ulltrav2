// The single live state object. It is never reassigned (so every module can import `S` safely);
// restoring a backup or wiping data swaps its contents in place with replaceState().
import { blankState } from './schema.js';

export const S = blankState();

const changeFns = new Set(), saveFns = new Set();
/** Called after replaceState (restore / wipe / load). Returns an unsubscribe function. */
export const subscribe = fn => { changeFns.add(fn); return () => changeFns.delete(fn); };
/** Called after every save(); storage uses it to debounce writes. */
export const onSave = fn => { saveFns.add(fn); return () => saveFns.delete(fn); };

export function replaceState(next) {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, next);
  changeFns.forEach(fn => fn(S));
}
export function save() {
  S.savedAt = Date.now();
  saveFns.forEach(fn => fn(S));
}
