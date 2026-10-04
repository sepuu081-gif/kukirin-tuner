from pathlib import Path
root=Path(__file__).resolve().parent.parent
def edit(file, pairs):
 p=root/file
 s=p.read_text(encoding='utf-8')
 for old,new in pairs:
  assert old in s, (file,old[:120])
  s=s.replace(old,new)
 p.write_text(s,encoding='utf-8')

edit('src/pages/BuildShop.jsx',[
 ('import WeldEffect', 'import TireWorkshop from "../components/TireWorkshop";\nimport PartComparison from "../components/PartComparison";\nimport WeldEffect'),
 ('const [pendingPart, setPendingPart]', 'const [comparison, setComparison] = useState(null);\n  const [pendingPart, setPendingPart]'),
 ('{/* Tabs */}', '''<TireWorkshop key={build.parts?.wheel?.id || 'stock'} vehicle={vehicle} build={build} />
        <div className="upgrade-actions mb-4">
          <button onClick={() => navigate(`/telemetry/${vehicleId}?practice=training`)}>{tr('Riding training')}</button>
          <button onClick={() => { saveBuild(build); navigate(`/telemetry/${vehicleId}?practice=trial`); }}>{tr('Garage test track')} · 60 s</button>
        </div>
        {/* Tabs */}'''),
 ('{/* Right: Parts catalog */}', '{/* Right: Parts catalog */}'),
 ('<div className="part-catalog-list', '''{comparison && <PartComparison vehicle={vehicle} build={build} part={comparison} isBms={activeCategory === 'bms'} installed={installedPart?.id === comparison.id} fits={activeCategory === 'bms' || checkPartFit(comparison, vehicle, build.weldCount)} onClose={() => setComparison(null)} onInstall={() => equip(comparison)} />}
              <div className="part-catalog-list'''),
 ('onClick={() => equip(part)}','onClick={() => setComparison(part)}'),
 ('{installed ? tr("INSTALLED") : fits ? tr("Install") : tr("Needs welding")}','{installed ? tr("INSTALLED") : fits ? tr("Install") : tr("Needs welding")}'),
 ('<button type="button" className="part-equip-button"','<button type="button" className="part-equip-button" onPointerDown={(event) => event.stopPropagation()}'),
 ('onClick={() => setActiveCategory(cat.id)}','onClick={() => { setActiveCategory(cat.id); setComparison(null); }}'),
 ('onChange={(event) => setActiveCategory(event.target.value)}','onChange={(event) => { setActiveCategory(event.target.value); setComparison(null); }}'),
 ('<button type="button" className="part-equip-button" onPointerDown=', '''<button type="button" className="part-equip-button" onClick={(event) => { event.stopPropagation(); setComparison(part); }}>{tr('Compare')}</button>
                      <button type="button" className="part-equip-button" onPointerDown='''),
 ])

