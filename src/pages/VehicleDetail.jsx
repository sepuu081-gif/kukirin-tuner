import { useParams, Link, useNavigate } from "react-router-dom";
import { VEHICLES, SERIES, VESC_CONTROLLERS, BATTERY_CELLS, PARTS_CATALOG } from "../lib/vehicleData";
import VESCPhoneApp from "../components/VESCPhoneApp";
import { ArrowLeft, Zap, Gauge, Weight, CircleDot, Shield, Thermometer, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VehicleDetail() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const vehicle = VEHICLES.find((v) => v.id === vehicleId);

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-muted-foreground">Vehicle not found</p>
          <Link replace to="/" className="text-primary font-mono text-sm mt-2 inline-block hover:underline">← Back to Garage</Link>
        </div>
      </div>
    );
  }

  const series = SERIES[vehicle.series];
  const hasDedicatedParts = ["SURRON", "STARK"].includes(vehicle.series);
  const dedicatedParts = PARTS_CATALOG.filter((part) => part.forSeries?.includes(vehicle.series)
    && (!part.forVehicles || part.forVehicles.includes(vehicle.id)));
  const controllerReference = hasDedicatedParts
    ? dedicatedParts.filter((part) => part.category === "controller")
    : VESC_CONTROLLERS;
  const batteryReference = hasDedicatedParts
    ? dedicatedParts.filter((part) => part.category === "battery")
    : BATTERY_CELLS;

  return (
    <div className="app-surface min-h-screen bg-background font-sans">
      {/* Top bar */}
      <header className="app-header border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link replace to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider">Garage</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="font-mono text-xs text-foreground font-semibold">{vehicle.name}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Vehicle Info */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-mono text-xl font-bold text-foreground">{vehicle.name}</h1>
                {vehicle.restricted && (
                  <Badge variant="outline" className="border-green-500/40 text-green-400 font-mono text-[10px]">
                    <Lock className="h-3 w-3 mr-1" /> Factory Locked
                  </Badge>
                )}
              </div>
              <span className={`font-mono text-xs uppercase tracking-wider ${series?.color}`}>{series?.name} — {series?.tag}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground uppercase">Sleeper</span>
              <span className="font-mono text-lg font-bold text-primary">{vehicle.sleeperRating}/10</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{vehicle.desc}</p>

          {/* Spec grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SpecBox icon={<Zap className="h-4 w-4 text-accent" />} label="Power" value={`${vehicle.voltage}V ${vehicle.watts}W`} />
            <SpecBox icon={<Gauge className="h-4 w-4 text-primary" />} label="Top Speed" value={`${vehicle.topSpeed} km/h`} />
            <SpecBox icon={<Weight className="h-4 w-4 text-muted-foreground" />} label="Weight" value={`${vehicle.weight} kg`} />
            <SpecBox icon={<CircleDot className="h-4 w-4 text-muted-foreground" />} label="Tires / Motors" value={`${vehicle.tireSize}" × ${vehicle.motorCount}`} />
            <SpecBox icon={<Shield className="h-4 w-4 text-blue-400" />} label="Chassis" value={`${vehicle.chassisStrength}/10`} />
            <SpecBox icon={<Thermometer className="h-4 w-4 text-yellow-400" />} label="Heat Cap" value={`${vehicle.heatCapacity}°C`} />
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(vehicle.tags || []).map((t) => (
              <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                {t}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate(`/build/${vehicleId}`)}
              className="flex-1 rounded-md bg-primary/10 border border-primary/30 py-2.5 font-mono text-xs font-bold text-primary uppercase tracking-widest hover:bg-primary/20 transition-all"
            >
              Open Build Shop
            </button>
            <button
              onClick={() => navigate(`/telemetry/${vehicleId}?stock=1`)}
              className="flex-1 rounded-md bg-card border border-border py-2.5 font-mono text-xs font-bold text-muted-foreground uppercase tracking-widest hover:border-primary/30 hover:text-foreground transition-all"
            >
              Deploy Stock Build
            </button>
          </div>
        </div>

        {/* Two columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* VESC Phone App Tuner */}
          <div>
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">VESC Tool — Phone App</h2>
            <VESCPhoneApp vehicle={vehicle} build={{}} />
          </div>

          {/* Parts Reference */}
          <div className="space-y-4">
            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">Compatible Controllers</h2>
            {controllerReference.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-semibold text-foreground">{c.name}</span>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                    {hasDedicatedParts ? `${c.voltage}V max | ${c.maxAmps}A phase` : `Phase: ${c.maxPhaseAmps}A | Batt: ${c.maxBatteryAmps}A`}
                  </div>
                </div>
                <span className="font-mono text-sm text-primary font-bold">${c.price}</span>
              </div>
            ))}

            <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-6 mb-3">{hasDedicatedParts ? "Dedicated Battery Packs" : "Battery Cells"}</h2>
            {batteryReference.map((b) => (
              <div key={b.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-semibold text-foreground">{b.name}</span>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                    {hasDedicatedParts ? `${b.voltage}V | ${b.capacity}Ah | ${(b.voltage * b.capacity / 1000).toFixed(2)}kWh` : `${b.capacity}mAh | ${b.maxDrain}A max drain | ${b.voltage}V/cell`}
                  </div>
                </div>
              </div>
            ))}

            {/* Volume warning */}
            {!hasDedicatedParts && <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <p className="font-mono text-[11px] text-yellow-400">
                ⚠ A 72V 20S4P pack will NOT fit in G2/G2 Pro/M4 deck cavities. 
                Requires External Top-Mounted Battery Case — adds weight between rider's feet, alters leaning physics.
              </p>
            </div>}
          </div>
        </div>
      </main>
    </div>
  );
}

function SpecBox({ icon, label, value }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-mono text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
