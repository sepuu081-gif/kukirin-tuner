import assert from 'node:assert/strict';
import {getRiderPose,distance} from '../src/lib/riderPose.js';
import {VEHICLES,PARTS_CATALOG} from '../src/lib/vehicleData.js';
import {getVehiclePhotoLayout,getVehicleHandGrips} from '../src/lib/vehiclePhotos.js';
import {checkPartFit} from '../src/lib/buildState.js';
for(const v of VEHICLES){const l=getVehiclePhotoLayout(v),grips=getVehicleHandGrips(v,l);const base=getRiderPose(l,{grips,moto:v.vehicleType==='emoto'});
 for(const pitch of [0,25,43,69,80,95]){const pose=getRiderPose(l,{pitch,grips,moto:v.vehicleType==='emoto'});assert.deepEqual(pose,base,'rider must follow vehicle without counterrotation');for(const a of pose.arms){assert(Math.abs(distance(a[0],a[1])-16)<1e-7);assert(Math.abs(distance(a[1],a[2])-16)<1e-7);}}
 if(v.vehicleType!=='emoto'){const bar=PARTS_CATALOG.find(p=>p.id===`stunt_bar_${v.id}`);assert(bar);assert(checkPartFit(bar,v,0));const other=VEHICLES.find(o=>o.id!==v.id);assert(!checkPartFit(bar,other,50));}}
console.log('PASS fixed rider photo-frame pose at all angles, fixed bone lengths, model-specific stunt bar availability + wrong-model rejection.');
