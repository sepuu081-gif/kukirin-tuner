// Frame weld repair scene — no disassembly, welding
import { useState, useEffect } from "react";

export default function FrameScene({ phase, stepProgress, scanning, scanDone, brokenPart, currentTarget, testing, testPassed, sparks = [], onTargetClick }) {
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => setScanY(y => (y + 8) % 240), 30);
    return () => clearInterval(id);
  }, [scanning]);

  const cleaned = phase > 1;
  const tacksDone = phase > 2 ? 3 : phase === 2 ? stepProgress : 0;
  const welded = phase > 3;
  const ground = phase > 4;
  const canClick = (target) => phase > 0 && currentTarget === target;
  const handleClick = (target, x, y) => { if (canClick(target)) onTargetClick(target, x, y); };

  return (
    <svg viewBox="0 0 320 240" className="w-full" style={{ maxHeight: "45vh" }}>
      {[...Array(16)].map((_, i) => <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="240" stroke="#1a1a2e" strokeWidth="0.5" />)}
      {[...Array(12)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 20} x2="320" y2={i * 20} stroke="#1a1a2e" strokeWidth="0.5" />)}

      {/* Frame tube — horizontal */}
      <rect x="40" y="100" width="100" height="24" rx="12" fill="#2a2a3e" stroke="#4a4a5e" strokeWidth="2" />
      {/* Frame tube — vertical */}
      <rect x="180" y="100" width="100" height="24" rx="12" fill="#2a2a3e" stroke="#4a4a5e" strokeWidth="2" />

      {/* Crack in the middle */}
      <g onClick={() => handleClick("crack", 160, 112)} className={canClick("crack") ? "cursor-pointer" : ""}>
        {!cleaned && (
          <>
            <path d="M 140 100 L 155 112 L 145 124 L 160 112 L 150 124 L 180 100" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="3 2" />
            {/* Rust/dirt particles */}
            {[...Array(5)].map((_, i) => (
              <circle key={i} cx={145 + i * 6} cy={108 + (i % 2) * 8} r="1.5" fill="#7c2d12" opacity="0.6" />
            ))}
          </>
        )}
        {cleaned && !welded && (
          <path d="M 140 100 L 155 112 L 145 124 L 160 112 L 150 124 L 180 100" fill="none" stroke="#666" strokeWidth="2" />
        )}
        {canClick("crack") && <rect x="135" y="95" width="50" height="35" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />}
      </g>

      {/* Tack welds */}
      {(tacksDone > 0 || canClick("tacks")) && !welded && (
        <g>
          {[...Array(tacksDone)].map((_, i) => (
            <g key={`tack${i}`}>
              <circle cx={145 + i * 8} cy="112" r="3" fill="#fbbf24" opacity="0.8" />
              <circle cx={145 + i * 8} cy="112" r="2" fill="#fde047" />
            </g>
          ))}
          {canClick("tacks") && stepProgress === tacksDone && (
            <g onClick={() => handleClick("tacks", 145 + tacksDone * 8, 112)} className="cursor-pointer">
              <circle cx={145 + tacksDone * 8} cy="112" r="12" fill="transparent" />
              <circle cx={145 + tacksDone * 8} cy="112" r="5" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />
            </g>
          )}
        </g>
      )}

      {/* Full weld bead */}
      {welded && !ground && (
        <g onClick={() => canClick("weld") && handleClick("weld", 160, 112)}>
          <path d="M 140 108 Q 145 104 150 108 Q 155 112 160 108 Q 165 104 170 108 Q 175 112 180 108" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
          <path d="M 140 116 Q 145 120 150 116 Q 155 112 160 116 Q 165 120 170 116 Q 175 112 180 116" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}

      {/* Ground smooth */}
      {ground && (
        <g>
          <rect x="138" y="106" width="44" height="12" rx="2" fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="1" />
          <line x1="140" y1="112" x2="180" y2="112" stroke="#aaa" strokeWidth="0.5" />
        </g>
      )}

      {/* Grind prompt */}
      {welded && !ground && phase === 4 && (
        <g onClick={() => handleClick("grind", 160, 112)} className={canClick("grind") ? "cursor-pointer" : ""}>
          <rect x="135" y="100" width="50" height="24" fill="transparent" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />
          <text x="160" y="95" textAnchor="middle" fill="#f97316" fontSize="7" fontFamily="monospace">GRIND</text>
        </g>
      )}

      {/* Weld prompt */}
      {tacksDone >= 3 && !welded && phase === 3 && (
        <g onClick={() => handleClick("weld", 160, 112)} className={canClick("weld") ? "cursor-pointer" : ""}>
          <rect x="135" y="100" width="50" height="24" fill="transparent" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />
          <text x="160" y="95" textAnchor="middle" fill="#f97316" fontSize="7" fontFamily="monospace">WELD</text>
        </g>
      )}

      {/* Labels */}
      <text x="80" y="90" textAnchor="middle" fill="#444" fontSize="7" fontFamily="monospace">FRAME</text>
      <text x="240" y="90" textAnchor="middle" fill="#444" fontSize="7" fontFamily="monospace">FRAME</text>

      {/* Scan */}
      {scanning && (
        <g>
          <rect x="0" y="0" width="320" height="240" fill="rgba(6,182,212,0.05)" />
          <line x1="0" y1={scanY} x2="320" y2={scanY} stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
        </g>
      )}
      {scanDone && phase === 0 && (
        <g>
          <rect x="135" y="95" width="50" height="35" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 3" className="animate-pulse" />
          <text x="160" y="90" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold">FAULT: {brokenPart?.code}</text>
        </g>
      )}

      {/* Sparks */}
      {sparks.map(sp => <circle key={sp.id} cx={sp.x} cy={sp.y} r="2.5" fill="#fbbf24" className="animate-spark" style={{ '--sx': `${sp.sx}px`, '--sy': `${sp.sy}px` }} />)}

      {/* Test */}
      {testing && (
        <g>
          <rect x="130" y="95" width="60" height="35" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.4" className="animate-ping" />
          <text x="160" y="115" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="monospace" fontWeight="bold">STRESS...</text>
        </g>
      )}
      {testPassed && (
        <g>
          <rect x="135" y="100" width="50" height="24" rx="2" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="2" />
          <path d="M 148 112 L 156 120 L 175 102" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}