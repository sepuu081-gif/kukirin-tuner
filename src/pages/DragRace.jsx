import RaceRidePreview from '../components/RaceRidePreview';
import {submitScore} from '../lib/leaderboard';
import { getTires, saveTires, tireEffects, wearTires } from "../lib/rideUpgrades";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { VEHICLES } from "../lib/vehicleData";
import { getAllBuilds, calcBuildStats, getBuild } from "../lib/buildState";
import { ArrowLeft, Flag, Wifi, Users, Copy, Loader2 } from "lucide-react";
import { useLanguage } from "../lib/i18n";
import { CAREER_EVENTS, completeCareerRace, getCareer } from "../lib/careerState";
import { startEngineSound, updateEngineSound, stopEngineSound } from '../lib/soundEngine';

function getRespect() { try { return parseInt(localStorage.getItem("kukirin_respect") || "0"); } catch { return 0; } }
function addRespect(n) { localStorage.setItem("kukirin_respect", String(getRespect() + n)); }

// AI opponent pool
const AI_OPPONENTS = [
  { id: "ai_rookie",   name: "Rookie Rick",    emoji: "🟢", skill: 0.72, vehicle: "Stock G2 (48V)",       topSpeed: 50,  accel: 0.9 },
  { id: "ai_tuner",    name: "Tuner Tom",      emoji: "🔵", skill: 0.88, vehicle: "Tuned G2 Max",         topSpeed: 75,  accel: 1.4 },
  { id: "ai_sleeper",  name: "Sleeper Sam",    emoji: "🟠", skill: 0.94, vehicle: "VESC G2 52V",          topSpeed: 90,  accel: 1.9 },
  { id: "ai_elite",    name: "Elite Eddy",     emoji: "🔴", skill: 0.98, vehicle: "Dualtron Thunder 3",   topSpeed: 110, accel: 2.8 },
  { id: "ai_legend",   name: "Legend Luca",    emoji: "🟡", skill: 1.0,  vehicle: "Rion Apex 88.8V",     topSpeed: 128, accel: 3.5 },
  { id: "ai_sebius",   name: "Sebius Steve",   emoji: "🩷", skill: 0.96, vehicle: "Sebius Wrapped G2",   topSpeed: 100, accel: 2.2 },
];

const TRACK_DISTANCE = 400; // metres

