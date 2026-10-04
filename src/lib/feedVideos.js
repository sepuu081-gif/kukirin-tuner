const DB='kukirin_feed_videos';
function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore('clips',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function transaction(mode,operation){const db=await openDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('clips',mode);const req=operation(tx.objectStore('clips'));let result;req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Storage transaction aborted'));});}finally{db.close();}}
export const loadFeedVideos=()=>transaction('readonly',store=>store.getAll());
export async function addFeedVideo(file){
 if(!file.type.startsWith('video/'))throw new Error('video');
 if(file.size>100*1024*1024)throw new Error('size');
 const clip={id:crypto.randomUUID(),name:file.name.replace(/\.[^.]+$/,''),blob:file,created:Date.now(),local:true};
 await transaction('readwrite',store=>store.add(clip));return clip;
}
export const removeFeedVideo=id=>transaction('readwrite',store=>store.delete(id));
export const FEATURED_VIDEOS=[
 {id:'xiaomi-details',src:'/assets/feed/xiaomi-details.mp4',poster:'/assets/feed/xiaomi-details.jpg',name:'Xiaomi 4 Pro · detailid',nameEn:'Xiaomi 4 Pro · details'},
 {id:'xiaomi-deck',src:'/assets/feed/xiaomi-deck.mp4',poster:'/assets/feed/xiaomi-deck.jpg',name:'Xiaomi 4 Pro · kokkupanek',nameEn:'Xiaomi 4 Pro · assembly'},
 {id:'xiaomi-overview',src:'/assets/feed/xiaomi-overview.mp4',poster:'/assets/feed/xiaomi-overview.jpg',name:'Xiaomi 4 Pro · ülevaade',nameEn:'Xiaomi 4 Pro · overview'},
].map(clip=>({...clip,author:'Made in Misha',source:'https://commons.wikimedia.org/wiki/File:El_mejor_patinete_El%C3%A9ctrico!!_Xiaomi_Electric_Scooter_4_Pro_Unboxing.webm',license:'CC BY 3.0'}));
