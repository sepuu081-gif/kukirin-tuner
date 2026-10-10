const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const out='C:/Users/sebas/Documents/ChatGPT/kukirin tuner/qa-v67';
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const c=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',hasTouch:true});
 await c.addInitScript(()=>{for(const [k,v] of Object.entries({kukirin_rider_name:'QA',kukirin_name_started:'true',kukirin_language:'en',kukirin_leaderboard_url:'off',kukirin_cloud_server_v60:'true'}))localStorage.setItem(k,v);});
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://**/*',r=>r.abort());await p.goto('http://127.0.0.1:5173/#/build/g2_2026');
 const baseline=await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('kukirin_builds')).g2_2026));
 const cats=['motor','controller','battery','bms','wheel','gearing','suspension','brakes','damper','wheelie_bar','vesc_display','electronics','cooling','screen_delete'];
 for(const kind of cats){await p.goto('http://127.0.0.1:5173/#/build/'+(kind==='gearing'?'surron_light_bee_x':'g2_2026'));await p.locator('.part-slot').nth(cats.indexOf(kind)).click();await p.locator('.part-card').first().click();await p.locator('.component-workbench').waitFor();assert.equal(await p.locator('.component-workbench').getAttribute('data-kind'),kind);await p.locator('.component-canvas canvas').waitFor();assert(await p.locator('.component-workbench').evaluate(e=>e.scrollWidth<=e.clientWidth+1));if(['battery','controller','brakes','wheelie_bar'].includes(kind)){await p.locator('.component-workbench').evaluate(e=>e.scrollTop=220);await p.screenshot({path:out+'/'+kind+'-inspection.png'});}await p.getByRole('button',{name:'Close workshop'}).click();}
 assert.equal(await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('kukirin_builds')).g2_2026)),baseline,'cancel must preserve build');
 await p.goto('http://127.0.0.1:5173/#/build/g2_2026');await p.locator('.part-slot').first().click();await p.locator('.part-card').first().click();await p.locator('.component-canvas').scrollIntoViewIfNeeded();
 const stage=p.locator('.component-canvas'),box=await stage.boundingBox();await p.mouse.move(box.x+80,box.y+100);await p.mouse.down();await p.mouse.move(box.x+160,box.y+100,{steps:5});await p.mouse.up();await p.waitForTimeout(400);const angle=Number(await stage.getAttribute('data-orbit'));await p.waitForTimeout(400);assert(Math.abs(Number(await stage.getAttribute('data-orbit'))-angle)<.05,'drag rotation persists');assert(Math.abs(angle)>.3);
 await p.getByRole('button',{name:'Reset view'}).click();await p.waitForTimeout(500);assert(Math.abs(Number(await stage.getAttribute('data-orbit')))<.08);
 await p.getByRole('button',{name:'Close workshop'}).click();
 const assembly=[];
 for(const type of ['motor','controller','battery']){
  await p.goto('http://127.0.0.1:5173/#/build/g2_2026?tab=custom');await p.getByRole('button',{name:type[0].toUpperCase()+type.slice(1),exact:true}).click();
  if(type==='battery'){await p.getByPlaceholder('52',{exact:true}).fill('48');await p.getByPlaceholder('20',{exact:true}).fill('12');}
  await p.getByRole('button',{name:'Add Custom '+type,exact:true}).click();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_custom_parts')||'[]').length),assembly.length);
  await p.getByRole('button',{name:'Start assembly',exact:true}).click();
  if(type==='motor'){
   await stage.scrollIntoViewIfNeeded();const d=await stage.boundingBox();await p.mouse.move(d.x+d.width*.8,d.y+d.height*.3);await p.mouse.down();await p.mouse.move(d.x+d.width*.5,d.y+d.height*.5,{steps:6});await p.mouse.up();await p.getByRole('button',{name:'Confirm placement',exact:true}).click();
  }
  await p.getByRole('button',{name:'Animate all pieces',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.component-workbench')?.dataset.phase==='test',{},{timeout:45000});
  await p.locator('.component-workbench').evaluate(e=>e.scrollTop=0);await p.screenshot({path:out+'/'+type+'-assembled.png'});
  const frames=Number(await stage.getAttribute('data-frame'));await p.waitForTimeout(1000);const fps=Number(await stage.getAttribute('data-frame'))-frames;
  await p.getByRole('button',{name:'Replay animation',exact:true}).click();assert.equal(await p.locator('.component-workbench').getAttribute('data-phase'),'assemble');await p.waitForFunction(()=>document.querySelector('.component-workbench')?.dataset.phase==='test',{},{timeout:45000});
  await p.getByRole('button',{name:'Confirm & save',exact:true}).click();assembly.push({type,fps});assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_custom_parts')).length),assembly.length);
 }
 // Uninstall is animated and cannot clear the equipped part before confirmation.
 await p.goto('http://127.0.0.1:5173/#/build/g2_2026');await p.locator('.part-card').first().click();await p.getByRole('button',{name:'Begin installation'}).click();await p.getByRole('button',{name:'Install component'}).click();await p.getByRole('button',{name:'Confirm & save'}).click();
 console.log('assembly finished',assembly);await p.getByRole('button',{name:/Remove ·/}).click();await p.getByRole('button',{name:'Begin removal'}).click();await p.getByRole('button',{name:'Remove from mount'}).click();await p.getByRole('button',{name:'Confirm & save'}).click();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_builds')).g2_2026.parts.motor),null);
 const fallback=await b.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});await fallback.addInitScript(()=>{for(const [k,v] of Object.entries({kukirin_rider_name:'QA',kukirin_name_started:'true',kukirin_language:'en',kukirin_leaderboard_url:'off',kukirin_cloud_server_v60:'true'}))localStorage.setItem(k,v);const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(/webgl/.test(type))return null;return get.call(this,type,...args);};});
 console.log('starting vector fallback');const q=await fallback.newPage();q.on('pageerror',e=>errors.push(e.message));await q.route('https://**/*',r=>r.abort());await q.goto('http://127.0.0.1:5173/#/build/sebius_redbull_g2');await q.locator('.part-card').first().click();await q.locator('.component-canvas svg').waitFor();assert(await q.locator('.component-canvas svg path').count()>5);await q.screenshot({path:out+'/desktop-vector-fallback.png'});await q.getByRole('button',{name:'Begin installation'}).click();await q.getByRole('button',{name:'Install component'}).click();await q.getByRole('button',{name:'Confirm & save'}).click();assert.equal(await q.locator('.component-workbench').count(),0);
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/interactions.json',JSON.stringify({categories:cats,assembly,errors,vectorFallback:true},null,2));console.log('PASS 14 categories, cancel, drag/rotate/reset, full motor/controller/cell-by-cell battery assembly, replay, uninstall and desktop vector fallback',assembly);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
