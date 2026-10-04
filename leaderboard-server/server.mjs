import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
const directory=process.env.DATA_DIR||'./data';mkdirSync(directory,{recursive:true});
const db=new DatabaseSync(path.join(directory,'scores.sqlite'));
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS scores(id TEXT PRIMARY KEY,name TEXT NOT NULL,mode TEXT NOT NULL,value REAL NOT NULL,vehicle TEXT NOT NULL,time INTEGER NOT NULL)');
const insert=db.prepare('INSERT OR IGNORE INTO scores VALUES(?,?,?,?,?,?)');
const requests=new Map();
setInterval(()=>requests.clear(),60000).unref();
const allowed=process.env.ALLOWED_ORIGIN||'*';
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
const server=createServer(async(req,res)=>{
 if(req.method==='OPTIONS'){send(res,204,null);return;}
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/health'){send(res,200,{ok:true});return;}
 if(url.pathname!=='/scores'){send(res,404,{error:'Not found'});return;}
 const ip=req.socket.remoteAddress, count=(requests.get(ip)||0)+1;requests.set(ip,count);
 if(count>90){send(res,429,{error:'Try later'});return;}
 if(req.method==='GET'){
  const mode=url.searchParams.get('mode')||'drag';if(!['drag','speed','delivery'].includes(mode)){send(res,400,{error:'Invalid mode'});return;}
  // One best result per rider name and vehicle; lowest drag time wins.
  const aggregate=mode==='drag'?'MIN':'MAX',order=mode==='drag'?'ASC':'DESC';
  const rows=db.prepare(`SELECT MIN(id) id,name,vehicle,${aggregate}(value) value FROM scores WHERE mode=? GROUP BY name,vehicle ORDER BY value ${order} LIMIT 50`).all(mode);
  send(res,200,rows);return;
 }
 if(req.method!=='POST'){send(res,405,{error:'Method not allowed'});return;}
 let body='';let tooLarge=false;
 try{for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>8192){tooLarge=true;break;}}if(tooLarge){send(res,413,{error:'Too large'});return;}
  const row=JSON.parse(body);
  const valid=typeof row.id==='string'&&/^[a-f0-9-]{36}$/i.test(row.id)&&typeof row.name==='string'&&row.name.trim().length>=2&&row.name.trim().length<=24&&typeof row.vehicle==='string'&&row.vehicle.length<=80&&Number.isFinite(row.value)&&(['drag','speed','delivery'].includes(row.mode))&&row.value>0&&row.value<=(row.mode==='delivery'?1000000:row.mode==='speed'?1000:600)&&(row.mode!=='drag'||row.value>=2);
  if(!valid){send(res,400,{error:'Invalid score'});return;}
  insert.run(row.id,row.name.trim(),row.mode,row.value,row.vehicle,Date.now());send(res,201,{ok:true});
 }catch{send(res,400,{error:'Invalid request'});}
});
server.listen(Number(process.env.PORT||8787),'0.0.0.0',()=>console.log('Leaderboard ready'));
function close(){server.close(()=>{db.close();process.exit(0);});}
process.on('SIGTERM',close);process.on('SIGINT',close);
