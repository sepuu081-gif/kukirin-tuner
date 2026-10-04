import { useState } from 'react';
import { useLanguage } from '../lib/i18n';
export default function FirstLaunchName({children}) {
  const {language}=useLanguage(); const et=language==='et';
  const [ready,setReady]=useState(()=>{if(localStorage.getItem('kukirin_rider_name')?.trim())localStorage.setItem('kukirin_name_started','true');return localStorage.getItem('kukirin_name_started')==='true';});
  const [name,setName]=useState('');
  const valid=name.trim().length>=2&&name.trim().length<=24;
  if(ready)return children;
  return <div className="first-name-screen"><form onSubmit={e=>{e.preventDefault();if(!valid)return;localStorage.setItem('kukirin_rider_name',name.trim());localStorage.setItem('kukirin_name_started','true');setReady(true);}}>
    <img src="/app-icon-v43.png" alt="KuKirin Tuner"/><h1>{et?'Mis su sõitjanimi on?':'Choose your rider name'}</h1><p>{et?'Seda küsime ainult esimesel käivitamisel. Nimi on nähtav edetabelis.':'We ask only on your first launch. Your name appears on the leaderboard.'}</p>
    <input autoFocus aria-label={et?'Sõitjanimi':'Rider name'} minLength={2} maxLength={24} required value={name} onChange={e=>setName(e.target.value)} placeholder={et?'Sinu nimi':'Your name'}/><button disabled={!valid}>{et?'Alusta mängu':'Start game'}</button>
  </form></div>;
}
