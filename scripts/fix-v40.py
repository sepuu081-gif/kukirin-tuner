exec((__import__('pathlib').Path(__file__).parent/'update-v40.py').read_text(encoding='utf-8').split("edit('src/pages/BuildShop.jsx'")[0])
edit('src/pages/TelemetryRace.jsx',[
 ('reset();','resetCrash();'),
 ("if (next > best) localStorage", "if (!isTrial && next > best) localStorage"),
 ('}, [isWheelying, selectedTrick, crashed, killed]);','}, [isWheelying, selectedTrick, crashed, killed, isTrial]);'),
 ('setTrickScore(score => {\n        const reward', 'const reward'),
 ('setTraining(reward.state);\n        const next = score + reward.points;', 'setTraining(reward.state);\n        setTrickScore(score => {\n        const next = score + reward.points;'),
 ('const [riderMotion, setRiderMotion]', 'const balanceRef = useRef(0);\n  const balanceInput = useRef(0);\n  const [balance, setBalance] = useState(0);\n  const [riderMotion, setRiderMotion]'),
 ('const wheelie = accel &&', 'let wheelie = accel &&'),
 ('setIsWheelying(wheelie);', '''if (practice === 'training' && wheelie) {
      balanceRef.current = Math.max(-1, Math.min(1, balanceRef.current + .004 + balanceInput.current * .026 - (brake ? .04 : 0)));
      if (Math.abs(balanceRef.current) >= 1) { wheelie=false; balanceRef.current=0; }
    } else balanceRef.current *= .8;
    setBalance(balanceRef.current);
    setIsWheelying(wheelie);'''),
 ('isPractice, vehicle]);','isPractice, practice, vehicle]);'),
 ('resetCrash();\n              trainingRef', 'resetCrash();\n              balanceRef.current=0; balanceInput.current=0; setBalance(0);\n              motionRef.current={ braking:false, turn:0 };\n              if (isTrial) lifetimeKmRef.current=getLifetimeKm(vehicleId);\n              trainingRef'),
 ('riderMotion.turn}\n', 'riderMotion.turn}\n            balance={balance}\n'),
 ('<progress aria-label="Wheelie training progress"', '''{practice === 'training' && <div className="training-balance">
              <label>{tr('Balance')} <meter min="-1" max="1" low="-.65" high=".65" optimum="0" value={balance} aria-label="Wheelie balance" /></label>
              <div className="upgrade-actions">{[[-1,'Body forward'],[1,'Body back']].map(([direction,label]) => <button key={direction} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); balanceInput.current=direction; }} onPointerUp={() => { balanceInput.current=0; }} onPointerCancel={() => { balanceInput.current=0; }} onLostPointerCapture={() => { balanceInput.current=0; }}>{tr(label)}</button>)}</div>
              <small>{tr('Keep balance in the centre. Switching tricks builds your combo.')}</small>
            </div>}
            <progress aria-label="Wheelie training progress"'''),
 ('keys.current = { w: false, s: false, wheelie: false };', 'balanceInput.current=0; motionRef.current.turn=0;\n        keys.current = { w: false, s: false, wheelie: false };'),
 ])
edit('src/components/RideRoadPreview.jsx', [
 ('  braking = false,','  balance = 0,\n  braking = false,'),
 ('braking={braking} turn={turn}', 'balance={balance} braking={braking} turn={turn}'),
 ])
edit('src/components/VehicleRideArt.jsx',[
 ('({ braking = false, turn = 0, vehicle,', '({ balance = 0, braking = false, turn = 0, vehicle,'),
 ('24 * (1 - wheelieBarFactor * .65)', '(24 + balance * 12) * (1 - wheelieBarFactor * .65)'),
 ])
edit('src/components/RideScene3D.jsx',[
 ('({ braking = false,', '({ balance = 0, braking = false,'),
 ('posture, braking, turn }','posture, braking, turn, balance }'),
 ('live.current.isWheelying ? -.42 : 0','live.current.isWheelying ? -.42 - live.current.balance * .2 : 0'),
 ])
