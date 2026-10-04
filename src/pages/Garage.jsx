import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, CheckCircle, DollarSign, ArrowLeft, Zap, Cog, Battery, Activity, Settings, Cpu, Disc, AlertTriangle } from "lucide-react";
import RepairGame from "@/components/RepairGame";

const REPAIR_INFO = {
  motor:       { cost: 50,  label: "Hub Motor",         icon: Cog,      color: "text-primary" },
  controller:  { cost: 80,  label: "VESC Controller",   icon: Cpu,      color: "text-accent" },
  battery:     { cost: 100, label: "Battery Pack",      icon: Battery,  color: "text-green-400" },
  wheel:       { cost: 30,  label: "Wheel / Tire",       icon: Disc,     color: "text-purple-400" },
  damper:      { cost: 40,  label: "Steering Damper",    icon: Activity, color: "text-yellow-400" },
  chassis:     { cost: 60,  label: "Frame Component",    icon: Settings,  color: "text-orange-400" },
  electronics: { cost: 35,  label: "Electronics",        icon: Zap,       color: "text-cyan-400" },
};

function getRespect() { try { return parseInt(localStorage.getItem("kukirin_respect") || "0"); } catch { return 0; } }
function addRespect(n) { localStorage.setItem("kukirin_respect", String(getRespect() + n)); }
function getBrokenParts() { try { return JSON.parse(localStorage.getItem("kukirin_broken_parts") || "[]"); } catch { return []; } }
function saveBrokenParts(list) { localStorage.setItem("kukirin_broken_parts", JSON.stringify(list)); }

export default function Garage() {
  const navigate = useNavigate();
  const [brokenParts, setBrokenParts] = useState(getBrokenParts);
  const [respect, setRespect] = useState(getRespect);
  const [activeRepair, setActiveRepair] = useState(null);

  const startRepair = (index) => {
    const part = brokenParts[index];
    const info = REPAIR_INFO[part.part] || REPAIR_INFO.electronics;
    if (respect < info.cost) return;
    setActiveRepair({ part, index, cost: info.cost });
  };

  const completeRepair = (bonus = 0) => {
    if (!activeRepair) return;
    addRespect(-activeRepair.cost + bonus);
    const updated = [...brokenParts];
    updated.splice(activeRepair.index, 1);
    saveBrokenParts(updated);
    setBrokenParts(updated);
    setRespect(getRespect());
    setActiveRepair(null);
  };

  return (
    <div className="app-surface min-h-screen bg-gradient-to-b from-background via-background to-card/20 font-sans">
      <header className="app-header border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 via-primary to-yellow-500" />
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/", { replace: true })} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider">Back</span>
          </button>
          <div className="h-4 w-px bg-border" />
          <Wrench className="h-4 w-4 text-yellow-400" />
          <span className="font-mono text-xs font-bold text-foreground">Repair Garage</span>
          <div className="ml-auto flex items-center gap-2 rounded-md border border-border/50 bg-card px-2.5 py-1.5">
            <DollarSign className="h-3.5 w-3.5 text-yellow-400" />
            <span className="font-mono text-[10px] font-bold text-yellow-400">{respect} REP</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <div className="text-xl font-bold text-red-400 font-mono">{brokenParts.length}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Broken Parts</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <div className={`text-xl font-bold font-mono ${brokenParts.length === 0 ? "text-green-400" : "text-yellow-400"}`}>{brokenParts.length === 0 ? "✓" : "!"}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Fleet Status</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <div className="text-xl font-bold text-yellow-400 font-mono">{respect}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">REP Balance</div>
          </div>
        </div>

        {brokenParts.length === 0 ? (
          <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-8 text-center">
            <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-2" />
            <div className="font-mono text-sm font-bold text-green-400 uppercase tracking-wider">All Systems Nominal</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-1">No broken parts. Go ride and push your build to the limit — breakages show up here for full disassembly repair.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {brokenParts.map((part, i) => {
              const info = REPAIR_INFO[part.part] || REPAIR_INFO.electronics;
              const canAfford = respect >= info.cost;
              const Icon = info.icon;
              return (
                <div key={i} className="rounded-lg border border-border bg-card p-4 transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg border border-border flex items-center justify-center flex-shrink-0 ${info.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-foreground">{info.label}</span>
                        <span className="font-mono text-[9px] text-muted-foreground border border-border rounded px-1.5 py-0.5">{part.vehicleName}</span>
                      </div>
                      <div className="font-mono text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {part.code}
                      </div>
                      <div className="font-mono text-[9px] text-muted-foreground mt-1">Full disassembly · replace · reassemble</div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => startRepair(i)}
                        disabled={!canAfford}
                        className={`rounded-md border px-3 py-1.5 font-mono text-[10px] transition-all flex items-center gap-1 ${canAfford ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20" : "border-border text-muted-foreground cursor-not-allowed"}`}
                      >
                        <Wrench className="h-3 w-3" /> {canAfford ? `Repair (${info.cost} REP)` : "Need REP"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {activeRepair && (
        <RepairGame
          brokenPart={activeRepair.part}
          vehicleName={activeRepair.part.vehicleName}
          repairCost={activeRepair.cost}
          onComplete={completeRepair}
          onCancel={() => setActiveRepair(null)}
        />
      )}
    </div>
  );
}
