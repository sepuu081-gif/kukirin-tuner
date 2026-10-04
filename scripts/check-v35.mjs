import assert from 'node:assert/strict';
import { VEHICLES, PARTS_CATALOG } from '../src/lib/vehicleData.js';
import { getMotorCount } from '../src/lib/drivePhysics.js';
import { createStockBuild, calcBuildStats } from '../src/lib/buildState.js';
import { getVescMotorProfile } from '../src/lib/vescMotorProfile.js';
globalThis.localStorage = { getItem: () => null };
for (const vehicle of VEHICLES) {
  const build = createStockBuild(vehicle.id);
  assert.equal(getMotorCount(vehicle), vehicle.motorCount || 1);
  assert.equal(calcBuildStats(vehicle, build).motorCount, vehicle.motorCount || 1);
  assert.equal(calcBuildStats(vehicle, build).topSpeed, vehicle.topSpeed);
  const profile = getVescMotorProfile(vehicle, build);
  assert.equal(profile.count * profile.watts, vehicle.watts);
}
const donor = VEHICLES.find(v => v.id === 'g4');
assert.equal(getMotorCount({}, PARTS_CATALOG.find(p => p.id === 'hub_700w_dt_mini')), 1, 'Dualtron brand name must not imply two motors');
const duals = PARTS_CATALOG.filter(p => p.category === 'motor' && getMotorCount({}, p) === 2);
assert(duals.length >= 10);
for (const motor of duals) {
  const build = createStockBuild(donor.id); build.parts.motor = motor;
  const stats = calcBuildStats(donor, build), profile = getVescMotorProfile(donor, build);
  assert.equal(stats.motorCount, 2); assert.equal(stats.watts, motor.watts);
  assert.equal(profile.count, 2); assert.equal(profile.watts * 2, motor.watts);
  assert(stats.usablePower <= stats.watts, 'motor count must not double combined power');
  assert(Number.isFinite(stats.topSpeed) && stats.topSpeed > 0);
}
const single = PARTS_CATALOG.find(p => p.category === 'motor' && getMotorCount({}, p) === 1);
assert.equal(getMotorCount(VEHICLES.find(v => v.id === 'g2_master'), single), 1);
console.log(`PASS: ${VEHICLES.length} stock builds, ${duals.length} dual kits, per-motor VESC power, combined power limits, single-motor replacement.`);
