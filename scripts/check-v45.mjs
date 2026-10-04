import assert from 'node:assert/strict';
import {getRiderPose,distance,solveLimb} from '../src/lib/riderPose.js';
import {WHEELIE_TRICKS} from '../src/lib/wheelieTricks.js';
const layout=[16.5,88.5,86.5,89.2,18.4,36,8,80];
for(const pitch of [0,20,55,69,79,95])for(const {id:trick} of WHEELIE_TRICKS){
 const pose=getRiderPose(layout,{pitch,trick});
 for(const [i,limbs] of [pose.arms,pose.legs].entries())for(const [a,b,c] of limbs){assert(Math.abs(distance(a,b)-(i?26:16))<1e-6);assert(Math.abs(distance(b,c)-(i?25:16))<1e-6);assert([...a,...b,...c].every(Number.isFinite));}
 if(trick==='normal')for(const [i,arm] of pose.arms.entries())assert(distance(arm[2],[36+i*1.8,8+i])<.01,'gripped hand must remain on the handlebars');
}
const unreachable=solveLimb([0,0],[300,0],16,16);assert(distance(unreachable[0],unreachable[2])<32);
const normal=getRiderPose(layout);const seated=getRiderPose(layout,{moto:true});assert(seated.hip[1]>normal.hip[1]);
console.log('PASS v45: fixed limb lengths across all 18 tricks and six pitch angles, no invalid joints, both normal-wheelie hands meet grips, unreachable targets never stretch, motorcycle sitting pose.');
