const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5173')||r.request().url().startsWith('data:')?r.continue():r.abort());
 await page.addInitScript(()=>{localStorage.setItem('kukirin_language','en');localStorage.setItem('kukirin_preview_mode','3d');localStorage.setItem('kukirin_preview_revision','39');Math.random=()=>.1;});
 const launch=async id=>{await page.goto(`http://127.0.0.1:5173/#/telemetry/${id}?stock=1&practice=training`);await page.getByRole('button',{name:/ENGAGE/}).click();await page.locator('.opaque-vehicle-photo[data-loaded="true"]').waitFor();assert.equal(await page.locator('.ride-scene-3d').count(),0);assert.equal(await page.getByRole('button',{name:/3D/}).count(),0);};
 await launch('g2_2026');
 const anchor=()=>page.locator('.ride-photo-art').evaluate(el=>{const c=getComputedStyle(el),m=new DOMMatrix(c.transform),o=c.transformOrigin.split(' ').map(parseFloat);return {x:el.offsetLeft+o[0]+m.e,y:el.offsetTop+o[1]+m.f,w:el.offsetWidth};});
 const flat=await anchor();
 await page.keyboard.down('w');await page.waitForTimeout(1500);await page.keyboard.up('w');
 const wheel=page.getByRole('button',{name:'WHEELIE',exact:true});await wheel.scrollIntoViewIfNeeded();const b=await wheel.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
 await page.locator('.ride-pitch').waitFor();await page.waitForTimeout(900);const low=Number(await page.locator('.ride-pitch').getAttribute('data-angle'));assert(low>10&&low<60);
 await page.locator('.ride-pitch[data-scraping="true"]').waitFor();await page.keyboard.down('s');
 const scrape=Number(await page.locator('.ride-pitch').getAttribute('data-angle'));assert(scrape>=78);assert.equal(await page.locator('.scrape-sparks i').count(),7);
 const raised=await anchor();assert(Math.abs(raised.x-flat.x)<1&&Math.abs(raised.y-flat.y)<1,'rear axle remains fixed');assert.equal(raised.w,flat.w,'wheelie must not shrink photo');
 await page.screenshot({path:'../../outputs/v44-scrape.png'});await page.waitForTimeout(950);
 const recovered=Number(await page.locator('.ride-pitch').getAttribute('data-angle'));assert(recovered<scrape,'rear brake must lower pitch while wheelie still held');assert.equal(await page.locator('[data-testid=loopout-screen]').count(),0);
 await page.mouse.up();await page.keyboard.up('s');await page.locator('.ride-photo-art:not(.is-wheelie)').waitFor();
 // A held button without braking eventually loops; reset clears pitch and input.
 await wheel.dispatchEvent('pointerdown',{pointerId:11,pointerType:'touch',buttons:1});
 await page.locator('[data-testid=loopout-screen]').waitFor({timeout:7000});await page.getByRole('button',{name:'Try again',exact:true}).click();await page.locator('.ride-photo-art:not(.is-wheelie)').waitFor();assert.equal(await page.locator('.ride-pitch').count(),0);
 for(const id of ['g4','t3','surron_light_bee_x'])await launch(id);
 await page.goto('http://127.0.0.1:5173/#/');const icon=page.locator('img').first();assert(await icon.count());
 assert.deepEqual(errors,[]);console.log('PASS v44 offline phone: legacy 3D preference ignored, actual G2/G4/T3/SurRon photos, continuous pitch, fixed rear axle/size, scrape sparks, held-wheelie rear brake recovery, loopout + reset, no runtime errors.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
