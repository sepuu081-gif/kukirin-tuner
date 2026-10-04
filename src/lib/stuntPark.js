export const PARK_ZONES=[{id:'wheelie',label:'Wheelie straight',length:160},{id:'ramps',label:'Jump ramps',length:120},{id:'scrape',label:'Scrape lane',length:100}];
export const newPark=()=>({position:0,height:0,verticalSpeed:0,jumps:0,airTime:0,bestJump:0});
export function stepPark(state,{speed=0,zone='wheelie',dt=.08}={}){
 const length=PARK_ZONES.find(z=>z.id===zone)?.length||160;
 const moved=Math.max(0,speed/3.6)*dt,next=state.position+moved;
 let verticalSpeed=state.verticalSpeed,height=state.height,jumps=state.jumps,airTime=state.airTime;
 if(zone==='ramps'&&height===0&&speed>8&&[32,82].some(r=>Math.floor((state.position-r)/length)<Math.floor((next-r)/length))){verticalSpeed=Math.min(7,speed/3.6*.36);height=.001;jumps++;}
 if(height>0){height=Math.max(0,height+verticalSpeed*dt-4.905*dt*dt);verticalSpeed-=9.81*dt;airTime+=dt;if(height===0)verticalSpeed=0;}
 return {position:next,height,verticalSpeed,jumps,airTime,bestJump:Math.max(state.bestJump,height)};
}
export function wheelieBalance(angle,velocity=0){
 const projected=angle+Math.max(0,velocity)*.25;
 return {value:Math.max(0,Math.min(100,angle)),status:angle>=98?'loop':angle>=78?'scrape':projected>=70?'brake':angle>=45&&angle<=65?'balanced':'lift'};
}
