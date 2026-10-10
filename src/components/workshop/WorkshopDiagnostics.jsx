import {useEffect,useRef,useState} from 'react';
import {FAULTS,SYMPTOMS,getWorkshopHealth,inspectComponent,diagnosisCandidates,normalizeFault} from '../../lib/workshopDiagnostics';
import {getBuild} from '../../lib/buildState';
import {useLanguage} from '../../lib/i18n';
import {mountFor} from '../../lib/workshopParts';
import VehicleRideArt from '../VehicleRideArt';
import ComponentScene from './ComponentScene';
import ComponentThumbnail from './ComponentThumbnail';
import '../../styles/workshop.css';

export default function WorkshopDiagnostics({vehicle,entry,onRepair,onResolved,onCancel}){
 const {language}=useLanguage(),et=language==='et',text=(en,ee)=>et?ee:en;
 const candidates=entry?diagnosisCandidates(entry):Object.keys(FAULTS),fault=entry&&normalizeFault(entry),build=getBuild(vehicle.id);
 const [health,setHealth]=useState(()=>getWorkshopHealth(vehicle.id)),[selected,setSelected]=useState(candidates[0]),[checking,setChecking]=useState(null),[tested,setTested]=useState({}),[turn,setTurn]=useState(0),[zoom,setZoom]=useState(1);
 const timer=useRef(null),close=useRef(onCancel);close.current=onCancel;
 useEffect(()=>{const old=document.body.style.overflow;document.body.style.overflow='hidden';const key=e=>{if(e.key==='Escape')close.current();};window.addEventListener('keydown',key);return()=>{clearTimeout(timer.current);document.body.style.overflow=old;window.removeEventListener('keydown',key);};},[]);
 const inspect=key=>{if(checking)return;setSelected(key);setChecking(key);timer.current=setTimeout(()=>{const condition=inspectComponent(vehicle.id,key);setTested(t=>({...t,[key]:condition}));setHealth(getWorkshopHealth(vehicle.id));setChecking(null);},900);};
 const def=FAULTS[selected],mount=mountFor(selected,vehicle),model={...(build.parts?.[def.part]||{}),id:'diagnose-'+selected,visualKind:selected,name:et?def.et:def.en};
 const allTested=candidates.every(k=>tested[k]!==undefined),healthy=allTested&&candidates.every(k=>tested[k]>25);
 return <div className="diagnostic-modal" role="dialog" aria-modal="true" aria-label={text('Vehicle diagnostics','Sõiduki diagnostika')}>
  <header><div><small>{text('DIAGNOSTICS','DIAGNOSTIKA')}</small><h2>{vehicle.name}</h2></div><button onClick={onCancel} aria-label={text('Close diagnostics','Sulge diagnostika')}>✕</button></header>
  <main className="workshop-layout"><div className="workshop-visual">
   <div className="workshop-vehicle"><div className="workshop-scooter-square"><VehicleRideArt vehicle={vehicle} build={build} appearance={build.appearance} showRider={false} speed={0} moving={false}/><span className="workshop-mount" style={{left:mount[0]+'%',top:mount[1]+'%'}}/></div><small>{text('Inspect the actual component','Kontrolli tegelikku komponenti')}</small></div>
   <ComponentScene part={model} wear={tested[selected]!==undefined?100-health.conditions[selected]:0} cutaway={true} test={checking===selected} turn={turn} onRotate={setTurn} onZoom={setZoom} zoom={zoom}/>
   <div className="workshop-camera"><button aria-label="Rotate left" onClick={()=>setTurn(v=>v-30)}>↶</button><button aria-label="Rotate right" onClick={()=>setTurn(v=>v+30)}>↷</button><button onClick={()=>setZoom(v=>Math.min(1.8,v+.15))}>＋</button><button onClick={()=>setZoom(v=>Math.max(.65,v-.15))}>−</button></div>
   <section className="workshop-controls"><h3>{et?def.et:def.en}</h3><p>{def.test[et?1:0]}</p><button className="workshop-primary" disabled={!!checking} onClick={()=>inspect(selected)}>{checking===selected?text('Testing…','Kontrollin…'):text('Run component test','Kontrolli komponenti')}</button>
    <p className="diagnostic-reading" role="status">{tested[selected]!==undefined?`${text('Condition','Seisukord')}: ${Math.round(health.conditions[selected])}% · ${health.conditions[selected]<=25?text('Fault confirmed','Rike kinnitatud'):text('No fault detected','Riket ei leitud')}`:text('A symptom alone does not prove this part is broken.','Sümptom üksi ei tõesta, et see jupp on katki.')}</p>
    {tested[selected]!==undefined&&health.conditions[selected]<=25&&<button onClick={()=>onRepair(selected)}>{text('Repair this component','Paranda see komponent')} · {def.cost} REP</button>}
   </section>
  </div><section className="workshop-controls">
   <h3>{text('Symptoms & possible causes','Sümptomid ja võimalikud põhjused')}</h3>
   {fault?.symptom&&<div className="diagnostic-symptoms"><span>{SYMPTOMS[fault.symptom]?.[et?1:0]||fault.code}</span></div>}
   <p>{text('Inspect each possible cause. Only a confirmed physical fault can be repaired.','Kontrolli võimalikke põhjuseid. Parandada saab kinnitatud füüsilist riket.')}</p>
   <div className="diagnostic-cards">{candidates.map(k=><article key={k} className={`diagnostic-card ${selected===k?'diagnostic-selected':''}`}><button className="diagnostic-part-select" onClick={()=>setSelected(k)} aria-label={et?FAULTS[k].et:FAULTS[k].en}><ComponentThumbnail part={{id:'fault-'+k,visualKind:k,name:et?FAULTS[k].et:FAULTS[k].en}}/><h3>{et?FAULTS[k].et:FAULTS[k].en}</h3></button><div className="condition-bar"><i className={tested[k]!==undefined&&tested[k]<=25?'faulty':''} style={{width:tested[k]!==undefined?health.conditions[k]+'%':'0%'}}/></div><p className="diagnostic-reading">{tested[k]!==undefined?`${Math.round(health.conditions[k])}%`:text('Not inspected','Kontrollimata')}</p><button disabled={!!checking} onClick={()=>inspect(k)}>{checking===k?'…':text('Inspect','Kontrolli')}</button></article>)}</div>
   {healthy&&<p>{text('No broken component found. Check tyre pressure, setup and road conditions; wobble can also occur without a broken part.','Katkist komponenti ei leitud. Kontrolli rehvirõhku, seadistust ja teeolusid; võnkumine võib tekkida ka terve tõuksiga.')}</p>}
   {healthy&&fault?.diagnosticOnly&&<button className="workshop-primary" onClick={onResolved}>{text('Save inspection report','Salvesta kontrolli aruanne')}</button>}
   <small className="workshop-game-only">{text('Game diagnostics · not a real vehicle safety inspection','Mängu diagnostika · ei ole päris sõiduki ohutuskontroll')}</small>
  </section></main>
 </div>;
}
