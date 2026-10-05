import { useState, useEffect, useRef } from 'react';
import { getVehiclePhoto, getVehiclePhotoMask, getVehiclePhotoLayout, getVehiclePhotoInfo, getVehicleHandGrips } from '../lib/vehiclePhotos';
import { getRiderPose } from '../lib/riderPose';
import { photoCenterShift } from '../lib/photoFraming';
import InstalledPartsArt from './InstalledPartsArt';
import RiderPhotoRig from './RiderPhotoRig';
import { paintVehiclePixels, parseHex } from '../lib/appearanceTuning';
import PhotoTuningOverlay from './PhotoTuningOverlay';
import { removeStudioBackdrop } from '../lib/photoBackdrop';

function Wheels({ rear = 38, front = 157, radius = 20, color }) {
  return <>
    <circle className="vehicle-wheel" cx={rear} cy="86" r={radius} style={{ stroke: color }} />
    <circle className="vehicle-tire-tread" cx={rear} cy="86" r={radius + 1} />
    <circle className="vehicle-hub" cx={rear} cy="86" r="6" />
    <circle className="vehicle-wheel" cx={front} cy="86" r={radius} style={{ stroke: color }} />
    <circle className="vehicle-tire-tread" cx={front} cy="86" r={radius + 1} />
    <circle className="vehicle-hub" cx={front} cy="86" r="6" />
  </>;
}

function Rider({ helmet, helmetType, moto = false, trick = 'normal' }) {
  return <RiderPhotoRig vector helmet={helmet} helmetType={helmetType} trick={trick} layout={moto ? [0,0,0,0,0,18,28,76] : [0,0,0,0,0,34,28,88]} />;
}

function G2Art({ accent, wheel, helmet, helmetType, subtype, trick }) {
  const pro = subtype === 'pro';
  const max = subtype === 'max';
  const master = subtype === 'master';
  return <>
    <Wheels rear={37} front={158} radius={pro ? 18 : 20} color={wheel} />
    <path className="vehicle-swingarm" d="M37 86 L61 63 L79 77 M158 86 L141 63" />
    <path className="vehicle-deck" d={pro ? 'M44 65 L124 65 L143 78 L54 78 Q43 77 44 65Z' : 'M44 61 L130 61 L146 77 L51 77 Q42 73 44 61Z'} style={{ fill: accent }} />
    {master && <path className="vehicle-side-panel" d="M66 62 L112 62 L121 75 L62 75Z" />}
    {max && <><path className="vehicle-spring" d="M53 60 L45 76 M60 60 L52 77"/><path className="vehicle-seat-post" d="M82 61 L82 34 M67 34 L96 34"/></>}
    <path className="vehicle-stem" d="M127 63 L143 22" />
    <path className="vehicle-stem-accent" d="M127 61 L141 25" style={{ stroke: accent }} />
    <path className="vehicle-bar" d="M132 21 L160 21" />
    <path className="vehicle-light" d="M145 29 L153 32" />
    {!pro && <path className="vehicle-spring" d="M124 62 L135 77" />}
    <Rider helmet={helmet} helmetType={helmetType} trick={trick} />
  </>;
}

function G3Art({ accent, wheel, helmet, helmetType, pro, trick }) {
  return <>
    <Wheels rear={34} front={162} radius={pro ? 22 : 20} color={wheel} />
    <path className="vehicle-deck heavy" d="M46 57 L129 57 L147 77 L43 77 L34 68Z" style={{ fill: accent }} />
    <path className="vehicle-skeleton" d="M37 79 L57 52 L83 62 L45 68 M132 58 L153 80 L143 49" />
    <path className="vehicle-stem" d="M129 58 L145 19" />
    <path className="vehicle-stem-accent" d="M132 55 L144 22" style={{ stroke: accent }} />
    <path className="vehicle-bar" d="M134 18 L165 18" />
    {pro ? <><path className="vehicle-fork-double" d="M143 50 L157 83 M150 47 L166 81"/><path className="vehicle-tail" d="M40 57 L22 49 L29 43"/></> : <path className="vehicle-tpu" d="M50 57 L39 74 M57 58 L47 75"/>}
    <Rider helmet={helmet} helmetType={helmetType} trick={trick} />
  </>;
}

