/**
 * The theme switch's own sound, synthesized with Web Audio (no files).
 * A soft click, then a tone that glides down for dark ("lights off") or up
 * for light ("lights on"), with a quiet fifth above for a bit of shimmer.
 */

let ctx: AudioContext | null = null;

const audio = (): AudioContext | null => {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
  return ctx;
};

export function playThemeSound(to: 'light' | 'dark'): void {
  const ac = audio();
  if (!ac) return;

  const now = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = 0.9;
  out.connect(ac.destination);

  // Click: a few ms of filtered noise, like a switch's contact
  const noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.025), ac.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  const click = ac.createBufferSource();
  click.buffer = noise;
  const clickFilter = ac.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = to === 'dark' ? 1800 : 3200;
  clickFilter.Q.value = 1.2;
  const clickGain = ac.createGain();
  clickGain.gain.value = 0.35;
  click.connect(clickFilter).connect(clickGain).connect(out);
  click.start(now);

  // Tone: falls for dark, rises for light
  const [from, toHz] = to === 'dark' ? [740, 392] : [392, 784];
  const tone = (freq: number, level: number, delay: number) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * (from / toHz), now + delay);
    osc.frequency.exponentialRampToValueAtTime(freq, now + delay + 0.22);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now + delay);
    g.gain.exponentialRampToValueAtTime(level, now + delay + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.38);
    osc.connect(g).connect(out);
    osc.start(now + delay);
    osc.stop(now + delay + 0.4);
  };
  tone(toHz, 0.12, 0.01);
  tone(toHz * 1.5, 0.035, 0.04);
}
