const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, fallback) => value != null && Number.isFinite(Number(value)) ? Number(value) : fallback;
const read = key => { try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { return {}; } };
const flag = name => localStorage.getItem(`kukirin_unlock_${name}`) === 'true';

// Game pressure targets are tuning baselines, not real-world service advice.
export function tireTarget(vehicle) { return vehicle?.vehicleType === 'emoto' ? 1.8 : 3.2; }
export function getTires(vehicle, build) {
  const saved = read(`kukirin_tires_${vehicle.id}`);
  const wheelId = build?.parts?.wheel?.id || 'stock';
  const target = tireTarget(vehicle);
  const same = saved.wheelId === wheelId;
  return { wheelId, frontPressure:clamp(finite(saved.frontPressure, target), .5, 5), rearPressure:clamp(finite(saved.rearPressure, target), .5, 5), frontWear:same ? clamp(finite(saved.frontWear, 0), 0, 100) : 0, rearWear:same ? clamp(finite(saved.rearWear, 0), 0, 100) : 0 };
}
export function saveTires(vehicleId, tires) { localStorage.setItem(`kukirin_tires_${vehicleId}`, JSON.stringify(tires)); }
export function resetAllTires(vehicles) {
  for (const vehicle of vehicles) {
    const saved = read(`kukirin_tires_${vehicle.id}`);
    if (saved.wheelId) saveTires(vehicle.id, { ...saved, frontWear:0, rearWear:0 });
    else localStorage.removeItem(`kukirin_tires_${vehicle.id}`);
  }
}
export function tireEffects(vehicle, tires) {
  const target = tireTarget(vehicle);
  const axle = (pressure, wear) => {
    const ratio = pressure / target;
    return { grip:clamp(1 - Math.abs(ratio - 1) * .32 - wear / 100 * .4, .3, 1), rolling:1 + Math.max(0, 1 - ratio) * 1.8 + wear / 100 * .18 };
  };
  const front = axle(tires.frontPressure, tires.frontWear), rear = axle(tires.rearPressure, tires.rearWear);
  return { grip:Math.min(1, Math.min(front.grip, rear.grip) * (flag('gripmaster') ? 1.12 : 1)), rolling:(front.rolling + rear.rolling) / 2, wearRate:flag('tireguard') ? .35 : 1, energy:flag('ecoflow') ? .9 : 1 };
}
export function wearTires(tires, km, { throttle = 0, brake = false, wheelie = false, rate = 1 } = {}) {
  const wear = Math.max(0, km) * .035 * rate;
  return { ...tires, frontWear:clamp(tires.frontWear + wear * (wheelie ? .15 : brake ? 2.4 : 1), 0, 100), rearWear:clamp(tires.rearWear + wear * (1 + throttle * .7 + (wheelie ? 1 : 0)), 0, 100) };
}
export function newTraining() { return { wheelieSeconds:0, longestWheelie:0, currentWheelie:0, combo:0, bestCombo:0, score:0, tricks:[], chain:[] }; }
export function advanceTraining(state, wheelie, dt) {
  const current = wheelie ? state.currentWheelie + dt : 0;
  return { ...state, currentWheelie:current, wheelieSeconds:state.wheelieSeconds + (wheelie ? dt : 0), longestWheelie:Math.max(state.longestWheelie, current), combo:wheelie ? state.combo : 0, chain:wheelie ? state.chain : [] };
}
export function scoreTraining(state, trick, points) {
  if (state.chain.includes(trick)) return { state, points:0 };
  const combo = state.chain.length + 1;
  const earned = Math.round(points * (1 + Math.min(4, combo - 1) * .2) * (flag('comboking') ? 1.5 : 1));
  return { points:earned, state:{ ...state, combo, bestCombo:Math.max(state.bestCombo, combo), score:state.score + earned, chain:[...state.chain, trick], tricks:[...new Set([...state.tricks, trick])] } };
}
export function getTrainingRecords(id) {
  const saved = read(`kukirin_training_${id}`);
  return { longestWheelie:Math.max(0, finite(saved.longestWheelie, 0)), bestCombo:Math.max(0, finite(saved.bestCombo, 0)), score:Math.max(0, finite(saved.score, 0)) };
}
export function saveTrainingRecords(id, session) {
  const prev = getTrainingRecords(id);
  const next = { longestWheelie:Math.max(prev.longestWheelie, session.longestWheelie), bestCombo:Math.max(prev.bestCombo, session.bestCombo), score:Math.max(prev.score, session.score) };
  localStorage.setItem(`kukirin_training_${id}`, JSON.stringify(next));
  return next;
}
export function compareBuildStats(stats) {
  const mass = stats.totalWeight + 78;
  const acceleration = Math.max(.1, Math.min(6.2, stats.mechanicalPower / (4 * mass)) * stats.torqueFactor);
  return { speed:stats.topSpeed, acceleration:acceleration * 3.6, thermal:stats.usablePower / Math.max(1, stats.heatCap) };
}
