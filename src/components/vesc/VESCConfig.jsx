import { AlertTriangle } from "lucide-react";

export default function VESCConfig({ type, params, update, maxAmps, voltage }) {
  if (type === "motor") {
    return (
      <div className="p-3 space-y-4 bg-[#0a1424]">
        <SectionTitle>Motor General</SectionTitle>
        <ConfigSelect label="Motor Type" value={params.motorType || "foc"} options={[["bldc", "BLDC"], ["dc", "DC"], ["foc", "FOC"]]} onChange={v => update("motorType", v)} />
        <ConfigSlider label="Motor Poles" value={params.motorPoles || 30} min={2} max={40} step={2} unit="" onChange={v => update("motorPoles", v)} />
        <ConfigSelect label="Temp Sensor" value={params.tempSensor || "ntc10k"} options={[["ntc10k", "NTC 10K"], ["ptc", "PTC"], ["kty", "KTY81-2"], ["none", "None"]]} onChange={v => update("tempSensor", v)} />

        <SectionTitle>Current Limits</SectionTitle>
        <ConfigSlider label="Motor Current Max" value={params.motorCurrentMax} max={Math.ceil(maxAmps * 1.5)} unit="A" onChange={v => update("motorCurrentMax", v)} warn={v => v > maxAmps ? `Exceeds controller rating (${maxAmps}A)` : null} />
        <ConfigSlider label="Motor Current Max Brake" value={params.motorCurrentMaxBrake} max={Math.ceil(maxAmps)} unit="A" onChange={v => update("motorCurrentMaxBrake", v)} />
        <ConfigSlider label="Battery Current Max" value={params.batteryCurrentMax} max={Math.ceil(maxAmps)} unit="A" onChange={v => update("batteryCurrentMax", v)} warn={v => v > maxAmps * 0.6 ? "May trip BMS" : null} />
        <ConfigSlider label="Battery Current Max Brake" value={params.batteryCurrentMaxBrake} max={Math.ceil(maxAmps * 0.6)} unit="A" onChange={v => update("batteryCurrentMaxBrake", v)} />

        <SectionTitle>Field Weakening (FOC)</SectionTitle>
        <ConfigSlider label="FW Start" value={params.fieldWeakeningStart || 0} max={100} unit="%" onChange={v => update("fieldWeakeningStart", v)} />
        <ConfigSlider label="FW Max" value={params.fieldWeakeningMax} max={50} unit="%" onChange={v => update("fieldWeakeningMax", v)} warn={v => v > 25 ? "Extreme heat & battery drain" : null} />
        <ConfigSlider label="FW Step" value={params.fieldWeakeningStep || 0.5} min={0.1} max={5} step={0.1} unit="A" onChange={v => update("fieldWeakeningStep", v)} />

        <SectionTitle>Duty Cycle</SectionTitle>
        <ConfigSlider label="Max Duty" value={params.maxDuty} max={100} unit="%" onChange={v => update("maxDuty", v)} />
        <ConfigSlider label="Min Duty" value={params.minDuty || 3} min={0} max={20} step={0.5} unit="%" onChange={v => update("minDuty", v)} />

        <SectionTitle>Advanced</SectionTitle>
        <ConfigSlider label="Absolute Max Current" value={params.absoluteMax} max={Math.ceil(maxAmps * 2)} unit="A" onChange={v => update("absoluteMax", v)} warn={v => v > maxAmps * 1.5 ? "MOSFET damage risk" : null} />
      </div>
    );
  }

  if (type === "battery") {
    const cells = Math.round(voltage / 3.6);
    return (
      <div className="p-3 space-y-4 bg-[#0a1424]">
        <div className="rounded-xl bg-[#0d1b2e] p-3 space-y-2 border border-blue-900/40">
          <InfoRow label="Cell Count" value={`${cells}S`} />
          <InfoRow label="Nominal Voltage" value={`${voltage}V`} />
          <InfoRow label="Max Charge" value={`${(voltage * 1.17).toFixed(1)}V`} />
          <InfoRow label="Min Discharge" value={`${(voltage * 0.83).toFixed(1)}V`} />
        </div>
        <SectionTitle>Cutoff Protection</SectionTitle>
        <ConfigSlider label="Battery Cutoff Start" value={parseFloat(params.batteryCutoffStart)} min={voltage * 0.7} max={voltage * 0.95} step={0.1} unit="V" onChange={v => update("batteryCutoffStart", v.toFixed(1))} />
        <ConfigSlider label="Battery Cutoff End" value={parseFloat(params.batteryCutoffEnd)} min={voltage * 0.65} max={voltage * 0.9} step={0.1} unit="V" onChange={v => update("batteryCutoffEnd", v.toFixed(1))} warn={v => v < voltage * 0.75 ? "Cell damage risk" : null} />
        <SectionTitle>Charging</SectionTitle>
        <ConfigSlider label="Charge Current Max" value={params.chargeCurrentMax} max={20} unit="A" onChange={v => update("chargeCurrentMax", v)} />
        <SectionTitle>BMS</SectionTitle>
        <ConfigSelect label="BMS Type" value={params.bmsType || "none"} options={[["none", "None"], ["uart", "UART"], ["canbus", "CAN Bus"], ["shutdown", "Shutdown"]]} onChange={v => update("bmsType", v)} />
      </div>
    );
  }

  if (type === "app") {
    return (
      <div className="p-3 space-y-4 bg-[#0a1424]">
        <SectionTitle>Control</SectionTitle>
        <ConfigSelect label="Control Mode" value={params.controlMode} options={[["current", "Current"], ["speed", "Speed PID"], ["duty", "Duty Cycle"]]} onChange={v => update("controlMode", v)} />
        <ConfigSelect label="Throttle Type" value={params.throttleType} options={[["adc", "Single ADC"], ["adc2", "Dual ADC"], ["pwm", "PWM"]]} onChange={v => update("throttleType", v)} />
        <ConfigToggle label="Cruise Control" value={params.cruiseControl} onChange={v => update("cruiseControl", v)} />

        <SectionTitle>Throttle Curve</SectionTitle>
        <ConfigSlider label="Throttle Min" value={params.throttleMin || 0} min={0} max={50} unit="%" onChange={v => update("throttleMin", v)} />
        <ConfigSlider label="Throttle Max" value={params.throttleMax || 100} min={50} max={100} unit="%" onChange={v => update("throttleMax", v)} />
        <ConfigSlider label="Throttle Center" value={params.throttleCenter || 50} min={0} max={100} unit="%" onChange={v => update("throttleCenter", v)} />

        <SectionTitle>Safety</SectionTitle>
        <ConfigSlider label="Tiltback Speed" value={params.tiltbackSpeed} max={100} unit="km/h" onChange={v => update("tiltbackSpeed", v)} />
        <ConfigSlider label="Tiltback Current" value={params.tiltbackCurrent || 50} max={Math.ceil(maxAmps * 1.5)} unit="A" onChange={v => update("tiltbackCurrent", v)} />
      </div>
    );
  }
  return null;
}

