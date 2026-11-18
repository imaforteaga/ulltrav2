import { DATA } from '../data/content.js';
import { dayOfYear, todayKey } from '../lib/dates.js';

export const verseOfDay = () => { const i = (dayOfYear(todayKey()) + new Date().getFullYear()) % DATA.verses.length; const [reference, text, theme, reflection] = DATA.verses[i]; return { reference, text, theme, reflection }; };

export const motivation = () => DATA.lines[(dayOfYear(todayKey()) + new Date().getFullYear()) % DATA.lines.length];
