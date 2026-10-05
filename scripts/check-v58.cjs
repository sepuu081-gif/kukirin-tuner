const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{localStorage.setItem('kukirin_rider_name','Ride Test');localStorage.setItem('kukirin_language','en');});
 await page.goto('http://127.0.0.1:5173');
 await page.getByRole('link',{name:'Leaderboard',exact:true}).click();
 await page.getByRole('heading',{name:'Global leaderboard'}).waitFor();
 assert.match(await page.locator('body').innerText(),/not configured/);
 await page.goto('http://127.0.0.1:5173/#/build/g2_2026?tab=appearance');
 await page.getByRole('button',{name:'Rider',exact:true}).click();
 for(const helmet of ['half','moto','fullface']) {
  await page.getByLabel('Helmet type',{exact:true}).selectOption(helmet);
  await page.locator(`[data-helmet="${helmet}"]`).waitFor();
  const head=await page.locator(`[data-helmet="${helmet}"]`).boundingBox(),showroom=await page.locator('.tuning-showroom').boundingBox();
  assert(head.y>=showroom.y&&head.y+head.height<=showroom.y+showroom.height,'helmet must fit in the preview');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_builds')).g2_2026.appearance.riderHelmetType),helmet);
 }
 await page.getByLabel('Helmet type',{exact:true}).selectOption('moto');
 await page.reload();await page.getByRole('button',{name:'Rider',exact:true}).click();
 assert.equal(await page.getByLabel('Helmet type',{exact:true}).inputValue(),'moto');
 await page.screenshot({path:'../../outputs/v58-helmet.png'});
 await page.goto('http://127.0.0.1:5173/#/telemetry/g2_2026?practice=training');
 await page.getByRole('button',{name:/ENGAGE/}).click();
 await page.locator('.ride-preview [data-helmet="moto"]').waitFor();
 const offset=()=>page.locator('.ride-environment').getAttribute('data-offset');
 await page.waitForTimeout(500);const stopped=await offset();await page.waitForTimeout(400);assert.equal(await offset(),stopped);
 await page.keyboard.down('w');await page.waitForTimeout(2500);await page.keyboard.up('w');
 assert(Number(await offset())>Number(stopped),'scenery must move with throttle');
 await page.screenshot({path:'../../outputs/v58-moving-ride.png'});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile layout must fit');
 // Test the actual scenery component under controlled speed/distance values.
 await page.evaluate(async()=>{
  const {default:React}=await import('/node_modules/.vite/deps/react.js'),{default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js'),{default:Scene}=await import('/src/components/RideEnvironment.jsx');
  const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:99999';document.body.append(host);
  const root=ReactDOM.createRoot(host);window.renderScene=(speed,distance)=>root.render(React.createElement(Scene,{speed,distance}));window.renderScene(40,0);
 });
 const c=page.locator('.ride-environment').last();await page.waitForTimeout(600);
 assert.equal(await c.getAttribute('data-scene'),'downtown');
 for(const [distance,scene] of [[.4,'suburbs'],[.8,'forest']]) {
  await page.evaluate(d=>window.renderScene(40,d),distance);await page.waitForTimeout(1100);assert.equal(await c.getAttribute('data-scene'),scene);
 }
 await page.screenshot({path:'../../outputs/v58-forest.png'});
 await page.evaluate(()=>window.renderScene(0,.8));await page.waitForTimeout(150);const paused=await c.getAttribute('data-offset');await page.waitForTimeout(400);assert.equal(await c.getAttribute('data-offset'),paused);
 assert.deepEqual(errors,[]);console.log('PASS discoverable leaderboard, three helmet shapes, save/reload/ride, scenery motion/stop/environment changes, mobile width');
 for(const width of [360,412,1280]){await page.setViewportSize({width,height:844});await page.goto('http://127.0.0.1:5173');await page.getByRole('link',{name:'Leaderboard',exact:true}).waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`home width ${width}`);}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
