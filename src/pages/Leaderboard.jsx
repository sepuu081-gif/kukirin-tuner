import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft,Globe,Link2,RefreshCw,Trophy} from 'lucide-react';
import {useLanguage} from '../lib/i18n';
import {connectLeaderboard,disconnectLeaderboard,fetchScores,leaderboardURL,pendingScores} from '../lib/leaderboard';
export default function Leaderboard(){
 const {language}=useLanguage(),et=language==='et';
 const [mode,setMode]=useState('drag'),[rows,setRows]=useState([]),[status,setStatus]=useState('loading');
 const [url,setUrl]=useState(leaderboardURL),[reload,setReload]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(pendingScores);
 useEffect(()=>{let active=true;setStatus('loading');fetchScores(mode).then(data=>{if(active){setRows(data);setStatus('ready');setPending(pendingScores());}}).catch(err=>{if(active){setRows([]);setStatus(err.message==='not_configured'?'setup':'offline');setPending(pendingScores());}});return()=>{active=false;};},[mode,reload]);
 async function connect(event){event.preventDefault();setBusy(true);setError('');try{setUrl(await connectLeaderboard(url));setReload(n=>n+1);}catch(err){setError(err.message);}finally{setBusy(false);setPending(pendingScores());}}
 const messages={invalid_url:et?'Sisesta serveri HTTPS-aadress.':'Enter the HTTPS address of your server.',unreachable:et?'Server ei vastanud. Kontrolli aadressi ja internetiühendust.':'Server did not respond. Check the address and internet connection.',wrong_server:et?'See aadress ei ole sobiv KuKirin Tuner edetabeli server.':'This is not a compatible KuKirin Tuner leaderboard server.'};
 return <main className="leaderboard-page app-surface">
  <Link className="leaderboard-back" to="/"><ArrowLeft size={18}/>{et?'Tagasi':'Back'}</Link>
  <header className="leaderboard-heading"><Trophy/><div><h1>{et?'Ühine edetabel':'Global leaderboard'}</h1><p>{et?'Üks server, kõigi mängijate rekordid.':'One server, every player’s records.'}</p></div></header>
  <section className="leaderboard-connection" aria-label={et?'Edetabeli ühendus':'Leaderboard connection'}>
   <div className="leaderboard-connection-title"><Globe size={20}/><h2>{et?'Ühenda edetabeliga':'Connect to leaderboard'}</h2><span data-state={status}>{status==='ready'?(et?'Ühendatud':'Connected'):status==='offline'?(et?'Võrguühenduseta':'Offline'):status==='loading'&&leaderboardURL()?(et?'Kontrollin':'Checking'):(et?'Ühendamata':'Not connected')}</span></div>
   <p>{et?'Sisesta majutatud serveri aadress. Kõik mängijad kasutavad sama aadressi; ühendus jääb meelde.':'Enter your hosted server address. All players use the same address; the connection is saved.'}</p>
   <form onSubmit={connect}><label htmlFor="leaderboard-server">{et?'Serveri aadress':'Server address'}</label><input id="leaderboard-server" type="url" required disabled={busy} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://your-leaderboard.workers.dev" autoCapitalize="none" spellCheck={false}/><button disabled={busy}><Link2 size={16}/>{busy?(et?'Kontrollin ühendust…':'Checking connection…'):(et?'Kontrolli ja ühenda':'Check & connect')}</button></form>
   {error&&<p className="leaderboard-error" role="alert">{messages[error]||messages.unreachable}</p>}
   <small>{pending} {et?'tulemust ootab saatmist.':'results waiting to upload.'}</small>
   {leaderboardURL()&&<button className="leaderboard-disconnect" disabled={busy} onClick={()=>{disconnectLeaderboard();setUrl('');setError('');setReload(n=>n+1);}}>{et?'Katkesta ühendus':'Disconnect'}</button>}
   {!leaderboardURL()&&<details><summary>{et?'Serverit veel pole?':'No server yet?'}</summary><p>{et?'Serveri kood on valmis. Avalik majutus vajab sinu majutuskontot. Paigaldusjuhis on mängu GitHubis.':'The server code is ready. Public hosting needs your hosting account. Setup instructions are in the game’s GitHub repository.'}</p><a href="https://github.com/sepuu081-gif/kukirin-tuner/tree/main/leaderboard-server" target="_blank" rel="noreferrer">{et?'Ava serveri paigaldusjuhis':'Open server setup guide'}</a></details>}
  </section>
  <nav aria-label={et?'Edetabeli kategooriad':'Leaderboard categories'}>{[['drag','400 m drag'],['speed',et?'Tippkiirus':'Top speed'],['delivery',et?'Kulleritööd':'Deliveries']].map(([id,label])=><button key={id} aria-pressed={mode===id} onClick={()=>setMode(id)}>{label}</button>)}</nav>
  {status==='loading'?<p role="status">{et?'Laadin…':'Loading…'}</p>:status==='setup'?<p role="status">{et?'Ühenda serveriga, et näha kõigi mängijate tulemusi.':'Connect to a server to see everyone’s results.'}</p>:status==='offline'?<p role="status">{et?'Serveriga ei saa praegu ühendust. Sinu saatmata tulemused jäävad alles.':'Server unavailable. Your unsent results are kept.'}</p>:<ol>{rows.map((r,i)=><li key={r.id}><b>{i+1}. {r.name}</b><span>{r.vehicle}</span><strong>{Number(r.value).toFixed(mode==='drag'?3:0)} {mode==='drag'?'s':mode==='speed'?'km/h':'€'}</strong></li>)}{!rows.length&&<p>{et?'Tulemusi veel pole.':'No results yet.'}</p>}</ol>}
  <button className="leaderboard-refresh" disabled={busy||status==='loading'||!leaderboardURL()} onClick={()=>setReload(n=>n+1)}><RefreshCw size={16}/>{et?'Värskenda':'Refresh'}</button>
 </main>;
}