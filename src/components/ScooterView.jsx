import { useEffect, useRef, useState } from "react";
import { VEHICLES } from "../lib/vehicleData";

export default function ScooterView({ speed, maxSpeed, motorTemp, isWheelying, crashed, killed, weather, appearance, vehicleId }) {
  const bgOffset = useRef(0);
  const [frame, setFrame] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 60), 50);
    return () => clearInterval(id);
  }, []);

  const normalizedSpeed = Math.min(speed / Math.max(maxSpeed, 1), 1);
  bgOffset.current = (bgOffset.current + normalizedSpeed * 18) % 1000;

  const wheelSpin   = speed > 0.5 ? frame : 0;
  const bodyBob     = speed > 2 ? Math.sin(frame * 0.4) * (1 + normalizedSpeed * 2) : 0;
  const wheelieLift = isWheelying ? Math.min(frame * 1.5, 30) : 0;
  const wheelieRot  = isWheelying ? Math.min(frame * 0.6, 14) : 0;
  const smokeOpacity = motorTemp > 130 ? Math.min((motorTemp - 130) / 35, 1) : 0;

  const deckColor   = appearance?.deckColor   || "#f97316";
  const stemColor   = appearance?.stemColor   || "#374151";
  const wheelColor  = appearance?.wheelColor  || "#1f2937";
  const helmetColor = appearance?.riderHelmetColor || "#f97316";

  const isG2     = vehicleId?.startsWith("g2") || vehicleId === "sebius_g2_wrapped";
  const isXiaomi = vehicleId?.startsWith("xm");
  const isDT     = vehicleId?.startsWith("dt");
  const isDual   = vehicleId?.includes("dual") || vehicleId?.includes("master") || vehicleId?.includes("ultra");
  const isEmoto  = vehicleId?.startsWith("surron_") || vehicleId?.startsWith("stark_varg");

  const deckY   = isG2 ? 42 : 44;
  const deckH   = isDT ? 10 : 8;

  const skyColor = crashed ? "#3b0000"
    : weather === "storm" ? "#0c0c14"
    : weather === "rain"  ? "#0a0f18"
    : weather === "wind"  ? "#0d0d0a"
    : "#0a0a0a";
  const groundColor = crashed ? "#1a0000"
    : (weather === "rain" || weather === "storm") ? "#0a0f14"
    : "#111";
  const lineColor = crashed ? "#7f1d1d"
    : (weather === "rain" || weather === "storm") ? "#172033"
    : "#1f2937";

  const dashOffset = bgOffset.current % 125;
  const spd = normalizedSpeed;

  const vehicleData = vehicleId ? VEHICLES.find(v => v.id === vehicleId) : null;
  const imageUrl = vehicleData?.imageUrl;
  const showImage = imageUrl && !imgError;

  return (
    <div className="w-full relative overflow-hidden rounded-lg border border-border/40" style={{ height: 170, background: showImage ? "transparent" : skyColor }}>
      {/* Parallax stars */}
      {!showImage && [...Array(14)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white/10" style={{
          width: 2, height: 2,
          top: `${8 + (i * 13) % 52}%`,
          left: `${((i * 137 + bgOffset.current * 0.25) % 100)}%`,
          opacity: spd > 0.1 ? Math.min(spd * 0.5, 0.3) : 0.12,
        }} />
      ))}

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 38, background: groundColor, borderTop: `2px solid ${lineColor}` }} />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute" style={{
          bottom: 15, left: `${((i * 125 - dashOffset + 1000) % 1000) - 10}px`,
          width: 60, height: 3, background: lineColor, borderRadius: 2,
        }} />
      ))}

      {/* Rain */}
      {(weather === "rain" || weather === "storm") && [...Array(weather === "storm" ? 16 : 9)].map((_, i) => (
        <div key={i} className="absolute" style={{
          width: 1.5, height: weather === "storm" ? 15 : 9,
          background: "rgba(147,197,253,0.5)",
          top: `${(frame * 4 + i * 31) % 100}%`,
          left: `${(i * 67 + frame * 2) % 100}%`,
          transform: "rotate(15deg)", borderRadius: 1,
        }} />
      ))}

      {/* Wind lines */}
      {weather === "wind" && [...Array(5)].map((_, i) => (
        <div key={i} className="absolute" style={{
          height: 1.5,
          width: `${25 + Math.sin((frame + i * 5) * 0.3) * 12}px`,
          background: "rgba(253,224,71,0.22)",
          top: `${15 + i * 16}%`,
          left: `${((i * 80 - frame * 5 + 400) % 110) - 10}px`,
          borderRadius: 1,
        }} />
      ))}

      {/* Speed lines */}
      {spd > 0.3 && [...Array(6)].map((_, i) => (
        <div key={i} className="absolute" style={{
          height: i % 2 === 0 ? 2 : 1,
          width: `${18 + spd * 55}px`,
          background: `rgba(249,115,22,${0.15 + spd * 0.2})`,
          top: `${20 + i * 11}%`, right: `${58 + i * 3}%`, borderRadius: 1,
        }} />
      ))}

      {/* Real scooter photo */}
      {showImage ? (
        <img
          src={imageUrl}
          alt={vehicleData?.name || "Scooter"}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none select-none"
          style={{
            height: "auto",
            maxHeight: 135,
            maxWidth: "80%",
            objectFit: "contain",
            filter: crashed ? "brightness(0.35) sepia(1) hue-rotate(-10deg)" : "none",
            transform: `translateY(${-bodyBob}px) rotate(${-wheelieRot}deg)`,
            transition: crashed ? "none" : "transform 0.05s linear, filter 0.3s",
          }}
          onError={() => setImgError(true)}
        />
      ) : isEmoto ? (
        /* Electric dirt-bike SVG */
        <svg
          viewBox="0 0 180 100"
          width={225}
          height={130}
          aria-label="Electric dirt bike"
          style={{
            position: "absolute", bottom: 18, left: "50%",
            transform: `translateX(-50%) translateY(${-bodyBob}px) rotate(${-wheelieRot}deg)`,
            transition: crashed ? "none" : "transform 0.05s linear",
            filter: crashed ? "brightness(0.35) sepia(1) hue-rotate(-10deg)" : "none",
          }}
        >
          <g transform={`rotate(${wheelSpin * 6}, 34, 75)`}>
            <circle cx="34" cy="75" r="23" fill="#080b10" stroke={wheelColor} strokeWidth="5" />
            <circle cx="34" cy="75" r="17" fill="none" stroke="#64748b" strokeWidth="1.2" />
            {[0, 45, 90, 135].map((a) => <line key={a} x1="17" y1="75" x2="51" y2="75" stroke="#475569" strokeWidth="1" transform={`rotate(${a} 34 75)`} />)}
            <circle cx="34" cy="75" r="5" fill={deckColor} />
          </g>
          <g transform={`rotate(${wheelSpin * 6}, 145, 72)`}>
            <circle cx="145" cy="72" r="26" fill="#080b10" stroke={wheelColor} strokeWidth="5" />
            <circle cx="145" cy="72" r="19" fill="none" stroke="#64748b" strokeWidth="1.2" />
            {[0, 45, 90, 135].map((a) => <line key={a} x1="126" y1="72" x2="164" y2="72" stroke="#475569" strokeWidth="1" transform={`rotate(${a} 145 72)`} />)}
            <circle cx="145" cy="72" r="5" fill={deckColor} />
          </g>
          <path d="M34 75 L70 66 L92 38 L119 69 L70 66 L58 39 L103 40" fill="none" stroke={deckColor} strokeWidth="6" strokeLinejoin="round" />
          <path d="M61 38 L105 38 L116 27 L73 25 Z" fill="#111827" stroke={deckColor} strokeWidth="2" />
          <path d="M62 39 L94 40 L83 65 L70 66 Z" fill={stemColor} stroke="#334155" strokeWidth="2" />
          <rect x="72" y="43" width="18" height="20" rx="3" fill={deckColor} opacity="0.7" />
          <path d="M111 32 L145 72" stroke="#94a3b8" strokeWidth="5" />
          <path d="M117 29 L150 70" stroke={stemColor} strokeWidth="3" />
          <path d="M108 29 L136 20" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          <path d="M35 72 L66 49" stroke="#64748b" strokeWidth="5" />
          <path d="M31 71 L72 67" stroke="#334155" strokeWidth="3" />
          <circle cx="82" cy="60" r="10" fill="#0f172a" stroke={deckColor} strokeWidth="2" />
          {motorTemp > 100 && <circle cx="82" cy="60" r="14" fill="none" stroke={motorTemp > 145 ? "#ef4444" : "#f59e0b"} strokeWidth="2" opacity="0.8" />}
          <g transform={`translate(0, ${isWheelying ? -wheelieLift * 0.25 : 0})`}>
            <path d="M82 24 L101 17 L112 28 L96 40 L78 38 Z" fill="#111827" />
            <circle cx="101" cy="11" r="9" fill="#111827" stroke={helmetColor} strokeWidth="2" />
            <path d="M96 39 L78 59 M97 39 L119 46 M83 26 L119 27" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
          </g>
          <path d="M23 49 L52 47" stroke={deckColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      ) : (
        /* Main scooter SVG (fallback) */
        <svg
          viewBox="0 0 130 85"
          width={155}
          height={110}
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: `translateX(-50%) translateY(${-bodyBob}px) rotate(${-wheelieRot}deg)`,
            transition: crashed ? "none" : "transform 0.05s linear",
            filter: crashed ? "brightness(0.35) sepia(1) hue-rotate(-10deg)" : "none",
          }}
        >
          {/* Rear wheel */}
          <g transform={`rotate(${wheelSpin * 6}, 22, 58)`}>
            <circle cx="22" cy="58" r="16" fill="none" stroke={wheelColor} strokeWidth="5" />
            <circle cx="22" cy="58" r="7" fill={wheelColor} />
            <line x1="22" y1="43" x2="22" y2="73" stroke="#4b5563" strokeWidth="1.8" />
            <line x1="7"  y1="58" x2="37" y2="58" stroke="#4b5563" strokeWidth="1.8" />
            <line x1="11" y1="47" x2="33" y2="69" stroke="#4b5563" strokeWidth="1.2" />
            <line x1="33" y1="47" x2="11" y2="69" stroke="#4b5563" strokeWidth="1.2" />
          </g>
          {motorTemp > 100 && (
            <circle cx="22" cy="58" r="19" fill="none"
              stroke={motorTemp > 145 ? "#ef4444" : "#f59e0b"}
              strokeWidth="2"
              opacity={Math.min((motorTemp - 100) / 65, 0.85)}
            />
          )}
          {isG2 && (
            <path d={`M 22 42 Q 40 35 55 ${deckY + deckH}`} fill="none" stroke={deckColor} strokeWidth="3" opacity="0.85" />
          )}
          <rect x="16" y={deckY} width="85" height={deckH} rx="3" fill={deckColor} opacity="0.95" />
          <rect x="16" y={deckY + deckH - 2} width="85" height="2" rx="1" fill="rgba(0,0,0,0.25)" />
          {isDual && <circle cx="22" cy="58" r="5" fill={deckColor} opacity="0.7" />}
          <g transform={`translate(${isWheelying ? -5 : 0}, ${-wheelieLift * 0.7}) rotate(${wheelSpin * 6}, 98, 58)`}>
            <circle cx="98" cy="58" r="14" fill="none" stroke={wheelColor} strokeWidth="5" />
            <circle cx="98" cy="58" r="6" fill={wheelColor} />
            <line x1="98" y1="45" x2="98" y2="71" stroke="#4b5563" strokeWidth="1.8" />
            <line x1="85" y1="58" x2="111" y2="58" stroke="#4b5563" strokeWidth="1.8" />
          </g>
          {isXiaomi ? (
            <rect x="79" y="14" width="5" height="32" rx="2" fill={stemColor}
              transform={isWheelying ? "rotate(-6,81,44)" : ""} />
          ) : isDT ? (
            <rect x="77" y="10" width="8" height="36" rx="2.5" fill={stemColor}
              transform={isWheelying ? "rotate(-5,81,44)" : ""} />
          ) : (
            <rect x="79" y="13" width="6" height="33" rx="2" fill={stemColor}
              transform={isWheelying ? "rotate(-7,82,44)" : ""} />
          )}
          <rect x="68" y={isXiaomi ? 12 : 11} width="22" height="4" rx="2" fill="#4b5563" />
          <g transform={`translate(0, ${isWheelying ? -wheelieLift * 0.3 : 0})`}>
            <rect x="42" y={deckY - 8} width="8" height="10" rx="2" fill="#111827" />
            <rect x="54" y={deckY - 8} width="8" height="10" rx="2" fill="#111827" />
            <rect x="54" y="22" width="14" height="22" rx="4" fill="#111827" />
            <rect x="54" y="22" width="4" height="22" rx="2" fill={deckColor} opacity="0.4" />
            <circle cx="61" cy="15" r="8" fill="#1f2937" />
            <circle cx="61" cy="15" r="7" fill="#111827" />
            <path d={`M55 13 Q61 9 67 13`} stroke={helmetColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d={`M55 16 Q61 19 67 16`} stroke={helmetColor} strokeWidth="0.8" fill="none" opacity="0.5" />
            <line x1="61" y1="28" x2="74" y2="19" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      )}

      {/* Smoke particles */}
      {smokeOpacity > 0 && [...Array(4)].map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: 8 + i * 4, height: 8 + i * 4,
          background: `rgba(200,200,200,${smokeOpacity * (0.6 - i * 0.12)})`,
          bottom: 42 + i * 10,
          left: `calc(50% - 55px + ${Math.sin((frame + i * 8) * 0.3) * 10}px)`,
          transform: "translateX(-50%)",
        }} />
      ))}

      {/* Wheelie label */}
      {isWheelying && (
        <div className="absolute top-2 right-3 font-mono text-[10px] font-bold text-yellow-400 uppercase tracking-widest animate-pulse">
          🏍 WHEELIE!
        </div>
      )}

      {/* Killed overlay */}
      {killed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <span className="font-mono text-[11px] text-red-500 uppercase tracking-widest animate-pulse">KILLSWITCH — COASTING</span>
        </div>
      )}
    </div>
  );
}
