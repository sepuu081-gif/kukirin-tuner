const { chromium } = require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      localStorage.setItem('kukirin_rider_name', 'Audio Tester');
      localStorage.setItem('kukirin_name_started', 'true');
      localStorage.setItem('kukirin_language', 'en');
      localStorage.setItem('kukirin_leaderboard_url', 'off');
      localStorage.setItem('kukirin_cloud_server_v60', 'true');
      localStorage.setItem('kukirin_sound', 'on');
      window.__meters = [];
      const original = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (destination, ...args) {
        if (destination instanceof AudioDestinationNode) {
          const meter = this.context.createAnalyser(); meter.fftSize = 2048;
          original.call(this, meter);
          window.__meters.push(meter);
        }
        return original.call(this, destination, ...args);
      };
    });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/#/telemetry/g2_2026?stock=1&practice=training');
    await page.getByRole('button', { name: /ENGAGE/ }).click();
    await page.keyboard.down('w');
    await page.waitForTimeout(2200);
    await page.keyboard.up('w');
    const ride = await page.evaluate(async () => {
      const actual = performance.getEntriesByType('resource').map(r=>r.name).find(url=>/\/src\/lib\/soundEngine\.js/.test(url));
      window.__soundModuleUrl = actual || '/src/lib/soundEngine.js';
      const audio = await import(window.__soundModuleUrl);
      const levels = window.__meters.map(meter=>{
        const buffer = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(buffer);
        return Math.sqrt(buffer.reduce((sum,v)=>sum+v*v,0)/buffer.length);
      });
      return { state:audio.getEngineSoundState(), rms:Math.max(...levels) };
    });
    console.log('PHONE_RIDE_AUDIO', JSON.stringify(ride));
    assert(ride.state?.recorded && ride.state.loaded, 'Actual ride must load its model recording');
    assert(ride.rms > .00005, 'Actual ride must produce a non-silent audio signal');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Phone viewport overflow');
    await page.evaluate(() => { location.hash = '/'; });
    await page.waitForTimeout(350);
    const result = await page.evaluate(async () => {
      const a = await import(window.__soundModuleUrl);
      const { VEHICLES } = await import('/src/lib/vehicleData.js');
      const { getVehicleSoundProfile } = await import('/src/lib/vehicleSoundProfiles.js');
      const manifest = await (await fetch('/src/lib/vehicleAudioManifest.json')).json();
      a.stopEngineSound();
      const unique = new Map();
      for (const v of VEHICLES) {
        const profile = getVehicleSoundProfile(v);
        if (profile.recorded) unique.set(profile.file, v);
      }
      const checks = [];
      for (const vehicle of unique.values()) {
        a.startEngineSound(vehicle); a.updateEngineSound(35, .7);
        for (let i=0; i<100 && !a.getEngineSoundState()?.loaded; i++) await new Promise(r=>setTimeout(r,50));
        checks.push(a.getEngineSoundState());
        a.stopEngineSound();
      }
      const g2 = VEHICLES.find(v=>v.id==='g2_2026');
      const g3 = VEHICLES.find(v=>v.id==='g3');
      a.startEngineSound(g2); a.stopEngineSound(); a.startEngineSound(g3); a.updateEngineSound(40,.8);
      await new Promise(r=>setTimeout(r,350));
      const restarted = a.getEngineSoundState();
      a.setSoundEnabled(false);
      const muted = a.getEngineSoundState();
      a.setSoundEnabled(true);
      await new Promise(r=>setTimeout(r,100));
      a.updateEngineSound(40,.8);
      const resumed = a.getEngineSoundState();
      a.updateEngineSound(0,0);
      await new Promise(r=>setTimeout(r,1000));
      const idle = a.getEngineSoundState();
      a.stopEngineSound();
      await new Promise(r=>setTimeout(r,500));
      const stopped = a.getEngineSoundState();
      return { models:Object.keys(manifest).length, checks, restarted, muted, resumed, idle, stopped };
    });
    assert(result.checks.every(s=>s?.recorded && s.loaded), 'Every included model recording must decode/play');
    assert.equal(result.restarted.vehicleId,'g3'); assert(result.restarted.loaded, 'Old delayed stop must not kill new ride');
    assert.equal(result.muted,null); assert(result.resumed.loaded);
    assert(result.idle.sampleGain < .0001, 'Stationary vehicle must be silent');
    assert.equal(result.stopped,null);
    await page.evaluate(()=>{location.hash='/drag?vehicle=g3';});
    await page.getByRole('button',{name:/LINE UP/}).click();
    await page.keyboard.down('w');
    await page.waitForTimeout(4500);
    await page.keyboard.up('w');
    const drag=await page.evaluate(async()=>{
      const a=await import(window.__soundModuleUrl);return a.getEngineSoundState();
    });
    console.log('DRAG_AUDIO',JSON.stringify(drag));
    assert.equal(drag?.vehicleId,'g3');assert(drag.loaded && drag.sampleGain>.01,'Drag race must produce motor sound');
    await page.evaluate(()=>{location.hash='/';});
    assert.deepEqual(errors,[]);
    console.log('PASS',JSON.stringify({models:result.models,recordings:result.checks.length,restart:true,mute:true,idleSilent:true,dragAudio:true,errors}));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
