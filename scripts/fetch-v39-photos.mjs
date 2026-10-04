import fs from 'node:fs/promises';
const catalog=JSON.parse(await fs.readFile('../../outputs/v39-catalogs.json'));
const targets={
 t3:['https://kukirin.global','kukirin-t3-electric-scooter'],a1:['https://kukirinscooter.co.uk','kukirin-a1-electric-scooter'],x1:['https://kukirin.global','kukirin-x1-e-bike'],m5_pro:['https://kukiringlobal.com','kukirin-m5-pro'],wish01:['https://kukiringlobal.com','kugoo-wish-01'],wish02_pro:['https://kukiringlobal.com','kugoo-wish-02-pro'],wish04:['https://kukiringlobal.com','kugoo-wish-04'],
 dt_sonic_alien:['https://dualtronusa.com','dualtron-sonic-model-a-alien-electric-scooter'],dt_x_ltd:['https://dualtronusa.com','dualtron-x-limited-electric-scooter'],dt_mini:['https://dualtronusa.com','dualtron-mini-electric-scooter'],dt_spider2:['https://dualtronusa.com','dualtron-spider-2-electric-scooter'],dt_eagle_pro:['https://dualtronusa.com','dualtron-eagle-pro-electric-scooter'],dt_thunder:['https://dualtronusa.com','dualtron-thunder-electric-scooter'],
 joyor_t10:['https://joyor.com','joyor-t10-electric-scooter'],joyor_s10sz:['https://joyor.com','joyor-s10-s-z-electric-scooter'],joyor_f5:['https://joyor.com','joyor-f5-eu-electric-scooter'],joyor_x3s:['https://joyorescooter.com','joyor-x3-s'],joyor_a3:['https://joyorescooter.com','joyor-a3'],
 kaabo_wkgtr:['https://www.kaabousa.com','kaabo-king-gtr'],kaabo_wolf_gt:['https://www.kaabousa.com','kaabo-king-gt-pro-electric-scooter'],kaabo_wolf_warrior:['https://fluidfreeride.com','wolf-warrior-11'],kaabo_mantis8:['https://www.kaabousa.com','kaabo-mantis-8-dual-motor-long-range-city-commuter-foldable-electric-scooter'],kaabo_mantis10:['https://fluidfreeride.com','mantis'],
 nami_burne2:['https://fluidfreeride.com','nami-burn-e'],nami_burne_max:['https://fluidfreeride.com','nami-burn-e-2'],
 nb_zt3_pro:['https://www.segway.la','segway-kickscooter-zt3-pro'],nb_max_g2:['https://www.segway.la','ninebot-kickscooter-max-g2'],nb_max_g30:['https://www.segway.la','ninebot-kickscooter-max'],nb_f30:['https://www.segway.la','ninebot-kickscooter-f30-by-segway'],nb_f40:['https://www.segway.la','ninebot-kickscooter-f40-by-segway'],nb_e22:['https://www.segway.la','copy-of-ninebot-kickscooter-e22'],nb_gt2:['https://www.segway.la','segway-superscooter-gt2'],nb_p1000e:['https://www.segway.la','segway-kickscooter-p100s'],
 surron_ultra_bee:['https://www.voromotors.com','surron-ultra-bee'],surron_light_bee_x:['https://alienrides.com','sur-ron-light-bee-x-electric-dirt-bike'],rion_apex:['https://alienrides.com','rion-apex-fastest-electric-scooter'],
 m4_pro_2024:['https://kukiringlobal.com','kugoo-kirin-m4-pro'],m4_legacy:['https://kukiringlobal.com','kugoo-kirin-m4'],s3_pro:['https://kukiringlobal.com','kugoo-kirin-s3-pro'],c1_pro:['https://kukiringlobal.com','kugoo-kirin-c1-pro'],kukirin_m2pro:['https://kukiringlobal.com','kugoo-kirin-m2-pro'],
};
const manifest=[];
await Promise.all(Object.entries(targets).map(async([id,[store,handle]])=>{try{
 let product=catalog.filter(s=>s.store===store).flatMap(s=>s.products||[]).find(p=>p.handle===handle);
 if(!product){const res=await fetch(store+'/products/'+handle+'.js',{signal:AbortSignal.timeout(16000)});if(!res.ok)throw Error(res.status);product=await res.json();}
 const images=product.images.map(i=>typeof i==='string'?i:i.src).slice(0,5);
 const page=store+'/products/'+handle;
 for(let i=0;i<Math.min(images.length,3);i++){let url=images[i];if(url.startsWith('//'))url='https:'+url;const ext=new URL(url).pathname.split('.').at(-1);const file='../../outputs/v39-'+id+'-'+i+'.'+ext;const res=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error(res.status);await fs.writeFile(file,Buffer.from(await res.arrayBuffer()));}
 manifest.push({id,page,title:product.title,images});console.log(id,product.title);
 }catch(e){console.log(id,'FAILED',e.message)}}));
await fs.writeFile('../../outputs/v39-photo-candidates.json',JSON.stringify(manifest,null,2));
