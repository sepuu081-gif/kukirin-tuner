import {damageEnabled} from './gameSettings';
export const FAULTS={
 pads:{en:'Worn brake pads',et:'Kulunud piduriklotsid',part:'brakes',cost:30,life:2400,symptoms:['brake_noise','weak_braking'],test:['Pad wear inspection','Piduriklotside kulumise kontroll']},
 rotor:{en:'Bent brake disc',et:'Kõver piduriketas',part:'brakes',cost:30,life:16000,symptoms:['brake_noise','vibration'],test:['Rotor runout test','Piduriketta viskumise test']},
 bearings:{en:'Worn wheel bearings',et:'Kulunud rattalaagrid',part:'motor',cost:50,life:9000,symptoms:['vibration','wobble'],test:['Wheel bearing play test','Rattalaagri lõtku test']},
 throttle:{en:'Faulty throttle',et:'Katkine gaasinupp',part:'electronics',cost:35,life:24000,symptoms:['uneven_motor','low_acceleration'],test:['Throttle signal sweep','Gaasinupu signaali kontroll']},
 hall:{en:'Faulty Hall sensor',et:'Vigane Hall-andur',part:'motor',cost:50,life:30000,symptoms:['uneven_motor','low_acceleration'],test:['Virtual Hall signal test','Virtuaalne Hall-signaali test']},
 motor_sensor:{en:'Motor sensor fault',et:'Mootori anduririke',part:'motor',cost:50,life:32000,symptoms:['uneven_motor'],test:['Sensor plausibility check','Mootori anduri näidu kontroll']},
 controller:{en:'Controller fault',et:'Vigane kontroller',part:'controller',cost:80,life:40000,symptoms:['uneven_motor','low_acceleration'],test:['Controller self-test','Kontrolleri enesetest']},
 cell_balance:{en:'Cell imbalance',et:'Aku elementide tasakaaluprobleem',part:'battery',cost:100,life:16000,symptoms:['low_range','low_acceleration'],test:['Virtual cell balance test','Virtuaalne elementide tasakaalu test']},
 fork_seal:{en:'Leaking suspension seal',et:'Amordi lekkimine',part:'suspension',cost:40,life:12000,symptoms:['wobble','bar_shake'],test:['Suspension seal inspection','Vedrustuse tihendi kontroll']},
 steering_bearing:{en:'Loose headset bearing',et:'Lõtk roolilaagris',part:'chassis',cost:60,life:7500,symptoms:['wobble','bar_shake'],test:['Headset play test','Roolilaagri lõtku test']},
 tyre:{en:'Worn tyre',et:'Kulunud rehv',part:'wheel',cost:30,life:4500,symptoms:['wobble','low_range','vibration'],test:['Tread and pressure check','Rehvimustri ja rõhu kontroll']},
 charge_port:{en:'Faulty charge socket',et:'Vigane laadimispesa',part:'electronics',cost:35,life:45000,symptoms:['charging'],test:['Virtual socket check','Virtuaalne laadimispesa kontroll']},
 headlight:{en:'Broken headlight',et:'Katkine esituli',part:'electronics',cost:35,life:60000,symptoms:['no_light'],test:['Light output check','Esitule töö kontroll']},
 winding:{en:'Damaged motor winding',et:'Kahjustatud mootorimähis',part:'motor',cost:50,life:40000,symptoms:['uneven_motor','low_acceleration'],test:['Virtual winding check','Virtuaalne mähise kontroll']},
 wiring:{en:'Damaged wiring module',et:'Kahjustatud juhtmestik',part:'electronics',cost:35,life:35000,symptoms:['uneven_motor'],test:['Virtual connector check','Virtuaalne pistikute kontroll']},
 chassis:{en:'Damaged frame joint',et:'Kahjustatud raami ühendus',part:'chassis',cost:60,life:60000,symptoms:['bar_shake'],test:['Frame alignment inspection','Raami joondumise kontroll']},
 kickstand:{en:'Faulty stand latch',et:'Vigane tugijala fiksaator',part:'chassis',cost:60,life:30000,symptoms:['vibration'],test:['Stand latch inspection','Tugijala fiksaatori kontroll']},
};
export const SYMPTOMS={wobble:['Speed wobble','Kiiruse võnkumine'],vibration:['Vibration','Vibratsioon'],uneven_motor:['Uneven motor running','Mootori ebaühtlane töötamine'],low_acceleration:['Reduced acceleration','Vähenenud kiirendus'],low_range:['Reduced range','Vähenenud sõiduulatus'],brake_noise:['Brake noise','Pidurdamisel tekkiv müra'],bar_shake:['Handlebar shaking','Juhtraua värisemine'],weak_braking:['Weak braking','Nõrk pidurdus'],charging:['Charging interrupted','Laadimine katkeb'],no_light:['No headlight','Esituli ei põle']};
const LEGACY={ERR_MOTOR_MELT:'winding',ERR_ESC_EXPLODE:'controller',ERR_ESC_OVERCURRENT:'controller',ERR_CELL_VENT:'cell_balance',ERR_CELL_IMBALANCE:'cell_balance',ERR_TIRE_BLOWOUT:'tyre',ERR_MOTOR_BEARING:'bearings',ERR_HALL_DROPOUT:'hall',ERR_PHASE_SHORT:'wiring',ERR_WATER_INGRESS:'wiring',ERR_THROTTLE_STUCK:'throttle',ERR_NECK_CRACK:'chassis',ERR_FOLD_COLLAPSE:'chassis',ERR_AXLE_PULL:'bearings',ERR_KICKSTAND_DEPLOY:'kickstand',ERR_WHEEL_BEARING:'bearings',ERR_STRUT_SNAP:'chassis',ERR_REGEN_OVERCHARGE:'controller',ERR_VESC_TIMEOUT:'wiring'};
const SYMPTOM_CODES={ERR_SPEED_WOBBLE:'wobble',ERR_BRAKE_FADE:'weak_braking',ERR_BMS_CUTOFF:'low_acceleration',ERR_UNDERVOLTAGE_SAG:'low_acceleration',ERR_DKP_KICKBACK:'uneven_motor'};
const KEY='kukirin_workshop_health_v1';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}}
export function normalizeFault(entry){const component=entry.component||LEGACY[entry.code];if(FAULTS[component]&&!entry.diagnosticOnly)return {...entry,component,part:FAULTS[component].part,visualKind:component,diagnosticOnly:false};const symptom=entry.symptom||SYMPTOM_CODES[entry.code];return {...entry,component:undefined,symptom:symptom||'uneven_motor',diagnosticOnly:true};}
export function getWorkshopHealth(vehicleId){const all=read(KEY,{}),saved=all[vehicleId]||{};const conditions={...Object.fromEntries(Object.keys(FAULTS).map(k=>[k,100])),...saved.conditions};for(const raw of read('kukirin_broken_parts',[]).filter(e=>e.vehicleId===vehicleId)){const f=normalizeFault(raw);if(f.component&&raw.source!=='usage')conditions[f.component]=Math.min(conditions[f.component]??100,12);}const tyres=read('kukirin_tires_'+vehicleId,{}),wheelId=read('kukirin_builds',{})[vehicleId]?.parts?.wheel?.id||'stock';if(tyres.wheelId===wheelId)conditions.tyre=Math.min(conditions.tyre,100-Math.max(Number(tyres.frontWear)||0,Number(tyres.rearWear)||0));return {...saved,conditions,inspected:saved.inspected||{},km:saved.km||0};}
function writeHealth(vehicleId,state){const all=read(KEY,{});all[vehicleId]=state;localStorage.setItem(KEY,JSON.stringify(all));}
export function inspectComponent(vehicleId,component){const state=getWorkshopHealth(vehicleId);state.inspected[component]=Date.now();writeHealth(vehicleId,state);return state.conditions[component];}
export function diagnosisCandidates(entry){const f=normalizeFault(entry);return f.component?[f.component]:Object.keys(FAULTS).filter(k=>FAULTS[k].symptoms.includes(f.symptom));}
export function repairWorkshopComponent(vehicleId,component){const state=getWorkshopHealth(vehicleId);state.conditions[component]=100;state.inspected[component]=Date.now();state.history=[{component,date:new Date().toISOString()},...(state.history||[])].slice(0,60);writeHealth(vehicleId,state);if(component==='tyre'){const tyres=read('kukirin_tires_'+vehicleId,{});if(tyres.wheelId)localStorage.setItem('kukirin_tires_'+vehicleId,JSON.stringify({...tyres,frontWear:0,rearWear:0}));}const wear=read('kukirin_wear_'+vehicleId,{});if(FAULTS[component]){wear[FAULTS[component].part]=0;localStorage.setItem('kukirin_wear_'+vehicleId,JSON.stringify(wear));}}
export function recordWorkshopUsage(vehicleId,log){
 if(!damageEnabled()||log.summary?.practice||['training','garage-test','stunt-park'].includes(log.reason))return;
 const state=getWorkshopHealth(vehicleId);if(state.lastLog===log.id)return;
 const samples=log.samples||[];let km=0,braking=0,hot=0,escHeat=0,batteryHeat=0;
 for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i],dt=Math.max(0,Math.min(2,b.t-a.t));km+=(Math.max(0,a.speed)+Math.max(0,b.speed))*.5*dt/3600;braking+=Math.max(0,a.speed-b.speed)*dt;hot+=Math.max(0,(b.motorTemp||25)-100)*dt/3600;escHeat+=Math.max(0,(b.escTemp||25)-85)*dt/3600;batteryHeat+=Math.max(0,(b.batteryTemp||25)-55)*dt/3600;}
 km=Math.max(km,Number(log.summary?.distanceKm)||0);
 const build=read('kukirin_builds',{})[vehicleId]||{};const priorDamage=Math.min(1,Object.values(read('kukirin_wear_'+vehicleId,{})).reduce((sum,n)=>sum+(Number(n)||0),0));
 const list=read('kukirin_broken_parts',[]);
 for(const [key,def] of Object.entries(FAULTS)){
  const quality=Math.min(1.4,1+(build.parts?.[def.part]?.price||0)/2500);
  const usage=km+(key==='pads'?braking*.006:0)+(['hall','motor_sensor','winding'].includes(key)?hot*.8:key==='controller'?escHeat*.8:key==='cell_balance'?batteryHeat*1.2:0);
  const before=state.conditions[key];state.conditions[key]=Math.max(0,before-usage/def.life*100*(1+priorDamage*.15)/quality);
  if(state.conditions[key]<=18&&!list.some(e=>e.vehicleId===vehicleId&&normalizeFault(e).component===key))list.push({component:key,part:def.part,code:'FAULT_'+key.toUpperCase(),vehicleId,vehicleName:log.vehicleName,date:new Date().toISOString(),source:'usage'});
 }
 state.km+=km;state.lastLog=log.id;writeHealth(vehicleId,state);localStorage.setItem('kukirin_broken_parts',JSON.stringify(list));
}

export function recordFaultIncident(entry,{confirmed=false}={}){let normalized=normalizeFault(entry);if(!confirmed&&!normalized.diagnosticOnly&&getWorkshopHealth(entry.vehicleId).conditions[normalized.component]>18)normalized={...entry,component:undefined,diagnosticOnly:true,suspectedComponent:normalized.component,symptom:FAULTS[normalized.component].symptoms[0]};const key=normalized.diagnosticOnly?'kukirin_symptoms':'kukirin_broken_parts',list=read(key,[]);if(!list.some(e=>e.vehicleId===entry.vehicleId&&e.code===entry.code))list.push(normalized);localStorage.setItem(key,JSON.stringify(list));return normalized;}
