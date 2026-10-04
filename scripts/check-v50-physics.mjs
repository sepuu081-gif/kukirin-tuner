import assert from 'node:assert/strict';
import {newPark,stepPark,wheelieBalance} from '../src/lib/stuntPark.js';
let p=newPark();for(let i=0;i<1100;i++)p=stepPark(p,{speed:30,zone:'ramps'});assert(p.jumps>=10);assert(p.bestJump>.3);assert(p.airTime>0);assert(p.height>=0);
let flat=newPark();for(let i=0;i<500;i++)flat=stepPark(flat,{speed:30,zone:'wheelie'});assert.equal(flat.jumps,0);assert.equal(flat.height,0);
assert.equal(wheelieBalance(55).status,'balanced');assert.equal(wheelieBalance(65,45).status,'brake');assert.equal(wheelieBalance(80).status,'scrape');assert.equal(wheelieBalance(100).status,'loop');console.log('PASS park ramp takeoff/landing/repeat laps, flat lane, predictive balance statuses.');
