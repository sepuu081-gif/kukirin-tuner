const { chromium } = require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:5173') ? route.continue() : route.abort());

  const models = ['g3_pro', 'g2_2026', 'g3', 'g2_master', 'g2_max', 'g4_max'];
  for (const id of models) {
    await page.goto(`http://127.0.0.1:5173/#/telemetry/${id}?stock=1`);
    await page.evaluate(() => localStorage.setItem('kukirin_language', 'en'));
    await page.reload();
    await page.getByRole('button', { name: /ENGAGE/ }).click();
    await page.waitForFunction(() => document.querySelector('.ride-photo-art img')?.naturalWidth > 0);
    const src = await page.locator('.ride-photo-art img').getAttribute('src');
    assert(src && src.startsWith('/assets/vehicles/'), `${id} must use a local product photo`);
    assert.equal(await page.locator('.photo-wheel-spin').count(), 2, `${id} must render two animated wheel overlays`);
    const gasBox = await page.getByRole('button', { name: /GAS/ }).boundingBox();
    assert(gasBox, 'gas control must be visible');
    await page.mouse.move(gasBox.x + gasBox.width / 2, gasBox.y + gasBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('.ride-photo-art')?.classList.contains('is-model-moving'));
    assert.notEqual(await page.locator('.photo-wheel-spin').first().evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.equal(await page.locator('.ride-preview').evaluate(el => getComputedStyle(el).backgroundImage.includes('ride-city-day-v27.png')), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (id === 'g3' || id === 'g4_max') {
      await page.waitForTimeout(250);
      await page.screenshot({ path: `../../outputs/v28-${id.replace('_', '-')}-photo.png` });
    }
  }

  assert.deepEqual(errors, []);
  console.log('PASS: G3 Pro, G2, G3, G2 Master, G2 Max and G4 Max use offline photos with city background and no phone overflow');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
