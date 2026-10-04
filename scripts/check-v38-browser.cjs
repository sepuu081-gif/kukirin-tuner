const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const {SECRET_CODES}=await import('../src/lib/vehicleData.js');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:360,height:740},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('kukirin_language','en');});await page.reload();
  await page.getByRole('button',{name:'Codes',exact:true}).click();
  const input=page.getByRole('textbox',{name:'Secret code'});
  await input.fill('  unlockall  ');await input.press('Enter');
  await page.getByText('✓ UNLOCKALL UNLOCKED',{exact:true}).waitFor();
  const first=await page.evaluate(()=>({rep:Number(localStorage.getItem('kukirin_respect')),codes:JSON.parse(localStorage.getItem('kukirin_unlocked_codes'))}));
  assert.equal(first.codes.length,Object.keys(SECRET_CODES).length);
  await input.fill('UNLOCKALL');await page.getByRole('button',{name:'Unlock',exact:true}).dblclick();
  assert.equal(await page.evaluate(()=>Number(localStorage.getItem('kukirin_respect'))),first.rep);
  await page.getByText('Already unlocked.',{exact:true}).waitFor();
  // Simulate upgrading a previous master save; visiting home must sync it.
  await page.evaluate(()=>{
   const codes=JSON.parse(localStorage.getItem('kukirin_unlocked_codes')).filter(c=>c!=='REP5000');
   localStorage.setItem('kukirin_unlocked_codes',JSON.stringify(codes));
   localStorage.removeItem('kukirin_code_reward_REP5000');localStorage.removeItem('kukirin_unlock_rep5000');
  });await page.reload();
  assert.equal(await page.evaluate(()=>localStorage.getItem('kukirin_unlock_rep5000')),'true');
  assert.equal(await page.evaluate(()=>Number(localStorage.getItem('kukirin_respect'))),first.rep+5000);
  await page.reload();assert.equal(await page.evaluate(()=>Number(localStorage.getItem('kukirin_respect'))),first.rep+5000);
  await page.getByRole('button',{name:'Codes',exact:true}).click();await input.fill('badcode');await input.press('Enter');
  await page.getByText('Invalid code. Try again.',{exact:true}).waitFor();
  await page.screenshot({path:'../../outputs/v38-codes.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: mobile Codes UI, Enter, master, double taps, automatic upgrade, reload, invalid input; no page errors');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
