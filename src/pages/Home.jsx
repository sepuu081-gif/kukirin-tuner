import { useState, useEffect } from "react";
import { VEHICLES, SERIES, SECRET_CODES } from "../lib/vehicleData";
import { getAllBuilds } from "../lib/buildState";
import VehicleCard from "../components/VehicleCard";
import FailureCodeTable from "../components/FailureCodeTable";
import { Zap, AlertTriangle, Search, Trash2, Unlock, KeyRound, Star, Trophy, ChevronDown, ChevronUp, Flag, Activity, Wrench, Users, Volume2, VolumeX, Home as HomeIcon, Settings, Map } from "lucide-react";
import Maintenance from "./Maintenance";
import ShareCard from "../components/ShareCard";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import appIcon from "../assets/app-icon.png";
import { isSoundEnabled, setSoundEnabled } from "../lib/soundEngine";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../lib/i18n";
import { getUnlockedCodes, redeemSecretCode } from '../lib/codeRewards';

export function getRespect() {
  try { const value = Number(localStorage.getItem("kukirin_respect")); return Number.isFinite(value) ? Math.max(0, value) : 0; } catch { return 0; }
}
export function addRespect(n) {
  const cur = getRespect();
  localStorage.setItem("kukirin_respect", String(cur + n));
}
const TABS = ["garage", "failures", "codes", "maintenance", "profile"];

