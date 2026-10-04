import {useLanguage} from '../lib/i18n';
import {wheelieBalance} from '../lib/stuntPark';
export default function WheelieBalanceBar({angle=0,velocity=0}){
 const {t}=useLanguage(),s=wheelieBalance(angle,velocity);
 const text={loop:'Loop out',scrape:'Scrape · rear brake',brake:'Rear brake',balanced:'Balance zone',lift:'Lift to balance'};
 return <div data-angle={angle.toFixed(1)} data-scraping={angle>=78} className={`ride-pitch wheelie-balance-bar balance-${s.status}`} data-status={s.status}>
 <div><span>{t('Balance')}</span><strong>{angle.toFixed(0)}° · {t(text[s.status])}</strong></div>
 <div className="wheelie-balance-track" role="meter" aria-label={t('Wheelie balance')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(s.value)}><span className="wheelie-safe-zone"/><span className="wheelie-danger-zone"/><i style={{left:`${s.value}%`}}/></div>
 </div>;
}
