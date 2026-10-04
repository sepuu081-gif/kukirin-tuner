import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VEHICLES} from '../src/lib/vehicleData.js';
import {getVehiclePhoto,getVehiclePhotoInfo,getVehiclePhotoLayout} from '../src/lib/vehiclePhotos.js';
import {createStockBuild,calcBuildStats} from '../src/lib/buildState.js';
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))};
for(const v of VEHICLES){const photo=getVehiclePhoto(v),info=getVehiclePhotoInfo(v);assert(photo&&info,v.id+' image metadata');assert(fs.existsSync('public'+photo),v.id+' bundled image');const layout=getVehiclePhotoLayout(v);assert(layout.every(Number.isFinite),v.id+' coordinates');assert(layout[4]>0&&layout[4]<40);assert(['photo','base-photo','illustration'].includes(info.kind));}
const t3=VEHICLES.find(v=>v.id==='t3');assert.equal(t3.watts,800);assert.equal(t3.topSpeed,45);assert.equal(t3.stockCapacityAh,15.6);const stats=calcBuildStats(t3,createStockBuild(t3));assert(stats.topSpeed>40&&stats.topSpeed<55,JSON.stringify(stats));
console.log('PASS: 85 bundled vehicle images and metadata, finite axle layouts, accurate T3 stock battery/power/speed');