export default function DragRace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const query = new URLSearchParams(location.search);
  const careerEventId = query.get("career");
  const careerEvent = CAREER_EVENTS.find((item) => item.id === careerEventId);
  const queryVehicle = query.get("vehicle");
  const queryOpponent = query.get("opponent");
  const builds = getAllBuilds();
  const vehiclesWithBuilds = VEHICLES.filter(v => builds[v.id]);

  const [selectedVehicleId, setSelectedVehicleId] = useState(VEHICLES.some((item) => item.id === queryVehicle) ? queryVehicle : vehiclesWithBuilds[0]?.id || VEHICLES[0].id);
  const [selectedOpponent, setSelectedOpponent] = useState(() => {
    const base = AI_OPPONENTS.find((item) => item.id === queryOpponent) || AI_OPPONENTS[0];
    return careerEvent ? { ...base, topSpeed: careerEvent.opponentTopSpeed, accel: careerEvent.opponentAccel } : base;
  });
  const [raceMode, setRaceMode] = useState("ai");
  const [onlineStatus, setOnlineStatus] = useState("idle");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [onlineError, setOnlineError] = useState("");
  const [remoteRacer, setRemoteRacer] = useState(null);
  const [phase, setPhase] = useState("select"); // select | countdown | racing | result
  const [countdown, setCountdown] = useState(3);
  const [playerPos, setPlayerPos] = useState(0);
  const [aiPos, setAiPos] = useState(0);
  const [playerSpeed, setPlayerSpeed] = useState(0);
  const [aiSpeed, setAiSpeed] = useState(0);
  const [playerTime, setPlayerTime] = useState(null);
  const [aiTime, setAiTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [winner, setWinner] = useState(null);
  const [respectEarned, setRespectEarned] = useState(0);
  const [careerReward, setCareerReward] = useState(null);
  const [careerBreakdown, setCareerBreakdown] = useState(null);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kukirin_drag_history") || "[]"); } catch { return []; }
  });

  const scoreSubmitted = useRef(false);
  const keys = useRef({ w: false });
  const startTime = useRef(0);
  const playerFinished = useRef(false);
  const aiFinished = useRef(false);
  const playerPosRef = useRef(0);
  const aiPosRef = useRef(0);
  const playerSpeedRef = useRef(0);
  const aiSpeedRef = useRef(0);
  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const lastNetworkSend = useRef(0);
  const careerProcessedRef = useRef(false);

  const vehicle = VEHICLES.find(v => v.id === selectedVehicleId) || VEHICLES[0];
  const build = getBuild(selectedVehicleId);
  const stats = calcBuildStats(vehicle, build);
  const activeOpponent = raceMode === "online"
    ? { id: "online", name: remoteRacer?.name || t("Waiting for racer"), vehicle: remoteRacer?.vehicle || "P2P", topSpeed: remoteRacer?.topSpeed || 0, emoji: "🌐" }
    : selectedOpponent;

  const sendOnline = useCallback((message) => {
    if (connectionRef.current?.open) connectionRef.current.send(message);
  }, []);

  const closeOnline = useCallback(() => {
    connectionRef.current?.close();
    peerRef.current?.destroy();
    connectionRef.current = null;
    peerRef.current = null;
    setOnlineStatus("idle");
    setRoomCode("");
    setRemoteRacer(null);
  }, []);

  const resetRaceState = useCallback(() => {
    scoreSubmitted.current=false;
    playerPosRef.current = 0; aiPosRef.current = 0;
    playerSpeedRef.current = 0; aiSpeedRef.current = 0;
    playerFinished.current = false; aiFinished.current = false;
    setPlayerPos(0); setAiPos(0);
    setPlayerSpeed(0); setAiSpeed(0);
    setPlayerTime(null); setAiTime(null);
    setElapsed(0); setWinner(null);
    setCareerReward(null);
    setCareerBreakdown(null);
    careerProcessedRef.current = false;
    setPhase("countdown"); setCountdown(3);
  }, []);

  const bindConnection = useCallback((connection) => {
    connectionRef.current = connection;
    connection.on("open", () => {
      setOnlineStatus("connected");
      setOnlineError("");
      connection.send({ type: "hello", name: localStorage.getItem("kukirin_rider_name") || "Rider", vehicle: vehicle.name, topSpeed: stats.topSpeed, voltage: stats.voltage, watts: stats.watts });
    });
    connection.on("data", (message) => {
      if (!message || typeof message !== "object") return;
      if (message.type === "hello") setRemoteRacer(message);
      if (message.type === "start") resetRaceState();
      if (message.type === "telemetry") {
        aiPosRef.current = Number(message.position) || 0;
        aiSpeedRef.current = Number(message.speed) || 0;
        setAiPos(Math.min(aiPosRef.current, TRACK_DISTANCE));
        setAiSpeed(aiSpeedRef.current);
      }
      if (message.type === "finish") {
        aiFinished.current = true;
        setAiTime(Number(message.time));
      }
      if (message.type === "build") setRemoteRacer(message);
    });
    connection.on("close", () => {
      connectionRef.current = null;
      setOnlineStatus("disconnected");
      setOnlineError(t("Other racer disconnected"));
    });
    connection.on("error", () => setOnlineError(t("P2P connection failed")));
  }, [resetRaceState, stats.topSpeed, stats.voltage, stats.watts, t, vehicle.name]);

  const createOnlineRoom = async () => {
    closeOnline();
    setOnlineStatus("connecting");
    setOnlineError("");
    try {
      const { Peer } = await import("peerjs");
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const peer = new Peer(`kukirin-${code.toLowerCase()}`);
      peerRef.current = peer;
      peer.on("open", () => { setRoomCode(code); setOnlineStatus("hosting"); });
      peer.on("connection", bindConnection);
      peer.on("error", (error) => { setOnlineStatus("error"); setOnlineError(error?.type === "unavailable-id" ? t("Room code collision. Try again.") : t("Could not reach P2P server")); });
    } catch {
      setOnlineStatus("error");
      setOnlineError(t("Could not start online race"));
    }
  };

  const joinOnlineRoom = async () => {
    const code = joinCode.trim().toLowerCase();
    if (!code) return;
    closeOnline();
    setOnlineStatus("connecting");
    setOnlineError("");
    try {
      const { Peer } = await import("peerjs");
      const peer = new Peer();
      peerRef.current = peer;
      peer.on("open", () => bindConnection(peer.connect(`kukirin-${code}`, { reliable: true })));
      peer.on("error", () => { setOnlineStatus("error"); setOnlineError(t("Room not found or connection failed")); });
    } catch {
      setOnlineStatus("error");
      setOnlineError(t("Could not join online race"));
    }
  };

  useEffect(() => () => {
    connectionRef.current?.close();
    peerRef.current?.destroy();
  }, []);

  useEffect(() => {
    sendOnline({ type: "build", name: localStorage.getItem("kukirin_rider_name") || "Rider", vehicle: vehicle.name, topSpeed: stats.topSpeed, voltage: stats.voltage, watts: stats.watts });
  }, [selectedVehicleId, sendOnline, stats.topSpeed, stats.voltage, stats.watts, vehicle.name]);

  const startRace = () => {
    startEngineSound(vehicle, stats);
    resetRaceState();
    if (raceMode === "online") sendOnline({ type: "start" });
  };

  useEffect(() => {
    if (phase === 'racing' || phase === 'countdown') startEngineSound(vehicle, stats);
    else stopEngineSound();
    return () => stopEngineSound();
  }, [phase, vehicle, stats.watts, stats.motorCount]);

  useEffect(() => {
    if (phase === 'racing') updateEngineSound(playerSpeed, keys.current.w ? 1 : .05);
  }, [phase, playerSpeed]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { setPhase("racing"); startTime.current = Date.now(); return; }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, countdown]);

  // Race loop
  const tick = useCallback(() => {
    if (phase !== "racing") return;
    const now = Date.now();
    const t = (now - startTime.current) / 1000;
    setElapsed(t);

    // Player physics
    const tires=getTires(vehicle, build);
    const tyre=tireEffects(vehicle, tires);
    const maxSpd = stats.topSpeed;
    const speedMs = playerSpeedRef.current / 3.6;
    const systemMass = stats.totalWeight + 78;
    const driveForce = stats.mechanicalPower / Math.max(4 / (stats.torqueFactor || 1), speedMs);
    const dragForce = 0.5 * 1.225 * (stats.aeroCdA || 0.58) * speedMs ** 2 + 0.016 * tyre.rolling * systemMass * 9.81;
    const acceleration = Math.max(-2, Math.min(8.2, (driveForce - dragForce) / systemMass));
    const accelStep = acceleration * tyre.grip * 0.08 * 3.6;
    if (keys.current.w) {
      playerSpeedRef.current = Math.min(playerSpeedRef.current + accelStep, maxSpd);
    } else {
      playerSpeedRef.current = Math.max(playerSpeedRef.current - maxSpd / 200, 0);
    }
    playerPosRef.current += (playerSpeedRef.current / 3600) * 1000 * (80 / 1000); // 80ms tick
    saveTires(vehicle.id, wearTires(tires, playerSpeedRef.current * .08 / 3600, { throttle:keys.current.w ? 1 : 0, rate:tyre.wearRate }));
    setPlayerSpeed(playerSpeedRef.current);
    setPlayerPos(Math.min(playerPosRef.current, TRACK_DISTANCE));

    if (raceMode === "ai") {
      // AI physics — consistent but slightly random
      const aiMaxSpd = selectedOpponent.topSpeed;
      const aiAccel = selectedOpponent.accel * (0.95 + Math.random() * 0.08);
      aiSpeedRef.current = Math.min(aiSpeedRef.current + aiAccel, aiMaxSpd);
      aiPosRef.current += (aiSpeedRef.current / 3600) * 1000 * (80 / 1000);
      setAiSpeed(aiSpeedRef.current);
      setAiPos(Math.min(aiPosRef.current, TRACK_DISTANCE));
    } else if (now - lastNetworkSend.current > 140) {
      lastNetworkSend.current = now;
      sendOnline({ type: "telemetry", position: playerPosRef.current, speed: playerSpeedRef.current, elapsed: t });
    }

    // Finish detection
    if (raceMode === "ai" && aiPosRef.current >= TRACK_DISTANCE && !aiFinished.current) {
      aiFinished.current = true;
      setAiTime(t);
    }
    if (playerPosRef.current >= TRACK_DISTANCE && !playerFinished.current) {
      playerFinished.current = true;
      setPlayerTime(t);
      if (raceMode === "online") sendOnline({ type: "finish", time: t });
    }
    if (playerFinished.current && aiFinished.current) {
      const pWon = (playerTime || t) <= (aiTime || t);
      setWinner(pWon ? "player" : "ai");
    }
  }, [phase, stats, selectedOpponent, playerTime, aiTime, raceMode, sendOnline]);

  useEffect(() => {
    if (phase !== "racing") return;
    const id = setInterval(tick, 80);
    return () => clearInterval(id);
  }, [phase, tick]);

  // Finish when both done
  useEffect(() => {
    if (playerTime !== null && aiTime !== null) {
      const pWon = playerTime <= aiTime;
      setWinner(pWon ? "player" : "ai");
      setPhase("result");
      if(!scoreSubmitted.current){scoreSubmitted.current=true;submitScore("drag",playerTime,vehicle.name);}

      const rep = pWon
        ? raceMode === "online" ? 150
          : selectedOpponent.id === "ai_legend" ? 200
          : selectedOpponent.id === "ai_elite" ? 120
          : selectedOpponent.id === "ai_sleeper" ? 70
          : selectedOpponent.id === "ai_sebius" ? 90
          : 40
        : raceMode === "online" ? 20 : 10;
      addRespect(rep);
      setRespectEarned(rep);

      if (careerEvent && !careerProcessedRef.current) {
        careerProcessedRef.current = true;
        const result = completeCareerRace(careerEvent.id, pWon);
        if (result.firstWin) {
          addRespect(careerEvent.rewardRep);
          setRespectEarned(rep + careerEvent.rewardRep);
          setCareerReward({ xp: careerEvent.rewardXp, vehicleId: careerEvent.unlockVehicle });
        } else {
          setCareerReward({ xp: pWon ? 30 : 10, vehicleId: null });
        }

        const wearKey = `kukirin_career_wear_${vehicle.id}`;
        const previousWear = Number(localStorage.getItem(wearKey) || 0);
        const powerRatio = Math.max(1, stats.watts / Math.max(1, vehicle.watts));
        const nextWear = previousWear + 0.025 + Math.min(0.04, (powerRatio - 1) * 0.004) + (pWon ? 0 : 0.015);
        if (damageEnabled() && nextWear >= 1) {
          localStorage.setItem(wearKey, "0");
          const raceCount = getCareer().races;
          const failures = [
            { part: "motor", code: "ERR_MOTOR_BEARING" },
            { part: "controller", code: "ERR_ESC_OVERCURRENT" },
            { part: "wheel", code: "ERR_TIRE_BLOWOUT" },
            { part: "battery", code: "ERR_CELL_IMBALANCE" },
          ];
          const failure = failures[raceCount % failures.length];
          const list = JSON.parse(localStorage.getItem("kukirin_broken_parts") || "[]");
          list.push({ ...failure, vehicleId: vehicle.id, vehicleName: vehicle.name, date: new Date().toISOString() });
          localStorage.setItem("kukirin_broken_parts", JSON.stringify(list));
          setCareerBreakdown(failure.code);
        } else {
          if (damageEnabled()) localStorage.setItem(wearKey, nextWear.toFixed(4));
        }
      }

      const entry = {
        date: new Date().toLocaleDateString(),
        vehicle: vehicle.name,
        opponent: activeOpponent.name,
        playerTime: playerTime.toFixed(3),
        aiTime: aiTime.toFixed(3),
        won: pWon,
      };
      const h = [entry, ...history].slice(0, 10);
      setHistory(h);
      localStorage.setItem("kukirin_drag_history", JSON.stringify(h));
    }
  }, [playerTime, aiTime]);

  useEffect(() => {
    if (phase !== "racing" && phase !== "countdown") { keys.current.w = false; return; }
    const down = (e) => { if (e.key === "w" || e.key === "W") { e.preventDefault(); keys.current.w = true; } };
    const up   = (e) => { if (e.key === "w" || e.key === "W") keys.current.w = false; };
    const blur = () => { keys.current.w = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [phase]);

  const playerPct = Math.min((playerPos / TRACK_DISTANCE) * 100, 100);
  const aiPct = Math.min((aiPos / TRACK_DISTANCE) * 100, 100);

  return (
    <div className="app-surface min-h-screen bg-background font-mono">
      <header className="app-header border-b border-border bg-card/80 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(careerEvent ? "/career" : "/", { replace: true })} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">{careerEvent ? "Career" : "Garage"}</span>
          </button>
          <div className="h-4 w-px bg-border" />
          <Flag className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Drag Race — 400m</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* SELECT PHASE */}
        {phase === "select" && (
          <div className="space-y-5">
            {careerEvent && <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 text-center"><div className="text-xs font-bold text-yellow-400">CAREER · {careerEvent.title}</div><div className="text-[9px] text-muted-foreground">Win to unlock the next scooter. Repeated hard racing causes persistent damage.</div></div>}
            {!careerEvent && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setRaceMode("ai")}
                className={`min-h-11 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${raceMode === "ai" ? "bg-primary text-black" : "text-muted-foreground"}`}
              >
                <Flag className="mr-1.5 inline h-3.5 w-3.5" /> {t("Race AI")}
              </button>
              <button
                onClick={() => setRaceMode("online")}
                className={`min-h-11 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${raceMode === "online" ? "bg-cyan-400 text-slate-950" : "text-muted-foreground"}`}
              >
                <Users className="mr-1.5 inline h-3.5 w-3.5" /> {t("Online P2P")}
              </button>
            </div>
            )}
            {/* Vehicle select */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Your Build</p>
              <select
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
                disabled={!!careerEvent}
                className="min-h-12 w-full rounded-lg border border-primary/30 bg-card px-3 text-xs font-bold text-foreground outline-none focus:border-primary"
              >
                {(careerEvent ? VEHICLES.filter((item) => item.id === careerEvent.vehicleId) : VEHICLES).map((item) => (
                  <option key={item.id} value={item.id}>{builds[item.id] ? "★ " : ""}{item.name}</option>
                ))}
              </select>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2">
                <span className="text-xs font-bold text-foreground">{vehicle.name}</span>
                <span className="text-[10px] text-cyan-300">{stats.topSpeed.toFixed(0)} km/h · {stats.voltage}V · {(stats.watts / 1000).toFixed(1)}kW</span>
              </div>
            </div>

            {/* Opponent select */}
            {raceMode === "ai" && !careerEvent ? <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Opponent</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AI_OPPONENTS.map(op => (
                  <button key={op.id} onClick={() => setSelectedOpponent(op)}
                    className={`rounded-lg border p-3 text-left transition-all ${selectedOpponent.id === op.id ? "border-primary/60 bg-primary/5" : "border-border bg-card hover:border-primary/20"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{op.emoji}</span>
                      <div>
                        <div className="text-xs font-bold text-foreground">{op.name}</div>
                        <div className="text-[10px] text-muted-foreground">{op.vehicle} · {op.topSpeed} km/h</div>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${op.skill * 100}%` }} />
                    </div>
                  </button>
                ))}
              </div>
            </div> : !careerEvent ? (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Wifi className={`h-4 w-4 ${navigator.onLine ? "text-cyan-400" : "text-red-400"}`} />
                  <div>
                    <div className="text-xs font-bold text-foreground">{t("Private P2P Drag Race")}</div>
                    <div className="text-[9px] text-muted-foreground">{t("Internet is used to connect; race data travels directly between phones.")}</div>
                  </div>
                </div>

                {(onlineStatus === "idle" || onlineStatus === "error" || onlineStatus === "disconnected") && (
                  <>
                    <button onClick={createOnlineRoom} className="w-full rounded-lg bg-cyan-400 py-3 text-xs font-bold text-slate-950 uppercase tracking-wider">
                      {t("Create Room")}
                    </button>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground"><div className="h-px flex-1 bg-border" />{t("OR JOIN") }<div className="h-px flex-1 bg-border" /></div>
                    <div className="flex gap-2">
                      <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase().slice(0, 8))} placeholder={t("ROOM CODE")} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm font-bold uppercase tracking-[0.25em] text-foreground" />
                      <button onClick={joinOnlineRoom} className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 text-xs font-bold text-cyan-300">{t("JOIN")}</button>
                    </div>
                  </>
                )}

                {onlineStatus === "connecting" && <div className="flex items-center justify-center gap-2 py-4 text-xs text-cyan-300"><Loader2 className="h-4 w-4 animate-spin" /> {t("Connecting...")}</div>}
                {onlineStatus === "hosting" && (
                  <div className="text-center space-y-2">
                    <div className="text-[9px] text-muted-foreground uppercase">{t("Give this code to the other racer")}</div>
                    <button onClick={() => navigator.clipboard?.writeText(roomCode)} className="mx-auto flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-background px-5 py-3 text-xl font-bold tracking-[0.3em] text-cyan-300">
                      {roomCode} <Copy className="h-4 w-4" />
                    </button>
                    <div className="text-[10px] text-cyan-300 animate-pulse">{t("Waiting for racer...")}</div>
                  </div>
                )}
                {onlineStatus === "connected" && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 flex items-center justify-between">
                    <div><div className="text-xs font-bold text-green-400">{t("Racer connected")}</div><div className="text-[10px] text-muted-foreground">{activeOpponent.name} · {activeOpponent.vehicle}</div></div>
                    <div className="text-right text-[10px] text-cyan-300">{activeOpponent.topSpeed.toFixed(0)} km/h</div>
                  </div>
                )}
                {onlineError && <div className="text-[10px] text-red-400">{onlineError}</div>}
              </div>
            ) : <div className="rounded-xl border border-primary/30 bg-card p-3 text-left"><div className="text-[9px] text-muted-foreground">CAREER OPPONENT</div><div className="text-xs font-bold text-foreground">{selectedOpponent.emoji} {selectedOpponent.name}</div><div className="text-[10px] text-muted-foreground">{selectedOpponent.vehicle} · {selectedOpponent.topSpeed} km/h</div></div>}

            <button onClick={startRace} disabled={raceMode === "online" && onlineStatus !== "connected"}
              className="w-full rounded-md bg-gradient-to-r from-primary to-orange-400 py-3 text-sm font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-40">
              [ LINE UP ]
            </button>

            {/* History */}
            {history.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Recent Races</p>
                <div className="space-y-1.5">
                  {history.slice(0, 5).map((h, i) => (
                    <div key={i} className={`rounded-md border px-3 py-2 flex items-center justify-between text-[10px] ${h.won ? "border-green-500/30 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                      <div>
                        <span className="font-bold text-foreground">{h.vehicle}</span>
                        <span className="text-muted-foreground"> vs {h.opponent}</span>
                      </div>
                      <div className="text-right">
                        <div className={h.won ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{h.won ? "WIN" : "LOSS"}</div>
                        <div className="text-muted-foreground">{h.playerTime}s</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === "countdown" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{vehicle.name} vs {activeOpponent.name}</div>
            <div className={`font-mono text-8xl font-bold tabular-nums ${countdown > 0 ? "text-yellow-400" : "text-green-400"} transition-all`}>
              {countdown > 0 ? countdown : "GO!"}
            </div>
            <div className="text-[10px] text-muted-foreground">Hold [W] to accelerate</div>
          </div>
        )}

        {/* RACING */}
        {phase === "racing" && (
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
              <span>0m</span><span>{elapsed.toFixed(1)}s</span><span>400m</span>
            </div>

            <div className="race-ride-preview"><RaceRidePreview vehicle={vehicle} build={build} speed={playerSpeed} distance={playerPos/1000} seconds={elapsed} label={`${careerEvent?"CAREER":"DRAG"} · ${playerPos.toFixed(0)} / 400 m · ${activeOpponent.name}`}/></div>
            {/* Track - You */}
            <div className="rounded-lg border border-primary/30 bg-card p-3 space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-primary font-bold">YOU — {vehicle.name}</span>
                <span className="text-foreground">{playerSpeed.toFixed(0)} km/h · {playerPos.toFixed(0)}m</span>
              </div>
              <div className="relative h-3 bg-secondary rounded-md overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-primary/20 rounded-md transition-all duration-100" style={{ width: `${playerPct}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-100" style={{ left: `${Math.min(playerPct, 94)}%` }}>
                  <span className="text-xs">●</span>
                </div>
                {playerPct >= 100 && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-400">FINISH</div>}
              </div>
            </div>

            {/* Track - AI */}
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground font-bold">{activeOpponent.emoji} {activeOpponent.name} — {activeOpponent.vehicle}</span>
                <span className="text-foreground">{aiSpeed.toFixed(0)} km/h · {aiPos.toFixed(0)}m</span>
              </div>
              <div className="relative h-3 bg-secondary rounded-md overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-red-500/20 rounded-md transition-all duration-100" style={{ width: `${aiPct}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-100" style={{ left: `${Math.min(aiPct, 94)}%` }}>
                  <span className="text-xs">●</span>
                </div>
                {aiPct >= 100 && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-400">FINISH</div>}
              </div>
            </div>

            {/* Mobile GAS button */}
            <button
              onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); keys.current.w = true; }}
              onPointerUp={() => { keys.current.w = false; }}
              onPointerCancel={() => { keys.current.w = false; }}
              onLostPointerCapture={() => { keys.current.w = false; }}
              style={{ touchAction: 'none' }}
              className="w-full rounded-xl bg-primary/20 border border-primary/40 py-4 text-primary font-bold text-lg active:bg-primary/40 select-none"
            >
              [W] GAS — HOLD TO ACCELERATE
            </button>
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && (
          <div className="space-y-5 text-center">
            <div className={`text-6xl font-bold ${winner === "player" ? "text-green-400" : "text-red-400"}`}>
              {winner === "player" ? "WIN! 🏆" : "LOSS 💀"}
            </div>
            <div className="rounded-lg border border-border bg-card p-5 space-y-3 text-left">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">YOUR TIME</span>
                <span className={`font-bold ${winner === "player" ? "text-green-400" : "text-foreground"}`}>{playerTime?.toFixed(3)}s</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{activeOpponent.name}</span>
                <span className={`font-bold ${winner === "ai" ? "text-green-400" : "text-foreground"}`}>{aiTime?.toFixed(3)}s</span>
              </div>
              <div className="flex justify-between text-[11px] border-t border-border pt-3">
                <span className="text-yellow-400">Respect Earned</span>
                <span className="font-bold text-yellow-400">+{respectEarned} REP</span>
              </div>
            </div>
            {careerReward && <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs text-cyan-300">CAREER +{careerReward.xp} XP{careerReward.vehicleId ? ` · NEW SCOOTER UNLOCKED` : ""}</div>}
            {careerBreakdown && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400">⚠ SCOOTER BROKE: {careerBreakdown} · REPAIR REQUIRED</div>}
            {winner === "ai" && (
              <p className="text-[11px] text-muted-foreground">Upgrade your build in the Build Shop for better performance.</p>
            )}
            <div className="flex gap-3">
              <button onClick={startRace} className="flex-1 rounded-md bg-primary/10 border border-primary/40 py-2.5 text-xs font-bold text-primary uppercase tracking-widest hover:bg-primary/20 transition-all">
                Rematch
              </button>
              <button onClick={() => careerEvent ? navigate('/career') : setPhase("select")} className="flex-1 rounded-md bg-card border border-border py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:border-primary/30 transition-all">
                {careerEvent ? "Career Map" : "Change Setup"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
import { damageEnabled } from '../lib/gameSettings';
