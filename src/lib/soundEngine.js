let audioContext = null;
let engine = null;
let policeSiren = null;

function engineProfile(vehicle) {
  const id = typeof vehicle === "string" ? vehicle : vehicle?.id || "";
  if (id === "stark_varg_mx") return { id, pitch: 1.32, motor: 1.35, wheel: 0.35, chain: 0.58, gear: 1.7, dual: 0.03 };
  if (id === "surron_ultra_bee") return { id, pitch: 0.72, motor: 1.18, wheel: 0.65, chain: 1.15, gear: 1.1, dual: 0.018 };
  if (id === "surron_light_bee_x") return { id, pitch: 0.82, motor: 1.0, wheel: 0.7, chain: 1.0, gear: 0.9, dual: 0.014 };
  if (id.includes("g4")) return { id, pitch: 0.78, motor: 1.08, wheel: 1.25, chain: 0.08, gear: 0.62, dual: id.includes("max") || id.includes("pro") ? 0.04 : 0 };
  if (id.includes("g3_pro") || id.includes("g2_master") || id.includes("g2_ultra")) return { id, pitch: 1.04, motor: 1.22, wheel: 1.05, chain: 0.08, gear: 0.72, dual: 0.05 };
  if (id.includes("g3")) return { id, pitch: 0.94, motor: 1.02, wheel: 1.08, chain: 0.06, gear: 0.62, dual: 0 };
  if (id.includes("g2_pro") || id.includes("g2pro")) return { id, pitch: 1.16, motor: 0.82, wheel: 0.82, chain: 0.04, gear: 0.5, dual: 0 };
  if (id.includes("g2_max") || id.includes("g2max")) return { id, pitch: 0.88, motor: 1.02, wheel: 1.18, chain: 0.06, gear: 0.58, dual: 0 };
  if (id.includes("g2")) return { id, pitch: 1.0, motor: 0.95, wheel: 1.0, chain: 0.05, gear: 0.55, dual: 0 };
  if (id.startsWith("xm_")) return { id, pitch: 1.28, motor: 0.62, wheel: 0.58, chain: 0.02, gear: 0.38, dual: 0 };
  return { id, pitch: 1, motor: 1, wheel: 1, chain: 0.05, gear: 0.55, dual: 0 };
}

export function isSoundEnabled() {
  return localStorage.getItem("kukirin_sound") !== "off";
}

