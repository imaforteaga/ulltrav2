export function beep() {
  try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain();
    o.frequency.value = 660; g.gain.setValueAtTime(.12, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .6);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + .6); } catch (e) { }
}
