import { useState, useEffect } from "react";
import { Plus, CheckCircle, AlertTriangle, Trash2, DollarSign, Clock, Car } from "lucide-react";

// Intervals are in MINUTES (not days) so things age realistically fast in-app
// Display label still shows "days" for immersion but 1 real minute = 1 in-app day
const MAINTENANCE_TASKS = [
  { id: "tire_check",     label: "Tyre Pressure Check",     intervalMins: 2,   cost: 0,   category: "safety",       intervalLabel: "2 days" },
  { id: "brake_fluid",    label: "Brake Fluid Top-Up",       intervalMins: 5,   cost: 8,   category: "brakes",       intervalLabel: "5 days" },
  { id: "brake_pads",     label: "Brake Pad Inspection",     intervalMins: 7,   cost: 0,   category: "brakes",       intervalLabel: "7 days" },
  { id: "motor_check",    label: "Hub Motor Bolt Torque",    intervalMins: 3,   cost: 0,   category: "motor",        intervalLabel: "3 days" },
  { id: "deck_bolts",     label: "Deck & Stem Bolt Check",   intervalMins: 3,   cost: 0,   category: "chassis",      intervalLabel: "3 days" },
  { id: "statorade",      label: "Statorade Re-inject",      intervalMins: 15,  cost: 25,  category: "motor",        intervalLabel: "15 days" },
  { id: "battery_health", label: "Battery Cell Balance",     intervalMins: 10,  cost: 0,   category: "battery",      intervalLabel: "10 days" },
  { id: "vesc_firmware",  label: "VESC Firmware Update",     intervalMins: 20,  cost: 0,   category: "electronics",  intervalLabel: "20 days" },
  { id: "bearing_grease", label: "Wheel Bearing Grease",     intervalMins: 8,   cost: 5,   category: "wheels",       intervalLabel: "8 days" },
  { id: "fold_latch",     label: "Fold Latch Inspection",    intervalMins: 4,   cost: 0,   category: "chassis",      intervalLabel: "4 days" },
  { id: "phase_wires",    label: "Phase Wire Inspection",    intervalMins: 6,   cost: 0,   category: "motor",        intervalLabel: "6 days" },
  { id: "hall_sensors",   label: "Hall Sensor Connector Check",intervalMins: 9, cost: 0,   category: "electronics",  intervalLabel: "9 days" },
  { id: "brake_bleed",    label: "Hydraulic Brake Bleed",    intervalMins: 12,  cost: 12,  category: "brakes",       intervalLabel: "12 days" },
  { id: "axle_torque",    label: "Axle Nut & Torque Arm",    intervalMins: 4,   cost: 0,   category: "chassis",      intervalLabel: "4 days" },
  { id: "water_seals",    label: "Water Seal / IP Check",    intervalMins: 7,   cost: 5,   category: "safety",       intervalLabel: "7 days" },
];

const CAT_COLORS = {
  safety:      "text-red-400 border-red-500/30 bg-red-500/5",
  brakes:      "text-orange-400 border-orange-500/30 bg-orange-500/5",
  motor:       "text-primary border-primary/30 bg-primary/5",
  chassis:     "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
  battery:     "text-green-400 border-green-500/30 bg-green-500/5",
  electronics: "text-accent border-accent/30 bg-accent/5",
  wheels:      "text-purple-400 border-purple-500/30 bg-purple-500/5",
};

function getLog() {
  try { return JSON.parse(localStorage.getItem("kukirin_maintenance") || "{}"); } catch { return {}; }
}
function saveLog(log) { localStorage.setItem("kukirin_maintenance", JSON.stringify(log)); }

