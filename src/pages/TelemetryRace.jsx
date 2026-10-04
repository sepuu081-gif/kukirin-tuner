import {newPark,stepPark} from '../lib/stuntPark';
import { newWheelie, stepWheelie } from '../lib/wheeliePhysics';
import { getCodeRideModifiers } from '../lib/codeRewards';
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { VEHICLES, FAILURE_CODES } from "../lib/vehicleData";
import { getBuild, createStockBuild, isStockBuild, calcBuildStats } from "../lib/buildState";

function getRespect() { try { return parseInt(localStorage.getItem("kukirin_respect") || "0"); } catch { return 0; } }
function addRespect(n) { localStorage.setItem("kukirin_respect", String(getRespect() + n)); }
function estimateStockCapacity(vehicle) {
  if (!vehicle) return 15;
  if (vehicle.stockCapacityAh) return vehicle.stockCapacityAh;
  if (vehicle.voltage <= 36) return vehicle.watts > 500 ? 15 : 10;
  if (vehicle.voltage <= 48) return vehicle.watts >= 1500 ? 20 : 15;
  if (vehicle.voltage <= 52) return vehicle.watts >= 2000 ? 25 : 18;
  if (vehicle.voltage <= 60) return vehicle.watts >= 3000 ? 30 : 22;
  if (vehicle.voltage <= 72) return vehicle.watts >= 8000 ? 40 : 30;
  return vehicle.watts >= 8000 ? 40 : 30;
}
function getLifetimeKm(vehicleId) {
  try { return Math.max(0, parseFloat(localStorage.getItem(`kukirin_lifetime_km_${vehicleId}`) || "0")); } catch { return 0; }
}
import { AlertOctagon, CheckCircle } from "lucide-react";
import VESCPhoneApp from "../components/VESCPhoneApp";
import RideRoadPreview from "../components/RideRoadPreview";
import { playSound, startEngineSound, updateEngineSound, stopEngineSound, updatePoliceSiren, stopPoliceSiren } from "../lib/soundEngine";
import { useLanguage } from "../lib/i18n";
import { applyBatteryUse, getBatteryProfile, saveBatteryProfile } from "../lib/batteryState";
import {submitScore} from '../lib/leaderboard';
import { getRideLogs, saveRideLog } from "../lib/rideLogs";
import RideLogViewer from "../components/RideLogViewer";
import { getVehicleCharge, setVehicleCharge } from "../lib/chargingState";
import { damageEnabled } from '../lib/gameSettings';
import { getTrickPoints } from '../lib/wheelieTricks';
import { getTires, saveTires, tireEffects, wearTires, newTraining, advanceTraining, scoreTraining, getTrainingRecords, saveTrainingRecords } from '../lib/rideUpgrades';
import WheelieTrickPicker from '../components/WheelieTrickPicker';

// Weather system
const WEATHERS = [
  { id: "clear",   label: "Clear",       icon: "☀️",  ambient: 25, gripMod: 1.0,  heatMod: 1.05, wobbleMod: 1.0,  desc: "Dry asphalt. Grip at max." },
  { id: "cloudy",  label: "Overcast",    icon: "☁️",  ambient: 19, gripMod: 0.97, heatMod: 0.97, wobbleMod: 1.02, desc: "Slight chill. Negligible effect." },
  { id: "wind",    label: "Crosswind",   icon: "💨",  ambient: 18, gripMod: 0.92, heatMod: 0.94, wobbleMod: 1.35, desc: "Gusts destabilise at speed. Wobble risk up." },
  { id: "rain",    label: "Wet Road",    icon: "🌧️",  ambient: 15, gripMod: 0.72, heatMod: 0.88, wobbleMod: 1.6,  desc: "Slippery. Traction loss. Wobble catastrophic." },
  { id: "storm",   label: "Storm",       icon: "⛈️",  ambient: 12, gripMod: 0.55, heatMod: 0.82, wobbleMod: 2.0,  desc: "You should not be riding. Grip nearly gone." },
];

// Secret codes → unlocks
const SECRET_CODES = {
  FULLTHROT:  { key: "fullthrot",  label: "FULLTHROT", reward: "Titanax Stator + CryoVESC + ThermaShield — heat-immune classified parts unlocked." },
  NODAMPER:   { key: "nodamper",   label: "NODAMPER",  reward: "ERR_SPEED_WOBBLE immunity — your build ignores wobble crash threshold for 90s." },
  VOLTBOOST:  { key: "voltboost",  label: "VOLTBOOST", reward: "Hidden +8V overclock token — adds 8V to your live voltage readout this session." },
  SLEEPERKING:{ key: "sleeperking",label: "SLEEPERKING",reward: "Sleeper King badge unlocked. Your garage shows a crown on all VMP/restricted builds." },
  STATORADE:  { key: "statorade",  label: "STATORADE", reward: "Thermal headroom bonus: +30°C melt threshold this session." },
};

// Fatal failures stop the ride; non-fatal failures apply debuffs but keep you riding
const FATAL_FAILURES = new Set([
  "wobble", "motor_melt", "mosfet_melt", "police",
  "ERR_NECK_CRACK", "ERR_AXLE_PULL", "ERR_BRAKE_FADE",
  "ERR_TIRE_BLOWOUT", "ERR_FOLD_COLLAPSE", "ERR_ESC_EXPLODE",
]);

const NON_FATAL_FAILURES = {
  ERR_BMS_CUTOFF:       { label: "BMS Power Cut",        desc: "Battery management system tripped — power halved for 10s", duration: 10000, debuff: "bmsCutoff" },
  ERR_CELL_VENT:        { label: "Cell Venting",         desc: "Battery cell venting — voltage permanently reduced 15%", permanent: true, debuff: "cellVent" },
  ERR_HALL_DROPOUT:     { label: "Hall Sensor Dropout",  desc: "Sensor lost — motor running rough, speed reduced 30%", permanent: true, debuff: "hallDropout" },
  ERR_THROTTLE_STUCK:   { label: "Throttle Stuck",       desc: "Throttle locked open for 5s — brake to override", duration: 5000, debuff: "throttleStuck" },
  ERR_KICKSTAND_DEPLOY: { label: "Kickstand Deployed",   desc: "Kickstand down — speed capped at 15 km/h", permanent: true, debuff: "kickstand" },
  ERR_WATER_INGRESS:    { label: "Water Ingress",        desc: "Water in electronics — intermittent power cuts", permanent: true, debuff: "waterIngress" },
  ERR_PHASE_SHORT:      { label: "Phase Short",          desc: "Phase shorted — power reduced 40%, extra heat", permanent: true, debuff: "phaseShort" },
};

const BROKEN_PART_MAP = {
  motor_melt: { part: "motor", code: "ERR_MOTOR_MELT" },
  mosfet_melt: { part: "controller", code: "ERR_ESC_EXPLODE" },
  wobble: { part: "damper", code: "ERR_SPEED_WOBBLE" },
  "ERR_ESC_EXPLODE": { part: "controller", code: "ERR_ESC_EXPLODE" },
  "ERR_MOTOR_MELT": { part: "motor", code: "ERR_MOTOR_MELT" },
  "ERR_CELL_VENT": { part: "battery", code: "ERR_CELL_VENT" },
  "ERR_TIRE_BLOWOUT": { part: "wheel", code: "ERR_TIRE_BLOWOUT" },
  "ERR_PHASE_SHORT": { part: "controller", code: "ERR_PHASE_SHORT" },
  "ERR_BMS_CUTOFF": { part: "battery", code: "ERR_BMS_CUTOFF" },
  "ERR_FOLD_COLLAPSE": { part: "chassis", code: "ERR_FOLD_COLLAPSE" },
  "ERR_HALL_DROPOUT": { part: "motor", code: "ERR_HALL_DROPOUT" },
  "ERR_WATER_INGRESS": { part: "electronics", code: "ERR_WATER_INGRESS" },
  "ERR_NECK_CRACK": { part: "chassis", code: "ERR_NECK_CRACK" },
  "ERR_AXLE_PULL": { part: "motor", code: "ERR_AXLE_PULL" },
  "ERR_BRAKE_FADE": { part: "wheel", code: "ERR_BRAKE_FADE" },
  "ERR_THROTTLE_STUCK": { part: "electronics", code: "ERR_THROTTLE_STUCK" },
  "ERR_KICKSTAND_DEPLOY": { part: "chassis", code: "ERR_KICKSTAND_DEPLOY" },
};

