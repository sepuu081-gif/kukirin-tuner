import assert from 'node:assert/strict';
import {getRiderPose,distance} from '../src/lib/riderPose.js';
import {getVehicleHandGrips} from '../src/lib/vehiclePhotos.js';
const layout=[16.5,88.5,86.5,89.2,18.4,36,8,80],grips=getVehicleHandGrips({id:'g2_2026'},layout);
const worldY=(p,pitch)=>p[0]*Math.sin(pitch*Math.PI/180)+p[1]*Math.cos(pitch*Math.PI/180);
for(let pitch=0;pitch<=95;pitch++){
 const pose=getRiderPose(layout,{pitch,grips});
 for(const [i,[start,elbow,hand]] of pose.arms.entries()){
  assert(distance(hand,grips[i])<.01,`hand detached at ${pitch}`);
  assert(Math.abs(distance(start,elbow)-16)<1e-6&&Math.abs(distance(elbow,hand)-16)<1e-6);
  assert(worldY(elbow,pitch)>=Math.min(worldY(start,pitch),worldY(hand,pitch))-.01,`elbow bends upward at ${pitch}`);
  assert(worldY(elbow,pitch)>worldY(pose.head,pitch)+3,`elbow over head at ${pitch}`);
 }
}
console.log('PASS v46: both hands on photo grips, fixed bone lengths, elbows bend down in world space and remain below the head at every pitch 0-95 degrees, including 43.');
