// CSV export: built in the browser and downloaded; nothing is uploaded anywhere.
import { CSV_SETS } from '../../domain/csv.js';
import { todayKey } from '../../lib/dates.js';
import { S } from '../../state/store.js';
import { ACT } from '../../ui/actions.js';
import { ic } from '../../ui/icons.js';
import { toast } from '../../ui/toast.js';

export function downloadText(name, text, type = 'text/csv;charset=utf-8') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Archivo descargado');
}

ACT['csv'] = el => { const [label, fn] = CSV_SETS[el.dataset.k] || []; if (!fn) return; downloadText(`ultra-${el.dataset.k}-${todayKey()}.csv`, fn(S)); };

export const csvCard = () => `<div class="card"><div class="eyebrow u-mb-6">Exportar a CSV</div><p class="small muted u-mb-10">Para abrir en Excel o Google Sheets. Se genera en tu teléfono; no se envía a ningún lado.</p>
  <div class="grid2">${Object.entries(CSV_SETS).map(([k, [l]]) => `<button class="btn ghost sm" data-act="csv" data-k="${k}">${ic('download', 14)} ${l}</button>`).join('')}</div></div>`;
