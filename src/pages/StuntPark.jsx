import {useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {VEHICLES} from '../lib/vehicleData';
import {getVehiclePhoto} from '../lib/vehiclePhotos';
import {PARK_ZONES} from '../lib/stuntPark';
import {useLanguage} from '../lib/i18n';
export default function StuntPark(){
 const {t}=useLanguage();const [params]=useSearchParams();const [vehicleId,setVehicleId]=useState(VEHICLES.some(v=>v.id===params.get('vehicle'))?params.get('vehicle'):'g2_2026');const [zone,setZone]=useState('wheelie');const vehicle=VEHICLES.find(v=>v.id===vehicleId);
 return <main className="stunt-park-page"><Link to="/">← {t('Back')}</Link><h1>{t('Stunt park')}</h1><p>{t('Practice wheelies, jumps and scrapes. Your stored battery, mileage and parts stay untouched.')}</p><div className="park-vehicle-card"><img src={getVehiclePhoto(vehicle)} alt={vehicle.name}/><label>{t('Vehicle')}<select value={vehicleId} onChange={e=>setVehicleId(e.target.value)}>{VEHICLES.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label></div><div className="park-zone-picker">{PARK_ZONES.map(z=><button key={z.id} onClick={()=>setZone(z.id)} aria-pressed={zone===z.id}>{t(z.label)}</button>)}</div><p>{t(zone==='ramps'?'Accelerate into the ramps to jump. Rear brake controls your pitch.':zone==='scrape'?'Lift past 78 degrees to scrape. Use the rear brake to recover.':'Hold wheelie to lift. Balance around 55 degrees with the rear brake.')}</p><Link className="upgrade-primary" to={`/telemetry/${vehicleId}?practice=park&zone=${zone}`}>{t('Enter park')}</Link></main>;
}
