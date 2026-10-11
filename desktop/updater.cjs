const {appendFileSync} = require('node:fs');
const path = require('node:path');

// The public GitHub feed comes from the packaged app-update.yml, never renderer input.
function createUpdater({app,dialog,getWindow,onState,updater}) {
  let state={phase:'idle',version:app.getVersion(),percent:0};
  let checking=null;
  const setState=next=>{state={...state,...next};onState?.(state);};
  const log=(level,...args)=>{try{appendFileSync(path.join(app.getPath('userData'),'updates.log'),`${new Date().toISOString()} ${level} ${args.map(a=>String(a)).join(' ')}\n`);}catch{/* Updating must not block playing if logging is unavailable. */}};
  updater.logger={info:(...a)=>log('info',...a),warn:(...a)=>log('warn',...a),error:(...a)=>log('error',...a),debug:()=>{}};
  updater.autoDownload=true;
  updater.autoInstallOnAppQuit=true;
  updater.autoRunAppAfterInstall=false;
  updater.allowPrerelease=false;
  updater.allowDowngrade=false;
  updater.disableWebInstaller=true;
  updater.on('checking-for-update',()=>setState({phase:'checking'}));
  updater.on('update-not-available',()=>setState({phase:'current',percent:0}));
  updater.on('update-available',info=>setState({phase:'downloading',version:info.version,percent:0}));
  updater.on('download-progress',p=>setState({phase:'downloading',percent:Math.max(0,Math.min(100,Math.round(p.percent||0)))}));
  updater.on('update-downloaded',info=>setState({phase:'ready',version:info.version,percent:100}));
  updater.on('error',error=>{log('error',error.message);setState({phase:'error'});});
  async function check(manual=false) {
    if(state.phase==='ready'||state.phase==='downloading')return state;
    if(!app.isPackaged){if(manual)await dialog.showMessageBox(getWindow(),{type:'info',message:'Uuendaja töötab paigaldatud EXE-versioonis.'});return state;}
    if(checking)return checking;
    checking=(async()=>{try{await updater.checkForUpdates();if(manual&&state.phase==='current')await dialog.showMessageBox(getWindow(),{type:'info',message:'Sul on uusim versioon.',detail:`KuKirin Tuner ${app.getVersion()}`});}
      catch(error){log('error',error.message);setState({phase:'error'});if(manual)await dialog.showMessageBox(getWindow(),{type:'info',message:'Uuenduste kontroll ei õnnestunud.',detail:'Mäng töötab edasi. Kontrolli internetiühendust ja proovi hiljem uuesti.'});}
      finally{checking=null;}return state;})();
    return checking;
  }
  async function install() {
    if(state.phase!=='ready')return;
    const {response}=await dialog.showMessageBox(getWindow(),{type:'question',buttons:['Hiljem','Paigalda ja taaskäivita'],defaultId:0,cancelId:0,message:`Uuendus ${state.version} on valmis.`,detail:'Lõpeta käimasolev sõit enne taaskäivitamist. Sinu konto ja salvestused jäävad alles.'});
    if(response===1)updater.quitAndInstall(true,true);
  }
  function guardShutdown(){updater.autoInstallOnAppQuit=false;}
  function start(){const first=setTimeout(()=>void check(),8000);first.unref?.();const interval=setInterval(()=>void check(),4*60*60*1000);interval.unref?.();return()=>{clearTimeout(first);clearInterval(interval);};}
  return {check,install,start,guardShutdown,getState:()=>state};
}
module.exports={createUpdater};
