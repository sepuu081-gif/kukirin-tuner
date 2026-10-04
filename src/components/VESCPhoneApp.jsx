import { useState, useEffect, useRef } from "react";
import { Activity, Cog, Battery, Smartphone, Search, Info, Bluetooth, Zap, Loader2, RotateCcw } from "lucide-react";
import { getVescMotorProfile } from "../lib/vescMotorProfile";
import { calcBuildStats, createStockBuild } from "../lib/buildState";
import VESCRTData from "./vesc/VESCRTData";
import VESCConfig from "./vesc/VESCConfig";
import VESCDetection from "./vesc/VESCDetection";
import { useLanguage } from "../lib/i18n";

const TABS = [
  { id: "rtdata",  label: "RT Data", icon: Activity },
  { id: "motor",   label: "Motor",   icon: Cog },
  { id: "battery", label: "Battery", icon: Battery },
  { id: "app",     label: "App",     icon: Smartphone },
  { id: "detect",  label: "Detect",  icon: Search },
  { id: "info",    label: "Info",    icon: Info },
];

export default function VESCPhoneApp({ vehicle, build, liveData, autoConnect }) {
  return <VehicleVESCPhoneApp key={`${vehicle?.id}-${build?.parts?.motor?.id || 'stock'}`} vehicle={vehicle} build={build} liveData={liveData} autoConnect={autoConnect} />;
}

