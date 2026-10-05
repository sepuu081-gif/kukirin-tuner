import { useState, useEffect, useRef } from 'react';
import { X, Wrench, CheckCircle, Power, ShieldCheck } from 'lucide-react';
import { VEHICLES, FAILURE_CODES } from '../lib/vehicleData';
import { getRepairFlow, REPAIR_TOOLS } from '../lib/repairData';
import { getVehiclePhoto } from '../lib/vehiclePhotos';
import { useLanguage } from '../lib/i18n';

const TOOL_ET={wrench:'Mutrivõti',allen:'Kuuskantvõti',pliers:'Tangid',driver:'Kruvikeeraja',drill:'Akutrell',levers:'Rehviheeblid',welder:'Keevitus',grinder:'Lihvija',brush:'Traathari',hands:'Käed',paste:'Termopasta'};
const STEP_ET={jack:'Tõsta sõiduk alusele',axle:'Eemalda teljemutter',pull:'Eemalda ratas',tire:'Võta vana rehv maha',newtire:'Paigalda uus rehv',mount:'Paigalda ratas',tighten:'Pinguta kinnitused',lower:'Langeta sõiduk',phase1:'Ühenda mootorijuhtmed lahti',reconnect:'Ühenda pistikud tagasi',bolt1:'Vabasta klambripoldid',clean:'Puhasta kahjustatud pind',tack:'Tee kolm punktkeevitust',weld:'Keevita ühendus',grind:'Viimistle keevis',screws:'Vabasta platvormi kruvid',panel:'Tõsta platvormi kaas',cables:'Ühenda pistikud lahti',vscrews:'Vabasta kontrolleri kinnitused',paste:'Kanna termopasta pinnale',vscrew2:'Pinguta kontrolleri kinnitused',panel2:'Sulge platvormi kaas',screws2:'Pinguta platvormi kruvid',bms:'Ühenda aku pistik lahti',bscrews:'Vabasta aku kinnitused',bscrew2:'Pinguta aku kinnitused',escrews:'Vabasta mooduli kinnitused',escrew2:'Pinguta mooduli kinnitused'};
const PART_ET={wheel:'ratas',motor:'mootor',controller:'kontroller',battery:'aku',damper:'amort',chassis:'raam',electronics:'elektroonika'};
export function repairSteps(part){
 const steps=getRepairFlow(part).steps.filter(s=>s.id!=='test').map(s=>({...s,tool:['cables','bms'].includes(s.target)?'hands':s.tool}));
 if(part==='controller'){const index=steps.findIndex(s=>s.id==='paste');const [paste]=steps.splice(index,1);steps.splice(steps.findIndex(s=>s.id==='install'),0,paste);}
 return steps;
}
const isTightening=s=>['tighten','vscrew2','bscrew2','escrew2','screws2'].includes(s?.id);
const isAlignment=s=>s?.tool==='hands'&&['install','mount','reconnect','panel2'].includes(s.id);

