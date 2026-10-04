import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, Wrench, AlertTriangle, Cog, Settings, Power, X, CheckCircle, ChevronRight, Loader2, Zap, Droplet, Star, Clock, Sparkles, Microscope, Disc, Activity } from "lucide-react";
import { FAILURE_CODES } from "../lib/vehicleData";
import { getRepairFlow } from "../lib/repairData";
import RepairScene from "./repair/RepairScene";

export default function RepairGame({ brokenPart, vehicleName, repairCost, onComplete, onCancel }) {
  const flow = getRepairFlow(brokenPart?.part);
  const failInfo = FAILURE_CODES.find(f => f.code === brokenPart?.code);
  const totalSteps = flow.steps.length;

  const [phase, setPhase] = useState(0); // 0 = scan, then 1..N steps
  const [stepProgress, setStepProgress] = useState(0); // clicks done within current step
  const [activeTool, setActiveTool] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [shake, setShake] = useState(false);
  const [sparks, setSparks] = useState([]);
  const [inspecting, setInspecting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const sparkId = useRef(0);

  // Phase 0 = diagnostic scan, phases 1..N = repair steps, phase N+1 = complete
  const currentStep = phase > 0 && phase <= totalSteps ? flow.steps[phase - 1] : null;
  const isComplete = testPassed;

  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [isComplete, startTime]);

  useEffect(() => {
    const step = phase > 0 && phase <= totalSteps ? flow.steps[phase - 1] : null;
    setActiveTool(step?.tool || null);
    setStepProgress(0);
  }, [phase]);

  useEffect(() => {
    if (!scanning) return;
    const t = setTimeout(() => { setScanning(false); setScanDone(true); }, 2500);
    return () => clearTimeout(t);
  }, [scanning]);

  const addSparks = useCallback((x, y) => {
    const newSparks = Array.from({ length: 5 }, () => ({ id: sparkId.current++, x, y, sx: (Math.random() - 0.5) * 60, sy: (Math.random() - 0.5) * 60 }));
    setSparks(prev => [...prev, ...newSparks]);
    setTimeout(() => setSparks(prev => prev.filter(s => !newSparks.find(ns => ns.id === s.id))), 500);
  }, []);

  const handleTargetClick = (targetId, x, y) => {
    if (!currentStep) return;
    if (currentStep.target !== targetId) return;
    if (currentStep.tool !== activeTool) {
      setMistakes(m => m + 1);
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }
    addSparks(x, y);
    const next = stepProgress + 1;
    if (next >= currentStep.count) {
      setStepProgress(0);
      if (phase < totalSteps) {
        setPhase(p => p + 1);
      } else {
        // Last step done — run test
        setTesting(true);
        setTimeout(() => { setTesting(false); setTestPassed(true); }, 2500);
      }
    } else {
      setStepProgress(next);
    }
  };

  const runScan = () => { setScanning(true); };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
  const bonusRep = stars === 3 ? Math.floor(repairCost * 0.5) : stars === 2 ? Math.floor(repairCost * 0.25) : 0;

  const tools = useMemo(() => currentStep ? getToolsForStep(currentStep.tool) : [], [phase]);

  const stepLabels = ["Scan", ...flow.steps.map(s => s.label.split(" ")[0]), "Done"];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>

      {/* Header */}
      <div className="relative border-b border-zinc-800/50 bg-zinc-950/60 backdrop-blur-md px-4 py-3 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="text-zinc-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
          <Wrench className={`h-4 w-4 ${flow.color}`} />
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">{flow.label}</span>
          <span className="font-mono text-[10px] text-zinc-500 hidden sm:inline">{vehicleName}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400"><Clock className="h-3.5 w-3.5" /> {fmtTime(elapsed)}</div>
          <div className={`flex items-center gap-1.5 font-mono text-[10px] font-bold ${mistakes > 0 ? "text-red-400" : "text-green-400"}`}><AlertTriangle className="h-3.5 w-3.5" /> {mistakes}</div>
          <div className="font-mono text-[10px] text-yellow-400 font-bold">{repairCost} REP</div>
        </div>
      </div>

      {/* Step progress bar */}
      <div className="relative px-3 py-2.5 bg-zinc-950/30 border-b border-zinc-800/50 flex-shrink-0 z-10 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max mx-auto" style={{ maxWidth: "100%" }}>
          {flow.steps.map((s, i) => {
            const stepNum = i + 1;
            const done = phase > stepNum;
            const active = phase === stepNum;
            return (
              <div key={i} className="flex items-center flex-shrink-0">
                <div className={`h-2 w-2 rounded-full transition-all ${done ? "bg-green-500" : active ? "bg-primary animate-pulse" : "bg-zinc-700"}`} />
                {i < flow.steps.length - 1 && <div className={`h-0.5 w-4 ${done ? "bg-green-500/40" : "bg-zinc-800"}`} />}
              </div>
            );
          })}
        </div>
        <div className="text-center mt-1.5 font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
          {phase === 0 ? "Diagnostic" : isComplete ? "Complete" : `Step ${phase}/${totalSteps}: ${currentStep?.label || ""}`}
        </div>
      </div>

      {/* Main content */}
      <div className={`relative flex-1 overflow-y-auto flex flex-col items-center p-4 sm:p-6 ${shake ? "animate-shake" : ""}`}>
        <div className="w-full max-w-lg">
          {/* Diagnostic phase */}
          {phase === 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 mb-3">
                  <Search className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">Diagnose</span>
                </div>
                <p className="font-mono text-xs text-zinc-300">{scanDone ? "Fault identified. Inspect or begin repair." : "Run a diagnostic scan to identify the fault."}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <RepairScene scene={flow.scene} phase={0} scanning={scanning} scanDone={scanDone} brokenPart={brokenPart} onTargetClick={() => {}} />
              </div>
              <div className="flex flex-col gap-2">
                {!scanDone && (
                  <button onClick={runScan} disabled={scanning} className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 py-3 font-mono text-sm font-bold text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                    {scanning ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</> : <><Search className="h-4 w-4" /> Run Diagnostic Scan</>}
                  </button>
                )}
                {scanDone && (
                  <div className="flex gap-2">
                    {failInfo && (
                      <button onClick={() => setInspecting(true)} className="flex-1 rounded-lg bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 py-3 font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                        <Microscope className="h-4 w-4" /> Inspect
                      </button>
                    )}
                    <button onClick={() => setPhase(1)} className="flex-1 rounded-lg bg-yellow-600 hover:bg-yellow-500 py-3 font-mono text-sm font-bold text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                      Begin Repair <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Repair steps */}
          {phase > 0 && !isComplete && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-2 ${flow.color.replace("text-", "border-").replace("-400", "-500/40")} bg-zinc-900/50`}>
                  <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${flow.color}`}>{currentStep?.label}</span>
                </div>
                <p className="font-mono text-xs text-zinc-400">{currentStep?.hint}</p>
                {currentStep?.count > 1 && (
                  <div className="mt-2 flex items-center justify-center gap-1">
                    {Array.from({ length: currentStep.count }).map((_, i) => (
                      <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i < stepProgress ? "bg-primary" : "bg-zinc-700"}`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Scene */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:p-4">
                <RepairScene
                  scene={flow.scene}
                  phase={phase}
                  stepProgress={stepProgress}
                  scanning={false}
                  scanDone={true}
                  brokenPart={brokenPart}
                  currentTarget={currentStep?.target}
                  testing={testing}
                  testPassed={testPassed}
                  sparks={sparks}
                  onTargetClick={handleTargetClick}
                />
              </div>

              {/* Test button — for the final test step */}
              {currentStep?.target === "test" && !testing && !testPassed && (
                <button onClick={() => handleTargetClick("test", 160, 120)} className="w-full rounded-lg bg-primary/20 border border-primary/40 py-3 font-mono text-sm font-bold text-primary uppercase tracking-wider hover:bg-primary/30 transition-all flex items-center justify-center gap-2">
                  <Power className="h-4 w-4" /> Run Test
                </button>
              )}

              {/* Tool bar */}
              {currentStep && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider mr-1">Tool:</span>
                  {tools.map(t => {
                    const isRequired = t.id === currentStep.tool;
                    const isActive = activeTool === t.id;
                    return (
                      <button key={t.id} onClick={() => setActiveTool(t.id)}
                        className={`relative flex flex-col items-center gap-0.5 rounded-lg border px-2.5 py-1.5 transition-all ${
                          isActive ? "border-primary bg-primary/20" : isRequired ? "border-yellow-500/60 bg-yellow-500/10 animate-pulse" : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                        }`}>
                        <t.icon className={`h-4 w-4 ${isActive ? "text-primary" : isRequired ? "text-yellow-400" : "text-zinc-500"}`} />
                        <span className={`font-mono text-[8px] uppercase ${isActive ? "text-primary" : isRequired ? "text-yellow-400" : "text-zinc-600"}`}>{t.label}</span>
                        {isRequired && !isActive && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-yellow-400 animate-ping" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Complete */}
          {isComplete && (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3].map(s => (
                    <Star key={s} className={`h-7 w-7 ${s <= stars ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"}`} />
                  ))}
                </div>
                <div className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  {stars === 3 ? "PERFECT REPAIR" : stars === 2 ? "GOOD REPAIR" : "REPAIR COMPLETE"}
                </div>
                <div className="flex items-center justify-center gap-4 mt-3 font-mono text-[10px] text-zinc-400">
                  <span><Clock className="h-3 w-3 inline mr-1" />{fmtTime(elapsed)}</span>
                  <span><AlertTriangle className="h-3 w-3 inline mr-1" />{mistakes} mistakes</span>
                  {bonusRep > 0 && <span className="text-yellow-400"><Sparkles className="h-3 w-3 inline mr-1" />+{bonusRep} REP bonus</span>}
                </div>
              </div>
              <button onClick={() => onComplete(bonusRep)} className="w-full rounded-lg bg-green-600 hover:bg-green-500 py-3 font-mono text-sm font-bold text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" /> Complete Repair
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inspection modal */}
      {inspecting && failInfo && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={() => setInspecting(false)}>
          <div className="rounded-xl border border-red-500/40 bg-zinc-900 p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Microscope className="h-5 w-5 text-cyan-400" />
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">Component Inspection</h3>
            </div>
            <div className="space-y-2.5 font-mono text-[10px]">
              <div className="flex items-center justify-between rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
                <span className="text-zinc-500">Fault Code</span>
                <span className="text-red-400 font-bold">{failInfo.code}</span>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3 space-y-1.5">
                <div><span className="text-zinc-500">Component: </span><span className="text-foreground">{brokenPart?.part}</span></div>
                <div><span className="text-zinc-500">Cause: </span><span className="text-yellow-400">{failInfo.cause}</span></div>
                <div><span className="text-zinc-500">Effect: </span><span className="text-red-400">{failInfo.effect}</span></div>
                <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-700">
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                  <span className="text-red-400 font-bold uppercase">Severity: {failInfo.severity}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setInspecting(false)} className="w-full mt-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 py-2.5 font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function getToolsForStep(requiredTool) {
  const all = [
    { id: "wrench",  label: "Wrench",     icon: Wrench },
    { id: "allen",   label: "Allen",      icon: Settings },
    { id: "pliers",  label: "Pliers",     icon: Zap },
    { id: "driver",  label: "Driver",     icon: Cog },
    { id: "drill",   label: "Drill",      icon: Cog },
    { id: "levers",  label: "Levers",     icon: Disc },
    { id: "welder",  label: "Welder",     icon: Zap },
    { id: "grinder", label: "Grinder",    icon: Disc },
    { id: "brush",   label: "Brush",      icon: Activity },
    { id: "hands",   label: "Hands",      icon: Power },
    { id: "paste",   label: "Paste",      icon: Droplet },
  ];
  // Show the required tool + 2 random distractors
  const required = all.find(t => t.id === requiredTool);
  const distractors = all.filter(t => t.id !== requiredTool).sort(() => Math.random() - 0.5).slice(0, 2);
  return [required, ...distractors].sort(() => Math.random() - 0.5);
}
