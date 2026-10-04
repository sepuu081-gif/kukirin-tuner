import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Battery, Gauge, Thermometer, Zap } from "lucide-react";

export default function RideLogViewer({ log, onBack }) {
  if (!log) return null;
  const samples = log.samples || [];
  return (
    <div className="mobile-screen-safe min-h-screen bg-[#050b14] p-3 pb-10 font-mono text-white">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-cyan-900/60 bg-[#0a1728] p-3">
          <button onClick={onBack} className="flex min-h-10 items-center gap-2 rounded-lg border border-cyan-800/50 px-3 text-xs text-cyan-300"><ArrowLeft className="h-4 w-4" /> BACK</button>
          <div className="text-right"><div className="text-xs font-bold text-cyan-300">VESC RIDE LOG</div><div className="text-[9px] text-slate-500">{log.vehicleName}</div></div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Summary icon={Gauge} label="MAX SPEED" value={`${log.summary.maxSpeed.toFixed(0)} km/h`} />
          <Summary icon={Zap} label="MAX CURRENT" value={`${log.summary.maxCurrent.toFixed(0)} A`} />
          <Summary icon={Battery} label="MAX SAG" value={`${log.summary.maxSag.toFixed(1)} V`} />
          <Summary icon={Thermometer} label="MAX BATTERY" value={`${log.summary.maxBatteryTemp.toFixed(0)}°C`} />
        </div>
        <Chart title="SPEED / CURRENT" data={samples} lines={[['speed','#22d3ee','km/h'],['current','#f97316','A']]} />
        <Chart title="PACK VOLTAGE / VOLTAGE SAG" data={samples} lines={[['voltage','#22c55e','V'],['sag','#ef4444','V sag']]} />
        <Chart title="TEMPERATURES" data={samples} lines={[['motorTemp','#f97316','Motor'],['escTemp','#a855f7','ESC'],['batteryTemp','#22c55e','Battery']]} />
        <div className="rounded-xl border border-cyan-900/40 bg-[#0a1728] p-3 text-[10px] text-slate-400">
          CELL {log.summary.endCellVoltage.toFixed(2)}V · SOC {log.summary.endSoc.toFixed(1)}% · HEALTH {log.summary.health.toFixed(1)}% · CYCLES {log.summary.cycles.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function Summary({ icon: Icon, label, value }) {
  return <div className="rounded-xl border border-cyan-900/40 bg-[#0a1728] p-3"><Icon className="mb-1 h-4 w-4 text-cyan-400"/><div className="text-[8px] text-slate-500">{label}</div><div className="text-sm font-bold text-white">{value}</div></div>;
}

function Chart({ title, data, lines }) {
  return (
    <div className="rounded-xl border border-cyan-900/40 bg-[#0a1728] p-3">
      <div className="mb-2 text-[9px] font-bold tracking-widest text-cyan-300">{title}</div>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="#17304d" strokeDasharray="3 3" />
          <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 8 }} tickFormatter={(v) => `${v}s`} />
          <YAxis tick={{ fill: '#64748b', fontSize: 8 }} />
          <Tooltip contentStyle={{ background: '#07111e', border: '1px solid #164e63', fontSize: 10 }} labelFormatter={(v) => `${v}s`} />
          {lines.map(([key, color, name]) => <Line key={key} type="monotone" dataKey={key} name={name} stroke={color} strokeWidth={2} dot={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
