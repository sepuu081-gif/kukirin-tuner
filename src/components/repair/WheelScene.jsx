// Wheel / Tire change scene — external, no deck cover
import { useState, useEffect } from "react";

export default function WheelScene({ phase, stepProgress, scanning, scanDone, brokenPart, currentTarget, testing, testPassed, sparks = [], onTargetClick }) {
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => setScanY(y => (y + 8) % 240), 30);
    return () => clearInterval(id);
  }, [scanning]);

  // Derive visual state from phase
  // Flow: 1:jack, 2:axle, 3:pull, 4:tire(3), 5:newtire(3), 6:mount, 7:tighten, 8:lower, 9:test
  const jackUp = phase > 1 && phase < 9;
  const axleOff = phase > 2 && phase < 7;
  const wheelOff = phase > 3 && phase < 7; // off from phase 4 to 6, mounted at 7
  const tireOff = phase > 4 && phase < 6; // off from phase 5, new tire at 6
  const newTireOn = phase > 5;

  const canClick = (target) => phase > 0 && currentTarget === target;
  const handleClick = (target, x, y) => { if (canClick(target)) onTargetClick(target, x, y); };

  return (
    <svg viewBox="0 0 320 240" className="w-full" style={{ maxHeight: "45vh" }}>
      {/* Grid */}
      {[...Array(16)].map((_, i) => <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="240" stroke="#1a1a2e" strokeWidth="0.5" />)}
      {[...Array(12)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 20} x2="320" y2={i * 20} stroke="#1a1a2e" strokeWidth="0.5" />)}

      {/* Ground line */}
      <line x1="0" y1={jackUp ? 200 : 195} x2="320" y2={jackUp ? 200 : 195} stroke="#3a3a4e" strokeWidth="2" strokeDasharray="6 4" />

      {/* Jack stand */}
      <g onClick={() => handleClick("jack", 160, 210)} className={canClick("jack") ? "cursor-pointer" : ""}>
        <rect x="140" y={jackUp ? 200 : 195} width="40" height="8" fill="#4a4a5e" />
        <rect x="145" y={jackUp ? 175 : 195} width="30" height={jackUp ? 25 : 0} fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1" className="transition-all duration-500" />
        <rect x="150" y={jackUp ? 170 : 195} width="20" height={jackUp ? 5 : 0} fill="#6a6a7e" className="transition-all duration-500" />
        {canClick("jack") && <rect x="135" y={jackUp ? 165 : 190} width="50" height="3" fill="#f97316" opacity="0.4" className="animate-pulse" />}
      </g>

      {/* Wheel assembly — always shown in center, opacity changes when off */}
      <g className="transition-all duration-500" style={{ transform: jackUp ? "translateY(-15px)" : "translateY(0)", opacity: wheelOff ? 0.5 : 1 }}>
        {/* Tire (old) */}
        {!tireOff && !newTireOn && (
          <g onClick={() => handleClick("tire", 160, 130)} className={canClick("tire") ? "cursor-pointer" : ""}>
            <circle cx="160" cy="130" r="55" fill="#1a1a2e" stroke="#3a3a4e" strokeWidth="3" />
            <circle cx="160" cy="130" r="50" fill="none" stroke="#2a2a3e" strokeWidth="1" strokeDasharray="4 4" />
            {canClick("tire") && <circle cx="160" cy="130" r="55" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.5" className="animate-pulse" />}
          </g>
        )}
        {/* New tire being installed */}
        {tireOff && !newTireOn && (
          <g onClick={() => handleClick("newtire", 160, 130)} className={canClick("newtire") ? "cursor-pointer" : ""}>
            <circle cx="160" cy="130" r="55" fill="transparent" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 4" className="animate-pulse" />
            <text x="160" y="135" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace">NEW TIRE</text>
          </g>
        )}
        {/* New tire installed */}
        {newTireOn && (
          <g>
            <circle cx="160" cy="130" r="55" fill="#1a2a1e" stroke="#22c55e" strokeWidth="3" />
            <circle cx="160" cy="130" r="50" fill="none" stroke="#2a4a3e" strokeWidth="1" strokeDasharray="4 4" />
          </g>
        )}

        {/* Rim (always visible) */}
        <circle cx="160" cy="130" r="30" fill="#2a2a3e" stroke="#4a4a5e" strokeWidth="2" />

        {/* Axle nut — shown when not off, or when tightening */}
        {!axleOff && (
          <g onClick={() => handleClick("axle", 160, 130)} className={canClick("axle") ? "cursor-pointer" : ""}>
            <circle cx="160" cy="130" r="12" fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1.5" />
            {[...Array(6)].map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return <circle key={i} cx={160 + Math.cos(a) * 8} cy={130 + Math.sin(a) * 8} r="1.5" fill="#aaa" />;
            })}
            {canClick("axle") && <circle cx="160" cy="130" r="14" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.5" className="animate-pulse" />}
          </g>
        )}
        {/* Axle nut being tightened (phase 7) */}
        {axleOff && phase >= 7 && (
          <g onClick={() => handleClick("axle", 160, 130)} className={canClick("axle") ? "cursor-pointer" : ""}>
            <circle cx="160" cy="130" r="12" fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1.5" className={canClick("axle") ? "animate-pulse" : ""} />
            {[...Array(6)].map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return <circle key={i} cx={160 + Math.cos(a) * 8} cy={130 + Math.sin(a) * 8} r="1.5" fill="#aaa" />;
            })}
          </g>
        )}
      </g>

      {/* Wheel removed label */}
      {wheelOff && phase < 6 && (
        <text x="160" y="75" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace">WHEEL REMOVED</text>
      )}

      {/* Click to mount wheel (phase 6) */}
      {wheelOff && phase === 6 && (
        <g onClick={() => handleClick("wheel", 160, 130)} className={canClick("wheel") ? "cursor-pointer" : ""}>
          <circle cx="160" cy="130" r="60" fill="transparent" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 4" className="animate-pulse" />
          <text x="160" y="135" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace">CLICK TO MOUNT</text>
        </g>
      )}

      {/* Pull wheel off prompt (phase 3) */}
      {phase === 3 && !wheelOff && (
        <g onClick={() => handleClick("wheel", 160, 130)} className={canClick("wheel") ? "cursor-pointer" : ""}>
          <circle cx="160" cy="130" r="60" fill="transparent" stroke="#f97316" strokeWidth="2" strokeDasharray="6 4" className="animate-pulse" />
          <text x="160" y="65" textAnchor="middle" fill="#f97316" fontSize="8" fontFamily="monospace">↑ CLICK TO REMOVE</text>
        </g>
      )}

      {/* Scan animation */}
      {scanning && (
        <g>
          <rect x="0" y="0" width="320" height="240" fill="rgba(6,182,212,0.05)" />
          <line x1="0" y1={scanY} x2="320" y2={scanY} stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
          <line x1="0" y1={scanY + 3} x2="320" y2={scanY + 3} stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
        </g>
      )}

      {/* Scan result */}
      {scanDone && phase === 0 && (
        <g>
          <circle cx="160" cy="130" r="65" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 3" className="animate-pulse" />
          <text x="160" y="60" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold">FAULT: {brokenPart?.code}</text>
        </g>
      )}

      {/* Sparks */}
      {sparks.map(sp => <circle key={sp.id} cx={sp.x} cy={sp.y} r="2.5" fill="#fbbf24" className="animate-spark" style={{ '--sx': `${sp.sx}px`, '--sy': `${sp.sy}px` }} />)}

      {/* Test animation */}
      {testing && (
        <g>
          <circle cx="160" cy="130" r="50" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.4" className="animate-ping" />
          <text x="160" y="135" textAnchor="middle" fill="#22c55e" fontSize="10" fontFamily="monospace" fontWeight="bold">SPIN...</text>
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