export default function Home() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab]       = useState("garage");
  useEffect(() => {
    const back = (event) => {
      if (activeTab !== 'garage') { event.preventDefault(); setActiveTab('garage'); }
    };
    window.addEventListener('kukirin:back-request', back);
    return () => window.removeEventListener('kukirin:back-request', back);
  }, [activeTab]);
  const [activeSeries, setActiveSeries] = useState("ALL");
  const [search, setSearch]             = useState("");
  const [redeemCode, setRedeemCode]     = useState("");
  const [redeemStatus, setRedeemStatus] = useState(null);
  const [unlockedCodes, setUnlockedCodes] = useState(getUnlockedCodes);
  const [respect, setRespect]           = useState(getRespect);
  const [showAllSeries, setShowAllSeries] = useState(false);
  const [builds, setBuilds]             = useState({});
  const [soundOn, setSoundOn]           = useState(isSoundEnabled);
  const [riderName, setRiderName] = useState(() => localStorage.getItem("kukirin_rider_name") || "");
  const [riderBio, setRiderBio]   = useState(() => localStorage.getItem("kukirin_rider_bio") || "");
  const [riderLoc, setRiderLoc]   = useState(() => localStorage.getItem("kukirin_rider_loc") || "");

  const saveProfile = () => {
    localStorage.setItem("kukirin_rider_name", riderName);
    localStorage.setItem("kukirin_rider_bio", riderBio);
    localStorage.setItem("kukirin_rider_loc", riderLoc);
  };

  useEffect(() => {
    if (localStorage.getItem('kukirin_unlock_all') === 'true' || getUnlockedCodes().includes('UNLOCKALL')) {
      redeemSecretCode('UNLOCKALL');
      setUnlockedCodes(getUnlockedCodes());
    }
    setBuilds(getAllBuilds());
    setRespect(getRespect());
  }, [activeTab]);

  // Refresh respect when tab regains focus (after coming back from drag/dyno)
  useEffect(() => {
    const onFocus = () => setRespect(getRespect());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const isUnlocked = (key) => localStorage.getItem(key) === "true";
  const fullyUnlocked = isUnlocked("kukirin_unlock_fullthrot");

  const handleRedeem = () => {
    const result = redeemSecretCode(redeemCode);
    setRedeemStatus(result);
    setRespect(getRespect());
    setUnlockedCodes(getUnlockedCodes());
    if (result.success) setRedeemCode("");
  };

  const hasWrapG2 = localStorage.getItem("kukirin_unlock_wrapg2") === "true";

  const filtered = VEHICLES.filter((v) => {
    if (v.id === "sebius_g2_wrapped" && !hasWrapG2) return false;
    const matchesSeries = activeSeries === "ALL" || v.series === activeSeries;
    const matchesSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.desc?.toLowerCase().includes(search.toLowerCase());
    return matchesSeries && matchesSearch;
  });

  const seriesEntries = Object.entries(SERIES);
  const visibleSeries = showAllSeries ? seriesEntries : seriesEntries.slice(0, 6);

  const respectLevel = respect >= 5000 ? "LEGENDARY" : respect >= 2000 ? "ELITE" : respect >= 500 ? "SLEEPER" : respect >= 100 ? "TUNER" : "ROOKIE";
  const respectColor = respect >= 5000 ? "text-yellow-400" : respect >= 2000 ? "text-rose-400" : respect >= 500 ? "text-primary" : respect >= 100 ? "text-cyan-400" : "text-muted-foreground";

  // Fans = respect / 10, rounded
  const fans = Math.floor(respect / 10);
  const fansLabel = fans >= 1000 ? `${(fans/1000).toFixed(1)}K` : String(fans);

  return (
    <div className="app-surface min-h-screen bg-gradient-to-b from-background via-background to-card/20 font-sans">
      {/* ── Header ── */}
      <header className="app-header border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-50 relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />
        <div className="max-w-6xl mx-auto px-3 py-2 flex items-center justify-between sm:px-4 sm:py-3">
          <div className="flex items-center gap-2.5">
            <img src={appIcon} alt="" className="h-9 w-9 rounded-xl border border-primary/30 object-cover shadow-lg shadow-primary/20 sm:h-10 sm:w-10" />
            <div>
              <h1 className="font-mono text-sm font-bold text-foreground tracking-tight">KuKirin Tuner</h1>
              <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-[0.18em] sm:text-[9px] sm:tracking-widest">Under-Deck Racing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/settings" className="back-touch text-primary" aria-label={t('Settings')}><Settings className="h-5 w-5" /></Link>
            <Link to="/leaderboard" className="text-xs text-sky-300">🏆</Link><LanguageToggle compact />
            <div className="hidden sm:flex items-center gap-2 rounded-md border border-border/50 bg-card px-2.5 py-1.5">
              <Trophy className="h-3.5 w-3.5 text-yellow-400" />
              <span className={`font-mono text-[10px] font-bold ${respectColor}`}>{respect} REP</span>
              <span className={`font-mono text-[9px] ${respectColor} opacity-70`}>{respectLevel}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-border/50 bg-card px-2.5 py-1.5">
              <Users className="h-3.5 w-3.5 text-pink-400" />
              <span className="font-mono text-[10px] font-bold text-pink-400">{fansLabel}</span>
              <span className="font-mono text-[9px] text-muted-foreground">fans</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono text-[9px] text-green-400 uppercase tracking-wider">Online</span>
            </div>
            <button
              onClick={() => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary transition-all hover:bg-primary/15 active:scale-95"
              aria-label={soundOn ? t("Mute sounds") : t("Enable sounds")}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={() => { if (window.confirm(t("Wipe ALL build progression?"))) { localStorage.removeItem("kukirin_builds"); window.location.reload(); } }}
              className="hidden sm:flex h-10 w-10 items-center justify-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/5 p-0 font-mono text-[9px] text-red-400 uppercase tracking-wider hover:bg-red-500/15 active:scale-95 transition-all sm:h-11 sm:w-auto sm:min-w-11 sm:rounded-md sm:px-3 sm:py-2"
            >
              <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t("Reset")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="mobile-main-nav fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl sm:sticky sm:top-[57px] sm:border-t-0 sm:border-b sm:bg-card/30">
        <div className="mx-auto grid max-w-6xl grid-cols-5 sm:flex sm:px-4">
          {[
            { id: "garage",      label: t("Garage"),   icon: Zap },
            { id: "failures",    label: t("Failures"), icon: AlertTriangle },
            { id: "codes",       label: t("Codes"),    icon: KeyRound },
            { id: "maintenance", label: t("Service"),  icon: Wrench },
            { id: "profile",     label: t("Profile"),  icon: Star },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 border-t-2 px-1 py-2 font-mono text-[8px] uppercase tracking-wide transition-all sm:flex-row sm:gap-1.5 sm:border-t-0 sm:border-b-2 sm:px-4 sm:py-3 sm:text-[11px] sm:tracking-wider ${
                  activeTab === t.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-3 py-3 pb-24 sm:px-4 sm:py-6 sm:pb-6">
        {/* ── GARAGE ── */}
        {activeTab === "garage" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("Search vehicles…")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-mono text-sm bg-card border-border" />
            </div>

            {/* Series filter */}
            <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              <FilterChip active={activeSeries === "ALL"} onClick={() => setActiveSeries("ALL")}>{t("All")} ({VEHICLES.length})</FilterChip>
              {visibleSeries.map(([key, s]) => (
                <FilterChip key={key} active={activeSeries === key} onClick={() => setActiveSeries(key)}>
                  {s.name} ({VEHICLES.filter(v => v.series === key).length})
                </FilterChip>
              ))}
              <button
                onClick={() => setShowAllSeries(x => !x)}
                className="flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-3.5 py-2 font-mono text-[10px] text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground active:scale-95"
              >
                {showAllSeries ? <><ChevronUp className="h-3 w-3" /> {t("Less")}</> : <><ChevronDown className="h-3 w-3" /> {t("More")}</>}
              </button>
            </div>

            {/* Quick launchers */}
            <div className="mobile-quick-launchers grid grid-cols-2 lg:grid-cols-6 gap-3">
              <Link to="/stunt" className="group min-h-[92px] rounded-lg border border-cyan-400/40 bg-card p-3"><strong>{t("Stunt park")}</strong><p className="text-xs text-muted-foreground">{t("Wheelies, jumps and scrapes")}</p></Link>
              <Link to="/city" className="group min-h-[92px] rounded-lg border border-blue-400/40 bg-gradient-to-br from-blue-500/15 to-card p-3 hover:border-blue-400/70 active:scale-[0.98] transition-all sm:p-4">
                <div className="flex items-center gap-2 mb-1"><Map className="h-4 w-4 text-blue-300"/><span className="font-mono text-xs font-bold text-foreground">{t("City Ride")}</span></div>
                <p className="font-mono text-[10px] text-muted-foreground">{t("Traffic, missions and city map.")}</p>
              </Link>
              <Link to="/house" className="group min-h-[92px] rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-card p-3 hover:border-cyan-400/60 active:scale-[0.98] transition-all sm:p-4">
                <div className="flex items-center gap-2 mb-1"><HomeIcon className="h-4 w-4 text-cyan-300"/><span className="font-mono text-xs font-bold text-foreground">{t("My House")}</span></div>
                <p className="font-mono text-[10px] text-muted-foreground">{t("Park and charge your vehicles.")}</p>
              </Link>
              <Link to="/career" className="group min-h-[92px] rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-card p-3 hover:border-yellow-500/60 active:scale-[0.98] transition-all sm:p-4">
                <div className="flex items-center gap-2 mb-1"><Trophy className="h-4 w-4 text-yellow-400"/><span className="font-mono text-xs font-bold text-foreground">Career Mode</span></div>
                <p className="font-mono text-[10px] text-muted-foreground">Unlock scooters. Race. Repair damage.</p>
              </Link>
              <Link to="/drag" className="group min-h-[92px] rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-card p-3 hover:border-primary/60 hover:from-primary/10 active:scale-[0.98] transition-all sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Flag className="h-4 w-4 text-primary" />
                  <span className="font-mono text-xs font-bold text-foreground">{t("Drag Race")}</span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">{t("Race AI. 400m sprint.")}</p>
              </Link>
              <Link to="/dyno" className="group min-h-[92px] rounded-lg border border-accent/30 bg-gradient-to-br from-accent/5 to-card p-3 hover:border-accent/60 hover:from-accent/10 active:scale-[0.98] transition-all sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-accent" />
                  <span className="font-mono text-xs font-bold text-foreground">{t("Dyno Room")}</span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">{t("Power curve. +15 REP.")}</p>
              </Link>
              <Link to="/repair" className="group min-h-[92px] rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-card p-3 hover:border-yellow-500/60 hover:from-yellow-500/10 active:scale-[0.98] transition-all sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className="h-4 w-4 text-yellow-400" />
                  <span className="font-mono text-xs font-bold text-foreground">{t("Repair Garage")}</span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">{t("Fix broken parts. Diagnose.")}</p>
              </Link>
              <Link to="/fanfeed" className="group min-h-[92px] rounded-lg border border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-card p-3 hover:border-pink-500/60 hover:from-pink-500/10 active:scale-[0.98] transition-all sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-pink-400" />
                  <span className="font-mono text-xs font-bold text-foreground">{t("Rider Feed")}</span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">{t("Videos and your riding clips.")}</p>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {filtered.map((v) => (
                <VehicleCard key={v.id} vehicle={v} hasBuild={!!builds[v.id]} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground font-mono text-sm">{t("No vehicles match.")}</div>
            )}
          </div>
        )}

        {/* ── MAINTENANCE ── */}
        {activeTab === "maintenance" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h2 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider">{t("Service & Maintenance Log")}</h2>
            </div>
            <Maintenance />
          </div>
        )}

        {/* ── FAILURE CODES ── */}
        {activeTab === "failures" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h2 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider">{t("Destructive Telemetry Matrix")}</h2>
            </div>
            <FailureCodeTable />
          </div>
        )}

        {/* ── CODES ── */}
        {activeTab === "codes" && (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <h2 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider">{t("Unlock Codes")}</h2>
            </div>

            {/* Redeem input */}
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <p className="font-mono text-[11px] text-muted-foreground">{t('Enter a code. Rewards are saved; each code can be redeemed once.')}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => { setRedeemCode(e.target.value); setRedeemStatus(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                  aria-label={t('Secret code')}
                  placeholder="ENTER CODE..."
                  className="flex-1 min-w-0 min-h-11 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm uppercase tracking-widest placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={handleRedeem}
                  className="rounded-md bg-primary/10 border border-primary/40 px-4 py-2 font-mono text-xs text-primary font-bold uppercase tracking-wider hover:bg-primary/20 transition-all"
                >
                  Unlock
                </button>
              </div>
              {redeemStatus?.success === false && (
                <p className="font-mono text-[11px] text-red-400">
                  {t(redeemStatus.duplicate ? "Already unlocked." : "Invalid code. Try again.")}
                </p>
              )}
              {redeemStatus?.success === true && (
                <div className="rounded-md border border-green-500/40 bg-green-500/5 p-3 space-y-1">
                  <p className="font-mono text-[11px] text-green-400 font-bold">✓ {SECRET_CODES[redeemStatus.code]?.hidden?'SPECIAL FEATURE':redeemStatus.code} UNLOCKED</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{t(redeemStatus.reward)}</p>
                  <p className="font-mono text-[10px] text-yellow-400">+50 respect earned</p>
                </div>
              )}
            </div>

            {/* Unlocked list */}
            {unlockedCodes.length > 0 && (
              <div className="space-y-2">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Unlocked ({unlockedCodes.length}/{Object.keys(SECRET_CODES).length})</p>
                {unlockedCodes.filter(code=>!SECRET_CODES[code]?.hidden).map((code) => (
                  <div key={code} className="rounded-md border border-border bg-card px-3 py-2 font-mono text-[10px] flex items-center gap-2">
                    <Unlock className="h-3 w-3 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">{code}</span>
                    <span className="text-muted-foreground ml-auto">{SECRET_CODES[code]?.reward?.slice(0, 40)}…</span>
                  </div>
                ))}
              </div>
            )}

            {/* All codes list */}
            <div className="rounded-lg border border-border/40 bg-card/30 p-4 font-mono text-[10px] text-muted-foreground space-y-2">
              <div className="text-foreground font-bold mb-2 text-xs">All Codes ({Object.keys(SECRET_CODES).length} total)</div>
              {Object.entries(SECRET_CODES).filter(([,data])=>!data.hidden).map(([code, data]) => {
                const earned = unlockedCodes.includes(code);
                return (
                  <div key={code} className={`flex items-start gap-2 rounded px-2 py-1.5 border transition-all ${earned ? "border-yellow-500/30 bg-yellow-500/5" : "border-border/30"}`}>
                    <span className="text-[10px] mt-0.5">{earned ? "🔓" : "🔒"}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`font-bold tracking-widest ${earned ? "text-yellow-400" : "text-foreground"}`}>{code}</span>
                      <span className="text-muted-foreground ml-2 text-[9px] leading-relaxed">{data.reward.slice(0, 60)}{data.reward.length > 60 ? "…" : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === "profile" && (
          <div className="space-y-5 max-w-lg mx-auto">
            <div className="rounded-xl border border-sky-800 bg-sky-950/30 p-3 text-sky-200">{t('Best trick score')}: {Number(localStorage.getItem('kukirin_best_trick_score')) || 0}</div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-yellow-400" />
              <h2 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider">{t("Rider Profile")}</h2>
            </div>

            {/* Rider profile editor */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-black">
                  {riderName ? riderName[0].toUpperCase() : "?"}
                </div>
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Rider Profile</div>
                  <div className="font-mono text-sm font-bold text-foreground">{riderName || "Unnamed Rider"}</div>
                  {riderLoc && <div className="font-mono text-[9px] text-muted-foreground">📍 {riderLoc}</div>}
                </div>
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Rider Name</label>
                <input
                  type="text"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  onBlur={saveProfile}
                  placeholder="Enter your name..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Bio</label>
                <textarea
                  value={riderBio}
                  onChange={(e) => setRiderBio(e.target.value)}
                  onBlur={saveProfile}
                  placeholder="Tell the community about your builds..."
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Location</label>
                <input
                  type="text"
                  value={riderLoc}
                  onChange={(e) => setRiderLoc(e.target.value)}
                  onBlur={saveProfile}
                  placeholder="City, Country..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              {riderBio && <p className="font-mono text-[10px] text-muted-foreground italic border-l-2 border-primary/30 pl-2">{riderBio}</p>}
            </div>

            {/* Fans card */}
            <div className="rounded-xl border border-pink-500/20 bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-cyan-400 flex items-center justify-center text-lg font-bold text-white">♪</div>
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Your Fanbase</div>
                  <div className="font-mono text-2xl font-bold text-pink-400">{fansLabel}</div>
                  <div className="font-mono text-[9px] text-muted-foreground">fans · based on {respect} REP</div>
                </div>
              </div>
              <div className="text-right">
                <ShareCard
                  title="My KuKirin Profile"
                  vehicleName={`${respectLevel} Rider`}
                  stats={[{ label: "REP", value: String(respect) }, { label: "Fans", value: fansLabel }, { label: "Rank", value: respectLevel }]}
                  badge={respect >= 500 ? `${respectLevel} rider` : null}
                />
                <p className="font-mono text-[9px] text-muted-foreground mt-1">Share profile</p>
              </div>
            </div>

            {/* Respect card */}
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
              <div className={`font-mono text-5xl font-bold ${respectColor} tabular-nums`}>{respect}</div>
              <div className={`font-mono text-xs uppercase tracking-widest ${respectColor}`}>{respectLevel}</div>
              <div className="font-mono text-[10px] text-muted-foreground">Community Respect Points</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-3">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (respect % 500) / 5)}%` }} />
              </div>
              <div className="font-mono text-[9px] text-muted-foreground">
                {respect < 100 ? `${100 - respect} to TUNER` : respect < 500 ? `${500 - respect} to SLEEPER` : respect < 2000 ? `${2000 - respect} to ELITE` : respect < 5000 ? `${5000 - respect} to LEGENDARY` : "MAX RANK"}
              </div>
            </div>

            {/* Badges */}
            <div>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Badges</p>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(SECRET_CODES).filter(([,data])=>!data.hidden).map(([code, data]) => {
                  const earned = unlockedCodes.includes(code);
                  return (
                    <div key={code} className={`rounded-lg border p-3 text-center transition-all ${earned ? "border-yellow-500/40 bg-yellow-500/5" : "border-border/30 opacity-40"}`}>
                      <div className="font-mono text-lg mb-1">{earned ? "🏆" : "🔒"}</div>
                      <div className="font-mono text-[9px] text-foreground font-bold">{code}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Saved Builds */}
            <div>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Saved Builds ({Object.keys(builds).length})</p>
              <div className="space-y-2">
                {Object.entries(builds).map(([vid, b]) => {
                  const v = VEHICLES.find(x => x.id === vid);
                  if (!v) return null;
                  const partCount = Object.values(b.parts || {}).filter(Boolean).length;
                  return (
                    <div key={vid} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between font-mono text-xs">
                      <div>
                        <div className="font-bold text-foreground">{v.name}</div>
                        <div className="text-muted-foreground text-[10px]">{partCount} parts · Welded ×{b.weldCount}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.weldCount > 0 && <span className="text-orange-400 text-[9px]">STRETCHED</span>}
                        {b.screenDeleteInstalled && <span className="text-lime-400 text-[9px]">PHONE</span>}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(builds).length === 0 && (
                  <div className="text-muted-foreground font-mono text-[11px] text-center py-4">No builds saved yet. Start in the Garage.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-9 shrink-0 rounded-full px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider border transition-all active:scale-95 ${
        active
          ? "bg-primary/10 border-primary/40 text-primary"
          : "bg-card border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
