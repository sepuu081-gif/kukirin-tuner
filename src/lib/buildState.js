import {STUNT_BAR} from './stuntBar.js';
import { BLUE_G2_STYLE } from './appearanceTuning.js';
import { getMotorDriveSpec, getMotorCount, solveRoadSpeed } from './drivePhysics.js';
import { VEHICLES } from './vehicleData.js';

const KEY = "kukirin_builds";

function getAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

export const DEFAULT_APPEARANCE = {
  deckColor: "#f97316",
  stemColor: "#374151",
  wheelColor: "#1f2937",
  accentColor: "#f97316",
  customEnabled:false,
  ledEnabled:false,
  ledColor:'#38bdf8',
  ledMode:'steady',
  sticker:'factory',
  stickerColor:'#e0f2fe',
  wrap: null, // wrap id or null
  riderHelmetColor: "#f97316",
  riderHelmetType: 'fullface',
};

export function createStockBuild(vehicleId) {
  const vehicle=VEHICLES.find(v=>v.id===vehicleId);
  const factoryStyle=vehicle?.wrap?{customEnabled:true,wrap:vehicle.wrap,deckColor:'#101b38',stemColor:'#101b38',accentColor:'#d9233e'}:{};
  return {
    vehicleId,
    weldCount: 0,
    frameExpansion: 0,
    parts: {
      motor: null,
      controller: null,
      battery: null,
      wheel: null,
      gearing: null,
      suspension: null,
      brakes: null,
      damper: null,
      wheelie_bar: null,
      vesc_display: null,
      electronics: null,
      cooling: null,
    },
    bodywork: {},
    bms: null,
    appearance: { ...DEFAULT_APPEARANCE, ...factoryStyle },
    notes: [],
  };
}

export function getBuild(vehicleId) {
  const all = getAll();
  if(all[vehicleId]?.parts?.wheelie_bar && all[vehicleId].parts.wheelie_bar.id!==STUNT_BAR.id){all[vehicleId].parts.wheelie_bar={...STUNT_BAR};localStorage.setItem(KEY,JSON.stringify(all));}
  if (vehicleId === 'g2_2026' && localStorage.getItem('kukirin_g2_style_v41') !== 'true') {
    const next = all[vehicleId] || createStockBuild(vehicleId);
    next.appearance = { ...DEFAULT_APPEARANCE, ...next.appearance, ...BLUE_G2_STYLE };
    saveBuild(next);
    localStorage.setItem('kukirin_g2_style_v41','true');
    return next;
  }
  if (all[vehicleId]) {
    // Ensure appearance exists on old saves
    all[vehicleId].appearance = { ...DEFAULT_APPEARANCE, ...all[vehicleId].appearance };
    if(vehicleId==='sebius_redbull_g2'&&!all[vehicleId].appearance.customEnabled){
      all[vehicleId].appearance=createStockBuild(vehicleId).appearance;
      saveBuild(all[vehicleId]);
    }
    if (!all[vehicleId].bms) all[vehicleId].bms = null;
    return all[vehicleId];
  }
  return createStockBuild(vehicleId);
}

export function isStockBuild(build) {
  if (!build) return true;
  const hasInstalledPart = Object.values(build.parts || {}).some(Boolean);
  return !hasInstalledPart
    && !build.bms
    && !build.screenDeleteInstalled
    && !(build.weldCount > 0)
    && !(build.frameExpansion > 0)
    && !build.bodywork?.frame_brace;
}

