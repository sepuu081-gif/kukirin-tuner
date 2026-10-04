const { _electron } = require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const executablePath = path.resolve('desktop-release/KuKirin Tuner-win32-x64/KuKirin Tuner.exe');
const testProfile = path.join(require('node:os').tmpdir(), 'kukirin-test-' + Date.now());
const launchOptions = { executablePath, env: {...process.env, KUKIRIN_TEST_PROFILE:testProfile} };
(async () => {
  let app;
  try {
    app = await _electron.launch(launchOptions);
    let page = await app.firstWindow();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForFunction(() => document.body.innerText.length > 100);
    await page.context().route(/^https?:\/\//, route => route.abort());
    await page.evaluate(() => { localStorage.setItem('kukirin_rider_name','Desktop Tester');localStorage.setItem('kukirin_name_started','true');localStorage.setItem('kukirin_language', 'en'); localStorage.setItem('desktop_smoke', 'saved'); });
    await page.goto('kukirin://game/#/telemetry/g2_2026?stock=1&practice=training');
    await page.getByRole('button', { name: /ENGAGE/ }).click();
    await page.waitForFunction(() => document.querySelector('.opaque-vehicle-photo')?.dataset.loaded === 'true');
    await page.keyboard.down('w');
    await page.waitForTimeout(2500);
    await page.keyboard.up('w');
    assert(Number(await page.locator('.ride-speed > span').innerText()) > 0, 'W must accelerate');
    console.log('RIDE:', await page.locator('.ride-preview').innerText());
    await page.locator('.ride-preview').screenshot({ path: '../../outputs/windows-ride-v56.png' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const media = await page.evaluate(async () => {
      const video = document.createElement('video'); video.muted = true;
      video.src = '/assets/feed/xiaomi-details.mp4'; document.body.append(video);
      await video.play(); await new Promise(r => setTimeout(r, 500));
      const time = video.currentTime; video.remove(); return time;
    });
    assert(media > 0, 'bundled offline video must play');
    await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; w.setFullScreen(true); });
    assert(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen()));
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setFullScreen(false));
    assert.deepEqual(errors, []);
    await app.close();
    app = await _electron.launch(launchOptions); page = await app.firstWindow();
    await page.waitForFunction(() => document.body.innerText.length > 100);
    assert.equal(await page.evaluate(() => localStorage.getItem('desktop_smoke')), 'saved');
    await page.evaluate(() => localStorage.removeItem('desktop_smoke'));
    console.log('PASS packaged Windows app, offline scooter photo/video, keyboard input, desktop width, fullscreen and save after restart');
  } finally { if (app) await app.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
