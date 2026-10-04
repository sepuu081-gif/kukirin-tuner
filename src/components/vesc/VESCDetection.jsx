import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../lib/i18n";
import { Search, AlertTriangle, CheckCircle, Loader2, Cog } from "lucide-react";

const STEPS = [
  { name: "Resistance (R)", desc: "Measuring phase-to-phase resistance", duration: 1800 },
  { name: "Inductance (L)", desc: "Measuring phase inductance", duration: 1800 },
  { name: "Flux Linkage (λ)", desc: "Measuring back-EMF flux linkage", duration: 2500 },
  { name: "Hall Sensor Detection", desc: "Detecting hall sensor offsets", duration: 2000 },
  { name: "Calculating KV & ERPM", desc: "Computing motor constants", duration: 1200 },
];

export default function VESCDetection({ profile, onApply }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState(0);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const timers = useRef([]);
  const [applied, setApplied] = useState(false);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const runDetection = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setApplied(false);
    setPhase(1);
    setResults(null);
    setProgress(0);
    let elapsed = 0;
    STEPS.forEach((step, i) => {
      elapsed += step.duration;
      const t = setTimeout(() => {
        setProgress(Math.round(((i + 1) / STEPS.length) * 100));
        if (i === STEPS.length - 1) {
          setResults(profile);
          setPhase(STEPS.length + 1);
        } else {
          setPhase(p => p + 1);
        }
      }, elapsed);
      timers.current.push(t);
    });
  };

  const reset = () => { timers.current.forEach(clearTimeout); timers.current = []; setPhase(0); setResults(null); setProgress(0); setApplied(false); };

  return (
    <div className="p-3 space-y-4 bg-[#0a1424]">
      <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 text-[10px] text-yellow-400 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold mb-0.5">{t("Game motor simulation")}</div>
          <div>{t("Uses the installed motor profile. These are simulated values, not real hardware measurements.")}</div>
        </div>
      </div>

      {phase === 0 && (
        <div className="space-y-3">
          <div className="rounded-xl bg-[#0d1b2e] p-4 text-center border border-blue-900/40">
            <Cog className="h-10 w-10 text-blue-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-white uppercase tracking-wider">Motor Detection</div>
            <div className="text-sm text-emerald-300 mt-2">{profile.name}</div>
            <div className="text-xs text-slate-400 mt-1">{profile.count} × {profile.watts} W · {profile.voltage} V</div>
          </div>
          <button onClick={runDetection} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
            <Search className="h-4 w-4" /> Measure Motor Parameters
          </button>
        </div>
      )}

      {phase >= 1 && phase <= STEPS.length && (
        <div className="space-y-3">
          <div className="rounded-xl bg-[#0d1b2e] p-3 border border-blue-900/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] text-blue-300/60 uppercase tracking-wider">Detection Progress</span>
              <span className="text-[10px] font-bold text-blue-400 tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#0a1424] overflow-hidden border border-blue-950/50">
              <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%`, boxShadow: "0 0 6px #3b82f680" }} />
            </div>
          </div>
          <div className="space-y-2">
            {STEPS.map((step, i) => (
              <div key={i} className={`rounded-lg p-3 flex items-center gap-2.5 border transition-colors ${
                phase > i + 1 ? "bg-green-500/10 border-green-500/30" :
                phase === i + 1 ? "bg-blue-500/10 border-blue-500/40" :
                "bg-[#0d1b2e] border-blue-900/40"
              }`}>
                {phase > i + 1 ? <CheckCircle className="h-4 w-4 text-green-400" /> :
                 phase === i + 1 ? <Loader2 className="h-4 w-4 text-blue-400 animate-spin" /> :
                 <div className="h-4 w-4 rounded-full border border-blue-800" />}
                <div className="flex-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    phase > i + 1 ? "text-green-400" : phase === i + 1 ? "text-blue-400" : "text-blue-300/40"
                  }`}>{step.name}</span>
                  {phase === i + 1 && <span className="text-[8px] text-blue-300/60">{step.desc}</span>}
                </div>
                {phase === i + 1 && <span className="text-[9px] text-blue-400 animate-pulse">Running...</span>}
              </div>
            ))}
          </div>
          <button onClick={reset} className="w-full min-h-11 rounded-xl border border-emerald-700">{t("Cancel")}</button>
        </div>
      )}

      {phase === STEPS.length + 1 && results && (
        <div className="space-y-3">
          <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-3 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-1" />
            <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Detection Complete</span>
          </div>
          <div className="rounded-xl bg-[#0d1b2e] p-4 space-y-2.5 border border-blue-900/40">
            <div className="text-[9px] text-blue-400/80 uppercase tracking-widest font-bold pb-1 border-b border-blue-900/40">Motor Constants</div>
            <ResultRow label="Resistance (R)" value={`${results.r} mΩ`} />
            <ResultRow label="Inductance (L)" value={`${results.l} µH`} />
            <ResultRow label="Flux Linkage (λ)" value={`${results.lambda} mWb`} />
            <ResultRow label="Motor KV" value={`${results.kv} RPM/V`} />
            <ResultRow label="Pole Count" value={`${results.poles} (${results.poles / 2} pairs)`} />
            <div className="text-[9px] text-blue-400/80 uppercase tracking-widest font-bold pt-2 pb-1 border-b border-blue-900/40">Hall Sensors</div>
            <ResultRow label="Hall Offset 1" value={`${results.hall1}°`} />
            <ResultRow label="Hall Offset 2" value={`${results.hall2}°`} />
            <ResultRow label="Hall Offset 3" value={`${results.hall3}°`} />
          </div>
          <button disabled={applied} onClick={() => { onApply(results); setApplied(true); }} className="w-full min-h-12 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-60">
            {t(applied ? "Motor profile saved" : "Apply detected parameters")}
          </button>
          <button onClick={reset} className="w-full rounded-xl bg-[#1a3a5f] hover:bg-[#234a7f] py-2.5 text-[10px] font-bold text-blue-200 uppercase tracking-wider border border-blue-700/40">
            Run Again
          </button>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-blue-300/60">{label}</span>
      <span className="text-sm font-bold text-white tabular-nums">{value}</span>
    </div>
  );
}
