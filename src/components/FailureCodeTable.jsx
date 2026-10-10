import {FAULTS,normalizeFault} from '../lib/workshopDiagnostics';
import {useLanguage} from '../lib/i18n';
import { FAILURE_CODES } from "../lib/vehicleData";
import { AlertTriangle, AlertOctagon } from "lucide-react";

export default function FailureCodeTable() {
  const {language}=useLanguage(),et=language==='et';
  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-border bg-card p-4"><h3 className="font-bold mb-3">{et?'Remonditavad füüsilised rikked':'Repairable physical faults'}</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{Object.entries(FAULTS).map(([id,f])=><div key={id} className="text-xs py-2 border-b border-border">{et?f.et:f.en}<small className="block text-muted-foreground">{f.test[et?1:0]}</small></div>)}</div><p className="text-xs mt-3 text-muted-foreground">{et?'Võnkumine, vibratsioon ja jõukadu on sümptomid. Remont nõuab tegeliku põhjuse kontrollimist.':'Wobble, vibration and power loss are symptoms. Inspect the actual cause before repairing.'}</p></section>
      {FAILURE_CODES.map((f) => (
        <div
          key={f.code}
          className={`rounded-lg border p-4 ${
            f.severity === "critical"
              ? "border-destructive/30 bg-destructive/5"
              : "border-yellow-500/30 bg-yellow-500/5"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {f.severity === "critical" ? (
              <AlertOctagon className="h-4 w-4 text-destructive" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            )}
            <span className="font-mono text-sm font-bold text-foreground">{f.code}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
              f.severity === "critical"
                ? "bg-destructive/20 text-destructive"
                : "bg-yellow-500/20 text-yellow-400"
            }`}>
              {normalizeFault(f).diagnosticOnly?(et?'Sümptom':'Symptom'):f.severity}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1"><span className="text-foreground/70 font-medium">Cause:</span> {f.cause}</p>
          <p className="text-xs text-muted-foreground"><span className="text-foreground/70 font-medium">Effect:</span> {f.effect}</p>
        </div>
      ))}
    </div>
  );
}