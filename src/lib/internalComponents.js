import {assemblyRecipe} from './workshopParts';
import {customPowerAllowed} from './playerAccount';
// All ratings below are virtual workshop models, not manufacturer specifications.
export const INTERNAL_MODELS=[
 {id:'standard',name:'Workshop Standard',maker:'Tuner Works',rating:1,capacity:1,color:'#6d93a5',price:4,format:'standard'},
 {id:'performance',name:'Sprint Pro',maker:'VoltLab (virtual)',rating:1.18,capacity:.92,color:'#a481ba',price:9,format:'standard'},
 {id:'endurance',name:'Endurance Plus',maker:'RangeLab (virtual)',rating:.94,capacity:1.22,color:'#729c79',price:7,format:'standard'},
 {id:'incompatible',name:'XL / different interface',maker:'Workshop experimental',rating:1.4,capacity:1.4,color:'#d88750',price:12,format:'different'}
];
export function slotType(key){return key.startsWith('cell-')?'cell':key.replace(/-[0-9]+$/,'');}
export function internalize(part){
 if(part.internalBuild)return structuredClone(part);
 const series=Math.max(1,Math.round((part.voltage||48)/3.6)),parallel=Math.max(1,Math.round((part.capacity||12)/3));
 const next={...part,baseSpecs:{...part},internalBuild:{version:1,series,parallel,slots:{}}};
 for(const step of assemblyRecipe(next))next.internalBuild.slots[step.key]={model:'standard',condition:100};
 return next;
}
export function optionFor(slot){return INTERNAL_MODELS.find(m=>m.id===slot?.model)||INTERNAL_MODELS[0];}
export function internalWarnings(part){
 if(!part.internalBuild)return [];
 const warnings=[];if(part.category==='battery'&&part.internalBuild.series*part.internalBuild.parallel>240)warnings.push({key:'cells',reason:'capacitylimit'});
 for(const step of assemblyRecipe(part)){
  const slot=part.internalBuild.slots[step.key];
  if(!slot)warnings.push({key:step.key,reason:'missing'});
  else if(optionFor(slot).format!=='standard')warnings.push({key:step.key,reason:'interface'});
  else if(slot.condition<=0)warnings.push({key:step.key,reason:'worn'});
 }
 const cells=Object.entries(part.internalBuild.slots).filter(([k,v])=>k.startsWith('cell-')&&v);
 if(new Set(cells.map(([,s])=>s.model)).size>1)warnings.push({key:'cells',reason:'mixed'});
 return warnings;
}
export function calculateInternalPart(input){
 const part=internalize(input),base=part.baseSpecs,slots=part.internalBuild.slots;
 const scores=Object.entries(slots).map(([key,s])=>({key,score:s?optionFor(s).rating*Math.max(0,s.condition)/100:0}));
 const factor=scores.length?Math.pow(scores.reduce((n,s)=>n*Math.max(.01,s.score),1),1/scores.length):1;
 const warnings=internalWarnings(part),blocked=warnings.some(w=>w.reason!=='mixed');
 part.internalValid=!blocked;part.internalWarnings=warnings;part.internalRating=factor;
 if(part.category==='battery'){
  const {series,parallel}=part.internalBuild;
  let weakest=Infinity,discharge=Infinity;
  for(let row=0;row<series;row++){
   let ah=0,amps=0;
   for(let col=0;col<parallel;col++){
    const s=slots['cell-'+(row*parallel+col)];
    if(s){ah+=(base.capacity/parallel)*optionFor(s).capacity*s.condition/100;amps+=((base.maxDischargeAmps||base.capacity*5)/parallel)*optionFor(s).rating*s.condition/100;}
   }
   weakest=Math.min(weakest,ah);discharge=Math.min(discharge,amps);
  }
  part.capacity=Number(Math.max(.001,weakest).toFixed(3));
  part.maxDischargeAmps=Math.max(.001,Math.min(discharge,(base.maxDischargeAmps||base.capacity*5)*(slots.bms?optionFor(slots.bms).rating*slots.bms.condition/100:0)));
  part.voltage=base.voltage;part.heatFactor=(base.heatFactor||1)/Math.max(.1,factor);
 }else if(part.category==='motor'){
  part.watts=Math.max(.001,Math.round(base.watts*factor));
  // Preserve the existing drive specification's default speed at the baseline.
  const reference=base.noLoadSpeed||32+32*Math.sqrt((base.watts||600)/1000);
  const winding=slots.windings?optionFor(slots.windings).rating*slots.windings.condition/100:0;
  part.noLoadSpeed=reference*Math.sqrt(Math.max(.01,winding*factor));
 }else if(part.category==='controller')part.maxAmps=Math.max(.001,Number((base.maxAmps*factor).toFixed(2)));
 if(blocked){if(part.category==='battery')part.maxDischargeAmps=.001;if(part.category==='motor')part.watts=.001;if(part.category==='controller')part.maxAmps=.001;}
 return part;
}
export function saveInternalPart(part){
 const ready=calculateInternalPart(part);
 if(!customPowerAllowed(ready))throw new Error('custom_power_limit');
 let parts;try{parts=JSON.parse(localStorage.getItem('kukirin_custom_parts')||'[]');}catch{parts=[];}
 localStorage.setItem('kukirin_custom_parts',JSON.stringify([...parts.filter(p=>p.id!==ready.id),ready]));
 let builds;try{builds=JSON.parse(localStorage.getItem('kukirin_builds')||'{}');}catch{builds={};}
 for(const b of Object.values(builds))for(const [key,p] of Object.entries(b.parts||{}))if(p?.id===ready.id)b.parts[key]=ready;
 localStorage.setItem('kukirin_builds',JSON.stringify(builds));
 return ready;
}
