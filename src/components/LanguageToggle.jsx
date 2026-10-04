import { useLanguage } from "../lib/i18n";

export default function LanguageToggle({ compact = false, className = "" }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div
      className={`flex items-center rounded-full border border-cyan-400/25 bg-[#071526]/95 p-0.5 shadow-lg shadow-cyan-950/30 ${className}`}
      role="group"
      aria-label={t("Language")}
    >
      {[
        ["et", "ET"],
        ["en", "EN"],
      ].map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          className={`${compact ? "h-7 min-w-8 text-[9px]" : "h-9 min-w-9 text-[10px]"} rounded-full px-1.5 font-mono font-bold tracking-wider transition-all active:scale-95 ${
            language === code ? "bg-cyan-400 text-slate-950 shadow shadow-cyan-400/30" : "text-cyan-200/65 hover:text-cyan-100"
          }`}
          aria-pressed={language === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
