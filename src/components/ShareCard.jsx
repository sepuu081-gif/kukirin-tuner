import { useState } from "react";
import { X, Copy, CheckCheck } from "lucide-react";

export default function ShareCard({ title, stats, vehicleName, badge }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const tiktokText = `🛴⚡ ${title}\n\n🚀 ${vehicleName}\n${stats.map(s => `${s.label}: ${s.value}`).join(" | ")}\n\n${badge ? `🏆 ${badge}\n` : ""}Built with KuKirin Tuner 🔧 #escooter #vesc #kukirin #sleeper #deckrats #scootergang`;

  const copyText = () => {
    navigator.clipboard.writeText(tiktokText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border/50 bg-card px-3 py-1.5 font-mono text-[10px] text-muted-foreground hover:border-pink-500/40 hover:text-pink-400 transition-all"
      >
        <span className="text-sm">♪</span> TikTok Share
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl">
            {/* TikTok-style header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xl">♪</span>
                <span className="font-mono text-sm font-bold text-foreground">Share to TikTok</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview card */}
            <div className="m-4 rounded-lg border border-pink-500/30 bg-gradient-to-br from-[#010101] to-[#1a0a1a] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">KT</div>
                <div>
                  <div className="font-mono text-xs font-bold text-white">@kukirin_tuner</div>
                  <div className="font-mono text-[9px] text-gray-400">KuKirin Tuner App</div>
                </div>
              </div>
              <div className="font-mono text-sm font-bold text-white">{title}</div>
              <div className="font-mono text-xs text-gray-300">{vehicleName}</div>
              <div className="flex flex-wrap gap-2">
                {stats.map((s, i) => (
                  <div key={i} className="rounded-md bg-white/10 px-2 py-1">
                    <div className="text-[9px] text-gray-400">{s.label}</div>
                    <div className="font-mono text-xs font-bold text-white">{s.value}</div>
                  </div>
                ))}
              </div>
              {badge && (
                <div className="font-mono text-[10px] text-yellow-400">🏆 {badge}</div>
              )}
              <div className="flex flex-wrap gap-1">
                {["#escooter","#vesc","#kukirin","#sleeper","#deckrats"].map(tag => (
                  <span key={tag} className="font-mono text-[9px] text-cyan-400">{tag}</span>
                ))}
              </div>
            </div>

            {/* Caption text to copy */}
            <div className="mx-4 mb-4 space-y-2">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Copy Caption</p>
              <div className="rounded-md border border-border bg-background p-3 font-mono text-[10px] text-muted-foreground whitespace-pre-line max-h-28 overflow-y-auto">
                {tiktokText}
              </div>
              <button
                onClick={copyText}
                className={`w-full rounded-md border py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  copied
                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                    : "border-pink-500/40 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20"
                }`}
              >
                {copied ? <><CheckCheck className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy Caption</>}
              </button>
              <p className="font-mono text-[9px] text-muted-foreground text-center">Paste into TikTok caption when uploading your clip</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
