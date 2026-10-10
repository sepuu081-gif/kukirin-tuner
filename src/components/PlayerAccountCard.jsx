import {useState} from 'react';
import {useLanguage} from '../lib/i18n';
import {savedAccount} from '../lib/playerAccount';
export default function PlayerAccountCard(){
 const {language}=useLanguage(),et=language==='et',[shown,setShown]=useState(false),[copied,setCopied]=useState(false),a=savedAccount();
 return <div className="rounded-xl border border-border bg-card p-4 space-y-3"><b>{et?'Konto võti':'Account key'}</b><p className="text-xs text-muted-foreground">{a?(et?'Hoia võti enda teada. Sellega saad oma nime teises seadmes kasutada. Garaaži salvestused ei liigu automaatselt kaasa.':'Keep this key private. It restores your name on another device; garage saves do not transfer automatically.'):(et?'Nime registreerimiseks taaskäivita mäng internetiühendusega.':'Restart the game while online to reserve your name.')}</p>{a&&<><button onClick={()=>setShown(v=>!v)}>{shown?(et?'Peida võti':'Hide key'):(et?'Näita konto võtit':'Show account key')}</button>{shown&&<><input className="w-full bg-background p-2 rounded" readOnly value={a.token} aria-label="Account key"/><button onClick={async()=>{try{await navigator.clipboard.writeText(a.token);setCopied(true);}catch{setCopied(false);}}}>{copied?(et?'Kopeeritud':'Copied'):(et?'Kopeeri võti':'Copy key')}</button></>}</>}</div>;
}
