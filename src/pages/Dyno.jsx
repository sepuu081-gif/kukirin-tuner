import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { VEHICLES } from "../lib/vehicleData";
import { getAllBuilds, calcBuildStats, getBuild, isStockBuild } from "../lib/buildState";
import { ArrowLeft, Activity } from "lucide-react";
import ShareCard from "../components/ShareCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

function getRespect() { try { return parseInt(localStorage.getItem("kukirin_respect") || "0"); } catch { return 0; } }
function addRespect(n) { localStorage.setItem("kukirin_respect", String(getRespect() + n)); }

export default function Dyno() {
  const navigate = useNavigate();
  const location = useLocation();
  const builds = getAllBuilds();
  const urlVehicle = new URLSearchParams(location.search).get("vehicle");
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    urlVehicle && VEHICLES.find(v => v.id === urlVehicle) ? urlVehicle : VEHICLES[0].id
  );
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [dynoData, setDynoData] = useState([]);
  const [progress, setProgress] = useState(0);
  const [peakPower, setPeakPower] = useState(null);
  const [peakTorque, setPeakTorque] = useState(null);
  const [topSpeed, setTopSpeed] = useState(null);
  const [thermalLimit, setThermalLimit] = useState(null);
  const [bestDyno, setBestDyno] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kukirin_dyno_bests") || "{}"); } catch { return {}; }
  });
  const intervalRef = useRef(null);

  const vehicle = VEHICLES.find(v => v.id === selectedVehicleId) || VEHICLES[0];
  const build = getBuild(selectedVehicleId);
  const stats = calcBuildStats(vehicle, build);
  const stockBuild = isStockBuild(build);

  const runDyno = () => {
    setPhase("running");
    setDynoData([]);
    setProgress(0);
    setPeakPower(null);
    setPeakTorque(null);
    setTopSpeed(null);
    setThermalLimit(null);

    const points = [];
    let rpm = 0;
    let temp = 30;
    const maxRPM = 4000 + (stats.watts / 10);
    const voltageEffect = stats.voltage / vehicle.voltage;
    const ampEffect = stats.maxAmps / 30;

    let i = 0;
    const totalSteps = 60;

    intervalRef.current = setInterval(() => {
      i++;
      rpm = (i / totalSteps) * maxRPM;
      const rpmRatio = rpm / maxRPM;

      // Power curve — bell-shaped, peaks at ~70% RPM
      const powerBase = stats.watts * voltageEffect;
      const peakShape = Math.sin(rpmRatio * Math.PI * 0.9) * (0.8 + ampEffect * 0.2);
      const power = Math.max(0, powerBase * peakShape * (0.85 + Math.random() * 0.06));

      // Torque = Power / (RPM * 2π / 60)
      const torque = rpm > 0 ? (power / (rpm * Math.PI * 2 / 60)) : 0;

      // Speed estimate at this RPM band
      const spd = (rpmRatio * stats.topSpeed * (0.9 + Math.random() * 0.05));

      // Temp climbs
      temp = stockBuild
        ? Math.min(Math.max(32, stats.heatCap - 2), temp + (power / stats.watts) * 0.45)
        : Math.min(stats.heatCap + 10, temp + (power / stats.watts) * 1.8 + Math.random() * 0.3);
      const thermalDerate = stockBuild ? 1 : (temp > stats.heatCap ? Math.max(0.6, 1 - (temp - stats.heatCap) / 80) : 1);

      const finalPower = power * thermalDerate;
      const point = { rpm: Math.round(rpm), power: Math.round(finalPower), torque: +torque.toFixed(1), speed: +spd.toFixed(1), temp: Math.round(temp) };
      points.push(point);
      setDynoData([...points]);
      setProgress(Math.round((i / totalSteps) * 100));

      if (thermalDerate < 0.8 && !thermalLimit) setThermalLimit(Math.round(rpm));

      if (i >= totalSteps) {
        clearInterval(intervalRef.current);
        const peak = Math.max(...points.map(p => p.power));
        const peakTq = Math.max(...points.map(p => p.torque));
        const ts = Math.max(...points.map(p => p.speed));
        setPeakPower(Math.round(peak));
        setPeakTorque(peakTq.toFixed(1));
        setTopSpeed(ts.toFixed(1));
        setPhase("done");

        // Respect for completing dyno (DYNOKING doubles it)
        const dynoKing = localStorage.getItem("kukirin_unlock_dynoking") === "true";
        addRespect(dynoKing ? 30 : 15);

        // Save best
        const prev = bestDyno[selectedVehicleId];
        if (!prev || peak > prev.power) {
          const updated = { ...bestDyno, [selectedVehicleId]: { power: Math.round(peak), torque: +peakTq.toFixed(1), speed: +ts.toFixed(1) } };
          setBestDyno(updated);
          localStorage.setItem("kukirin_dyno_bests", JSON.stringify(updated));
        }
      }
    }, 80);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const hasBuild = !!builds[selectedVehicleId];

  return (
    <div className="app-surface min-h-screen bg-background font-mono">
      <header className="app-header border-b border-border bg-card/80 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/", { replace: true })} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Garage</span>
          </button>
          <div className="h-4 w-px bg-border" />
          <Activity className="h-4 w-4 text-accent" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Dyno Room</span>
          {phase === "done" && <span className="ml-auto text-[10px] text-yellow-400">+{localStorage.getItem("kukirin_unlock_dynoking") === "true" ? 30 : 15} REP earned</span>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Vehicle Selector */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Select Vehicle</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
            {VEHICLES.map(v => {
              const s = calcBuildStats(v, getBuild(v.id));
              const best = bestDyno[v.id];
              return (
                <button key={v.id} onClick={() => { setSelectedVehicleId(v.id); setPhase("idle"); setDynoData([]); }}
                  className={`rounded-lg border p-2.5 text-left transition-all ${selectedVehicleId === v.id ? "border-accent/60 bg-accent/5" : "border-border bg-card hover:border-accent/20"}`}>
                  <div className="text-[10px] font-bold text-foreground truncate">{v.name}</div>
                  <div className="text-[9px] text-muted-foreground">{s.topSpeed.toFixed(0)} km/h</div>
                  {best && <div className="text-[9px] text-accent mt-0.5">Best: {best.power}W</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats preview */}
        <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <StatBox label="Est. Power" value={`${stats.watts}W`} />
          <StatBox label="Voltage" value={`${stats.voltage}V`} />
          <StatBox label="Phase A" value={`${stats.maxAmps}A`} />
          <StatBox label="Top Speed" value={`${stats.topSpeed.toFixed(0)} km/h`} accent />
        </div>

        {/* Chart */}
        {dynoData.length > 1 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Power Curve (W)</span>
              {phase === "running" && (
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] text-accent">RUNNING {progress}%</span>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dynoData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="rpm" tick={{ fill: "#6b7280", fontSize: 9 }} tickFormatter={v => `${v}`} label={{ value: "RPM", position: "insideBottom", offset: -2, fill: "#6b7280", fontSize: 9 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #374151", borderRadius: 6, fontSize: 10 }} labelFormatter={v => `${v} RPM`} />
                <Line type="monotone" dataKey="power" stroke="hsl(25,95%,55%)" strokeWidth={2} dot={false} name="Power (W)" />
                <Line type="monotone" dataKey="speed" stroke="hsl(185,80%,45%)" strokeWidth={1.5} dot={false} name="Speed (km/h)" strokeDasharray="4 2" />
                {thermalLimit && <ReferenceLine x={thermalLimit} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "THERMAL", fill: "#ef4444", fontSize: 8 }} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Results */}
        {phase === "done" && (
          <div className="rounded-lg border border-accent/30 bg-card p-5 space-y-3">
            <div className="text-[10px] text-accent uppercase tracking-widest font-bold mb-1">Dyno Results — {vehicle.name}</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-primary tabular-nums">{peakPower}</div>
                <div className="text-[9px] text-muted-foreground uppercase">Peak Watts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent tabular-nums">{peakTorque}</div>
                <div className="text-[9px] text-muted-foreground uppercase">Peak Nm</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground tabular-nums">{topSpeed}</div>
                <div className="text-[9px] text-muted-foreground uppercase">Top km/h</div>
              </div>
            </div>
            {thermalLimit && (
              <div className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-[10px] text-red-400">
                ⚠ Thermal derating kicked in at {thermalLimit} RPM — install cooling mods in Build Shop for better dyno numbers.
              </div>
            )}
            {hasBuild && (
              <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-[10px] text-green-400">
                ✓ Custom build applied — parts mods are reflected in this dyno run.
              </div>
            )}
            {bestDyno[selectedVehicleId]?.power === peakPower && (
              <div className="text-[10px] text-yellow-400 font-bold text-center">🏆 NEW PERSONAL BEST!</div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="font-mono text-[10px] text-muted-foreground">Share your dyno run</span>
              <ShareCard
                title="🔥 Dyno Run Complete"
                vehicleName={vehicle.name}
                stats={[
                  { label: "Peak W", value: String(peakPower) },
                  { label: "Torque", value: `${peakTorque}Nm` },
                  { label: "Top km/h", value: topSpeed },
                ]}
                badge={bestDyno[selectedVehicleId]?.power === peakPower ? "New Personal Best" : null}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        {phase !== "running" && (
          <button
            onClick={runDyno}
            className="w-full rounded-md bg-gradient-to-r from-accent to-cyan-400 py-3 text-sm font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-accent/20"
          >
            {phase === "done" ? "[ RUN AGAIN ]" : "[ ENGAGE DYNO ]"}
          </button>
        )}

        {phase === "idle" && (
          <p className="text-center text-[10px] text-muted-foreground">
            Simulates a full RPM sweep from idle to redline. Earns +{localStorage.getItem("kukirin_unlock_dynoking") === "true" ? 30 : 15} REP per run.
          </p>
        )}
      </main>
    </div>
  );
}

function StatBox({ label, value, accent }) {
  return (
    <div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-bold mt-0.5 ${accent ? "text-accent" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
