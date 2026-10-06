const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
export const distance=(a,b)=>Math.hypot(...sub(a,b));
const rotate=(v,a)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a)];
// Two fixed-length bones. Targets outside reach are clipped, never stretched.
export function solveLimb(start,target,upper,lower,bend=1){
 const v=sub(target,start),raw=Math.hypot(...v),d=Math.max(Math.abs(upper-lower)+.01,Math.min(upper+lower-.01,raw));
 const n=raw>0?v.map(x=>x/raw):[0,1];
 const end=add(start,n.map(x=>x*d));
 const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const joint=add(start,[n[0]*along-n[1]*height*bend,n[1]*along+n[0]*height*bend]);
 return [start,joint,end];
}
function shoulderWithinReach(hip,goal,hands){
 const length=30,reach=31.9;
 const desired=Math.atan2(goal[1]-hip[1],goal[0]-hip[0]);
 const targets=hands.map((h,i)=>sub(h,[i?-1.4:1.4,i?.7:0]));
 const candidates=[desired];
 for(const hand of targets){
   const d=distance(hip,hand),theta=Math.atan2(hand[1]-hip[1],hand[0]-hip[0]);
   const spread=Math.acos(Math.max(-1,Math.min(1,(d*d+length*length-reach*reach)/(2*Math.max(.01,d)*length))));
   candidates.push(theta-spread,theta+spread);
 }
 const points=candidates.map(a=>add(hip,[Math.cos(a)*length,Math.sin(a)*length]));
 const cost=p=>distance(p,goal)**2+targets.reduce((sum,h)=>sum+Math.max(0,distance(p,h)-reach)**2*1e5,0);
 return points.sort((a,b)=>cost(a)-cost(b))[0];
}
export function solveDownwardArm(start,target,pitch){
 const candidates=[solveLimb(start,target,16,16,-1),solveLimb(start,target,16,16,1)];
 // Choose the elbow below the arm in screen/world space, not photo coordinates.
 // The vehicle photo rotates, so a constant bend sign flips the elbow over the head.
 return candidates.sort((a,b)=>rotate(b[1],pitch*Math.PI/180)[1]-rotate(a[1],pitch*Math.PI/180)[1])[0];
}

export function getRiderPose(layout,{pitch=0,trick='normal',moto=false,braking=false,posture='upright',turn=0,grips=null,seat=null,footrests=null}={}){
 const [, , , , ,hx,hy,deck]=layout;
 const angle=0;
 const local=(v)=>rotate(v,-angle);
 let hip=[60-10*Math.sin(angle)-(braking?3:0),deck-(moto?23:48)+8*Math.sin(angle)];
 let feet=[[54,deck-1],[66,deck-1]];
 if(moto)feet=[[58,deck+7],[66,deck+7]];
 if(seat){hip=[seat[0],seat[1]-2];feet=footrests||[[54,deck-1],[66,deck-1]];}
 if(trick==='knee-knock')hip=[58,deck-22];
 if(trick==='seat-stand'){hip=[72,deck-43];feet=[[73,deck-2],[80,deck-2]];}
 let body=posture==='tuck'?[-15,-26]:[-6+turn*2,-Math.sqrt(900-(-6+turn*2)**2)];
 if(trick==='superman'||trick==='rocket'){hip=[72,deck-41];body=[-26,-15];}
 const gripHands=grips||[[hx,hy],[hx+1.8,hy+1]];
 const shoulder=shoulderWithinReach(hip,add(hip,local(body)),gripHands);
 const up=sub(shoulder,hip).map(v=>v/30),head=add(shoulder,up.map(v=>v*9));
 let hands=gripHands.map(hand=>[...hand]);
 const free=(v)=>add(shoulder,local(v));
 if(trick==='one-hand')hands[0]=free([10,-23]);
 if(trick==='no-hands')hands=[free([23,-12]),free([-23,-12])];
 if(trick==='salute')hands[0]=add(head,local([-5,0]));
 if(trick==='heart-hands')hands=[free([-1,5]),free([1,5])];
 if(trick==='bow-arrow')hands=[free([2,5]),free([-29,-2])];
 if(trick==='tail-grab')hands[0]=[73,deck-1];
 if(trick==='starfish'){hands=[free([27,-7]),free([-27,-7])];feet=[add(hip,local([-27,30])),add(hip,local([27,30]))];}
 if(trick==='cross-hand')hands=[[hx+3,hy+2],[hx-2,hy]];
 if(trick==='one-footer')feet[1]=add(hip,local([30,25]));
 if(trick==='can-can')feet[1]=add(hip,local([-30,20]));
 if(trick==='leg-wrap')feet[1]=[hx+5,hy+28];
 if(trick==='heel-clicker')feet=[add(hip,local([-18,-10])),add(hip,local([-18,-10]))];
 if(trick==='nac-nac')feet[1]=add(hip,local([30,20]));
 if(trick==='superman'||trick==='rocket')feet=[add(hip,[38,-15]),add(hip,[40,-7])];
 const arms=hands.map((hand,i)=>solveDownwardArm(add(shoulder,[i?-1.4:1.4,i?.7:0]),hand,0));
 const legs=feet.map((foot,i)=>solveLimb(add(hip,[i?1.8:-1.8,0]),foot,26,25,1));
 return {hip,shoulder,head,arms,legs,bodyAngle:Math.atan2(up[0],-up[1])*180/Math.PI,moto,trick};
}