edit('src/pages/TelemetryRace.jsx',[
 ('import WheelieTrickPicker', '''import { getTires, saveTires, tireEffects, wearTires, newTraining, advanceTraining, scoreTraining, getTrainingRecords, saveTrainingRecords } from '../lib/rideUpgrades';
import WheelieTrickPicker'''),
 ('const forceStock =', '''const practice = new URLSearchParams(location.search).get('practice');
  const isPractice = practice === 'trial' || practice === 'training';
  const isTrial = practice === 'trial';
  const practiceDuration = isTrial ? 60 : 90;
  const forceStock ='''),
 ('const [speed, setSpeed]', '''const tiresRef = useRef(vehicle ? getTires(vehicle, build) : null);
  const trainingRef = useRef(newTraining());
  const [training, setTraining] = useState(newTraining);
  const [records, setRecords] = useState(() => getTrainingRecords(vehicleId));
  const [practiceResult, setPracticeResult] = useState(null);
  const [riderMotion, setRiderMotion] = useState({ braking:false, turn:0 });
  const motionRef = useRef({ braking:false, turn:0 });
  const [speed, setSpeed]'''),
 ('const vehicleBroken = damageEnabled()', 'const vehicleBroken = !isPractice && damageEnabled()'),
 ('saveBatteryProfile(vehicleId, batteryId, batteryProfileRef.current);','if (isTrial) return;\n    saveTires(vehicleId, tiresRef.current);\n    saveBatteryProfile(vehicleId, batteryId, batteryProfileRef.current);'),
 ('}, [vehicleId, batteryId]);','}, [vehicleId, batteryId, isTrial]);'),
 ('if (!deployed || crashed) return;\n    let id;', 'if (!deployed || crashed || isPractice) return;\n    let id;'),
 ('}, [deployed, crashed, police ===', '}, [deployed, crashed, isPractice, police ==='),
 ('const gripMod = w.gripMod;', 'const tyre = tireEffects(vehicle, tiresRef.current);\n    const gripMod = w.gripMod * tyre.grip;'),
 ('0.016 * systemMass * 9.81','0.016 * tyre.rolling * systemMass * 9.81'),
 ('const coastLoss = 0.16 +','const coastLoss = 0.16 * tyre.rolling +'),
 ('const netPower = Math.max(-500, tractionPower + cruisePower - regenPower);', 'const extraRollingPower = .016 * (tyre.rolling - 1) * ((stats?.totalWeight || 25) + 78) * 9.81 * nextSpeed / 3.6;\n    const netPower = Math.max(-500, (tractionPower + cruisePower + extraRollingPower) * tyre.energy - regenPower);'),
 ('damageEnabled() && next', '!isPractice && damageEnabled() && next'),
 ('damageEnabled() && speedRef.current > 5','!isPractice && damageEnabled() && speedRef.current > 5'),
 ('setIsWheelying(wheelie);', '''setIsWheelying(wheelie);
    tiresRef.current = wearTires(tiresRef.current, distanceDelta, { throttle:throttleRef.current, brake, wheelie, rate:tyre.wearRate });
    trainingRef.current = advanceTraining(trainingRef.current, wheelie, .08);
    setTraining(trainingRef.current);
    motionRef.current = { braking:brake && nextSpeed > .5, turn:motionRef.current.turn };
    setRiderMotion({ ...motionRef.current });'''),
 ('nominalBatteryWh]);','nominalBatteryWh, isPractice, vehicle]);'),
 ('const next = score + getTrickPoints(selectedTrick);', '''const reward = scoreTraining(trainingRef.current, selectedTrick, getTrickPoints(selectedTrick));
        trainingRef.current = reward.state;
        setTraining(reward.state);
        const next = score + reward.points;'''),
 ('const saveLifetime = () => localStorage.setItem', 'if (isTrial) return;\n    const saveLifetime = () => localStorage.setItem'),
 ('}, [deployed, vehicleId]);','}, [deployed, vehicleId, isTrial]);'),
 ('const wobblePct =', '''useEffect(() => {
    if (!deployed) return;
    const persist = () => { if (!isTrial) setRecords(saveTrainingRecords(vehicleId, trainingRef.current)); };
    const timer = setInterval(persist, 2500);
    return () => { clearInterval(timer); persist(); };
  }, [deployed, vehicleId, isTrial]);

  useEffect(() => {
    if (!deployed || !isPractice || rideSeconds < practiceDuration) return;
    touchInputs.current = { gas:false, brake:false, wheelie:false };
    keys.current = { w:false, s:false };
    speedRef.current = 0;
    throttleRef.current = 0;
    setSpeed(0);
    setIsWheelying(false);
    setPracticeResult({ ...trainingRef.current, maxSpeed:maxRideSpeed, distance:tripDistance });
    saveCurrentRideLog(isTrial ? 'garage-test' : 'training');
    setDeployed(false);
  }, [deployed, isPractice, isTrial, rideSeconds, practiceDuration, maxRideSpeed, tripDistance, saveCurrentRideLog]);

  const wobblePct ='''),
 ('<h1 className="text-2xl', '''{isPractice && <div className="upgrade-card"><strong>{tr(isTrial ? 'Garage test track' : 'Riding training')} · {practiceDuration} s</strong><p>{tr(isTrial ? 'Test your build without spending stored battery or mileage.' : 'Hold wheelie, change tricks and build a combo. No police or part failures.')}</p></div>}
          {practiceResult && <div className="upgrade-card" data-testid="practice-result"><strong>{tr('Session complete')}</strong><p>{practiceResult.maxSpeed.toFixed(1)} km/h · {practiceResult.distance.toFixed(3)} km</p><p>{tr('Longest wheelie')} {practiceResult.longestWheelie.toFixed(1)} s · {tr('Combo')} ×{practiceResult.bestCombo} · {practiceResult.score} pts</p></div>}
          <div className="upgrade-card"><strong>{tr('Personal records')}</strong><p>{tr('Longest wheelie')} {records.longestWheelie.toFixed(1)} s · {tr('Combo')} ×{records.bestCombo} · {records.score} pts</p></div>
          <h1 className="text-2xl'''),
 ('const freshCharge = getVehicleCharge(vehicleId, vehicle, build).pct;', '''const freshCharge = isTrial ? 100 : getVehicleCharge(vehicleId, vehicle, build).pct;
              reset();
              trainingRef.current = newTraining(); setTraining(trainingRef.current);
              setPracticeResult(null);'''),
 ('setVehicleCharge(vehicleId, freshCharge, false);','if (!isTrial) setVehicleCharge(vehicleId, freshCharge, false);'),
 ('disabled={vehicleBroken || batteryPct < 1}','disabled={vehicleBroken || (!isTrial && batteryPct < 1)}'),
 ('batteryPct < 1 ? "CHARGE AT HOME"','!isTrial && batteryPct < 1 ? "CHARGE AT HOME"'),
 ('<RideRoadPreview\n', '''<div className="upgrade-card ride-training-strip">
            <strong>{isPractice ? `${tr(isTrial ? 'Garage test track' : 'Riding training')} · ${Math.max(0, practiceDuration-rideSeconds)} s` : tr('Ride progress')}</strong>
            <div>{tr('Wheelie')} {training.currentWheelie.toFixed(1)} s · {tr('Combo')} ×{training.combo} · {tr('Best')} {Math.max(records.bestCombo, training.bestCombo)}</div>
            <progress aria-label="Wheelie training progress" max="10" value={training.currentWheelie} />
            <small>{tr('Grip')} {Math.round(tireEffects(vehicle, tiresRef.current).grip * weather.gripMod * 100)}% · {tr('Wear')} {Math.max(tiresRef.current.frontWear, tiresRef.current.rearWear).toFixed(1)}% · {tiresRef.current.frontPressure.toFixed(1)}/{tiresRef.current.rearPressure.toFixed(1)} bar</small>
          </div>
          <RideRoadPreview
            braking={riderMotion.braking}
            turn={riderMotion.turn}
'''),
 ('<div className="ride-speed-envelope', '''<div className="upgrade-actions ride-steering"><button aria-label="Lean left" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); motionRef.current.turn=-1; setRiderMotion({ ...motionRef.current }); }} onPointerUp={() => { motionRef.current.turn=0; setRiderMotion({ ...motionRef.current }); }} onPointerCancel={() => { motionRef.current.turn=0; }} onLostPointerCapture={() => { motionRef.current.turn=0; setRiderMotion({ ...motionRef.current }); }}>← {tr('Lean')}</button><button aria-label="Lean right" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); motionRef.current.turn=1; setRiderMotion({ ...motionRef.current }); }} onPointerUp={() => { motionRef.current.turn=0; setRiderMotion({ ...motionRef.current }); }} onPointerCancel={() => { motionRef.current.turn=0; }} onLostPointerCapture={() => { motionRef.current.turn=0; setRiderMotion({ ...motionRef.current }); }}>{tr('Lean')} →</button></div>
          <div className="ride-speed-envelope'''),
 ])

