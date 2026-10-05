import RaceRidePreview from '../components/RaceRidePreview';
import {wallet,newDelivery,payDelivery} from '../lib/deliveryJobs';
import {submitScore} from '../lib/leaderboard';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Battery, Building2, Clock3, CloudRain, Crosshair, Factory, Flag, Gauge, Home, Navigation, Play, RotateCcw, ShieldAlert, Sun, Trees, Warehouse, Wrench, Zap } from 'lucide-react';
import { VEHICLES } from '../lib/vehicleData';
import { calcBuildStats, getAllBuilds, getBuild } from '../lib/buildState';
import { getVehicleCharge, getVehicleEnergyWh, setVehicleCharge } from '../lib/chargingState';
import { playSound, startEngineSound, stopEngineSound, stopPoliceSiren, updateEngineSound, updatePoliceSiren } from '../lib/soundEngine';
import { useLanguage } from '../lib/i18n';
import VehicleRideArt from '../components/VehicleRideArt';
import { getTires, saveTires, tireEffects, wearTires } from '../lib/rideUpgrades';
import { getCodeRideModifiers } from '../lib/codeRewards';
import { getVehiclePhoto } from '../lib/vehiclePhotos';

const MISSIONS = [
  { id: 'workshop', icon: Wrench, title: 'Workshop Express', titleEt: 'Töökoja ekspress', from: 'Old Town', fromEt: 'Vanalinn', to: 'Workshop', toEt: 'Töökoda', distance: 1.4, time: 175, reward: 75, color: '#38bdf8' },
  { id: 'harbour', icon: Warehouse, title: 'Harbour Delivery', titleEt: 'Sadama kuller', from: 'Home', fromEt: 'Kodu', to: 'Harbour', toEt: 'Sadam', distance: 2.5, time: 255, reward: 125, color: '#22d3ee' },
  { id: 'night', icon: Flag, title: 'Midnight Ring Run', titleEt: 'Kesköine ringisõit', from: 'Downtown', fromEt: 'Kesklinn', to: 'Drag Strip', toEt: 'Dragirada', distance: 3.4, time: 295, reward: 195, color: '#a78bfa' },
];
const FREE_RIDE = { id: 'free', free: true, title: 'Free Ride', titleEt: 'Vaba linnasõit', distance: 0, time: 0, reward: 0 };
const CITY_WEATHERS = [
  { id: 'clear', icon: '☀', name: 'Clear', nameEt: 'Selge', grip: 1 },
  { id: 'cloudy', icon: '☁', name: 'Cloudy', nameEt: 'Pilvine', grip: .94 },
  { id: 'rain', icon: '🌧', name: 'Rain', nameEt: 'Vihm', grip: .76 },
  { id: 'storm', icon: '⛈', name: 'Storm', nameEt: 'Torm', grip: .64 },
];
const DISTRICTS = [
  { id: 'downtown', name: 'Downtown', nameEt: 'Kesklinn', icon: Building2, limit: 50, color: '#38bdf8' },
  { id: 'oldtown', name: 'Old Town', nameEt: 'Vanalinn', icon: Home, limit: 40, color: '#f59e0b' },
  { id: 'industrial', name: 'Industrial', nameEt: 'Tööstusrajoon', icon: Factory, limit: 60, color: '#a78bfa' },
  { id: 'harbour', name: 'Harbour', nameEt: 'Sadam', icon: Warehouse, limit: 50, color: '#22d3ee' },
  { id: 'suburbs', name: 'Suburbs', nameEt: 'Äärelinn', icon: Home, limit: 50, color: '#34d399' },
  { id: 'forest', name: 'Forest Ring', nameEt: 'Metsaring', icon: Trees, limit: 70, color: '#4ade80' },
];
const MAP_POINTS = [
  { id: 'home', label: 'HOME', x: 47, y: 190 }, { id: 'oldtown', label: 'OLD TOWN', x: 78, y: 74 },
  { id: 'center', label: 'DOWNTOWN', x: 160, y: 125 }, { id: 'workshop', label: 'WORKSHOP', x: 270, y: 55 },
  { id: 'industrial', label: 'INDUSTRIAL', x: 267, y: 129 }, { id: 'harbour', label: 'HARBOUR', x: 278, y: 207 },
  { id: 'forest', label: 'FOREST RING', x: 145, y: 222 }, { id: 'drag', label: 'DRAG', x: 203, y: 183 },
];

