import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { VEHICLES, PARTS_CATALOG, BMS_CATALOG } from "../lib/vehicleData";
import { getBuild, saveBuild, checkPartFit, calcBuildStats, getMaxFrameSize } from "../lib/buildState";
import TireWorkshop from "../components/TireWorkshop";
import PartImage from '../components/PartImage';
import PartComparison from "../components/PartComparison";
import WeldEffect from "../components/WeldEffect";
import AppearanceEditor from "../components/AppearanceStudio";
import VehicleRideArt from "../components/VehicleRideArt";
import { ArrowLeft, Hammer, ChevronRight, CheckCircle, Package, Smartphone, Unplug, Shield, Activity, Search, SlidersHorizontal } from "lucide-react";
import VESCPhoneApp from "../components/VESCPhoneApp";
import CustomPartBuilder, { getCustomParts } from "../components/CustomPartBuilder";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "../lib/i18n";

const PART_CATEGORIES = [
  { id: "motor",        label: "Motor" },
  { id: "controller",   label: "Controller" },
  { id: "battery",      label: "Battery" },
  { id: "bms",          label: "BMS" },
  { id: "wheel",        label: "Wheels" },
  { id: "gearing",      label: "Final Drive" },
  { id: "suspension",   label: "Suspension" },
  { id: "brakes",       label: "Brakes" },
  { id: "damper",       label: "Damper" },
  { id: "wheelie_bar",  label: "Stunt Bar" },
  { id: "vesc_display", label: "VESC Screen" },
  { id: "electronics",  label: "Electronics" },
  { id: "cooling",      label: "Cooling" },
  { id: "screen_delete",label: "Screen Delete" },
];

const TABS = [
  { id: "build",      label: "Build" },
  { id: "tuning",     label: "VESC Tuning" },
  { id: "custom",     label: "Custom Parts" },
  { id: "appearance", label: "Appearance" },
  { id: "preview",    label: "Preview" },
];

