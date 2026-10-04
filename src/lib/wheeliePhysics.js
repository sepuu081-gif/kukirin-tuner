// Game pitch dynamics in degrees. Rear brake controls angular momentum;
// releasing the lift input does not teleport the front wheel to the road.
export const newWheelie = () => ({ angle:0, velocity:0, scraping:false, looped:false });
export function stepWheelie(state, { hold=false, rearBrake=false, speed=0, autoLift=false, body=0, guard=0, dt=.08 }={}) {
  if(state.looped)return state;
  dt=Math.max(0,Math.min(.1,dt));
  let {angle,velocity}=state;
  if(speed<.6)return newWheelie();
  if(angle===0&&!rearBrake&&(hold||autoLift))velocity=hold?13:7;
  const gravity=30*Math.sin((angle-55)*Math.PI/180);
  const pull=hold?44:autoLift&&angle<25?22:0;
  velocity+=(pull+gravity+body*35-(rearBrake?165:0)-velocity*.55)*dt;
  velocity=Math.max(-80,Math.min(52,velocity));
  angle+=velocity*dt;
  if(angle<=0)return newWheelie();
  const scraping=angle>=78;
  if(scraping)velocity-=12*dt;
  if(guard>0&&angle>85){angle=85;velocity=Math.min(velocity,0);}
  return {angle:Math.min(angle,102),velocity,scraping,looped:angle>=98};
}
