const assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),path=require('node:path'),os=require('node:os'),fs=require('node:fs');
const {createUpdater}=require('../desktop/updater.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'kukirin-updater-test-')),updater=new EventEmitter(),dialogs=[];let network=0,installs=0,choice=0;
 updater.checkForUpdates=async()=>{network++;updater.emit('checking-for-update');await new Promise(r=>setTimeout(r,15));updater.emit('update-not-available');};updater.quitAndInstall=(silent,restart)=>{assert(silent&&restart);installs++;};
 const app={isPackaged:true,getVersion:()=> '1.0.74',getPath:()=>root};const dialog={showMessageBox:async(_,o)=>{dialogs.push(o);return {response:choice};}};
 const controller=createUpdater({app,dialog,getWindow:()=>undefined,updater});
 assert(updater.autoDownload);assert(updater.autoInstallOnAppQuit);assert.equal(updater.allowDowngrade,false);assert.equal(updater.allowPrerelease,false);assert.equal(updater.autoRunAppAfterInstall,false);assert(updater.disableWebInstaller);
 await Promise.all([controller.check(),controller.check()]);assert.equal(network,1);assert.equal(controller.getState().phase,'current');assert.equal(dialogs.length,0);
 await controller.check(true);assert.equal(dialogs.length,1);
 updater.emit('update-available',{version:'1.0.75'});updater.emit('download-progress',{percent:42.5});assert.equal(controller.getState().percent,43);await controller.check(true);assert.equal(network,2);
 updater.emit('update-downloaded',{version:'1.0.75'});assert.equal(controller.getState().phase,'ready');assert.equal(installs,0);await controller.check();assert.equal(network,2);
 await controller.install();assert.equal(installs,0);choice=1;await controller.install();assert.equal(installs,1);
 controller.guardShutdown();assert.equal(updater.autoInstallOnAppQuit,false);
 const stop=controller.start();stop();
 const offline=new EventEmitter();offline.checkForUpdates=async()=>{throw Error('offline');};const failed=createUpdater({app,dialog,getWindow:()=>undefined,updater:offline});await failed.check();assert.equal(failed.getState().phase,'error');assert.equal(dialogs.length,3);await failed.check(true);assert.equal(dialogs.length,4);
 app.isPackaged=false;network=0;await failed.check(true);assert.equal(network,0);
 console.log('PASS updater single-flight, background download states, deferred restart, manual cancel/install, offline handling, shutdown guard, no downgrade/prerelease, dev guard.');
})();
