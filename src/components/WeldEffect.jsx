import WeldingJob from './WeldingJob';
import {useLanguage} from '../lib/i18n';
export default function WeldEffect({onWeld,onCancel,partName,isActive}) {
 const {language}=useLanguage();
 if(!isActive)return null;
 return <WeldingJob key={partName} title={partName} description={language==='et'?'Suurem jupp vajab raami laiendamist.':'This larger part needs a frame extension.'} onComplete={onWeld} onCancel={onCancel}/>;
}
