const { app, BrowserWindow, Menu, protocol, net, shell, dialog } = require('electron');
const {createUpdater} = require('./updater.cjs');
const {autoUpdater} = require('electron-updater');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([{ scheme: 'kukirin', privileges: {
  standard: true, secure: true, supportFetchAPI: true, stream: true,
} }]);
app.setName('KuKirin Tuner');
if (process.env.KUKIRIN_TEST_PROFILE) app.setPath('userData', process.env.KUKIRIN_TEST_PROFILE);
else app.setPath('userData',path.join(app.getPath('appData'),'KuKirin Tuner'));
app.setAppUserModelId('com.kukirin.tuner');
const ownsLock=app.requestSingleInstanceLock();
if(!ownsLock)app.quit();
let window;
let updater;
const contentRoot = path.resolve(__dirname, app.isPackaged ? 'dist' : '../dist');
function createWindow() {
  window = new BrowserWindow({
    width: 1280, height: 860, minWidth: 800, minHeight: 600,
    title: 'KuKirin Tuner', backgroundColor: '#080f1b',
    icon: path.join(contentRoot, 'app-icon-v43.png'),
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('kukirin://game/')) {
      event.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });
  window.on('query-session-end',()=>updater?.guardShutdown());
  window.on('session-end',()=>updater?.guardShutdown());
  buildMenu();
  window.loadURL('kukirin://game/');
}
function buildMenu(){
  const state=updater?.getState()||{phase:'idle'};
  const status=state.phase==='ready'?`Uuendus ${state.version} valmis`:state.phase==='downloading'?`Laadin uuendust: ${state.percent}%`:state.phase==='checking'?'Kontrollin uuendusi…':state.phase==='error'?'Kontroll ebaõnnestus — proovi uuesti':`Versioon ${app.getVersion()}`;
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Game', submenu: [
      { label: 'Back', accelerator: 'Alt+Left', click: () => window.webContents.executeJavaScript('history.back()') },
      { type: 'separator' }, { role: 'quit' },
    ] },
    { label: 'View', submenu: [{ role: 'togglefullscreen', accelerator: 'F11' }, { role: 'reload' },
      { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }] },
    {label:state.phase==='ready'?'Uuendus valmis':'Uuendused',submenu:[
      {label:status,enabled:false},
      {id:'check-update',label:'Kontrolli uuendusi',enabled:!['checking','downloading'].includes(state.phase),click:()=>void updater.check(true)},
      {id:'install-update',label:'Paigalda ja taaskäivita',enabled:state.phase==='ready',click:()=>void updater.install()},
    ]},
  ]));
}
app.whenReady().then(() => {
  if(!ownsLock)return;
  updater=createUpdater({app,dialog,getWindow:()=>window,updater:autoUpdater,onState:()=>buildMenu()});
  const root = contentRoot;
  protocol.handle('kukirin', request => {
    const url = new URL(request.url);
    if (url.hostname !== 'game') return new Response('Not found', { status: 404 });
    let file;
    try { file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)); }
    catch { return new Response('Bad request', { status: 400 }); }
    if (!file.startsWith(root + path.sep)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).href);
  });
  createWindow();
  const stopUpdates=updater.start();app.on('will-quit',stopUpdates);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
