const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:Number(process.env.RIDE_TEST_WIDTH)||390,height:844},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Isolate the thermal endurance test from random police/weather encounters.
 await page.addInitScript(()=>{Math.random=()=>0.1;});
 await page.clock.install();
 for(const id of ['g2_2026','g4','g3_pro']){
  await page.goto('http://127.0.0.1:5173/#/telemetry/'+id+'?stock=1');
  await page.evaluate(()=>{localStorage.setItem('kukirin_language','en');localStorage.removeItem('kukirin_vesc_params_g2_2026');});await page.reload();
  await page.evaluate(()=>{
   const schedule=window.setTimeout.bind(window);
   window.setTimeout=(fn,delay,...args)=>schedule(fn,delay>20000&&delay<50000?3600000:delay,...args);
  });
  await page.getByRole('button',{name:/ENGAGE/}).click();
  await page.waitForFunction(()=>document.querySelector('.opaque-vehicle-photo')?.dataset.loaded==='true');
  assert.equal(await page.locator('.photo-wheel-spin[data-loaded="true"]').count(),2);
  await page.keyboard.down('w');
  await page.clock.runFor(Number(process.env.RIDE_TEST_MS)||300000);
  if(!await page.locator('.ride-preview-bottom').count()) throw new Error(await page.locator('body').innerText());
  const metrics=await page.locator('.ride-preview-bottom').innerText();console.log(id,metrics);
  const match=metrics.match(/M\s*(\d+)°.*B\s*(\d+)°/s);assert(match,metrics);
  assert(Number(match[1])<85,'stock motor must not overheat');assert(Number(match[2])<48,'stock battery must not overheat');
  const esc=await page.locator('.ride-metrics > div').nth(2).innerText();
  assert(Number(esc.match(/(\d+)°/)[1])<85,'stock controller must not overheat');
  assert(await page.locator('.ride-speed span').count(),'ride must remain running');
  await page.keyboard.up('w');
  await page.keyboard.down('s');await page.clock.runFor(7000);await page.keyboard.up('s');
  for(const [name,trick] of [['1 hander','one-hand'],['No hander','no-hands'],['Leg wrap','leg-wrap']]){
   await page.getByRole('button',{name,exact:true}).click();
   const box=await page.getByRole('button',{name:'WHEELIE',exact:true}).boundingBox();
   await page.mouse.move(box.x+20,box.y+20);await page.mouse.down();await page.clock.runFor(2500);
   assert.equal(await page.locator('.photo-rider').getAttribute('data-trick'),trick);
   assert.equal(await page.locator('.ride-photo-art.is-wheelie').count(),1);
   if(trick==='no-hands') assert(await page.locator('.photo-rider').evaluate(svg=>{
    const rect=document.querySelector('.ride-preview').getBoundingClientRect();
    return [[78,-17],[24,-17],[39,-27],[55,-17]].every(([x,y])=>{
     const point=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());
     return point.x>=rect.left&&point.x<=rect.right&&point.y>=rect.top&&point.y<=rect.bottom;
    });
   }),'hands and helmet must remain inside preview');
   await page.screenshot({path:'../../outputs/v32-'+id+'-'+trick+'.png'});
   await page.mouse.up();await page.clock.runFor(500);
   assert.equal(await page.locator('.photo-rider').getAttribute('data-trick'),'normal','pose resets after release');
   await page.keyboard.down('s');await page.clock.runFor(4000);await page.keyboard.up('s');
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
 }
 assert.deepEqual(errors,[]);console.log(`PASS: three stock builds, ${(Number(process.env.RIDE_TEST_MS)||300000)/60000}-minute full throttle, wheel centers loaded, 3 trick poses and reset, phone layout`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
