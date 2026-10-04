import { useId } from 'react';
import { stickerLabel } from '../lib/appearanceTuning';
export default function PhotoTuningOverlay({ appearance, layout, g2 }) {
  const id=useId().replace(/:/g,'');
  if(!appearance?.customEnabled)return null;
  const [, , , , , , , deckY]=layout;
  const x1=g2?37:34,x2=g2?69:72,y=g2?87.7:deckY+5;
  const colour=appearance.ledColor||'#38bdf8';
  const led=appearance.ledEnabled && appearance.ledMode!=='off';
  const label=stickerLabel(appearance);
  return <svg className={`photo-tuning-overlay ${appearance.ledMode==='breathe'?'led-breathe':''}`} viewBox="0 0 100 100" aria-label="Vehicle LEDs and stickers" data-led={led?'on':'off'} data-sticker={appearance.sticker||'factory'}>
    <defs><radialGradient id={`${id}-glow`}><stop stopColor={colour} stopOpacity=".48"/><stop offset="1" stopColor={colour} stopOpacity="0"/></radialGradient><filter id={`${id}-led`} x="-100%" y="-600%" width="300%" height="1300%"><feGaussianBlur stdDeviation=".7"/></filter></defs>
    {led&&<g className="tuning-led"><ellipse cx={(x1+x2)/2} cy={y+4.4} rx="24" ry="6" fill={`url(#${id}-glow)`}/><path d={`M${x1} ${y} L${x2} ${y}`} stroke={colour} strokeWidth="1.2" filter={`url(#${id}-led)`}/><path d={`M${x1} ${y} L${x2} ${y}`} stroke={colour} strokeWidth=".5"/><path d={`M${x1+.5} ${y-.12} L${x2-.5} ${y-.12}`} stroke="#e9faff" strokeWidth=".12"/></g>}
    {label&&<text x={g2?59:55} y={g2?83.9:deckY+1.8} textAnchor="middle" fontSize={g2?2.6:2.3} fontFamily="Arial,sans-serif" fontWeight="900" fontStyle="italic" fill={appearance.stickerColor||'#e0f2fe'} stroke="#0c1523" strokeWidth=".06">{label}</text>}
  </svg>;
}
