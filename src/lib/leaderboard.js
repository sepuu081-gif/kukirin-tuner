const QUEUE='kukirin_score_queue';
export function leaderboardURL(){return (localStorage.getItem('kukirin_leaderboard_url')||import.meta.env.VITE_LEADERBOARD_URL||'').replace(/\/$/,'');}
export function setLeaderboardURL(url){const u=new URL(url);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw new Error('Use HTTPS');localStorage.setItem('kukirin_leaderboard_url',u.origin);}
function queued(){try{return JSON.parse(localStorage.getItem(QUEUE)||'[]');}catch{return [];}}
export function submitScore(mode,value,vehicle){
  if(!['drag','speed','delivery'].includes(mode)||!Number.isFinite(value)||value<=0)return;
  const row={id:crypto.randomUUID(),name:localStorage.getItem('kukirin_rider_name')||'Rider',mode,value,vehicle:String(vehicle||'').slice(0,80),time:Date.now()};
  localStorage.setItem(QUEUE,JSON.stringify([...queued(),row].slice(-100)));void syncScores();
}
let syncing=null;
export function syncScores(){
  if(syncing)return syncing;if(!leaderboardURL())return Promise.resolve();
  syncing=(async()=>{try{while(queued().length){const score=queued()[0];
    const response=await fetch(`${leaderboardURL()}/scores`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(score),signal:AbortSignal.timeout(8000)});
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
