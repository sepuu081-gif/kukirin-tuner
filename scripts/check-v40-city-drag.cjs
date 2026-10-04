const { chromium }=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:360,height:740},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();await page.goto('http://127.0.0.1:5173/');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('kukirin_language','en');localStorage.setItem('kukirin_tires_g4',JSON.stringify({wheelId:'stock',frontPressure:2,rearPressure:2,frontWear:10,rearWear:10}));});
  await page.goto('http://127.0.0.1:5173/#/city');await page.getByRole('combobox',{name:'Choose vehicle'}).selectOption('g4');await page.getByRole('button',{name:/Free Ride/}).click();
  const gas=await page.getByRole('button',{name:'GAS',exact:true}).boundingBox();await page.mouse.move(gas.x+10,gas.y+10);await page.mouse.down();await page.clock.runFor(5000);await page.mouse.up();
  const speed=Number(await page.locator('.city-speed strong').textContent());assert(speed>10);
  const brake=await page.getByRole('button',{name:'BRAKE',exact:true}).boundingBox();await page.mouse.move(brake.x+10,brake.y+10);await page.mouse.down();await page.clock.runFor(200);assert.equal(await page.locator('.photo-rider').getAttribute('data-rider-state'),'braking');await page.mouse.up();
  await page.getByRole('button',{name:'Back to map',exact:true}).click();const cityTires=await page.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_tires_g4')));assert(cityTires.frontWear>10);assert.equal(cityTires.frontPressure,2);
  await page.goto('http://127.0.0.1:5173/#/drag');await page.getByRole('combobox').first().selectOption('g4');await page.getByRole('button',{name:/LINE UP/}).click();await page.clock.runFor(4500);await page.keyboard.down('w');await page.clock.runFor(5000);await page.keyboard.up('w');
  const dragTires=await page.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_tires_g4')));assert(dragTires.rearWear>cityTires.rearWear);assert.equal(dragTires.frontPressure,2);
  await page.goto('http://127.0.0.1:5173/#/build/g4');await page.getByText('Tyres & pressure',{exact:true}).click();await page.getByRole('button',{name:'Replace tyres',exact:true}).click();assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_tires_g4')))).rearWear,0);
  await page.goto('http://127.0.0.1:5173/#/build/t3');assert((await page.locator('.build-stats').textContent()).includes('48V'));assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_builds')).t3.vehicleId),'t3');
  await page.evaluate(()=>localStorage.setItem('kukirin_language','et'));await page.reload();await page.getByText('Rehvid ja rõhk',{exact:true}).waitFor();await page.getByRole('button',{name:'Sõidutreening',exact:true}).waitFor();await page.getByRole('button',{name:/Garaaži proovirada/}).waitFor();
  await page.screenshot({path:'../../outputs/v40-estonian-garage.png'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  console.log('PASS city/drag tyre wear and saved pressure, city braking rider, tyre replacement, build route isolation, Estonian 360px UI.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
