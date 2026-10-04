import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createScooterModel, SCOOTER_PROFILES } from '../src/lib/scooterModels3D.js';
import { VEHICLES } from '../src/lib/vehicleData.js';
const silhouettes = new Set();
for (const id of Object.keys(SCOOTER_PROFILES)) {
  const vehicle = VEHICLES.find(v => v.id === id);
  assert(vehicle, id);
  const model = createScooterModel(vehicle, vehicle.motorCount);
  let motors = 0, treads = 0, coils = 0, signatures = [];
  model.group.traverse(obj => {
    if (obj.name === 'hub-motor') motors++;
    if (obj.name === 'tire-tread') {treads++;assert.equal(obj.count,96);}
    if (obj.name === 'suspension-spring') coils++;
    if (obj.isMesh) {
      obj.geometry.computeBoundingBox();
      const b = obj.geometry.boundingBox;
      assert(Number.isFinite(b.min.length()+b.max.length()),`${id}: invalid geometry`);
      signatures.push([obj.name,obj.geometry.type,obj.position.toArray(),b.min.toArray(),b.max.toArray()]);
    }
  });
  assert.equal(motors,vehicle.motorCount,id);
  assert.equal(treads,2,id);
  assert.equal(model.wheels.length,2);
  assert.equal(model.wheels[0].position.x,-vehicle.wheelbase/2000);
  assert.equal(model.wheels[1].position.x,vehicle.wheelbase/2000);
  assert.equal(model.wheels[0].position.y,model.radius);
  assert(model.group.getObjectByName('brake-disc'));
  assert(model.group.getObjectByName('headlight'));
  assert(model.group.getObjectByName('brake-cable'));
  assert(model.group.getObjectByName('battery-deck'));
  assert(model.handle[1]>model.deckTop+.9);
  if(id==='g3')assert.equal(coils,0,'G3 has elastomer suspension');
  if(id==='g4_max')assert(model.group.getObjectByName('fork-crown'));
  if(!id.endsWith('2026')||id==='g2_2026')silhouettes.add(JSON.stringify(signatures));
  const bounds = new THREE.Box3().setFromObject(model.group);
  assert(bounds.min.y>-.02,`${id}: model below ground`);
  assert(bounds.max.y<1.5);
  const mats=new Set();model.group.traverse(o=>{o.geometry?.dispose();if(o.material)mats.add(o.material);});mats.forEach(m=>m.dispose());
}
assert.equal(silhouettes.size,8,'eight requested model families must have different geometry');
assert.equal(createScooterModel({id:'unknown'},1),null,'unknown models retain existing fallback');
console.log('PASS: eight distinct model families, nine variants, finite geometry, suspension types, motor counts, wheel centres, brakes, cables and ground clearance.');
