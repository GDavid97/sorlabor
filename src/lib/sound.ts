let ctx: AudioContext | null = null;

/** Felhasználói interakcióra hívd meg (pl. Indítás gomb), hogy a böngésző engedje a hangot. */
export function unlockAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    if (ctx?.state === 'suspended') void ctx.resume();
  } catch {
    /* nincs hang */
  }
}

/** Rövid sípolás(ok) WebAudio-val – hangfájl nélkül. */
export function beep(times = 2, freq = 880) {
  unlockAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  for (let i = 0; i < times; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = t0 + i * 0.32;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.26);
  }
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* nincs rezgés */
  }
}

export function notify(title: string, body?: string) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      new Notification(title, { body });
    }
  } catch {
    /* nem támogatott */
  }
}
