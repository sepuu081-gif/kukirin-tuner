const KEY = "kukirin_vesc_logs";

export function getRideLogs(vehicleId) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}");
    return all[vehicleId] || [];
  } catch { return []; }
}

export function saveRideLog(vehicleId, log) {
  if (!log?.samples?.length) return null;
  let all = {};
  try { all = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
  const saved = { ...log, id: `${Date.now()}`, savedAt: new Date().toISOString() };
  all[vehicleId] = [saved, ...(all[vehicleId] || [])].slice(0, 8);
  localStorage.setItem(KEY, JSON.stringify(all));
  return saved;
}

export function clearRideLogs(vehicleId) {
  let all = {};
  try { all = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
  delete all[vehicleId];
  localStorage.setItem(KEY, JSON.stringify(all));
}