edit('src/components/RideRoadPreview.jsx',[
 ('  speed,','  braking = false,\n  turn = 0,\n  speed,'),
 ('vehicle={vehicle} motorCount={motorCount}', 'braking={braking} turn={turn} vehicle={vehicle} motorCount={motorCount}'),
 ('<VehicleRideArt vehicle={vehicle}', '<VehicleRideArt braking={braking} turn={turn} vehicle={vehicle}'),
 ])
edit('src/components/RideScene3D.jsx',[
 ('({ vehicle, motorCount,', '({ braking = false, turn = 0, vehicle, motorCount,'),
 ('{ speed, isWheelying, trick, posture }','{ speed, isWheelying, trick, posture, braking, turn }'),
 ("p.posture === 'tucked'", "p.posture === 'tuck'"),
 ("if (stunt === 'one-hand')", '''if (moto && stunt === 'normal') {
        hip=[.25,.88,0]; shoulder=[-.04,1.22,0];
        knees=[[.02,.66,-.13],[.02,.66,.13]]; feet=[[.22,.46,-.13],[.22,.46,.13]];
      }
      if (stunt === 'normal') {
        const shift = p.braking ? -.13 : p.posture === 'tuck' ? -.09 : 0;
        hip[0] += shift * .35; shoulder[0] += shift;
        shoulder[1] -= p.braking ? .06 : 0;
        hip[2] += p.turn * .05; shoulder[2] += p.turn * .16;
      }
      el.dataset.riderState = moto && stunt === 'normal' ? 'seated' : p.braking ? 'braking' : p.turn ? 'leaning' : 'standing';
      if (stunt === 'one-hand')'''),
 ])