function G4Art({ accent, wheel, helmet, helmetType, max, trick }) {
  return <>
    <Wheels rear={34} front={164} radius={max ? 25 : 23} color={wheel} />
    <path className="vehicle-deck g4-deck" d="M48 53 L126 53 L145 73 L45 76 L31 66Z" style={{ fill: accent }} />
    <path className="vehicle-g4-cowl" d="M122 55 L143 18 L156 24 L142 59Z" />
    <path className="vehicle-g4-hole" d="M135 45 L146 27 L149 29 L141 47Z" />
    <path className="vehicle-stem-accent" d="M130 54 L146 23" style={{ stroke: accent }} />
    <path className="vehicle-bar" d="M137 17 L169 17" />
    <path className="vehicle-swingarm" d="M34 84 L55 58 M164 84 L145 63" />
    {max && <><path className="vehicle-fork-double" d="M145 54 L158 84 M151 51 L168 82"/><path className="vehicle-spring" d="M48 56 L37 75 M58 57 L46 77"/></>}
    <Rider helmet={helmet} helmetType={helmetType} trick={trick} />
  </>;
}

function XiaomiArt({ accent, wheel, helmet, helmetType, trick }) {
  return <>
    <Wheels rear={40} front={153} radius={17} color={wheel} />
    <path className="vehicle-deck slim" d="M45 65 L129 65 L145 77 L49 77Z" style={{ fill: accent }} />
    <path className="vehicle-stem slim" d="M130 66 L143 21" />
    <path className="vehicle-bar" d="M132 20 L157 20" />
    <path className="vehicle-fender" d="M29 75 Q40 59 52 75 M142 72 Q153 58 165 73" />
    <Rider helmet={helmet} helmetType={helmetType} trick={trick} />
  </>;
}

function EmotoArt({ accent, wheel, helmet, helmetType, subtype, trick }) {
  const stark = subtype === 'stark';
  const ultra = subtype === 'ultra';
  const rear = stark ? 35 : 39;
  const front = stark ? 169 : 164;
  return <>
    <Wheels rear={rear} front={front} radius={stark ? 30 : ultra ? 28 : 26} color={wheel} />
    <path className="vehicle-moto-frame" d={`M${rear} 83 L76 63 L104 38 L132 76 L76 63 L62 39 L118 40`} style={{ stroke: accent }} />
    <path className="vehicle-moto-battery" d={stark ? 'M74 39 L117 38 L127 57 L101 72 L76 62Z' : 'M72 42 L113 41 L123 58 L101 70 L77 62Z'} style={{ fill: stark ? '#e2e8f0' : '#111827', stroke: accent }} />
    <path className="vehicle-moto-seat" d={ultra || stark ? 'M59 35 L122 33 L136 24 L77 21Z' : 'M62 38 L116 36 L128 27 L75 25Z'} />
    <path className="vehicle-moto-fork" d={`M126 35 L${front} 84 M132 32 L${front + 5} 82`} />
    <path className="vehicle-moto-bar" d="M127 29 L157 19" />
    <path className="vehicle-moto-swing" d={`M99 69 L${rear} 85`} />
    <path className="vehicle-chain" d={`M98 72 L${rear} 87`} />
    {stark && <path className="vehicle-stark-panel" d="M80 39 L113 38 L121 55 L102 66 L83 59Z" style={{ fill: accent }} />}
    <Rider helmet={helmet} helmetType={helmetType} moto trick={trick} />
  </>;
}

function getModel(vehicle) {
  const id = vehicle?.id || '';
  if (id === 'stark_varg_mx') return ['emoto', 'stark'];
  if (id === 'surron_ultra_bee') return ['emoto', 'ultra'];
  if (id === 'surron_light_bee_x') return ['emoto', 'light'];
  if (id.includes('g4')) return ['g4', id.includes('max') || id.includes('pro') ? 'max' : 'base'];
  if (id.includes('g3')) return ['g3', id.includes('pro') ? 'pro' : 'base'];
  if (id.includes('g2')) {
    if (id.includes('master') || id.includes('ultra')) return ['g2', 'master'];
    if (id.includes('max') || id.includes('g2max')) return ['g2', 'max'];
    if (id.includes('pro') || id.includes('g2pro') || id.includes('dgt')) return ['g2', 'pro'];
    return ['g2', 'base'];
  }
  if (id.startsWith('xm_')) return ['xiaomi', 'base'];
  return vehicle?.vehicleType === 'emoto' ? ['emoto', 'light'] : ['g2', 'base'];
}

