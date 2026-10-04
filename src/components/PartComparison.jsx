import PartImage from './PartImage';
import { calcBuildStats } from '../lib/buildState';
import { compareBuildStats } from '../lib/rideUpgrades';
import { useLanguage } from '../lib/i18n';
export default function PartComparison({ vehicle, build, part, isBms, onInstall, onClose, installed, fits }) {
  const { t } = useLanguage();
  const next = isBms ? { ...build, bms:part } : { ...build, parts:{ ...build.parts, [part.category]:part } };
  const before = compareBuildStats(calcBuildStats(vehicle, build));
  const after = compareBuildStats(calcBuildStats(vehicle, next));
  return <section className="upgrade-card part-comparison" aria-label="Part comparison">
    <div className="flex justify-between gap-2"><strong>{part.name}</strong><button aria-label="Close comparison" onClick={onClose}>×</button></div>
    <PartImage part={part} category={isBms?'bms':part.category}/>
    <p>{part.desc}</p>
    <p>{t('Build estimates')} · {t('Before → after')}</p>
    {[['speed','Top speed','km/h'],['acceleration','Launch acceleration','km/h/s'],['thermal','Heat load','index']].map(([key,label,unit]) => <div className="comparison-row" key={key}><span>{t(label)}</span><strong>{before[key].toFixed(1)} → {after[key].toFixed(1)} <small>{t(unit)}</small></strong></div>)}
    <p>{t('Heat load is a relative estimate; lower is better.')}</p>
    <button className="upgrade-primary" disabled={installed} onClick={onInstall}>{t(installed ? 'INSTALLED' : fits ? 'Install' : 'Needs welding')}</button>
  </section>;
}
