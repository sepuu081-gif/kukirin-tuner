export function nameKey(name){return typeof name==='string'?name.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase():'';}
export function validName(name){if(typeof name!=='string')return false;const value=name.normalize('NFKC').trim().replace(/\s+/g,' ');return value.length>=2&&value.length<=24&&/^[\p{L}\p{N} ._-]+$/u.test(value);}
export async function tokenHash(token){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}
export async function authenticated(request,db){const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const {results}=await db.prepare('SELECT id,name,name_key,role FROM accounts WHERE token_hash=?').bind(await tokenHash(token)).all();return results[0]||null;}
const publicAccount=a=>({id:a.id,name:a.name,role:a.role,maxCustomWatts:a.role==='owner'?200000:20000});
export async function accountRequest(path,request,db,row,send){
 if(path==='/accounts/register'){
  if(!validName(row?.name))return send(400,{error:'invalid_name'});
  const key=nameKey(row.name);
  if(key==='zepu')return send(409,{error:'reserved_name'});
  const a={id:crypto.randomUUID(),name:row.name.normalize('NFKC').trim().replace(/\s+/g,' '),role:'player'};
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
  try{await db.prepare('INSERT INTO accounts(id,name,name_key,token_hash,role,created_at) VALUES(?,?,?,?,?,?)').bind(a.id,a.name,key,await tokenHash(token),a.role,Date.now()).run();}
  catch(error){if(/UNIQUE|constraint/i.test(error.message))return send(409,{error:'name_taken'});throw error;}
  return send(201,{account:publicAccount(a),token});
 }
 const account=await authenticated(request,db);
 if(!account)return send(401,{error:'invalid_account'});
 if(path==='/accounts/rename'){
  if(!validName(row?.name))return send(400,{error:'invalid_name'});
  const key=nameKey(row.name);
  if(key==='zepu'||account.role==='owner')return send(409,{error:'reserved_name'});
  account.name=row.name.normalize('NFKC').trim().replace(/\s+/g,' ');
  try{await db.prepare('UPDATE accounts SET name=?,name_key=? WHERE id=?').bind(account.name,key,account.id).run();}
  catch(error){if(/UNIQUE|constraint/i.test(error.message))return send(409,{error:'name_taken'});throw error;}
 }
 return send(200,{account:publicAccount(account)});
}
