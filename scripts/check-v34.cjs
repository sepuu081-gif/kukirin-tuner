const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const {WHEELIE_TRICKS}=await import('../src/lib/wheelieTricks.js');
 assert.equal(WHEELIE_TRICKS.length,10);
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:360,height:844},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.addInitScript(()=>{Math.random=()=>.1;});
 await page.goto('http://127.0.0.1:5173/');
 await page.evaluate(()=>{
  localStorage.setItem('kukirin_language','en');
  localStorage.setItem('kukirin_vehicle_charge',JSON.stringify({g2_2026:{pct:20,charging:false,updatedAt:Date.now()}}));
  localStorage.setItem('kukirin_broken_parts',JSON.stringify([{vehicleId:'g2_2026',part:'motor',code:'ERR_MOTOR_MELT'}]));
 });await page.reload();
 await page.getByRole('button',{name:'Codes',exact:true}).click();
 for(const code of ['STUNTMASTER','BALANCEPRO','COOLDOWN','FULLPACK','PITSTOP','REP1000']){
  await page.getByRole('textbox',{name:'Secret code'}).fill(code);
  await page.getByRole('button',{name:'Unlock',exact:true}).click();
  assert((await page.locator('body').innerText()).includes(code+' UNLOCKED'));
 }
 assert.equal(await page.evaluate(()=>Number(localStorage.getItem('kukirin_respect'))),1250);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_vehicle_charge')).g2_2026.pct),100);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_broken_parts'))),[]);
 await page.getByRole('textbox',{name:'Secret code'}).fill('REP1000');await page.getByRole('button',{name:'Unlock',exact:true}).click();
 assert((await page.locator('body').innerText()).includes('Already unlocked.'));
 assert.equal(await page.evaluate(()=>Number(localStorage.getItem('kukirin_respect'))),1250);
 await page.goto('http://127.0.0.1:5173/#/telemetry/g2_2026?stock=1');
 await page.evaluate(()=>{const schedule=setTimeout;window.setTimeout=(fn,delay,...args)=>schedule(fn,delay>20000&&delay<50000?3600000:delay,...args);});
 await page.getByRole('button',{name:/ENGAGE/}).click();
 const picker=page.getByRole('group',{name:'Wheelie tricks'});assert.equal(await picker.getByRole('button').count(),10);
 for(const button of await picker.getByRole('button').all()){
  const bounds=await button.boundingBox();
  assert(bounds.x>=0&&bounds.x+bounds.width<=360&&bounds.y>=0&&bounds.y+bounds.height<=844,'every trick button must be on screen');
 }
 const gas=await page.getByRole('button',{name:'WHEELIE',exact:true}).boundingBox();
 await page.mouse.move(gas.x+20,gas.y+20);await page.mouse.down();
 let score=0;const poses=new Set();
 for(const trick of WHEELIE_TRICKS){
  await picker.getByRole('button',{name:trick.label,exact:true}).focus();await page.keyboard.press('Enter');await page.clock.runFor(1300);
  assert.equal(await page.locator('.photo-rider').getAttribute('data-trick'),trick.id);
  score+=trick.points*2;
  assert.equal(Number(await page.locator('.ride-trick-badge').getAttribute('data-score')),score);
  poses.add(await page.locator('.photo-rider path').evaluateAll(paths=>paths.map(path=>path.getAttribute('d')).join('|')));
  await page.clock.runFor(1000);assert.equal(Number(await page.locator('.ride-trick-badge').getAttribute('data-score')),score,'holding must not repeatedly award points');
  if(['superman','knee-knock','tail-grab'].includes(trick.id))await page.screenshot({path:'../../outputs/v34-'+trick.id+'.png'});
 }
 assert.equal(poses.size,10,'all tricks must have distinct poses');
 await page.mouse.up();await page.clock.runFor(500);assert.equal(await page.locator('.photo-rider').getAttribute('data-trick'),'normal');
 assert.equal(await page.evaluate(()=>Number(localStorage.getItem('kukirin_best_trick_score'))),score);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert(await picker.evaluate(e=>e.getBoundingClientRect().left>=0&&e.getBoundingClientRect().right<=innerWidth));
 await page.goto('http://127.0.0.1:5173/#/telemetry/g4_max?stock=1');
 await page.getByRole('button',{name:/ENGAGE/}).click();
 const fast=await page.getByRole('button',{name:'WHEELIE',exact:true}).boundingBox();
 await page.mouse.move(fast.x+20,fast.y+20);await page.mouse.down();await page.clock.runFor(60000);
 assert(Number(await page.locator('.ride-speed span').innerText())>70);
 assert.equal(await page.locator('.ride-photo-art.is-wheelie').count(),1,'BALANCEPRO extends manual wheelies above 70');
 await page.evaluate(()=>localStorage.removeItem('kukirin_unlock_balancepro'));await page.clock.runFor(200);
 assert.equal(await page.locator('.ride-photo-art.is-wheelie').count(),0,'base manual wheelies stop above 70');await page.mouse.up();
 await page.goto('http://127.0.0.1:5173/#/telemetry/surron_light_bee_x?stock=1');
 await page.getByRole('button',{name:/ENGAGE/}).click();
 await page.getByRole('button',{name:'Superman',exact:true}).click();
 const moto=await page.getByRole('button',{name:'WHEELIE',exact:true}).boundingBox();
 await page.mouse.move(moto.x+20,moto.y+20);await page.mouse.down();await page.clock.runFor(1800);
 assert.equal(await page.locator('.vector-rider').getAttribute('data-trick'),'superman');await page.mouse.up();
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: six codes, one-time rewards, ten distinct poses, double score, no farming, pose reset, best score, 360px UI, Sur-Ron tricks');
})().catch(e=>{console.error(e);process.exit(1);});
