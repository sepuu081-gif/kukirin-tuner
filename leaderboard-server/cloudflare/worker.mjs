import {HEALTH,HOME,MODES,validScore,scoreQuery} from '../protocol.mjs';
import appAds from './appAds.mjs';
const requests=new Map();let reset=0;
export default {async fetch(request,env){
 const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Content-Type':'application/json','Cache-Control':'no-store'};
 const send=(status,data)=>Response.json(data,{status,headers});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 const url=new URL(request.url);
 if(url.pathname==='/app-ads.txt'&&['GET','HEAD'].includes(request.method))return new Response(request.method==='HEAD'?null:appAds,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'}});
 if(url.pathname==='/'&&request.method==='GET')return new Response(HOME,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
 if(!['/scores','/health'].includes(url.pathname))return send(404,{error:'Not found'});
 if(!env.DB)return send(503,{error:'Database not configured'});
 try{
  if(url.pathname==='/health'){await env.DB.prepare('SELECT id FROM scores LIMIT 0').all();return send(200,HEALTH);}
  // Per-isolate burst protection; configure Cloudflare rate limiting for a busy public service.
  if(Date.now()>reset){requests.clear();reset=Date.now()+60000;}
  const ip=request.headers.get('CF-Connecting-IP')||'unknown',count=(requests.get(ip)||0)+1;requests.set(ip,count);
  if(count>90)return send(429,{error:'Try later'});
  if(request.method==='GET'){
   const mode=url.searchParams.get('mode')||'drag';if(!MODES.includes(mode))return send(400,{error:'Invalid mode'});
   const {results}=await env.DB.prepare(scoreQuery(mode)).bind(mode).all();return send(200,results);
  }
  if(request.method!=='POST')return send(405,{error:'Method not allowed'});
  const reader=request.body?.getReader();if(!reader)return send(400,{error:'Invalid request'});
  let length=0,text='';const decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>8192){await reader.cancel();return send(413,{error:'Too large'});}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();
  let row;try{row=JSON.parse(text);}catch{return send(400,{error:'Invalid request'});}
  if(!validScore(row))return send(400,{error:'Invalid score'});
  await env.DB.prepare('INSERT OR IGNORE INTO scores VALUES(?,?,?,?,?,?)').bind(row.id,row.name.trim(),row.mode,row.value,row.vehicle,Date.now()).run();return send(201,{ok:true});
 }catch{return send(503,{error:'Database unavailable'});}
}};