const photoWheelLayouts = {
  inmotion_rs: [15,84.7,82.7,85,19,30,9,82],
  inmotion_rs_lite: [13.4,81.5,84.6,81.9,18.9,29,12,79],
  inmotion_air_pro: [19.3,83,80,83,19.3,29,7,80],
  dt_thunder3: [21.2,85.8,79.1,85.05,16.1,31,10,76,17.35],
  dt_victor_limited: [20.8,85.8,77.55,84.05,15.7,31,10,76,16.7],
  dt_city: [17.1,78.95,81.25,77.75,22.65,31,16,73,20.4],
  dt_new_storm: [21.25,85.75,80.95,86,16.7,33,11,77,17.7],
  // Front x/y, rear x/y, tire diameter, handlebar x/y, deck height (%).
  g2_2026: [16.5, 88.5, 86.5, 89.2, 18.4, 36, 8, 80],
  g2_pro_2023: [16.8, 89.5, 85.5, 89.6, 16.5, 31, 6, 80],
  g2_pro_2026: [16.8, 89.5, 85.5, 89.6, 16.5, 31, 6, 80],
  g2_max: [16.3, 86.5, 85.7, 85.7, 17.2, 32, 8, 77],
  g2_master: [18, 84.8, 83.3, 86.5, 16.7, 32, 9, 76],
  g3: [18.6, 87.5, 82.1, 87.4, 16.8, 38, 11, 77],
  g3_pro: [21.7, 78.9, 78.6, 79.1, 13.3, 31, 12, 71],
  g4: [14.2, 87.7, 87.3, 87.5, 19.3, 31, 10, 78],
  g4_max: [14.4, 84.4, 85.2, 84.5, 18.8, 29, 8, 70],
};

function PhotoWheel({ photo, x, y, diameter, position, appearance }) {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled || !ref.current) return;
      const canvas = ref.current;
      const size = image.naturalWidth * diameter / 100;
      canvas.width = canvas.height = Math.round(size);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, image.naturalWidth * x / 100 - size / 2,
        image.naturalHeight * y / 100 - size / 2, size, size, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        if (Math.min(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]) > 232) pixels.data[i + 3] = 0;
        else if(appearance?.customEnabled){const lum=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;if(lum>65){const color=parseHex(appearance.wheelColor,'#111827');for(let c=0;c<3;c++)pixels.data[i+c]=Math.min(255,Math.round(color[c]*(.2+lum/255*1.1)+Math.max(0,lum-170)/85*6));}}
      }
      ctx.putImageData(pixels, 0, 0);
      canvas.dataset.loaded = 'true';
    };
    image.src = photo;
    return () => { cancelled = true; };
  }, [photo, x, y, diameter, appearance?.customEnabled,appearance?.wheelColor]);
  return <canvas ref={ref} data-center={`${x},${y}`} className={`photo-wheel-spin photo-wheel-${position}`} style={{ left:`${x}%`, top:`${y}%`, width:`${diameter}%` }} />;
}

function PhotoWheels({ vehicle, photo, appearance }) {
  const layout = getVehiclePhotoLayout(vehicle, photoWheelLayouts);
  const [fx, fy, rx, ry, diameter] = layout;
  // Keep the axle and suspension stationary; only the tire annulus rotates.
  return <div className="photo-wheel-layer" aria-hidden="true">
    <PhotoWheel photo={photo} x={fx} y={fy} diameter={diameter} position="front" appearance={appearance} />
    <PhotoWheel photo={photo} x={rx} y={ry} diameter={layout[8] || diameter} position="rear" appearance={appearance} />
  </div>;
}

function OpaquePhoto({ photo, onError, name, vehicle, appearance }) {
  const canvas = useRef(null);
  const errorHandler = useRef(onError);
  errorHandler.current = onError;
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled || !canvas.current) return;
      const target = canvas.current;
      target.width = image.naturalWidth; target.height = image.naturalHeight;
      const ctx = target.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, target.width, target.height);
      if (!getVehiclePhotoInfo(vehicle)?.cutout && getVehiclePhotoInfo(vehicle)?.kind !== 'illustration') {
        removeStudioBackdrop(pixels.data, target.width, target.height);
      }
      paintVehiclePixels(pixels.data,target.width,target.height,appearance,getVehiclePhotoLayout(vehicle,photoWheelLayouts),{moto:vehicle.vehicleType==='emoto'});
      ctx.putImageData(pixels, 0, 0);
      const mask = getVehiclePhotoMask(vehicle);
      if(mask){ctx.globalCompositeOperation='destination-out';ctx.beginPath();mask.forEach(([x,y],i)=>i?ctx.lineTo(x*target.width/100,y*target.height/100):ctx.moveTo(x*target.width/100,y*target.height/100));ctx.closePath();ctx.fill();ctx.globalCompositeOperation='source-over';}
      target.dataset.loaded = 'true';
      target.dataset.paint = appearance?.customEnabled ? 'on' : 'off';
      target.dataset.stem = appearance?.stemColor || '';
      target.dataset.fenders=appearance?.fendersRemoved&&localStorage.getItem('kukirin_unlock_fenders')==='true'?'removed':'fitted';
    };
    image.onerror = () => errorHandler.current();
    image.src = photo;
    return () => { cancelled = true; };
  }, [photo, vehicle, appearance?.customEnabled, appearance?.deckColor, appearance?.stemColor, appearance?.accentColor, appearance?.wrap, appearance?.sticker,appearance?.wheelColor,appearance?.fendersRemoved]);
  return <canvas ref={canvas} className="opaque-vehicle-photo" role="img" aria-label={`${name} on road`} />;
}


