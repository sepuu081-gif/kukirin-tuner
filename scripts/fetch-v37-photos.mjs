import fs from 'node:fs/promises';
const targets=[
 ['inmotion_rs','https://inmotionworld.com/products/inmotion-rs'],
 ['inmotion_rs_lite','https://inmotionworld.com/products/inmotion-rs-lite'],
 ['inmotion_air_pro','https://inmotionworld.com/products/inmotion-air-pro-portable-folding-electric-scooter-for-adults'],
 ['dt_thunder3','https://dualtronusa.com/products/dualtron-thunder-3-electric-scooter'],
 ['dt_victor_limited','https://dualtronusa.com/products/dualtron-victor-limited-electric-scooter'],
 ['dt_city','https://dualtronusa.com/products/dualtron-city-ey4'],
 ['dt_new_storm','https://dualtronusa.com/products/dualtron-new-storm-electric-scooter'],
];
const manifest=[];
for(const [id,page] of targets){try{const res=await fetch(page+'.js');if(!res.ok)throw Error(res.status);const data=await res.json();const images=data.images.slice(0,12);console.log(id,JSON.stringify({title:data.title,images}));manifest.push({id,page,title:data.title,images,description:data.description.replace(/<[^>]*>/g,' ').slice(0,3500)});for(const i of [0,1,2,7,8,9]){if(!images[i])continue;const url='https:'+images[i];const bytes=await fetch(url);const ext=new URL(url).pathname.split('.').at(-1);await fs.writeFile(`../../outputs/v37-${id}-${i}.${ext}`,Buffer.from(await bytes.arrayBuffer()));}}catch(e){console.log(id,'FAILED',e.message);}}
await fs.writeFile('../../outputs/v37-photo-candidates.json',JSON.stringify(manifest,null,2));
