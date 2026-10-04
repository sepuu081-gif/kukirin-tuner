const KEY = "kukirin_vehicle_charge";

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

function writeAll(all) {
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getChargerPowerKw(vehicle) {
  if (vehicle?.series === "STARK") return 3.3;
  if (vehicle?.id === "surron_ultra_bee") return 2.5;
  if (vehicle?.series === "SURRON") return 1.5;
  if ((vehicle?.voltage || 48) >= 72) return 1.2;
  return 0.55;
}

export function getVehicleEnergyWh(vehicle, build) {
  const capacity = build?.parts?.battery?.capacity || vehicle?.stockCapacityAh
    || ((vehicle?.voltage || 48) <= 48 ? 15 : (vehicle?.voltage || 48) <= 72 ? 30 : 40);
  const voltage = build?.parts?.battery?.voltage || vehicle?.voltage || 48;
  return Math.max(100, voltage * capacity * 0.92);
}

export function getVehicleCharge(vehicleId, vehicle, build) {
  const all = readAll();
  const now = Date.now();
  const saved = all[vehicleId] || { pct: 100, charging: false, updatedAt: now };
  let pct = Math.max(0, Math.min(100, Number(saved.pct) || 0));
  if (saved.charging && vehicle) {
    const elapsedHours = Math.max(0, now - (Number(saved.updatedAt) || now)) / 3600000;
    const gainedPct = elapsedHours * getChargerPowerKw(vehicle) * 1000 / getVehicleEnergyWh(vehicle, build) * 100;
    pct = Math.min(100, pct + gainedPct);
  }
  if (pct >= 99.95) pct = 100;
  const next = { pct, charging: !!saved.charging && pct < 100, updatedAt: now };
  all[vehicleId] = next;
  writeAll(all);
  return next;
}

export function setVehicleCharge(vehicleId, pct, charging = false) {
  const all = readAll();
  all[vehicleId] = { pct: Math.max(0, Math.min(100, Number(pct) || 0)), charging: !!charging, updatedAt: Date.now() };
  writeAll(all);
  return all[vehicleId];
}

export function toggleVehicleCharging(vehicleId, vehicle, build) {
  const current = getVehicleCharge(vehicleId, vehicle, build);
  return setVehicleCharge(vehicleId, current.pct, !current.charging && current.pct < 100);
}

export function chargeAllVehicles(vehicleIds) {
  const all = readAll();
  const now = Date.now();
  vehicleIds.forEach((id) => { all[id] = { pct: 100, charging: false, updatedAt: now }; });
  writeAll(all);
}