edit('src/components/VehicleRideArt.jsx',[
 ('function DetailedPhotoRider({ helmet, layout, trick, posture, vector = false })', 'function DetailedPhotoRider({ helmet, layout, trick, posture, moto = false, braking = false, turn = 0, vector = false })'),
 ('const extra = getExtraPhotoPose(trick, layout);', '''const extra = { ...getExtraPhotoPose(trick, layout) };
  if (moto && trick === 'normal') {
    const [, , , , , hx, hy] = layout;
    extra.bodyTransform = 'translate(8 20) rotate(-18 52 20)';
    extra.leftLeg='M62 54 L43 68 L61 78'; extra.leg='M66 54 L48 71 L65 81';
    extra.leftBoot='M58 79 L65 79'; extra.rightBoot='M62 82 L69 82';
    extra.leftArm=`M55 16 L47 28 L${hx} ${hy}`; extra.rightArm=`M58 19 L49 31 L${hx+2} ${hy+1}`;
  }
  if (trick === 'normal' && (braking || turn)) extra.bodyTransform = `${extra.bodyTransform || ''} rotate(${braking ? -10 : turn * 5} 56 34)`;'''),
 ('data-trick={trick} viewBox=', "data-trick={trick} data-rider-state={moto && trick === 'normal' ? 'seated' : braking ? 'braking' : turn ? 'leaning' : 'standing'} viewBox="),
 ('({ vehicle, appearance, posture, moving,', '({ braking = false, turn = 0, vehicle, appearance, posture, moving,'),
 ('<DetailedPhotoRider helmet={helmet} layout={layout}', "<DetailedPhotoRider moto={vehicle?.vehicleType === 'emoto'} braking={braking} turn={turn} helmet={helmet} layout={layout}"),
 ])

codes={
 'FRESHTYRES':("effect:'tyres', ", 'Replace tyres on every vehicle once.'),
 'TIREGUARD':('', '65% less tyre wear during rides.'),
 'GRIPMASTER':('', '12% grip recovery, capped at fresh dry tyre grip.'),
 'ECOFLOW':('', '10% less driving battery energy; regeneration unchanged.'),
 'COMBOKING':('', '50% more trick combo points.'),
 'COOLPRO':('', '40% less heat generation. Replaces COOLMASTER.'),
 'BRAKEKING':('', '30% stronger brakes; tyre and weather grip still apply.'),
 'REP10000':('respectBonus:10000, ', '+10000 REP once.'),
}
new='\n'.join(f"  {code}: {{ key:'kukirin_unlock_{code.lower()}', {extra}reward:'{reward}' }}," for code,(extra,reward) in codes.items())
edit('src/lib/vehicleData.js', [('export const SECRET_CODES = {','export const SECRET_CODES = {\n'+new)])
edit('src/lib/codeRewards.js',[
 ("import { chargeAllVehicles }", "import { resetAllTires } from './rideUpgrades.js';\nimport { chargeAllVehicles }"),
 ("if (entry.effect === 'charge')", "if (entry.effect === 'tyres') resetAllTires(VEHICLES);\n  if (entry.effect === 'charge')"),
 ("heat:has('COOLMASTER')", "heat:has('COOLPRO') ? .6 : has('COOLMASTER')"),
 ("braking:has('BRAKEPRO')", "braking:has('BRAKEKING') ? 1.3 : has('BRAKEPRO')"),
 ])

