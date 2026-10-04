const { app, BrowserWindow, Menu, protocol, net, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([{ scheme: 'kukirin', privileges: {
  standard: true, secure: true, supportFetchAPI: true, stream: true,
} }]);
app.setName('KuKirin Tuner');
let window;
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
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Game', submenu: [
      { label: 'Back', accelerator: 'Alt+Left', click: () => window.webContents.executeJavaScript('history.back()') },
      { type: 'separator' }, { role: 'quit' },
    ] },
    { label: 'View', submenu: [{ role: 'togglefullscreen', accelerator: 'F11' }, { role: 'reload' },
      { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }] },
  ]));
  window.loadURL('kukirin://game/');
}
app.whenReady().then(() => {
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
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