export default function TelemetryRace() {
  const { t: tr } = useLanguage();
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const vehicle = VEHICLES.find((v) => v.id === vehicleId);
  const practice = new URLSearchParams(location.search).get('practice');
  const isPark=practice==='park';
  const parkZone=['wheelie','ramps','scrape'].includes(new URLSearchParams(location.search).get('zone'))?new URLSearchParams(location.search).get('zone'):'wheelie';
  const parkRef=useRef(newPark());
  const [park,setPark]=useState(newPark);
  const isPractice = isPark || practice === 'trial' || practice === 'training';
  const isTrial = practice === 'trial' || isPark;
  const practiceDuration = isPark ? 600 : isTrial ? 60 : 90;
  const forceStock = new URLSearchParams(location.search).get("stock") === "1";
  const build = forceStock ? createStockBuild(vehicleId) : getBuild(vehicleId);
  const batteryId = build.parts?.battery?.id || "stock";
  const stockBuild = forceStock || isStockBuild(build);
  const factoryPowertrain = stockBuild || (!build.parts?.motor && !build.parts?.controller && !build.parts?.battery);
  const stats = vehicle ? calcBuildStats(vehicle, build) : null;
  const vescParams = (() => { try { return JSON.parse(localStorage.getItem("kukirin_vesc_params_" + vehicleId) || "null"); } catch { return null; } })();

  const tiresRef = useRef(vehicle ? getTires(vehicle, build) : null);
  const trainingRef = useRef(newTraining());
  const [training, setTraining] = useState(newTraining);
  const [records, setRecords] = useState(() => getTrainingRecords(vehicleId));
  const [practiceResult, setPracticeResult] = useState(null);
  const pitchRef = useRef(newWheelie());
  const [pitch,setPitch] = useState(newWheelie);
  const balanceRef = useRef(0);
  const balanceInput = useRef(0);
  const [balance, setBalance] = useState(0);
  const [riderMotion, setRiderMotion] = useState({ braking:false, turn:0 });
  const motionRef = useRef({ braking:false, turn:0 });
  const [speed, setSpeed] = useState(0);
  const [motorTemp, setMotorTemp] = useState(32);
  const [selectedTrick, setSelectedTrick] = useState('normal');
  const [trickScore, setTrickScore] = useState(0);
  const scoredTricks = useRef(new Set());
  const [riderPosture, setRiderPosture] = useState(() => localStorage.getItem('kukirin_rider_posture') || 'upright');
  const [escTemp, setEscTemp] = useState(25);
  const [batteryTemp, setBatteryTemp] = useState(25);
  const [phaseAmps, setPhaseAmps] = useState(0);
  const [tripDistance, setTripDistance] = useState(0);
  const [rideSeconds, setRideSeconds] = useState(0);
  const [maxRideSpeed, setMaxRideSpeed] = useState(0);
  const [batteryPct, setBatteryPct] = useState(() => getVehicleCharge(vehicleId, vehicle, build).pct);
  const [energyUsedWh, setEnergyUsedWh] = useState(0);
  const [batteryProfile, setBatteryProfile] = useState(() => getBatteryProfile(vehicleId, batteryId));
  const [cellVoltage, setCellVoltage] = useState(4.12);
  const [packVoltage, setPackVoltage] = useState(vehicle?.voltage || 48);
  const [sagVolts, setSagVolts] = useState(0);
  const [batteryPowerLimit, setBatteryPowerLimit] = useState(100);
  const [lastRideLog, setLastRideLog] = useState(() => getRideLogs(vehicleId)[0] || null);
  const [showRideLog, setShowRideLog] = useState(false);
  const [lifetimeKm, setLifetimeKm] = useState(() => getLifetimeKm(vehicleId));
  const [wobble, setWobble] = useState(0);
  const [crashed, setCrashed] = useState(false);
  const [crashPending, setCrashPending] = useState(null); // "wobble"|"motor_melt"|"mosfet_melt" — warning before full crash
  const [deployed, setDeployed] = useState(false);
  const [killed, setKilled] = useState(false);
  const [mode, setMode] = useState("drive");
  const [crashType, setCrashType] = useState("wobble");
  const [thermalPhase, setThermalPhase] = useState(0);
  const [isWheelying, setIsWheelying] = useState(false);
  const [weather, setWeather] = useState(WEATHERS[0]);
  const [weatherChanging, setWeatherChanging] = useState(false);
  const [stress, setStress] = useState({ thermal: 0, speed: 0, weather: 0, tuning: 0 });
  const [debuffs, setDebuffs] = useState({});
  const [warning, setWarning] = useState(null);
  const [criticalWarn, setCriticalWarn] = useState(null); // progressive warning at 70%/90% stress
  const [police, setPolice] = useState(null); // null | "approaching" | "chasing" | "escaped" | "busted"
  const [policeDist, setPoliceDist] = useState(0); // 0-100, 100 = busted
  const policeRef = useRef(null);
  const policeDistRef = useRef(0);
  // Component wear persists across rides — worn parts fail faster
  const [wear, setWear] = useState(() => { try { return JSON.parse(localStorage.getItem("kukirin_wear_" + vehicleId) || "{}"); } catch { return {}; } });
  const wearRef = useRef(wear);

  // Refs for simulation loop
  const keys = useRef({ w: false, s: false });
  const touchPointerIds = useRef({gas:new Set(),brake:new Set(),wheelie:new Set()});
  const touchInputs = useRef({ gas: false, brake: false, wheelie: false });
  const crashedRef = useRef(false);
  const killedRef = useRef(false);
  const modeRef = useRef("drive");
  const escTempRef = useRef(25);
  const motorTempRef = useRef(32);
  const batteryTempRef = useRef(25);
  const phaseAmpsRef = useRef(0);
  const wobbleRef = useRef(0);
  const speedRef = useRef(0);
  const throttleRef = useRef(0);
  const tripDistanceRef = useRef(0);
  const batteryPctRef = useRef(batteryPct);
  const energyUsedWhRef = useRef(0);
  const batteryProfileRef = useRef(batteryProfile);
  const packVoltageRef = useRef(vehicle?.voltage || 48);
  const sagVoltsRef = useRef(0);
  const cellVoltageRef = useRef(4.12);
  const batteryPowerLimitRef = useRef(100);
  const rideLogRef = useRef([]);
  const lastLogSampleRef = useRef(0);
  const logSavedRef = useRef(false);
  const lifetimeKmRef = useRef(getLifetimeKm(vehicleId));
  const crashPendingRef = useRef(null);
  const weatherRef = useRef(WEATHERS[0]);
  const stressRef = useRef({ thermal: 0, speed: 0, weather: 0, tuning: 0 });
  const debuffsRef = useRef({});

  useEffect(() => {
    const charge = getVehicleCharge(vehicleId, vehicle, build).pct;
    const profile = getBatteryProfile(vehicleId, batteryId);
    setDeployed(false);
    setShowRideLog(false);
    setCrashed(false);
    setSpeed(0);
    setTripDistance(0);
    setRideSeconds(0);
    setEnergyUsedWh(0);
    setBatteryPct(charge);
    setBatteryProfile(profile);
    setLastRideLog(getRideLogs(vehicleId)[0] || null);
    batteryPctRef.current = charge;
    batteryProfileRef.current = profile;
    energyUsedWhRef.current = 0;
    speedRef.current = 0;
    throttleRef.current = 0;
    tripDistanceRef.current = 0;
    rideLogRef.current = [];
    logSavedRef.current = false;
  }, [vehicleId]);

  const hasDamper = !!(build.parts?.damper?.dampFactor > 0);
  const wheelieBarFactor = build.parts?.wheelie_bar?.guardFactor || 0;
  const vescDisplay = build.parts?.vesc_display
    || (vehicle?.series === "SURRON" ? { id: "surron_stock_dash", displayStyle: "surron" }
      : vehicle?.series === "STARK" ? { id: "stark_arkstone_stock", displayStyle: "stark" }
        : null);
  const screenDeleteInstalled = !!(build.screenDeleteInstalled || build.parts?.screen_delete);
  const dampFactor = hasDamper ? (build.parts.damper?.dampFactor || 0.8) : 0;
  const shortWheelbase = stats ? stats.wheelbase < 1150 : true;
  const wobbleEnabled = shortWheelbase && !hasDamper;
  const appearance = build.appearance || {};
  const hasVesc = !!(build.parts?.controller?.id?.toLowerCase().includes("vesc") || build.parts?.controller?.tunable);
  const vehicleFailures = (() => {
    try {
      return JSON.parse(localStorage.getItem("kukirin_broken_parts") || "[]")
        .filter((failure) => failure.vehicleId === vehicleId);
    } catch {
      return [];
    }
  })();
  const vehicleBroken = !isPractice && damageEnabled() && vehicleFailures.length > 0;

  const accelMultiplier = stats
    ? Math.min(4.0, Math.max(1.0, (stats.watts / vehicle.watts) * Math.sqrt(stats.maxAmps / 60)))
    : 1.0;

  // Drive and Sport share the physical top speed; Sport changes acceleration.
  const getMaxSpeed = (m) => {
    if (m === "walk") return 8;
    if (isPark) return Math.min(55,stats?.topSpeed||30);
    if (practice === 'training') return Math.min(30, stats?.topSpeed || 30);
    return stats?.topSpeed || 50;
  };

  const chassisLabel = `${vehicle?.name || ""}${build.weldCount > 0 ? ` [STRETCHED x${build.weldCount}]` : ""}`;
  const batteryLabel = build.parts?.battery ? build.parts.battery.name : `Stock ${vehicle?.voltage}V`;
  const batteryCapacityAh = build.parts?.battery?.capacity || estimateStockCapacity(vehicle);
  const nominalBatteryWh = Math.max(1, (stats?.voltage || vehicle?.voltage || 48) * batteryCapacityAh * 0.92);
  const usableBatteryWh = Math.max(1, nominalBatteryWh * batteryProfile.health / 100);
  const seriesCells = Math.max(8, Math.round((stats?.voltage || vehicle?.voltage || 48) / 3.6));

  const persistBattery = useCallback(() => {
    if (isTrial) return;
    saveTires(vehicleId, tiresRef.current);
    saveBatteryProfile(vehicleId, batteryId, batteryProfileRef.current);
    setVehicleCharge(vehicleId, batteryPctRef.current, false);
  }, [vehicleId, batteryId, isTrial]);

  const saveCurrentRideLog = useCallback((reason = "complete") => {
    if (logSavedRef.current || rideLogRef.current.length < 2) return lastRideLog;
    const samples = [...rideLogRef.current];
    const summary = {
      maxSpeed: Math.max(...samples.map((sample) => sample.speed)),
      maxCurrent: Math.max(...samples.map((sample) => sample.current)),
      maxSag: Math.max(...samples.map((sample) => sample.sag)),
      maxBatteryTemp: Math.max(...samples.map((sample) => sample.batteryTemp)),
      endCellVoltage: cellVoltageRef.current,
      endSoc: batteryPctRef.current,
      health: batteryProfileRef.current.health,
      cycles: batteryProfileRef.current.cycles,
    };
    const saved = saveRideLog(vehicleId, { vehicleName: vehicle?.name || vehicleId, reason, samples, summary });
    logSavedRef.current = true;
    if(saved&&summary.maxSpeed>0)submitScore("speed",summary.maxSpeed,vehicle?.name||vehicleId);
    if (saved) setLastRideLog(saved);
    persistBattery();
    return saved;
  }, [lastRideLog, persistBattery, vehicle?.name, vehicleId]);

  useEffect(() => {
    if (!deployed) return;
    const id = setInterval(persistBattery, 2500);
    return () => { clearInterval(id); persistBattery(); };
  }, [deployed, persistBattery]);

  // Police spawn during longer fast rides.
  useEffect(() => {
    if (!deployed || crashed || isPractice) return;
    let id;
    const schedule = () => {
      id = setTimeout(() => {
        if (!crashedRef.current && speedRef.current > 24) {
          policeRef.current = "approaching";
          setPolice("approaching");
          policeDistRef.current = 24;
          setPoliceDist(24);
        } else if (!crashedRef.current) {
          schedule();
        }
      }, (20 + Math.random() * 25) * 1000);
    };
    schedule();
    return () => clearTimeout(id);
  }, [deployed, crashed, isPractice, police === "escaped" || police === "busted" ? police : null]);

  // Police chase logic — runs every 200ms
  useEffect(() => {
    if (!deployed || !police || police === "escaped" || police === "busted") return;
    const id = setInterval(() => {
      const spd = speedRef.current;
      const ghostMode = localStorage.getItem("kukirin_unlock_ghostmode") === "true";
      const escapeSpeedBonus = ghostMode ? 2 : 1;
      // The patrol has its own speed. A fast build can pull away, while a
      // slower build can still evade by stopping and blending into traffic.
      let delta = 0;
      if (police === "approaching" || police === "chasing") {
        const policeSpeed = 64 + policeDistRef.current * 0.1;
        policeRef.current = "chasing";
        if (police !== "chasing") setPolice("chasing");
        if (spd < 20) {
          // Stop and blend into traffic.
          delta = -(25 - spd) * 0.06 * escapeSpeedBonus;
        } else if (spd > policeSpeed) {
          // A properly fast build opens the gap.
          delta = -(spd - policeSpeed) * 0.075 * escapeSpeedBonus;
        } else {
          // The patrol closes the gap when it is faster than the rider.
          delta = (policeSpeed - spd) * 0.035;
        }
        const next = Math.max(0, Math.min(100, policeDistRef.current + delta));
        policeDistRef.current = next;
        setPoliceDist(next);
        if (next >= 100) {
          policeRef.current = "busted";
          setPolice("busted");
          crashedRef.current = true;
          setCrashType("police");
          setCrashed(true);
        } else if (next <= 0 && (police === "chasing" || policeRef.current === "chasing")) {
          policeRef.current = "escaped";
          setPolice("escaped");
          const copBait = localStorage.getItem("kukirin_unlock_copbait") === "true";
          addRespect(copBait ? 50 : 20);
          setTimeout(() => { policeRef.current = null; setPolice(null); }, 4000);
        }
      }
    }, 200);
    return () => clearInterval(id);
  }, [deployed, police]);

  // Random weather shifts every 25-60s
  useEffect(() => {
    if (!deployed) return;
    const shift = () => {
      const next = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
      setWeatherChanging(true);
      setTimeout(() => {
        setWeather(next);
        weatherRef.current = next;
        setWeatherChanging(false);
      }, 800);
    };
    const delay = (25 + Math.random() * 35) * 1000;
    const id = setTimeout(shift, delay);
    return () => clearTimeout(id);
  }, [deployed, weather]);

  // Delayed crash: warning state → actual crash after 1.5s
  useEffect(() => {
    if (!crashPending) return;
    const id = setTimeout(() => {
      setCrashType(crashPending);
      setCrashed(true);
    }, 1500);
    return () => clearTimeout(id);
  }, [crashPending]);

  // Auto-dismiss non-fatal warning after 4s
  useEffect(() => {
    if (!warning) return;
    const id = setTimeout(() => setWarning(null), 4000);
    return () => clearTimeout(id);
  }, [warning]);

  const tick = useCallback(() => {
    if (crashedRef.current || crashPendingRef.current) return;

    const w = weatherRef.current;
    let vp = null;
    {
      try { vp = JSON.parse(localStorage.getItem("kukirin_vesc_params_" + vehicleId) || "null"); } catch {}
    }
    const sagPenalty = escTempRef.current > 85 ? Math.max(0.45, 1 - (escTempRef.current - 85) / 180) : 1;
    const modeBoost = modeRef.current === "sport" ? 1.3 : modeRef.current === "walk" ? 0.2 : 1.0;
    const modeMaxSpd = getMaxSpeed(modeRef.current);
    const tyre = tireEffects(vehicle, tiresRef.current);
    const gripMod = w.gripMod * tyre.grip;

    // Expire temporary debuffs
    const now = Date.now();
    if (debuffsRef.current.bmsCutoff && debuffsRef.current.bmsCutoff !== true && debuffsRef.current.bmsCutoff < now) {
      delete debuffsRef.current.bmsCutoff;
      setDebuffs({ ...debuffsRef.current });
    }
    if (debuffsRef.current.throttleStuck && debuffsRef.current.throttleStuck !== true && debuffsRef.current.throttleStuck < now) {
      delete debuffsRef.current.throttleStuck;
      setDebuffs({ ...debuffsRef.current });
    }

    // Debuff effects on performance
    const hasBmsCutoff = !!debuffsRef.current.bmsCutoff;
    const hasCellVent = !!debuffsRef.current.cellVent;
    const hasHallDropout = !!debuffsRef.current.hallDropout;
    const hasThrottleStuck = !!debuffsRef.current.throttleStuck;
    const hasKickstand = !!debuffsRef.current.kickstand;
    const hasWaterIngress = !!debuffsRef.current.waterIngress;
    const hasPhaseShort = !!debuffsRef.current.phaseShort;

    let debuffPowerMult = 1;
    let debuffSpeedCap = modeMaxSpd;
    let debuffHeatMult = getCodeRideModifiers().heat;
    if (hasBmsCutoff) debuffPowerMult *= 0.5;
    if (hasPhaseShort) { debuffPowerMult *= 0.6; debuffHeatMult *= 1.5; }
    if (hasWaterIngress && Math.random() < 0.08) debuffPowerMult *= 0.3;
    if (hasHallDropout) debuffSpeedCap = Math.min(debuffSpeedCap, modeMaxSpd * 0.7);
    if (hasKickstand) debuffSpeedCap = Math.min(debuffSpeedCap, 15);
    if (batteryPctRef.current < 10) debuffSpeedCap *= 0.72 + batteryPctRef.current * 0.028;
    // Battery protection progressively reduces current when the pack is empty,
    // hot or aged. This feeds directly into acceleration and maximum speed.
    const socPower = batteryPctRef.current >= 25 ? 1 : Math.max(0.35, 0.35 + batteryPctRef.current * 0.026);
    const hotPower = batteryTempRef.current <= 48 ? 1 : Math.max(0.38, 1 - (batteryTempRef.current - 48) / 38);
    const healthPower = Math.max(0.72, batteryProfileRef.current.health / 100);
    const packPowerMult = Math.min(socPower, hotPower) * healthPower;
    batteryPowerLimitRef.current = packPowerMult * 100;
    setBatteryPowerLimit(packPowerMult * 100);
    debuffPowerMult *= packPowerMult;
    if (packPowerMult < 0.98) debuffSpeedCap *= 0.72 + packPowerMult * 0.28;
    // VESC tuning directly affects heat — high motor current = more ESC heat
    const vescCurrentBoost = vp?.motorCurrentMax != null ? Math.max(0, vp.motorCurrentMax / (stats?.maxAmps || 80)) : 1;
    const currentLimit = Math.min(1.35, vescCurrentBoost, vp?.batteryCurrentMax != null ? vp.batteryCurrentMax * (stats?.voltage || vehicle.voltage) / Math.max(1, stats?.watts || vehicle.watts) : 1);
    const dutyLimit = vp?.maxDuty != null ? Math.max(0, vp.maxDuty / 95) : 1;
    debuffSpeedCap *= Math.min(1, dutyLimit);
    debuffPowerMult *= currentLimit;
    if (vp?.batteryCutoffEnd != null && packVoltageRef.current <= Number(vp.batteryCutoffEnd)) debuffPowerMult = 0;

    // Speed — throttle stuck keeps accelerating, brake overrides
    const brake = keys.current.s || touchInputs.current.brake;
    const accelPressed = keys.current.w || touchInputs.current.gas || touchInputs.current.wheelie;
    const accel = ((accelPressed || hasThrottleStuck) && !killedRef.current && batteryPctRef.current > 0.15) && !brake;
    const targetThrottle = accel ? 1 : 0;
    const throttleRate = accel ? 0.13 : 0.22;
    throttleRef.current += (targetThrottle - throttleRef.current) * throttleRate;
    if (brake) throttleRef.current = 0;
    let nextSpeed = speedRef.current;
    if (accel) {
      const speedRatio = nextSpeed / Math.max(1, debuffSpeedCap);
      const powerToWeight = (stats?.watts || 500) / Math.max(12, stats?.totalWeight || 25);
      const speedMs = nextSpeed / 3.6;
      const systemMass = (stats?.totalWeight || 25) + 78;
      const physicalForce = stats.mechanicalPower / Math.max(4 / (stats.torqueFactor || 1), speedMs);
      const roadResistance = 0.5 * 1.225 * stats.aeroCdA * speedMs ** 2 + 0.016 * tyre.rolling * systemMass * 9.81;
      const baseAccelMs2 = factoryPowertrain ? Math.max(0.75, Math.min(6.2, powerToWeight / 22)) : Math.max(0, Math.min(6.2, (physicalForce - roadResistance) / systemMass));
      const dragPenalty = factoryPowertrain ? Math.max(0.06, 1 - speedRatio * speedRatio) : 1;
      const launchBoost = factoryPowertrain ? 1 + Math.max(0, 1 - speedRatio / 0.42) * 0.65 : 1;
      const wheelieBarLaunchGrip = 1 + wheelieBarFactor * 0.06;
      const throttleResponse = 0.34 + throttleRef.current * 0.66;
      const accelStep = baseAccelMs2 * 3.6 * 0.08 * (factoryPowertrain ? stats?.torqueFactor || 1 : 1) * modeBoost * launchBoost * wheelieBarLaunchGrip * sagPenalty * gripMod * dragPenalty * debuffPowerMult * throttleResponse;
      nextSpeed = Math.min(nextSpeed + accelStep, debuffSpeedCap);
    } else if (brake) {
      const brakingMs2 = 4.5 * gripMod * getCodeRideModifiers().braking;
      nextSpeed = Math.max(nextSpeed - brakingMs2 * 3.6 * 0.08, 0);
    } else {
      const coastLoss = 0.16 * tyre.rolling + Math.pow(nextSpeed / 80, 2) * 0.5;
      nextSpeed = Math.max(nextSpeed - coastLoss * 3.6 * 0.08, 0);
    }
    speedRef.current = nextSpeed;
    setSpeed(nextSpeed);
    setMaxRideSpeed((currentMax) => Math.max(currentMax, nextSpeed));
    const distanceDelta = (nextSpeed * 0.08) / 3600;
    const nextDistance = tripDistanceRef.current + distanceDelta;
    tripDistanceRef.current = nextDistance;
    setTripDistance(nextDistance);
    lifetimeKmRef.current += distanceDelta;
    setLifetimeKm(lifetimeKmRef.current);

    // Phase amps
    const maxA = vp?.motorCurrentMax ?? stats?.maxAmps ?? 80;
    const cruiseRatio = Math.min(1, nextSpeed / Math.max(1, debuffSpeedCap));
    const demandedAmps = accel ? maxA * debuffPowerMult * (0.32 + 0.68 * (1 - cruiseRatio * cruiseRatio)) : 0;
    const nextAmps = Math.max(0, phaseAmpsRef.current + Math.max(-12, Math.min(8, demandedAmps - phaseAmpsRef.current)));
    phaseAmpsRef.current = nextAmps;
    setPhaseAmps(nextAmps);

    // Battery energy model. Acceleration uses drivetrain power, cruising is
    // dominated by rolling/aero drag, and regen returns part of braking energy.
    const speedRatio = nextSpeed / Math.max(1, modeMaxSpd);
    const tractionPower = accel
      ? (stats?.watts || 500) * (0.28 + Math.min(1, speedRatio) * 0.72) * (modeRef.current === "sport" ? 1.12 : 1)
      : 0;
    const cruisePower = !accel && !brake && nextSpeed > 1
      ? 18 + 0.0045 * Math.pow(nextSpeed, 3)
      : (nextSpeed > 0.5 ? 8 : 2.5);
    const regenPower = brake && nextSpeed > 3
      ? Math.min(500, (stats?.watts || 500) * 0.22) * Math.min(1, nextSpeed / Math.max(15, modeMaxSpd * 0.65))
      : 0;
    const extraRollingPower = .016 * (tyre.rolling - 1) * ((stats?.totalWeight || 25) + 78) * 9.81 * nextSpeed / 3.6;
    const netPower = Math.max(-500, (tractionPower + cruisePower + extraRollingPower) * tyre.energy - regenPower);
    const energyDeltaWh = netPower * 0.08 / 3600;
    const nextEnergyUsed = Math.max(0, Math.min(usableBatteryWh, energyUsedWhRef.current + energyDeltaWh));
    energyUsedWhRef.current = nextEnergyUsed;
    const nextBatteryPct = Math.max(0, Math.min(100, batteryPctRef.current - energyDeltaWh / usableBatteryWh * 100));
    batteryPctRef.current = nextBatteryPct;
    setEnergyUsedWh(nextEnergyUsed);
    setBatteryPct(nextBatteryPct);

    // Cell voltage and sag use pack current and a temperature/age adjusted
    // internal resistance. Cell count follows the pack nominal voltage.
    const soc = nextBatteryPct / 100;
    const openCellVoltage = 3.0 + 1.18 * Math.pow(Math.max(0, soc), 0.58);
    const openPackVoltage = openCellVoltage * seriesCells;
    const packCurrent = Math.max(0, netPower) / Math.max(1, openPackVoltage);
    const ageResistance = 1 + (100 - batteryProfileRef.current.health) / 42;
    const temperatureResistance = batteryTempRef.current < 15 ? 1.45 : batteryTempRef.current > 50 ? 1.18 : 1;
    const packHeatFactor = build.parts?.battery?.heatFactor || 1;
    const internalResistance = 0.055 * (15 / Math.max(6, batteryCapacityAh)) * ageResistance * temperatureResistance * packHeatFactor;
    const liveSag = Math.min(openPackVoltage * 0.24, packCurrent * internalResistance);
    const loadedVoltage = Math.max(seriesCells * 2.75, openPackVoltage - liveSag) * (hasCellVent ? 0.85 : 1);
    const loadedCellVoltage = loadedVoltage / seriesCells;
    packVoltageRef.current = loadedVoltage;
    sagVoltsRef.current = liveSag;
    cellVoltageRef.current = loadedCellVoltage;
    setPackVoltage(loadedVoltage);
    setSagVolts(liveSag);
    setCellVoltage(loadedCellVoltage);

    batteryProfileRef.current = applyBatteryUse(
      batteryProfileRef.current,
      Math.max(0, energyDeltaWh),
      nominalBatteryWh,
      batteryTempRef.current,
      0.08,
    );

    // Thermal model: copper loss follows current squared, while speed and the
    // installed cooling system remove heat. Large motors warm more slowly.
    const ambientC = w.ambient ?? 22;
    const currentRatio = Math.min(2.2, nextAmps / Math.max(1, maxA));
    const motorRatedW = build.parts?.motor?.watts || vehicle?.watts || 600;
    const electricalMotorW = nextAmps * (stats?.voltage || vehicle?.voltage || 48) * 0.72;
    const motorLoad = factoryPowertrain
      ? currentRatio * 0.68
      : Math.min(2.2, Math.max(currentRatio * 0.72, electricalMotorW / Math.max(300, motorRatedW)));
    const airflow = Math.min(1, nextSpeed / 85);
    const coolingReduction = Math.min(0.82, (build.parts?.cooling?.heatReduction || 0) / 150);
    const motorThermalMass = Math.max(0.75, build.parts?.motor?.thermalMass || Math.min(2.2, 0.75 + motorRatedW / 9000));

    setMotorTemp((prev) => {
      const fwStress = factoryPowertrain ? 0 : (vp?.fieldWeakeningMax || 0) / 50;
      const heatRise = accel ? (factoryPowertrain ? 60 : 104) * Math.pow(motorLoad, 1.72) * (1 + fwStress * 0.55) * w.heatMod * debuffHeatMult : 0;
      const target = Math.max(ambientC + 2, ambientC + 3 + heatRise * (1 - coolingReduction) - airflow * (15 + coolingReduction * 18));
      const response = (accel ? 0.0065 : 0.009) / motorThermalMass;
      const next = Math.max(ambientC, Math.min(190, prev + (target - prev) * response));
      motorTempRef.current = next;
      if (!isPractice && damageEnabled() && next >= 185 && !crashedRef.current && !crashPendingRef.current) {
        crashPendingRef.current = "motor_melt";
        crashedRef.current = true; // stop further sim
        setCrashPending("motor_melt");
      }
      return next;
    });

    // Controller temperature uses its actual current utilisation.
    setEscTemp((prev) => {
      const controllerLoad = accel ? currentRatio * (factoryPowertrain ? 0.65 : vescCurrentBoost) : 0;
      const target = Math.max(ambientC + 2, ambientC + 3 + (factoryPowertrain ? 45 : 82) * Math.pow(controllerLoad, 1.8) * w.heatMod * debuffHeatMult * (1 - coolingReduction * 0.72) - airflow * 16);
      const next = Math.max(ambientC, Math.min(195, prev + (target - prev) * (accel ? 0.007 : 0.011)));
      escTempRef.current = next;
      const phase = next >= 180 ? 3 : next >= 120 ? 2 : next >= 85 ? 1 : 0;
      setThermalPhase(phase);
      if (!isPractice && damageEnabled() && next >= 192 && !crashedRef.current && !crashPendingRef.current) {
        crashPendingRef.current = "mosfet_melt";
        crashedRef.current = true;
        setCrashPending("mosfet_melt");
      }
      return next;
    });

    // Battery cells warm slowly. High C-rate and BMS loading add heat; large
    // low-resistance packs and battery cold plates reduce it.
    setBatteryTemp((prev) => {
      const packCurrent = Math.max(0, netPower) / Math.max(1, stats?.voltage || vehicle?.voltage || 48);
      const cRate = packCurrent / Math.max(1, batteryCapacityAh);
      const bmsLoad = packCurrent / Math.max(20, stats?.bmsMaxAmps || 40);
      const packHeatFactor = build.parts?.battery?.heatFactor || 1;
      const batteryCooling = build.parts?.cooling?.batteryCooling || coolingReduction * 0.28;
      const rawHeatRise = (18 * Math.pow(cRate, 1.65) + 24 * Math.pow(bmsLoad, 2)) * packHeatFactor * w.heatMod;
      const heatRise = (factoryPowertrain ? Math.min(22, rawHeatRise * 0.45) : rawHeatRise) * (getCodeRideModifiers().heat);
      const target = Math.max(ambientC + 1, ambientC + 2 + heatRise * (1 - batteryCooling) - airflow * 5);
      const next = Math.max(ambientC, Math.min(100, prev + (target - prev) * (accel ? 0.0022 : 0.0035)));
      batteryTempRef.current = next;
      return next;
    });

    if (now - lastLogSampleRef.current >= 480) {
      lastLogSampleRef.current = now;
      setBatteryProfile({ ...batteryProfileRef.current });
      rideLogRef.current.push({
        t: Number((rideLogRef.current.length * 0.5).toFixed(1)),
        speed: Number(nextSpeed.toFixed(1)),
        current: Number(nextAmps.toFixed(1)),
        voltage: Number(loadedVoltage.toFixed(2)),
        sag: Number(liveSag.toFixed(2)),
        cellVoltage: Number(loadedCellVoltage.toFixed(3)),
        motorTemp: Number(motorTempRef.current.toFixed(1)),
        escTemp: Number(escTempRef.current.toFixed(1)),
        batteryTemp: Number(batteryTempRef.current.toFixed(1)),
        soc: Number(nextBatteryPct.toFixed(2)),
        powerLimit: Number(batteryPowerLimitRef.current.toFixed(1)),
      });
      if (rideLogRef.current.length > 1200) rideLogRef.current.shift();
    }

    // Wobble — using refs for correctness, weather wobbleMod applies
    if (wobbleEnabled) {
      const spd = speedRef.current;
      const overThreshold = spd > 65;
      const wobbleRate = overThreshold ? ((spd - 60) / 100) * w.wobbleMod : 0;
      // Damper actively suppresses wobble
      const damped = dampFactor * 0.05;
      // Braking hard actively kills wobble (slowing away from the danger zone)
      const brakeDecay = brake ? 0.05 : 0;
      // Natural decay when below the wobble threshold — wobble fades without excitation
      const naturalDecay = overThreshold ? 0 : 0.02;
      const nextWobble = Math.max(0, Math.min(1,
        wobbleRef.current + wobbleRate * 0.025 - damped - brakeDecay - naturalDecay + (Math.random() - 0.5) * 0.004
      ));
      wobbleRef.current = nextWobble;
      setWobble(nextWobble);
      if (!isPractice && damageEnabled() && nextWobble >= 1 && !crashedRef.current && !crashPendingRef.current) {
        crashPendingRef.current = "wobble";
        crashedRef.current = true;
        setCrashPending("wobble");
      }
    } else {
      // Slow decay if no wobble conditions
      const nextWobble = Math.max(0, wobbleRef.current - 0.01);
      wobbleRef.current = nextWobble;
      setWobble(nextWobble);
    }

    // Deterministic stress accumulation — failures build up from sustained abuse, not random chance
    if (!isPractice && damageEnabled() && speedRef.current > 5 && !crashedRef.current && !crashPendingRef.current) {
      const spd = speedRef.current;
      const tempStressVal = stockBuild ? 0 : Math.max(0, (motorTempRef.current - 100) / 100) + Math.max(0, (escTempRef.current - 80) / 100) + Math.max(0, (batteryTempRef.current - 55) / 80);
      const speedStressVal = Math.max(0, (spd - Math.max(65, vehicle.topSpeed * 1.15)) / 150);
      const weatherStressVal = w.id === "storm" ? 0.4 : w.id === "rain" ? 0.2 : w.id === "wind" ? 0.1 : 0;
      const ctrlMax = build?.parts?.controller?.maxAmps || 80;
      const bmsMax = stats?.bmsMaxAmps || 40;
      const overCurrent = (vp?.motorCurrentMax || 0) > ctrlMax * 1.15;
      const overFW = (vp?.fieldWeakeningMax || 0) > 30;
      const overBatAmps = (vp?.batteryCurrentMax || 0) > bmsMax;
      const lowCutoff = parseFloat(vp?.batteryCutoffEnd || 999) < (stats?.voltage || 48) * 0.75;
      const overAbs = (vp?.absoluteMax || 0) > ctrlMax * 1.5;
      const tuningStressVal = (overCurrent ? 0.3 : 0) + (overFW ? 0.2 : 0) + (overBatAmps ? 0.25 : 0) + (lowCutoff ? 0.2 : 0) + (overAbs ? 0.35 : 0);

      // Durability reduces stress — premium parts resist failures. Bad VESC tuning causes rapid destruction.
      const durabilityMult = 0.2 * Math.max(0.3, 1 - (stats.durability - 50) / 120);
      // Wear accumulates across rides — worn parts fail significantly faster
      const totalWear = Object.values(wearRef.current).reduce((a, b) => a + (b || 0), 0);
      const wearMult = 1 + Math.min(0.5, totalWear * 0.25);
      stressRef.current.tuning += tuningStressVal * 0.025 * durabilityMult * wearMult;
      stressRef.current.thermal += tempStressVal * 0.015 * durabilityMult * wearMult;
      stressRef.current.speed += speedStressVal * 0.008 * durabilityMult * wearMult;
      stressRef.current.weather += weatherStressVal * 0.012 * durabilityMult * wearMult;
      // Cascading failures — active debuffs stress related systems, creating chain reactions
      if (hasPhaseShort) stressRef.current.thermal += 0.02 * wearMult;
      if (hasWaterIngress) stressRef.current.tuning += 0.015 * wearMult;
      if (hasHallDropout) stressRef.current.speed += 0.01 * wearMult;
      if (hasCellVent) stressRef.current.thermal += 0.01 * wearMult;

      // Decay stress when conditions improve
      if (tuningStressVal === 0) stressRef.current.tuning = Math.max(0, stressRef.current.tuning - 0.015);
      if (tempStressVal === 0) stressRef.current.thermal = Math.max(0, stressRef.current.thermal - 0.02);
      if (speedStressVal === 0) stressRef.current.speed = Math.max(0, stressRef.current.speed - 0.015);
      if (weatherStressVal === 0) stressRef.current.weather = Math.max(0, stressRef.current.weather - 0.02);

      setStress({ ...stressRef.current });

      // Progressive warnings — alert rider before catastrophic failure
      const maxStress = Math.max(stressRef.current.tuning, stressRef.current.thermal, stressRef.current.speed, stressRef.current.weather);
      if (maxStress >= 0.9 && !criticalWarn) {
        setCriticalWarn({ level: "critical", time: Date.now() });
      } else if (maxStress >= 0.7 && maxStress < 0.9 && !criticalWarn) {
        setCriticalWarn({ level: "warning", time: Date.now() });
      } else if (maxStress < 0.5 && criticalWarn) {
        setCriticalWarn(null);
      }

      // Trigger failures deterministically when stress reaches 100%
      const triggerFail = (failType) => {
        stressRef.current = { thermal: 0, speed: 0, weather: 0, tuning: 0 };
        if (FATAL_FAILURES.has(failType)) {
          crashPendingRef.current = failType;
          crashedRef.current = true;
          setCrashPending(failType);
        } else {
          const nf = NON_FATAL_FAILURES[failType];
          if (nf) {
            if (nf.duration) {
              debuffsRef.current[nf.debuff] = Date.now() + nf.duration;
            } else {
              debuffsRef.current[nf.debuff] = true;
            }
            setDebuffs({ ...debuffsRef.current });
            setWarning({ type: failType, ...nf, time: Date.now() });
            const broken = BROKEN_PART_MAP[failType];
            if (broken) {
              const list = JSON.parse(localStorage.getItem("kukirin_broken_parts") || "[]");
              list.push({ ...broken, vehicleId, vehicleName: vehicle.name, date: new Date().toISOString() });
              localStorage.setItem("kukirin_broken_parts", JSON.stringify(list));
              // Accumulate wear on this part type — each failure makes future failures more likely
              const wearKey = "kukirin_wear_" + vehicleId;
              const currentWear = JSON.parse(localStorage.getItem(wearKey) || "{}");
              currentWear[broken.part] = Math.min(1, (currentWear[broken.part] || 0) + 0.03);
              localStorage.setItem(wearKey, JSON.stringify(currentWear));
              wearRef.current = currentWear;
              setWear(currentWear);
            }
          }
        }
      };

      if (stressRef.current.tuning >= 1.0) {
        const failures = [];
        if (overCurrent) failures.push("ERR_ESC_EXPLODE");
        if (overFW) failures.push("ERR_MOTOR_MELT");
        if (overBatAmps) failures.push("ERR_BMS_CUTOFF");
        if (lowCutoff) failures.push("ERR_CELL_VENT");
        if (overAbs) failures.push("ERR_ESC_EXPLODE");
        triggerFail(failures[0] || "ERR_ESC_EXPLODE");
      } else if (stressRef.current.weather >= 1.0) {
        triggerFail("ERR_WATER_INGRESS");
      } else if (stressRef.current.speed >= 1.0) {
        let failType = "ERR_TIRE_BLOWOUT";
        if (phaseAmpsRef.current > 90) failType = "ERR_AXLE_PULL";
        else if (keys.current.s && spd > 50) failType = "ERR_BRAKE_FADE";
        else if (spd > 60) failType = "ERR_NECK_CRACK";
        else if (spd > 55) failType = "ERR_TIRE_BLOWOUT";
        else if (spd > 45) failType = "ERR_FOLD_COLLAPSE";
        else if (spd > 40) failType = "ERR_KICKSTAND_DEPLOY";
        else if (spd > 35) failType = "ERR_HALL_DROPOUT";
        else if (spd > 30) failType = "ERR_THROTTLE_STUCK";
        triggerFail(failType);
      } else if (stressRef.current.thermal >= 1.0) {
        let failType = "ERR_PHASE_SHORT";
        if (batteryTempRef.current > 70) failType = "ERR_CELL_VENT";
        else if (motorTempRef.current > 130) failType = "ERR_MOTOR_MELT";
        else if (escTempRef.current > 100) failType = "ERR_PHASE_SHORT";
        triggerFail(failType);
      }
    }

    if(isPark){const previousPark=parkRef.current;parkRef.current=stepPark(previousPark,{speed:nextSpeed,zone:parkZone});if(previousPark.height>0&&parkRef.current.height===0)playSound('bump');setPark(parkRef.current);}
    const manualWheelie = !!keys.current.wheelie || touchInputs.current.wheelie;
    const manualLimit = getCodeRideModifiers().balance;
    const autoLift = accel && accelMultiplier >= 2.2 && nextSpeed > 1 && nextSpeed < 18;
    const previousPitch = pitchRef.current;
    const nextPitch = stepWheelie(previousPitch, {
      hold:manualWheelie && nextSpeed < manualLimit && !killedRef.current,
      rearBrake:brake, speed:nextSpeed, autoLift,
      body:balanceInput.current, guard:wheelieBarFactor,
    });
    pitchRef.current=nextPitch;setPitch(nextPitch);
    const wheelie=nextPitch.angle>2;
    balanceRef.current=Math.max(-1,Math.min(1,(nextPitch.angle-55)/43));
    setBalance(balanceRef.current);setIsWheelying(wheelie);
    if(nextPitch.scraping&&!previousPitch.scraping)playSound('scrape');
    if(nextPitch.scraping){speedRef.current=Math.max(0,speedRef.current-.12);setSpeed(speedRef.current);}
    if(nextPitch.looped){
      crashedRef.current=true;
      keys.current={w:false,s:false,wheelie:false};
      touchInputs.current={gas:false,brake:false,wheelie:false};
      Object.values(touchPointerIds.current).forEach(ids=>ids.clear());
      setCrashType('loopout');setCrashed(true);
    }
    tiresRef.current = wearTires(tiresRef.current, distanceDelta, { throttle:throttleRef.current, brake, wheelie, rate:tyre.wearRate });
    trainingRef.current = advanceTraining(trainingRef.current, wheelie, .08);
    setTraining(trainingRef.current);
    motionRef.current = { braking:brake && nextSpeed > .5, turn:motionRef.current.turn };
    setRiderMotion({ ...motionRef.current });

  }, [stats, dampFactor, wobbleEnabled, accelMultiplier, stockBuild, factoryPowertrain, usableBatteryWh, wheelieBarFactor, seriesCells, batteryCapacityAh, nominalBatteryWh, isPractice, isPark, parkZone, practice, vehicle]);

  useEffect(() => {
    if (!isWheelying || crashed || killed) { scoredTricks.current.clear(); return; }
    if (scoredTricks.current.has(selectedTrick)) return;
    const timer = setTimeout(() => {
      scoredTricks.current.add(selectedTrick);
      const reward = scoreTraining(trainingRef.current, selectedTrick, getTrickPoints(selectedTrick));
        trainingRef.current = reward.state;
        setTraining(reward.state);
        setTrickScore(score => {
        const next = score + reward.points;
        const best = Number(localStorage.getItem('kukirin_best_trick_score')) || 0;
        if (!isTrial && next > best) localStorage.setItem('kukirin_best_trick_score', String(next));
        return next;
      });
    }, 750);
    return () => clearTimeout(timer);
  }, [isWheelying, selectedTrick, crashed, killed, isTrial]);

  useEffect(() => {
    if (!deployed) return;
    const id = setInterval(tick, 80);
    return () => clearInterval(id);
  }, [deployed, tick]);

  useEffect(() => {
    if (!deployed || crashed) return;
    const id = setInterval(() => setRideSeconds((seconds) => seconds + 1), 1000);
    return () => clearInterval(id);
  }, [deployed, crashed]);

  useEffect(() => {
    if (!deployed) return;
    if (isTrial) return;
    const saveLifetime = () => localStorage.setItem(`kukirin_lifetime_km_${vehicleId}`, lifetimeKmRef.current.toFixed(5));
    const id = setInterval(saveLifetime, 2000);
    return () => { clearInterval(id); saveLifetime(); };
  }, [deployed, vehicleId, isTrial]);

  useEffect(() => {
    if (deployed && !crashed) startEngineSound(vehicle);
    else stopEngineSound();
    return () => stopEngineSound();
  }, [deployed, crashed, vehicle]);

  useEffect(() => {
    if (deployed && !crashed) updateEngineSound(speed, Math.min(1, phaseAmps / Math.max(1, stats?.maxAmps || 80)), keys.current.s || touchInputs.current.brake);
  }, [deployed, crashed, speed, phaseAmps, stats?.maxAmps]);

  useEffect(() => {
    const active = deployed && !crashed && (police === "approaching" || police === "chasing");
    updatePoliceSiren(active, policeDist);
  }, [deployed, crashed, police, policeDist]);

  useEffect(() => () => stopPoliceSiren(), []);

  useEffect(() => {
    if (crashed) playSound("crash");
  }, [crashed]);

  useEffect(() => {
    if (crashPending || warning || criticalWarn?.level === "critical") playSound("warning");
  }, [crashPending, warning, criticalWarn]);

  useEffect(() => {
    const down = (e) => {
      if (["INPUT","SELECT","TEXTAREA"].includes(e.target.tagName)) return;
      if ((practice === 'training' || isPark) && e.key.toLowerCase() === 'q') balanceInput.current = -1;
      if ((practice === 'training' || isPark) && e.key.toLowerCase() === 'e') balanceInput.current = 1;
      if(e.code==='Space'&&(e.target.tagName!=='BUTTON'||e.target.classList.contains('ride-control-button'))){e.preventDefault();keys.current.wheelie=true;}
      if (e.key === "w" || e.key === "W") keys.current.w = true;
      if (e.key === "s" || e.key === "S") keys.current.s = true;
      if ((e.key === "k" || e.key === "K") && !e.repeat && screenDeleteInstalled && !crashedRef.current) {
        killedRef.current = !killedRef.current;
        keys.current.w = false;
        setKilled(killedRef.current);
      }
    };
    const up = (e) => {
      if (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'e') balanceInput.current = 0;
      if(e.code==='Space')keys.current.wheelie=false;
      if (e.key === "w" || e.key === "W") keys.current.w = false;
      if (e.key === "s" || e.key === "S") keys.current.s = false;
    };
    const releaseAllInputs = () => {
      balanceInput.current = 0;
      motionRef.current.turn = 0;
      keys.current.w = false;
      keys.current.s = false;
      keys.current.wheelie = false;
      touchInputs.current = { gas: false, brake: false, wheelie: false };
      Object.values(touchPointerIds.current).forEach(ids=>ids.clear());
    };
    const visibility = () => { if (document.hidden) releaseAllInputs(); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", releaseAllInputs);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", releaseAllInputs);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [screenDeleteInstalled, practice]);

  const beginTouchInput = (input, event) => {
    event.preventDefault();
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* synthetic pointer */ }
    touchPointerIds.current[input].add(event.pointerId);
    touchInputs.current[input] = true;
    if (input === "brake") playSound("brake");
    navigator.vibrate?.(input === "gas" ? 18 : 28);
  };

  const endTouchInput = (input, event) => {
    touchPointerIds.current[input].delete(event?.pointerId);
    touchInputs.current[input] = touchPointerIds.current[input].size > 0;
    try {
      if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    } catch { /* already released */ }
  };

  // Award/deduct respect on crash
  useEffect(() => {
    if (crashed) {
      saveCurrentRideLog(crashType || "failure");
      if (crashType === "loopout") {
        // A failed trick never rewards a crash or breaks a stored part.
      } else if (crashType === "police") {
        addRespect(-25);
      } else {
        const rep = Math.max(5, Math.round(speed));
        addRespect(rep);
        // Record broken part for repair garage
        const broken = BROKEN_PART_MAP[crashType];
        if (broken && damageEnabled()) {
          const list = JSON.parse(localStorage.getItem("kukirin_broken_parts") || "[]");
          list.push({ ...broken, vehicleId, vehicleName: vehicle.name, date: new Date().toISOString() });
          localStorage.setItem("kukirin_broken_parts", JSON.stringify(list));
        }
      }
    }
  }, [crashed, crashType, saveCurrentRideLog]);

  const finishRide = () => {
    keys.current = { w:false, s:false, wheelie:false };
    touchInputs.current = { gas:false, brake:false, wheelie:false };
      Object.values(touchPointerIds.current).forEach(ids=>ids.clear());
    balanceInput.current = 0;
    const saved = saveCurrentRideLog("complete");
    setDeployed(false);
    if (saved) setShowRideLog(true);
  };

  useEffect(() => {
    const back = (event) => {
      if (showRideLog) { event.preventDefault(); setShowRideLog(false); }
      else if (deployed && !crashed) {
        event.preventDefault();
        saveCurrentRideLog('complete');
        persistBattery();
        balanceInput.current=0; motionRef.current.turn=0;
        keys.current = { w: false, s: false, wheelie: false };
        touchInputs.current = { gas: false, brake: false, wheelie: false };
      Object.values(touchPointerIds.current).forEach(ids=>ids.clear());
        setDeployed(false);
      }
    };
    window.addEventListener('kukirin:back-request', back);
    return () => window.removeEventListener('kukirin:back-request', back);
  }, [showRideLog, deployed, crashed, saveCurrentRideLog, persistBattery]);

  const resetCrash = () => {
    parkRef.current=newPark();setPark(newPark());
    pitchRef.current=newWheelie();setPitch(newWheelie());setIsWheelying(false);
    crashedRef.current = false;
    killedRef.current = false;
    crashPendingRef.current = null;
    setCrashed(false);
    setCrashPending(null);
    setKilled(false);
    setSpeed(0);
    setTripDistance(0);
    setRideSeconds(0);
    setMaxRideSpeed(0);
    setEnergyUsedWh(0);
    setPhaseAmps(0);
    setMotorTemp(32);
    motorTempRef.current = 32;
    setEscTemp(25);
    escTempRef.current = 25;
    setBatteryTemp(25);
    batteryTempRef.current = 25;
    phaseAmpsRef.current = 0;
    wobbleRef.current = 0;
    speedRef.current = 0;
    throttleRef.current = 0;
    tripDistanceRef.current = 0;
    energyUsedWhRef.current = 0;
    packVoltageRef.current = (stats?.voltage || vehicle?.voltage || 48) * 1.145;
    sagVoltsRef.current = 0;
    cellVoltageRef.current = 4.12;
    setPackVoltage(packVoltageRef.current);
    setSagVolts(0);
    setCellVoltage(4.12);
    setBatteryPowerLimit(100);
    stressRef.current = { thermal: 0, speed: 0, weather: 0, tuning: 0 };
    debuffsRef.current = {};
    setDebuffs({});
    setWarning(null);
    setCriticalWarn(null);
    setWobble(0);
    setThermalPhase(0);
    setIsWheelying(false);
    setTrickScore(0);
    scoredTricks.current.clear();
    policeRef.current = null;
    policeDistRef.current = 0;
    setPolice(null);
    setPoliceDist(0);
  };

  useEffect(() => {
    if (!deployed) return;
    const persist = () => { if (!isTrial) setRecords(saveTrainingRecords(vehicleId, trainingRef.current)); };
    const timer = setInterval(persist, 2500);
    return () => { clearInterval(timer); persist(); };
  }, [deployed, vehicleId, isTrial]);

  useEffect(() => {
    if (!deployed || !isPractice || isPark || rideSeconds < practiceDuration) return;
    touchInputs.current = { gas:false, brake:false, wheelie:false };
      Object.values(touchPointerIds.current).forEach(ids=>ids.clear());
    keys.current = { w:false, s:false };
    speedRef.current = 0;
    throttleRef.current = 0;
    setSpeed(0);
    setIsWheelying(false);
    setPracticeResult({ ...trainingRef.current, maxSpeed:maxRideSpeed, distance:tripDistance });
    saveCurrentRideLog(isPark?'stunt-park':isTrial ? 'garage-test' : 'training');
    setDeployed(false);
  }, [deployed, isPractice, isTrial, rideSeconds, practiceDuration, maxRideSpeed, tripDistance, saveCurrentRideLog]);

  const wobblePct = Math.round(wobble * 100);
  const tempColor = motorTemp > 145 ? "text-red-500" : motorTemp > 110 ? "text-yellow-400" : "text-accent";
  const escColor = escTemp > 150 ? "text-red-500" : escTemp > 100 ? "text-yellow-400" : "text-accent";
  const batteryTempColor = batteryTemp > 60 ? "text-red-500" : batteryTemp > 48 ? "text-yellow-400" : "text-green-400";
  const topSpd = stats?.topSpeed || 50;
  const policeTargetSpeed = 64 + policeDist * 0.1;
  const wobbleText = tr(wobblePct < 15 ? "STABLE" : wobblePct < 45 ? "MINOR VIBRATION" : wobblePct < 75 ? "WOBBLE DETECTED" : "!! CRITICAL WOBBLE !!");
  const wobbleColor = wobblePct < 15 ? "text-accent" : wobblePct < 45 ? "text-yellow-400" : "text-red-400";
  const shakeAmt = wobblePct > 55 ? wobblePct * 0.08 : 0;
  const shakeStyle = shakeAmt > 0 ? { transform: `translateX(${Math.sin(Date.now() / 40) * shakeAmt}px)` } : {};
  const voltageSag = sagVolts / Math.max(1, packVoltage + sagVolts);
  const liveVoltage = packVoltage.toFixed(1);
  const thermalLabel = ["OK", "SATURATION — SAG ACTIVE", "SOLDER LIQUEFACTION 120°C+", "!! RUNAWAY — MELT IMMINENT !!"];
  const thermalColor = ["text-accent", "text-yellow-400", "text-orange-400", "text-red-500 animate-pulse"];

  if (!vehicle || !stats) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono text-muted-foreground">
      No vehicle selected.
    </div>
  );

  if (showRideLog && lastRideLog) {
    return <RideLogViewer log={lastRideLog} onBack={() => setShowRideLog(false)} />;
  }

  if (!deployed) {
    return (
      <div className="mobile-screen-safe app-surface min-h-screen bg-black flex flex-col items-center justify-center font-mono p-4">
        <div className="text-center space-y-4 w-full max-w-xs">
          <div className="text-primary font-mono text-xs uppercase tracking-widest animate-pulse mb-2">{tr("Telemetry System Ready")}</div>
          {isPractice && <div className="upgrade-card"><strong>{tr(isPark?'Stunt park':isTrial ? 'Garage test track' : 'Riding training')} · {isPark?tr('Free ride'):`${practiceDuration} s`}</strong><p>{tr(isTrial ? 'Test your build without spending stored battery or mileage.' : 'Hold wheelie, change tricks and build a combo. No police or part failures.')}</p></div>}
          {practiceResult && <div className="upgrade-card" data-testid="practice-result"><strong>{tr('Session complete')}</strong><p>{practiceResult.maxSpeed.toFixed(1)} km/h · {practiceResult.distance.toFixed(3)} km</p><p>{tr('Longest wheelie')} {practiceResult.longestWheelie.toFixed(1)} s · {tr('Combo')} ×{practiceResult.bestCombo} · {practiceResult.score} pts</p></div>}
          <div className="upgrade-card"><strong>{tr('Personal records')}</strong><p>{tr('Longest wheelie')} {records.longestWheelie.toFixed(1)} s · {tr('Combo')} ×{records.bestCombo} · {records.score} pts</p></div>
          <h1 className="text-2xl font-bold text-foreground">{vehicle.name}</h1>
          <p className="text-muted-foreground text-sm">Welded x{build.weldCount} | Est. {stats.topSpeed.toFixed(0)} km/h</p>

          <div className="flex gap-2 justify-center">
            {[
              ["walk", "WALK", "text-blue-400 border-blue-500/40 bg-blue-500/10"],
              ["drive", "DRIVE", "text-primary border-primary/40 bg-primary/10"],
              ["sport", "SPORT ⚡", "text-red-400 border-red-500/40 bg-red-500/10"],
            ].map(([m, label, cls]) => (
              <button
                key={m}
                onClick={() => { setMode(m); modeRef.current = m; }}
                className={`flex-1 rounded-md border py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-all ${mode === m ? cls : "border-border text-muted-foreground hover:border-primary/20"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {hasVesc && vescParams && (() => {
            const ctrlMax = build?.parts?.controller?.maxAmps || 80;
            const bmsMax = stats?.bmsMaxAmps || 40;
            const issues = [];
            if ((vescParams.motorCurrentMax || 0) > ctrlMax * 1.15) issues.push("Motor current exceeds controller rating");
            if ((vescParams.fieldWeakeningMax || 0) > 30) issues.push("Field weakening extreme — heat risk");
            if ((vescParams.batteryCurrentMax || 0) > bmsMax) issues.push("Battery current exceeds BMS limit");
            if (parseFloat(vescParams.batteryCutoffEnd || 999) < (stats?.voltage || 48) * 0.75) issues.push("Cutoff voltage too low — cell damage");
            if ((vescParams.absoluteMax || 0) > ctrlMax * 1.5) issues.push("Absolute max exceeds MOSFET rating");
            if (issues.length === 0) return null;
            return (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-left space-y-1 text-[11px] text-red-400 mb-3">
                <div className="font-bold uppercase tracking-wider">⚠ VESC Tuning Warning</div>
                {issues.map((issue, i) => <div key={i}>• {issue}</div>)}
                <div className="text-[10px] text-red-400/70 mt-1">These settings will cause component failures during riding.</div>
              </div>
            );
          })()}
          {vehicleBroken && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-left text-[11px] text-red-400">
              <div className="font-bold uppercase tracking-wider">⚠ Scooter is broken</div>
              <div className="mt-1 text-red-300/80">{vehicleFailures.map((failure) => failure.code).join(" · ") || "Component failure"}</div>
              <div className="mt-1 text-[10px] text-muted-foreground">Repair the failed parts before starting another ride.</div>
            </div>
          )}
          <div className="rounded-lg border border-border bg-card/30 p-4 text-left space-y-1 text-[11px] text-muted-foreground">
            <div className="flex justify-between gap-3 pb-2 mb-2 border-b border-border/40">
              <span><span className="text-green-400">{tr("BATTERY")}</span> {batteryLabel}</span>
              <span className="text-foreground whitespace-nowrap">{batteryCapacityAh}Ah · {(usableBatteryWh / 1000).toFixed(2)}kWh</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pb-2 mb-2 border-b border-border/40 text-center">
              <div><div className="text-[8px] text-muted-foreground">HEALTH</div><div className={batteryProfile.health < 75 ? "text-red-400" : "text-green-400"}>{batteryProfile.health.toFixed(1)}%</div></div>
              <div><div className="text-[8px] text-muted-foreground">CYCLES</div><div className="text-cyan-300">{batteryProfile.cycles.toFixed(2)}</div></div>
              <div><div className="text-[8px] text-muted-foreground">PEAK</div><div className="text-orange-300">{batteryProfile.peakTemp.toFixed(0)}°C</div></div>
            </div>
            <div className="flex justify-between gap-3 pb-2 mb-2 border-b border-border/40">
              <span className="text-blue-400">{tr("LIFETIME DISTANCE")}</span>
              <span className="text-foreground">{lifetimeKm.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between gap-3 pb-2 mb-2 border-b border-border/40">
              <span className="text-cyan-300">HOME CHARGE</span>
              <span className={batteryPct < 15 ? "text-red-400 font-bold" : "text-foreground"}>{batteryPct.toFixed(1)}%</span>
            </div>
            <div><span className="text-foreground">[W]</span> — {tr("Hold to accelerate")}</div>
            <div><span className="text-foreground">[S]</span> — {tr("Hold for regen braking")}</div>
            {screenDeleteInstalled && <div><span className="text-red-400">[K]</span> — Tap to snatch killswitch lanyard</div>}
            {mode === "sport" && <div className="text-red-400">⚡ SPORT: thermal throttling OFF. MOSFET melt risk.</div>}
            {mode === "walk" && <div className="text-blue-400">🚶 WALK: capped at 8 km/h. Safe mode.</div>}
            <div className="pt-1 text-yellow-400">⚠ Weather shifts dynamically. Rain = instant wobble risk.</div>
            {!wobbleEnabled && <div className="text-green-400">✓ Long wheelbase + damper: wobble suppressed.</div>}
            {wobbleEnabled && <div className="text-red-400">⚠ Short wheelbase, no damper: death wobble active 65+ km/h.</div>}
          </div>

          <button
            disabled={vehicleBroken || (!isTrial && batteryPct < 1)}
            onClick={() => {
              const freshCharge = isTrial ? 100 : getVehicleCharge(vehicleId, vehicle, build).pct;
              resetCrash();
              balanceRef.current=0; balanceInput.current=0; setBalance(0);
              motionRef.current={ braking:false, turn:0 };
              if (isTrial) lifetimeKmRef.current=getLifetimeKm(vehicleId);
              trainingRef.current = newTraining(); setTraining(trainingRef.current);
              setPracticeResult(null);
              if (!isTrial) setVehicleCharge(vehicleId, freshCharge, false);
              batteryPctRef.current = freshCharge;
              setBatteryPct(freshCharge);
              playSound("start");
              rideLogRef.current = [];
              lastLogSampleRef.current = 0;
              logSavedRef.current = false;
              setShowRideLog(false);
              setDeployed(true);
            }}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-cyan-400 px-10 py-3 font-mono font-bold text-black uppercase tracking-widest text-sm hover:brightness-110 transition-all shadow-xl shadow-primary/20 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-40"
          >
            [ {vehicleBroken ? "REPAIR REQUIRED" : !isTrial && batteryPct < 1 ? "CHARGE AT HOME" : tr("ENGAGE")} ]
          </button>
          {batteryPct < 15 && !vehicleBroken && (
            <button onClick={() => navigate("/house")} className="w-full rounded-md border border-cyan-500/40 bg-cyan-500/10 py-2.5 font-mono text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
              🏠 Open home charger
            </button>
          )}
          {vehicleBroken && (
            <button onClick={() => navigate("/repair")} className="w-full rounded-md border border-red-500/40 bg-red-500/10 py-2.5 font-mono text-[10px] font-bold text-red-300 uppercase tracking-wider">
              Open repair garage
            </button>
          )}
          {lastRideLog && (
            <button onClick={() => setShowRideLog(true)} className="w-full rounded-md border border-cyan-500/40 bg-cyan-500/10 py-2.5 font-mono text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
              VESC LOG · {lastRideLog.summary.maxSpeed.toFixed(0)} KM/H · {lastRideLog.samples.length} SAMPLES
            </button>
          )}
          <button onClick={() => navigate(isPark?`/stunt?vehicle=${vehicleId}`:`${forceStock ? '/vehicle/' : '/build/'}${vehicleId}`, { replace: true })} className="block min-h-11 px-4 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors mt-2 font-mono">
            ← {tr("Back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`ride-page mobile-screen-safe app-surface min-h-screen bg-black font-mono flex flex-col items-center justify-center p-3 pb-52 sm:p-4 sm:pb-52 select-none transition-colors duration-1000 ${
      crashed ? "bg-red-950/40" : crashPending ? "bg-orange-950/30" : ""
    }`}>
      {crashed ? (
        <CrashScreen
          onReset={resetCrash}
          onGarage={() => navigate(`/build/${vehicleId}`, { replace: true })}
          motorTemp={motorTemp}
          escTemp={escTemp}
          crashType={crashType}
          speed={speed}
          weather={weather}
        />
      ) : (
        <div className="w-full max-w-2xl space-y-3" style={shakeStyle}>

          {/* Crash Warning Banner */}
          {crashPending && (
            <div className="border border-red-500 bg-red-500/20 rounded-lg p-3 text-center animate-pulse">
              <span className="font-mono text-sm font-bold text-red-300 uppercase tracking-widest">
                {crashPending === "wobble" && "⚠ CRITICAL WOBBLE — LOSING CONTROL..."}
                {crashPending === "motor_melt" && "🔥 MOTOR MELT — SMOKE POURING FROM HUB..."}
                {crashPending === "mosfet_melt" && "💥 MOSFET MELT — CAPACITOR ABOUT TO BLOW..."}
                {crashPending?.startsWith("ERR_") && `⚠ COMPONENT FAILURE — ${crashPending}...`}
              </span>
            </div>
          )}

          {/* Non-fatal failure warning */}
          {warning && (
            <div className="border border-orange-500 bg-orange-500/20 rounded-lg p-3 animate-pulse">
              <div className="font-mono text-sm font-bold text-orange-300 uppercase tracking-widest">⚠ {warning.label}</div>
              <div className="font-mono text-[10px] text-orange-400/80 mt-0.5">{warning.desc}</div>
              <div className="font-mono text-[9px] text-yellow-400 mt-1">Part recorded for repair — keep riding to the garage.</div>
            </div>
          )}

          {/* Progressive critical warning */}
          {criticalWarn && !crashPending && (
            <div className={`border rounded-lg p-3 animate-pulse ${criticalWarn.level === "critical" ? "border-red-500 bg-red-500/20" : "border-yellow-500 bg-yellow-500/15"}`}>
              <div className={`font-mono text-sm font-bold uppercase tracking-widest ${criticalWarn.level === "critical" ? "text-red-300" : "text-yellow-300"}`}>
                {criticalWarn.level === "critical" ? "⚠ CRITICAL STRESS — FAILURE IMMINENT" : "⚠ HIGH STRESS — BACK OFF"}
              </div>
              <div className="font-mono text-[10px] text-orange-400/70 mt-0.5">Reduce speed, let components cool, or head to garage.</div>
            </div>
          )}

          {/* Component wear indicator */}
          {Object.keys(wear).length > 0 && Object.values(wear).some(v => v > 0.1) && (
            <div className="border border-orange-500/30 rounded-lg p-3">
              <div className="text-[10px] text-orange-400 uppercase tracking-wider font-bold mb-1.5">🔧 Component Wear</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(wear).filter(([, v]) => v > 0.1).map(([part, w]) => (
                  <div key={part} className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground uppercase">{part}</span>
                    <div className="h-1.5 w-10 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full ${w > 0.7 ? "bg-red-500" : w > 0.4 ? "bg-yellow-400" : "bg-orange-400"}`} style={{ width: `${w * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[8px] text-muted-foreground mt-1">Worn parts fail faster. Repair or replace to reset wear.</div>
            </div>
          )}

          {/* Active debuffs — persistent performance faults */}
          {Object.keys(debuffs).length > 0 && (
            <div className="border border-orange-500/40 rounded-lg p-3 space-y-1">
              <div className="text-[10px] text-orange-400 uppercase tracking-wider font-bold mb-1">⚠ Active Faults</div>
              {debuffs.bmsCutoff && <div className="font-mono text-[10px] text-orange-400">• BMS Power Cut — power halved</div>}
              {debuffs.cellVent && <div className="font-mono text-[10px] text-orange-400">• Cell Venting — voltage -15%</div>}
              {debuffs.hallDropout && <div className="font-mono text-[10px] text-orange-400">• Hall Dropout — speed -30%, rough</div>}
              {debuffs.throttleStuck && <div className="font-mono text-[10px] text-orange-400">• Throttle Stuck — locked open</div>}
              {debuffs.kickstand && <div className="font-mono text-[10px] text-orange-400">• Kickstand Down — capped 15 km/h</div>}
              {debuffs.waterIngress && <div className="font-mono text-[10px] text-orange-400">• Water Ingress — intermittent cuts</div>}
              {debuffs.phaseShort && <div className="font-mono text-[10px] text-orange-400">• Phase Short — power -40%, extra heat</div>}
            </div>
          )}

          {/* Police chase banner */}
          {police === "approaching" && (
            <div className="border border-blue-500/60 bg-blue-500/10 rounded-lg p-3 animate-pulse">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-blue-300 font-bold">🚔 POLICE SPOTTED — STOP OR OUTRUN {policeTargetSpeed.toFixed(0)} KM/H</span>
                <span className="text-blue-400">{policeDist.toFixed(0)}%</span>
              </div>
            </div>
          )}
          {police === "chasing" && (
            <div className="border border-red-500/80 bg-red-500/15 rounded-lg p-3 animate-pulse">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1.5">
                <span className={`font-bold ${speed > policeTargetSpeed ? "text-green-300" : "text-red-300"}`}>
                  {speed > policeTargetSpeed ? "✓ PULLING AWAY — HOLD THE GAP!" : `🚨 CHASE — BEAT ${policeTargetSpeed.toFixed(0)} KM/H OR STOP!`}
                </span>
                <span className={`font-bold ${policeDist > 70 ? "text-red-400" : "text-orange-400"}`}>{policeDist.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-red-500 transition-all duration-200" style={{ width: `${policeDist}%` }} />
              </div>
            </div>
          )}
          {police === "escaped" && (
            <div className="border border-green-500/60 bg-green-500/10 rounded-lg p-3">
              <span className="font-mono text-[11px] text-green-400 font-bold">✓ EVADED — +20 REP. They lost you.</span>
            </div>
          )}

          <div className="flex justify-between items-center gap-2">
            <button type="button" className="back-touch" aria-label={tr('Back')} onClick={() => window.dispatchEvent(new Event('kukirin:native-back'))}>←</button>
            {/* Weather indicator */}
            <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[10px] transition-all duration-700 ${
              weather.id === "storm" ? "border-red-500/50 bg-red-500/10 text-red-400" :
              weather.id === "rain" ? "border-blue-500/50 bg-blue-500/10 text-blue-400" :
              weather.id === "wind" ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" :
              "border-border/40 text-muted-foreground"
            } ${weatherChanging ? "opacity-0" : "opacity-100"}`}>
              <span className="text-base">{weather.icon}</span>
              <div>
                <div className="font-bold uppercase tracking-wider">{weather.label}</div>
                <div className="text-[9px] opacity-70">{weather.desc}</div>
              </div>
            </div>
            <button type="button"
              onClick={finishRide}
              className="rounded-md border border-border/50 bg-card/30 px-3 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:border-primary/40 hover:text-foreground transition-all"
            >
              ■ END + LOG
            </button>
          </div>

          <RideRoadPreview park={isPark?park:null} parkZone={parkZone} wheelieVelocity={pitch.velocity}
            braking={riderMotion.braking}
            turn={riderMotion.turn}
            wheelieAngle={pitch.angle}
            scraping={pitch.scraping}
            balance={balance}
            sessionSeconds={!isPark&&isPractice ? Math.max(0,practiceDuration-rideSeconds) : null}
            sessionLabel={isPark?tr('Stunt park'):isPractice ? `${tr(isTrial ? 'Garage test track' : 'Riding training')} · ${Math.max(0,practiceDuration-rideSeconds)} s` : null}
            speed={speed}
            topSpeed={topSpd}
            voltage={parseFloat(liveVoltage)}
            motorTemp={motorTemp}
            mode={mode}
            weather={{ ...weather, label: tr(weather.label), desc: tr(weather.desc) }}
            wobble={wobble}
            distance={tripDistance}
            rideSeconds={rideSeconds}
            maxRideSpeed={maxRideSpeed}
            killed={killed}
            appearance={appearance}
            riderPosture={riderPosture}
            isWheelying={isWheelying}
            trick={isWheelying ? selectedTrick : 'normal'}
            trickScore={trickScore}
            police={police}
            policeDist={policeDist}
            batteryPct={batteryPct}
            batteryTemp={batteryTemp}
            lifetimeKm={lifetimeKm}
            phaseAmps={phaseAmps}
            vescDisplay={vescDisplay}
            wheelieBarFactor={wheelieBarFactor}
            vehicle={vehicle}
            build={build}
          />
          <div className="ride-session-summary"><span>{tr('Wheelie')} <strong>{training.currentWheelie.toFixed(1)} s</strong></span><span>{tr('Combo')} <strong>×{training.combo}</strong></span><span><strong>{training.score}</strong> pts</span></div>
          <details className="ride-extra-settings"><summary>{tr('Rider settings')}</summary>
            <small>{tr('Grip')} {Math.round(tireEffects(vehicle, tiresRef.current).grip * weather.gripMod * 100)}% · {tr('Wear')} {Math.max(tiresRef.current.frontWear, tiresRef.current.rearWear).toFixed(1)}% · {tiresRef.current.frontPressure.toFixed(1)}/{tiresRef.current.rearPressure.toFixed(1)} bar</small>
          <div className="upgrade-actions ride-steering"><button aria-label="Lean left" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); motionRef.current.turn=-1; setRiderMotion({ ...motionRef.current }); }} onPointerUp={() => { motionRef.current.turn=0; setRiderMotion({ ...motionRef.current }); }} onPointerCancel={() => { motionRef.current.turn=0; }} onLostPointerCapture={() => { motionRef.current.turn=0; setRiderMotion({ ...motionRef.current }); }}>← {tr('Lean')}</button><button aria-label="Lean right" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); motionRef.current.turn=1; setRiderMotion({ ...motionRef.current }); }} onPointerUp={() => { motionRef.current.turn=0; setRiderMotion({ ...motionRef.current }); }} onPointerCancel={() => { motionRef.current.turn=0; }} onLostPointerCapture={() => { motionRef.current.turn=0; setRiderMotion({ ...motionRef.current }); }}>{tr('Lean')} →</button></div>
          <div className="ride-speed-envelope flex items-center justify-between gap-2 rounded-xl border border-sky-900 bg-slate-950 px-3 py-2 text-xs">
            <div><span className="text-slate-400">{tr('Speed estimate')}</span><div className="text-sky-300 font-semibold">~{stats.topSpeed.toFixed(0)} km/h · {tr(stats.speedLimiter === 'rpm' ? 'Motor RPM' : stats.speedLimiter === 'drag' ? 'Air resistance' : 'Factory setup')}</div></div>
            <button type="button" aria-pressed={riderPosture === 'tuck'} onClick={() => { const next = riderPosture === 'tuck' ? 'upright' : 'tuck'; localStorage.setItem('kukirin_rider_posture', next); setRiderPosture(next); }} className="min-h-11 rounded-lg border border-sky-700 px-3 text-sky-200">{tr(riderPosture === 'tuck' ? 'Tucked' : 'Upright')}</button>
          </div>

          </details>
          {/* Header panel */}
          <details className={`ride-details border rounded-lg p-3 space-y-2 transition-all ${killed ? "border-red-500/50 bg-red-950/20" : thermalPhase >= 2 ? "border-orange-500/40" : "border-border/40"}`}>
            <summary className="cursor-pointer py-2 text-sm text-primary">{tr('Vehicle details')}</summary>
            <div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span className="text-muted-foreground">{tr("CHASSIS")}</span>
                <span className="text-foreground font-semibold truncate ml-2">{chassisLabel}</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span className="text-muted-foreground">{tr("DAMPER")}</span>
                {hasDamper ? <span className="text-green-400 font-bold">ACTIVE</span> : <span className="text-yellow-500">NONE</span>}
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span className="text-muted-foreground">STUNT BAR</span>
                {wheelieBarFactor > 0 ? <span className="text-green-400 font-bold">{Math.round(wheelieBarFactor * 100)}%</span> : <span className="text-yellow-500">NONE</span>}
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span className="text-muted-foreground">{tr("VESC DASH")}</span>
                {vescDisplay ? <span className="text-cyan-400 font-bold">ONLINE</span> : <span className="text-muted-foreground">NONE</span>}
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span className="text-muted-foreground">MODE</span>
                <span className={`font-bold ${mode === "sport" ? "text-red-400" : mode === "walk" ? "text-blue-400" : "text-primary"}`}>
                  {mode.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span className="text-muted-foreground">{tr("BATTERY")}</span>
                <span className={`font-bold ${voltageSag > 0.3 ? "text-red-400" : voltageSag > 0.1 ? "text-yellow-400" : "text-accent"}`}>
                  {batteryPct.toFixed(1)}% · {liveVoltage}V {voltageSag > 0.05 ? `(SAG ${(voltageSag * 100).toFixed(0)}%)` : ""}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span className="text-muted-foreground">GRIP</span>
                <span className={`font-bold ${weather.gripMod < 0.7 ? "text-red-400" : weather.gripMod < 0.9 ? "text-yellow-400" : "text-accent"}`}>
                  {Math.round(weather.gripMod * 100)}%
                </span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span className="text-muted-foreground">{tr("FAULTS")}</span>
                {Object.keys(debuffs).length > 0
                  ? <span className="text-orange-400 font-bold animate-pulse">{Object.keys(debuffs).length} ACTIVE</span>
                  : <span className="text-green-400 font-bold">NONE</span>}
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span className="text-muted-foreground">{tr("KILLSWITCH")}</span>
                {screenDeleteInstalled
                  ? killed
                    ? <span className="text-red-400 font-bold animate-pulse">SNATCHED</span>
                    : <span className="text-green-400 font-bold">WIRED</span>
                  : <span className="text-muted-foreground">NOT WIRED</span>}
              </div>
              {thermalPhase > 0 && (
                <div className="col-span-2 flex justify-between rounded px-2 py-1 bg-red-500/5 border border-red-500/20">
                  <span className="text-red-400 font-bold">{tr("THERMAL PHASE")} {thermalPhase}</span>
                  <span className={`text-[9px] font-mono ${thermalColor[thermalPhase]}`}>{thermalLabel[thermalPhase]}</span>
                </div>
              )}
            </div>
          </div>

          {/* VESC Tool — live while riding (only if a VESC controller is installed) */}
          {hasVesc ? (
            <VESCPhoneApp
              vehicle={vehicle}
              build={build}
              autoConnect
              liveData={{
                speed,
                motorTemp,
                escTemp,
                phaseAmps,
                voltage: parseFloat(liveVoltage),
                duty: Math.min(100, Math.round((speed / Math.max(stats.topSpeed, 1)) * 100)),
                distance: tripDistance,
                rideSeconds,
                batteryPct,
                batteryTemp,
                energyUsedWh,
                lifetimeKm,
                cellVoltage,
                voltageSag: sagVolts,
                batteryHealth: batteryProfile.health,
                batteryCycles: batteryProfile.cycles,
                batteryPowerLimit,
              }}
            />
          ) : (
            <div className="border border-border/40 rounded-lg p-4 text-center font-mono text-[10px] text-muted-foreground">
              ⚠ No VESC controller installed — install one in the Build Shop to access live tuning while riding.
            </div>
          )}

          {/* Metrics */}
          <div className="ride-metrics grid grid-cols-4 gap-2">
            <MetricBox label="Phase A" value={`${phaseAmps.toFixed(0)}A`} warn={phaseAmps > (stats?.maxAmps || 80) * 0.85} />
            <MetricBox label={tr("Motor °C")} value={`${motorTemp.toFixed(0)}°`} warn={motorTemp > 130} color={tempColor} />
            <MetricBox label="ESC °C" value={`${escTemp.toFixed(0)}°`} warn={escTemp > 100} color={escColor} />
            <MetricBox label={tr("Battery °C")} value={`${batteryTemp.toFixed(0)}°`} warn={batteryTemp > 55} color={batteryTempColor} />
          </div>

          <div className={`rounded-lg border p-3 ${batteryPowerLimit < 70 ? "border-red-500/50 bg-red-500/5" : batteryPowerLimit < 95 ? "border-yellow-500/40 bg-yellow-500/5" : "border-green-500/30 bg-green-500/5"}`}>
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <BatteryMetric label="CELL" value={`${cellVoltage.toFixed(2)}V`} warn={cellVoltage < 3.25} />
              <BatteryMetric label="SAG" value={`${sagVolts.toFixed(1)}V`} warn={voltageSag > 0.12} />
              <BatteryMetric label="HEALTH" value={`${batteryProfile.health.toFixed(1)}%`} warn={batteryProfile.health < 75} />
              <BatteryMetric label="POWER" value={`${batteryPowerLimit.toFixed(0)}%`} warn={batteryPowerLimit < 75} />
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-2 text-[9px] text-muted-foreground">
              <span>{seriesCells}S · {batteryProfile.cycles.toFixed(2)} cycles</span>
              <span>{batteryProfile.throughputWh.toFixed(0)} Wh lifetime</span>
            </div>
          </div>

          {/* Wobble bar */}
          <div className="border border-border/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Wobble</span>
              <span className={`text-[11px] font-bold ${wobbleColor}`}>{wobbleText}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 ${wobblePct > 70 ? "bg-red-500" : wobblePct > 40 ? "bg-yellow-400" : "bg-accent"}`}
                style={{ width: `${wobblePct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">{wobblePct}%</span>
              {wobbleEnabled
                ? <span className="text-[9px] text-red-400">No Damper — Risk Active</span>
                : <span className="text-[9px] text-green-400 flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5" />Damper Active</span>}
            </div>
          </div>

          {/* Stress indicator — deterministic failure buildup */}
          {Math.max(stress.thermal, stress.speed, stress.weather, stress.tuning) > 0.1 && (
            <div className="border border-orange-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-orange-400 uppercase tracking-wider">{tr("Component Stress")}</span>
                <span className="text-[11px] font-bold text-orange-400">{Math.round(Math.max(stress.thermal, stress.speed, stress.weather, stress.tuning) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-100 ${Math.max(stress.thermal, stress.speed, stress.weather, stress.tuning) > 0.7 ? "bg-red-500" : "bg-orange-400"}`} style={{ width: `${Math.min(100, Math.max(stress.thermal, stress.speed, stress.weather, stress.tuning) * 100)}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[8px]">
                {stress.tuning > 0.1 && <span className="text-red-400">TUNING</span>}
                {stress.thermal > 0.1 && <span className="text-orange-400">THERMAL</span>}
                {stress.speed > 0.1 && <span className="text-yellow-400">SPEED</span>}
                {stress.weather > 0.1 && <span className="text-blue-400">WEATHER</span>}
              </div>
            </div>
          )}

          </details>
          {/* Key indicators */}
          <div className={`hidden sm:grid border border-border/30 rounded-lg p-3 gap-2 text-center text-[10px] text-muted-foreground ${screenDeleteInstalled ? "grid-cols-3" : "grid-cols-2"}`}>
            <div className={`rounded p-2 border transition-all ${(keys.current.w || touchInputs.current.gas || touchInputs.current.wheelie) && !killed ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
              <span className="text-base font-bold text-foreground block">[W]</span> {tr("GAS")}
            </div>
            <div className={`rounded p-2 border transition-all ${(keys.current.s || touchInputs.current.brake) ? "border-accent bg-accent/10 text-accent" : "border-border"}`}>
              <span className="text-base font-bold text-foreground block">[S]</span> {tr("BRAKE")}
            </div>
            {screenDeleteInstalled && (
              <div className={`rounded p-2 border transition-all ${killed ? "border-red-500 bg-red-500/20 text-red-400 animate-pulse" : "border-red-900/50 text-red-700"}`}>
                <span className="text-base font-bold block">[K]</span> {tr("KILL")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile controls */}
      {deployed && !crashed && (
        <div className="ride-touch-console mobile-controls-safe fixed bottom-3 left-0 right-0 z-50 flex flex-col items-center gap-2 px-3">
          <div className="ride-control-toolbar"><WheelieTrickPicker selected={selectedTrick} onSelect={setSelectedTrick} />
          <details className="ride-control-options" onToggle={e=>{if(!e.currentTarget.open)balanceInput.current=0;}}><summary>{tr("More controls")}</summary><div className="ride-options-content">
          <div className="flex gap-2">
            {screenDeleteInstalled && <button type="button" aria-pressed={killed} onClick={() => {
              killedRef.current = !killedRef.current;
              keys.current.w = false;
              keys.current.wheelie = false;
              touchPointerIds.current.gas.clear();
              touchPointerIds.current.wheelie.clear();
              touchInputs.current.gas = false;
              touchInputs.current.wheelie = false;
              setKilled(killedRef.current);
            }} className={`min-h-11 rounded-xl border px-3 text-xs font-bold ${killed ? 'border-emerald-400 bg-emerald-950 text-emerald-300' : 'border-red-400 bg-red-950 text-red-200'}`}>{killed ? tr('Restart') : tr('Kill switch')}</button>}
            {(practice === 'training' || isPark) ? <div className="training-balance-console"><label>{tr('Balance')}<meter aria-label="Wheelie balance" min="-1" max="1" low="-.65" high=".65" optimum="0" value={balance}/></label><div>{[[-1,'Body forward'],[1,'Body back']].map(([direction,label]) => <button key={direction} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); balanceInput.current=direction; }} onPointerUp={() => { balanceInput.current=0; }} onPointerCancel={() => { balanceInput.current=0; }} onLostPointerCapture={() => { balanceInput.current=0; }}>{tr(label)}</button>)}</div></div> : [["walk","🚶 Walk","blue"],["drive","D Drive","primary"],["sport","S Sport ⚡","red"]].map(([m, label, color]) => (
              <button
                type="button"
                key={m}
                onClick={() => { setMode(m); modeRef.current = m; }}
                className={`rounded-xl px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider border transition-all ${
                  mode === m
                    ? color === "blue" ? "bg-blue-500/30 border-blue-500/60 text-blue-300"
                      : color === "red" ? "bg-red-500/30 border-red-500/60 text-red-300"
                      : "bg-primary/30 border-primary/60 text-primary"
                    : "bg-black/60 border-border/40 text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          </div></details></div>
          <div className="ride-main-controls flex justify-center gap-3 w-full">
            <button
              type="button"
              aria-label={tr("Rear brake")} aria-pressed={touchInputs.current.brake}
              onPointerDown={(event) => beginTouchInput("brake", event)}
              onPointerUp={(event) => endTouchInput("brake", event)}
              onPointerCancel={(event) => endTouchInput("brake", event)}
              onLostPointerCapture={(event) => endTouchInput("brake",event)}
              className="ride-control-button flex-1 max-w-[110px] rounded-xl bg-accent/20 border border-accent/40 py-5 text-accent font-mono font-bold text-sm active:bg-accent/40 select-none"
            >
              {tr("Rear brake")}
            </button>
            {/* Hold to lift; rear brake remains independent. */}
            <button
              type="button"
              aria-label="WHEELIE" aria-pressed={touchInputs.current.wheelie}
              onPointerDown={(event) => beginTouchInput("wheelie", event)}
              onPointerUp={(event) => endTouchInput("wheelie", event)}
              onPointerCancel={(event) => endTouchInput("wheelie", event)}
              onLostPointerCapture={(event) => endTouchInput("wheelie",event)}
              className={`ride-control-button flex-1 max-w-[80px] rounded-xl border py-5 font-mono font-bold text-xs active:scale-95 transition-transform select-none ${
                isWheelying
                  ? "bg-yellow-500/30 border-yellow-500/60 text-yellow-300 animate-pulse"
                  : "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
              }`}
            >
              WHEELIE
            </button>
            <button
              type="button"
              aria-label={tr("GAS")} aria-pressed={touchInputs.current.gas}
              onPointerDown={(event) => beginTouchInput("gas", event)}
              onPointerUp={(event) => endTouchInput("gas", event)}
              onPointerCancel={(event) => endTouchInput("gas", event)}
              onLostPointerCapture={(event) => endTouchInput("gas",event)}
              className="ride-control-button flex-1 max-w-[110px] rounded-xl bg-primary/20 border border-primary/40 py-5 text-primary font-mono font-bold text-sm active:bg-primary/40 select-none"
            >
              {tr("GAS")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBox({ label, value, warn, color }) {
  return (
    <div className={`border rounded-lg p-3 text-center transition-all ${warn ? "border-red-500/50 bg-red-500/5 animate-pulse" : "border-border/40"}`}>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-bold text-lg tabular-nums ${color || (warn ? "text-red-400" : "text-foreground")}`}>{value}</div>
    </div>
  );
}

function BatteryMetric({ label, value, warn }) {
  return (
    <div>
      <div className="text-[8px] text-muted-foreground">{label}</div>
      <div className={`text-xs font-bold tabular-nums ${warn ? "text-red-400" : "text-green-400"}`}>{value}</div>
    </div>
  );
}

function CrashScreen({ onReset, onGarage, motorTemp, escTemp, crashType, speed, weather }) {
  const { t } = useLanguage();
  if(crashType==='loopout')return <div className="text-center space-y-5 p-8 max-w-lg w-full mx-auto" data-testid="loopout-screen"><AlertOctagon className="h-14 w-14 text-orange-400 mx-auto"/><h2 className="text-2xl font-bold">{t('Loop out')}</h2><p className="text-sm text-muted-foreground">{t('You tipped past the balance point. Tap the rear brake to bring the front wheel down.')}</p><button onClick={onReset} className="upgrade-primary">{t('Try again')}</button><button onClick={onGarage} className="upgrade-primary">{t('Build Shop')}</button></div>;
  if (crashType === "mosfet_melt") {
    return (
      <div className="text-center space-y-4 p-6 max-w-lg mx-auto w-full">
        <div className="font-mono text-[10px] text-red-400 uppercase tracking-widest animate-pulse">
          ! ! CRITICAL HARDWARE FAULT: SHORT CIRCUIT ! !
        </div>
        <div className="border border-red-500/40 rounded-lg p-4 font-mono text-[10px] text-left space-y-1.5 bg-red-950/20">
          <div className="flex justify-between"><span className="text-muted-foreground">ESC STATE</span><span className="text-red-400 font-bold">ERR_MOSFET_MELT</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">KILLSWITCH</span><span className="text-red-400">INEFFECTIVE (SHORTED)</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">ESC TEMP</span><span className="text-red-400 font-bold">{escTemp.toFixed(0)}°C — RUNAWAY</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">SPEED</span><span className="text-red-400">{speed.toFixed(0)} km/h → 0 LOCKED</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">CONDITIONS</span><span className="text-yellow-400">{weather?.icon} {weather?.label}</span></div>
          <div className="border-t border-red-500/30 pt-2 space-y-1 text-red-300">
            <div>[ POP! ] CAPACITOR EXPLOSION — DECK SPARKS</div>
            <div>[ PHASE ]: FIXED SHORT — WHEEL LOCKED</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={onReset} className="rounded-md bg-red-500/20 border border-red-500/40 px-5 py-2.5 font-mono text-sm text-red-400 hover:bg-red-500/30 transition-all">[ RESET ]</button>
          <button onClick={onGarage} className="rounded-md bg-card border border-border px-5 py-2.5 font-mono text-sm text-foreground hover:border-primary/40 transition-all">Build Shop</button>
        </div>
      </div>
    );
  }

  if (crashType === "police") {
    return (
      <div className="text-center space-y-5 p-8 max-w-lg w-full mx-auto">
        <div className="text-6xl">🚔</div>
        <div className="font-mono text-blue-400 text-xs uppercase tracking-widest animate-pulse">YOU GOT PULLED OVER</div>
        <h2 className="font-mono text-2xl font-bold text-foreground">BUSTED</h2>
        <div className="border border-blue-500/30 rounded-lg p-4 font-mono text-[10px] text-left space-y-1.5 bg-blue-950/20">
          <div className="flex justify-between"><span className="text-muted-foreground">VIOLATION</span><span className="text-blue-300 font-bold">EXCESSIVE SPEED — UNLICENSED VEHICLE</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">SPEED AT STOP</span><span className="text-red-400">{speed.toFixed(0)} km/h</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">CONDITIONS</span><span className="text-yellow-400">{weather?.icon} {weather?.label}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">FINE</span><span className="text-red-400 font-bold">-25 REP (STREET CRED LOSS)</span></div>
          <div className="border-t border-blue-500/20 pt-2 text-blue-300 text-[9px]">TIP: Slow below 20 km/h to evade. Unlock GHOSTMODE for faster escapes.</div>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={onReset} className="rounded-md bg-blue-500/20 border border-blue-500/40 px-5 py-2.5 font-mono text-sm text-blue-400 hover:bg-blue-500/30 transition-all">[ FLEE AGAIN ]</button>
          <button onClick={onGarage} className="rounded-md bg-card border border-border px-5 py-2.5 font-mono text-sm text-foreground hover:border-primary/40 transition-all">Build Shop</button>
        </div>
      </div>
    );
  }

  const isMotor = crashType === "motor_melt";
  // Component failure from FAILURE_CODES
  const failInfo = FAILURE_CODES.find(f => f.code === crashType);
  if (failInfo) {
    return (
      <div className="text-center space-y-5 p-8 max-w-lg w-full mx-auto">
        <AlertOctagon className="h-14 w-14 text-red-500 mx-auto animate-pulse" />
        <div className="font-mono text-red-500 text-xs uppercase tracking-widest animate-pulse">Component Failure</div>
        <h2 className="font-mono text-2xl font-bold text-foreground">{failInfo.code}</h2>
        <div className="border border-red-500/30 rounded-lg p-4 font-mono text-[10px] text-left space-y-2 bg-red-950/20">
          <div><span className="text-muted-foreground">CAUSE: </span><span className="text-foreground">{failInfo.cause}</span></div>
          <div><span className="text-muted-foreground">EFFECT: </span><span className="text-red-400">{failInfo.effect}</span></div>
          <div className="flex justify-between border-t border-red-500/20 pt-2">
            <span className="text-muted-foreground">SPEED</span>
            <span className="text-red-400">{speed.toFixed(0)} km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CONDITIONS</span>
            <span className="text-yellow-400">{weather?.icon} {weather?.label}</span>
          </div>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={onReset} className="rounded-md bg-red-500/20 border border-red-500/40 px-5 py-2.5 font-mono text-sm text-red-400 hover:bg-red-500/30 transition-all">Try Again</button>
          <button onClick={onGarage} className="rounded-md bg-card border border-border px-5 py-2.5 font-mono text-sm text-foreground hover:border-primary/40 transition-all">Build Shop</button>
        </div>
      </div>
    );
  }
  return (
    <div className="text-center space-y-5 p-8 max-w-lg w-full mx-auto">
      <AlertOctagon className="h-14 w-14 text-red-500 mx-auto animate-pulse" />
      <div className="font-mono text-red-500 text-xs uppercase tracking-widest animate-pulse">Fatal Crash Detected</div>
      <h2 className="font-mono text-2xl font-bold text-foreground">
        {isMotor ? "ERR_MOTOR_MELT" : "ERR_SPEED_WOBBLE"}
      </h2>
      <p className="font-mono text-sm text-muted-foreground max-w-sm mx-auto">
        {isMotor
          ? `Motor hit 165°C. Stator insulation burned out. White smoke pours from hub. Motor temp at crash: ${motorTemp.toFixed(0)}°C.`
          : `Wobble frequency maxed at ${speed.toFixed(0)} km/h in ${weather?.label || "unknown"} conditions. High-side crash.`}
      </p>
      <div className="font-mono text-[10px] text-muted-foreground">
        Weather: {weather?.icon} {weather?.label} — Road Grip: {Math.round((weather?.gripMod || 1) * 100)}%
      </div>
      <div className="flex gap-3 justify-center flex-wrap">
        <button onClick={onReset} className="rounded-md bg-red-500/20 border border-red-500/40 px-5 py-2.5 font-mono text-sm text-red-400 hover:bg-red-500/30 transition-all">Try Again</button>
        <button onClick={onGarage} className="rounded-md bg-card border border-border px-5 py-2.5 font-mono text-sm text-foreground hover:border-primary/40 transition-all">Build Shop</button>
      </div>
    </div>
  );
}
