import { useEffect, useRef, useState } from 'react';
import { Gift, Play, Settings2 } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { AD_REWARD, hasAndroidAds, getAdsStatus, configureAds, recoverAdRewards, watchRewardedAd } from '../lib/rewardedAds';

export default function RewardedAdsCard({ preferencesOnly = false }) {
 const {language}=useLanguage();const text=(en,et)=>language==='et'?et:en;
 const native=hasAndroidAds();
 const [status,setStatus]=useState(null),[editing,setEditing]=useState(false),[age,setAge]=useState(''),[allow,setAllow]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[online,setOnline]=useState(navigator.onLine);
 const alive=useRef(true),lock=useRef(false);
 useEffect(()=>{alive.current=true;if(native){getAdsStatus().then(value=>{if(alive.current){setStatus(value);setAge(value.configured?(value.adult?'older':'younger'):'');setAllow(value.enabled);}}).catch(()=>{if(alive.current)setMessage(text('Ads are unavailable.','Reklaamid pole saadaval.'));});recoverAdRewards().catch(()=>{});}const connected=()=>setOnline(navigator.onLine);window.addEventListener('online',connected);window.addEventListener('offline',connected);return()=>{alive.current=false;window.removeEventListener('online',connected);window.removeEventListener('offline',connected);};},[native]);
 const save=async()=>{if(lock.current)return;lock.current=true;setBusy(true);try{const value=await configureAds({adult:age==='older',enabled:age==='older'&&allow});if(alive.current){setStatus(value);setEditing(false);setMessage(value.enabled?text('Optional ads enabled.','Vabatahtlikud reklaamid on lubatud.'):text('Ads disabled. You can keep playing.','Reklaamid on välja lülitatud. Saad edasi mängida.'));}}catch{if(alive.current)setMessage(text('Could not save. Try again.','Salvestamine ei õnnestunud. Proovi uuesti.'));}finally{lock.current=false;if(alive.current)setBusy(false);}};
 const watch=async()=>{if(lock.current)return;lock.current=true;setBusy(true);setMessage(text('Loading video…','Laen videot…'));try{const result=await watchRewardedAd();if(alive.current)setMessage(result.reward?`+${result.reward} REP · ${text('Reward saved','Tasu salvestatud')}`:result.completed?text('Video complete. Reward already saved.','Video lõppes. Tasu on juba salvestatud.'):text('Video closed before completion. No REP was added.','Video suleti enne lõppu. REP-i ei lisatud.'));}catch(error){const code=error.code||error.message;const en=code==='OFFLINE'?'Connect to the internet to watch an ad.':code==='TIMEOUT'?'Video loading timed out. Try again later.':'No video available right now. Try again later.';const et=code==='OFFLINE'?'Reklaami vaatamiseks ühendu internetiga.':code==='TIMEOUT'?'Video laadimine aegus. Proovi hiljem uuesti.':'Praegu pole videot saadaval. Proovi hiljem uuesti.';if(alive.current)setMessage(text(en,et));}finally{lock.current=false;if(alive.current)setBusy(false);}};
 return <section className="rewarded-ads-card" aria-label={text('Video rewards','Videopreemiad')}>
  <div className="rewarded-ads-heading"><Gift size={22}/><div><h2>{text('Video bonus','Videoboonus')}</h2><p>{text('Optional · +500 REP after a completed video','Vabatahtlik · lõpetatud video eest +500 REP')}</p></div></div>
  {!native?<p>{text('Video rewards are available in the Android app.','Videopreemiad on saadaval Androidi äpis.')}</p>:<>
   {(editing||status?.configured===false)&&<div className="rewarded-ads-options">
    <p>{text('Start.io provides ads and may process device, network and ad interaction data. We request non-personalised ads. You can play without ads.','Start.io pakub reklaame ning võib töödelda seadme-, võrgu- ja reklaamiga seotud andmeid. Kasutame mitteisikupärastatud reklaame. Saad mängida ka reklaamideta.')}</p>
    <a href="https://www.start.io/policy/services-privacy/" target="_blank" rel="noreferrer">{text('Start.io privacy policy','Start.io privaatsuspoliitika')}</a>
    <label>{text('Age group','Vanuserühm')}<select aria-label={text('Age group','Vanuserühm')} value={age} onChange={e=>{setAge(e.target.value);setAllow(false);}}><option value="">{text('Choose','Vali')}</option><option value="younger">{text('Under 16','Alla 16')}</option><option value="older">{text('16 or older','16 või vanem')}</option></select></label>
    {age==='older'&&<label className="rewarded-ads-optin"><input type="checkbox" checked={allow} onChange={e=>setAllow(e.target.checked)} aria-label={text('Allow optional video ads','Luba vabatahtlikke videoreklaame')}/>{text('Allow optional video ads','Luba vabatahtlikke videoreklaame')}</label>}
    {age==='younger'&&<p>{text('Video ads stay off for players under 16.','Alla 16-aastastel jäävad videoreklaamid välja lülitatuks.')}</p>}
    <button type="button" disabled={!age||busy} onClick={save}>{text('Save choice','Salvesta valik')}</button>
    {editing&&<button type="button" disabled={busy} onClick={()=>{setAge(status.adult?'older':'younger');setAllow(status.enabled);setEditing(false);}}>{text('Cancel','Loobu')}</button>}
   </div>}
   {!editing&&status?.configured&&<>
    {!preferencesOnly&&status.enabled&&<button type="button" className="rewarded-ads-watch" disabled={busy||!online} onClick={watch}><Play size={17}/>{busy?text('Loading / watching…','Laen / video käib…'):text(`Watch video → +${AD_REWARD} REP`,`Vaata videot → +${AD_REWARD} REP`)}</button>}
    {!status.enabled&&<p>{text('Video ads are switched off.','Videoreklaamid on välja lülitatud.')}</p>}
    {!online&&status.enabled&&<p>{text('Offline: keep playing; videos need internet.','Oled võrguühenduseta: mängida saad edasi, videod vajavad internetti.')}</p>}
    {status.testAds&&<p>{text('Test ads · no advertising revenue','Testreklaamid · reklaamitulu ei teki')}</p>}
    <button type="button" className="rewarded-ads-settings" disabled={busy} onClick={()=>setEditing(true)}><Settings2 size={15}/>{text('Ad preferences','Reklaamiseaded')}</button>
   </>}
   {!status&&<p>{text('Checking availability…','Kontrollin saadavust…')}</p>}
  </>}
  <p className="rewarded-ads-message" role="status">{message}</p>
 </section>;
}

