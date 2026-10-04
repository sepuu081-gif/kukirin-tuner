const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const {VEHICLES}=await import('../src/lib/vehicleData.js');const {getVehiclePhoto}=await import('../src/lib/vehiclePhotos.js');const {WHEELIE_TRICKS}=await import('../src/lib/wheelieTricks.js');
 assert.equal(VEHICLES.length,85);assert.equal(WHEELIE_TRICKS.length,18);assert.equal(new Set(VEHICLES.map(v=>v.id)).size,85);
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:360,height:740},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('kukirin_language','en');Math.random=()=>.1;});
 await page.clock.install();await page.goto('http://127.0.0.1:5173/#/telemetry/g4?stock=1');await page.getByRole('button',{name:/ENGAGE/}).click();
 await page.locator('.opaque-vehicle-photo[data-loaded="true"]').waitFor();assert.equal(await page.locator('.ride-scene-3d').count(),0,'real photo is initial preview');
 const pages=page.locator('.ride-trick-pages');assert.equal(await page.locator('.ride-trick-picker button').count(),6);
 await page.getByRole('button',{name:/Walk/}).click();
 const wb=await page.getByRole('button',{name:'WHEELIE',exact:true}).boundingBox();await page.mouse.move(wb.x+20,wb.y+20);await page.mouse.down();await page.clock.runFor(2000);
 const poses=new Set();let previous=Number(await page.locator('.ride-trick-badge').getAttribute('data-score'));
 for(const trick of WHEELIE_TRICKS){
  let button=page.locator('.ride-trick-picker').getByRole('button',{name:trick.label,exact:true});
  if(!await button.count()){await page.getByRole('button',{name:'Next tricks',exact:true}).focus();await page.keyboard.press('Enter');}
  await button.focus();await page.keyboard.press('Enter');await page.clock.runFor(1200);
  assert.equal(await page.locator('.photo-rider').getAttribute('data-trick'),trick.id);
  const current=Number(await page.locator('.ride-trick-badge').getAttribute('data-score'));assert(current>=previous);if(trick.id!=='normal')assert(current>previous,'new pose scores');
  previous=current;await page.clock.runFor(900);assert.equal(Number(await page.locator('.ride-trick-badge').getAttribute('data-score')),current,'no repeated idle scoring');
  poses.add(await page.locator('.photo-rider').evaluate(svg=>[...svg.querySelectorAll('path,g')].map(e=>e.getAttribute('d')||e.getAttribute('transform')||'').join('|')));
  const visible=await page.locator('.photo-rider').evaluate(svg=>{const preview=svg.closest('.ride-preview').getBoundingClientRect();const rects=[...svg.querySelectorAll('path')].map(p=>{const b=p.getBBox(),m=p.getScreenCTM();return [[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));}).flat();return Math.min(...rects.map(p=>p.y))>=preview.top+30&&Math.max(...rects.map(p=>p.x))<=preview.right;});assert(visible,trick.id+' should fit inside ride view');
  if(['starfish','heel-clicker','rocket'].includes(trick.id))await page.screenshot({path:'../../outputs/v37-'+trick.id+'.png'});
 }
 assert.equal(poses.size,18);await page.mouse.up();await page.clock.runFor(300);assert.equal(await page.locator('.photo-rider').getAttribute('data-trick'),'normal');
 for(const size of [{width:360,height:740},{width:390,height:844},{width:360,height:640}]){
  await page.setViewportSize(size);
  for(const selector of ['.ride-trick-panel','.ride-control-button','.ride-preview'])for(const el of await page.locator(selector).all()){
   const b=await el.boundingBox();assert(b.x>=-1&&b.x+b.width<=size.width+1,selector+' width');if(selector!=='.ride-preview')assert(b.y>=0&&b.y+b.height<=size.height+1,selector+' height');
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.setViewportSize({width:390,height:844});
 const photos=VEHICLES.filter(v=>getVehiclePhoto(v));
 for(const v of photos){
  await page.goto('http://127.0.0.1:5173/#/telemetry/'+v.id+'?stock=1');await page.getByRole('button',{name:/ENGAGE/}).click();
  await page.locator('.opaque-vehicle-photo[data-loaded="true"]').waitFor();assert.equal(await page.locator('.photo-wheel-spin[data-loaded="true"]').count(),2,v.id+' wheel images');
  assert.equal(await page.locator('.ride-trick-badge').count(),0,'new vehicle resets previous ride trick score');
  assert(await page.locator('.opaque-vehicle-photo').evaluate(c=>c.width>0&&c.height>0));
  if(['inmotion_rs','dt_city','dt_thunder3','g4'].includes(v.id))await page.screenshot({path:'../../outputs/v37-preview-'+v.id+'.png'});
 }
 const gpu=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});gpu.on('pageerror',e=>errors.push(e.message));
 await gpu.goto('http://127.0.0.1:5173/#/telemetry/g2_master?stock=1');await gpu.getByRole('button',{name:/ENGAGE/}).click();await gpu.getByRole('button',{name:'Toggle 3D ride preview'}).click();
 await gpu.locator('.ride-scene-3d[data-wheel-angle]').waitFor();assert.equal(await gpu.locator('.ride-scene-3d').getAttribute('data-motors'),'2');
 await gpu.screenshot({path:'../../outputs/v37-3d-after.png'});
 await gpu.getByRole('button',{name:'Toggle 3D ride preview'}).click();await gpu.locator('.opaque-vehicle-photo[data-loaded="true"]').waitFor();
 await gpu.getByRole('button',{name:'Toggle 3D ride preview'}).click();await gpu.locator('.ride-scene-3d[data-wheel-angle]').waitFor();
 assert.deepEqual(errors,[]);console.log(`PASS: ${photos.length} photo previews, 18 distinct scoring poses, three phone sizes, gas/wheelie release, page navigation, WebGL render, AWD and photo/3D round trip. No page errors.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
