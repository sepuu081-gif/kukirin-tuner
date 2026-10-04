import { useState } from "react";
import { Zap, Gauge, Weight, CircleDot, Unlock, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { SERIES } from "../lib/vehicleData";
import { getVehiclePhoto, getVehiclePhotoInfo } from '../lib/vehiclePhotos';
import { useLanguage } from '../lib/i18n';

function getSpeedUnlocks() {
  try { return JSON.parse(localStorage.getItem("kukirin_speed_unlocked") || "{}"); } catch { return {}; }
}
function saveSpeedUnlock(vid, val) {
  const cur = getSpeedUnlocks();
  localStorage.setItem("kukirin_speed_unlocked", JSON.stringify({ ...cur, [vid]: val }));
}

export default function VehicleCard({ vehicle, hasBuild }) {
  const { t } = useLanguage();
  const series = SERIES[vehicle.series];
  const [speedUnlocked, setSpeedUnlocked] = useState(() => getSpeedUnlocks()[vehicle.id] || false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);

  // Speed limit delete available on ALL vehicles (not just VMP)
  const hasFactoryLimit = !vehicle.noSpeedLimit;
  const effectiveTopSpeed = hasFactoryLimit && speedUnlocked ? Math.max(vehicle.topSpeed + 15, 50) : vehicle.topSpeed;

  const handleUnlock = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (speedUnlocked) {
      setSpeedUnlocked(false);
      saveSpeedUnlock(vehicle.id, false);
    } else {
      setShowUnlockPrompt(true);
    }
  };

  const confirmUnlock = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSpeedUnlocked(true);
    saveSpeedUnlock(vehicle.id, true);
    setShowUnlockPrompt(false);
  };

  return (
    <Link
      to={`/vehicle/${vehicle.id}`}
      className="vehicle-card group relative block rounded-xl border border-border bg-gradient-to-b from-card to-card/50 p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 active:scale-[0.99] sm:p-4"
    >
      <div className="absolute right-3 top-3 flex gap-1">
        {vehicle.restricted && !speedUnlocked && (
          <div className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider">
            Locked
          </div>
        )}
        {hasFactoryLimit && speedUnlocked && (
          <div className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider">
            DELIMITED
          </div>
        )}
        {vehicle.noSpeedLimit && (
          <div className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-pink-400 uppercase tracking-wider">
            UNLOCKED
          </div>
        )}
        {hasBuild && (
          <div className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary uppercase tracking-wider">
            BUILD ✓
          </div>
        )}
      </div>

      <div className="mb-2 flex items-center gap-2 sm:mb-3">
        {getVehiclePhoto(vehicle) ? <img className="garage-model-photo" src={getVehiclePhoto(vehicle)} alt={vehicle.name} loading="lazy" /> : <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <Zap className="h-4 w-4 text-primary" />
        </div>}
        <div>
          <h3 className="pr-14 font-sans text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {vehicle.name}
          </h3>
          <span className={`text-[10px] font-mono uppercase tracking-wider ${series?.color || 'text-muted-foreground'}`}>
            {series?.name}
          </span>
          {getVehiclePhotoInfo(vehicle)?.kind === 'illustration' && <span className="block text-[9px] text-muted-foreground">{t('Illustration')}</span>}
        </div>
      </div>

      <p className="mb-2 line-clamp-1 text-xs leading-relaxed text-muted-foreground sm:mb-3 sm:line-clamp-2">
        {vehicle.desc}
      </p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Zap className="h-3 w-3 text-accent" />
          <span>{vehicle.voltage}V {vehicle.watts}W</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Gauge className="h-3 w-3 text-primary" />
          <span className={speedUnlocked && hasFactoryLimit ? "text-orange-400" : ""}>{effectiveTopSpeed} km/h</span>
          {speedUnlocked && hasFactoryLimit && <span className="text-[9px] text-orange-400">DELIM</span>}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Weight className="h-3 w-3 text-muted-foreground" />
          <span>{vehicle.weight} kg</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CircleDot className="h-3 w-3 text-muted-foreground" />
          <span>{vehicle.tireSize}"</span>
          {vehicle.motorCount > 1 && <span className="text-primary">×{vehicle.motorCount}</span>}
        </div>
      </div>

      {/* Sleeper rating bar */}
      <div className="mt-2 border-t border-border pt-2 sm:mt-3 sm:pt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Sleeper Rating</span>
          <span className="text-[10px] font-mono text-primary">{vehicle.sleeperRating}/10</span>
        </div>
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
            style={{ width: `${vehicle.sleeperRating * 10}%` }}
          />
        </div>
      </div>

      {/* Speed limit delete — available on ALL vehicles */}
      {hasFactoryLimit && (
        <div className="mt-2 border-t border-border pt-2 sm:mt-3 sm:pt-3">
          {showUnlockPrompt ? (
            <div className="space-y-1.5" onClick={e => e.preventDefault()}>
              <p className="font-mono text-[9px] text-yellow-400">⚠ Remove firmware speed cap? Adds +15 km/h min 50 km/h.</p>
              <div className="flex gap-1.5">
                <button
                  onClick={confirmUnlock}
                  className="flex min-h-10 flex-1 items-center justify-center rounded-md border border-orange-500/40 bg-orange-500/10 py-2 font-mono text-[9px] text-orange-400 hover:bg-orange-500/20 transition-all font-bold"
                >
                  DELETE LIMIT
                </button>
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setShowUnlockPrompt(false); }}
                  className="min-h-10 flex-1 rounded-md border border-border py-2 font-mono text-[9px] text-muted-foreground hover:border-primary/30 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleUnlock}
              className={`flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-all active:scale-[0.99] sm:min-h-11 sm:py-2.5 ${
                speedUnlocked
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                  : "border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500/10"
              }`}
            >
              {speedUnlocked
                ? <><Lock className="h-3 w-3" /> Re-Limit</>
                : <><Unlock className="h-3 w-3" /> Delete Speed Limit</>
              }
            </button>
          )}
        </div>
      )}
    </Link>
  );
}
