import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Volume2, Languages } from 'lucide-react';
import { getGameSettings, saveGameSettings } from '../lib/gameSettings';
import { isSoundEnabled, setSoundEnabled } from '../lib/soundEngine';
import { useLanguage } from '../lib/i18n';
import LanguageToggle from '../components/LanguageToggle';

export default function Settings() {
  const { language } = useLanguage();
  const et = language === 'et';
  const [settings, setSettings] = useState(getGameSettings);
  const [sound, setSound] = useState(isSoundEnabled);
  return <div className="app-surface settings-page min-h-screen bg-background">
    <header className="app-header"><div className="settings-heading">
      <Link to="/" replace className="back-touch" aria-label={et ? 'Tagasi' : 'Back'}><ArrowLeft /></Link>
      <div><p className="settings-eyebrow">KUKIRIN TUNER</p><h1>{et ? 'Seaded' : 'Settings'}</h1></div>
    </div></header>
    <main className="settings-content">
      <div className="settings-intro"><ShieldCheck size={30}/><h2>{et ? 'Sõida omas tempos' : 'Ride your way'}</h2><p>{et ? 'Vali, kuidas sinu mäng käitub. Muudatused salvestuvad kohe.' : 'Choose how your game plays. Changes save immediately.'}</p></div>
      <Setting icon={ShieldCheck} title={et ? 'Osade purunemine' : 'Component damage'} description={settings.damageEnabled ? (et ? 'Sees · osad kuluvad aeglaselt ja võivad suure koormusega puruneda.' : 'On · parts wear slowly and can fail under heavy load.') : (et ? 'Väljas · uusi rikkeid ei teki ja olemasolevad rikked ei takista sõitmist.' : 'Off · no new failures; existing damage does not block riding.')} checked={settings.damageEnabled} onChange={() => setSettings(saveGameSettings({ damageEnabled: !settings.damageEnabled }))} />
      <Setting icon={Volume2} title={et ? 'Mänguhelid' : 'Game sounds'} description={et ? 'Mootor, sõidumüra ja nuppude helid.' : 'Motor, road and button sounds.'} checked={sound} onChange={() => { setSoundEnabled(!sound); setSound(!sound); }} />
      <section className="setting-row"><Languages/><div><h2>{et ? 'Keel' : 'Language'}</h2><p>Eesti / English</p></div><LanguageToggle /></section>
      <p className="settings-note">{et ? 'Aku tühjenemine ja temperatuurist sõltuv võimsus töötavad mõlemas režiimis.' : 'Battery drain and temperature-based power limits remain active in both modes.'}</p>
    <p className="settings-note">Politseifoto: Estonian.em · <a href="https://commons.wikimedia.org/wiki/File:Mercedes_Sprinter_Estonian_police_van.png" target="_blank" rel="noreferrer">Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a></p></main>
  </div>;
}

function Setting({ icon: Icon, title, description, checked, onChange }) {
  return <section className="setting-row"><Icon/><div><h2>{title}</h2><p>{description}</p></div><button type="button" role="switch" aria-checked={checked} aria-label={title} className="setting-switch" onClick={onChange}><span/></button></section>;
}
