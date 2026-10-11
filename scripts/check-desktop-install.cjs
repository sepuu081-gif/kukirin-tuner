const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const {_electron}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const asar=require('@electron/asar'),yaml=require('js-yaml');
const root=process.cwd(),out='C:/Users/sebas/Documents/ChatGPT/kukirin tuner/qa-v74',install=path.join(out,'installed'),profile=path.join(out,'profile');fs.mkdirSync(profile,{recursive:true});
const exec=promisify(execFile),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const oldSetup=path.resolve('desktop-release/qa-1.0.73/KuKirin-Tuner-QA-1.0.73.exe'),feed=path.resolve('desktop-release/qa-1.0.74'),exe=path.join(install,'KuKirin Tuner QA.exe');
async function version(){try{return JSON.parse(asar.extractFile(path.join(install,'resources/app.asar'),'package.json').toString()).version;}catch{return null;}}
async function waitVersion(expected){for(let n=0;n<100;n++){if(await version()===expected)return;await sleep(1000);}throw Error('Installer did not reach '+expected);}
(async()=>{let app,server;try{
 console.log('Installing isolated QA 1.0.73; production install/profile are untouched.');
 await exec(oldSetup,['/S','/D='+install],{windowsHide:true,timeout:120000});await waitVersion('1.0.73');
 const allowed=new Set(['latest.yml','KuKirin-Tuner-QA-1.0.74.exe','KuKirin-Tuner-QA-1.0.74.exe.blockmap']);
 server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1));if(!allowed.has(name)){res.writeHead(404);res.end();return;}const f=path.join(feed,name);res.writeHead(200,{'Content-Type':name.endsWith('.yml')?'text/yaml':'application/octet-stream','Content-Length':fs.statSync(f).size});fs.createReadStream(f).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const feedURL='http://127.0.0.1:'+server.address().port+'/';
 const config=path.join(out,'qa-update.yml');fs.writeFileSync(config,yaml.dump({provider:'generic',url:feedURL,updaterCacheDirName:'kukirin-tuner-qa-v74-updater'}));
 const env={...process.env,KUKIRIN_TEST_PROFILE:profile};delete env.ELECTRON_RUN_AS_NODE;
 app=await _electron.launch({executablePath:exe,env,timeout:60000});
 await app.evaluate(({app},config)=>{const u=process.mainModule.require('electron-updater').autoUpdater;u.updateConfigPath=config;u.disableDifferentialDownload=true;u.installDirectory=process.mainModule.require('node:path').dirname(app.getPath('exe'));},config);
 const p=await app.firstWindow();await p.route('https://**/*',r=>r.abort());await p.waitForLoadState('domcontentloaded');
 await p.evaluate(()=>{localStorage.setItem('kukirin_rider_name','QA Update');localStorage.setItem('kukirin_name_started','true');localStorage.setItem('kukirin_respect','1234');localStorage.setItem('kukirin_builds',JSON.stringify({qa_saved:{vehicleId:'qa_saved',parts:{},marker:'garage-kept'}}));localStorage.setItem('kukirin_career',JSON.stringify({money:777,marker:'career-kept'}));localStorage.setItem('kukirin_player_account_v73',JSON.stringify({id:'qa-update',name:'QA Update',role:'player',token:'0'.repeat(64),origin:'https://kukirin-leaderboard.sepuu081-kukirin.workers.dev'}));});
 const snapshot=await p.evaluate(()=>Object.fromEntries(['kukirin_rider_name','kukirin_respect','kukirin_builds','kukirin_career','kukirin_player_account_v73'].map(k=>[k,localStorage.getItem(k)])));
 console.log('Downloading real QA 1.0.74 installer through electron-updater.');
 const downloaded=await app.evaluate(async()=>{const u=process.mainModule.require('electron-updater').autoUpdater;const r=await u.checkForUpdates();await r.downloadPromise;return {version:r.updateInfo.version,path:u.installerPath};});assert.equal(downloaded.version,'1.0.74');assert(fs.existsSync(downloaded.path));
 const menu=await app.evaluate(({Menu})=>({ready:Menu.getApplicationMenu().getMenuItemById('install-update').enabled,label:Menu.getApplicationMenu().items[2].label}));assert.equal(menu.ready,true);assert.equal(menu.label,'Uuendus valmis');assert.equal(await app.evaluate(({app})=>app.getVersion()),'1.0.73');
 console.log('Closing normally to trigger the silent NSIS upgrade.');const closed=app.waitForEvent('close');await app.evaluate(({app})=>app.quit()).catch(()=>{});await closed;app=null;await waitVersion('1.0.74');await sleep(1500);
 app=await _electron.launch({executablePath:exe,env,timeout:60000});await app.evaluate((_,config)=>{process.mainModule.require('electron-updater').autoUpdater.updateConfigPath=config;},config);
 const next=await app.firstWindow();await next.route('https://**/*',r=>r.abort());await next.waitForLoadState('domcontentloaded');assert.equal(await app.evaluate(({app})=>app.getVersion()),'1.0.74');
 const after=await next.evaluate(()=>Object.fromEntries(['kukirin_rider_name','kukirin_respect','kukirin_builds','kukirin_career','kukirin_player_account_v73'].map(k=>[k,localStorage.getItem(k)])));assert.deepEqual(after,snapshot);
 await next.screenshot({path:out+'/updated-app.png'});
 const report={realInstallerInstalled:true,from:'1.0.73',to:'1.0.74',realDownload:true,checksumVerifiedByUpdater:true,installedOnNormalQuit:true,readyMenu:true,savesAndAccountPreserved:true,isolatedQAInstall:true};fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('PASS real NSIS installation, real updater download, normal-quit upgrade 73 → 74, relaunch, identical account/garage/career/REP storage.');
 }finally{if(app)await app.close().catch(()=>{});if(server)server.close();const uninstaller=path.join(install,'Uninstall KuKirin Tuner QA.exe');if(fs.existsSync(uninstaller)&&path.resolve(install).startsWith(path.resolve(out)+path.sep)){await exec(uninstaller,['/S'],{windowsHide:true,timeout:120000}).catch(e=>console.log('QA uninstall needs cleanup:',e.message));}}})();
