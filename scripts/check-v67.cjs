const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const out='C:/Users/sebas/Documents/ChatGPT/kukirin tuner/qa-v67';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const c=await browser.newContext({viewport:{width:390,height:844}});
 await c.addInitScript(()=>{for(const [k,v] of Object.entries({kukirin_rider_name:'QA',kukirin_name_started:'true',kukirin_language:'en',kukirin_leaderboard_url:'off',kukirin_cloud_server_v60:'true',kukirin_respect:'1000'}))localStorage.setItem(k,v);});
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://**/*',r=>r.abort());
 await p.goto('http://127.0.0.1:5173');
 const models=await p.evaluate(async()=>{
  const {COMPONENT_KINDS,assemblyRecipe}=await import('/src/lib/workshopParts.js');
  const {createWorkshopModel}=await import('/src/lib/workshopModels.js');
  const {PARTS_CATALOG,BMS_CATALOG}=await import('/src/lib/vehicleData.js');
  const {FAULTS,normalizeFault,recordFaultIncident,recordWorkshopUsage,getWorkshopHealth}=await import('/src/lib/workshopDiagnostics.js');
  const {REPAIR_FLOWS}=await import('/src/lib/repairData.js');
  const {VEHICLE_MEDIA}=await import('/src/lib/vehicleMediaData.js');
  const parts=[...PARTS_CATALOG,...BMS_CATALOG.map(p=>({...p,category:'bms'})),{id:'screen_delete_full',category:'screen_delete',screenKit:true},...COMPONENT_KINDS.map(k=>({id:'test-'+k,visualKind:k}))];
  const checked=parts.map(part=>{const m=createWorkshopModel(part);let meshes=0;m.root.traverse(o=>{if(o.isMesh)meshes++;});const report={id:part.id,kind:m.kind,steps:m.recipe.length,nodes:m.nodes.length,meshes,empty:m.nodes.some(n=>!n.children.length)};m.dispose();return report;});
  const bat=assemblyRecipe({category:'battery',voltage:48,capacity:12});
  localStorage.setItem('kukirin_broken_parts','[]');recordFaultIncident({vehicleId:'sebius_redbull_g2',vehicleName:'Sebuu G2',code:'ERR_SPEED_WOBBLE',part:'damper',date:'test'});
  const symptomDoesNotBreak=JSON.parse(localStorage.getItem('kukirin_broken_parts')).length===0;
  const legacy=normalizeFault({code:'ERR_SPEED_WOBBLE',part:'damper'}),physical=normalizeFault({code:'ERR_MOTOR_BEARING',part:'motor'});
  recordWorkshopUsage('g4',{id:'wear-test',reason:'complete',samples:[],summary:{distanceKm:10}});
  const wear10=getWorkshopHealth('g4');recordWorkshopUsage('g4',{id:'wear-test',reason:'complete',samples:[],summary:{distanceKm:10}});const wearDuplicate=getWorkshopHealth('g4');
  return {checked,cells:bat.filter(s=>s.key.startsWith('cell-')).length,faultFlowCoverage:Object.keys(FAULTS).every(k=>REPAIR_FLOWS[k]),photo:VEHICLE_MEDIA.sebius_redbull_g2.file,legacy,physical,symptomDoesNotBreak,wear10,wearDuplicate};
 });
 assert(models.checked.every(m=>!m.empty&&m.meshes>0&&m.nodes===m.steps));assert(models.faultFlowCoverage);assert.equal(models.cells,52);assert.equal(models.photo,'sebuu-g2-original.png');assert(models.legacy.diagnosticOnly);assert.equal(models.physical.component,'bearings');assert(models.symptomDoesNotBreak);assert.equal(models.wear10.km,10);assert.equal(models.wearDuplicate.km,10);assert(models.wear10.conditions.tyre>99);
 await p.goto('http://127.0.0.1:5173/#/build/sebius_redbull_g2');
 await p.locator('.part-card').first().click();
 await p.locator('.component-workbench').waitFor();await p.locator('.component-canvas canvas').waitFor();await p.waitForTimeout(700);
 assert(await p.locator('.component-workbench').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await p.screenshot({path:out+'/motor-phone.png',fullPage:false});
 await p.getByRole('button',{name:'Begin installation',exact:true}).click();
 await p.getByRole('button',{name:'Install component',exact:true}).click();await p.getByRole('button',{name:'Confirm & save',exact:true}).click();
 assert.equal(await p.locator('.component-workbench').count(),0);
 const installed=await p.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_builds')).sebius_redbull_g2.parts.motor);assert(installed);
 // Legacy symptoms must lead to inspections, never direct wobble repair.
 await p.goto('http://127.0.0.1:5173/#/repair');
 await p.getByRole('button',{name:'Diagnose',exact:true}).first().click();
 assert.equal(await p.getByRole('button',{name:/Repair.*wobble/i}).count(),0);
 await p.locator('.diagnostic-modal .diagnostic-card').first().getByRole('button',{name:'Inspect',exact:true}).click();await p.waitForTimeout(1000);
 await p.screenshot({path:out+'/diagnostics-phone.png',fullPage:false});
 await p.getByRole('button',{name:'Close diagnostics',exact:true}).click();
 await p.evaluate(()=>localStorage.setItem('kukirin_broken_parts',JSON.stringify([{vehicleId:'sebius_redbull_g2',vehicleName:'Sebuu G2',component:'pads',code:'FAULT_PADS',date:'qa'}])));
 await p.reload();await p.getByRole('button',{name:'Inspect & repair',exact:false}).click();await p.getByRole('button',{name:'Run component test',exact:true}).click();await p.waitForTimeout(1000);await p.getByRole('button',{name:'Repair this component',exact:false}).click();
 await p.getByRole('button',{name:'Inspect & start',exact:true}).click();await p.getByRole('button',{name:'Switch off & isolate',exact:true}).click();
 await p.screenshot({path:out+'/repair-phone.png',fullPage:false});
 for(const [index,tool,count,adjust] of [[0,'allen',2,null],[1,'hands',1,null],[2,'hands',1,50],[3,'allen',2,70]]){
  assert.equal(await p.locator('.repair-workshop').getAttribute('data-step'),String(index));await p.locator('[data-tool="'+tool+'"]').click();
  if(adjust!==null)await p.locator('.repair-adjust input').evaluate((el,v)=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},adjust);
  for(let i=0;i<count;i++){const point=p.locator('.component-hotspots [data-point="'+i+'"]');const box=await point.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.waitForTimeout(750);await p.mouse.up();}
  await p.getByRole('button',{name:'Next step',exact:true}).click();
 }
 for(let i=0;i<3;i++){await p.locator('[data-check="'+i+'"]').click();await p.waitForTimeout(900);}
 await p.getByRole('button',{name:'Finish inspection',exact:true}).click();await p.getByRole('button',{name:'Save repair & return',exact:true}).click();
 const saved=await p.evaluate(()=>({faults:JSON.parse(localStorage.getItem('kukirin_broken_parts')),rep:Number(localStorage.getItem('kukirin_respect')),health:JSON.parse(localStorage.getItem('kukirin_workshop_health_v1'))}));
 assert.equal(saved.faults.length,0);assert.equal(saved.rep,985);assert.equal(saved.health.sebius_redbull_g2.conditions.pads,100);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/report.json',JSON.stringify({modelCount:models.checked.length,models,saved,errors},null,2));console.log('PASS',models.checked.length,'component models; phone installation, diagnostics, physical repair, wear dedup, save/REP preservation.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
