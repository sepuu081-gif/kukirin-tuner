export default function RideDashboard({ vehicle, display, speed, batteryPct, batteryTemp, motorTemp, phaseAmps, mode }) {
  const style = display?.displayStyle
    || (vehicle?.series === "STARK" ? "stark" : vehicle?.series === "SURRON" ? "surron" : vehicle?.series === "G" ? "kukirin" : "vesc");

  if (style === "stark") {
    return (
      <div className="ride-model-dash dash-stark" aria-label="Stark Arkenstone dashboard">
        <div className="dash-brand">STARK <span>ARKENSTONE</span></div>
        <div className="dash-stark-main"><strong>{speed.toFixed(0)}</strong><small>KM/H</small><b>{mode.toUpperCase()}</b></div>
        <div className="dash-power-track"><i style={{ width: `${Math.min(100, Math.max(4, phaseAmps / 2.2))}%` }} /></div>
        <div className="dash-row"><span>⚡ {batteryPct.toFixed(0)}%</span><span>M {motorTemp.toFixed(0)}°</span><span>INV {phaseAmps.toFixed(0)}A</span></div>
      </div>
    );
  }

  if (style === "surron") {
    return (
      <div className="ride-model-dash dash-surron" aria-label="Sur-Ron dashboard">
        <div className="dash-brand">SUR-RON <span>{vehicle?.id?.includes("ultra") ? "ULTRA BEE" : "LIGHT BEE"}</span></div>
        <div className="dash-surron-gauge">
          <div><strong>{speed.toFixed(0)}</strong><small>km/h</small></div>
        </div>
        <div className="dash-row"><span>{mode === "sport" ? "EP" : "D"}</span><span>🔋{batteryPct.toFixed(0)}%</span><span>{motorTemp.toFixed(0)}°</span></div>
      </div>
    );
  }

  if (style === "kukirin") {
    return (
      <div className="ride-model-dash dash-kukirin" aria-label={`${vehicle?.name || "KuKirin"} dashboard`}>
        <div className="dash-brand">KUKIRIN <span>{vehicle?.name?.replace("KuKirin", "") || "G-SERIES"}</span></div>
        <div className="dash-kukirin-speed"><strong>{speed.toFixed(0)}</strong><small>KM/H</small></div>
        <div className="dash-row"><span>{mode.toUpperCase()}</span><span>▰ {batteryPct.toFixed(0)}%</span><span>{phaseAmps.toFixed(0)}A</span></div>
      </div>
    );
  }

  return (
    <div className="ride-model-dash dash-vesc" aria-label="VESC handlebar display">
      <div className="dash-brand">VESC · CAN</div>
      <div className="dash-kukirin-speed"><strong>{speed.toFixed(0)}</strong><small>KM/H</small></div>
      <div className="dash-row"><span>{batteryPct.toFixed(0)}%</span><span>{motorTemp.toFixed(0)}°</span><span>{phaseAmps.toFixed(0)}A</span></div>
      <i className={batteryTemp > 55 ? "is-hot" : ""}>BAT {batteryTemp.toFixed(0)}°</i>
    </div>
  );
}
