import {useEffect,useRef,useState} from 'react';
import {useLanguage} from '../lib/i18n';
import {WORKSHOP_PHOTOS} from '../lib/bodywork';
export default function WeldingJob({title,description,onComplete,onCancel}) {
 const {language}=useLanguage();const text=(en,et)=>language==='et'?et:en;
 const [stage,setStage]=useState(0),[running,setRunning]=useState(false),[progress,setProgress]=useState(0);
 const committed=useRef(false);
 useEffect(()=>{
  if(!running)return;
  const start=performance.now();const timer=setInterval(()=>{
   const value=Math.min(100,Math.round((performance.now()-start)/30));setProgress(value);
   if(value===100){clearInterval(timer);setRunning(false);setStage(2);}
  },50);
  return ()=>clearInterval(timer);
 },[running]);
 const photo=stage===2?WORKSHOP_PHOTOS.inspect:WORKSHOP_PHOTOS.weld;
 const steps=[text('Prepare','Ettevalmistus'),text('Weld','Keevitus'),text('Inspect','Kontroll')];
 return <section className="welding-job" aria-label={text('Welding job','Keevitustöö')}>
  <div className="welding-job-heading"><strong>{title}</strong><button type="button" onClick={onCancel}>{text('Cancel','Katkesta')}</button></div><p>{description}</p>
  <ol className="welding-steps">{steps.map((label,i)=><li key={i} aria-current={i===stage?'step':undefined} data-done={i<stage}>{i+1}. {label}</li>)}</ol>
  <figure><img src={photo.src} alt={text('Real metalworking process photograph','Päris metallitöö protsessi foto')}/><figcaption>{text('Process reference photo','Tööprotsessi näidisfoto')} · <a href={photo.url} target="_blank" rel="noreferrer">{photo.author}</a> · {photo.licenseUrl?<a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>:photo.license}</figcaption></figure>
  <p role="status">{stage===0?text('Prepare the mounting surface and align the new section.','Valmista ette kinnituspind ja joonda uus osa.'):stage===1?text('The build changes after the final inspection.','Ehitus muutub pärast lõplikku kontrolli.'):text('Weld completed. Inspect and finish to apply this change.','Keevitus valmis. Kontrolli ja lõpeta, et muudatus rakenduks.')}</p>
  {running&&<progress aria-label={text('Welding progress','Keevituse edenemine')} value={progress} max="100"/>}
  <button type="button" className="upgrade-primary" disabled={running} onClick={()=>{
   if(stage===0)setStage(1);else if(stage===1){setProgress(0);setRunning(true);}else if(!committed.current){committed.current=true;onComplete();}
  }}>{running?`${text('Welding','Keevitan')} ${progress}%`:stage===0?text('Prepare surfaces','Valmista pinnad ette'):stage===1?text('Start welding','Alusta keevitamist'):text('Inspect & finish','Kontrolli ja lõpeta')}</button>
 </section>;
}
