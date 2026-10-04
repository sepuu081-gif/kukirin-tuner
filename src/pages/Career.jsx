import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag, Lock, Trophy, Wrench, Zap } from "lucide-react";
import { VEHICLES } from "../lib/vehicleData";
import { CAREER_EVENTS, careerLevel, getBrokenVehicles, getCareer } from "../lib/careerState";

export default function Career() {
  const navigate = useNavigate();
  const [career] = useState(getCareer);
  const broken = getBrokenVehicles();
  const level = careerLevel(career.xp);

  return (
    <div className="app-surface min-h-screen bg-background font-mono">
      <header className="app-header sticky top-0 z-50 border-b border-border bg-card/90">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/', { replace: true })} className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-4 w-4"/> Garage</button>
          <div className="h-4 w-px bg-border"/><Trophy className="h-4 w-4 text-yellow-400"/>
          <span className="text-xs font-bold text-foreground">CAREER MODE</span>
          <span className="ml-auto text-[10px] text-cyan-300">LVL {level} · {career.xp} XP</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-3 py-4 pb-20">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="WINS" value={career.wins}/><Stat label="RACES" value={career.races}/><Stat label="SCOOTERS" value={career.owned.length}/>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 text-[9px] text-muted-foreground">CAREER FLEET</div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {career.owned.map((id) => {
              const vehicle = VEHICLES.find((item) => item.id === id);
              if (!vehicle) return null;
              return <div key={id} className={`min-w-36 rounded-lg border p-2 ${broken.has(id) ? 'border-red-500/50 bg-red-500/5' : 'border-cyan-500/30 bg-cyan-500/5'}`}><div className="text-[10px] font-bold text-foreground">{vehicle.name}</div><div className="text-[9px] text-muted-foreground">{vehicle.topSpeed} km/h · {vehicle.watts}W</div>{broken.has(id) && <div className="mt-1 text-[9px] text-red-400">BROKEN · REPAIR</div>}</div>;
            })}
          </div>
        </div>
        <div className="space-y-2">
          {CAREER_EVENTS.map((event, index) => {
            const vehicle = VEHICLES.find((item) => item.id === event.vehicleId);
            const unlock = VEHICLES.find((item) => item.id === event.unlockVehicle);
            const completed = career.completed.includes(event.id);
            const available = index === 0 || career.completed.includes(CAREER_EVENTS[index - 1].id);
            const owned = career.owned.includes(event.vehicleId);
            const isBroken = broken.has(event.vehicleId);
            return (
              <div key={event.id} className={`rounded-xl border p-3 ${completed ? 'border-green-500/30 bg-green-500/5' : available ? 'border-primary/30 bg-card' : 'border-border bg-card/40 opacity-55'}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${available ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{available ? <Flag className="h-5 w-5"/> : <Lock className="h-4 w-4"/>}</div>
                  <div className="min-w-0 flex-1"><div className="text-xs font-bold text-foreground">{event.title}</div><div className="text-[9px] text-muted-foreground">{event.district} · {vehicle?.name}</div><div className="mt-1 text-[9px] text-cyan-300">+{event.rewardXp} XP · +{event.rewardRep} REP · unlock {unlock?.name}</div></div>
                  {completed ? <span className="text-[10px] font-bold text-green-400">DONE</span> : (
                    <button disabled={!available || !owned || isBroken} onClick={() => navigate(`/drag?career=${event.id}&vehicle=${event.vehicleId}&opponent=${event.opponentId}`)} className="min-h-10 rounded-lg bg-primary px-3 text-[10px] font-bold text-black disabled:bg-secondary disabled:text-muted-foreground">
                      {isBroken ? <Wrench className="h-4 w-4"/> : <><Zap className="mr-1 inline h-3 w-3"/>RACE</>}
                    </button>
                  )}
                </div>
                {isBroken && <button onClick={() => navigate('/repair')} className="mt-2 w-full rounded-md border border-red-500/30 py-2 text-[9px] text-red-400">SCOOTER BROKEN — OPEN REPAIR GARAGE</button>}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }) { return <div className="rounded-xl border border-border bg-card p-3 text-center"><div className="text-xl font-bold text-primary">{value}</div><div className="text-[8px] text-muted-foreground">{label}</div></div>; }
