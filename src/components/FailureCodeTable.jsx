import { FAILURE_CODES } from "../lib/vehicleData";
import { AlertTriangle, AlertOctagon } from "lucide-react";

export default function FailureCodeTable() {
  return (
    <div className="space-y-3">
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
              {f.severity}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1"><span className="text-foreground/70 font-medium">Cause:</span> {f.cause}</p>
          <p className="text-xs text-muted-foreground"><span className="text-foreground/70 font-medium">Effect:</span> {f.effect}</p>
        </div>
      ))}
    </div>
  );
}