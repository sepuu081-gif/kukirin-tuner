// Steering Damper swap scene — stem area, external
import { useState, useEffect } from "react";

export default function StemScene({ phase, stepProgress, scanning, scanDone, brokenPart, currentTarget, testing, testPassed, sparks = [], onTargetClick }) {
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => setScanY(y => (y + 8) % 240), 30);
    return () => clearInterval(id);
  }, [scanning]);

  const boltsLoose = phase > 1 && phase < 5;
  const damperOff = phase > 2 && phase < 4;
  const newDamperIn = phase > 3;
  const canClick = (target) => phase > 0 && currentTarget === target;
  const handleClick = (target, x, y) => { if (canClick(target)) onTargetClick(target, x, y); };

  return (
    <svg viewBox="0 0 320 240" className="w-full" style={{ maxHeight: "45vh" }}>
      {[...Array(16)].map((_, i) => <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="240" stroke="#1a1a2e" strokeWidth="0.5" />)}
      {[...Array(12)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 20} x2="320" y2={i * 20} stroke="#1a1a2e" strokeWidth="0.5" />)}

      {/* Handlebar */}
      <line x1="80" y1="30" x2="240" y2="30" stroke="#4a4a5e" strokeWidth="4" strokeLinecap="round" />
      <circle cx="80" cy="30" r="6" fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1" />
      <circle cx="240" cy="30" r="6" fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1" />

      {/* Stem */}
      <rect x="152" y="30" width="16" height="120" fill="#3a3a4e" stroke="#5a5a6e" strokeWidth="1" rx="2" />
      <line x1="160" y1="30" x2="160" y2="150" stroke="#4a4a5e" strokeWidth="0.5" />

      {/* Fork */}
      <line x1="140" y1="150" x2="140" y2="200" stroke="#4a4a5e" strokeWidth="3" />
      <line x1="180" y1="150" x2="180" y2="200" stroke="#4a4a5e" strokeWidth="3" />
      <circle cx="140" cy="205" r="12" fill="#2a2a3e" stroke="#4a4a5e" strokeWidth="2" />
      <circle cx="180" cy="205" r="12" fill="#2a2a3e" stroke="#4a4a5e" strokeWidth="2" />

      {/* Damper mount points */}
      <circle cx="160" cy="70" r="4" fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1" />
      <circle cx="160" cy="110" r="4" fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1" />

      {/* Clamp bolts */}
      {[70, 110].map((cy, i) => (
        <g key={`bolt${i}`} onClick={() => handleClick("bolts", 160, cy)} className={canClick("bolts") ? "cursor-pointer" : ""}>
          {/* Bolt head */}
          <rect x="155" y={cy - 4} width="10" height="8" fill={boltsLoose ? "#1a1a2e" : "#5a5a6e"} stroke="#7a7a8e" strokeWidth="1" rx="1" className="transition-all duration-300" />
          {!boltsLoose && <line x1="157" y1={cy} x2="163" y2={cy} stroke="#aaa" strokeWidth="1" />}
          {boltsLoose && <text x="175" y={cy + 3} fill="#666" fontSize="7" fontFamily="monospace">OUT</text>}
          {canClick("bolts") && stepProgress === i && <rect x="150" y={cy - 8} width="20" height="16" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />}
        </g>
      ))}

      {/* Damper */}
      {!damperOff && !newDamperIn && (
        <g onClick={() => handleClick("damper", 160, 90)} className={canClick("damper") ? "cursor-pointer" : ""}>
          <rect x="153" y="70" width="14" height="40" rx="3" fill="#dc2626" stroke="#ef4444" strokeWidth="1" opacity={boltsLoose ? 0.5 : 1} className="transition-all duration-300" />
          <rect x="155" y="75" width="10" height="30" rx="2" fill="#7f1d1d" />
          <circle cx="160" cy="90" r="3" fill="#aaa" />
          {canClick("damper") && <rect x="148" y="65" width="24" height="50" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4 3" className="animate-pulse" />}
        </g>
      )}

      {/* Damper removed */}
      {damperOff && (
        <g style={{ opacity: 0.3, transform: "translateX(60px)" }} className="transition-all duration-500">
          <rect x="153" y="70" width="14" height="40" rx="3" fill="#dc2626" stroke="#ef4444" strokeWidth="1" />
          <text x="160" y="95" textAnchor="middle" fill="#dc2626" fontSize="7" fontFamily="monospace">OLD</text>
        </g>
      )}

      {/* New damper install prompt */}
      {damperOff && phase === 3 && (
        <g onClick={() => handleClick("newdamper", 160, 90)} className={canClick("newdamper") ? "cursor-pointer" : ""}>
          <rect x="153" y="70" width="14" height="40" rx="3" fill="transparent" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 3" className="animate-pulse" />
          <text x="160" y="95" textAnchor="middle" fill="#22c55e" fontSize="7" fontFamily="monospace">NEW</text>
        </g>
      )}

      {/* New damper installed */}
      {newDamperIn && (
        <g>
          <rect x="153" y="70" width="14" height="40" rx="3" fill="#22c55e" stroke="#4ade80" strokeWidth="1" />
          <rect x="155" y="75" width="10" height="30" rx="2" fill="#14532d" />
          <circle cx="160" cy="90" r="3" fill="#aaa" />
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
          <rect x="145" y="60" width="30" height="60" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 3" className="animate-pulse" />
          <text x="160" y="55" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold">FAULT: {brokenPart?.code}</text>
        </g>
      )}

      {/* Sparks */}
      {sparks.map(sp => <circle key={sp.id} cx={sp.x} cy={sp.y} r="2.5" fill="#fbbf24" className="animate-spark" style={{ '--sx': `${sp.sx}px`, '--sy': `${sp.sy}px` }} />)}

      {/* Test */}
      {testing && (
        <g>
          <rect x="145" y="60" width="30" height="60" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.4" className="animate-ping" />
          <text x="160" y="95" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace" fontWeight="bold">TEST...</text>
        </g>
      )}
      {testPassed && (
        <g>
          <circle cx="160" cy="90" r="35" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="2" />
          <path d="M 148 90 L 157 99 L 175 81" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}