export default function VehicleRideArt({ build, showRider = true, wheelieAngle = null, scraping = false, balance = 0, braking = false, turn = 0, vehicle, appearance, posture, moving, speed = 15, trick = 'normal', isWheelying, wheelieBarFactor = 0, compact = false }) {
  const [failedPhoto, setFailedPhoto] = useState(null);
  const photo = getVehiclePhoto(vehicle);
  const [family, subtype] = getModel(vehicle);
  const accent = appearance?.deckColor || vehicle?.accentColor || '#f97316';
  const wheel = appearance?.wheelColor || '#17202a';
  const helmet = appearance?.riderHelmetColor || accent;
  const layout = getVehiclePhotoLayout(vehicle, photoWheelLayouts);
  const pose = getRiderPose(layout,{grips:getVehicleHandGrips(vehicle,layout),moto:vehicle?.vehicleType==='emoto',trick,posture,braking,turn});
  const centerShift=photoCenterShift(layout,showRider?pose:null,isWheelying?(wheelieAngle||0):0);
  const Art = family === 'g4' ? G4Art : family === 'g3' ? G3Art : family === 'xiaomi' ? XiaomiArt : family === 'emoto' ? EmotoArt : G2Art;
  if (photo && failedPhoto !== photo) return <div
    className={`ride-scooter ride-model-art ride-photo-art ride-family-${family} ride-subtype-${subtype} ${moving ? 'is-model-moving' : ''} ${isWheelying ? 'is-wheelie' : ''} ${compact ? 'is-compact' : ''}`}
    style={{ '--photo-center-shift': centerShift, '--wheelie-angle': `${wheelieAngle ?? (24 + balance * 12) * (1 - wheelieBarFactor * .65)}deg`, '--wheelie-rise': '0px', '--wheel-spin-duration': `${Math.max(.06, Math.PI * (vehicle?.tireSize || 10) * .0254 / Math.max(.1, speed / 3.6))}s`, transformOrigin: `${layout[2]}% ${layout[3]}%` }}
  >
    <OpaquePhoto appearance={appearance} photo={photo} vehicle={vehicle} name={vehicle.name} onError={() => setFailedPhoto(photo)} />
    <PhotoWheels vehicle={vehicle} photo={photo} appearance={appearance} />
    {scraping && <div className="photo-contact-effects" style={{left:`${layout[2]}%`,top:`${layout[3]}%`,transform:`rotate(-${wheelieAngle||0}deg)`}}><div className="scrape-sparks" style={{top:`${(layout[8]||layout[4])/2}cqw`}}>{Array.from({length:7},(_,i)=><i key={i} style={{'--spark':i}}/>)}</div></div>}
    <PhotoTuningOverlay appearance={appearance} layout={layout} g2={vehicle.id === 'g2_2026' || getVehiclePhotoInfo(vehicle)?.base === 'g2_2026'} />
    <InstalledPartsArt vehicle={vehicle} layout={layout} build={build} wheelieBarFactor={wheelieBarFactor}/>
    {showRider && <RiderPhotoRig grips={getVehicleHandGrips(vehicle,layout)} wheelieAngle={wheelieAngle||0} moto={vehicle?.vehicleType === 'emoto'} braking={braking} turn={turn} helmet={helmet} helmetType={appearance?.riderHelmetType} layout={layout} trick={trick} posture={posture} />}
  </div>;
  return <svg
    className={`ride-scooter ride-model-art ride-family-${family} ride-subtype-${subtype} ${family === 'emoto' ? 'ride-emoto' : ''} ${moving ? 'is-model-moving' : ''} ${isWheelying ? 'is-wheelie' : ''} ${compact ? 'is-compact' : ''}`}
    viewBox="0 0 205 115"
    aria-label={`${vehicle?.name || 'Electric scooter'} on road`}
    style={{ '--wheelie-angle': `${-(family === 'emoto' ? 12 : 9) * (1 - wheelieBarFactor)}deg`, '--wheelie-rise': `${-(family === 'emoto' ? 10 : 8) * (1 - wheelieBarFactor)}px` }}
  >
    <g className="ride-scooter-moving">
      {wheelieBarFactor > 0 && <g className="ride-wheelie-bar"><path d="M34 78 L10 100 L3 100"/><circle cx="3" cy="100" r="5"/></g>}
      <Art accent={accent} wheel={wheel} helmet={helmet} helmetType={appearance?.riderHelmetType} trick={trick} subtype={subtype} pro={subtype === 'pro'} max={subtype === 'max'} />
    </g>
  </svg>;
}
