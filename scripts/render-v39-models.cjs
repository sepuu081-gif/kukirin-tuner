const fs=require('node:fs');
const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const {VEHICLES}=await import('../src/lib/vehicleData.js');const {getVehiclePhoto}=await import('../src/lib/vehiclePhotos.js');
 const added=new Set('a1 t3 x1 m4_legacy m4_pro_2024 m5_pro dt_mini dt_spider2 dt_x_ltd dt_sonic_alien joyor_t10 joyor_s10sz joyor_f5 kaabo_wkgtr kaabo_wolf_gt kaabo_mantis8 kaabo_mantis10 nami_burne2 nami_burne_max nb_zt3_pro nb_max_g30 nb_max_g2 nb_f30 nb_e22 nb_gt2 nb_p1000e surron_light_bee_x surron_ultra_bee stark_varg_mx wish01 wish02_pro wish04 xm_4ultra xm_4pro_600w xm_mi3 xm_5'.split(' '));
 const aliases={m4_pro_2026:'m4_pro_2024',g2_dgt:'g2_2026',xm_ultra4:'xm_4ultra',sebius_g2_wrapped:'g2_2026',sebius_g2pro_wrapped:'g2_pro_2026',sebius_g3_wrapped:'g3',sebius_redbull_g2:'g2_2026'};
 const missing=VEHICLES.filter(v=>!getVehiclePhoto(v)&&!added.has(v.id)&&!aliases[v.id]);
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader']});
 try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5173/');const metadata={},layouts={};
 for(const vehicle of missing){const result=await page.evaluate(async vehicle=>{
  const THREE=await import('/node_modules/.vite/deps/three.js');
  const {createScooterModel,SCOOTER_PROFILES}=await import('/src/lib/scooterModels3D.js');
  const base=vehicle.series==='DT'||vehicle.series==='NAMI'?'g4_max':vehicle.series==='RION'?'g4':vehicle.series==='XM'||vehicle.series==='NB'||vehicle.series==='JOYOR'?'g2_pro_2023':'g2_max';
  const p={...SCOOTER_PROFILES[base],label:vehicle.name,brand:'',frame:'#252d36',arm:'#303b45',trim:vehicle.accentColor||({DT:'#ec313a',RION:'#b4c5cc',XM:'#cc4336',NB:'#f5c13f',NAMI:'#56b99b',JOYOR:'#e3b51e'}[vehicle.series]||'#fa851b'),checker:false,deckRails:vehicle.watts>2000};
  if(['XM','NB','JOYOR'].includes(vehicle.series)){p.suspension='none';p.height=.20;p.deck=.58;p.stem='box';}
  SCOOTER_PROFILES[vehicle.id]=p;
  const model=createScooterModel(vehicle,vehicle.motorCount||1);
  const scene=new THREE.Scene();scene.add(model.group);scene.add(new THREE.HemisphereLight(0xeaf5ff,0x51647d,3));const sun=new THREE.DirectionalLight(0xffeddc,4);sun.position.set(-2,5,4);scene.add(sun);
  const camera=new THREE.OrthographicCamera(-.88,.88,1.62,-.14,.1,10);camera.position.set(0,0,4);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(1000,1000);renderer.setClearColor(0,0);renderer.render(scene,camera);
  const point=(x,y)=>{const v=new THREE.Vector3(x,y,0).project(camera);return [(v.x+1)*50,(1-v.y)*50];};
  const f=point(-model.wheelbase/2,model.radius),r=point(model.wheelbase/2,model.radius),h=point(model.handle[0],model.handle[1]),d=model.radius*2/1.76*100;
  const png=renderer.domElement.toDataURL('image/png').split(',')[1];const layout=[...f,...r,d,h[0],h[1]+2,point(0,model.deckTop)[1],d];
  model.group.traverse(o=>{o.geometry?.dispose();if(o.material){for(const mat of Array.isArray(o.material)?o.material:[o.material]){mat.map?.dispose();mat.dispose();}}});renderer.dispose();return {png,layout};
 },vehicle);
 const file='render-'+vehicle.id.replaceAll('_','-')+'-v39.png';fs.writeFileSync('public/assets/vehicles/'+file,Buffer.from(result.png,'base64'));metadata[vehicle.id]={file,kind:'illustration'};layouts[vehicle.id]=result.layout.map(v=>Math.round(v*100)/100);console.log('Rendered',vehicle.id);
 }
 fs.writeFileSync('../../outputs/v39-render-metadata.json',JSON.stringify(metadata,null,2));fs.writeFileSync('../../outputs/v39-render-layouts.json',JSON.stringify(layouts,null,2));fs.writeFileSync('../../outputs/v39-aliases.json',JSON.stringify(aliases,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
