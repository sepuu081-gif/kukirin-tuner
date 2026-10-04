import { WHEELIE_TRICKS } from '../lib/wheelieTricks';
import { useLanguage } from '../lib/i18n';
export default function WheelieTrickPicker({selected,onSelect}){
 const {t}=useLanguage();
 return <label className="ride-trick-select"><span>{t('Trick')}</span><select aria-label={t('Wheelie trick')} value={selected} onChange={e=>onSelect(e.target.value)}>{WHEELIE_TRICKS.map(({id,label})=><option key={id} value={id}>{label}</option>)}</select></label>;
}
