// Simulation estimates. Unknown winding data is not a manufacturer specification.
const RACE_WINDINGS = {
  hub_14000w_flux_dual: { kv: 31, wheelSize: 11 },
  hub_18000w_apex_dual: { kv: 31.5, wheelSize: 11 },
  hub_22000w_quantum: { kv: 32, wheelSize: 12 },
};
export function getMotorCount(vehicle = {}, motor) {
  if (motor?.motorCount) return Math.max(1, Math.min(2, motor.motorCount));
  if (motor) return /\bdual\b|(?:^|_)dual(?:_|$)|2\s*[×x]|[×x]\s*2\b/i.test(`${motor.id} ${motor.name}`) ? 2 : 1;
  return vehicle.motorCount === 2 ? 2 : 1;
}
export function getMotorDriveSpec(vehicle, motor) {
  const midDrive = vehicle.vehicleType === 'emoto';
  const ratio = motor?.gearRatio || (midDrive ? (vehicle.series === 'STARK' ? 9 : 7.5) : 1);
  const referenceWheel = motor?.wheelSize || (midDrive ? vehicle.tireSize : (motor?.sizeClass >= 7 ? 12 : motor?.sizeClass >= 4 ? 11 : 10));
  const ratedVoltage = motor?.voltage || vehicle.voltage || 48;
  const circumference = Math.PI * (motor ? referenceWheel : vehicle.tireSize || 10) * 0.0254;
  const referenceSpeed = motor ? (motor.noLoadSpeed || 32 + 32 * Math.sqrt((motor.watts || 600) / 1000)) : (vehicle.topSpeed || 50) / 0.95;
  const kv = motor?.kv || RACE_WINDINGS[motor?.id]?.kv || referenceSpeed / 3.6 / circumference * 60 * ratio / ratedVoltage;
  return { kv, ratio, ratedVoltage };
}

export function roadLoadPower(speedMs, mass, cdA, rolling = 0.016) {
  return rolling * mass * 9.81 * speedMs + 0.5 * 1.225 * cdA * speedMs ** 3;
}

export function solveRoadSpeed(powerW, mass, cdA, rolling = 0.016) {
  if (!(powerW > 0)) return 0;
  let low = 0, high = 10;
  // Grow the numerical search bracket instead of imposing a gameplay speed cap.
  while (roadLoadPower(high, mass, cdA, rolling) < powerW) high *= 2;
  for (let i = 0; i < 48; i++) {
    const mid = (low + high) / 2;
    if (roadLoadPower(mid, mass, cdA, rolling) <= powerW) low = mid;
    else high = mid;
  }
  return low * 3.6;
}
