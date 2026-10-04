export const CAREER_EVENTS = [
  { id: "alley_rookie", title: "Alley Rookie", district: "Old Town", vehicleId: "s3_pro", opponentId: "ai_rookie", opponentTopSpeed: 22, opponentAccel: 0.16, rewardXp: 100, rewardRep: 40, unlockVehicle: "m4_legacy" },
  { id: "dock_sprint", title: "Dock Sprint", district: "Harbour", vehicleId: "m4_legacy", opponentId: "ai_tuner", opponentTopSpeed: 32, opponentAccel: 0.20, rewardXp: 140, rewardRep: 55, unlockVehicle: "g2_pro_2023" },
  { id: "industrial_400", title: "Industrial 400", district: "Factory Mile", vehicleId: "g2_pro_2023", opponentId: "ai_sleeper", opponentTopSpeed: 42, opponentAccel: 0.25, rewardXp: 180, rewardRep: 70, unlockVehicle: "g2_max" },
  { id: "night_shift", title: "Night Shift", district: "Ring Road", vehicleId: "g2_max", opponentId: "ai_elite", opponentTopSpeed: 51, opponentAccel: 0.32, rewardXp: 230, rewardRep: 90, unlockVehicle: "g3_pro" },
  { id: "dual_motor_cup", title: "Dual Motor Cup", district: "Airfield", vehicleId: "g3_pro", opponentId: "ai_elite", opponentTopSpeed: 68, opponentAccel: 0.50, rewardXp: 280, rewardRep: 110, unlockVehicle: "dt_spider2" },
  { id: "storm_run", title: "Storm Run", district: "Coastal Road", vehicleId: "dt_spider2", opponentId: "ai_legend", opponentTopSpeed: 62, opponentAccel: 0.65, rewardXp: 340, rewardRep: 140, unlockVehicle: "nami_burne_max" },
  { id: "hyper_final", title: "Hyper Final", district: "Blacksite Track", vehicleId: "nami_burne_max", opponentId: "ai_legend", opponentTopSpeed: 91, opponentAccel: 1.00, rewardXp: 450, rewardRep: 200, unlockVehicle: "rion_apex" },
  { id: "apex_unlimited", title: "Apex Unlimited", district: "Salt Flats", vehicleId: "rion_apex", opponentId: "ai_legend", opponentTopSpeed: 122, opponentAccel: 1.30, rewardXp: 600, rewardRep: 300, unlockVehicle: "dt_x_ltd" },
];

const KEY = "kukirin_career";

export function getCareer() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      xp: Number(saved.xp) || 0,
      completed: Array.isArray(saved.completed) ? saved.completed : [],
      owned: Array.isArray(saved.owned) && saved.owned.length ? saved.owned : ["s3_pro"],
      wins: Number(saved.wins) || 0,
      races: Number(saved.races) || 0,
    };
  } catch { return { xp: 0, completed: [], owned: ["s3_pro"], wins: 0, races: 0 }; }
}

export function saveCareer(career) {
  localStorage.setItem(KEY, JSON.stringify(career));
}

export function careerLevel(xp) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 110)) + 1);
}

export function completeCareerRace(eventId, won) {
  const career = getCareer();
  const event = CAREER_EVENTS.find((item) => item.id === eventId);
  const firstWin = !!event && won && !career.completed.includes(eventId);
  const next = {
    ...career,
    races: career.races + 1,
    wins: career.wins + (won ? 1 : 0),
    xp: career.xp + (firstWin ? event.rewardXp : won ? 30 : 10),
    completed: firstWin ? [...career.completed, eventId] : career.completed,
    owned: firstWin && event.unlockVehicle && !career.owned.includes(event.unlockVehicle)
      ? [...career.owned, event.unlockVehicle]
      : career.owned,
  };
  saveCareer(next);
  return { career: next, event, firstWin };
}

export function getBrokenVehicles() {
  if (!damageEnabled()) return new Set();
  try { return new Set(JSON.parse(localStorage.getItem("kukirin_broken_parts") || "[]").map((item) => item.vehicleId)); } catch { return new Set(); }
}
import { damageEnabled } from './gameSettings';
