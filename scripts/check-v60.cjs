const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const url='https://kukirin-leaderboard.sepuu081-kukirin.workers.dev';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const contexts=await Promise.all([0,1].map(()=>browser.newContext({viewport:{width:390,height:844}})));
 const names=['CloudCheck60A','CloudCheck60B'],ids=[];
 for(let i=0;i<2;i++)await contexts[i].addInitScript(({name,old})=>{localStorage.setItem('kukirin_rider_name',name);localStorage.setItem('kukirin_language','en');if(old)localStorage.setItem('kukirin_leaderboard_url','http://127.0.0.1:8787');},{name:names[i],old:i===1});
 const pages=await Promise.all(contexts.map(c=>c.newPage()));
 for(const page of pages){await page.goto('http://127.0.0.1:5173/#/leaderboard');await page.getByText('Connected',{exact:true}).waitFor({timeout:20000});assert.equal(await page.getByLabel('Server address',{exact:true}).inputValue(),url);}
 for(let i=0;i<2;i++){
  const id=await pages[i].evaluate(async value=>{const m=await import('/src/lib/leaderboard.js');m.submitScore('drag',value,'QA server check');const q=JSON.parse(localStorage.getItem('kukirin_score_queue'));const id=q.at(-1).id;await m.syncScores();return id;},8.123+i);
  ids.push(id);fs.writeFileSync('../../outputs/v60-public-test-ids.json',JSON.stringify(ids));
 }
 for(const page of pages){await page.getByRole('button',{name:'Refresh',exact:true}).click();for(const name of names)await page.getByText(name,{exact:false}).waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('kukirin_score_queue')).length),0);}
 await pages[0].screenshot({path:'../../outputs/v60-public-leaderboard.png'});
 await pages[1].reload();await pages[1].getByText('Connected',{exact:true}).waitFor();
 await pages[0].getByRole('button',{name:'Disconnect',exact:true}).click();await pages[0].reload();await pages[0].getByText('Not connected',{exact:true}).waitFor();
 const website=await browser.newPage();await website.goto(url);await website.getByText(names[1],{exact:true}).waitFor();
 console.log('PASS actual public Cloudflare server: two independent players, automatic default, localhost migration, shared scores, queued uploads, reload and explicit disconnect. Test row IDs saved for cleanup.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
