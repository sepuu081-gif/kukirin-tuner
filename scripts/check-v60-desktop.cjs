const {_electron}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{let app;try{
 app=await _electron.launch({executablePath:path.resolve('desktop-release/KuKirin Tuner-win32-x64/KuKirin Tuner.exe'),env:{...process.env,KUKIRIN_TEST_PROFILE:path.join(require('node:os').tmpdir(),'kukirin-cloud-v60-'+Date.now())}});
 const page=await app.firstWindow();await page.locator('.first-name-screen input').fill('Desktop Cloud QA');await page.locator('.first-name-screen button').click();
 await page.goto('kukirin://game/#/leaderboard');await page.getByText('Connected',{exact:true}).waitFor({timeout:20000});
 assert.equal(await page.getByLabel('Server address',{exact:true}).inputValue(),'https://kukirin-leaderboard.sepuu081-kukirin.workers.dev');
 console.log('PASS packaged Windows app automatically connects to the real public cloud leaderboard');
}finally{if(app)await app.close();}})().catch(e=>{console.error(e);process.exit(1)});
