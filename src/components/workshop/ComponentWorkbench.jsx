import {useEffect,useRef,useState} from 'react';
import ComponentScene from './ComponentScene';
import ComponentThumbnail from './ComponentThumbnail';
import VehicleRideArt from '../VehicleRideArt';
import {assemblyRecipe,componentKind,mountFor} from '../../lib/workshopParts';
import {useLanguage} from '../../lib/i18n';
import {getVehiclePhotoInfo} from '../../lib/vehiclePhotos';
import {getWorkshopHealth} from '../../lib/workshopDiagnostics';
import '../../styles/workshop.css';

export default function ComponentWorkbench({part,vehicle,build,mode='install',fits=true,onComplete,onCancel,onNeedsWeld}){
 const {language}=useLanguage(),et=language==='et',text=(en,ee)=>et?ee:en,kind=componentKind(part),recipe=assemblyRecipe(part);
 const [automatic,setAutomatic]=useState(false),[phase,setPhase]=useState('inspect'),[index,setIndex]=useState(0),[progress,setProgress]=useState(0),[busy,setBusy]=useState(false),[aligned,setAligned]=useState(false),[turn,setTurn]=useState(0),[zoom,setZoom]=useState(1.2),[pan,setPan]=useState([0,0]),[cutaway,setCutaway]=useState(true),[rotation,setRotation]=useState(0),[replay,setReplay]=useState(0);
 useEffect(()=>{if(phase==='test')setZoom(1.25);},[phase]);
 const closeRef=useRef(onCancel);closeRef.current=onCancel;
 const raf=useRef(null),once=useRef(false),alive=useRef(true),dialog=useRef(null),restoreFocus=useRef(null);
 useEffect(()=>{alive.current=true;restoreFocus.current=document.activeElement;const old=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.focus();const key=e=>{if(e.key==='Escape')closeRef.current();if(e.key==='Tab'){const elements=[...dialog.current.querySelectorAll('button:not(:disabled),input')];const first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',key);return()=>{alive.current=false;cancelAnimationFrame(raf.current);document.body.style.overflow=old;window.removeEventListener('keydown',key);restoreFocus.current?.focus?.();};},[]);
 const animate=done=>{if(busy)return;setBusy(true);setProgress(0);const start=performance.now();const tick=t=>{if(!alive.current)return;const p=Math.min(1,(t-start)/(matchMedia('(prefers-reduced-motion: reduce)').matches?140:700));setProgress(p*p*(3-2*p));if(p<1)raf.current=requestAnimationFrame(tick);else{setBusy(false);done();}};raf.current=requestAnimationFrame(tick);};
 const start=()=>{setIndex(0);setProgress(0);setAligned(false);setZoom(1);setPhase(mode==='assembly'?'assemble':mode==='uninstall'||(kind==='bms'?build?.bms:build?.parts?.[part.category||kind])?'remove':'mount');};
 const next=()=>{if(phase==='remove'){animate(()=>{setPhase(mode==='uninstall'?'test':'mount');setProgress(mode==='uninstall'?1:0);});return;}
  if(phase==='mount'){animate(()=>{setPhase('test');setProgress(1);});return;}
  animate(()=>{if(index+1===recipe.length){setPhase(mode==='assembly'?'test':fits?'mount':'inspect');setProgress(mode==='assembly'?1:0);}else{setIndex(n=>n+1);setAligned(false);setProgress(0);}});
 };
 useEffect(()=>{if(!automatic||phase!=='assemble'||busy)return;const timer=setTimeout(()=>{setAligned(true);setRotation(0);next();},250);return()=>clearTimeout(timer);},[automatic,phase,busy,index]);
 const save=()=>{if(once.current)return;once.current=true;onComplete(part);};
 const health=vehicle?getWorkshopHealth(vehicle.id):null,wear=Math.round(100-(health?.conditions[kind]??100));
 const mount=mountFor(kind,vehicle),media=vehicle&&getVehiclePhotoInfo(vehicle);
 const displayedPart=phase==='remove'?(kind==='bms'?build?.bms:build?.parts?.[kind])||part:part;
 const action=phase==='assemble'?'place':phase==='remove'?'remove':phase==='mount'?'install':'inspect';
 return <div ref={dialog} tabIndex={-1} className="component-workbench" role="dialog" aria-modal="true" aria-label={text('Component workshop','Komponendi töökoda')} data-phase={phase} data-kind={kind}>
  <header className="workshop-header"><div><small>{text('COMPONENT WORKSHOP','KOMPONENDI TÖÖKODA')}</small><h2>{part.name}</h2></div><button onClick={onCancel} aria-label={text('Close workshop','Sulge töökoda')}>✕</button></header>
  <div className="workshop-layout">
   <section className="workshop-visual">
    {vehicle&&<div className={`workshop-vehicle phase-${phase}`}>
     <div className="workshop-scooter-square"><VehicleRideArt vehicle={vehicle} build={build} appearance={build?.appearance} showRider={false} speed={0} moving={false}/>
     <span className="workshop-mount" style={{left:`${mount[0]}%`,top:`${mount[1]}%`}} aria-label={text('Mounting area','Paigalduskoht')}/>{(['mount','remove'].includes(phase)&&busy)&&<div className="workshop-moving-part" style={{left:mount[0]+'%',top:mount[1]+'%',transform:`translate(-50%,-50%) translateX(${phase==='remove'?-90*progress:90*(1-progress)}px) scale(${.35*(1-progress)+.12})`,opacity:phase==='remove'?1-progress:Math.max(0,1-progress*.85)}}><ComponentThumbnail part={displayedPart}/></div>}</div>
     <small>{vehicle.name} · {text('Mounting area','Paigalduskoht')}</small>
     {media?.originalReference&&<a href={media.originalReference} target="_blank" rel="noreferrer">{text('Original photo','Algne foto')}</a>}
    </div>}
    <ComponentScene key={replay} part={displayedPart} index={phase==='assemble'?index:-1} action={action} progress={progress} test={phase==='test'} cutaway={cutaway} turn={turn} onRotate={setTurn} onZoom={setZoom} pieceRotation={rotation} zoom={zoom} pan={pan} wear={phase==='remove'?wear:0} aligned={aligned} onAlign={setAligned}/>
    <div className="workshop-camera"><button onClick={()=>setTurn(v=>v-30)} aria-label={text('Rotate left','Pööra vasakule')}>↶</button><input type="range" min="-180" max="180" value={turn} onChange={e=>setTurn(Number(e.target.value))} aria-label={text('360 degree view','360 kraadi vaade')}/><button onClick={()=>setTurn(v=>v+30)} aria-label={text('Rotate right','Pööra paremale')}>↷</button><button onClick={()=>setZoom(v=>Math.min(1.8,v+.15))} aria-label={text('Zoom in','Suurenda')}>＋</button><button onClick={()=>setZoom(v=>Math.max(.65,v-.15))} aria-label={text('Zoom out','Vähenda')}>−</button></div>
    <div className="workshop-options"><label><input type="checkbox" checked={cutaway} onChange={e=>setCutaway(e.target.checked)}/>{text('Exploded view','Lahtivõetud vaade')}</label><button onClick={()=>setPan(p=>[p[0]===0?.6:0,p[1]===0?.25:0])}>{text('Move camera','Liiguta kaamerat')}</button><button onClick={()=>{setTurn(0);setZoom(1);setPan([0,0]);setRotation(0);}}>{text('Reset view','Taasta vaade')}</button></div>
   </section>
   <section className="workshop-controls">
    <dl className="workshop-specs">{[['Voltage','Pinge',part.voltage,'V'],['Power','Võimsus',part.watts,'W'],['Current','Vool',part.maxAmps,'A'],['Capacity','Mahtuvus',part.capacity,'Ah'],['Mass','Mass',part.weight,'kg'],['Price','Hind',part.price,''],['Wear','Kulumine',wear,'%']].filter(row=>row[2]!==undefined).map(([en,ee,value,unit])=><div key={en}><dt>{text(en,ee)}</dt><dd>{value} {unit}</dd></div>)}<div><dt>{text('Compatibility','Ühilduvus')}</dt><dd>{fits?text('Fits this build','Sobib ehitusega'):text('Frame work required','Vajab raami muutmist')}</dd></div></dl>
    <p>{part.desc}</p>
    {phase==='inspect'&&<><h3>{text('Inspect before installing','Vaata jupp enne paigaldust üle')}</h3><p>{text('Drag to rotate, pinch to zoom. Internal layouts are game illustrations.','Pööra lohistades ja suurenda kahe sõrmega. Sisemised paigutused on mängu visualiseeringud.')}</p><button onClick={()=>{setIndex(0);setProgress(0);setAligned(false);setPhase('assemble');}}> {text('Explore internal assembly','Uuri sisemist ehitust')}</button><button className="workshop-primary" disabled={!fits} onClick={start}>{mode==='assembly'?text('Start assembly','Alusta ehitamist'):mode==='uninstall'?text('Begin removal','Alusta eemaldamist'):text('Begin installation','Alusta paigaldust')}</button>{!fits&&onNeedsWeld&&<button onClick={()=>onNeedsWeld(part)}>{text('Open frame workshop','Ava raami töökoda')}</button>}</>}
    {phase==='assemble'&&<><button onClick={()=>setAutomatic(v=>!v)}>{automatic?text('Pause automatic assembly','Peata automaatne ehitus'):text('Animate all pieces','Animeeri kõik detailid')}</button><small>{index+1} / {recipe.length}</small><h3>{et?recipe[index].et:recipe[index].en}</h3><progress max={recipe.length} value={index}/><p>{text('The selected piece is in the tray. Drag it to the glowing mount or align it with the button.','Valitud detail on töölaual. Lohista see helendavasse pesasse või joonda nupuga.')}</p><label>{text('Piece rotation','Detaili pööramine')}<input type="range" min="-180" max="180" value={rotation} onChange={e=>setRotation(Number(e.target.value))}/></label><button disabled={busy} onClick={()=>{setAligned(true);setRotation(0);setProgress(0);}}>{text('Align piece','Joonda detail')}</button><button className="workshop-primary" disabled={busy||!aligned} onClick={next}>{busy?text('Installing…','Paigaldan…'):text('Confirm placement','Kinnita paigaldus')}</button></>}
    {phase==='remove'&&<><h3>{text('Remove the existing part','Eemalda olemasolev jupp')}</h3><button className="workshop-primary" disabled={busy} onClick={next}>{text('Remove from mount','Eemalda pesast')}</button></>}
    {phase==='mount'&&<><h3>{text('Install at the highlighted mount','Paigalda märgitud kohale')}</h3><p>{text('Confirm to move the complete component into its mounting position.','Kinnita, et valmis komponent liiguks paigalduskohale.')}</p><button className="workshop-primary" disabled={busy} onClick={next}>{text('Install component','Paigalda komponent')}</button></>}
    {phase==='test'&&<><h3>{text('Functional test','Töökatse')}</h3><p>{text('Inspect the completed assembly and its moving mechanism.','Vaata valmis süsteemi ja selle töötavat mehhanismi.')}</p><button onClick={()=>{setReplay(v=>v+1);setIndex(0);setPhase(mode==='assembly'?'assemble':mode==='uninstall'?'remove':'mount');setProgress(0);setAligned(false);}}>{text('Replay animation','Vaata animatsiooni uuesti')}</button><button className="workshop-primary" onClick={save}>{text('Confirm & save','Kinnita ja salvesta')}</button></>}
    <small className="workshop-game-only">{text('Virtual game assembly · not an electrical assembly guide','Virtuaalne mänguehitus · ei ole elektriseadme kokkupaneku juhis')}</small>
   </section>
  </div>
 </div>;
}
