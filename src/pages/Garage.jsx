import {useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {VEHICLES} from '../lib/vehicleData';
import {useLanguage} from '../lib/i18n';
import {FAULTS,SYMPTOMS,normalizeFault,repairWorkshopComponent,getWorkshopHealth} from '../lib/workshopDiagnostics';
import RepairGame from '../components/RepairGame';
import WorkshopDiagnostics from '../components/workshop/WorkshopDiagnostics';
import ComponentThumbnail from '../components/workshop/ComponentThumbnail';
import VehicleRideArt from '../components/VehicleRideArt';
import {getBuild} from '../lib/buildState';
import '../styles/workshop.css';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}};
const getRespect=()=>Math.max(0,Number(localStorage.getItem('kukirin_respect'))||0);
export default function Garage(){
 const navigate=useNavigate(),{language}=useLanguage(),et=language==='et',text=(en,ee)=>et?ee:en;
 const [entries,setEntries]=useState(()=>read('kukirin_broken_parts',[])),[respect,setRespect]=useState(getRespect),[diagnostic,setDiagnostic]=useState(null),[activeRepair,setActiveRepair]=useState(null),[message,setMessage]=useState('');
 const [vehicleId,setVehicleId]=useState(()=>entries[0]?.vehicleId||'sebius_redbull_g2');
 const vehicle=VEHICLES.find(v=>v.id===vehicleId)||VEHICLES[0],commit=useRef(false);
 const physical=entries.map(normalizeFault).filter(e=>!e.diagnosticOnly);
 const symptoms=[...entries.filter(e=>normalizeFault(e).diagnosticOnly),...read('kukirin_symptoms',[])];
 const beginRepair=component=>{const def=FAULTS[component],balance=getRespect();if(balance<def.cost){setMessage(text('Not enough REP for this repair.','Selle remondi jaoks pole piisavalt REP-i.'));return;}
  const raw=diagnostic?.entry||{},sourceIndex=entries.indexOf(raw);commit.current=false;
  setActiveRepair({part:{...raw,vehicleId:diagnostic.vehicle.id,vehicleName:diagnostic.vehicle.name,component,condition:getWorkshopHealth(diagnostic.vehicle.id).conditions[component],visualKind:component,part:def.part,code:'FAULT_'+component.toUpperCase()},sourceIndex,cost:def.cost});setDiagnostic(null);
 };
 const finish=bonus=>{if(!activeRepair||commit.current)return;const balance=getRespect();if(balance<activeRepair.cost){setMessage(text('REP balance changed. Repair was not saved.','REP-i saldo muutus. Remonti ei salvestatud.'));setActiveRepair(null);return;}
  commit.current=true;const part=activeRepair.part,list=read('kukirin_broken_parts',[]).filter(e=>!(e.vehicleId===part.vehicleId&&normalizeFault(e).component===part.component));
  // A diagnosed legacy symptom is archived only after the actual repair succeeds.
  const source=entries[activeRepair.sourceIndex];if(source&&normalizeFault(source).diagnosticOnly){const idx=list.findIndex(e=>e.vehicleId===source.vehicleId&&e.code===source.code&&e.date===source.date);if(idx>=0)list.splice(idx,1);}
  localStorage.setItem('kukirin_broken_parts',JSON.stringify(list));repairWorkshopComponent(part.vehicleId,part.component);
  localStorage.setItem('kukirin_respect',String(balance-activeRepair.cost+Math.max(0,Math.min(activeRepair.cost*.5,bonus))));setEntries(list);setRespect(getRespect());setActiveRepair(null);setMessage(text('Repair saved. Component condition restored.','Remont salvestatud. Komponendi seisukord taastatud.'));
 };
 const resolve=()=>{const raw=diagnostic.entry;const matches=e=>e.vehicleId===raw.vehicleId&&e.code===raw.code&&e.date===raw.date;
  const list=read('kukirin_broken_parts',[]).filter(e=>!matches(e));localStorage.setItem('kukirin_broken_parts',JSON.stringify(list));localStorage.setItem('kukirin_symptoms',JSON.stringify(read('kukirin_symptoms',[]).filter(e=>!matches(e))));
  const reports=read('kukirin_diagnostic_reports',[]);localStorage.setItem('kukirin_diagnostic_reports',JSON.stringify([{...raw,result:'no-component-fault',inspectedAt:new Date().toISOString()},...reports].slice(0,60)));setEntries(list);setDiagnostic(null);setMessage(text('Inspection saved; no part was replaced or charged.','Kontroll salvestatud; ühtegi juppi ei vahetatud ega tasu võetud.'));
 };
 const inspect=entry=>{const target=VEHICLES.find(v=>v.id===entry?.vehicleId)||vehicle;setMessage('');setDiagnostic({vehicle:target,entry});};
 return <div className="app-surface min-h-screen bg-background text-foreground">
  <header className="app-header"><div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3"><button onClick={()=>navigate('/',{replace:true})}>← {text('Back','Tagasi')}</button><h1 className="font-bold">{text('Repair workshop','Remonditöökoda')}</h1><strong className="ml-auto text-primary">{respect} REP</strong></div></header>
  <main className="workshop-diagnostics">
   <h2>{text('Inspect. Find the cause. Repair.','Kontrolli. Leia põhjus. Paranda.')}</h2><p>{physical.length} {text('physical faults','füüsilist riket')} · {symptoms.length} {text('symptom reports','sümptomi teadet')}</p>
   <label>{text('Vehicle','Sõiduk')}<select className="w-full p-3 my-3 bg-card border border-border rounded-lg" value={vehicle.id} onChange={e=>setVehicleId(e.target.value)}>{VEHICLES.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
   <div className="workshop-vehicle"><div className="workshop-scooter-square"><VehicleRideArt vehicle={vehicle} build={getBuild(vehicle.id)} showRider={false} speed={0} moving={false}/></div><small>{vehicle.name}</small></div>
   <button className="diagnostic-inspection" onClick={()=>inspect(null)}>{text('Open component diagnostics','Ava komponentide diagnostika')}</button>
   <p className="diagnostic-status" role="status">{message}</p>
   <h3 className="my-4 font-bold">{text('Confirmed component faults','Komponentide rikked')}</h3>
   {!physical.length&&<p>{text('No broken components recorded.','Katkiseid komponente pole registreeritud.')}</p>}
   <div className="diagnostic-cards">{entries.map((raw,i)=>{const fault=normalizeFault(raw);if(fault.diagnosticOnly)return null;const def=FAULTS[fault.component];return <article key={i} className="diagnostic-card"><ComponentThumbnail part={{...fault,id:'fault-'+fault.component,name:et?def.et:def.en}}/><h3>{et?def.et:def.en}</h3><p>{raw.vehicleName||raw.vehicleId}</p><div className="condition-bar"><i className="faulty" style={{width:'12%'}}/></div><button onClick={()=>inspect(raw)}>{text('Inspect & repair','Kontrolli ja paranda')} · {def.cost} REP</button></article>;})}</div>
   <h3 className="my-4 font-bold">{text('Symptoms — diagnose the cause','Sümptomid — leia põhjus')}</h3>
   <div className="diagnostic-cards">{symptoms.map((raw,i)=>{const fault=normalizeFault(raw);return <article key={i} className="diagnostic-card"><h3>{SYMPTOMS[fault.symptom]?.[et?1:0]||raw.code}</h3><p>{raw.vehicleName||raw.vehicleId}</p><p>{text('A symptom is not a broken component.','Sümptom ei ole katkine komponent.')}</p><button onClick={()=>inspect(raw)}>{text('Diagnose','Diagnoosi')}</button></article>;})}</div>
  </main>
  {diagnostic&&<WorkshopDiagnostics key={diagnostic.vehicle.id} vehicle={diagnostic.vehicle} entry={diagnostic.entry} onRepair={beginRepair} onResolved={resolve} onCancel={()=>setDiagnostic(null)}/>}
  {activeRepair&&<RepairGame brokenPart={activeRepair.part} vehicleName={activeRepair.part.vehicleName} repairCost={activeRepair.cost} onComplete={finish} onCancel={()=>setActiveRepair(null)}/>}
 </div>;
}
