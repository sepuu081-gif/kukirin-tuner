import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import worker from './cloudflare/worker.mjs';
const directory=process.env.DATA_DIR||'./data';mkdirSync(directory,{recursive:true});
const db=new DatabaseSync(path.join(directory,'scores.sqlite'));db.exec('PRAGMA journal_mode=WAL;');db.exec(readFileSync(new URL('./cloudflare/schema.sql',import.meta.url),'utf8'));
function statement(sql,args=[]){return {bind(...values){return statement(sql,values);},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return db.prepare(sql).run(...args);}};}
const env={DB:{prepare:sql=>statement(sql)}};
const server=createServer(async(req,res)=>{try{
 const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>8192){res.writeHead(413);res.end();return;}chunks.push(chunk);}
 const headers={...req.headers,'CF-Connecting-IP':req.socket.remoteAddress};
 const response=await worker.fetch(new Request('http://localhost'+req.url,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})}),env);
 const responseHeaders=Object.fromEntries(response.headers);if(process.env.ALLOWED_ORIGIN)responseHeaders['access-control-allow-origin']=process.env.ALLOWED_ORIGIN;
 res.writeHead(response.status,responseHeaders);res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(503);res.end(JSON.stringify({error:'Server unavailable'}));}});
server.listen(Number(process.env.PORT||8787),'0.0.0.0',()=>console.log('Leaderboard ready'));
function close(){server.close(()=>{db.close();process.exit(0);});}process.on('SIGTERM',close);process.on('SIGINT',close);
