import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BatteryCharging, Home, Moon, PlugZap, Zap } from "lucide-react";
import { VEHICLES } from "../lib/vehicleData";
import { getAllBuilds, getBuild } from "../lib/buildState";
import { chargeAllVehicles, getChargerPowerKw, getVehicleCharge, getVehicleEnergyWh, toggleVehicleCharging } from "../lib/chargingState";
import { useLanguage } from "../lib/i18n";

const DEFAULT_HOME_FLEET = ["g2_pro_2023", "surron_light_bee_x", "surron_ultra_bee", "stark_varg_mx"];

export default function HouseGarage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const builds = useMemo(() => getAllBuilds(), []);
  const fleet = useMemo(() => {
    const ids = [...new Set([...DEFAULT_HOME_FLEET, ...Object.keys(builds)])];
    return ids.map((id) => VEHICLES.find((vehicle) => vehicle.id === id)).filter(Boolean);
  }, [builds]);
  const [charges, setCharges] = useState({});

  const refresh = () => {
    const next = {};
    fleet.forEach((vehicle) => { next[vehicle.id] = getVehicleCharge(vehicle.id, vehicle, getBuild(vehicle.id)); });
    setCharges(next);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, []); // Fleet is fixed for the lifetime of this page.

  const sleepUntilMorning = () => {
    chargeAllVehicles(fleet.map((vehicle) => vehicle.id));
    refresh();
  };

  return (
    <div className="house-page app-surface min-h-screen bg-[#050a12] pb-[calc(2rem+env(safe-area-inset-bottom))] text-foreground">
      <header className="app-header sticky top-0 z-50 border-b border-cyan-500/20 bg-[#07111f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-3">
          <button onClick={() => navigate("/", { replace: true })} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground" aria-label={t("Back")}><ArrowLeft className="h-5 w-5" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2"><Home className="h-4 w-4 text-cyan-300"/><h1 className="font-mono text-sm font-bold">{t("My House")}</h1></div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{t("Private garage and smart charging")}</p>
          </div>
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-right font-mono"><div className="text-[8px] text-green-300/70">GRID</div><div className="text-[10px] font-bold text-green-300">ONLINE</div></div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-3 py-4">
        <section className="house-hero relative overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-b from-[#10243b] to-[#08101a] p-4 shadow-2xl shadow-cyan-950/40">
          <div className="house-moon" />
          <div className="relative z-10 max-w-[65%] pt-2">
            <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-cyan-300">{t("Home garage")}</div>
            <h2 className="mt-1 text-xl font-black leading-tight text-white">{t("Park. Plug in. Ride full.")}</h2>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{t("Charging continues while the app is closed.")}</p>
          </div>
          <div className="house-building" aria-hidden="true"><i/><i/><i/><b/></div>
          <div className="relative z-10 mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-2.5 backdrop-blur-sm">
            <PlugZap className="h-5 w-5 text-cyan-300"/>
            <div className="flex-1"><div className="text-[10px] font-bold">{t("Smart wallbox")}</div><div className="text-[9px] text-muted-foreground">0.55–3.3 kW · automatic BMS stop</div></div>
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]"/>
          </div>
        </section>

        <button onClick={sleepUntilMorning} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 font-mono text-xs font-bold text-indigo-200 active:scale-[0.98]">
          <Moon className="h-4 w-4"/> {t("Sleep until morning — charge all")}
        </button>

        <section className="space-y-3">
          <div className="flex items-end justify-between px-1"><h2 className="font-mono text-xs font-bold uppercase tracking-widest">{t("Garage bays")}</h2><span className="text-[9px] text-muted-foreground">{fleet.length} VEHICLES</span></div>
          {fleet.map((vehicle, index) => {
            const charge = charges[vehicle.id] || { pct: 100, charging: false };
            const build = getBuild(vehicle.id);
            const chargerKw = getChargerPowerKw(vehicle);
            const pctPerHour = chargerKw * 1000 / getVehicleEnergyWh(vehicle, build) * 100;
            const minutesLeft = Math.ceil((100 - charge.pct) / Math.max(0.1, pctPerHour) * 60);
            return (
              <article key={vehicle.id} className={`house-charge-card rounded-2xl border p-3.5 ${charge.charging ? "is-charging border-cyan-400/45 bg-cyan-500/[0.07]" : "border-border bg-card/80"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700 to-slate-950 font-mono text-xs font-black" style={{ color: vehicle.accentColor || "#38bdf8" }}>{vehicle.series === "STARK" ? "S" : vehicle.series === "SURRON" ? "SR" : "K"}</div>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[9px] text-muted-foreground">BAY {index + 1}</span>{charge.charging && <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[8px] font-bold text-cyan-300">CHARGING</span>}</div><h3 className="truncate text-sm font-bold">{vehicle.name}</h3><div className="mt-0.5 font-mono text-[9px] text-muted-foreground">{vehicle.voltage}V · {chargerKw.toFixed(1)}kW WALLBOX</div></div>
                  <div className={`font-mono text-xl font-black ${charge.pct < 15 ? "text-red-400" : charge.charging ? "text-cyan-300" : "text-white"}`}>{charge.pct.toFixed(0)}<span className="text-[10px]">%</span></div>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/50"><div className={`h-full rounded-full transition-all duration-700 ${charge.charging ? "house-charge-flow" : "bg-gradient-to-r from-cyan-600 to-cyan-300"}`} style={{ width: `${charge.pct}%` }}/></div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => { toggleVehicleCharging(vehicle.id, vehicle, build); refresh(); }} disabled={charge.pct >= 100} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border font-mono text-[10px] font-bold uppercase active:scale-[0.98] disabled:opacity-40 ${charge.charging ? "border-red-400/30 bg-red-500/10 text-red-300" : "border-cyan-400/35 bg-cyan-500/10 text-cyan-200"}`}>
                    {charge.charging ? <><PlugZap className="h-4 w-4"/> {t("Unplug")}</> : <><BatteryCharging className="h-4 w-4"/> {charge.pct >= 100 ? t("Full") : t("Plug in")}</>}
                  </button>
                  <button onClick={() => navigate(`/vehicle/${vehicle.id}`)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-background text-primary" aria-label={t("Open vehicle")}><Zap className="h-4 w-4"/></button>
                </div>
                {charge.charging && <div className="mt-2 text-center font-mono text-[9px] text-cyan-300/80">{minutesLeft < 1 ? t("Finishing…") : `${minutesLeft} MIN → 100%`}</div>}
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