export default function Maintenance() {
  const [log, setLog] = useState(getLog);
  const [customTask, setCustomTask] = useState("");
  const [customCost, setCustomCost] = useState("");
  const [customTasks, setCustomTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kukirin_custom_maintenance") || "[]"); } catch { return []; }
  });

  const [garageVisit, setGarageVisit] = useState(null); // task being serviced
  const [garageVisiting, setGarageVisiting] = useState(false); // simulating garage trip

  const [, setTick] = useState(0);
  // Refresh every 30s so overdue status updates live
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const allTasks = [...MAINTENANCE_TASKS, ...customTasks];

  // Garage visit flow — simulates driving to garage and getting serviced
  const startGarageVisit = (task) => {
    setGarageVisit(task);
  };

  const confirmGarageVisit = () => {
    if (!garageVisit) return;
    setGarageVisiting(true);
    setTimeout(() => {
      const updated = { ...log, [garageVisit.id]: { date: new Date().toISOString(), cost: garageVisit.cost || 0 } };
      setLog(updated);
      saveLog(updated);
      setGarageVisiting(false);
      setGarageVisit(null);
    }, 2000); // 2s "driving to garage" delay
  };

  const markDone = (id, cost) => {
    const updated = { ...log, [id]: { date: new Date().toISOString(), cost: cost || 0 } };
    setLog(updated);
    saveLog(updated);
  };

  const clearTask = (id) => {
    const updated = { ...log };
    delete updated[id];
    setLog(updated);
    saveLog(updated);
  };

  const addCustomTask = () => {
    if (!customTask.trim()) return;
    const task = {
      id: `custom_${Date.now()}`,
      label: customTask.trim(),
      interval: 30,
      cost: parseFloat(customCost) || 0,
      category: "chassis",
      custom: true,
    };
    const updated = [...customTasks, task];
    setCustomTasks(updated);
    localStorage.setItem("kukirin_custom_maintenance", JSON.stringify(updated));
    setCustomTask("");
    setCustomCost("");
  };

  const deleteCustomTask = (id) => {
    const updated = customTasks.filter(t => t.id !== id);
    setCustomTasks(updated);
    localStorage.setItem("kukirin_custom_maintenance", JSON.stringify(updated));
  };

  const totalSpent = Object.values(log).reduce((sum, e) => sum + (e.cost || 0), 0);

  // 1 real minute = 1 in-app "day" for fast progression
  const getMinsAgo = (isoDate) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    return Math.floor(diff / 60000);
  };

  const isOverdue = (task) => {
    const entry = log[task.id];
    if (!entry) return true;
    return getMinsAgo(entry.date) >= task.intervalMins;
  };

  const overdueCount = allTasks.filter(isOverdue).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-xl font-bold text-red-400 font-mono">{overdueCount}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Overdue</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-xl font-bold text-green-400 font-mono">{allTasks.length - overdueCount}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Up to Date</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-xl font-bold text-primary font-mono">${totalSpent.toFixed(0)}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Spent</div>
        </div>
      </div>

      {/* All clear banner */}
      {overdueCount === 0 && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-center">
          <CheckCircle className="h-5 w-5 text-green-400 mx-auto mb-1" />
          <div className="font-mono text-xs font-bold text-green-400 uppercase tracking-wider">All Systems Nominal</div>
          <div className="font-mono text-[10px] text-muted-foreground mt-0.5">No service required — your scooter is in top condition.</div>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {allTasks.map((task) => {
          const entry = log[task.id];
          const done = !!entry && getMinsAgo(entry.date) < task.intervalMins;
          const overdue = isOverdue(task);
          const catStyle = CAT_COLORS[task.category] || "text-muted-foreground border-border bg-card";
          return (
            <div key={task.id} className={`rounded-lg border p-3 flex items-center justify-between gap-3 transition-all ${done ? "border-green-500/30 bg-green-500/5 opacity-80" : overdue ? "border-red-500/30 bg-red-500/5" : "border-border bg-card"}`}>
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {done
                  ? <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${overdue ? "text-red-400" : "text-yellow-400"}`} />
                }
                <div className="min-w-0">
                  <div className="font-mono text-xs font-semibold text-foreground flex items-center gap-2 flex-wrap">
                    {task.label}
                    <span className={`text-[9px] rounded px-1.5 py-0.5 border font-mono ${catStyle}`}>{task.category}</span>
                    {task.custom && <span className="text-[9px] text-accent border border-accent/30 bg-accent/5 rounded px-1.5 py-0.5">CUSTOM</span>}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Every {task.intervalLabel || `${task.intervalMins}d`}</span>
                    {task.cost > 0 && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${task.cost}</span>}
                    {entry && <span className="text-green-400">{getMinsAgo(entry.date)}d ago</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!done && (
                  <button
                    onClick={() => startGarageVisit(task)}
                    className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary hover:bg-primary/20 transition-all flex items-center gap-1"
                  >
                    <Car className="h-3 w-3" /> Garage
                  </button>
                )}
                {done && (
                  <button
                    onClick={() => clearTask(task.id)}
                    className="rounded-md border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground hover:border-red-500/30 hover:text-red-400 transition-all"
                  >
                    Reset
                  </button>
                )}
                {task.custom && (
                  <button onClick={() => deleteCustomTask(task.id)} className="text-red-400/50 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Garage visit modal */}
      {garageVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-xl border border-primary/40 bg-card w-full max-w-sm mx-4 p-6 space-y-4 shadow-2xl">
            {garageVisiting ? (
              <div className="text-center space-y-3 py-4">
                <div className="text-4xl animate-bounce">🔧</div>
                <div className="font-mono text-sm text-primary animate-pulse uppercase tracking-wider">Visiting Garage…</div>
                <div className="font-mono text-[10px] text-muted-foreground">Servicing: {garageVisit.label}</div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  <h3 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider">Garage Visit Required</h3>
                </div>
                <div className="rounded-lg border border-border bg-background p-3 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Task</span>
                    <span className="text-foreground font-semibold">{garageVisit.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="text-foreground">{garageVisit.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Labour + Parts</span>
                    <span className={garageVisit.cost > 0 ? "text-primary font-bold" : "text-green-400"}>{garageVisit.cost > 0 ? `$${garageVisit.cost}` : "Free (DIY)"}</span>
                  </div>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">You need to physically take your scooter to the garage. This takes time and costs money.</p>
                <div className="flex gap-2">
                  <button
                    onClick={confirmGarageVisit}
                    className="flex-1 rounded-md bg-primary/10 border border-primary/40 py-2 font-mono text-xs text-primary font-bold hover:bg-primary/20 transition-all"
                  >
                    🔧 Drive to Garage
                  </button>
                  <button
                    onClick={() => setGarageVisit(null)}
                    className="flex-1 rounded-md border border-border py-2 font-mono text-xs text-muted-foreground hover:border-primary/30 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add custom task */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Add Custom Task</p>
        <div className="flex gap-2">
          <input
            value={customTask}
            onChange={e => setCustomTask(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustomTask()}
            placeholder="Task name..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <input
            value={customCost}
            onChange={e => setCustomCost(e.target.value)}
            placeholder="$cost"
            className="w-20 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={addCustomTask}
            className="rounded-md bg-primary/10 border border-primary/40 px-3 py-2 font-mono text-xs text-primary hover:bg-primary/20 transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