export default function RepairGame({brokenPart,vehicleName,repairCost,onComplete,onCancel}){
 const {language}=useLanguage();const text=(en,et)=>language==='et'?et:en;
 const part=brokenPart?.part||'electronics',steps=repairSteps(part),stepCount=steps.length;
 const [stage,setStage]=useState('diagnose'),[index,setIndex]=useState(0),[tool,setTool]=useState(null),[done,setDone]=useState([]),[mistakes,setMistakes]=useState(0),[progress,setProgress]=useState(0),[adjust,setAdjust]=useState(0),[checks,setChecks]=useState([]),[message,setMessage]=useState('');
 const holding=useRef(null),timer=useRef(null),completed=useRef(false),doneRef=useRef([]);
 const step=steps[index],tight=isTightening(step),align=isAlignment(step),count=step?.count||1;
 const stop=()=>{clearInterval(timer.current);timer.current=null;holding.current=null;setProgress(0);};
 useEffect(()=>{const cancel=()=>{clearInterval(timer.current);timer.current=null;holding.current=null;setProgress(0);};const hidden=()=>{if(document.hidden)cancel();};window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',hidden);return()=>{clearInterval(timer.current);window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',hidden);};},[]);
 useEffect(()=>{const escape=e=>{if(e.key==='Escape'){clearInterval(timer.current);onCancel();}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[onCancel]);
 const error=()=>{setMistakes(n=>n+1);setMessage(text('Check the tool or adjustment and try again.','Kontrolli tööriista või seadistust ja proovi uuesti.'));};
 const finishTarget=id=>{if(doneRef.current.includes(id))return;const next=[...doneRef.current,id];doneRef.current=next;setDone(next);setMessage('');};
 const startHold=(id,event)=>{
  if(stage!=='work'||doneRef.current.includes(id)||holding.current!==null)return;
  if(tool!==step.tool){error();return;}
  if(tight||align){if(adjust<(tight?65:45)||adjust>(tight?78:55)){error();return;}finishTarget(id);return;}
  if(event.pointerId!==undefined)event.currentTarget.setPointerCapture(event.pointerId);
  holding.current=id;const started=performance.now(),duration=step.tool==='welder'?1500:step.tool==='grinder'?1100:650;
  timer.current=setInterval(()=>{const pct=Math.min(100,(performance.now()-started)/duration*100);setProgress(pct);if(pct>=100){clearInterval(timer.current);timer.current=null;holding.current=null;setProgress(0);finishTarget(id);}},30);
 };
 const advance=()=>{stop();doneRef.current=[];setDone([]);setAdjust(0);setTool(null);setMessage('');if(index+1===stepCount)setStage('verify');else setIndex(n=>n+1);};
 const vehicle=VEHICLES.find(v=>v.id===brokenPart?.vehicleId)||VEHICLES.find(v=>v.name===vehicleName)||VEHICLES[0];
 const photo=getVehiclePhoto(vehicle),welding=stage==='work'&&['welder','grinder','brush'].includes(step.tool);
 const fail=FAILURE_CODES.find(f=>f.code===brokenPart?.code);
 const toolIds=[...new Set(steps.map(s=>s.tool).concat(['wrench','driver','hands']))];
 const stars=mistakes===0?3:mistakes<=3?2:1,bonus=stars===3?Math.floor(repairCost*.5):stars===2?Math.floor(repairCost*.25):0;
 const checkNames=part==='wheel'?[['Free wheel rotation','Ratas pöörleb vabalt'],['Tyre seated evenly','Rehv on ühtlaselt veljel'],['Fasteners secure','Kinnitused püsivad']]:part==='chassis'?[['Weld inspection','Keevise kontroll'],['Frame alignment','Raami joondus'],['Load test','Koormustest']]:[['Connections seated','Pistikud on paigas'],['Mounting check','Kinnituste kontroll'],['Function test','Töö kontroll']];
 const [checking,setChecking]=useState(null);
 const checkTimer=useRef(null);
 useEffect(()=>()=>clearTimeout(checkTimer.current),[]);
 const runCheck=id=>{if(checking!==null||checks.includes(id))return;setChecking(id);checkTimer.current=setTimeout(()=>{setChecks(prev=>prev.includes(id)?prev:[...prev,id]);setChecking(null);},850);};
 const title=language==='et'?(step?.id==='remove'?`Eemalda vana ${PART_ET[part]||'jupp'}`:step?.id==='install'?`Paigalda uus ${PART_ET[part]||'jupp'}`:STEP_ET[step?.id]||'Ühenda pistikud'):step?.label;
 return <div className="repair-workshop" role="dialog" aria-modal="true" aria-label={text('Repair workshop','Remonditöökoda')} data-stage={stage} data-step={index}>
  <header><div><small>{text('WORKSHOP','TÖÖKODA')} · {brokenPart?.code}</small><h2>{vehicleName}</h2></div><button type="button" aria-label={text('Cancel repair','Katkesta remont')} onClick={()=>{stop();onCancel();}}><X size={22}/></button></header>
  <main>
   <div className={`repair-photo ${welding?'welding':''}`}><img src={welding?'/assets/workshop/tig-welding.jpg':photo} alt={welding?text('TIG welding reference','TIG-keevituse foto'):vehicleName}/><span>{welding?text('Welding reference','Keevituse näidis'):text('Vehicle reference','Sõiduki foto')}</span></div>
   <div className="repair-status"><span><Wrench size={15}/>{text('Repair','Remont')}: {PART_ET[part]&&language==='et'?PART_ET[part]:part}</span><span>{repairCost} REP</span></div>
   {stage==='diagnose'&&<section><h3>{text('Diagnose the fault','Kontrolli riket')}</h3><p>{fail?.name||brokenPart?.code} · {text('Inspect the damaged part before starting.','Kontrolli kahjustatud juppi enne töö alustamist.')}</p><button className="repair-primary" onClick={()=>setStage('isolate')}>{text('Inspect & start','Kontrolli ja alusta')}</button></section>}
   {stage==='isolate'&&<section><h3><Power size={18}/>{text('Power isolation','Toite väljalülitamine')}</h3><p>{text('The game vehicle must be switched off before repair.','Mängu sõiduk peab remondi ajaks olema välja lülitatud.')}</p><button className="repair-primary" onClick={()=>setStage('work')}>{text('Switch off & isolate','Lülita välja ja eralda toide')}</button></section>}
   {stage==='work'&&<section>
    <small>{text('STEP','SAMM')} {index+1} / {stepCount}</small><h3>{title}</h3><progress max={stepCount} value={index} aria-label={text('Repair progress','Remondi edenemine')}/>
    <div className="repair-tools" aria-label={text('Tools','Tööriistad')}>{toolIds.map(id=><button type="button" key={id} data-tool={id} aria-pressed={tool===id} onClick={()=>{stop();setTool(id);setMessage('');}}>{language==='et'?TOOL_ET[id]:REPAIR_TOOLS.find(t=>t.id===id)?.label}</button>)}</div>
    <p>{tight?text('Set tightening in the green band (65–78%).','Sea pingutus rohelisse vahemikku (65–78%).'):align?text('Align the part in the centre (45–55%).','Joonda jupp keskele (45–55%).'):text('Select the tool, then hold each work point until finished.','Vali tööriist ja hoia iga tööpunkti all kuni töö on tehtud.')}</p>
    {(tight||align)&&<label className="repair-adjust">{tight?text('Tightening','Pingutus'):text('Alignment','Joondus')} · {adjust}%<div className={`repair-adjust-track ${tight?'tight':''}`}><input type="range" min="0" max="100" value={adjust} aria-label={tight?'Tightening':'Alignment'} onChange={e=>setAdjust(Number(e.target.value))}/></div></label>}
    <div className="repair-workpoints">{Array.from({length:count},(_,id)=><button type="button" key={`${index}-${id}`} data-point={id} disabled={done.includes(id)} aria-label={`${text('Work point','Tööpunkt')} ${id+1}`} onPointerDown={e=>startHold(id,e)} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();startHold(id,e);}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter')stop();}} onBlur={stop}>{done.includes(id)?<CheckCircle size={20}/>:<Wrench size={20}/>}<span>{id+1}</span>{holding.current===id&&<progress max="100" value={progress}/>}</button>)}</div>
    <p className="repair-feedback" role="status">{message||`${done.length} / ${count} ${text('complete','valmis')}`}</p>
    <button className="repair-primary" disabled={done.length!==count} onClick={advance}>{text('Next step','Järgmine samm')}</button>
   </section>}
   {stage==='verify'&&<section><h3><ShieldCheck size={20}/>{text('Final checks','Lõppkontroll')}</h3><p>{text('Run every check before returning to the road.','Tee kõik kontrollid enne sõidu jätkamist.')}</p><div className="repair-checks">{checkNames.map(([en,et],id)=><button key={id} disabled={checks.includes(id)||checking!==null} onClick={()=>runCheck(id)} data-check={id}><span>{text(en,et)}</span><strong>{checks.includes(id)?'✓':checking===id?'…':'→'}</strong></button>)}</div><button className="repair-primary" disabled={checks.length!==3} onClick={()=>setStage('complete')}>{text('Finish inspection','Lõpeta kontroll')}</button></section>}
   {stage==='complete'&&<section><h3>{text('Repair complete','Remont valmis')} · {'★'.repeat(stars)}</h3><p>{text('Mistakes','Eksimusi')}: {mistakes} · {text('Quality bonus','Kvaliteediboonus')}: +{bonus} REP</p><button className="repair-primary" onClick={()=>{if(completed.current)return;completed.current=true;onComplete(bonus);}}>{text('Save repair & return','Salvesta remont ja tagasi')}</button></section>}
  </main>
 </div>;
}
