import { fmtShort, pk } from '../lib/dates.js';
import { esc, r1 } from '../lib/utils.js';

/* ---- charts ---- */
export function lineChart(pts, { h = 150, unit = '', min, max, fmt = r1 } = {}) {
  if (pts.length < 2) return `<div class="muted small u-p-14-0">Necesitás al menos 2 registros para ver la tendencia.</div>`;
  const W = 600, pl = 6, pr = 6, pt = 14, pb = 22;
  const ys = pts.map(p => p.y); let lo = min ?? Math.min(...ys), hi = max ?? Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; } const padY = (hi - lo) * .12; if (min == null) lo -= padY; if (max == null) hi += padY;
  const xs = pts.map(p => pk(p.x).getTime()); const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const X = t => pl + (W - pl - pr) * (x1 === x0 ? .5 : (t - x0) / (x1 - x0)), Y = v => pt + (h - pt - pb) * (1 - (v - lo) / (hi - lo));
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${X(xs[xs.length - 1])},${h - pb} L${X(xs[0])},${h - pb}Z`;
  const last = pts[pts.length - 1];
  const dots = pts.length <= 30 ? pts.map((p, i) => `<circle cx="${X(xs[i]).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3" fill="var(--card)" stroke="var(--accent)" stroke-width="2"/>`).join('') : '';
  return `<svg class="chart u-d-block" viewBox="0 0 ${W} ${h}" width="100%">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    <path class="area" d="${area}" fill="url(#lg)"/>
    <path class="line" d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1200"/>
    ${dots}
    <text x="${pl}" y="${h - 4}" font-size="11" fill="var(--text2)">${fmtShort(pts[0].x)}</text>
    <text x="${W - pr}" y="${h - 4}" font-size="11" fill="var(--text2)" text-anchor="end">${fmtShort(last.x)}</text>
    <text x="${W - pr}" y="11" font-size="12" fill="var(--text)" text-anchor="end">${fmt(last.y)}${unit}</text></svg>`;
}

export function barChart(items, { h = 130, max, line, hl } = {}) {
  const W = 600, pb = 20, n = items.length; if (!n) return '';
  const m = max ?? Math.max(1, ...items.map(i => i.v)); const bw = W / n;
  const bars = items.map((it, i) => {
    const bh = Math.max(it.v > 0 ? 3 : 0, (h - pb - 8) * (it.v / m)); const bwid = Math.min(bw * .6, 44), x = i * bw + (bw - bwid) / 2;
    const on = it.hl ?? true;
    return `<rect x="${x.toFixed(1)}" y="${(h - pb - bh).toFixed(1)}" width="${bwid.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="${on ? 'var(--accent)' : 'var(--tint)'}" opacity="${on ? 1 : .6}" style="--d:${i * 35}ms"/>
      <text x="${(i * bw + bw / 2).toFixed(1)}" y="${h - 5}" font-size="11" fill="var(--text2)" text-anchor="middle">${esc(it.l)}</text>`;
  }).join('');
  const ln = line != null ? `<line x1="0" x2="${W}" y1="${(h - pb - (h - pb - 8) * (line / m)).toFixed(1)}" y2="${(h - pb - (h - pb - 8) * (line / m)).toFixed(1)}" stroke="var(--text2)" stroke-dasharray="4 5" opacity=".6"/>` : '';
  return `<svg class="chart u-d-block" viewBox="0 0 ${W} ${h}" width="100%">${ln}${bars}</svg>`;
}
