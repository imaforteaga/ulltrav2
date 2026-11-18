// Shape of the persisted state + migrations.
// Version 2 only ADDS things (see MIGRATIONS[1]); existing backups and the data already on the phone load unchanged. When the model changes,
// add an entry to MIGRATIONS ({ [fromVersion]: state => nextState }) and bump SCHEMA_VERSION.
export const SCHEMA_VERSION = 2;

export const blankState = () => ({
  v: SCHEMA_VERSION, profile: null, weights: [], measures: [], foods: [], customFoods: [], favMeals: [], water: [], sleep: {},
  routines: [], sessions: [], mobSessions: [], customMob: [], habits: [], habitLogs: {}, supplements: [], supLogs: {},
  journal: [], milestones: [], favVerses: [], readVerses: {}, photoMeta: [], about: {}, active: null, theme: 'auto', checkins: {}, reminders: {}, reminderFired: null, fin: null, prefs: {},
});

// v1 → v2: adds `prefs` (suggestion snoozes, options) and, if finance was already in use, its `recurring` list and `goal`.
// Nothing is renamed or removed.
const MIGRATIONS = {
  1: s => {
    const next = { ...s, prefs: isObj(s.prefs) ? s.prefs : {} };
    if (isObj(s.fin)) next.fin = { ...s.fin, recurring: Array.isArray(s.fin.recurring) ? s.fin.recurring : [], goal: s.fin.goal === undefined ? null : s.fin.goal };
    return next;
  },
};

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

/** Turns anything read from disk or from a backup file into a valid, current state. Never throws on old/partial data. */
export function migrate(raw) {
  const base = blankState();
  if (!isObj(raw)) return base;
  let s = { ...raw };
  let v = Number(s.v) || 1;
  while (MIGRATIONS[v]) { s = MIGRATIONS[v](s); v += 1; s.v = v; }
  const out = Object.assign(base, s);
  const blank = blankState();
  for (const k of Object.keys(blank)) {
    if (Array.isArray(blank[k]) && !Array.isArray(out[k])) out[k] = [];
    else if (isObj(blank[k]) && !isObj(out[k])) out[k] = {};
  }
  return out;
}
