// Deck scene — internal repairs (VESC, battery, electronics)
// Shows deck cover with internal components
import { useState, useEffect } from "react";

export default function DeckScene({ phase, stepProgress, scanning, scanDone, brokenPart, currentTarget, testing, testPassed, sparks = [], onTargetClick }) {
  const [scanY, setScanY] = useState(0);

  useEffect(() => {
    if (!scanning) return;
    const id = setInterval(() => setScanY(y => (y + 8) % 240), 30);
    return () => clearInterval(id);
  }, [scanning]);

  const repairType = brokenPart?.part || "controller";
  const canClick = (target) => phase > 0 && currentTarget === target;
  const handleClick = (target, x, y) => { if (canClick(target)) onTargetClick(target, x, y); };
  const installTarget = repairType === "controller" ? "newvesc" : repairType === "battery" ? "newbatt" : "newmod";
  const removeTarget = repairType === "controller" ? "vesc" : repairType === "battery" ? "battery" : "module";

  // Derive state from phase — different flows have different step counts
  // Controller: 12 steps, Battery: 11 steps, Electronics: 11 steps
  // We need to figure out which steps are done based on the flow
  // Since we don't have the flow here, we'll use the target IDs to track state

  // Track completed targets — each target that was the currentTarget in a past phase is done
  // We'll use a simpler approach: track based on phase and the known step structure

  // For controller flow (12 steps):
  // 1: screws(6), 2: panel, 3: cables(3), 4: vscrews(4), 5: remove, 6: install, 7: paste, 8: vscrews(4), 9: cables(3), 10: panel, 11: screws(6), 12: test

  // For battery flow (11 steps):
  // 1: screws(6), 2: panel, 3: bms(1), 4: bscrews(2), 5: remove, 6: install, 7: bscrews(2), 8: bms(1), 9: panel, 10: screws(6), 11: test

  // For electronics flow (11 steps):
  // 1: screws(6), 2: panel, 3: cables(2), 4: escrews(2), 5: remove, 6: install, 7: escrews(2), 8: cables(2), 9: panel, 10: screws(6), 11: test

  // We'll track state by counting which "remove" steps are done
  // The key states: deckOpen, panelOff, partRemoved, newPartIn, pasteApplied

  // Let's use a simpler approach: track based on what we've seen
  // We'll use the phase number and the repair type to determine state

  const isController = repairType === "controller";
  const isBattery = repairType === "battery";
  const isElectronics = repairType === "electronics";

  // Common steps: 1=screws, 2=panel, then internal steps, then panel back, screws back, test
  // Deck screws: removed at step 1, back at step (totalSteps - 1)
  // Panel: off at step 2, back at step (totalSteps - 2)

  const totalSteps = isController ? 12 : 11;
  const deckScrewsStep = 1;
  const panelStep = 2;
  const panelBackStep = isController ? 10 : 9;
  const screwsBackStep = isController ? 11 : 10;

  const screwsOut = phase > deckScrewsStep && phase <= screwsBackStep;
  const screwsReinstalling = phase === screwsBackStep;
  const panelOff = phase > panelStep && phase < panelBackStep;
  const panelReinstalling = phase === panelBackStep;

  // Internal part state
  let partRemoved = false;
  let newPartIn = false;
  let pasteApplied = false;
  let internalScrewsOut = false;
  let cablesOff = false;
  let bmsOff = false;

  if (isController) {
    partRemoved = phase > 5;
    newPartIn = phase > 6;
    pasteApplied = phase > 7;
    internalScrewsOut = phase > 4 && phase < 9; // vscrews out through reinstall step
    cablesOff = phase > 3 && phase < 10; // cables off through reconnect step
  } else if (isBattery) {
    partRemoved = phase > 5;
    newPartIn = phase > 6;
    internalScrewsOut = phase > 4 && phase < 8; // bscrews out through reinstall step
    bmsOff = phase > 3 && phase < 9; // bms off through reconnect step
  } else if (isElectronics) {
    partRemoved = phase > 5;
    newPartIn = phase > 6;
    internalScrewsOut = phase > 4 && phase < 8; // escrews out through reinstall step
    cablesOff = phase > 3 && phase < 9; // cables off through reconnect step
  }

  // Screw positions
  const SCREW_POS = [[58, 68], [160, 68], [262, 68], [58, 172], [160, 172], [262, 172]];
  const CABLE_X = isElectronics ? [130, 190] : [100, 160, 220];
  const CABLE_LABELS = isElectronics ? ["PWR", "SIG"] : ["PHASE", "HALL", "TEMP"];
  const CABLE_COLORS = isElectronics ? ["#dc2626", "#3b82f6"] : ["#dc2626", "#3b82f6", "#22c55e"];

  // Internal part screws
  const INT_SCREW_POS = isController ? [[115, 100], [205, 100], [115, 140], [205, 140]] : isBattery ? [[125, 108], [195, 108]] : [[125, 108], [195, 108]];

  return (
    <svg viewBox="0 0 320 240" className="w-full" style={{ maxHeight: "45vh" }}>
      {[...Array(16)].map((_, i) => <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="240" stroke="#1a1a2e" strokeWidth="0.5" />)}
      {[...Array(12)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 20} x2="320" y2={i * 20} stroke="#1a1a2e" strokeWidth="0.5" />)}

      {/* Cables at top */}
      {CABLE_X.map((cx, i) => (
        <g key={`cable${i}`}>
          <text x={cx} y="10" textAnchor="middle" fill="#444" fontSize="6" fontFamily="monospace">{CABLE_LABELS[i]}</text>
          <line x1={cx} y1="50" x2={cx} y2={cablesOff ? 25 : 15} stroke={cablesOff ? "#333" : CABLE_COLORS[i]} strokeWidth="3" className="transition-all duration-500" />
          <g onClick={() => handleClick("cables", cx, 35)} className={canClick("cables") ? "cursor-pointer" : ""}>
            <rect x={cx - 9} y={cablesOff ? 18 : 38} width="18" height="14" rx="3" fill={cablesOff ? "#333" : CABLE_COLORS[i]} stroke={cablesOff ? "#555" : CABLE_COLORS[i]} strokeWidth="1.5" className="transition-all duration-500" style={{ opacity: cablesOff ? 0.4 : 1 }} />
            <circle cx={cx} cy={cablesOff ? 25 : 45} r="2" fill="#999" className="transition-all duration-500" />
            {canClick("cables") && stepProgress === i && <rect x={cx - 12} y={cablesOff ? 15 : 35} width="24" height="20" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />}
          </g>
        </g>
      ))}

      {/* BMS connector (battery only) */}
      {isBattery && (
        <g>
          <line x1="160" y1="50" x2="160" y2={bmsOff ? 30 : 15} stroke={bmsOff ? "#333" : "#fbbf24"} strokeWidth="3" className="transition-all duration-500" />
          <g onClick={() => handleClick("bms", 160, 35)} className={canClick("bms") ? "cursor-pointer" : ""}>
            <rect x="148" y={bmsOff ? 22 : 38} width="24" height="14" rx="3" fill={bmsOff ? "#333" : "#fbbf24"} stroke={bmsOff ? "#555" : "#fbbf24"} strokeWidth="1.5" className="transition-all duration-500" style={{ opacity: bmsOff ? 0.4 : 1 }} />
            <text x="160" y="48" textAnchor="middle" fill="#444" fontSize="5" fontFamily="monospace">BMS</text>
            {canClick("bms") && <rect x="144" y={bmsOff ? 18 : 34} width="32" height="20" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />}
          </g>
        </g>
      )}

      {/* Deck panel */}
      {!panelOff && !panelReinstalling && (
        <g onClick={() => handleClick("panel", 160, 120)} className={canClick("panel") ? "cursor-pointer" : ""} style={{ transition: "all 0.5s ease-out" }}>
          <rect x="40" y="50" width="240" height="140" rx="12" fill="#1a1a2e" stroke="#3a3a4e" strokeWidth="2" />
          <rect x="48" y="58" width="224" height="124" rx="8" fill="none" stroke="#2a2a3e" strokeWidth="1" strokeDasharray="4 4" />
          <text x="160" y="125" textAnchor="middle" fill="#444" fontSize="9" fontFamily="monospace">DECK PLATE</text>
          {canClick("panel") && <rect x="36" y="46" width="248" height="148" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="6 4" className="animate-pulse" />}
        </g>
      )}

      {/* Panel being lifted / off */}
      {(panelOff || panelReinstalling) && (
        <g>
          {/* Deck screws — visible when panel is off */}
          {/* Deck panel shown faded at top */}
          {panelReinstalling && (
            <g onClick={() => handleClick("panel", 160, 120)} className={canClick("panel") ? "cursor-pointer" : ""} style={{ transform: "translateY(-30px)", opacity: 0.5, transition: "all 0.5s" }}>
              <rect x="40" y="50" width="240" height="140" rx="12" fill="#1a1a2e" stroke="#3a3a4e" strokeWidth="2" />
              {canClick("panel") && <rect x="36" y="46" width="248" height="148" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 4" className="animate-pulse" />}
            </g>
          )}

          {/* Internal bay */}
          <rect x="75" y="75" width="170" height="90" rx="8" fill="#0a0a14" stroke="#222" strokeWidth="1.5" />
          <text x="160" y="88" textAnchor="middle" fill="#333" fontSize="7" fontFamily="monospace">INTERNAL BAY</text>

          {/* Internal component */}
          {/* Old part (broken) */}
          {!partRemoved && (
            <g>
              {[...Array(3)].map((_, si) => (
                <circle key={`smoke${si}`} cx={160 + Math.sin(si * 2) * 8} cy={95 - si * 6} r={3 + si * 1.5} fill="rgba(80,80,80,0.2)" className="animate-pulse" style={{ animationDelay: `${si * 0.4}s` }} />
              ))}
              <rect x="95" y="95" width="130" height="55" rx="6" fill="rgba(220,38,38,0.15)" stroke="#dc2626" strokeWidth="1.5" />
              <text x="160" y="127" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold">⚠ BROKEN</text>
            </g>
          )}

          {/* Part removed — empty slot */}
          {partRemoved && !newPartIn && (
            <g onClick={() => handleClick(installTarget, 160, 122)} className={canClick(installTarget) ? "cursor-pointer" : ""}>
              <rect x="95" y="95" width="130" height="55" rx="6" fill="transparent" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="6 4" className="animate-pulse" />
              <text x="160" y="127" textAnchor="middle" fill="#22c55e" fontSize="8" fontFamily="monospace">CLICK TO PLACE</text>
            </g>
          )}

          {/* New part installed */}
          {newPartIn && (
            <g>
              <rect x="95" y="95" width="130" height="55" rx="6" fill={isController ? "rgba(6,182,212,0.12)" : isBattery ? "rgba(34,197,94,0.12)" : "rgba(6,182,212,0.12)"} stroke={isController ? "#06b6d4" : isBattery ? "#22c55e" : "#06b6d4"} strokeWidth="1.5" />
              <text x="160" y="122" textAnchor="middle" fill={isController ? "#06b6d4" : isBattery ? "#22c55e" : "#06b6d4"} fontSize="8" fontFamily="monospace" fontWeight="bold">
                {isController ? "VESC" : isBattery ? "PACK" : "MODULE"}
              </text>
              {/* Thermal paste (controller only) */}
              {pasteApplied && (
                <g>
                  <circle cx="160" cy="135" r="8" fill="rgba(186,230,253,0.4)" stroke="#7dd3fc" strokeWidth="1" />
                  <circle cx="156" cy="133" r="2.5" fill="rgba(186,230,253,0.5)" />
                  <circle cx="164" cy="137" r="2" fill="rgba(186,230,253,0.5)" />
                </g>
              )}
              {!pasteApplied && isController && phase === 7 && (
                <g onClick={() => handleClick("paste", 160, 135)} className={canClick("paste") ? "cursor-pointer" : ""}>
                  <circle cx="160" cy="135" r="10" fill="transparent" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="4 3" className="animate-pulse" />
                  <text x="160" y="138" textAnchor="middle" fill="#7dd3fc" fontSize="6" fontFamily="monospace">PASTE</text>
                </g>
              )}
            </g>
          )}

          {/* Internal mounting screws */}
          {INT_SCREW_POS.map(([cx, cy], i) => {
            const screwsRemoved = internalScrewsOut;
            const reinstalling = (isController && phase === 8) || (isBattery && phase === 7) || (isElectronics && phase === 7);
            const showScrew = !screwsRemoved || (reinstalling && i < stepProgress);
            return (
              <g key={`is${i}`} onClick={() => handleClick(isController ? "vscrews" : isBattery ? "bscrews" : "escrews", cx, cy)} className={canClick(isController ? "vscrews" : isBattery ? "bscrews" : "escrews") ? "cursor-pointer" : ""}>
                <circle cx={cx} cy={cy} r="5" fill={showScrew ? "#5a5a6e" : "#0a0a14"} stroke="#7a7a8e" strokeWidth="1" style={{ opacity: showScrew ? 1 : 0.15, transition: "opacity 0.3s" }} />
                {showScrew && <line x1={cx - 3} y1={cy} x2={cx + 3} y2={cy} stroke="#aaa" strokeWidth="1" />}
                {canClick(isController ? "vscrews" : isBattery ? "bscrews" : "escrews") && stepProgress === i && <circle cx={cx} cy={cy} r="8" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />}
              </g>
            );
          })}

          {/* Remove part prompt */}
          {partRemoved === false && phase === 5 && (
            <g onClick={() => handleClick(removeTarget, 160, 122)} className={canClick(removeTarget) ? "cursor-pointer" : ""}>
              <rect x="90" y="90" width="140" height="65" fill="transparent" stroke="#f97316" strokeWidth="2" strokeDasharray="6 4" className="animate-pulse" />
              <text x="160" y="85" textAnchor="middle" fill="#f97316" fontSize="7" fontFamily="monospace">↑ REMOVE</text>
            </g>
          )}
        </g>
      )}

      {/* Deck screws — on panel when closed, visible when panel off */}
      {!panelOff && !panelReinstalling && SCREW_POS.map(([cx, cy], i) => {
        const reinstalling = phase === screwsBackStep;
        const screwOut = screwsOut && !(reinstalling && i < stepProgress);
        return (
          <g key={`screw${i}`} onClick={() => handleClick("screws", cx, cy)} className={canClick("screws") ? "cursor-pointer" : ""}>
            <circle cx={cx} cy={cy} r="7" fill={screwOut ? "#1a1a2e" : "#5a5a6e"} stroke="#7a7a8e" strokeWidth="1.5" style={{ opacity: screwOut ? 0.1 : 1, transition: "opacity 0.3s" }} />
            {!screwOut && <line x1={cx - 4} y1={cy} x2={cx + 4} y2={cy} stroke="#aaa" strokeWidth="1.5" />}
            {!screwOut && <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 4} stroke="#aaa" strokeWidth="1.5" />}
            {canClick("screws") && stepProgress === i && <circle cx={cx} cy={cy} r="10" fill="none" stroke="#f97316" strokeWidth="1.5" className="animate-pulse" />}
          </g>
        );
      })}

      {/* Scan */}
      {scanning && (
        <g>
          <rect x="0" y="0" width="320" height="240" fill="rgba(6,182,212,0.05)" />
          <line x1="0" y1={scanY} x2="320" y2={scanY} stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
        </g>
      )}
      {scanDone && phase === 0 && (
        <g>
          <rect x="75" y="75" width="170" height="90" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 3" className="animate-pulse" />
          <text x="160" y="70" textAnchor="middle" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold">FAULT: {brokenPart?.code}</text>
        </g>
      )}

      {/* Sparks */}
      {sparks.map(sp => <circle key={sp.id} cx={sp.x} cy={sp.y} r="2.5" fill="#fbbf24" className="animate-spark" style={{ '--sx': `${sp.sx}px`, '--sy': `${sp.sy}px` }} />)}

      {/* Test */}
      {testing && (
        <g>
          <circle cx="160" cy="120" r="50" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.4" className="animate-ping" />
          <text x="160" y="125" textAnchor="middle" fill="#22c55e" fontSize="10" fontFamily="monospace" fontWeight="bold">TESTING...</text>
        </g>
      )}
      {testPassed && (
        <g>
          <circle cx="160" cy="120" r="45" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="2" />
          <path d="M 145 120 L 156 131 L 178 109" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}