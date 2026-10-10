import {VEHICLES} from './vehicleData';
import {accountHeaders,savedAccount,customPowerLimit} from './playerAccount';
const QUEUE='kukirin_score_queue';
export const DEFAULT_LEADERBOARD_URL=import.meta.env.VITE_LEADERBOARD_URL||'https://kukirin-leaderboard.sepuu081-kukirin.workers.dev';
export function leaderboardURL(){
 let saved=localStorage.getItem('kukirin_leaderboard_url');
 if(localStorage.getItem('kukirin_cloud_server_v60')!=='true'){
  // Upgrade the earlier local test-server address; keep custom servers and
  // an explicit disconnect unchanged. Players no longer need to host a PC.
  if(!saved||['http://127.0.0.1:8787','http://localhost:8787'].includes(saved.replace(/\/$/,''))){saved=DEFAULT_LEADERBOARD_URL;localStorage.setItem('kukirin_leaderboard_url',saved);}
  localStorage.setItem('kukirin_cloud_server_v60','true');
 }
 return saved==='off'?'':(saved||DEFAULT_LEADERBOARD_URL).replace(/\/$/,'');
}
function serverOrigin(url){let u;try{u=new URL(url.trim());}catch{throw new Error('invalid_url');}if(u.username||u.password||u.search||u.hash||!['/','/health','/scores'].includes(u.pathname)||u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw new Error('invalid_url');return u.origin;}
export function setLeaderboardURL(url){localStorage.setItem('kukirin_leaderboard_url',serverOrigin(url));}
export function disconnectLeaderboard(){localStorage.setItem('kukirin_leaderboard_url','off');}
function queued(){try{const rows=JSON.parse(localStorage.getItem(QUEUE)||'[]');return Array.isArray(rows)?rows:[];}catch{return [];}}
export function pendingScores(){return queued().length;}
export async function connectLeaderboard(url){
 const origin=serverOrigin(url);let response;
 try{response=await fetch(`${origin}/health`,{signal:AbortSignal.timeout(8000)});}catch{throw new Error('unreachable');}
 let info;try{info=await response.json();}catch{throw new Error('wrong_server');}
 if(!response.ok||info?.ok!==true||info.service!=='kukirin-leaderboard'||info.apiVersion!==1)throw new Error('wrong_server');
 if(syncing)await syncing;setLeaderboardURL(origin);await syncScores();return origin;
}
export function submitScore(mode,value,vehicle){
  if(!['drag','speed','delivery'].includes(mode)||!Number.isFinite(value)||value<=0)return;
  let builds;try{builds=JSON.parse(localStorage.getItem('kukirin_builds')||'{}');}catch{builds={};}
  const vehicleId=VEHICLES.find(v=>v.name===vehicle||v.id===vehicle)?.id;
  const parts=builds[vehicleId]?.parts;
  const hasCustom=['motor','controller','battery'].some(key=>parts?.[key]?.custom);
  const rating=parts?.motor?.watts||VEHICLES.find(v=>v.id===vehicleId)?.watts||0;
  const customWatts=hasCustom?Math.min(customPowerLimit(),Number(rating)||0):0;
  const row={id:crypto.randomUUID(),accountId:savedAccount()?.id,name:localStorage.getItem('kukirin_rider_name')||'Rider',mode,value,vehicle:String(vehicle||'').slice(0,80),customWatts,time:Date.now()};
  localStorage.setItem(QUEUE,JSON.stringify([...queued(),row].slice(-100)));void syncScores();
}
let syncing=null;
export function syncScores(){
  if(syncing)return syncing;const origin=leaderboardURL();if(!origin)return Promise.resolve();
  syncing=(async()=>{try{while(queued().length&&leaderboardURL()===origin){const score=queued()[0];
    if(!savedAccount()?.id||!accountHeaders().Authorization)break;
    // Never upload another account's offline queue after switching accounts.
    if(score.accountId&&score.accountId!==savedAccount().id){localStorage.setItem(QUEUE,JSON.stringify(queued().filter(row=>row.id!==score.id)));continue;}
    const response=await fetch(`${origin}/scores`,{method:'POST',headers:{'Content-Type':'application/json',...accountHeaders()},body:JSON.stringify({...score,customWatts:score.customWatts||0}),signal:AbortSignal.timeout(8000)});
    if(!response.ok)break;
    localStorage.setItem(QUEUE,JSON.stringify(queued().filter(row=>row.id!==score.id)));
  }}catch{/* Keep unsent scores for the next connection. */}})().finally(()=>{syncing=null;});
  return syncing;
}
export async function fetchScores(mode){
  if(!leaderboardURL())throw new Error('not_configured');await syncScores();
  const r=await fetch(`${leaderboardURL()}/scores?mode=${encodeURIComponent(mode)}`,{signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error('offline');const data=await r.json();return Array.isArray(data)?data:[];
}
