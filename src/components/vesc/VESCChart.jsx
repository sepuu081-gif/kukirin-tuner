import { useState, useEffect } from "react";

export default function VESCChart({ value, max, color = "#4d7fc4", label }) {
  const [data, setData] = useState([]);
  const maxLen = 60;

  useEffect(() => {
    const v = typeof value === "number" ? value : parseFloat(value) || 0;
    setData(prev => {
      const next = [...prev, v];
      if (next.length > maxLen) next.shift();
      return next;
    });
  }, [value]);

  const w = 100, h = 100;
  const points = data.length > 1
    ? data.map((v, i) => `${(i / (maxLen - 1)) * w},${h - Math.min(100, (v / max) * 100)}`).join(" ")
    : "";
  const areaPoints = points ? `0,${h} ${points} ${w},${h}` : "";
  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <div className="relative h-16 rounded-lg overflow-hidden border border-blue-900/40 bg-[#0a1a2e]">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map(y => (
          <line key={y} x1="0" y1={y} x2={w} y2={y} stroke="#505050" strokeWidth="0.3" strokeDasharray="2 2" />
        ))}
        {areaPoints && <polygon points={areaPoints} fill={`url(#${gradId})`} />}
        {points && <polyline points={points} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
      </svg>
      {label && <div className="absolute top-1 left-1.5 text-[7px] font-bold uppercase tracking-wider text-blue-300/60">{label}</div>}
      <div className="absolute bottom-1 right-1.5 text-[8px] font-bold tabular-nums" style={{ color }}>
        {typeof value === "number" ? value.toFixed(0) : value}
      </div>
    </div>
  );
}
