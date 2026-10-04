import { useState } from "react";
import { Plus, Trash2, Cpu, Battery, Zap } from "lucide-react";

const CUSTOM_KEY = "kukirin_custom_parts";

export function getCustomParts() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]"); } catch { return []; }
}
function saveCustomParts(parts) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(parts));
}

const TABS = [
  { id: "motor",      label: "Motor",      icon: Zap },
  { id: "controller", label: "Controller", icon: Cpu },
  { id: "battery",    label: "Battery",    icon: Battery },
];

export default function CustomPartBuilder({ onEquip }) {
  const [activeType, setActiveType] = useState("motor");
  const [parts, setParts]           = useState(getCustomParts);
  const [form, setForm]             = useState({});
  const [saved, setSaved]           = useState(false);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buildPart = () => {
    const f = form;
    if (activeType === "motor") {
      return {
        id:        `custom_motor_${Date.now()}`,
        name:      f.name || "Custom Motor",
        category:  "motor",
        watts:     parseInt(f.watts) || 1000,
        voltage:   parseInt(f.voltage) || 48,
        sizeClass: parseInt(f.sizeClass) || 3,
        weight:    parseFloat(f.weight) || 5,
        price:     0,
        desc:      f.desc || "Custom-wound motor.",
        custom:    true,
      };
    }
    if (activeType === "controller") {
      return {
        id:        `custom_ctrl_${Date.now()}`,
        name:      f.name || "Custom VESC",
        category:  "controller",
        maxAmps:   parseInt(f.maxAmps) || 80,
        voltage:   parseInt(f.voltage) || 60,
        sizeClass: parseInt(f.sizeClass) || 2,
        weight:    parseFloat(f.weight) || 1.2,
        price:     0,
        desc:      f.desc || "Custom controller.",
        custom:    true,
      };
    }
    if (activeType === "battery") {
      return {
        id:        `custom_batt_${Date.now()}`,
        name:      f.name || "Custom Pack",
        category:  "battery",
        voltage:   parseInt(f.voltage) || 52,
        capacity:  parseInt(f.capacity) || 20,
        sizeClass: parseInt(f.sizeClass) || 3,
        weight:    parseFloat(f.weight) || 7,
        price:     0,
        desc:      f.desc || "Custom battery pack.",
        custom:    true,
      };
    }
  };

  const save = () => {
    const part = buildPart();
    const next = [...parts, part];
    setParts(next);
    saveCustomParts(next);
    setForm({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const remove = (id) => {
    const next = parts.filter(p => p.id !== id);
    setParts(next);
    saveCustomParts(next);
  };

  const myParts = parts.filter(p => p.category === activeType);

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveType(id); setForm({}); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 font-mono text-[10px] uppercase tracking-wider transition-all ${
              activeType === id ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Build Custom {activeType}</p>

        <Field label="Name" value={form.name || ""} onChange={v => setField("name", v)} placeholder={`My ${activeType}`} />

        {activeType === "motor" && <>
          <Row>
            <Field label="Watts" value={form.watts || ""} onChange={v => setField("watts", v)} placeholder="1000" type="number" />
            <Field label="Voltage (V)" value={form.voltage || ""} onChange={v => setField("voltage", v)} placeholder="48" type="number" />
          </Row>
          <Row>
            <Field label="Size Class (1-6)" value={form.sizeClass || ""} onChange={v => setField("sizeClass", v)} placeholder="3" type="number" />
            <Field label="Weight (kg)" value={form.weight || ""} onChange={v => setField("weight", v)} placeholder="5" type="number" />
          </Row>
        </>}

        {activeType === "controller" && <>
          <Row>
            <Field label="Max Amps" value={form.maxAmps || ""} onChange={v => setField("maxAmps", v)} placeholder="80" type="number" />
            <Field label="Voltage (V)" value={form.voltage || ""} onChange={v => setField("voltage", v)} placeholder="60" type="number" />
          </Row>
          <Row>
            <Field label="Size Class (1-6)" value={form.sizeClass || ""} onChange={v => setField("sizeClass", v)} placeholder="2" type="number" />
            <Field label="Weight (kg)" value={form.weight || ""} onChange={v => setField("weight", v)} placeholder="1.2" type="number" />
          </Row>
        </>}

        {activeType === "battery" && <>
          <Row>
            <Field label="Voltage (V)" value={form.voltage || ""} onChange={v => setField("voltage", v)} placeholder="52" type="number" />
            <Field label="Capacity (Ah)" value={form.capacity || ""} onChange={v => setField("capacity", v)} placeholder="20" type="number" />
          </Row>
          <Row>
            <Field label="Size Class (1-6)" value={form.sizeClass || ""} onChange={v => setField("sizeClass", v)} placeholder="3" type="number" />
            <Field label="Weight (kg)" value={form.weight || ""} onChange={v => setField("weight", v)} placeholder="7" type="number" />
          </Row>
        </>}

        <Field label="Description" value={form.desc || ""} onChange={v => setField("desc", v)} placeholder="Describe your build..." />

        <button
          onClick={save}
          className={`w-full rounded-md py-2.5 font-mono text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            saved
              ? "bg-green-500/20 border border-green-500/40 text-green-400"
              : "bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          {saved ? "Saved!" : `Add Custom ${activeType}`}
        </button>
      </div>

      {/* Saved custom parts of this type */}
      {myParts.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Your Custom {activeType}s</p>
          {myParts.map(p => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-3 flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs font-bold text-foreground">{p.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{p.desc}</div>
                <div className="flex gap-3 mt-1 font-mono text-[10px] text-muted-foreground/70">
                  {p.watts && <span>{p.watts}W</span>}
                  {p.maxAmps && <span>{p.maxAmps}A</span>}
                  {p.voltage && <span>{p.voltage}V</span>}
                  {p.capacity && <span>{p.capacity}Ah</span>}
                  <span>SIZE {p.sizeClass}</span>
                  <span>{p.weight}kg</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onEquip(p)}
                  className="rounded-md bg-primary/10 border border-primary/30 px-2.5 py-1 font-mono text-[10px] text-primary hover:bg-primary/20 transition-all"
                >
                  Equip
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded-md bg-red-500/10 border border-red-500/20 px-2 py-1 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
      />
    </div>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}