export function setSoundEnabled(enabled) {
  localStorage.setItem("kukirin_sound", enabled ? "on" : "off");
  if (!enabled) {
    stopEngineSound();
    stopPoliceSiren();
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
  if (name === "throttle") {
    tone({ frequency: 260, endFrequency: 390, duration: 0.09, volume: 0.012, type: "sine" });
  }
  if (name === "brake") tone({ frequency: 410, endFrequency: 260, duration: 0.1, volume: 0.012, type: "sine" });
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
    tone({ frequency: 95, endFrequency: 210, duration: 0.24, volume: 0.07, type: "sawtooth" });
    setTimeout(() => tone({ frequency: 210, endFrequency: 340, duration: 0.16, volume: 0.045, type: "square" }), 110);
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

export function startEngineSound(vehicle) {
  const ctx = context();
  if (!ctx || engine) return;
  const profile = engineProfile(vehicle);
  const master = ctx.createGain();
  const output = ctx.createDynamicsCompressor();
  const filter = ctx.createBiquadFilter();
  const windFilter = ctx.createBiquadFilter();
  const roadFilter = ctx.createBiquadFilter();
  const windGain = ctx.createGain();
  const roadGain = ctx.createGain();
  const scooterGain = ctx.createGain();
  const whirGain = ctx.createGain();
  const chainFilter = ctx.createBiquadFilter();
  const chainGain = ctx.createGain();
  const gear = ctx.createOscillator();
  const gearGain = ctx.createGain();
  const regen = ctx.createOscillator();
  const regenGain = ctx.createGain();
  const low = ctx.createOscillator();
  const high = ctx.createOscillator();
  const noise = ctx.createBufferSource();
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
  noise.buffer = noiseBuffer;
  noise.loop = true;
  low.type = "sine";
  high.type = "sine";
  filter.type = "lowpass";
  filter.frequency.value = 420;
  windFilter.type = "highpass";
  windFilter.frequency.value = 700;
  roadFilter.type = "lowpass";
  roadFilter.frequency.value = 190;
  chainFilter.type = "bandpass";
  chainFilter.frequency.value = 1350;
  chainFilter.Q.value = 4.5;
  master.gain.value = 0.0001;
  windGain.gain.value = 0.0001;
  roadGain.gain.value = 0.0001;
  scooterGain.gain.value = 0.0001;
  whirGain.gain.value = 0.0001;
  chainGain.gain.value = 0.0001;
  gearGain.gain.value = 0.0001;
  regenGain.gain.value = 0.0001;
  gear.type = "sine";
  gear.frequency.value = 160;
  regen.type = "triangle";
  regen.frequency.value = 340;
  output.threshold.value = -18;
  output.knee.value = 14;
  output.ratio.value = 3;
  output.attack.value = 0.008;
  output.release.value = 0.18;
  output.connect(ctx.destination);
  low.connect(filter);
  high.connect(filter);
  filter.connect(master).connect(output);
  noise.connect(windFilter).connect(windGain).connect(output);
  noise.connect(roadFilter).connect(roadGain).connect(output);
  noise.connect(chainFilter).connect(chainGain).connect(output);
  gear.connect(gearGain).connect(output);
  regen.connect(regenGain).connect(output);
  const scooterAudio = new Audio("/assets/sounds/electric-scooter-wheel.mp3");
  const whirAudio = new Audio("/assets/sounds/electric-motor-whir.mp3");
  for (const audio of [scooterAudio, whirAudio]) {
    audio.loop = true;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.preservesPitch = false;
    audio.webkitPreservesPitch = false;
  }
  const scooterSource = ctx.createMediaElementSource(scooterAudio);
  const whirSource = ctx.createMediaElementSource(whirAudio);
  scooterSource.connect(scooterGain).connect(output);
  whirSource.connect(whirGain).connect(output);
  low.start();
  high.start();
  noise.start();
  gear.start();
  regen.start();
  scooterAudio.play().catch(() => {});
  whirAudio.play().catch(() => {});
  engine = { master, output, filter, low, high, noise, windFilter, windGain, roadGain, scooterAudio, whirAudio, scooterGain, whirGain, chainFilter, chainGain, gear, gearGain, regen, regenGain, profile };
}

export function updateEngineSound(speed = 0, load = 0, braking = false) {
  if (!engine || !audioContext) return;
  const now = audioContext.currentTime;
  const profile = engine.profile;
  const base = (145 + Math.min(150, speed) * 4.2) * profile.pitch;
  engine.low.frequency.setTargetAtTime(base, now, 0.04);
  engine.high.frequency.setTargetAtTime(base * (2.03 + profile.dual), now, 0.04);
  engine.filter.frequency.setTargetAtTime(520 + speed * 14 + load * 650, now, 0.06);
  engine.master.gain.setTargetAtTime((0.0015 + load * 0.007) * profile.motor, now, 0.05);
  const speedRatio = Math.min(1, Math.max(0, speed / 100));
  engine.windFilter.frequency.setTargetAtTime(650 + speed * 18, now, 0.08);
  engine.windGain.gain.setTargetAtTime(speed < 8 ? 0.0001 : 0.003 + Math.pow(speedRatio, 1.55) * 0.038, now, 0.12);
  engine.roadGain.gain.setTargetAtTime(speed < 1 ? 0.0001 : (0.009 + speedRatio * 0.026) * profile.wheel, now, 0.08);
  engine.scooterAudio.playbackRate = Math.min(1.9, (0.68 + speedRatio * 0.82 + load * 0.22) * Math.max(.72, profile.pitch));
  engine.whirAudio.playbackRate = Math.min(2.15, (0.62 + speedRatio * 1.02 + load * 0.2) * profile.pitch);
  engine.scooterGain.gain.setTargetAtTime(speed < 0.5 ? 0.0001 : (0.026 + speedRatio * 0.035) * profile.wheel, now, 0.06);
  engine.whirGain.gain.setTargetAtTime(speed < 0.5 ? 0.0001 : (0.005 + speedRatio * 0.018 + load * 0.026) * profile.motor, now, 0.06);
  engine.chainFilter.frequency.setTargetAtTime(900 + speed * 15 + load * 350, now, 0.05);
  engine.chainGain.gain.setTargetAtTime(speed < 2 ? 0.0001 : (0.003 + speedRatio * 0.021 + load * 0.012) * profile.chain, now, 0.05);
  engine.gear.frequency.setTargetAtTime(105 + speed * 5.2 * profile.pitch, now, 0.05);
  engine.gearGain.gain.setTargetAtTime(speed < 1 ? 0.0001 : (0.001 + speedRatio * 0.004 + load * 0.004) * profile.gear, now, 0.06);
  engine.regen.frequency.setTargetAtTime(280 + speed * 6.5 * profile.pitch, now, 0.04);
  engine.regenGain.gain.setTargetAtTime(braking && speed > 3 ? 0.018 + speedRatio * 0.026 : 0.0001, now, 0.035);
}

export function stopEngineSound() {
  if (!engine || !audioContext) return;
  const current = engine;
  const now = audioContext.currentTime;
  current.master.gain.setTargetAtTime(0.0001, now, 0.05);
  current.scooterGain?.gain.setTargetAtTime(0.0001, now, 0.05);
  current.whirGain?.gain.setTargetAtTime(0.0001, now, 0.05);
  current.chainGain?.gain.setTargetAtTime(0.0001, now, 0.05);
  current.gearGain?.gain.setTargetAtTime(0.0001, now, 0.05);
  current.regenGain?.gain.setTargetAtTime(0.0001, now, 0.05);
  setTimeout(() => {
    try { current.low.stop(); current.high.stop(); current.noise.stop(); current.gear?.stop(); current.regen?.stop(); } catch {}
    try { current.scooterAudio.pause(); current.whirAudio.pause(); } catch {}
    if (engine === current) engine = null;
  }, 180);
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
  current.gain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
  setTimeout(() => {
    try { current.carrier.stop(); current.lfo.stop(); } catch {}
    if (policeSiren === current) policeSiren = null;
  }, 300);
}
