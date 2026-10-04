import { useState } from 'react';
import { getTires, saveTires, tireEffects, tireTarget } from '../lib/rideUpgrades';
import { useLanguage } from '../lib/i18n';

export default function TireWorkshop({ vehicle, build }) {
  const { t } = useLanguage();
  const [tires, setTires] = useState(() => getTires(vehicle, build));
  const update = next => { setTires(next); saveTires(vehicle.id, next); };
  const effect = tireEffects(vehicle, tires);
  return <details className="upgrade-card tire-workshop"><summary>{t('Tyres & pressure')}</summary>
    <p>{t('Game tuning baseline')} · {tireTarget(vehicle).toFixed(1)} bar</p>
    {['front','rear'].map(axle => <label key={axle}>{t(axle === 'front' ? 'Front tyre' : 'Rear tyre')} · {tires[axle+'Pressure'].toFixed(1)} bar · {t('Wear')} {tires[axle+'Wear'].toFixed(1)}%
      <input type="range" aria-label={axle+' tyre pressure'} min="0.5" max="5" step="0.1" value={tires[axle+'Pressure']} onChange={e => update({ ...tires, [axle+'Pressure']:Number(e.target.value) })} />
    </label>)}
    <p>{t('Grip')} {Math.round(effect.grip * 100)}% · {t('Rolling resistance')} ×{effect.rolling.toFixed(2)}</p>
    <div className="upgrade-actions"><button onClick={() => update({ ...tires, frontPressure:tireTarget(vehicle), rearPressure:tireTarget(vehicle) })}>{t('Set baseline pressure')}</button><button onClick={() => update({ ...tires, frontWear:0, rearWear:0 })}>{t('Replace tyres')}</button></div>
  </details>;
}
