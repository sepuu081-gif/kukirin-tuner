import { BatteryCharging, Navigation, Radio, Thermometer } from "lucide-react";
import { useLanguage } from "../lib/i18n";
import RideDashboard from "./RideDashboard";
import WheelieBalanceBar from './WheelieBalanceBar';
import ParkScene from './ParkScene';
import VehicleRideArt from "./VehicleRideArt";
import { getVehiclePhoto, getVehiclePhotoInfo } from "../lib/vehiclePhotos";
import { getTrick } from '../lib/wheelieTricks';
import { getMotorCount } from '../lib/drivePhysics';

function formatRideTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function RideRoadPreview({
  park=null,parkZone="wheelie",wheelieVelocity=0,
  sessionLabel = null,
  sessionSeconds = null,
  balance = 0,
  wheelieAngle = null,
  scraping = false,
  braking = false,
  turn = 0,
  speed,
  topSpeed,
  voltage,
  batteryPct,
  batteryTemp,
  motorTemp,
  mode,
  weather,
  wobble,
  distance,
  rideSeconds,
  maxRideSpeed,
  killed,
  appearance,
  riderPosture = 'upright',
  isWheelying,
  trick = 'normal',
  trickScore = 0,
  police,
  policeDist,
  lifetimeKm,
  phaseAmps,
  vescDisplay,
  wheelieBarFactor = 0,
  vehicle,
  build,
}) {
  const { t } = useLanguage();
  const motorCount = getMotorCount(vehicle, build?.parts?.motor);
  const moving = speed > 0.8 && !killed;
  const roadDuration = moving ? Math.max(0.2, 1.15 - speed / 125) : 4;
  const lean = Math.max(-3.5, Math.min(3.5, Math.sin(Date.now() / 70) * wobble * 4));
  const speedRisk = speed > topSpeed * 0.9;

  return (
    <section
      className={`ride-preview ${park?"ride-stunt-park":""} ride-real-city ride-weather-${weather.id} ${getVehiclePhoto(vehicle) ? 'has-vehicle-photo' : ''} ${moving ? "is-moving" : ""}`}
      style={{ "--park-height":`${Math.min(90,(park?.height||0)*40)}px`, "--road-duration": `${roadDuration}s`, "--ride-lean": `${lean}deg` }}
      aria-label="Live ride preview"
    >
      {park&&<ParkScene state={park} zone={parkZone}/>}
      <div className="ride-photo-city" aria-hidden="true" />
      <div className="ride-sky-glow" />
      <div className="ride-cloud ride-cloud-one" />
      <div className="ride-cloud ride-cloud-two" />
      <div className="ride-city">
        {Array.from({ length: 13 }, (_, index) => <i key={index} />)}
      </div>
      <div className="ride-road">
        <div className="ride-road-surface" />
        <div className="ride-lane ride-lane-left" />
        <div className="ride-lane ride-lane-right" />
        <div className="ride-road-glow" />
      </div>
      {(weather.id === "rain" || weather.id === "storm") && <div className="ride-rain" />}
      {weather.id === "storm" && <div className="ride-lightning" />}

      <div className="ride-preview-top">
        <span className="ride-record"><Radio className="h-3 w-3" /> {t(sessionSeconds===null?"LIVE":"Practice")} {sessionSeconds===null?formatRideTime(rideSeconds):`${sessionSeconds}s`} · {t("MAX")} {maxRideSpeed.toFixed(0)}</span>
        <span className="ride-mode">{sessionLabel || `${vehicle?.name || 'E-RIDE'} · ${mode.toUpperCase()} · ${weather.icon} ${weather.label}`} </span>
      </div>

      <div className={`ride-speed ${speedRisk ? "is-risk" : ""}`}>
        <span>{speed.toFixed(0)}</span>
        <small>km/h</small>
      </div>

      {vescDisplay && (
        <RideDashboard vehicle={vehicle} display={vescDisplay} speed={speed} batteryPct={batteryPct} batteryTemp={batteryTemp} motorTemp={motorTemp} phaseAmps={phaseAmps} mode={mode} />
      )}

      <VehicleRideArt build={build} wheelieAngle={wheelieAngle} scraping={scraping} balance={balance} braking={braking} turn={turn} vehicle={vehicle} appearance={appearance} posture={riderPosture} moving={moving} isWheelying={isWheelying} trick={trick} speed={speed} wheelieBarFactor={wheelieBarFactor} />
      <div className="ride-view-controls">

        <span>{motorCount === 2 ? 'AWD · 2 × HUB' : '1 × MOTOR'}</span>
        {getVehiclePhotoInfo(vehicle)?.kind === 'illustration' && <span>{t('Illustration')}</span>}
      </div>
      {(wheelieAngle>1||park)&&<WheelieBalanceBar angle={wheelieAngle||0} velocity={wheelieVelocity}/>}

      {((isWheelying && trick !== 'normal') || (!isWheelying && trickScore > 0)) && <div className="ride-trick-badge" data-score={trickScore}>{isWheelying ? getTrick(trick).label.toUpperCase() : t('Trick score')} · {trickScore}</div>}

      {(police === "approaching" || police === "chasing") && (
        <div className="ride-police" style={{ "--police-scale": `${0.62 + policeDist / 230}` }}>
          <div className="ride-police-lights"><i /><i /></div>
          <div className="ride-police-car">🚔</div>
          <div className="ride-police-distance">{t("POLICE")} {policeDist.toFixed(0)}%</div>
        </div>
      )}

      <div className="ride-preview-bottom">
        <div><Navigation className="h-3.5 w-3.5" /><span>{t("TRIP")} {distance.toFixed(2)} · {t("LIFE")} {lifetimeKm.toFixed(2)} km</span></div>
        <div><BatteryCharging className="h-3.5 w-3.5" /><span>{batteryPct.toFixed(1)}% · {voltage.toFixed(1)}V</span></div>
        <div><Thermometer className="h-3.5 w-3.5" /><span>M {motorTemp.toFixed(0)}° · B {batteryTemp.toFixed(0)}°</span></div>
      </div>

    </section>
  );
}
