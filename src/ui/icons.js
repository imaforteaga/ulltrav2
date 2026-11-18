/* ---- icons (stroke, 24px) ---- */
const P = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  fork: '<path d="M7 3v8M4 3v5a3 3 0 006 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>',
  moon: '<path d="M20 14A8 8 0 0110 4a8 8 0 1010 10z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  book: '<path d="M4 4h7a3 3 0 013 3v14a2 2 0 00-2-2H4zM20 4h-6M20 4v15h-6"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  flame: '<path d="M12 3c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  repeat: '<path d="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  play: '<path d="M7 4l13 8-13 8z"/>', pause: '<path d="M8 4v16M16 4v16"/>',
  scale: '<rect x="3" y="4" width="18" height="16" rx="4"/><path d="M8 9a5 5 0 018 0"/><path d="M12 9l2-2"/>',
  stretch: '<circle cx="12" cy="4" r="2"/><path d="M12 7v6M6 9l6 2 6-2M9 21l3-8 3 8"/>',
  pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M9.5 8.5l6 6" />',
  list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  score: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  wallet: '<path d="M3 7h15a3 3 0 013 3v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M3 7l2.5-3H16"/><circle cx="16.5" cy="14" r="1.2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'
};

export const ic = (n, s) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${s ? ` width="${s}" height="${s}"` : ''}>${P[n] || ''}</svg>`;

export const badge = n => `<div class="badge">${ic(n)}</div>`;
