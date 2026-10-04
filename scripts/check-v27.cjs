const { chromium } = require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:5173') ? route.continue() : route.abort());

  for (const id of ['g4', 't3', 'm4_max', 's1_max']) {
    await page.goto(`http://127.0.0.1:5173/#/telemetry/${id}?stock=1`);
    await page.evaluate(() => localStorage.setItem('kukirin_language', 'en'));
    await page.reload();
    await page.getByRole('button', { name: /ENGAGE/ }).click();
    await page.waitForFunction(() => document.querySelector('.ride-photo-art img')?.naturalWidth > 0);
    await page.evaluate(() => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = reject;
      image.src = '/assets/ride-city-day-v27.png';
    }));
    assert.equal(await page.locator('.ride-photo-city').evaluate(el => getComputedStyle(el).backgroundImage.includes('ride-city-day-v27.png')), true);
    assert.equal(await page.locator('.ride-preview').evaluate(el => getComputedStyle(el).backgroundImage.includes('ride-city-day-v27.png')), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.waitForTimeout(350);
    if (id === 'g4') await page.screenshot({ path: '../../outputs/v27-real-city-g4.png' });
    if (id === 't3') await page.screenshot({ path: '../../outputs/v27-real-city-t3.png' });
  }

  await page.goto('http://127.0.0.1:5173/#/build/g4');
  await page.getByPlaceholder('Search parts…').fill('StreetTorque');
  assert.equal(await page.getByText('StreetTorque 1500W Hub').isVisible(), true);
  await page.getByPlaceholder('Search parts…').fill('');
  assert((await page.locator('.part-card').count()) >= 8, 'expanded motor catalog must be visible');
  assert.deepEqual(errors, []);
  console.log('PASS: offline realistic city background, four photo models, expanded parts catalog, phone layout and no runtime errors');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