export function saveBuild(build) {
  const all = getAll();
  all[build.vehicleId] = build;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getAllBuilds() {
  return getAll();
}

export function getMaxFrameSize(vehicle, weldCount) {
  return vehicle.chassisStrength + weldCount;
}

export function checkPartFit(part, vehicle, weldCount) {
  return (!part.forVehicles || part.forVehicles.includes(vehicle.id)) && (!part.forSeries || part.forSeries.includes(vehicle.series)) && part.sizeClass <= getMaxFrameSize(vehicle, weldCount);
}

export function calcBuildStats(vehicle, build) {
  const { parts } = build;

  const motorPart = parts.motor;
  const battPart  = parts.battery;
  const ctrlPart  = parts.controller;
  const coolPart  = parts.cooling;
  const dampPart  = parts.damper;
  const gearPart  = parts.gearing;

  const hyperVolt  = localStorage.getItem("kukirin_unlock_hypervolt") === "true";

  const voltage   = battPart?.voltage  || vehicle.voltage;
  const watts     = motorPart?.watts   || vehicle.watts;
  const baseAmps  = ctrlPart?.maxAmps  || vehicle.maxAmps || 30;
  const maxAmps   = (hyperVolt && ctrlPart?.custom) ? baseAmps + 20 : baseAmps;
  const heatReduction = coolPart?.heatReduction || 0;
  const dampFactor = dampPart?.dampFactor != null ? dampPart.dampFactor : 0;

  // BMS sag and cutoff bonus
  const bms = build.bms;
  const bmsMaxAmps   = bms?.maxAmps || battPart?.maxDischargeAmps || (battPart ? (battPart.capacity || 15) * 5 : vehicle.maxAmps || 40);
  const bmsCutoff    = bms?.cutoffVoltage || voltage * 0.82;
  const hasBypassBms = bms?.id === "bms_bypass";

  // STATORADE code gives +30°C global
  const statoradeBonus = localStorage.getItem("kukirin_unlock_statorade") === "true" ? 30 : 0;
  const heatCap = vehicle.heatCapacity + heatReduction + statoradeBonus;

  // Top speed uses road-load physics. Power is spent on rolling resistance and
  // aerodynamic drag, while voltage, wheel size and motor winding limit RPM.
  const wheelPart = parts.wheel;
  const elecPart = parts.electronics;
  const brakePart = parts.brakes;

  const stockWheelSize = vehicle.tireSize || 10;
  const fittedWheelSize = wheelPart?.size || stockWheelSize;
  const gearingSpeedFactor = gearPart?.speedFactor || 1;
  const torqueFactor = (gearPart?.torqueFactor || 1) * stockWheelSize / fittedWheelSize;
  const controllerPower = ctrlPart ? voltage * maxAmps * 0.88 : vehicle.watts;
  const batteryDischargeAmps = battPart?.maxDischargeAmps || (battPart ? (battPart.capacity || 15) * 5 : (vehicle.maxAmps || Math.max(40, vehicle.watts / vehicle.voltage * 1.5)));
  const batteryCurrentLimit = hasBypassBms ? batteryDischargeAmps : Math.min(batteryDischargeAmps, bms?.maxAmps || batteryDischargeAmps);
  const batteryPower = voltage * batteryCurrentLimit;
  const usablePower = Math.max(0, Math.min(watts, controllerPower, batteryPower));
  const efficiencyGain = elecPart ? 1.01 : 1;
  const bmsGain = hasBypassBms ? 1.025 : 1;
  const wheelbase    = vehicle.wheelbase + build.weldCount * 50;
  const braceWeight = build.bodywork?.frame_brace ? 1.2 : 0;
  const totalWeight  = vehicle.weight + braceWeight + build.weldCount * 2 + Object.values(parts).reduce((sum,part)=>sum+(part?.weight || 0),0) + (build.bms?.weight || 0);
  const frameDurability = Math.min(100, 35 + vehicle.chassisStrength * 5 + build.weldCount * 4 + (build.bodywork?.frame_brace ? 10 : 0));
  const thermalDurability = Math.min(100, 40 + heatCap * 0.45);
  const brakeBonus = brakePart ? 4 : 0;
  const durability = Math.max(25, Math.min(100, (frameDurability * 0.58 + thermalDurability * 0.42 + brakeBonus)));

  // Rider + scooter mass, normal upright/tucked scooter CdA, and road tyres.
  // Strong race builds receive a modest tuck/aero benefit but drag still rises v³.
  const systemMass = totalWeight + 78;
  const tucked = localStorage.getItem('kukirin_rider_posture') === 'tuck';
  const aeroCdA = tucked ? (vehicle.vehicleType === 'emoto' ? 0.38 : 0.34) : (vehicle.vehicleType === 'emoto' ? 0.65 : 0.56);
  const rollingCoefficient = wheelPart?.size >= 11 ? 0.014 : 0.016;
  const mechanicalPower = usablePower * 0.86 * efficiencyGain * bmsGain;
  const roadLimitedSpeed = solveRoadSpeed(mechanicalPower, systemMass, aeroCdA, rollingCoefficient);
  const motorDrive = getMotorDriveSpec(vehicle, motorPart);
  const rpmLimitedSpeed = motorDrive.kv * voltage / motorDrive.ratio
    * Math.PI * fittedWheelSize * 0.0254 * 60 / 1000 * 0.95 * gearingSpeedFactor;
  const hasPowertrainSwap = !!(motorPart || battPart || ctrlPart || wheelPart || gearPart);
  const calculatedSpeed = hasPowertrainSwap
    ? Math.min(roadLimitedSpeed, rpmLimitedSpeed)
    : vehicle.topSpeed;
  const topSpeed = Math.max(0, calculatedSpeed);
  const speedLimiter = !hasPowertrainSwap ? 'factory' : roadLimitedSpeed <= rpmLimitedSpeed ? 'drag' : 'rpm';

  return { voltage, watts, maxAmps, usablePower, mechanicalPower, aeroCdA, topSpeed, roadLimitedSpeed, rpmLimitedSpeed, speedLimiter, motorCount: getMotorCount(vehicle, motorPart), motorKV: motorDrive.kv, riderPosture: tucked ? 'tuck' : 'upright', batteryCurrentLimit, wheelbase, totalWeight, heatCap, durability, dampFactor, torqueFactor, bmsMaxAmps, bmsCutoff, hasBypassBms };
}

// Wrap catalog for appearance editor
export const WRAPS = [
  { id: "none",          label: "Stock",          preview: "#374151" },
  { id: "carbon_black",  label: "Carbon Black",   preview: "#111" },
  { id: "carbon_orange", label: "Carbon Orange",  preview: "#c2410c" },
  { id: "camo_green",    label: "Camo Green",     preview: "#4d7c0f" },
  { id: "chrome_silver", label: "Chrome Silver",  preview: "#c0c0c0" },
  { id: "matte_white",   label: "Matte White",    preview: "#e5e7eb" },
  { id: "matte_black",   label: "Matte Black",    preview: "#18181b" },
  { id: "galaxy_purple", label: "Galaxy Purple",  preview: "#7e22ce" },
  { id: "bloodred",      label: "Blood Red",      preview: "#7f1d1d" },
  { id: "arctic_blue",   label: "Arctic Blue",    preview: "#1d4ed8" },
  { id: "toxic_green",   label: "Toxic Green",    preview: "#16a34a" },
  { id: "gold_chrome",   label: "Gold Chrome",    preview: "#d97706" },
];

// DECK_COLORS for color picker presets
export const DECK_COLORS = [
  "#f97316","#ef4444","#3b82f6","#22c55e","#a855f7","#eab308",
  "#ec4899","#14b8a6","#ffffff","#18181b","#c0c0c0","#d97706",
];