export default function BuildShop() {
  const { t: tr } = useLanguage();
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const vehicle = VEHICLES.find((v) => v.id === vehicleId);
  const [build, setBuild] = useState(() => getBuild(vehicleId));
  const [activeCategory, setActiveCategory] = useState("motor");
  const [activeTab, setActiveTab] = useState(() => {
    const requested = new URLSearchParams(location.search).get('tab');
    return TABS.some(tab => tab.id === requested) ? requested : 'build';
  });
  const [comparison, setComparison] = useState(null);
  const [pendingPart, setPendingPart] = useState(null);
  const [partSearch, setPartSearch] = useState("");
  const [compatibleOnly, setCompatibleOnly] = useState(false);

  const hasFullThrot = localStorage.getItem("kukirin_unlock_fullthrot") === "true";
  const hasBlacksite = localStorage.getItem("kukirin_unlock_blacksite") === "true";
  const showSecret   = hasFullThrot || hasBlacksite;
  const hasVesc = !!(build.parts?.controller?.id?.toLowerCase().includes("vesc") || build.parts?.controller?.tunable);
  const visibleTabs = hasVesc ? TABS : TABS.filter(t => t.id !== "tuning");

  useEffect(() => { saveBuild(build); }, [build]);
  useEffect(() => {
    const requested = new URLSearchParams(location.search).get('tab');
    setActiveTab(TABS.some(tab => tab.id === requested) ? requested : 'build');
  }, [location.search]);
  useEffect(() => { if (activeTab === "tuning" && !hasVesc) setActiveTab("build"); }, [activeTab, hasVesc]);

  if (!vehicle) return (
    <div className="min-h-screen bg-background flex items-center justify-center font-mono text-muted-foreground">
      {tr("Vehicle not found.")}
    </div>
  );

  const stats     = calcBuildStats(vehicle, build);
  const frameSize = getMaxFrameSize(vehicle, build.weldCount);

  const getParts = (cat) => {
    const dedicatedSeries = ["SURRON", "STARK"].includes(vehicle.series);
    const matchesVehicle = (part) => !part.forVehicles || part.forVehicles.includes(vehicle.id);
    const matchesSeries = (part) => part.forSeries?.includes(vehicle.series) && matchesVehicle(part);
    if (cat === "bms") return BMS_CATALOG.filter((part) => dedicatedSeries ? matchesSeries(part) : !part.forSeries);
    const custom = cat==='wheelie_bar'?[]:getCustomParts().filter(p => p.category === cat);
    const stock  = PARTS_CATALOG.filter((p) => p.category === cat
      && (!p.secret || showSecret)
      && (dedicatedSeries ? matchesSeries(p) : !p.forSeries && matchesVehicle(p)));
    return [...custom, ...stock];
  };

  const equip = (part) => {
    if (part.id?.startsWith("bms_") || BMS_CATALOG.find(b => b.id === part.id)) {
      setBuild(b => ({ ...b, bms: part }));
      return;
    }
    if (!checkPartFit(part, vehicle, build.weldCount)) {
      setPendingPart(part); return;
    }
    setPendingPart(null);
    setBuild(b => ({ ...b, parts: { ...b.parts, [part.category]: part } }));
  };

  const weld = () => {
    setBuild(b => {
      const next = { ...b, weldCount: b.weldCount + 1, frameExpansion: (b.frameExpansion || 0) + 1 };
      if (pendingPart && checkPartFit(pendingPart, vehicle, next.weldCount)) {
        next.parts = { ...next.parts, [pendingPart.category]: pendingPart };
        setPendingPart(null);
      }
      return next;
    });
  };

  const currentParts = getParts(activeCategory).filter((part) => {
    const searchMatch = `${part.name} ${part.desc || ""}`.toLowerCase().includes(partSearch.trim().toLowerCase());
    const fits = activeCategory === "bms" || checkPartFit(part, vehicle, build.weldCount);
    return searchMatch && (!compatibleOnly || fits);
  });
  const installedPart = activeCategory === "bms" ? build.bms : build.parts[activeCategory];

  return (
    <div className={`build-shop build-shop-${activeTab} app-surface min-h-screen bg-background font-sans`}>
      {/* Header */}
      <header className="app-header border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link replace to={`/vehicle/${vehicleId}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider">{tr("Back")}</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <Hammer className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs font-semibold text-foreground">{tr("Build Shop")} — {vehicle.name}</span>
          {build.weldCount > 0 && (
            <Badge className="ml-auto font-mono text-[10px] bg-orange-500/20 text-orange-400 border-orange-500/30">
              WELDED ×{build.weldCount}
            </Badge>
          )}
        </div>
      </header>

      <main className="build-shop-main max-w-5xl mx-auto px-3 py-4 pb-24 sm:px-4 sm:py-5">
        {activeTab !== "appearance" && activeTab !== "preview" && <>
        {/* Stats bar */}
        <div className="build-stats mb-4 rounded-lg border border-border bg-card p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <Stat label={tr("Est. Top Speed")} value={`${stats.topSpeed.toFixed(0)} km/h`} accent />
          <Stat label={tr("Voltage")} value={`${stats.voltage}V`} />
          <Stat label={tr("Motor Amps")} value={`${stats.maxAmps}A`} />
          <Stat label={tr("Frame")} value={`${frameSize}/10`} />
          <Stat label={tr("Weight")} value={`${stats.totalWeight.toFixed(0)} kg`} />
        </div>

        <TireWorkshop key={build.parts?.wheel?.id || 'stock'} vehicle={vehicle} build={build} />
        <div className="upgrade-actions mb-4">
          <button onClick={() => navigate(`/stunt?vehicle=${vehicleId}`)}>{tr('Stunt park')}</button><button onClick={() => navigate(`/telemetry/${vehicleId}?practice=training`)}>{tr('Riding training')}</button>
          <button onClick={() => { saveBuild(build); navigate(`/telemetry/${vehicleId}?practice=trial`); }}>{tr('Garage test track')} · 60 s</button>
        </div>
        </>}
        {/* Tabs */}
        <div className="build-tabs no-scrollbar mb-5 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate({ pathname: location.pathname, search: `?tab=${t.id}` }, { replace: true })}
              className={`min-h-11 min-w-[78px] flex-1 rounded-md px-2 py-2 font-mono text-xs uppercase tracking-wider transition-all active:scale-[0.98] ${
                activeTab === t.id
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tr(t.label)}
            </button>
          ))}
        </div>

        {/* ── BUILD TAB ── */}
        {activeTab === "build" && (
          <div className="build-picker grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left sidebar */}
            <div className="build-sidebar lg:col-span-1 space-y-2">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{tr("Slots")}</p>
              <select
                className="landscape-category-select"
                value={activeCategory}
                onChange={(event) => { setActiveCategory(event.target.value); setComparison(null); }}
                aria-label="Part category"
              >
                {PART_CATEGORIES.map((cat) => {
                  const part = cat.id === "bms" ? build.bms : build.parts[cat.id];
                  return <option key={cat.id} value={cat.id}>{tr(cat.label)}{part ? ` · ${part.name}` : ` · ${tr("Empty")}`}</option>;
                })}
              </select>
              <div className="part-slot-list">
                {PART_CATEGORIES.map((cat) => {
                  const p = cat.id === "bms" ? build.bms : build.parts[cat.id];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategory(cat.id); setComparison(null); }}
                      className={`part-slot min-h-[58px] w-full rounded-md border p-3 text-left transition-all active:scale-[0.99] ${
                        activeCategory === cat.id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border bg-card hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{tr(cat.label)}</span>
                        <ChevronRight className={`h-3 w-3 ${activeCategory === cat.id ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="mt-0.5 font-mono text-xs font-semibold text-foreground">
                        {p ? (
                          <span className="flex items-center gap-1.5">
                            {cat.id === "bms" ? <Shield className="h-3 w-3 text-cyan-400" /> : <CheckCircle className="h-3 w-3 text-green-400" />}
                            {p.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 italic text-[10px]">{tr("Empty")}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Screen Delete shortcut */}
              <div className="build-actions">
                {!(["SURRON", "STARK"].includes(vehicle.series)) && (() => {
                  const sd = build.screenDeleteInstalled;
                  return sd ? (
                    <div className="rounded-md border border-lime-500/30 bg-lime-500/5 p-2.5 font-mono text-[10px] text-lime-400 flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5" /> PHONE + KILLSWITCH ACTIVE
                    </div>
                  ) : (
                    <button
                      onClick={() => setBuild(b => ({ ...b,
                        parts: { ...b.parts,
                          screen_delete: { id: "screen_delete_full",  name: "Screen Delete Kit",  category: "screen_delete" },
                          rfid:          { id: "rfid_kill_switch",    name: "RFID Kill Switch",   category: "screen_delete" },
                          phone_mount:   { id: "quad_lock_phone_mount",name:"Quad Lock Mount",    category: "screen_delete" },
                          bt_module:     { id: "vesc_tool_bt_module", name: "VESC BT Module",     category: "screen_delete" },
                        }, screenDeleteInstalled: true
                      }))}
                      className="w-full rounded-md border border-lime-500/40 bg-lime-500/10 py-2 font-mono text-[10px] font-bold text-lime-400 uppercase tracking-widest hover:bg-lime-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Unplug className="h-3.5 w-3.5" /> CONVERT — PHONE + KILLSWITCH
                    </button>
                  );
                })()}

                <button
                  onClick={() => navigate(`/telemetry/${vehicleId}`)}
                  className="w-full mt-1 rounded-md bg-gradient-to-r from-primary to-orange-400 py-2.5 font-mono text-sm font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                  [ {tr("DEPLOY BUILD")} ]
                </button>
                <button
                  onClick={() => navigate(`/dyno?vehicle=${vehicleId}`)}
                  className="w-full rounded-md border border-accent/40 bg-accent/10 py-2 font-mono text-xs font-bold text-accent uppercase tracking-widest hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
                >
                  <Activity className="h-3.5 w-3.5" /> {tr("Send to Dyno")}
                </button>
              </div>
            </div>

            {/* Right: Parts catalog */}
            <div className="build-catalog lg:col-span-2 space-y-2">
              <div className="part-catalog-heading">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  {tr(PART_CATEGORIES.find(c => c.id === activeCategory)?.label)} — {tr("Select Part")}
                </p>
                <span>{currentParts.length}</span>
              </div>
              <div className="part-tools">
                <label><Search aria-hidden="true" /><input value={partSearch} onChange={(event) => setPartSearch(event.target.value)} placeholder={tr("Search parts…")} aria-label={tr("Search parts…")} /></label>
                <button type="button" aria-pressed={compatibleOnly} onClick={() => setCompatibleOnly((value) => !value)}><SlidersHorizontal aria-hidden="true" />{tr("Fits only")}</button>
              </div>
              {comparison && <PartComparison vehicle={vehicle} build={build} part={comparison} isBms={activeCategory === 'bms'} installed={installedPart?.id === comparison.id} fits={activeCategory === 'bms' || checkPartFit(comparison, vehicle, build.weldCount)} onClose={() => setComparison(null)} onInstall={() => { equip(comparison); setComparison(null); }} />}
              <div className="part-catalog-list space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {currentParts.map((part) => {
                  const isBms   = activeCategory === "bms";
                  const fits    = isBms ? true : checkPartFit(part, vehicle, build.weldCount);
                  const installed = installedPart?.id === part.id;
                  return (
                    <div
                      key={part.id}
                      onClick={() => setComparison(part)}
                      className={`part-card rounded-lg border p-3 cursor-pointer transition-all ${
                        installed
                          ? "border-green-500/40 bg-green-500/5"
                          : fits
                          ? "border-border bg-card hover:border-primary/40"
                          : "border-yellow-500/20 bg-card hover:border-yellow-500/40"
                      }`}
                    >
                      <PartImage part={part} category={isBms?"bms":part.category}/>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Package className={`h-3.5 w-3.5 flex-shrink-0 ${installed ? "text-green-400" : fits ? "text-primary" : "text-yellow-500"}`} />
                          <span className="font-mono text-xs font-semibold text-foreground">{part.name}</span>
                          {installed && <Badge className="font-mono text-[9px] bg-green-500/20 text-green-400 border-green-500/30">{tr("INSTALLED")}</Badge>}
                          {!fits && !isBms && <Badge className="font-mono text-[9px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{tr("OVERSIZED")}</Badge>}
                          {part.secret && <Badge className="font-mono text-[9px] bg-rose-500/20 text-rose-400 border-rose-500/30">{tr("CLASSIFIED")}</Badge>}
                        </div>
                        <span className="font-mono text-xs text-primary font-bold flex-shrink-0">
                          {part.price === 0 ? tr("FREE") : `$${part.price}`}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-muted-foreground">{part.desc}</p>
                      <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground/70">
                        {part.sizeClass && <span>SIZE {part.sizeClass}</span>}
                        {part.watts && <span>{part.watts}W</span>}
                        {part.motorCount === 2 && <span className="text-sky-300">AWD · 2× HUB</span>}
                        {part.voltage && <span>{part.voltage}V</span>}
                        {part.maxAmps && <span>{part.maxAmps}A</span>}
                        {part.capacity && <span>{part.capacity}Ah</span>}
                        {part.cutoffVoltage > 0 && <span>CUT {part.cutoffVoltage}V</span>}
                        {part.dampFactor > 0 && <span>DAMP {(part.dampFactor * 100).toFixed(0)}%</span>}
                        {part.heatReduction > 0 && <span>COOL -{part.heatReduction}°</span>}
                        {part.size && <span>{part.size}\"</span>}
                      </div>
                      <button type="button" className="part-equip-button" onClick={(event) => { event.stopPropagation(); setComparison(part); }}>{tr('Compare')}</button>
                      <button type="button" className="part-equip-button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); equip(part); }} disabled={installed}>
                        {installed ? tr("INSTALLED") : fits ? tr("Install") : tr("Needs welding")}
                      </button>
                    </div>
                  );
                })}
                {currentParts.length === 0 && <div className="part-empty"><Search />{tr("No matching parts")}</div>}
              </div>
              <WeldEffect key={`${pendingPart?.id}-${build.weldCount}`} isActive={!!pendingPart} partName={pendingPart?.name || ""} onWeld={weld} onCancel={()=>setPendingPart(null)} />
            </div>
          </div>
        )}

        {/* ── VESC TUNING TAB (Phone App) ── */}
        {activeTab === "tuning" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <h2 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider">VESC Tool — Phone Dashboard</h2>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mb-4">Connected to {build.parts?.controller?.name || "VESC"}. Tune motor parameters live. Deploy your build to ride with real-time telemetry.</p>
            <VESCPhoneApp vehicle={vehicle} build={build} />
          </div>
        )}

        {/* ── CUSTOM PARTS TAB ── */}
        {activeTab === "custom" && (
          <CustomPartBuilder
            onEquip={(part) => equip(part)}
          />
        )}

        {/* ── APPEARANCE TAB ── */}
        {activeTab === "appearance" && (
          <AppearanceEditor
            vehicle={vehicle}
            build={build}
            appearance={build.appearance}
            onChange={(ap) => setBuild(b => ({ ...b, appearance: ap }))}
            onBuildChange={setBuild}
          />
        )}

        {/* ── PREVIEW TAB ── */}
        {activeTab === "preview" && (
          <div className="garage-photo-preview">
            <div className="ride-preview ride-real-city has-vehicle-photo garage-photo-stage" aria-label="Garage photo preview">
              <div className="ride-photo-city" aria-hidden="true"/>
              <div className="garage-preview-title">{vehicle.name} · {tr('Preview')}</div>
              <VehicleRideArt build={build} vehicle={vehicle} appearance={build.appearance} speed={0} moving={false} posture="upright" trick="normal"/>
            </div>
            <div className="upgrade-actions"><button onClick={()=>navigate({pathname:location.pathname,search:'?tab=appearance'},{replace:true})}>{tr('Appearance')}</button><button onClick={()=>{saveBuild(build);navigate(`/telemetry/${vehicleId}?practice=trial`);}}>{tr('Garage test track')} · 60 s</button></div>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`font-mono text-sm font-bold mt-0.5 ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
