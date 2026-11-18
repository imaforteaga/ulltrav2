import { $ } from '../../lib/dom.js';
import { U } from '../../state/ui-state.js';
import { ACT } from '../../ui/actions.js';
import { onSheetClose } from '../../ui/sheet.js';
import { toast } from '../../ui/toast.js';

/* ---------- webcam ---------- */
let camStream = null;

export function stopCam() { if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; } }
onSheetClose(() => { stopCam(); U.camBlob = null; });

ACT['cam-open'] = async () => {
  try { camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1600 } } }); }
  catch (e) { return toast('No se pudo acceder a la cámara'); }
  $('#cam-area').innerHTML = `<video id="cam-v" autoplay playsinline muted class="u-w-100pct u-border-radius-16 u-bg-000 u-max-height-46vh u-object-fit-cover"></video><button class="btn block u-mt-10" data-act="cam-shot">Sacar foto</button>`; $('#cam-v').srcObject = camStream;
};

ACT['cam-shot'] = () => { const v = $('#cam-v'), c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
  c.toBlob(b => { U.camBlob = b; stopCam(); $('#cam-area').innerHTML = `<img src="${URL.createObjectURL(b)}" class="u-w-100pct u-border-radius-16 u-max-height-46vh u-object-fit-cover"><button class="btn ghost block u-mt-10" data-act="cam-open">Repetir</button>`; }, 'image/jpeg', .9); };