translations={
 'Tyres & pressure':'Rehvid ja rõhk','Game tuning baseline':'Mängu rõhu baasseadistus','Front tyre':'Esirehv','Rear tyre':'Tagarehv','Wear':'Kulumine','Grip':'Haarduvus','Rolling resistance':'Veeretakistus','Set baseline pressure':'Taasta baasrõhk','Replace tyres':'Vaheta rehvid','Riding training':'Sõidutreening','Garage test track':'Garaaži proovirada','Build estimates':'Ehituse hinnangud','Before → after':'Enne → pärast','Top speed':'Tippkiirus','Launch acceleration':'Stardikiirendus','Heat load':'Soojuskoormus','Heat load is a relative estimate; lower is better.':'Soojuskoormus on suhteline hinnang; väiksem on parem.','Compare':'Võrdle','Test your build without spending stored battery or mileage.':'Katseta ehitust püsivat akut ega läbisõitu kulutamata.','Hold wheelie, change tricks and build a combo. No police or part failures.':'Hoia wheelie, vaheta trikke ja loo kombo. Ilma politsei ja juppide purunemiseta.','Session complete':'Treening lõpetatud','Longest wheelie':'Pikim wheelie','Combo':'Kombo','Personal records':'Isiklikud rekordid','Ride progress':'Sõidu tulemused','Wheelie':'Wheelie','Best':'Parim','Lean':'Kalluta',
 'Replace tyres on every vehicle once.':'Vahetab kõigil sõidukitel rehvid ühe korra.','65% less tyre wear during rides.':'Rehvide kulumine sõidu ajal 65% väiksem.','12% grip recovery, capped at fresh dry tyre grip.':'Taastab 12% haarduvust kuni uue kuiva rehvi tasemeni.','10% less driving battery energy; regeneration unchanged.':'Sõidu energiakulu 10% väiksem; regen ei muutu.','50% more trick combo points.':'Trikikombod annavad 50% rohkem punkte.','40% less heat generation. Replaces COOLMASTER.':'40% vähem soojust. Asendab COOLMASTER-i.','30% stronger brakes; tyre and weather grip still apply.':'30% tugevamad pidurid; rehvide ja ilma haarduvus mõjutab pidurdamist.','+10000 REP once.':'Ühekordne +10000 REP boonus.'}
import json
mapping='\n'.join(f'  {json.dumps(k,ensure_ascii=False)}: {json.dumps(v,ensure_ascii=False)},' for k,v in translations.items())
edit('src/lib/i18n.jsx',[('const et = {','const et = {\n'+mapping)])
with (root/'src/index.css').open('a',encoding='utf-8') as f:
 f.write('''
/* v40: compact phone workshops, comparisons and training. */
.upgrade-card { border:1px solid #24465f; background:linear-gradient(145deg,#101e30,#0a1422); border-radius:14px; padding:12px; margin-bottom:12px; color:#d8e9fa; font-size:12px; min-width:0; }
.upgrade-card strong { color:#82d1ff; } .upgrade-card p { color:#9badc1; font-size:11px; margin:6px 0; }
.upgrade-card summary { cursor:pointer; min-height:30px; font-weight:600; color:#82d1ff; }
.tire-workshop label { display:block; padding:7px 0; } .tire-workshop input { width:100%; accent-color:#38bdf8; min-height:36px; }
.upgrade-actions { display:flex; gap:8px; flex-wrap:wrap; }
.upgrade-actions button,.upgrade-primary { flex:1; min-height:44px; border:1px solid #28638c; border-radius:10px; background:#0c2941; color:#a6dcff; padding:8px 10px; font-size:12px; touch-action:none; }
.upgrade-primary { width:100%; } .upgrade-primary:disabled { opacity:.5; }
.comparison-row { display:flex; justify-content:space-between; gap:8px; padding:8px 0; border-bottom:1px solid #233649; }
.comparison-row strong { text-align:right; } .comparison-row small { font-size:10px; }
.part-comparison { position:relative; } .part-comparison button[aria-label] { min-width:36px; min-height:36px; }
.ride-training-strip { margin-bottom:0; padding:9px 12px; font-size:11px; }
.ride-training-strip progress { display:block; width:100%; height:5px; accent-color:#38bdf8; margin:6px 0; }
.ride-training-strip small { color:#92a9bd; } .ride-steering button { min-height:40px; }
.photo-rider { transition:transform .15s ease-out; }
''')
print('v40 changes applied')
