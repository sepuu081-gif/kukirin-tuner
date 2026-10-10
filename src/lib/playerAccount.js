import {leaderboardURL,DEFAULT_LEADERBOARD_URL} from './leaderboard';
const KEY='kukirin_player_account_v73';
let verified=null;
export function savedAccount(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch{return null;}}
export function accountHeaders(){const a=savedAccount();return a?.token&&a.origin===leaderboardURL()?{Authorization:`Bearer ${a.token}`}:{ };}
export function customPowerLimit(){return verified?.role==='owner'?200000:20000;}
export function customPowerAllowed(part){return !(part?.custom&&part.category==='motor')||Math.max(Number(part.watts)||0,Number(part.baseSpecs?.watts)||0)<=customPowerLimit();}
function remember(account,token){verified=account;localStorage.setItem(KEY,JSON.stringify({...account,token,origin:leaderboardURL()||DEFAULT_LEADERBOARD_URL}));localStorage.setItem('kukirin_rider_name',account.name);localStorage.setItem('kukirin_name_started','true');window.dispatchEvent(new Event('kukirin:account-updated'));return account;}
export async function accountAction(action,name,token=savedAccount()?.token){
 const origin=leaderboardURL()||DEFAULT_LEADERBOARD_URL;
 if(action!=='register'&&savedAccount()?.origin&&savedAccount().origin!==origin&&token===savedAccount().token)throw new Error('different_server');
 let response;try{response=await fetch(`${origin}/accounts/${action}`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({name}),signal:AbortSignal.timeout(8000)});}catch{throw new Error('offline');}
 const data=await response.json();if(!response.ok)throw new Error(data.error||'offline');
 return remember(data.account,data.token||token);
}
export const ACCOUNT_ERRORS={name_taken:['That name is already taken.','See nimi on juba võetud.'],reserved_name:['Zepu is reserved. Use your account key to sign in.','Zepu on reserveeritud. Sisenemiseks kasuta konto võtit.'],invalid_account:['Account key is invalid.','Konto võti ei sobi.'],invalid_name:['Use 2–24 letters, numbers, spaces, dots, _ or -.','Kasuta 2–24 tähte, numbrit, tühikut, punkti, _ või -.'],offline:['Connect to the internet to reserve a name.','Nime registreerimiseks ühenda internetiga.'],different_server:['This account belongs to a different server.','See konto kuulub teisele serverile.']};
