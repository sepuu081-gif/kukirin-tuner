import fs from 'node:fs';import {VEHICLES} from '../src/lib/vehicleData.js';import {getVehiclePhoto} from '../src/lib/vehiclePhotos.js';
const existing=Object.fromEntries(VEHICLES.map(v=>[v.id,getVehiclePhoto(v)]).filter(([,p])=>p).map(([id,file])=>[id,{file:file.split('/').at(-1),kind:'photo'}]));fs.writeFileSync('../../outputs/v39-existing-metadata.json',JSON.stringify(existing,null,2));