edit('src/pages/CityRide.jsx',[
 ("import { getVehiclePhoto }", "import { getTires, saveTires, tireEffects, wearTires } from '../lib/rideUpgrades';\nimport { getCodeRideModifiers } from '../lib/codeRewards';\nimport { getVehiclePhoto }"),
 ('function vehicleGlyph(vehicle, color)', 'function vehicleGlyph(vehicle, color, speed, braking, turn)'),
 ('<VehicleRideArt vehicle={vehicle} compact />', '<VehicleRideArt vehicle={vehicle} compact speed={speed} moving={speed > .8} braking={braking} turn={turn} />'),
 ("const [screen, setScreen]", "const tiresRef=useRef(getTires(vehicle, build));\n  const [screen, setScreen]"),
 ('const charge = getVehicleCharge(vehicle?.id, vehicle, build).pct;', 'tiresRef.current=getTires(vehicle, build);\n    const charge = getVehicleCharge(vehicle?.id, vehicle, build).pct;'),
 ('if (vehicle?.id && Number.isFinite(simRef.current.battery)) setVehicleCharge', 'if (vehicle?.id) saveTires(vehicle.id, tiresRef.current);\n    if (vehicle?.id && Number.isFinite(simRef.current.battery)) setVehicleCharge'),
 ('const grip = weatherRef.current.grip;', 'const tyre=tireEffects(vehicle, tiresRef.current);\n      const grip = weatherRef.current.grip * tyre.grip;'),
 ('const maxSpeed = Math.min(stats.topSpeed, 190);', 'const maxSpeed = stats.topSpeed;'),
 ('const gas = inputRef.current.gas && s.battery > .1;', 'const gas = inputRef.current.gas && !inputRef.current.brake && s.battery > .1;'),
 ('4.8 * grip * 3.6', '4.8 * grip * getCodeRideModifiers().braking * 3.6'),
 ('const coastMs2 = .12 +','const coastMs2 = .12 * tyre.rolling +'),
 ('s.distance += s.speed * dt / 3600;', 'const travelled=s.speed * dt / 3600;\n      s.distance += travelled;\n      tiresRef.current=wearTires(tiresRef.current, travelled, { throttle:s.throttle, brake:inputRef.current.brake, rate:tyre.wearRate });'),
 ('(power * dt / 3600)', '((power + .016 * (tyre.rolling-1) * (stats.totalWeight+78) * 9.81 * s.speed/3.6) * tyre.energy * dt / 3600)'),
 ])
# Pass city lane movement to the rider, keeping the existing route/lane controls.
p=root/'src/pages/CityRide.jsx';s=p.read_text(encoding='utf-8');import re
s=re.sub(r'vehicleGlyph\(vehicle, (vehicle\?\.accentColor \|\| [^)]*)\)',r'vehicleGlyph(vehicle, \1, speed, inputRef.current.brake, lane-1)',s)
p.write_text(s,encoding='utf-8')
edit('src/pages/DragRace.jsx',[
 ('import { use', 'import { getTires, saveTires, tireEffects, wearTires } from "../lib/rideUpgrades";\nimport { use'),
 ('const maxSpd = stats.topSpeed;', 'const tires=getTires(vehicle, build);\n    const tyre=tireEffects(vehicle, tires);\n    const maxSpd = stats.topSpeed;'),
 ('0.016 * systemMass * 9.81', '0.016 * tyre.rolling * systemMass * 9.81'),
 ('const accelStep = acceleration * 0.08', 'const accelStep = acceleration * tyre.grip * 0.08'),
 ('setPlayerSpeed(playerSpeedRef.current);', 'saveTires(vehicle.id, wearTires(tires, playerSpeedRef.current * .08 / 3600, { throttle:keys.current.w ? 1 : 0, rate:tyre.wearRate }));\n    setPlayerSpeed(playerSpeedRef.current);'),
 ])
edit('src/lib/i18n.jsx', [('const et = {', '''const et = {
  "Balance":"Tasakaal", "Body forward":"Keha ette", "Body back":"Keha taha",
  "Keep balance in the centre. Switching tricks builds your combo.":"Hoia tasakaal keskel. Trikke vahetades kasvatad kombot.",''')])
print('v40 fixes and city/drag integration applied')
