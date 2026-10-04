import {useState} from 'react';
import {useLanguage} from '../lib/i18n';
import {BODYWORK_PROJECTS,canDoBodywork,completeBodywork,WORKSHOP_PHOTOS} from '../lib/bodywork';
import {calcBuildStats,getMaxFrameSize} from '../lib/buildState';
import WeldingJob from './WeldingJob';
export default function BodyworkWorkshop({build,vehicle,onBuildChange}) {
 const {language}=useLanguage();const text=(en,et)=>language==='et'?et:en;
 const [job,setJob]=useState(null),[message,setMessage]=useState('');
 const stats=calcBuildStats(vehicle,build);
 if(job)return <WeldingJob key={job.id} title={text(job.en,job.et)} description={text('Structural bodywork for','Keretöö mudelile')+' '+vehicle.name} onCancel={()=>setJob(null)} onComplete={()=>{
  onBuildChange(current=>completeBodywork(current,vehicle,job.id));setMessage(text('Bodywork completed and saved.','Keretöö valmis ja salvestatud.'));setJob(null);
 }}/>;
 return <section className="bodywork-workshop" aria-label={text('Bodywork','Keretööd')}>
  <p>{text('Structural changes need welding. Paint, LEDs and stickers remain separate.','Kere ümberehitus vajab keevitamist. Värv, LED-id ja kleebised on eraldi.')}</p>
  <div className="bodywork-current"><span>{text('Frame capacity','Raami mahutavus')} <b>{getMaxFrameSize(vehicle,build.weldCount||0)}/10</b></span><span>{text('Durability','Vastupidavus')} <b>{stats.durability.toFixed(0)}/100</b></span></div>
  {message&&<p role="status">{message}</p>}
  <div className="bodywork-projects">{BODYWORK_PROJECTS.map(project=>{
   const allowed=canDoBodywork(build,vehicle,project.id),nextBuild=completeBodywork(build,vehicle,project.id),next=calcBuildStats(vehicle,nextBuild);
   const photo=project.id==='deck_extension'?WORKSHOP_PHOTOS.weld:WORKSHOP_PHOTOS.inspect;
   return <article key={project.id} className="bodywork-project" data-project={project.id}>
    <img src={photo.src} alt={text('Metalworking reference','Metallitöö näidis')}/><h3>{text(project.en,project.et)}</h3>
    <p>{project.id==='deck_extension'?text('More room for oversized batteries and controllers.','Rohkem ruumi suurtele akudele ja kontrolleritele.'):text('Reinforce the frame joints for better durability.','Tugevda raami ühendusi ja suurenda vastupidavust.')}</p>
    <dl><div><dt>{text('Weight','Mass')}</dt><dd>{stats.totalWeight.toFixed(1)} → {next.totalWeight.toFixed(1)} kg</dd></div><div><dt>{text('Durability','Vastupidavus')}</dt><dd>{stats.durability.toFixed(1)} → {next.durability.toFixed(1)}</dd></div>{project.id==='deck_extension'&&<div><dt>{text('Frame capacity','Mahutavus')}</dt><dd>{getMaxFrameSize(vehicle,build.weldCount||0)} → {getMaxFrameSize(vehicle,nextBuild.weldCount||0)}</dd></div>}</dl>
    <button type="button" className="upgrade-primary" disabled={!allowed} onClick={()=>{setMessage('');setJob(project);}}>{allowed?text('Start bodywork','Alusta keretööd'):text('Completed','Valmis')}</button>
   </article>;
  })}</div>
  <details className="bodywork-sources"><summary>{text('Photo sources','Fotode allikad')}</summary>{Object.values(WORKSHOP_PHOTOS).map(photo=><p key={photo.src}><a href={photo.url} target="_blank" rel="noreferrer">{photo.author} — {photo.license}</a>{photo.licenseUrl&&<> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{text('License','Litsents')}</a></>}</p>)}</details>
 </section>;
}