function SectionTitle({ children }) {
  return <div className="text-[9px] text-blue-400/80 uppercase tracking-widest font-bold pt-1 pb-0.5 border-b border-blue-900/40">{children}</div>;
}

function ConfigSlider({ label, value, max, min = 0, step = 1, unit, onChange, warn }) {
  const numVal = typeof value === "number" ? value : parseFloat(value) || 0;
  const warning = warn ? warn(numVal) : null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-blue-200/80 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold text-white tabular-nums">{numVal.toFixed(step < 1 ? 1 : 0)}{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <input type="range" aria-label={label} value={numVal} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} className="min-w-0 flex-1 h-11 accent-emerald-400" />
        <input type="number" aria-label={`${label} value`} value={numVal} min={min} max={max} step={step} onChange={e => { if (e.target.value !== '') onChange(Math.max(min, Math.min(max, Number(e.target.value)))); }} className="w-20 min-h-11 rounded-lg border border-emerald-800 bg-black/30 px-2 text-white" />
      </div>
      <div className="flex justify-between text-[8px] text-blue-300/40 mt-0.5">
        <span>{min.toFixed(step < 1 ? 1 : 0)}{unit}</span>
        <span>{max.toFixed(step < 1 ? 1 : 0)}{unit}</span>
      </div>
      {warning && (
        <div className="flex items-center gap-1 mt-1">
          <AlertTriangle className="h-2.5 w-2.5 text-yellow-400" />
          <span className="text-[9px] text-yellow-400">{warning}</span>
        </div>
      )}
    </div>
  );
}

function ConfigSelect({ label, value, options, onChange }) {
  return (
    <div>
      <div className="text-[10px] text-blue-200/80 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="flex gap-1">
        {options.map(([val, lbl]) => (
          <button key={val} onClick={() => onChange(val)}
            className={`flex-1 rounded-lg py-2 text-[9px] font-bold uppercase transition-colors ${value === val ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "bg-[#0d1b2e] text-blue-300/60 border border-blue-900/40"}`}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfigToggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-blue-200/80 uppercase tracking-wider">{label}</span>
      <button type="button" role="switch" aria-label={label} aria-checked={!!value} onClick={() => onChange(!value)} className={`min-h-11 w-14 shrink-0 rounded-full p-1 transition-colors ${value ? "bg-blue-600" : "bg-[#1a3a5f]"}`}>
        <div className={`h-5 w-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-blue-300/60">{label}</span>
      <span className="text-xs font-bold text-white">{value}</span>
    </div>
  );
}
