// Hub Motor swap scene — external, with phase cables
import { useState, useEffect } from "react";

export default function HubScene({ phase, stepProgress, scanning, scanDone, brokenPart, currentTarget, testing, testPassed, sparks = [], onTargetClick }) {
  const [hoverTarget, setHoverTarget] = useState(null);
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => setScanY(y => (y + 8) % 240), 30);
    return () => clearInterval(id);
  }, [scanning]);

  const jackUp = phase > 1 && phase < 9;
  const cablesOff = phase > 2 && phase < 7;
  const axleOff = phase > 3 && phase < 7;
  const hubOff = phase > 4 && phase < 6;
  const newHubIn = phase > 5;
  const canClick = (target) => phase > 0 && currentTarget === target;
  const handleClick = (target, x, y) => { if (canClick(target)) onTargetClick(target, x, y); };

  const CABLE_COLORS = ["#dc2626", "#3b82f6", "#22c55e"];
  const CABLE_NAMES = ["A", "B", "C"];

  return (
    <svg viewBox="0 0 320 240" className="w-full" style={{ maxHeight: "45vh" }}>
      {[...Array(16)].map((_, i) => <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="240" stroke="#1a1a2e" strokeWidth="0.5" />)}
      {[...Array(12)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 20} x2="320" y2={i * 20} stroke="#1a1a2e" strokeWidth="0.5" />)}
      <line x1="0" y1={jackUp ? 200 : 195} x2="320" y2={jackUp ? 200 : 195} stroke="#3a3a4e" strokeWidth="2" strokeDasharray="6 4" />

      {/* Jack */}
      <g onClick={() => handleClick("jack", 160, 210)} className={canClick("jack") ? "cursor-pointer" : ""}>
        <rect x="140" y={jackUp ? 200 : 195} width="40" height="8" fill="#4a4a5e" />
        <rect x="145" y={jackUp ? 175 : 195} width="30" height={jackUp ? 25 : 0} fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1" className="transition-all duration-500" />
        <rect x="150" y={jackUp ? 170 : 195} width="20" height={jackUp ? 5 : 0} fill="#6a6a7e" className="transition-all duration-500" />
        {canClick("jack") && <rect x="135" y={jackUp ? 165 : 190} width="50" height="3" fill="#f97316" opacity="0.4" className="animate-pulse" />}
      </g>

      {/* Phase cables at top */}
      {[100, 160, 220].map((cx, i) => (
        <g key={`cable${i}`}>
          <text x={cx} y="12" textAnchor="middle" fill="#444" fontSize="7" fontFamily="monospace">{CABLE_NAMES[i]}</text>
          <line x1={cx} y1="50" x2={cx} y2={cablesOff ? 25 : 15} stroke={cablesOff ? "#333" : CABLE_COLORS[i]} strokeWidth="3" className="transition-all duration-500" />
          <g onClick={() => handleClick("cables", cx, 35)} className={canClick("cables") ? "cursor-pointer" : ""}>
            <rect x={cx - 9} y={cablesOff ? 18 : 38} width="18" height="14" rx="3" fill={cablesOff ? "#333" : CABLE_COLORS[i]} stroke={cablesOff ? "#555" : CABLE_COLORS[i]} strokeWidth="1.5" className="transition-all duration-500" style={{ opacity: cablesOff ? 0.4 : 1 }} />
            <circle cx={cx} cy={cablesOff ? 25 : 45} r="2" fill="#999" className="transition-all duration-500" />
            {canClick("cables") && stepProgress === i && <rect x={cx - 12} y={cablesOff ? 15 : 35} width="24" height="20" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />}
          </g>
        </g>
      ))}

      {/* Hub motor */}
      {!hubOff && (
        <g className="transition-all duration-500" style={{ transform: jackUp ? "translateY(-15px)" : "translateY(0)" }}>
          {/* Motor body */}
          <circle cx="160" cy="130" r="50" fill={newHubIn ? "#0a2a1e" : "#1a1a2e"} stroke={newHubIn ? "#22c55e" : "#3a3a4e"} strokeWidth="3" />
          <circle cx="160" cy="130" r="45" fill="none" stroke={newHubIn ? "#1a4a2e" : "#2a2a3e"} strokeWidth="1" />
          {/* Spokes */}
          {[...Array(8)].map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <line key={i} x1={160 + Math.cos(a) * 15} y1={130 + Math.sin(a) * 15} x2={160 + Math.cos(a) * 42} y2={130 + Math.sin(a) * 42} stroke={newHubIn ? "#2a5a3e" : "#3a3a4e"} strokeWidth="1.5" />;
          })}
          {/* Center hub */}
          <circle cx="160" cy="130" r="15" fill="#2a2a3e" stroke="#4a4a5e" strokeWidth="1.5" />
          <text x="160" y="134" textAnchor="middle" fill={newHubIn ? "#22c55e" : "#666"} fontSize="8" fontFamily="monospace" fontWeight="bold">{newHubIn ? "NEW" : "HUB"}</text>

          {/* Axle nut */}
          {!axleOff && (
            <g onClick={() => handleClick("axle", 160, 130)} className={canClick("axle") ? "cursor-pointer" : ""}>
              <circle cx="160" cy="130" r="10" fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1.5" />
              {[...Array(6)].map((_, i) => {
                const a = (i / 6) * Math.PI * 2;
                return <circle key={i} cx={160 + Math.cos(a) * 6} cy={130 + Math.sin(a) * 6} r="1.2" fill="#aaa" />;
              })}
              {canClick("axle") && <circle cx="160" cy="130" r="13" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.5" className="animate-pulse" />}
            </g>
          )}
          {phase >= 7 && (
            <g>
              <circle cx="160" cy="130" r="10" fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1.5" />
              {[...Array(6)].map((_, i) => {
                const a = (i / 6) * Math.PI * 2;
                return <circle key={i} cx={160 + Math.cos(a) * 6} cy={130 + Math.sin(a) * 6} r="1.2" fill="#aaa" />;
              })}
            </g>
          )}

          {/* Smoke from broken hub */}
          {!newHubIn && phase <= 4 && (
            <>
              {[...Array(3)].map((_, si) => (
                <circle key={`smoke${si}`} cx={160 + Math.sin(si * 2) * 6} cy={100 - si * 5} r={3 + si * 1.5} fill="rgba(80,80,80,0.2)" className="animate-pulse" style={{ animationDelay: `${si * 0.4}s` }} />
              ))}
            </>
          )}
        </g>
      )}

      {/* Hub removed — shown to side */}
      {hubOff && (
        <g style={{ opacity: 0.3, transform: "translateX(80px)" }} className="transition-all duration-500">
          <circle cx="160" cy="130" r="50" fill="#1a1a2e" stroke="#dc2626" strokeWidth="2" />
          <text x="160" y="135" textAnchor="middle" fill="#dc2626" fontSize="8" fontFamily="monospace">⚠ BROKEN</text>
        </g>
      )}

      {/* Install new hub prompt */}
      {hubOff && phase === 5 && (
        <g onClick={() => handleClick("newhub", 160, 130)} className={canClick("newhub") ? "cursor-pointer" : ""}>
          <circle cx="160" cy="130" r="50" fill="transparent" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 4" className="animate-pulse" />
          <text x="160" y="135" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace">INSTALL NEW</text>
        </g>
      )}

      {/* Pull hub prompt */}
      {phase === 4 && !hubOff && (
        <g onClick={() => handleClick("hub", 160, 130)} className={canClick("hub") ? "cursor-pointer" : ""}>
          <circle cx="160" cy="130" r="55" fill="transparent" stroke="#f97316" strokeWidth="2" strokeDasharray="6 4" className="animate-pulse" />
          <text x="160" y="65" textAnchor="middle" fill="#f97316" fontSize="8" fontFamily="monospace">↑ CLICK TO REMOVE</text>
        </g>
      )}

      {/* Scan */}
      {scanning && (
        <g>
          <rect x="0" y="0" width="320" height="240" fill="rgba(6,182,212,0.05)" />
          <line x1="0" y1={scanY} x2="320" y2={scanY} stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
        </g>
      )}
      {scanDone && phase === 0 && (
        <g>
          <circle cx="160" cy="130" r="60" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 3" className="animate-pulse" />
          <text x="160" y="60" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold">FAULT: {brokenPart?.code}</text>
        </g>
      )}

      {/* Sparks */}
      {sparks.map(sp => <circle key={sp.id} cx={sp.x} cy={sp.y} r="2.5" fill="#fbbf24" className="animate-spark" style={{ '--sx': `${sp.sx}px`, '--sy': `${sp.sy}px` }} />)}

      {/* Test */}
      {testing && (
        <g>
          <circle cx="160" cy="130" r="50" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.4" className="animate-ping" />
          <text x="160" y="135" textAnchor="middle" fill="#22c55e" fontSize="10" fontFamily="monospace" fontWeight="bold">TEST...</text>
        </g>
      )}
      {testPassed && (
        <g>
          <circle cx="160" cy="130" r="45" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="2" />
          <path d="M 145 130 L 156 141 L 178 119" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}