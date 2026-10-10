import {useState,useEffect} from 'react';
import {useLanguage} from '../lib/i18n';
import {savedAccount,accountAction,ACCOUNT_ERRORS} from '../lib/playerAccount';
export default function FirstLaunchName({children}){
 const {language}=useLanguage(),et=language==='et',t=(en,ee)=>et?ee:en;
 const [ready,setReady]=useState(false),[checking,setChecking]=useState(!!savedAccount()?.token),[name,setName]=useState(()=>localStorage.getItem('kukirin_rider_name')||''),[key,setKey]=useState(''),[login,setLogin]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let alive=true;if(savedAccount()?.token)accountAction('login').then(()=>{if(alive)setReady(true);}).catch(e=>{if(alive){if(e.message==='offline')setReady(true);else setError(e.message);}}).finally(()=>{if(alive)setChecking(false);});return()=>{alive=false;};},[]);
 if(ready)return children;
 if(checking)return <div className="first-name-screen"><p>{t('Checking your account…','Kontrollin sinu kontot…')}</p></div>;
 const valid=login?/^[a-f0-9]{64}$/.test(key.trim()):name.trim().length>=2&&name.trim().length<=24;
 const submit=async e=>{e.preventDefault();if(!valid||busy)return;setBusy(true);setError('');try{await accountAction(login?'login':'register',name,login?key.trim():undefined);setReady(true);}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <div className="first-name-screen"><form onSubmit={submit}>
 <img src="/app-icon-v43.png" alt="KuKirin Tuner"/><h1>{login?t('Sign in with your account key','Sisene konto võtmega'):t('Reserve your rider name','Registreeri sõitjanimi')}</h1>
 <p>{t('Each name belongs to one account. Your garage and progress stay on this device.','Iga nimi kuulub ühele kontole. Sinu garaaž ja edenemine jäävad sellesse seadmesse.')}</p>
 {login?<input type="password" autoComplete="off" aria-label={t('Account key','Konto võti')} value={key} onChange={e=>setKey(e.target.value)} placeholder={t('Your private account key','Sinu privaatne konto võti')}/>:<input autoFocus aria-label={t('Rider name','Sõitjanimi')} minLength={2} maxLength={24} required value={name} onChange={e=>setName(e.target.value)} placeholder={t('Your name','Sinu nimi')}/>}
 {error&&<p role="alert">{(ACCOUNT_ERRORS[error]||ACCOUNT_ERRORS.offline)[et?1:0]}</p>}
 <button disabled={!valid||busy}>{busy?t('Connecting…','Ühendan…'):login?t('Sign in','Sisene'):t('Reserve name and play','Registreeri nimi ja mängi')}</button>
 <button type="button" disabled={busy} onClick={()=>{setLogin(v=>!v);setError('');}}>{login?t('Choose a new name','Vali uus nimi'):t('I already have an account key','Mul on juba konto võti')}</button>
 {localStorage.getItem('kukirin_name_started')==='true'&&<button type="button" disabled={busy} onClick={()=>setReady(true)}>{t('Continue offline (name not reserved)','Jätka võrguühenduseta (nimi pole registreeritud)')}</button>}
 </form></div>;
}
