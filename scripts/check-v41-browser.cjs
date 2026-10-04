const { chromium }=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader']});
 try {
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5173')||r.request().url().startsWith('data:')?r.continue():r.abort());
 await page.addInitScript(()=>{if(!localStorage.getItem('kukirin_language'))localStorage.setItem('kukirin_language','en');Math.random=()=>.1;});
 await page.goto('http://127.0.0.1:5173/#/build/g2_2026');await page.getByRole('button',{name:'Appearance',exact:true}).click();
 await page.locator('.opaque-vehicle-photo[data-paint="on"][data-stem="#1266b4"]').waitFor();assert.equal(await page.locator('.photo-rider').count(),0);
 assert.equal(await page.locator('.photo-tuning-overlay').getAttribute('data-led'),'on');assert.equal(await page.locator('.photo-tuning-overlay text').textContent(),'KuKirin');
 const before=await page.locator('.opaque-vehicle-photo').evaluate(c=>{const ctx=c.getContext('2d');const p=ctx.getImageData(Math.floor(c.width*.31),Math.floor(c.height*.42),1,1).data;const tyre=ctx.getImageData(Math.floor(c.width*.12),Math.floor(c.height*.9),1,1).data;return {body:[...p],tyre:[...tyre]};});assert(before.body[2]>before.body[0]);
 await page.screenshot({path:'../../outputs/v41-g2-blue-studio.png'});
 await page.getByRole('button',{name:'Stem Colour #ef4444',exact:true}).click();await page.locator('.opaque-vehicle-photo[data-stem="#ef4444"]').waitFor();
 const after=await page.locator('.opaque-vehicle-photo').evaluate(c=>{const ctx=c.getContext('2d');return {body:[...ctx.getImageData(Math.floor(c.width*.31),Math.floor(c.height*.42),1,1).data],tyre:[...ctx.getImageData(Math.floor(c.width*.12),Math.floor(c.height*.9),1,1).data]};});assert(after.body[0]>after.body[2]);assert.deepEqual(after.tyre,before.tyre);
 await page.getByRole('checkbox',{name:'Under-deck LEDs',exact:true}).uncheck();assert.equal(await page.locator('.photo-tuning-overlay').getAttribute('data-led'),'off');
 await page.getByRole('combobox',{name:'Stickers',exact:true}).selectOption('racing');assert.equal(await page.locator('.photo-tuning-overlay text').textContent(),'G2 RACING');
 await page.reload();await page.getByRole('button',{name:'Appearance',exact:true}).click();await page.locator('.opaque-vehicle-photo[data-stem="#ef4444"]').waitFor();assert.equal(await page.locator('.photo-tuning-overlay').getAttribute('data-led'),'off');
 await page.getByRole('button',{name:'Blue & black',exact:true}).click();await page.locator('.opaque-vehicle-photo[data-stem="#1266b4"]').waitFor();
 await page.getByRole('combobox',{name:'LED mode',exact:true}).selectOption('breathe');assert(await page.locator('.photo-tuning-overlay.led-breathe').count());
 await page.getByRole('button',{name:'3D',exact:true}).click();await page.locator('.ride-scene-3d[data-led="on"][data-rider="off"]').waitFor();await page.waitForTimeout(400);await page.screenshot({path:'../../outputs/v41-g2-3d-studio.png'});
 await page.getByRole('checkbox',{name:'Under-deck LEDs',exact:true}).uncheck();await page.locator('.ride-scene-3d[data-led="off"]').waitFor();await page.getByRole('button',{name:'Blue & black',exact:true}).click();
 await page.goto('http://127.0.0.1:5173/#/telemetry/g2_2026');await page.getByRole('button',{name:/ENGAGE/}).click();await page.locator('.photo-tuning-overlay[data-led="on"]').waitFor();await page.locator('.opaque-vehicle-photo[data-stem="#1266b4"]').waitFor();await page.screenshot({path:'../../outputs/v41-g2-ride.png'});
 await page.goto('http://127.0.0.1:5173/#/telemetry/g2_2026?stock=1');await page.getByRole('button',{name:/ENGAGE/}).click();assert.equal(await page.locator('.photo-tuning-overlay').count(),0,'stock mode keeps factory appearance');
 await page.goto('http://127.0.0.1:5173/#/build/g2_2026');await page.getByRole('button',{name:'Appearance',exact:true}).click();await page.getByRole('button',{name:'Restore factory look',exact:true}).click();await page.locator('.opaque-vehicle-photo[data-paint="off"]').waitFor();assert.equal(await page.locator('.photo-tuning-overlay').count(),0);await page.getByRole('button',{name:'Blue & black',exact:true}).click();
 await page.evaluate(()=>localStorage.setItem('kukirin_language','et'));await page.reload();await page.getByRole('button',{name:'Välimus',exact:true}).click();await page.getByRole('button',{name:'Sinine ja must',exact:true}).waitFor();
 for(const size of [{width:360,height:640},{width:390,height:844}]){await page.setViewportSize(size);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const b=await page.locator('.tuning-showroom').boundingBox();assert(b.x>=0&&b.x+b.width<=size.width+1);}
 await page.screenshot({path:'../../outputs/v41-g2-studio-et.png'});assert.deepEqual(errors,[]);console.log('PASS v41 offline mobile: real photo recolour/tyre preservation, decals, LEDs, 3D without rider, persistence, ride preview, factory restoration, ET 360/390 layouts, no page errors.');
 await page.goto('http://127.0.0.1:5173/#/build/g2_2026?tab=appearance');await page.locator('.opaque-vehicle-photo[data-stem="#1266b4"]').waitFor();await page.locator('.tuning-showroom').screenshot({path:'../../outputs/v41-g2-tuning-preview.png'});
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
