import { WRAPS, DECK_COLORS } from "../lib/buildState";

export default function AppearanceEditor({ appearance, onChange }) {
  const set = (key, value) => onChange({ ...appearance, [key]: value });
  const hasWrapDrop = localStorage.getItem("kukirin_unlock_wrapdrop") === "true";
  const visibleWraps = hasWrapDrop ? WRAPS : WRAPS.slice(0, 8);

  return (
    <div className="space-y-5 font-mono">
      {/* Deck Color */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Deck Colour</div>
        <div className="flex flex-wrap gap-2">
          {DECK_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => set("deckColor", c)}
              style={{ background: c }}
              className={`w-7 h-7 rounded-full border-2 transition-all ${appearance.deckColor === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-70 hover:opacity-100"}`}
            />
          ))}
          <input
            type="color"
            value={appearance.deckColor}
            onChange={(e) => set("deckColor", e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
            title="Custom colour"
          />
        </div>
      </div>

      {/* Stem Color */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Stem Colour</div>
        <div className="flex flex-wrap gap-2">
          {["#374151","#111827","#f97316","#3b82f6","#ef4444","#c0c0c0","#ffffff","#d97706"].map((c) => (
            <button
              key={c}
              onClick={() => set("stemColor", c)}
              style={{ background: c }}
              className={`w-7 h-7 rounded-full border-2 transition-all ${appearance.stemColor === c ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"}`}
            />
          ))}
          <input type="color" value={appearance.stemColor} onChange={(e) => set("stemColor", e.target.value)} className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent" />
        </div>
      </div>

      {/* Wheel Color */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Wheel Colour</div>
        <div className="flex flex-wrap gap-2">
          {["#1f2937","#111827","#374151","#c0c0c0","#ffffff","#f97316","#ef4444","#3b82f6"].map((c) => (
            <button
              key={c}
              onClick={() => set("wheelColor", c)}
              style={{ background: c }}
              className={`w-7 h-7 rounded-full border-2 transition-all ${appearance.wheelColor === c ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"}`}
            />
          ))}
          <input type="color" value={appearance.wheelColor} onChange={(e) => set("wheelColor", e.target.value)} className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent" />
        </div>
      </div>

      {/* Helmet/Rider Color */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Helmet Colour</div>
        <div className="flex flex-wrap gap-2">
          {["#f97316","#ef4444","#3b82f6","#22c55e","#a855f7","#ffffff","#111827","#d97706"].map((c) => (
            <button
              key={c}
              onClick={() => set("riderHelmetColor", c)}
              style={{ background: c }}
              className={`w-7 h-7 rounded-full border-2 transition-all ${appearance.riderHelmetColor === c ? "border-white scale-110" : "border-transparent opacity-70 hover:opacity-100"}`}
            />
          ))}
          <input type="color" value={appearance.riderHelmetColor || "#f97316"} onChange={(e) => set("riderHelmetColor", e.target.value)} className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent" />
        </div>
      </div>

      {/* Wrap */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
          Vinyl Wrap {!hasWrapDrop && <span className="text-yellow-500">(Code WRAPDROP unlocks more)</span>}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {visibleWraps.map((w) => (
            <button
              key={w.id}
              onClick={() => set("wrap", w.id === "none" ? null : w.id)}
              className={`rounded-md border p-2 text-center transition-all ${
                (appearance.wrap || "none") === w.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="w-full h-4 rounded mb-1" style={{ background: w.preview }} />
              <span className="text-[9px] text-muted-foreground">{w.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Preview</div>
        <div className="rounded-lg border border-border/40 bg-black p-4 flex items-center justify-center" style={{ height: 100 }}>
          <MiniScooterPreview appearance={appearance} />
        </div>
      </div>
    </div>
  );
}

function MiniScooterPreview({ appearance }) {
  const dc = appearance.deckColor || "#f97316";
  const sc = appearance.stemColor || "#374151";
  const wc = appearance.wheelColor || "#1f2937";
  const hc = appearance.riderHelmetColor || "#f97316";
  return (
    <svg viewBox="0 0 120 80" width={120} height={80}>
      <circle cx="22" cy="58" r="14" fill="none" stroke={wc} strokeWidth="5" />
      <circle cx="22" cy="58" r="6" fill={wc} />
      <circle cx="96" cy="58" r="12" fill="none" stroke={wc} strokeWidth="5" />
      <circle cx="96" cy="58" r="5" fill={wc} />
      <rect x="18" y="44" width="80" height="8" rx="3" fill={dc} opacity="0.95" />
      <rect x="78" y="14" width="5" height="32" rx="2" fill={sc} />
      <rect x="68" y="12" width="20" height="3" rx="1.5" fill="#4b5563" />
      <rect x="58" y="22" width="13" height="20" rx="3" fill="#1f2937" />
      <circle cx="64" cy="16" r="7" fill="#1f2937" />
      <path d={`M59 14 Q64 10 70 14`} stroke={hc} strokeWidth="1.5" fill="none" />
      <line x1="64" y1="28" x2="74" y2="20" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}