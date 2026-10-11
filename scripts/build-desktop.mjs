import {cp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {build,Platform,Arch} from 'electron-builder';
const require=createRequire(import.meta.url),root=process.cwd();
const project=JSON.parse(await readFile('package.json','utf8'));
const qaVersion=process.argv.find(a=>a.startsWith('--qa-version='))?.split('=')[1];
if(qaVersion&&!/^1\.0\.\d+$/.test(qaVersion))throw Error('Invalid QA version');
const version=qaVersion||project.version;
const stage=path.resolve(root,'desktop-stage',qaVersion?'qa-'+qaVersion:'app');
const stageParent=path.resolve(root,'desktop-stage');
if(path.dirname(stage)!==stageParent||path.relative(root,stage).startsWith('..'))throw Error('Unsafe build stage');
await rm(stage,{recursive:true,force:true});await mkdir(stage,{recursive:true});
await cp('dist',path.join(stage,'dist'),{recursive:true});
await cp('desktop/main.cjs',path.join(stage,'main.cjs'));await cp('desktop/updater.cjs',path.join(stage,'updater.cjs'));
await writeFile(path.join(stage,'package.json'),JSON.stringify({name:qaVersion?'kukirin-tuner-desktop-qa':'kukirin-tuner-desktop',productName:qaVersion?'KuKirin Tuner QA':'KuKirin Tuner',version,description:'KuKirin Tuner scooter game',author:'Sepuu',license:'UNLICENSED',main:'main.cjs',dependencies:{'electron-updater':require('electron-updater/package.json').version}},null,2));
const npmCli=process.env.npm_execpath||path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
execFileSync(process.execPath,[npmCli,'install','--omit=dev','--ignore-scripts','--no-audit','--no-fund'],{cwd:stage,stdio:'inherit',windowsHide:true});
await build({targets:Platform.WINDOWS.createTarget(['nsis'],Arch.x64),publish:'never',config:{
 appId:qaVersion?'com.kukirin.tuner.qa':'com.kukirin.tuner',productName:qaVersion?'KuKirin Tuner QA':'KuKirin Tuner',
 directories:{app:stage,output:path.resolve('desktop-release',qaVersion?'qa-'+version:'setup')},
 electronVersion:require('electron/package.json').version,electronDist:existsSync(path.resolve('node_modules/electron/dist'))?path.resolve('node_modules/electron/dist'):undefined,
 asar:true,compression:'normal',npmRebuild:false,files:['main.cjs','updater.cjs','dist/**/*','package.json'],
 win:{target:'nsis',executableName:qaVersion?'KuKirin Tuner QA':'KuKirin Tuner',icon:'public/app-icon.png',signExecutable:false},
 nsis:{oneClick:true,perMachine:false,allowElevation:false,runAfterFinish:!qaVersion,deleteAppDataOnUninstall:false,createDesktopShortcut:!qaVersion,createStartMenuShortcut:!qaVersion,artifactName:qaVersion?'KuKirin-Tuner-QA-${version}.exe':'KuKirin-Tuner-Setup-${version}.exe'},
 publish:[{provider:'github',owner:'sepuu081-gif',repo:'kukirin-tuner',releaseType:'release'}],
}});
console.log(`Windows ${version} installer and updater metadata built.`);
