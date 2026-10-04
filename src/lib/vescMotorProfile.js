import { getMotorDriveSpec, getMotorCount } from './drivePhysics.js';
// Game motor profiles, not measurements or manufacturer specifications.
export function getVescMotorProfile(vehicle = {}, build = {}) {
  const motor = build?.parts?.motor;
  const id = motor?.id || vehicle.id || 'stock';
  const midDrive = vehicle.vehicleType === 'emoto';
  const wheel = motor?.tireSize || vehicle.tireSize || 10;
  const count = getMotorCount(vehicle, motor);
  const watts = Math.max(100, (motor?.watts || vehicle.watts || 600) / count);
  const voltage = Math.max(12, motor?.voltage || vehicle.voltage || 48);
  const variation = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 17;
  const winding = 0.94 + variation / 100;
  const poles = motor?.motorPoles || motor?.poles || (midDrive ? 10 : wheel >= 11 ? 40 : wheel <= 8 ? 28 : 30);
  const drive = getMotorDriveSpec(vehicle, motor);
  const ratio = drive.ratio;
  const wheelCircumference = Math.PI * wheel * 0.0254;
  const kv = drive.kv;
  return {
    id, name: motor?.name || `${vehicle.name || 'Vehicle'} stock motor`, poles, ratio,
    count, watts, voltage, wheelCircumference,
    r: Number((Math.max(2, voltage * voltage / watts * 28 * winding)).toFixed(2)),
    l: Number((Math.max(3, (midDrive ? 55 : 110) * voltage / Math.sqrt(watts) / winding)).toFixed(2)),
    lambda: Number((1000 * 60 / (Math.sqrt(3) * Math.PI * kv * poles)).toFixed(3)),
    kv: Number(kv.toFixed(2)),
    hall1: variation, hall2: 120 + variation, hall3: 240 + variation,
  };
}
