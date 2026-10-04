import { VEHICLES, SECRET_CODES } from './vehicleData.js';
import { resetAllTires } from './rideUpgrades.js';
import { chargeAllVehicles } from './chargingState.js';

// One-time effects also run through UNLOCKALL, without duplicating rewards.
export function applyCodeReward(code) {
  const entry = Object.hasOwn(SECRET_CODES, code) ? SECRET_CODES[code] : null;
  if (!entry) return 0;
  const marker = `kukirin_code_reward_${code}`;
  if (localStorage.getItem(marker) === 'true') return 0;
  if (entry.effect === 'tyres') resetAllTires(VEHICLES);
  if (entry.effect === 'charge') chargeAllVehicles(VEHICLES.map(vehicle => vehicle.id));
  if (entry.effect === 'repair') localStorage.setItem('kukirin_broken_parts', '[]');
  if (entry.effect === 'service') {
    chargeAllVehicles(VEHICLES.map(vehicle => vehicle.id));
    localStorage.setItem('kukirin_broken_parts', '[]');
  }
  localStorage.setItem(marker, 'true');
  return entry.respectBonus ?? (code === 'RESPECT999' ? 999 : code === 'RESPECT500' ? 500 : code === 'SLEEPER100' ? 100 : code === 'MECHANIC99' ? 99 : 50);
}

export function getUnlockedCodes() {
  try {
    const saved = JSON.parse(localStorage.getItem('kukirin_unlocked_codes') || '[]');
    return Array.isArray(saved) ? [...new Set(saved.filter(code => typeof code === 'string' && Object.hasOwn(SECRET_CODES, code)))] : [];
  } catch { return []; }
}

// Read persistence on every redemption; React state may lag behind rapid taps.
export function redeemSecretCode(input) {
  const code = String(input ?? '').trim().toUpperCase();
  if (!Object.hasOwn(SECRET_CODES, code)) return { success:false };
  const unlocked = new Set(getUnlockedCodes());
  const targets = code === 'UNLOCKALL' ? Object.keys(SECRET_CODES).filter(key=>!SECRET_CODES[key].manualOnly) : [code];
  let bonus = 0;
  let changed = false;
  for (const target of targets) {
    const entry = SECRET_CODES[target];
    const marker = `kukirin_code_reward_${target}`;
    const known = unlocked.has(target);
    if (!known || localStorage.getItem(entry.key) !== 'true') changed = true;
    // Legacy saves already received their rewards before reward markers existed.
    if (known) localStorage.setItem(marker, 'true');
    else bonus += applyCodeReward(target);
    localStorage.setItem(entry.key, 'true');
    unlocked.add(target);
  }
  localStorage.setItem('kukirin_unlocked_codes', JSON.stringify([...unlocked]));
  const stored = Number(localStorage.getItem('kukirin_respect'));
  const respect = (Number.isFinite(stored) ? Math.max(0, stored) : 0) + bonus;
  localStorage.setItem('kukirin_respect', String(respect));
  return { success:changed, duplicate:!changed, code, reward:SECRET_CODES[code].reward, bonus, respect };
}

export function getCodeRideModifiers() {
  const has = code => localStorage.getItem(SECRET_CODES[code].key) === 'true';
  return {
    heat:has('COOLPRO') ? .6 : has('COOLMASTER') ? 0.7 : has('COOLDOWN') ? 0.85 : 1,
    balance:has('BALANCEPLUS') ? 120 : has('BALANCEPRO') ? 95 : 70,
    trick:has('STUNTLEGEND') ? 3 : has('STUNTMASTER') ? 2 : 1,
    braking:has('BRAKEKING') ? 1.3 : has('BRAKEPRO') ? 1.2 : 1,
  };
}
