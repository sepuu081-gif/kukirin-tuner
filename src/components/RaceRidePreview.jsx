import RideRoadPreview from './RideRoadPreview';
import {useRef} from 'react';
export default function RaceRidePreview({vehicle,build,speed=0,distance=0,seconds=0,police=false,policeDist=0,batteryPct=100,weather='clear',label=''}){
 const maximum=useRef(0);maximum.current=Math.max(maximum.current,speed);
 return <RideRoadPreview vehicle={vehicle} build={build} appearance={build?.appearance} speed={speed} topSpeed={Math.max(vehicle.topSpeed,speed,1)} voltage={vehicle.voltage||48} batteryPct={batteryPct} batteryTemp={25} motorTemp={30} mode="drive" weather={{id:weather,icon:weather==='rain'?'🌧':'☀',label:weather}} wobble={0} distance={distance} rideSeconds={seconds} maxRideSpeed={maximum.current} killed={false} lifetimeKm={Number(localStorage.getItem(`kukirin_lifetime_km_${vehicle.id}`)||0)} police={police?'chasing':'none'} policeDist={policeDist} sessionLabel={label}/>;
}
