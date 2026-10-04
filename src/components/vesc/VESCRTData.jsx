import VESCChart from "./VESCChart";
import { useLanguage } from "../../lib/i18n";

export default function VESCRTData({ data, vehicle, params }) {
  const { t } = useLanguage();
  const polePairs = Math.max(1, (params?.motorPoles || 30) / 2);
  const wheelDiameterM = (vehicle?.tireSize || 10) * 0.0254;
  const calculatedSpeed = (data.erpm / polePairs) * (Math.PI * wheelDiameterM) * 60 / 1000;
  const speed = typeof data.speed === "number" ? data.speed : calculatedSpeed;
  const dutyPct = Math.min(100, Math.max(0, data.duty));
  const currentPct = Math.min(100, (Math.abs(data.current) / 200) * 100);
  const powerPct = Math.min(100, (Math.abs(data.power) / 8000) * 100);
  const cutoff = params ? parseFloat(params.batteryCutoffEnd) : (vehicle?.voltage || 48) * 0.78;
  const fullVoltage = (vehicle?.voltage || 48) * 1.15;
  const voltagePct = typeof data.batteryPct === "number"
    ? Math.min(100, Math.max(0, data.batteryPct))
    : Math.min(100, Math.max(0, ((data.voltage - cutoff) / Math.max(1, fullVoltage - cutoff)) * 100));
  const rideSeconds = data.rideSeconds || 0;
  const rideTime = `${String(Math.floor(rideSeconds / 60)).padStart(2, "0")}:${String(rideSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="p-3 space-y-3 bg-[#0a1424]">
      <div className="rounded-xl bg-gradient-to-b from-[#102844] to-[#0a1a2e] p-4 text-center border border-blue-900/50">
        <div className="text-[8px] text-blue-300/60 uppercase tracking-[0.25em]">{t("Live speed")}</div>
        <div className="mt-1 text-5xl font-bold text-cyan-400 tabular-nums leading-none">{speed.toFixed(0)}</div>
        <div className="text-[10px] text-blue-300/60 uppercase tracking-widest mt-1">km/h</div>
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-blue-900/50">
          <MiniValue label="ERPM" value={Math.round(data.erpm).toLocaleString()} />
          <MiniValue label={t("Battery")} value={`${voltagePct.toFixed(0)}%`} />
          <MiniValue label={t("Ride")} value={rideTime} />
        </div>
      </div>

      <div className="rounded-xl bg-[#0d1b2e] p-3 space-y-2.5 border border-blue-900/40">
        <BarGraph label={t("Duty Cycle")} value={dutyPct} display={`${dutyPct.toFixed(1)}%`} color="#4d7fc4" />
        <BarGraph label={t("Motor Current")} value={currentPct} display={`${typeof data.current === "number" ? data.current.toFixed(1) : data.current}A`} color="#4fcbcb" />
        <BarGraph label={t("Abs Power")} value={powerPct} display={`${Math.round(data.power)}W`} color="#d2d27f" />
        <BarGraph label={t("Battery")} value={voltagePct} display={`${typeof data.voltage === "number" ? data.voltage.toFixed(1) : data.voltage}V`} color="#7fc87f" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <TempGauge label={t("Motor")} temp={data.motorTemp} max={160} warn={110} critical={140} tempLabel={t("Temp")} />
        <TempGauge label={t("ESC")} temp={data.escTemp} max={100} warn={75} critical={90} tempLabel={t("Temp")} />
        <TempGauge label={t("Battery")} temp={data.batteryTemp ?? 25} max={80} warn={48} critical={60} tempLabel={t("Temp")} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <VESCChart value={dutyPct} max={100} color="#4d7fc4" label={t("Duty")} />
        <VESCChart value={typeof data.current === "number" ? Math.abs(data.current) : 0} max={200} color="#4fcbcb" label={t("Current")} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <VESCChart value={data.motorTemp} max={160} color={data.motorTemp >= 140 ? "#c83434" : data.motorTemp >= 110 ? "#d2d27f" : "#7fc87f"} label={t("Motor °C")} />
        <VESCChart value={data.escTemp} max={100} color={data.escTemp >= 90 ? "#c83434" : data.escTemp >= 75 ? "#d2d27f" : "#7fc87f"} label="ESC °C" />
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <DataCell label={t("Voltage")} value={`${typeof data.voltage === "number" ? data.voltage.toFixed(1) : data.voltage}V`} color="text-green-400" />
        <DataCell label={t("Power")} value={`${Math.round(data.power)}W`} color="text-yellow-400" />
        <DataCell label={t("Current")} value={`${typeof data.current === "number" ? data.current.toFixed(1) : data.current}A`} color="text-cyan-400" />
        <DataCell label={t("Ah Used")} value={data.ah.toFixed(2)} color="text-blue-400" />
        <DataCell label={t("Wh Used")} value={data.wh.toFixed(1)} color="text-blue-400" />
        <DataCell label={t("Trip")} value={`${data.distance.toFixed(2)}km`} color="text-blue-300" />
        <DataCell label={t("Lifetime")} value={`${(data.lifetimeKm || 0).toFixed(2)}km`} color="text-green-400" />
        <DataCell label={t("Battery Temp")} value={`${(data.batteryTemp ?? 25).toFixed(0)}°C`} color={(data.batteryTemp ?? 25) >= 60 ? "text-red-400" : (data.batteryTemp ?? 25) >= 48 ? "text-yellow-400" : "text-green-400"} />
        {typeof data.cellVoltage === "number" && <DataCell label="Cell Voltage" value={`${data.cellVoltage.toFixed(3)}V`} color={data.cellVoltage < 3.25 ? "text-red-400" : "text-green-400"} />}
        {typeof data.voltageSag === "number" && <DataCell label="Voltage Sag" value={`${data.voltageSag.toFixed(2)}V`} color={data.voltageSag > data.voltage * 0.12 ? "text-red-400" : "text-yellow-400"} />}
        {typeof data.batteryHealth === "number" && <DataCell label="Battery Health" value={`${data.batteryHealth.toFixed(1)}%`} color={data.batteryHealth < 75 ? "text-red-400" : "text-green-400"} />}
        {typeof data.batteryCycles === "number" && <DataCell label="Charge Cycles" value={data.batteryCycles.toFixed(2)} color="text-cyan-400" />}
        {typeof data.batteryPowerLimit === "number" && <DataCell label="Power Limit" value={`${data.batteryPowerLimit.toFixed(0)}%`} color={data.batteryPowerLimit < 75 ? "text-red-400" : "text-green-400"} />}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#0d1b2e] p-3 flex items-center justify-between border border-blue-900/40">
          <span className="text-[9px] text-blue-300/60 uppercase tracking-wider">{t("Tacho")}</span>
          <span className="text-sm font-bold text-white tabular-nums">{Math.round(data.tacho).toLocaleString()}</span>
        </div>
        <div className="rounded-xl bg-[#0d1b2e] p-3 flex items-center justify-between border border-blue-900/40">
          <span className="text-[9px] text-blue-300/60 uppercase tracking-wider">{t("Fault")}</span>
          <span className="text-sm font-bold text-green-400">{t("NONE")}</span>
        </div>
      </div>
    </div>
  );
}

function BarGraph({ label, value, display, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-blue-300/70 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-bold text-white tabular-nums">{display}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#0a1424] overflow-hidden border border-blue-950/50">
        <div className="h-full rounded-full transition-all duration-200" style={{ width: `${Math.min(100, value)}%`, background: color, boxShadow: `0 0 6px ${color}80` }} />
      </div>
    </div>
  );
}

function TempGauge({ label, temp, max, warn, critical, tempLabel = "Temp" }) {
  const pct = Math.min(100, (temp / max) * 100);
  const color = temp >= critical ? "#c83434" : temp >= warn ? "#d2d27f" : "#7fc87f";
  const bgColor = temp >= critical ? "bg-red-500/10 border-red-500/40" : temp >= warn ? "bg-yellow-500/10 border-yellow-500/30" : "bg-[#0d1b2e] border-blue-900/40";
  return (
    <div className={`rounded-xl p-3 border ${bgColor}`}>
      <div className="text-[8px] text-blue-300/60 uppercase tracking-wider mb-1">{label} {tempLabel}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color }}>{temp.toFixed(0)}°C</div>
      <div className="h-1.5 rounded-full bg-[#0a1424] overflow-hidden mt-1.5 border border-blue-950/50">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 4px ${color}80` }} />
      </div>
      <div className="flex justify-between text-[7px] text-blue-300/40 mt-0.5">
        <span>0°</span><span className="text-yellow-400/60">{warn}°</span><span className="text-red-400/60">{critical}°</span><span>{max}°</span>
      </div>
    </div>
  );
}

function DataCell({ label, value, color }) {
  return (
    <div className="rounded-lg bg-[#0d1b2e] p-2 text-center border border-blue-900/40">
      <div className="text-[8px] text-blue-300/60 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-xs font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function MiniValue({ label, value }) {
  return (
    <div>
      <div className="text-[7px] text-blue-300/50 uppercase tracking-wider">{label}</div>
      <div className="text-[11px] font-bold text-white tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
