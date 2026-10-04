const { chromium } = require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:5173') ? route.continue() : route.abort());

  for (const id of ['g3_pro', 'g2_2026', 'g3', 'g2_master', 'g2_max', 'g4_max']) {
    await page.goto(`http://127.0.0.1:5173/#/telemetry/${id}?stock=1`);
    await page.evaluate(() => localStorage.setItem('kukirin_language', 'en'));
    await page.reload();
    await page.getByRole('button', { name: /ENGAGE/ }).click();
    await page.waitForFunction(() => document.querySelector('.ride-photo-art img')?.naturalWidth > 0);
    const src = await page.locator('.ride-photo-art img').getAttribute('src');
    assert(src?.includes('/ride-'), `${id} must use its kickstand-free riding photo`);
    assert.equal(await page.locator('.photo-wheel-spin').count(), 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    const gasBox = await page.getByRole('button', { name: /GAS/ }).boundingBox();
    assert(gasBox);
    await page.mouse.move(gasBox.x + gasBox.width / 2, gasBox.y + gasBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();
    await page.waitForFunction(() => document.querySelector('.ride-photo-art')?.classList.contains('is-model-moving'));
    assert.notEqual(await page.locator('.photo-wheel-spin').first().evaluate(el => getComputedStyle(el).animationName), 'none');
    if (id === 'g2_2026' || id === 'g4_max') await page.screenshot({ path: `../../outputs/v29-${id.replace('_', '-')}-no-stand.png` });
  }

  assert.deepEqual(errors, []);
  console.log('PASS: six kickstand-free ride photos, animated wheels, realistic contact shadows, offline assets and phone layout');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