function VehicleVESCPhoneApp({ vehicle, build, liveData, autoConnect }) {
  const { t: tr } = useLanguage();
  const [connected, setConnected] = useState(autoConnect || false);
  const [connecting, setConnecting] = useState(false);
  const [tab, setTab] = useState("rtdata");
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [faultCode, setFaultCode] = useState(null);

  const controller = build?.parts?.controller;
  const voltage = build?.parts?.battery?.voltage || vehicle?.voltage || 48;
  const maxAmps = controller?.maxAmps || 80;
  const motorProfile = getVescMotorProfile(vehicle, build);
  const buildStats = calcBuildStats(vehicle, { ...createStockBuild(vehicle.id), ...build, parts: build?.parts || {} });
  const ratedBatteryAmps = Math.min(maxAmps, buildStats.batteryCurrentLimit, Math.ceil(buildStats.usablePower / voltage / 0.88));

  const vescKey = "kukirin_vesc_params_" + (vehicle?.id || build?.vehicleId);
  const [params, setParams] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(vescKey));
      if (saved && saved.motorCurrentMax != null) return {
        ...saved,
        motorPoles: saved.motorProfileId === motorProfile.id ? saved.motorPoles : motorProfile.poles,
        motorProfileId: motorProfile.id,
        motorKV: saved.motorProfileId === motorProfile.id ? saved.motorKV : undefined,
        motorResistance: saved.motorProfileId === motorProfile.id ? saved.motorResistance : undefined,
        motorInductance: saved.motorProfileId === motorProfile.id ? saved.motorInductance : undefined,
        motorFluxLinkage: saved.motorProfileId === motorProfile.id ? saved.motorFluxLinkage : undefined,
        hallOffsets: saved.motorProfileId === motorProfile.id ? saved.hallOffsets : undefined,
      };
    } catch {}
    return {
      motorCurrentMax: maxAmps,
      motorCurrentMaxBrake: Math.min(Math.round(maxAmps * 0.6), 50),
      batteryCurrentMax: ratedBatteryAmps,
      batteryCurrentMaxBrake: Math.min(Math.round(maxAmps * 0.3), 25),
      absoluteMax: Math.round(maxAmps * 1.5),
      fieldWeakeningMax: 0,
      fieldWeakeningStart: 0,
      fieldWeakeningStep: 0.5,
      maxDuty: 95,
      minDuty: 3,
      batteryCutoffStart: (voltage * 0.87).toFixed(1),
      batteryCutoffEnd: (voltage * 0.83).toFixed(1),
      chargeCurrentMax: 5,
      controlMode: "current",
      throttleType: "adc",
      cruiseControl: false,
      tiltbackSpeed: 50,
      tiltbackCurrent: 50,
      motorType: "foc",
      motorPoles: motorProfile.poles,
      motorProfileId: motorProfile.id,
      tempSensor: "ntc10k",
      bmsType: "none",
      throttleMin: 0,
      throttleMax: 100,
      throttleCenter: 50,
    };
  });

  const writtenParams=useRef({...params});
  const [dirty,setDirty]=useState(false);
  const [configStatus,setConfigStatus]=useState('Configuration loaded');
  const writeConfig=()=>{localStorage.setItem(vescKey,JSON.stringify(params));writtenParams.current={...params};setDirty(false);setConfigStatus('Configuration written');};
  const readConfig=()=>{let saved=writtenParams.current;try{saved=JSON.parse(localStorage.getItem(vescKey))||saved;}catch{}setParams({...saved});setDirty(false);setConfigStatus('Configuration loaded');};


  const simState = useRef({ speed: 0, targetSpeed: 0, motorTemp: 32, escTemp: 25, batteryTemp: 25, ah: 0, wh: 0, distance: 0, tacho: 0, throttle: 0 });
  const [sim, setSim] = useState({
    speed: 0, erpm: 0, duty: 0, current: 0, voltage, power: 0,
    motorTemp: 32, escTemp: 25, batteryTemp: 25, ah: 0, wh: 0, distance: 0, tacho: 0,
  });

  useEffect(() => {
    if (!scanning) return;
    const baseName = controller?.name || "VESC";
    const names = [baseName];
    let i = 0;
    const id = setInterval(() => {
      if (i < 1) {
        setDevices(prev => [...prev, {
          name: names[0],
          rssi: -35 - Math.floor(Math.random() * 45),
          addr: Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':').toUpperCase(),
        }]);
        i++;
      } else {
        clearInterval(id);
        setScanning(false);
      }
    }, 500);
    return () => clearInterval(id);
  }, [scanning]);

  useEffect(() => {
    if (connecting) {
      const t = setTimeout(() => { setConnected(true); setConnecting(false); }, 1800);
      return () => clearTimeout(t);
    }
  }, [connecting]);

  useEffect(() => { if (autoConnect) setConnected(true); }, [autoConnect]);

  // Physics-based telemetry simulation
  useEffect(() => {
    if (!connected || liveData) return;
    const id = setInterval(() => {
      const s = simState.current;
      const dt = 0.1;
      s.throttle += (Math.random() - 0.5) * 0.15;
      s.throttle = Math.max(0, Math.min(1, s.throttle));
      if (Math.random() < 0.05) s.throttle *= 0.3;

      const maxSpeed = vehicle?.topSpeed || 50;
      s.targetSpeed = (params.motorCurrentMax ?? 80) > 0 ? s.throttle * maxSpeed : 0;
      s.speed += (s.targetSpeed - s.speed) * 2.0 * dt;
      s.speed = Math.max(0, s.speed);

      const mechRpm = (s.speed / 3.6) / motorProfile.wheelCircumference * 60 * motorProfile.ratio;
      const polePairs = (params.motorPoles || 30) / 2;
      const erpm = Math.round(mechRpm * polePairs);
      const duty = Math.min(95, (s.speed / maxSpeed) * 100);
      const baseCurrent = params.motorCurrentMax ?? 80;
      const current = s.throttle * baseCurrent;
      const capacity = build?.parts?.battery?.capacity || 15;
      const rPack = 0.15 / Math.max(1, capacity / 10);
      const vActual = voltage - current * rPack * 0.5;
      const power = current * vActual;

      const motorHeat = (current / Math.max(1, baseCurrent)) ** 2 * 0.8;
      const escHeat = (current / Math.max(1, baseCurrent)) ** 2 * 0.5;
      const batteryHeat = Math.pow(current / Math.max(20, capacity * 3), 2) * 0.22;
      const airflow = s.speed / maxSpeed * 0.5;
      s.motorTemp += (motorHeat - 0.3 - airflow * 0.4) * dt;
      s.escTemp += (escHeat - 0.2 - airflow * 0.3) * dt;
      s.batteryTemp += (batteryHeat - 0.035 - airflow * 0.04) * dt;
      s.motorTemp = Math.max(22, Math.min(160, s.motorTemp));
      s.escTemp = Math.max(22, Math.min(100, s.escTemp));
      s.batteryTemp = Math.max(22, Math.min(80, s.batteryTemp));

      s.ah += (current / 3600) * dt;
      s.wh += (power / 3600) * dt;
      s.distance += (s.speed / 3.6) * dt / 1000;
      s.tacho += erpm * dt / 60;

      setSim({
        speed: s.speed, erpm, duty, current: parseFloat(current.toFixed(1)), voltage: parseFloat(vActual.toFixed(1)),
        power: Math.round(power), motorTemp: parseFloat(s.motorTemp.toFixed(1)), escTemp: parseFloat(s.escTemp.toFixed(1)), batteryTemp: parseFloat(s.batteryTemp.toFixed(1)),
        ah: s.ah, wh: s.wh, distance: s.distance, tacho: s.tacho,
      });

      if (s.motorTemp > 140 && !faultCode) setFaultCode("OVERTEMP_MOTOR");
      else if (s.escTemp > 90 && !faultCode) setFaultCode("OVERTEMP_MOSFET");
      else if (current > baseCurrent * 1.3 && !faultCode) setFaultCode("OVERCURRENT");
      else if (s.motorTemp < 100 && s.escTemp < 80 && faultCode) setFaultCode(null);
    }, 100);
    return () => clearInterval(id);
  }, [connected, liveData, params.motorCurrentMax, params.motorPoles, voltage, vehicle, build, faultCode]);

  const liveDistance = liveData?.distance ?? sim.distance;
  const liveWh = liveData?.energyUsedWh ?? liveDistance * Math.max(12, ((vehicle?.watts || 600) / Math.max(25, vehicle?.topSpeed || 50)) * 1.35);
  const wheelCircumference = motorProfile.wheelCircumference;
  const rtData = liveData ? {
    speed: liveData.speed || 0,
    erpm: Math.round((liveData.speed || 0) / 3.6 / wheelCircumference * 60 * motorProfile.ratio * ((params.motorPoles || motorProfile.poles) / 2)),
    duty: liveData.duty || 0, current: liveData.phaseAmps || 0,
    voltage: parseFloat(liveData.voltage || voltage),
    power: Math.round((liveData.phaseAmps || 0) * parseFloat(liveData.voltage || voltage)),
    motorTemp: liveData.motorTemp ?? 32, escTemp: liveData.escTemp ?? 25, batteryTemp: liveData.batteryTemp ?? 25,
    ah: liveWh / Math.max(1, parseFloat(liveData.voltage || voltage)), wh: liveWh, distance: liveDistance,
    rideSeconds: liveData.rideSeconds || 0,
    batteryPct: liveData.batteryPct,
    lifetimeKm: liveData.lifetimeKm || 0,
    tacho: (liveDistance * 1000 / wheelCircumference) * motorProfile.ratio * ((params.motorPoles || motorProfile.poles) / 2),
  } : sim;

  const updateParam = (key, value) => {setDirty(true);setConfigStatus("Unsaved changes");setParams(prev => {
    const next = { ...prev, [key]: value };
    return next;
  });};
  const applyDetection = result => setParams(prev => {
    const next = { ...prev, motorPoles: result.poles, motorResistance: result.r / 1000,
      motorInductance: result.l / 1000000, motorFluxLinkage: result.lambda / 1000,
      motorKV: result.kv, hallOffsets: [result.hall1, result.hall2, result.hall3],
      motorProfileId: result.id, motorType: 'foc' };
    localStorage.setItem(vescKey, JSON.stringify(next));
    writtenParams.current={...next};setDirty(false);setConfigStatus("Configuration written");
    return next;
  });
  const handleDisconnect = () => { setConnected(false); setDevices([]); simState.current = { speed: 0, targetSpeed: 0, motorTemp: 32, escTemp: 25, batteryTemp: 25, ah: 0, wh: 0, distance: 0, tacho: 0, throttle: 0 }; };

  return (
    <div className="vesc-tool flex items-center justify-center p-2 sm:p-4 origin-top">
      <div className="vesc-tool-shell w-[360px] rounded-[40px] bg-[#081424] p-3 shadow-2xl shadow-emerald-950/50 border border-blue-900/60 relative scale-[0.82] sm:scale-100 origin-top">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-b-2xl z-20" />
        <div className="vesc-tool-screen rounded-[30px] bg-[#050d1a] overflow-hidden h-[640px] flex flex-col font-mono text-[11px] relative">

          <div className="px-4 py-2.5 flex items-center justify-between border-b border-blue-900/40 bg-[#081424] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-wide block leading-tight">VESC Tool</span>
                <span className="text-xs text-blue-300/60 leading-none">{controller?.name || "Stock controller"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-blue-900"}`} />
              <Bluetooth className={`h-3.5 w-3.5 ${connected ? "text-blue-400" : "text-blue-900"}`} />
              <span className={`text-[9px] ${connected ? "text-blue-400" : "text-blue-900"}`}>{tr(connected ? "ONLINE" : "OFFLINE")}</span>
            </div>
          </div>
          <div className="vesc-device-strip px-4 py-3 flex-shrink-0 border-b border-emerald-900/50">
            <div className="text-sm font-semibold text-white truncate">{vehicle?.name}</div>
            <div className="text-xs text-slate-400 truncate">{motorProfile.name}</div>
            <div className="flex gap-3 mt-2 text-xs text-emerald-300"><span>{voltage} V</span><span>{params.motorPoles} {tr("poles")}</span><span>{tr("Game motor simulation")}</span></div>
          </div>

          {connected && faultCode && (
            <div className="px-3 py-1.5 bg-red-500/20 border-b border-red-500/40 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">FAULT: {faultCode}</span>
              <button onClick={() => setFaultCode(null)} className="ml-auto text-[9px] text-red-300/60 hover:text-red-300">{tr("CLEAR")}</button>
            </div>
          )}

          {!connected ? (
            <ConnectionScreen scanning={scanning} devices={devices} onScan={() => { setDevices([]); setScanning(true); }} onConnect={() => setConnecting(true)} connecting={connecting} />
          ) : (
            <>
              <div className="vesc-content flex-1 min-h-0 overflow-y-auto no-scrollbar">
                {['motor', 'battery', 'app'].includes(tab) && <div className="px-3 py-2 text-emerald-300 bg-emerald-950/40">{tr(dirty?"Unsaved changes":"Configuration loaded")}</div>}
                {tab === 'motor' && <button className="m-3 px-3 border border-emerald-700 rounded-lg text-emerald-300" onClick={() => {setDirty(true);setConfigStatus("Unsaved changes");setParams(prev => ({ ...prev, motorCurrentMax: maxAmps, batteryCurrentMax: ratedBatteryAmps }));}}>{tr('Use build current limits')}</button>}
                {tab === "rtdata" && <VESCRTData data={rtData} vehicle={vehicle} params={params} />}
                {tab === "motor" && <VESCConfig type="motor" params={params} update={updateParam} maxAmps={maxAmps} voltage={voltage} />}
                {tab === "battery" && <VESCConfig type="battery" params={params} update={updateParam} maxAmps={maxAmps} voltage={voltage} />}
                {tab === "app" && <VESCConfig type="app" params={params} update={updateParam} maxAmps={maxAmps} />}
                {tab === "detect" && <VESCDetection profile={motorProfile} onApply={applyDetection} />}
                {tab === "info" && <InfoPanel controller={controller} voltage={voltage} params={params} motorProfile={motorProfile} escTemp={rtData.escTemp} onDisconnect={handleDisconnect} />}
              </div>
              <div className="vesc-config-actions"><span role="status">{tr(configStatus)}</span><div><button type="button" onClick={readConfig} aria-label="Read configuration">{tr('Read configuration')}</button><button type="button" disabled={!dirty} onClick={writeConfig} aria-label="Write configuration">{tr('Write configuration')}{dirty?' •':''}</button></div></div>
              <div className="vesc-tabbar flex border-t border-blue-900/40 bg-[#081424] flex-shrink-0">
                {TABS.map(t => (
                  <button key={t.id} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${tab === t.id ? "text-blue-400" : "text-blue-300/30"}`}>
                    <t.icon className="h-4 w-4" />
                    <span className="text-[8px] uppercase">{tr(t.label)}</span>
                    {tab === t.id && <div className="h-0.5 w-6 rounded-full bg-blue-400" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectionScreen({ scanning, devices, onScan, onConnect, connecting }) {
  const { t } = useLanguage();
  return (
    <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto bg-[#050d1a]">
      <div className="text-center mb-6">
        <div className="inline-flex h-16 w-16 rounded-full bg-blue-500/10 border border-blue-500/30 items-center justify-center mb-3">
          <Bluetooth className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t("Connect to VESC")}</h2>
        <p className="text-[10px] text-blue-300/60 mt-1">{t("Scan for nearby BLE devices")}</p>
      </div>
      {!scanning && devices.length === 0 && !connecting && (
        <button onClick={onScan} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
          <Search className="h-4 w-4" /> {t("Scan for Devices")}
        </button>
      )}
      {scanning && (
        <div className="text-center py-4">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-2" />
          <p className="text-[10px] text-blue-400 animate-pulse">{t("Scanning for BLE devices...")}</p>
        </div>
      )}
      {devices.length > 0 && !connecting && (
        <div className="space-y-2">
          {devices.map((d, i) => (
            <button key={i} onClick={onConnect} className="w-full rounded-xl bg-[#0d1b2e] border border-blue-900/40 p-3 flex items-center justify-between hover:border-blue-500/60 transition-colors">
              <div className="flex items-center gap-2">
                <Bluetooth className="h-4 w-4 text-blue-400" />
                <div>
                  <span className="text-xs font-bold text-white block">{d.name}</span>
                  <span className="text-[8px] text-blue-300/40 font-mono">{d.addr}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[9px] font-bold ${d.rssi > -60 ? "text-green-400" : d.rssi > -80 ? "text-yellow-400" : "text-red-400"}`}>{d.rssi} dBm</div>
                <div className="text-[7px] text-blue-300/40">{t("SIGNAL")}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {connecting && (
        <div className="text-center py-4">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-2" />
          <p className="text-[10px] text-blue-400 animate-pulse">{t("Establishing connection...")}</p>
          <p className="text-[8px] text-blue-300/40 mt-1">{t("Negotiating BLE GATT...")}</p>
        </div>
      )}
    </div>
  );
}

function InfoPanel({ controller, voltage, params, motorProfile, escTemp, onDisconnect }) {
  const { t } = useLanguage();
  const hwName = controller?.id?.includes("tronic") ? "75/300 R2" : controller?.id?.includes("makerx") ? "DV6" : controller?.id?.includes("flipsky") ? "75100" : "4.12";
  return (
    <div className="p-3 space-y-3 bg-[#0a1424]">
      <div className="rounded-xl bg-[#0d1b2e] p-4 space-y-2.5 border border-blue-900/40">
        <div className="text-[9px] text-blue-400/80 uppercase tracking-widest font-bold mb-1">Hardware</div>
        <InfoRow label="HW Version" value={hwName} />
        <InfoRow label="FW Version" value="6.02 (FW 5.3)" />
        <InfoRow label="VESC Name" value={controller?.name || "Unknown"} />
        <InfoRow label="UUID" value="3C:15:B2:7A:9F:0E" />
        <InfoRow label="Firmware Date" value="2026-08-15" />
        <InfoRow label="MCU Temp" value={`${escTemp.toFixed(0)}°C`} />
      </div>
      <div className="rounded-xl bg-[#0d1b2e] p-4 space-y-2.5 border border-blue-900/40">
        <div className="text-[9px] text-blue-400/80 uppercase tracking-widest font-bold mb-1">{t("Motor")}</div>
        <InfoRow label="Motor" value={motorProfile.name} />
        <InfoRow label="Motor Poles" value={`${params.motorPoles} (${params.motorPoles / 2} pairs)`} />
        {params.motorProfileId === motorProfile.id && params.motorKV != null && <InfoRow label="Detected KV" value={`${params.motorKV} RPM/V`} />}
        <InfoRow label="Battery Cells" value={`${Math.round(voltage / 3.6)}S`} />
        <InfoRow label="Nominal Voltage" value={`${voltage}V`} />
        <InfoRow label="Max Voltage" value={`${(voltage * 1.17).toFixed(1)}V`} />
      </div>
      <div className="rounded-xl bg-[#0d1b2e] p-4 space-y-2.5 border border-blue-900/40">
        <div className="text-[9px] text-blue-400/80 uppercase tracking-widest font-bold mb-1">Connection</div>
        <InfoRow label="Protocol" value="BLE 5.0" />
        <InfoRow label="Baud Rate" value="115200" />
        <InfoRow label="Latency" value="12ms" />
      </div>
      <button onClick={onDisconnect} className="w-full rounded-xl bg-red-500/10 border border-red-500/30 py-2.5 text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors">
        <RotateCcw className="h-3.5 w-3.5" /> {t("Disconnect")}
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-blue-300/60">{label}</span>
      <span className="text-xs font-bold text-white">{value}</span>
    </div>
  );
}
