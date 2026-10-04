const KEY = "kukirin_battery_health";

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

export function batteryKey(vehicleId, batteryId = "stock") {
  return `${vehicleId}:${batteryId || "stock"}`;
}

export function getBatteryProfile(vehicleId, batteryId) {
  const key = batteryKey(vehicleId, batteryId);
  const saved = readAll()[key] || {};
  return {
    cycles: Math.max(0, Number(saved.cycles) || 0),
    health: Math.max(55, Math.min(100, Number(saved.health) || 100)),
    throughputWh: Math.max(0, Number(saved.throughputWh) || 0),
    hotSeconds: Math.max(0, Number(saved.hotSeconds) || 0),
    peakTemp: Math.max(20, Number(saved.peakTemp) || 25),
  };
}

export function saveBatteryProfile(vehicleId, batteryId, profile) {
  const all = readAll();
  all[batteryKey(vehicleId, batteryId)] = profile;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function applyBatteryUse(profile, dischargedWh, nominalWh, temperature, seconds = 0.08) {
  const positiveWh = Math.max(0, dischargedWh);
  const cyclesAdded = positiveWh / Math.max(1, nominalWh);
  const hotSeconds = profile.hotSeconds + (temperature > 48 ? seconds : 0);
  const cycleWear = cyclesAdded * 0.045;
  const heatWear = temperature > 48 ? ((temperature - 48) / 22) * seconds / 180 : 0;
  return {
    cycles: profile.cycles + cyclesAdded,
    health: Math.max(55, profile.health - cycleWear - heatWear),
    throughputWh: profile.throughputWh + positiveWh,
    hotSeconds,
    peakTemp: Math.max(profile.peakTemp, temperature),
  };
}

export function resetBatteryProfile(vehicleId, batteryId) {
  saveBatteryProfile(vehicleId, batteryId, { cycles: 0, health: 100, throughputWh: 0, hotSeconds: 0, peakTemp: 25 });
}
