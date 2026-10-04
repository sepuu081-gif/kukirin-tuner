import { useState } from 'react';
import { WRAPS, DEFAULT_APPEARANCE } from '../lib/buildState';
import { BLUE_G2_STYLE, ORANGE_G2_STYLE } from '../lib/appearanceTuning';
import { useLanguage } from '../lib/i18n';
import VehicleRideArt from './VehicleRideArt';
import BodyworkWorkshop from './BodyworkWorkshop';

const COLOURS=['#111827','#1266b4','#38bdf8','#f97316','#ef4444','#22c55e','#a855f7','#e0f2fe'];
export default function AppearanceStudio({ appearance, onChange, vehicle, build, onBuildChange }) {
  const { t, language }=useLanguage();
  const text=(en,et)=>language==='et'?et:en;
  const [section,setSection]=useState('paint');
  const [part,setPart]=useState('stemColor');
  const [history,setHistory]=useState([]);
  const ap={...DEFAULT_APPEARANCE,...appearance};
  const change=next=>{setHistory(items=>[...items.slice(-19),ap]);onChange(next);};
  const set=(key,value)=>change({...ap,customEnabled:true,[key]:value});
  const parts=[['stemColor','Stem Colour'],['deckColor','Deck Colour'],['accentColor','Accent colour'],['riderHelmetColor','Helmet Colour']];
  const wraps=localStorage.getItem('kukirin_unlock_wrapdrop')==='true'?WRAPS:WRAPS.slice(0,8);
  return <div className="appearance-studio">
    <div className="tuning-showroom" aria-label="Live tuning preview">
      <div className="tuning-showroom-title"><strong>{vehicle?.name}</strong><span>{t('Saved automatically')}</span></div>
      <VehicleRideArt build={build} showRider={false} vehicle={vehicle} appearance={ap} moving={false} speed={0}/>
    </div>
    <div className="studio-editor">
      <div className="studio-sections" aria-label={text('Appearance tools','Välimuse tööriistad')}>
        { [['paint','Paint','Värv'],['lights','Lights','Tuled'],['decals','Stickers','Kleebised'],['bodywork','Bodywork','Keretööd']].map(([id,en,et])=><button type="button" key={id} aria-pressed={section===id} onClick={()=>setSection(id)}>{text(en,et)}</button>) }
      </div>
      <div className="studio-panel">
        {section==='bodywork'&&<BodyworkWorkshop build={build} vehicle={vehicle} onBuildChange={onBuildChange}/>}
        {section==='paint'&&<>
          <label className="appearance-select">{text('Paint part','Värvitav osa')}<select aria-label={text('Paint part','Värvitav osa')} value={part} onChange={e=>setPart(e.target.value)}>{parts.map(([key,label])=><option key={key} value={key}>{t(label)}</option>)}</select></label>
          <ColourControl label={t(parts.find(([key])=>key===part)[1])} value={ap[part]} onChange={colour=>set(part,colour)}/>
          <label className="appearance-toggle"><span>{t('Custom paint')}</span><input type="checkbox" aria-label={t('Custom paint')} checked={ap.customEnabled} onChange={e=>change({...ap,customEnabled:e.target.checked})}/></label>
          <p className="studio-hint">{part==='riderHelmetColor'?text('Helmet colour is visible while riding.','Kiivri värv on nähtav sõidu ajal.'):text('Body paint is available on the G2 photo. LEDs and extra stickers also work on other models.','Kerevärvi saab muuta G2 fotol. LED-id ja lisakleebised töötavad ka teistel mudelitel.')}</p>
        </>}
        {section==='lights'&&<>
          <label className="appearance-toggle"><span>{t('Under-deck LEDs')}</span><input type="checkbox" aria-label={t('Under-deck LEDs')} checked={ap.ledEnabled} onChange={e=>set('ledEnabled',e.target.checked)}/></label>
          <ColourControl label={t('LED colour')} value={ap.ledColor} onChange={colour=>set('ledColor',colour)}/>
          <label className="appearance-select">{t('LED mode')}<select aria-label={t('LED mode')} value={ap.ledMode} onChange={e=>set('ledMode',e.target.value)}><option value="steady">{t('Steady')}</option><option value="breathe">{t('Breathing')}</option><option value="off">{t('Off')}</option></select></label>
        </>}
        {section==='decals'&&<>
          <label className="appearance-select">{t('Stickers')}<select aria-label={t('Stickers')} value={ap.sticker==='kukirin'?'factory':ap.sticker} onChange={e=>set('sticker',e.target.value)}><option value="factory">{t('Factory decals')}</option><option value="racing">G2 Racing</option><option value="none">{t('No extra stickers')}</option></select></label>
          {ap.sticker==='racing'&&<ColourControl label={t('Sticker colour')} value={ap.stickerColor} onChange={colour=>set('stickerColor',colour)}/>}
          <label className="appearance-select">{t('Vinyl Wrap')}<select aria-label={t('Vinyl Wrap')} value={ap.wrap||'none'} onChange={e=>set('wrap',e.target.value==='none'?null:e.target.value)}>{wraps.map(w=><option key={w.id} value={w.id}>{w.label}</option>)}</select></label>
        </>}
      </div>
      <div className="studio-footer"><span>{t('Saved automatically')}</span><button type="button" disabled={!history.length} onClick={()=>{onChange(history[history.length-1]);setHistory(items=>items.slice(0,-1));}}>{text('Undo','Võta tagasi')}</button></div>
    </div>
    <details className="studio-presets"><summary>{text('Styles & factory look','Stiilid ja tehasevälimus')}</summary><div className="upgrade-actions"><button type="button" onClick={()=>change({...ap,...BLUE_G2_STYLE})}>{t('Blue & black')}</button><button type="button" onClick={()=>change({...ap,...ORANGE_G2_STYLE})}>{t('Orange & black')}</button></div><button type="button" className="studio-reset" onClick={()=>change({...DEFAULT_APPEARANCE})}>{t('Restore factory look')}</button></details>
  </div>;
}
function ColourControl({label,value,onChange}) {
 return <fieldset className="appearance-colour"><legend>{label}</legend><div>{COLOURS.map(colour=><button type="button" key={colour} aria-label={`${label} ${colour}`} aria-pressed={colour===value} style={{background:colour}} onClick={()=>onChange(colour)}/>) }<input type="color" aria-label={label} value={value} onChange={e=>onChange(e.target.value)}/></div></fieldset>;
}
