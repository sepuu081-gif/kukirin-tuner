import { useId } from 'react';
import { getRiderPose } from '../lib/riderPose';
const line=points=>points.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' ');
function Limb({points,leg=false,far=false}){
 const [start,joint,end]=points;
 return <g className={leg?'rider-leg':'rider-arm'}>
   <path d={line(points)} fill="none" stroke="#080e15" strokeWidth={leg?5.7:4.2} strokeLinecap="round" strokeLinejoin="round"/>
   <path d={line(points)} fill="none" stroke={far?'#202833':leg?'#38434f':'#344654'} strokeWidth={leg?4.6:3.2} strokeLinecap="round" strokeLinejoin="round"/>
   <path d={line([start,joint])} fill="none" stroke={far?'#2c3540':'#647280'} strokeOpacity=".6" strokeWidth=".7" strokeLinecap="round"/>
   <path d={`M${joint[0]-1.6} ${joint[1]-1} Q${joint[0]-2} ${joint[1]+1.8} ${joint[0]+1.5} ${joint[1]+1.8}`} fill="none" stroke={leg?'#17222d':'#7c8994'} strokeWidth={leg?2:.45} strokeOpacity=".7"/>
   {!leg&&<circle cx={end[0]} cy={end[1]} r="1.8" fill="#101820" stroke="#70818e" strokeWidth=".4"/>}
 </g>;
}
export default function RiderPhotoRig({helmet='#38bdf8',helmetType='fullface',grips=null,layout,wheelieAngle=0,trick='normal',moto=false,braking=false,posture='upright',turn=0,seat=null,footrests=null}){
 const id=useId().replace(/:/g,'');
 const pose=getRiderPose(layout,{pitch:wheelieAngle,trick,moto,braking,posture,turn,grips,seat,footrests});
 const {hip,shoulder,head,arms,legs,bodyAngle}=pose;
 const bootAngle=0;
 return <svg className={`photo-rider rider-anatomical trick-${trick}`} viewBox="0 0 100 100" overflow="visible" aria-label="Rider wearing helmet and protective clothing" data-trick={trick} data-rider-state={moto||seat?'seated':braking?'braking':turn?'leaning':'standing'} data-rig="fixed-bones">
   <defs><linearGradient id={`${id}-coat`}><stop stopColor="#182330"/><stop offset=".45" stopColor="#455361"/><stop offset="1" stopColor="#1b2733"/></linearGradient><linearGradient id={`${id}-helmet`} x2=".8" y2="1"><stop stopColor="#d7e9ef"/><stop offset=".22" stopColor={helmet}/><stop offset="1" stopColor="#142436"/></linearGradient></defs>
   <Limb points={legs[1]} leg far/><Limb points={arms[1]} far/>
   <Limb points={legs[0]} leg/>
   {legs.map((leg,i)=><g key={i} transform={`translate(${leg[2].join(' ')}) rotate(${bootAngle})`}><path d="M-3 -2.4 L2 -2.4 L3 0 L-5 1 L-5 -.8Z" fill="#151e27" stroke="#78848e" strokeWidth=".45"/><path d="M-5 1 L3 1" stroke="#080d12" strokeWidth="1.1"/></g>)}
   <g transform={`translate(${hip.join(' ')}) rotate(${bodyAngle})`}>
     <path d="M-4 1 L-5 -9 L-6 -22 Q-6 -29 -3 -30 L3 -30 Q6 -27 6 -22 L4 -8 L4 1Z" fill={`url(#${id}-coat)`} stroke="#101a25" strokeWidth=".7"/>
     <path d="M0 -29 L0 0 M-4 -10 L4 -10 M-4 -19 L-1 -19" stroke="#91a2af" strokeOpacity=".6" strokeWidth=".55" fill="none"/>
     <path d="M-4 -27 L-2 -23 L0 -26 L2 -23 L4 -27" fill="#17212c" stroke="#5d6c77" strokeWidth=".4"/>
     <path d="M-3 -8 L-3 -4 M2 -8 L2 -4" stroke="#b5c1c9" strokeWidth=".4"/>
   </g>
   <Limb points={arms[0]}/>
   <path d={line([shoulder,head])} stroke="#b39177" strokeWidth="2.5"/>
   <g data-helmet={helmetType} transform={`translate(${head.join(' ')}) rotate(${bodyAngle})`}>
     {helmetType==='half'?<>
       <path d="M-4 -2 L4 -2 L4 2 L1 5 L-2 4 L-3 1 L-5 0Z" fill="#bb957b" stroke="#684d40" strokeWidth=".4"/>
       <path d="M-5 -2 Q-5 -7 1 -6 Q6 -5 5 -1 L2 0 L-4 -1Z" fill={`url(#${id}-helmet)`} stroke="#0a1825" strokeWidth=".6"/>
       <path d="M-4 -1 L-1 -1" stroke="#122333" strokeWidth="1"/><path d="M3 0 L1 4 L-2 3" fill="none" stroke="#142436" strokeWidth=".7"/>
     </>:helmetType==='moto'?<>
       <path d="M-5 -3 Q-4 -7 1 -6 Q6 -5 5 1 L3 4 L-6 4 L-7 2 L-3 1 L-5 0Z" fill={`url(#${id}-helmet)`} stroke="#0a1825" strokeWidth=".6"/>
       <path d="M-8 -4 L2 -5 L4 -4 L-7 -3Z" fill={helmet} stroke="#0a1825" strokeWidth=".5"/>
       <path d="M-5 -2 L0 -2 L-1 1 L-5 1Z" fill="#061520" stroke="#d5e7ef" strokeWidth=".7"/><path d="M-5 3 L0 3" stroke="#152330" strokeWidth=".7"/>
     </>:<>
     <path d="M-5 -3 Q-4 -7 1 -6 Q6 -5 5 1 L3 4 L-2 5 L-5 2Z" fill={`url(#${id}-helmet)`} stroke="#0a1825" strokeWidth=".6"/>
     <path d="M-5 -2.5 L1 -2 L0 1.1 L-4.5 1Z" fill="#07141e" stroke="#b3d4e2" strokeWidth=".5"/>
     <path d="M-4 2 L0 2 L-1 4 L-3 4Z" fill="#25333e"/>
     <path d="M0 -5 L3 -4 M1 2 L3 1" stroke="#07141e" strokeWidth=".7"/>
     <path d="M-2 -5 Q1 -6 3 -4" fill="none" stroke="#e7f5fa" strokeOpacity=".7" strokeWidth=".5"/>
     </>}
   </g>
 </svg>;
}
