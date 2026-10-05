import { getVehicleSoundProfile } from './vehicleSoundProfiles';

let audioContext = null;
let engine = null;
let policeSiren = null;

const buffers = new Map();
let requestedRide = null;

export function isSoundEnabled() {
  return localStorage.getItem("kukirin_sound") !== "off";
}

export function setSoundEnabled(enabled) {
  localStorage.setItem("kukirin_sound", enabled ? "on" : "off");
  if (!enabled) {
    stopEngineSound(false);
    stopPoliceSiren();
  } else if (requestedRide) {
    startEngineSound(requestedRide.vehicle, requestedRide.stats);
  }
}

function context() {
  if (!isSoundEnabled()) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function tone({ frequency = 440, duration = 0.08, volume = 0.025, type = "sine", endFrequency = frequency }) {
  const ctx = context();
  if (!ctx) return;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

export function playSound(name = "tap") {
  if (!isSoundEnabled()) return;
  if (name === "tap") tone({ frequency: 720, endFrequency: 540, duration: 0.045, volume: 0.022, type: "sine" });
  // Gas and brake are mechanical controls, not UI beeps.
  if (name === "scrape") {
    tone({frequency:1300,endFrequency:230,duration:.3,volume:.045,type:'sawtooth'});
    navigator.vibrate?.(35);
  }
  if (name === "bump") {
    tone({ frequency: 92, endFrequency: 38, duration: 0.18, volume: 0.095, type: "square" });
    tone({ frequency: 180, endFrequency: 55, duration: 0.12, volume: 0.05, type: "sawtooth" });
    navigator.vibrate?.([55, 25, 80]);
  }
  if (name === "start") {
    tone({ frequency: 1050, endFrequency: 1050, duration: 0.045, volume: 0.008 });
  }
  if (name === "success") {
    tone({ frequency: 520, duration: 0.12, volume: 0.025 });
    setTimeout(() => tone({ frequency: 780, duration: 0.16, volume: 0.025 }), 90);
  }
  if (name === "warning") {
    tone({ frequency: 880, endFrequency: 640, duration: 0.18, volume: 0.035, type: "square" });
    navigator.vibrate?.([60, 40, 60]);
  }
  if (name === "crash") {
    tone({ frequency: 150, endFrequency: 35, duration: 0.7, volume: 0.08, type: "sawtooth" });
    tone({ frequency: 70, endFrequency: 30, duration: 0.9, volume: 0.055, type: "square" });
    navigator.vibrate?.([180, 60, 260]);
  }
}

// Blend the end into the beginning once after decoding; no repeating MP3 seam.
function loopBuffer(ctx, input) {
  const fade = Math.min(Math.floor(ctx.sampleRate * .22), Math.floor(input.length / 8));
  const length = input.length - fade;
  const loop = ctx.createBuffer(input.numberOfChannels, length, input.sampleRate);
  for (let ch = 0; ch < input.numberOfChannels; ch++) {
    const src = input.getChannelData(ch), dst = loop.getChannelData(ch);
    dst.set(src.subarray(fade));
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      dst[length - fade + i] = src[input.length - fade + i] * (1 - t) + src[i] * t;
    }
  }
  return loop;
}

function loadLoop(ctx, url) {
  if (!buffers.has(url)) {
    const promise = fetch(url).then(response => {
      if (!response.ok) throw new Error('Audio asset unavailable');
      return response.arrayBuffer();
    }).then(data => ctx.decodeAudioData(data)).then(buffer => loopBuffer(ctx, buffer));
    buffers.set(url, promise);
    promise.catch(() => buffers.delete(url));
  }
  return buffers.get(url);
}

async function attachRecording(current) {
  const ctx = audioContext;
  let buffer;
  try {
    buffer = await loadLoop(ctx, current.profile.file);
  } catch {
    if (current.stopped) return;
    current.profile.recorded = false;
    current.profile.file = '/assets/sounds/electric-scooter-wheel.mp3';
    try { buffer = await loadLoop(ctx, current.profile.file); } catch { return; }
  }
  if (current.stopped || engine !== current) return;
  const sample = ctx.createBufferSource();
  sample.buffer = buffer;
  sample.loop = true;
  sample.connect(current.sampleFilter);
  current.sample = sample;
  sample.playbackRate.value = current.rate;
  sample.start();
}

export function startEngineSound(vehicle, stats) {
  requestedRide = { vehicle, stats };
  const ctx = context();
  if (!ctx) return;
  const profile = getVehicleSoundProfile(vehicle, stats);
  if (engine?.profile.key === profile.key) return;
  if (engine) stopEngineSound(false);
  const bus = ctx.createGain();
  const output = ctx.createDynamicsCompressor();
  output.threshold.value = -12;
  output.ratio.value = 3;
  output.attack.value = .012;
  output.release.value = .2;
  bus.gain.value = 1;
  bus.connect(output).connect(ctx.destination);
  const sampleFilter = ctx.createBiquadFilter();
  const sampleGain = ctx.createGain();
  sampleFilter.type = 'lowpass';
  sampleFilter.frequency.value = profile.motorcycle ? 2400 : 1900;
  sampleGain.gain.value = 0;
  sampleFilter.connect(sampleGain).connect(bus);
  const motorGain = ctx.createGain();
  motorGain.gain.value = 0;
  const low = ctx.createOscillator(), high = ctx.createOscillator();
  low.type = high.type = 'sine';
  low.frequency.value = 90; high.frequency.value = 180;
  low.connect(motorGain); high.connect(motorGain); motorGain.connect(bus);
  const noise = ctx.createBufferSource();
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noise.buffer = noiseBuffer; noise.loop = true;
  const windFilter = ctx.createBiquadFilter(), roadFilter = ctx.createBiquadFilter();
  const windGain = ctx.createGain(), roadGain = ctx.createGain();
  windFilter.type = 'highpass'; windFilter.frequency.value = 1000;
  roadFilter.type = 'lowpass'; roadFilter.frequency.value = 180;
  windGain.gain.value = roadGain.gain.value = 0;
  noise.connect(windFilter).connect(windGain).connect(bus);
  noise.connect(roadFilter).connect(roadGain).connect(bus);
  const regen = ctx.createOscillator(), regenGain = ctx.createGain();
  regen.type = 'sine'; regen.frequency.value = 200; regenGain.gain.value = 0;
  regen.connect(regenGain).connect(bus);
  const current = { profile, bus, output, sampleFilter, sampleGain, motorGain, low, high,
    noise, windFilter, windGain, roadGain, regen, regenGain, sample: null, rate: .85, stopped: false };
  engine = current;
  low.start(); high.start(); noise.start(); regen.start();
  void attachRecording(current);
}

export function updateEngineSound(speed = 0, load = 0, braking = false) {
  if (!engine || !audioContext || !isSoundEnabled()) return;
  const e = engine, now = audioContext.currentTime, p = e.profile;
  speed = Math.max(0, Number.isFinite(speed) ? speed : 0);
  load = Math.max(0, Math.min(1, Number.isFinite(load) ? load : 0));
  const spin = Math.min(1, speed / 6);
  const cruise = Math.min(2, speed / p.topSpeed);
  const wheelHz = speed / 3.6 / (Math.PI * p.wheel * .0254);
  const motorHz = Math.min(2400, 85 + wheelHz * (p.motorcycle ? 22 : 14));
  e.low.frequency.setTargetAtTime(motorHz, now, .09);
  e.high.frequency.setTargetAtTime(motorHz * (p.motors > 1 ? 1.016 : 2.02), now, .09);
  // The real recording is dominant. A faint torque tone follows RPM and upgrades.
  e.motorGain.gain.setTargetAtTime(spin * load * .0025 * p.power, now, .08);
  e.rate = Math.max(.62, Math.min(1.6, (.72 + cruise * .3 + load * .045) * p.pitch));
  e.sample?.playbackRate.setTargetAtTime(e.rate, now, .12);
  e.sampleGain.gain.setTargetAtTime(spin * (.55 + load * .25 * p.power) * (p.recorded ? 1 : .32), now, .1);
  e.sampleFilter.frequency.setTargetAtTime((p.motorcycle ? 1900 : 1350) + load * 500, now, .12);
  const wind = Math.min(1.5, speed / 100);
  e.windGain.gain.setTargetAtTime(speed < 8 ? 0 : Math.pow(wind, 1.65) * .025, now, .2);
  e.roadGain.gain.setTargetAtTime(spin * (.001 + Math.min(1, cruise) * .003), now, .16);
  e.regen.frequency.setTargetAtTime(100 + wheelHz * 12, now, .1);
  e.regenGain.gain.setTargetAtTime(braking && speed > 3 ? Math.min(.006, wheelHz * .00035) : 0, now, .07);
}

export function stopEngineSound(clearRequest = true) {
  if (clearRequest) requestedRide = null;
  if (!engine || !audioContext) return;
  const current = engine;
  engine = null; // Allow a new ride immediately, while only the old bus fades.
  current.stopped = true;
  const now = audioContext.currentTime;
  current.bus.gain.cancelScheduledValues(now);
  current.bus.gain.setTargetAtTime(0, now, .035);
  setTimeout(() => {
    for (const node of [current.low, current.high, current.noise, current.regen, current.sample]) {
      try { node?.stop(); node?.disconnect(); } catch { /* Already stopped. */ }
    }
    current.bus.disconnect(); current.output.disconnect();
  }, 180);
}

// Runtime diagnostics used by offline playback checks; not persisted in player saves.
export function getEngineSoundState() {
  return engine ? { vehicleId: engine.profile.id, file: engine.profile.file,
    recorded: engine.profile.recorded, loaded: Boolean(engine.sample),
    rate: engine.rate, sampleGain: engine.sampleGain.gain.value } : null;
}

export function updatePoliceSiren(active, proximity = 0) {
  if (!active) {
    stopPoliceSiren();
    return;
  }
  const ctx = context();
  if (!ctx) return;
  if (!policeSiren) {
    const carrier = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    const gain = ctx.createGain();
    carrier.type = "sine";
    carrier.frequency.value = 690;
    lfo.type = "sine";
    lfo.frequency.value = 0.72;
    lfoDepth.gain.value = 210;
    gain.gain.value = 0.0001;
    lfo.connect(lfoDepth).connect(carrier.frequency);
    carrier.connect(gain).connect(ctx.destination);
    carrier.start();
    lfo.start();
    policeSiren = { carrier, lfo, gain };
  }
  policeSiren.gain.gain.setTargetAtTime(0.018 + Math.min(1, proximity / 100) * 0.055, ctx.currentTime, 0.12);
}

export function stopPoliceSiren() {
  if (!policeSiren || !audioContext) return;
  const current = policeSiren;
  policeSiren = null;
  current.gain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
  setTimeout(() => {
    try { current.carrier.stop(); current.lfo.stop(); } catch {}
    if (policeSiren === current) policeSiren = null;
  }, 300);
}
