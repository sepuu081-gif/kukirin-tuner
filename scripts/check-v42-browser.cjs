const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader']});try{
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:5173')||r.request().url().startsWith('data:')?r.continue():r.abort());
await page.addInitScript(()=>{if(!localStorage.getItem('kukirin_language'))localStorage.setItem('kukirin_language','en');});
await page.goto('http://127.0.0.1:5173/#/build/g2_2026?tab=appearance');
await page.locator('.opaque-vehicle-photo[data-stem="#1266b4"]').waitFor();
assert.equal(await page.locator('.build-stats').count(),0);assert.equal(await page.locator('.appearance-colour').count(),1);
const bounds=await page.locator('.tuning-showroom').boundingBox();assert(bounds.y<160,'preview should be near top');
await page.getByRole('button',{name:'Stem Colour #ef4444',exact:true}).click();await page.locator('.opaque-vehicle-photo[data-stem="#ef4444"]').waitFor();
await page.getByRole('button',{name:'Undo',exact:true}).click();await page.locator('.opaque-vehicle-photo[data-stem="#1266b4"]').waitFor();
await page.getByRole('combobox',{name:'Paint part'}).selectOption('deckColor');await page.getByRole('button',{name:'Deck Colour #22c55e',exact:true}).click();
await page.getByRole('button',{name:'Lights',exact:true}).click();await page.getByRole('checkbox',{name:'Under-deck LEDs'}).uncheck();assert.equal(await page.locator('.photo-tuning-overlay').getAttribute('data-led'),'off');
await page.getByRole('button',{name:'Stickers',exact:true}).click();await page.getByRole('combobox',{name:'Stickers',exact:true}).selectOption('racing');assert.equal(await page.locator('.photo-tuning-overlay text').textContent(),'G2 RACING');
await page.reload();await page.locator('.opaque-vehicle-photo[data-stem="#1266b4"]').waitFor();assert.equal(await page.locator('.photo-tuning-overlay').getAttribute('data-led'),'off');
await page.locator('.studio-presets summary').click();await page.getByRole('button',{name:'Blue & black',exact:true}).click();await page.locator('.studio-presets summary').click();
await page.getByRole('button',{name:'3D',exact:true}).click();await page.locator('.ride-scene-3d[data-rider="off"][data-led="on"]').waitFor();await page.waitForTimeout(800);await page.screenshot({path:'../../outputs/v42-studio-3d.png'});
await page.getByRole('button',{name:'Image',exact:true}).click();await page.locator('.opaque-vehicle-photo[data-loaded="true"]').waitFor();
await page.evaluate(()=>localStorage.setItem('kukirin_language','et'));await page.reload();
for(const size of [{width:360,height:640},{width:390,height:844},{width:1024,height:768}]){await page.setViewportSize(size);await page.locator('.opaque-vehicle-photo[data-loaded="true"]').waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`../../outputs/v42-studio-${size.width}.png`});}
await page.getByRole('button',{name:'Ehitus',exact:true}).click();assert(page.url().includes('tab=build'));await page.getByRole('button',{name:'Välimus',exact:true}).click();assert(page.url().includes('tab=appearance'));await page.reload();await page.locator('.studio-editor').waitFor();assert.equal(await page.locator('.build-stats').count(),0);
assert.deepEqual(errors,[]);console.log('PASS v42: offline photo + 3D preview, one palette, undo, part paint, LED and sticker controls, reload persistence, ET phone/desktop layouts, no runtime errors.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