function addCityRespect(amount) {
  const current = Number(localStorage.getItem('kukirin_respect') || 0);
  localStorage.setItem('kukirin_respect', String(Math.max(0, current + amount)));
}
function vehicleGlyph(vehicle, color, speed, braking, turn) {
  if (getVehiclePhoto(vehicle)) return <VehicleRideArt vehicle={vehicle} compact speed={speed} moving={speed > .8} braking={braking} turn={turn} />;
  return vehicle?.vehicleType === 'emoto'
    ? <div className="city-bike" style={{ '--vehicle-color': color }}><i/><b/><em/><span/></div>
    : <div className="city-scooter" style={{ '--vehicle-color': color }}><i/><b/><em/><span/></div>;
}

export default function CityRide() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const et = language === 'et';
  const builds = useMemo(() => getAllBuilds(), []);
  const fleet = useMemo(() => {
    const savedIds = Object.keys(builds);
    const preferred = ['g2_pro_2023', 'g2_2026', 'g2_max', 'g2_master', 'g2_ultra', 'g3', 'g3_pro', 'g4', 'g4_max', 't3', 'm4_max', 's1_max', 'surron_light_bee_x', 'surron_ultra_bee', 'stark_varg_mx'];
    return [...new Set([...savedIds, ...preferred])].map(id => VEHICLES.find(v => v.id === id)).filter(Boolean);
  }, [builds]);
  const [vehicleId, setVehicleId] = useState(() => localStorage.getItem('kukirin_city_vehicle') || fleet[0]?.id || 'g2_pro_2023');
  const vehicle = fleet.find(v => v.id === vehicleId) || fleet[0];
  const build = useMemo(() => getBuild(vehicle?.id), [vehicle?.id]);
  const stats = useMemo(() => vehicle ? calcBuildStats(vehicle, build) : null, [vehicle, build]);
  const tiresRef=useRef(getTires(vehicle, build));
  const [screen, setScreen] = useState('map');
  const [mission, setMission] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [battery, setBattery] = useState(() => getVehicleCharge(vehicle?.id, vehicle, build).pct);
  const [lane, setLane] = useState(1);
  const [distance, setDistance] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [traffic, setTraffic] = useState([]);
  const [roadOffset, setRoadOffset] = useState(0);
  const [collisions, setCollisions] = useState(0);
  const [fine, setFine] = useState(0);
  const [toast, setToast] = useState('');
  const [result, setResult] = useState(null);
  const [light, setLight] = useState('green');
  const [cityHour, setCityHour] = useState(17.5);
  const [weather, setWeather] = useState(CITY_WEATHERS[0]);
  const [wanted, setWanted] = useState(0);
  const [policeDistance, setPoliceDistance] = useState(0);
  const [busted, setBusted] = useState(false);
  const [districtIndex, setDistrictIndex] = useState(0);
  const [radar, setRadar] = useState(null);
  const [roadblock, setRoadblock] = useState(null);
  const inputRef = useRef({ gas: false, brake: false });
  const simRef = useRef({});
  const missionRef = useRef(null);
  const wantedRef = useRef(0);
  const policeDistanceRef = useRef(0);
  const weatherRef = useRef(CITY_WEATHERS[0]);

  useEffect(() => {
    tiresRef.current=getTires(vehicle, build);
    const charge = getVehicleCharge(vehicle?.id, vehicle, build).pct;
    setBattery(charge); simRef.current.battery = charge;
    localStorage.setItem('kukirin_city_vehicle', vehicle?.id || '');
  }, [vehicle?.id, vehicle, build]);

  const persist = useCallback(() => {
    if (vehicle?.id) saveTires(vehicle.id, tiresRef.current);
    if (vehicle?.id && Number.isFinite(simRef.current.battery)) setVehicleCharge(vehicle.id, simRef.current.battery, false);
  }, [vehicle?.id]);
  const finish = useCallback((won) => {
    const active = missionRef.current;
    if(simRef.current.finished)return;simRef.current.finished=true;
    inputRef.current = { gas: false, brake: false }; stopEngineSound(); stopPoliceSiren(); persist();
    const reward = won ? Math.max(0, active.reward - fine) : 0;
    if (won) { if(active.delivery){const paid=payDelivery(active.id,reward);if(paid>0){addCityRespect(5);submitScore('delivery',wallet(),vehicle.name);}}else addCityRespect(reward); playSound('success'); }
    setResult({ won, reward, mission: active, distance: simRef.current.distance, collisions }); setScreen('result');
  }, [collisions, fine, persist]);
  const raiseWanted = useCallback((amount, message) => {
    const next = Math.min(5, wantedRef.current + amount);
    wantedRef.current = next; setWanted(next);
    policeDistanceRef.current = Math.max(18, policeDistanceRef.current); setPoliceDistance(policeDistanceRef.current);
    if (message) setToast(message); playSound('warning');
  }, []);

  const startMission = (selected) => {
    const charge = getVehicleCharge(vehicle.id, vehicle, build).pct;
    if (charge < 2) { setToast(et ? 'Aku on tühi. Lae kodus.' : 'Battery empty. Charge at home.'); return; }
    missionRef.current = selected;
    simRef.current = { speed: 0, throttle: 0, battery: charge, distance: 0, time: selected.time, elapsed: 0, lane: 1, spawn: 0, collisionUntil: 0, intersection: 0, speeding: 0, weatherIndex: 0, districtIndex: 0, busted: false, nextRadar: .18, radar: null, nextRoadblock: .65, roadblock: null };
    setMission(selected); setSpeed(0); setBattery(charge); setLane(1); setDistance(0); setSecondsLeft(selected.time);
    wantedRef.current = 0; policeDistanceRef.current = 0; weatherRef.current = CITY_WEATHERS[0];
    setTraffic([]); setCollisions(0); setFine(0); setLight('green'); setCityHour(17.5); setWeather(CITY_WEATHERS[0]); setWanted(0); setPoliceDistance(0); setBusted(false); setDistrictIndex(0); setRadar(null); setRoadblock(null); setResult(null); setToast(''); setScreen('ride');
    setVehicleCharge(vehicle.id, charge, false); startEngineSound(vehicle, stats); playSound('start');
  };

  useEffect(() => {
    if (screen !== 'ride' || !stats || !mission || busted) return;
    const timer = setInterval(() => {
      const s = simRef.current;
      const dt = .1;
      s.elapsed += dt;
      const nextWeatherIndex = Math.floor(s.elapsed / 40) % CITY_WEATHERS.length;
      if (nextWeatherIndex !== s.weatherIndex) {
        s.weatherIndex = nextWeatherIndex; weatherRef.current = CITY_WEATHERS[nextWeatherIndex]; setWeather(weatherRef.current);
        setToast(et ? `Ilm muutus: ${weatherRef.current.nameEt}` : `Weather changed: ${weatherRef.current.name}`);
      }
      const nextDistrict = Math.floor(s.distance / 1.1) % DISTRICTS.length;
      if (nextDistrict !== s.districtIndex) {
        s.districtIndex = nextDistrict; setDistrictIndex(nextDistrict);
        setToast(et ? `Uus piirkond: ${DISTRICTS[nextDistrict].nameEt}` : `New district: ${DISTRICTS[nextDistrict].name}`);
      }
      const tyre=tireEffects(vehicle, tiresRef.current);
      const grip = weatherRef.current.grip * tyre.grip;
      const maxSpeed = stats.topSpeed;
      const gas = inputRef.current.gas && !inputRef.current.brake && s.battery > .1;
      s.throttle += ((gas ? 1 : 0) - s.throttle) * (gas ? .13 : .24);
      if (inputRef.current.brake) s.throttle = 0;
      if (gas) {
        const speedRatio = s.speed / Math.max(1, maxSpeed);
        const powerToWeight = (stats.watts || 500) / Math.max(20, (stats.totalWeight || vehicle.weight || 25) + 78);
        const motorAccel = Math.max(.8, Math.min(5.4, powerToWeight / 8.5));
        const tractionLimit = Math.min(1, grip * (s.speed < 12 ? .9 : 1));
        const powerFalloff = Math.max(.07, 1 - speedRatio * speedRatio);
        const launchTorque = 1 + Math.max(0, 1 - speedRatio / .32) * .28;
        s.speed = Math.min(maxSpeed, s.speed + motorAccel * tractionLimit * powerFalloff * launchTorque * (.38 + s.throttle * .62) * 3.6 * dt);
      } else if (inputRef.current.brake) {
        s.speed = Math.max(0, s.speed - 4.8 * grip * getCodeRideModifiers().braking * 3.6 * dt);
      } else {
        const coastMs2 = .12 * tyre.rolling + Math.pow(s.speed / 90, 2) * .62;
        s.speed = Math.max(0, s.speed - coastMs2 * 3.6 * dt);
      }
      const travelled=s.speed * dt / 3600;
      s.distance += travelled;
      tiresRef.current=wearTires(tiresRef.current, travelled, { throttle:s.throttle, brake:inputRef.current.brake, rate:tyre.wearRate });
      if (!mission.free) s.time = Math.max(0, s.time - dt);
      const power = inputRef.current.gas ? Math.min(stats.watts, Math.max(450, stats.mechanicalPower || stats.watts) * .75) : Math.max(70, stats.watts * .04);
      s.battery = Math.max(0, s.battery - ((power + .016 * (tyre.rolling-1) * (stats.totalWeight+78) * 9.81 * s.speed/3.6) * tyre.energy * dt / 3600) / getVehicleEnergyWh(vehicle, build) * 100);
      s.spawn -= dt;
      if (s.spawn <= 0) {
        s.spawn = Math.max(.9, 3.1 - s.speed / 80) + Math.random() * 1.4;
        const openSpawnLanes = [0, 1, 2].filter(candidate => candidate !== s.lane);
        const spawnLane = openSpawnLanes[Math.floor(Math.random() * openSpawnLanes.length)];
        setTraffic(current => [...current.slice(-5), { id: Date.now() + Math.random(), lane: spawnLane, y: -15, pace: 15 + Math.random() * 43, color: ['#f43f5e','#f59e0b','#a78bfa','#34d399','#60a5fa'][Math.floor(Math.random() * 5)] }]);
      }
      setTraffic(current => current.map(car => ({ ...car, y: car.y + Math.max(.7, (s.speed - car.pace) * .06 + 1.1) })).filter(car => car.y < 118));
      setRoadOffset(value => (value + s.speed * .19) % 100);
      const phase = Math.floor(s.elapsed % 18);
      setLight(phase < 11 ? 'green' : phase < 14 ? 'amber' : 'red'); setCityHour((17.5 + s.elapsed / 15) % 24);

      const currentDistrict = DISTRICTS[s.districtIndex];
      if (mission.free && !s.radar && s.distance >= s.nextRadar) {
        s.radar = { y: 4, limit: currentDistrict.limit, checked: false }; s.nextRadar += .72 + Math.random() * .35;
      }
      if (s.radar) {
        s.radar.y += Math.max(.5, s.speed * .045);
        if (!s.radar.checked && s.radar.y >= 78) {
          s.radar.checked = true;
          if (s.speed > s.radar.limit + 5) raiseWanted(1, et ? `Radar! ${Math.round(s.speed)} / ${s.radar.limit} km/h` : `Speed camera! ${Math.round(s.speed)} / ${s.radar.limit} km/h`);
          else setToast(et ? 'Radar läbitud lubatud kiirusega' : 'Speed camera passed safely');
        }
        if (s.radar.y > 112) s.radar = null;
        setRadar(s.radar ? { ...s.radar } : null);
      }
      if (mission.free && wantedRef.current >= 3 && !s.roadblock && s.distance >= s.nextRoadblock) {
        s.roadblock = { y: -3, openLane: Math.floor(Math.random() * 3), hit: false }; s.nextRoadblock += .8 + Math.random() * .45;
        setToast(et ? 'HOIATUS: politsei teetõke ees!' : 'WARNING: police roadblock ahead!');
      }
      if (s.roadblock) {
        s.roadblock.y += Math.max(.4, s.speed * .032);
        if (!s.roadblock.hit && s.roadblock.y > 72 && s.roadblock.y < 96 && s.lane !== s.roadblock.openLane) {
          s.roadblock.hit = true; s.speed *= .18; s.collisionUntil = Date.now() + 1700;
          setCollisions(value => value + 1); raiseWanted(1, et ? 'Sõitsid teetõkkesse!' : 'You hit the roadblock!'); playSound('crash'); navigator.vibrate?.([120, 50, 180]);
        }
        if (s.roadblock.y > 112) { if (!s.roadblock.hit) setToast(et ? 'Pääsesid teetõkkest läbi!' : 'Roadblock cleared!'); s.roadblock = null; }
        setRoadblock(s.roadblock ? { ...s.roadblock } : null);
      }

      if (mission.free && s.speed > currentDistrict.limit + 10) {
        s.speeding += dt;
        if (s.speeding >= 7) { s.speeding = 0; raiseWanted(1, et ? 'Kiiruseületamine: tagaotsimine tõusis' : 'Speeding: wanted level increased'); }
      } else s.speeding = Math.max(0, s.speeding - dt * 1.5);
      const crossing = Math.floor(s.distance / .52);
      if (crossing > s.intersection) {
        s.intersection = crossing;
        if (phase >= 14 && s.speed > 12) {
          setFine(value => value + 15);
          if (mission.free) raiseWanted(1, et ? 'Punane tuli: tagaotsimine tõusis' : 'Red light: wanted level increased');
          else { setToast(et ? 'Punase tule trahv −15 REP' : 'Red light fine −15 REP'); playSound('warning'); }
        }
      }
      if (wantedRef.current > 0) {
        const policeSpeed = 52 + wantedRef.current * 9;
        policeDistanceRef.current = Math.max(4, Math.min(100, policeDistanceRef.current + (policeSpeed - s.speed) * .006));
        setPoliceDistance(policeDistanceRef.current); updatePoliceSiren(true, policeDistanceRef.current);
        if (policeDistanceRef.current >= 99.5 && !s.busted) {
          s.busted = true; inputRef.current = { gas: false, brake: false }; s.speed = 0;
          const policeFine = wantedRef.current * 20; setFine(value => value + policeFine); addCityRespect(-policeFine);
          setBusted(true); stopEngineSound(); stopPoliceSiren(); playSound('warning');
        }
      } else { policeDistanceRef.current = 0; setPoliceDistance(0); stopPoliceSiren(); }
      setSpeed(s.speed); setBattery(s.battery); setDistance(s.distance); setSecondsLeft(mission.free ? Math.floor(s.elapsed) : Math.ceil(s.time)); updateEngineSound(s.speed, gas ? s.throttle : .08, inputRef.current.brake);
      if (!mission.free && s.distance >= mission.distance) finish(true);
      else if (!mission.free && s.time <= 0) finish(false);
      else if (s.battery <= .05) finish(false);
    }, 100);
    return () => clearInterval(timer);
  }, [screen, stats, mission, vehicle, build, finish, et, raiseWanted, busted]);

  useEffect(() => {
    if (screen !== 'ride') return;
    const hit = traffic.find(car => car.lane === lane && car.y > 72 && car.y < 101);
    if (hit && Date.now() > simRef.current.collisionUntil) {
      simRef.current.collisionUntil = Date.now() + 1500; simRef.current.speed *= .38;
      setTraffic(current => current.filter(car => car.id !== hit.id)); setCollisions(value => value + 1); setFine(value => value + 10);
      if (missionRef.current?.free) raiseWanted(1, et ? 'Kokkupõrge: tagaotsimine tõusis' : 'Collision: wanted level increased'); else setToast(et ? 'Kokkupõrge −10 REP' : 'Collision −10 REP');
      playSound('crash'); navigator.vibrate?.([80, 40, 120]);
    }
  }, [traffic, lane, screen, et, raiseWanted]);

  useEffect(() => {
    const back = event => {
      if (screen === 'ride') { event.preventDefault(); inputRef.current = { gas: false, brake: false }; persist(); stopEngineSound(); stopPoliceSiren(); setScreen('map'); }
      else if (screen === 'result') { event.preventDefault(); setScreen('map'); }
    };
    window.addEventListener('kukirin:back-request', back); return () => window.removeEventListener('kukirin:back-request', back);
  }, [screen, persist]);
  useEffect(() => {
    const release = () => { inputRef.current.gas = false; inputRef.current.brake = false; };
    window.addEventListener('blur', release);
    return () => window.removeEventListener('blur', release);
  }, []);
  useEffect(() => () => { persist(); stopEngineSound(); stopPoliceSiren(); }, [persist]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 2400); return () => clearTimeout(id); }, [toast]);

  const holdStart = (key, event) => { event.preventDefault(); try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* synthetic test pointer */ } inputRef.current[key] = true; };
  const holdEnd = (key, event) => { event?.preventDefault(); inputRef.current[key] = false; try { if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ } };
  const chooseLane = delta => setLane(current => { const next = Math.max(0, Math.min(2, current + delta)); simRef.current.lane = next; playSound('click'); return next; });
  const leaveRide = () => { inputRef.current = { gas: false, brake: false }; persist(); stopEngineSound(); stopPoliceSiren(); setScreen('map'); };
  const hourValue = Math.floor(cityHour);
  const cityTime = `${String(hourValue).padStart(2,'0')}:${String(Math.floor((cityHour - hourValue) * 60)).padStart(2,'0')}`;
  const timeClass = cityHour >= 20 || cityHour < 6 ? 'night' : cityHour >= 18 ? 'dusk' : 'day';
  const district = DISTRICTS[districtIndex];
  const continueAfterBust = () => {
    wantedRef.current = 0; policeDistanceRef.current = 0; simRef.current.busted = false; simRef.current.collisionUntil = Date.now() + 2000; simRef.current.roadblock = null;
    setWanted(0); setPoliceDistance(0); setBusted(false); setRoadblock(null); setToast(et ? 'Trahv makstud. Sõit jätkub.' : 'Fine paid. Ride continues.'); startEngineSound(vehicle, stats);
  };

  if (screen === 'ride') return <div className="city-ride-screen">
    <header className="city-hud"><button type="button" aria-label={et ? 'Tagasi kaardile' : 'Back to map'} onClick={leaveRide}><ArrowLeft/></button><div><small>{et ? mission.titleEt : mission.title}</small><strong><Navigation/> {mission.free ? distance.toFixed(2) : Math.max(0, mission.distance - distance).toFixed(2)} km</strong><small><Battery size={12}/> {battery.toFixed(1)}%</small></div><div className="city-light"><i className={light}/><span>{light.toUpperCase()}</span></div></header>
    <main className={`city-road district-${district.id} city-time-${timeClass} city-weather-${weather.id}`} style={{ '--road-offset': `${roadOffset}px`, '--district-color': district.color }}>
      <div className="city-live-ride race-ride-preview"><RaceRidePreview environment={district.id} vehicle={vehicle} build={build} speed={speed} distance={distance} seconds={simRef.current.elapsed||0} batteryPct={battery} weather={weather.id} police={wanted>0} policeDist={policeDistance} label={et?district.nameEt:district.name}/></div><div className="city-sky"><span>{et ? district.nameEt : district.name}</span><div className="city-moon"/><b/><b/><b/><b/><b/></div><div className="city-side city-side-left"><i/><i/><i/></div><div className="city-side city-side-right"><i/><i/><i/></div>
      {(weather.id === 'rain' || weather.id === 'storm') && <div className="city-rain" aria-hidden="true"/>}
      <div className="city-street"><i className="lane-mark lane-a"/><i className="lane-mark lane-b"/><div className="crosswalk" style={{ opacity: distance % .52 > .43 ? 1 : 0 }}/>
        {radar && <div className={`city-radar ${radar.checked ? 'flashed' : ''}`} style={{ top: `${radar.y}%` }}><Crosshair/><b>{radar.limit}</b><span>RADAR</span></div>}
        {roadblock && <div className="city-roadblock" style={{ top: `${roadblock.y}%` }}><div className="roadblock-bar">POLICE · POLITSEI</div>{[0,1,2].map(index => index === roadblock.openLane ? <i key={index} className="roadblock-gap">↓</i> : <i key={index} className="roadblock-car">🚓</i>)}</div>}
        {traffic.map(car => <div key={car.id} className="traffic-car" style={{ left: `${17 + car.lane * 33}%`, top: `${car.y}%`, '--car': car.color }}><span/><i/></div>)}<div className={`city-rider lane-${lane}`}>{vehicleGlyph(vehicle, build.appearance?.accentColor || vehicle.accentColor || '#38bdf8', speed, inputRef.current.brake, lane-1)}</div>
      </div>
      <div className="city-district-chip"><i style={{ background: district.color }}/><span>{et ? district.nameEt : district.name}</span><b>{district.limit}</b></div>
      <div className="city-speed"><strong>{Math.round(speed)}</strong><span>km/h</span><small>{et ? 'PIIRANG' : 'LIMIT'} {district.limit}</small></div>
      <div className="city-ride-stats"><span><Clock3/> {mission.free ? cityTime : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2,'0')}`}</span><span>{weather.icon} {et ? weather.nameEt : weather.name}</span><span><Battery/> {battery.toFixed(0)}%</span></div>
      {wanted>0&&<div className={`wanted-meter wanted-${wanted}`}><span>{et ? 'TAGAOTSIMINE' : 'WANTED'}</span><b>{[0,1,2,3,4].map(i => <i key={i}>{i < wanted ? '★' : '☆'}</i>)}</b></div>}
      {wanted > 0 && <div className="police-chase"><div><span>🚓 {et ? 'POLITSEI LÄHENEB' : 'POLICE CLOSING'}</span><b>{Math.round(policeDistance)}%</b></div><i><b style={{width:`${policeDistance}%`}}/></i></div>}{toast && <div className="city-toast">{toast}</div>}
      {busted && <div className="city-busted"><ShieldAlert/><small>{et ? 'POLITSEI PÜÜDIS SU KINNI' : 'POLICE CAUGHT YOU'}</small><strong>{et ? `TRAHV ${wanted * 20} REP` : `${wanted * 20} REP FINE`}</strong><button type="button" onClick={continueAfterBust}>{et ? 'MAKSAN JA JÄTKAN' : 'PAY & CONTINUE'}</button><button type="button" onClick={leaveRide}>{et ? 'TAGASI KAARDILE' : 'BACK TO MAP'}</button></div>}
    </main>
    <footer className="city-controls"><button type="button" aria-label={et ? 'VASAK' : 'LEFT'} onClick={() => chooseLane(-1)}>◀<span>{et ? 'VASAK' : 'LEFT'}</span></button><button type="button" aria-label={et ? 'PIDUR' : 'BRAKE'} className="brake" onPointerDown={e => holdStart('brake', e)} onPointerUp={e => holdEnd('brake', e)} onPointerCancel={e => holdEnd('brake', e)} onLostPointerCapture={() => { inputRef.current.brake = false; }}>●<span>{et ? 'PIDUR' : 'BRAKE'}</span></button><button type="button" aria-label={et ? 'GAAS' : 'GAS'} className="gas" onPointerDown={e => holdStart('gas', e)} onPointerUp={e => holdEnd('gas', e)} onPointerCancel={e => holdEnd('gas', e)} onLostPointerCapture={() => { inputRef.current.gas = false; }}>⚡<span>{et ? 'GAAS' : 'GAS'}</span></button><button type="button" aria-label={et ? 'PAREM' : 'RIGHT'} onClick={() => chooseLane(1)}>▶<span>{et ? 'PAREM' : 'RIGHT'}</span></button></footer>
  </div>;

  if (screen === 'result' && result) return <div className="city-result app-surface"><div className={result.won ? 'won' : 'lost'}>{result.won ? '✓' : '!'}</div><p>{result.won ? (et ? 'MISSIOON TEHTUD' : 'MISSION COMPLETE') : (et ? 'MISSIOON EBAÕNNESTUS' : 'MISSION FAILED')}</p><h1>{et ? result.mission.titleEt : result.mission.title}</h1><div className="city-result-grid"><span><b>{result.distance.toFixed(2)}</b> km</span><span><b>{result.collisions}</b>{et ? ' kokkupõrget' : ' collisions'}</span><span><b>+{result.reward}</b> {result.mission.delivery?'€':'REP'}</span></div><button type="button" onClick={() => setScreen('map')}><RotateCcw/> {et ? 'Tagasi kaardile' : 'Back to map'}</button><button type="button" onClick={() => startMission(result.mission)}><Play/> {et ? 'Sõida uuesti' : 'Ride again'}</button></div>;

  return <div className="city-page app-surface"><header className="city-page-head"><button type="button" aria-label={et ? 'Tagasi' : 'Back'} onClick={() => navigate('/', { replace: true })}><ArrowLeft/></button><div><small>KUKIRIN OPEN CITY</small><h1>{et ? 'Linnasõit' : 'City Ride'}</h1></div><button type="button" aria-label={et ? 'Kodugaraaž' : 'Home garage'} onClick={() => navigate('/house')}><Home/></button></header><main className="city-page-main">
    <section className="city-map-card"><div className="city-map-title"><div><span>LIVE OPEN WORLD</span><h2>{et ? '6 linnapiirkonda' : '6 city districts'}</h2></div><Navigation/></div><svg className="city-map city-map-large" viewBox="0 0 330 255" role="img" aria-label={et ? 'Suur linnakaart' : 'Large city map'}><path className="map-blocks" d="M9 10h82v52H9zM104 10h79v62h-79zM197 9h124v61H197zM8 76h61v84H8zM80 84h105v66H80zM198 82h123v76H198zM9 174h93v70H9zM114 164h91v80h-91zM218 171h103v73H218z"/><path className="map-grid" d="M3 72H327M3 163H327M99 3V250M191 3V250M212 3V250M3 222H327"/><path className="map-route-shadow" d="M47 190 C30 137 42 94 78 74 S124 96 160 125 S219 143 267 129 S307 168 278 207 S213 204 203 183 S177 215 145 222 S76 226 47 190 M160 125 C209 102 235 81 270 55"/><path className="map-route" d="M47 190 C30 137 42 94 78 74 S124 96 160 125 S219 143 267 129 S307 168 278 207 S213 204 203 183 S177 215 145 222 S76 226 47 190 M160 125 C209 102 235 81 270 55"/>{MAP_POINTS.map(point => <g key={point.id} className="map-point"><circle cx={point.x} cy={point.y} r="10"/><text x={point.x} y={point.y + 3}>{point.id === 'home' ? '⌂' : '•'}</text><text className="map-label" x={point.x} y={point.y - 15}>{point.label}</text></g>)}</svg><div className="city-district-list">{DISTRICTS.map(item => { const Icon = item.icon; return <span key={item.id} style={{ '--district': item.color }}><Icon/>{et ? item.nameEt : item.name}</span>; })}</div></section>
    <section className="city-vehicle-picker"><div className="city-section-title"><span>{et ? 'SÕIDUK' : 'VEHICLE'}</span><b>{battery.toFixed(0)}% <Battery/></b></div><select aria-label={et ? 'Vali sõiduk' : 'Choose vehicle'} value={vehicle?.id} onChange={e => setVehicleId(e.target.value)}>{fleet.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select><div className="city-vehicle-summary"><span><Gauge/> {Math.round(stats?.topSpeed || 0)} km/h</span><span><Zap/> {Math.round(stats?.watts || 0)} W</span><span><Battery/> {battery.toFixed(1)}%</span></div></section>
    <button type="button" className="city-free-ride" onClick={() => startMission(FREE_RIDE)}><span><Sun/><CloudRain/></span><div><small>{et ? 'AVATUD LINN · ILMA AJALIMIIDITA' : 'OPEN CITY · NO TIME LIMIT'}</small><strong>{et ? 'Vaba linnasõit' : 'Free Ride'}</strong><p>{et ? '6 piirkonda · radarid · politsei teetõkked · muutuv ilm' : '6 districts · speed cameras · police roadblocks · changing weather'}</p></div><Play/></button>
    <section className="courier-card"><h2>Uber Eats · {et?'Toidukuller':'Food delivery'}</h2><p>{et?'Restoranist kliendini · 0,65 km · 3 min · kuni 24 €':'Restaurant to customer · 0.65 km · 3 min · up to €24'}</p><strong>{et?'Rahakott':'Wallet'}: {wallet()} €</strong><button type="button" onClick={()=>startMission(newDelivery())}>{et?'Võta tellimus':'Accept order'}</button><small>{et?'Mängusisene kulleritöö.':'In-game delivery job.'}</small></section><section className="city-missions"><div className="city-section-title"><span>{et ? 'MISSIOONID' : 'MISSIONS'}</span><b>3 {et ? 'SAADAVAL' : 'AVAILABLE'}</b></div>{MISSIONS.map(item => { const Icon = item.icon; return <button type="button" key={item.id} onClick={() => startMission(item)} style={{ '--mission': item.color }}><i><Icon/></i><div><strong>{et ? item.titleEt : item.title}</strong><span>{et ? item.fromEt : item.from} → {et ? item.toEt : item.to}</span><small>{item.distance} km · {Math.floor(item.time/60)}:{String(item.time%60).padStart(2,'0')}</small></div><b>+{item.reward}<small>REP</small></b><Play/></button>; })}</section>
    <button type="button" className="city-home-link" onClick={() => navigate('/house')}><Home/><div><strong>{et ? 'Kodugaraaž ja laadimine' : 'Home garage & charging'}</strong><span>{et ? 'Pargi sõiduk ja lae aku täis' : 'Park your vehicle and recharge'}</span></div><span>›</span></button>
  </main></div>;
}
