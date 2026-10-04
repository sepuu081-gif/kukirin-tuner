import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, Thermometer, Zap, Wind } from "lucide-react";

export default function VESCTuner({ vehicle }) {
  const [phaseAmps, setPhaseAmps] = useState(40);
  const [fieldWeakening, setFieldWeakening] = useState(0);
  const [batteryVolts, setBatteryVolts] = useState(vehicle.voltage);
  const [motorTemp, setMotorTemp] = useState(35);
  const [escTemp, setEscTemp] = useState(28);

  const maxPhase = 140;
  const maxFW = 50;
  const maxVolts = 72;

  // Simulate temps
  useEffect(() => {
    const interval = setInterval(() => {
      const heatRate = (phaseAmps / maxPhase) * 3 + (fieldWeakening / maxFW) * 5;
      const coolRate = 1.2;
      setMotorTemp(prev => {
        const next = prev + heatRate - coolRate + (Math.random() - 0.5) * 0.5;
        return Math.max(35, Math.min(180, next));
      });
      setEscTemp(prev => {
        const next = prev + heatRate * 0.6 - coolRate * 0.8 + (Math.random() - 0.5) * 0.3;
        return Math.max(25, Math.min(120, next));
      });
    }, 500);
    return () => clearInterval(interval);
  }, [phaseAmps, fieldWeakening]);

  const estimatedSpeed = Math.min(
    vehicle.topSpeed * (batteryVolts / vehicle.voltage) * (1 + fieldWeakening / 100),
    150
  );
  const wheelieRisk = phaseAmps > 80 && vehicle.weight < 20;
  const meltRisk = motorTemp > 150;
  const wobbleRisk = estimatedSpeed > 65 && vehicle.wheelbase < 1100;

  const getTempColor = (temp, max) => {
    const ratio = temp / max;
    if (ratio > 0.85) return "text-destructive";
    if (ratio > 0.6) return "text-yellow-400";
    return "text-accent";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse-glow" />
          <span className="font-mono text-xs text-green-400 uppercase tracking-widest">
            VESC Interactive Tuning v4.26
          </span>
        </div>

        {/* Temp Readout */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-md bg-secondary p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Thermometer className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[10px] text-muted-foreground uppercase">Motor Temp</span>
            </div>
            <span className={`font-mono text-xl font-bold ${getTempColor(motorTemp, 165)}`}>
              {motorTemp.toFixed(0)}°C
            </span>
          </div>
          <div className="rounded-md bg-secondary p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Thermometer className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[10px] text-muted-foreground uppercase">ESC Temp</span>
            </div>
            <span className={`font-mono text-xl font-bold ${getTempColor(escTemp, 100)}`}>
              {escTemp.toFixed(0)}°C
            </span>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-5">
          <TunerSlider
            label="Phase Current"
            value={phaseAmps}
            max={maxPhase}
            unit="A"
            icon={<Zap className="h-3 w-3" />}
            onChange={setPhaseAmps}
            warning={phaseAmps > 115 ? "BEYOND COIL INSULATION RATING" : null}
          />
          <TunerSlider
            label="Field Weakening"
            value={fieldWeakening}
            max={maxFW}
            unit="%"
            icon={<Wind className="h-3 w-3" />}
            onChange={setFieldWeakening}
            warning={fieldWeakening > 35 ? "EXTREME HEAT & BATTERY DRAIN" : null}
          />
          <TunerSlider
            label="Battery Voltage"
            value={batteryVolts}
            max={maxVolts}
            min={36}
            unit="V"
            icon={<Zap className="h-3 w-3" />}
            onChange={setBatteryVolts}
            warning={batteryVolts > vehicle.voltage ? "EXCEEDS STOCK VOLTAGE" : null}
          />
        </div>
      </div>

      {/* Estimated Output */}
      <div className="rounded-lg border border-border bg-card p-4">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Estimated Output</span>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-4xl font-bold text-primary">{estimatedSpeed.toFixed(0)}</span>
          <span className="font-mono text-sm text-muted-foreground">km/h</span>
        </div>
      </div>

      {/* Warnings */}
      {(wheelieRisk || meltRisk || wobbleRisk) && (
        <div className="space-y-2">
          {wheelieRisk && <WarningBanner text="WHEELIE RISK: High phase amps on lightweight frame. Front wheel will lift." />}
          {meltRisk && <WarningBanner text="ERR_MOTOR_MELT: Stator approaching critical 165°C. Reduce throttle immediately." severity="critical" />}
          {wobbleRisk && <WarningBanner text="ERR_SPEED_WOBBLE: Short wheelbase at high speed. Install steering damper." />}
        </div>
      )}
    </div>
  );
}

function TunerSlider({ label, value, max, min = 0, unit, icon, onChange, warning }) {
  const ratio = (value - min) / (max - min);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{icon}</span>
          <span className="font-mono text-xs text-foreground uppercase tracking-wider">{label}</span>
        </div>
        <span className="font-mono text-sm font-bold text-primary">{value}{unit}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={([v]) => onChange(v)}
        className="cursor-pointer"
      />
      {warning && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-yellow-400" />
          <span className="font-mono text-[10px] text-yellow-400">{warning}</span>
        </div>
      )}
      {/* ASCII bar */}
      <div className="mt-1 font-mono text-[10px] text-muted-foreground">
        [{Array(20).fill(null).map((_, i) => i / 20 < ratio ? '█' : '░').join('')}] {((ratio) * 100).toFixed(0)}%
      </div>
    </div>
  );
}

function WarningBanner({ text, severity = "warning" }) {
  return (
    <div className={`flex items-start gap-2 rounded-md p-3 font-mono text-xs ${
      severity === "critical"
        ? "bg-destructive/10 border border-destructive/30 text-destructive"
        : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
    }`}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}