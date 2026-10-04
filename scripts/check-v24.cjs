const { chromium } = require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const checks = [
    ['g2_pro_2023', 'ride-family-g2', 'ride-subtype-pro'],
    ['g2_max', 'ride-family-g2', 'ride-subtype-max'],
    ['g3_pro', 'ride-family-g3', 'ride-subtype-pro'],
    ['g4', 'ride-family-g4', 'ride-subtype-base'],
    ['g4_max', 'ride-family-g4', 'ride-subtype-max'],
    ['surron_light_bee_x', 'ride-family-emoto', 'ride-subtype-light'],
    ['surron_ultra_bee', 'ride-family-emoto', 'ride-subtype-ultra'],
    ['stark_varg_mx', 'ride-family-emoto', 'ride-subtype-stark'],
  ];
  for (const [id, family, subtype] of checks) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:5173/#/telemetry/${id}?stock=1`);
    await page.evaluate(() => localStorage.setItem('kukirin_language', 'en'));
    await page.reload();
    await page.getByRole('button', { name: /ENGAGE/ }).click();
    const art = page.locator('.ride-model-art');
    await art.waitFor();
    const classes = await art.getAttribute('class');
    assert(classes.includes(family), `${id} must render ${family}`);
    assert(classes.includes(subtype), `${id} must render ${subtype}`);
    const gas = page.getByRole('button', { name: 'GAS' });
    await gas.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch' });
    await page.waitForTimeout(300);
    await gas.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch' });
    assert.equal(await page.getByRole('button', { name: 'BRAKE' }).isVisible(), true);
    assert.equal(await page.getByRole('button', { name: 'WHEELIE' }).isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: eight vehicle-specific ride silhouettes, reliable gas/brake/wheelie controls, phone layout and no browser errors');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
