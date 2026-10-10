import * as THREE from 'three';
import {optionFor} from './internalComponents';
import {buildDetailedComponent} from './workshopDetailedModels';
import {assemblyRecipe,componentKind,componentVariant} from './workshopParts';

// Lightweight actual mesh assemblies, with individual moving subassemblies.
// Dimensions of internal parts are game representations, not factory CAD.
export function createWorkshopModel(part={},quality='high') {
 const vector=quality==='vector';
 const kind=componentKind(part),seed=componentVariant(part),recipe=assemblyRecipe(part),root=new THREE.Group();
 root.name=part.id||kind;root.userData.kind=kind;
 const mats={metal:new THREE.MeshStandardMaterial({color:'#aeb9c4',metalness:.88,roughness:.25}),dark:new THREE.MeshStandardMaterial({color:'#242d35',metalness:.7,roughness:.34}),copper:new THREE.MeshStandardMaterial({color:'#ca733d',metalness:.85,roughness:.3}),pcb:new THREE.MeshStandardMaterial({color:kind==='bms'?'#236647':'#174951',metalness:.22,roughness:.5}),rubber:new THREE.MeshStandardMaterial({color:'#161c22',roughness:.9}),accent:new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL((seed%360)/360,.56,.52),metalness:.5,roughness:.35}),glass:new THREE.MeshStandardMaterial({color:'#61b4d0',transparent:true,opacity:.35,metalness:.3,roughness:.16}),white:new THREE.MeshStandardMaterial({color:'#d8e8e7',roughness:.55})};
 Object.assign(mats,{cell:new THREE.MeshStandardMaterial({color:'#6d93a5',roughness:.54,metalness:.12}),insulation:new THREE.MeshStandardMaterial({color:'#b9a475',roughness:.88}),magnet:new THREE.MeshStandardMaterial({color:'#6b737b',roughness:.36,metalness:.83}),trace:new THREE.MeshStandardMaterial({color:'#bda35c',metalness:.6,roughness:.35}),capacitor:new THREE.MeshStandardMaterial({color:'#20354c',roughness:.5,metalness:.23}),connector:new THREE.MeshStandardMaterial({color:'#d8af35',roughness:.56}),phaseA:new THREE.MeshStandardMaterial({color:'#a73e30',roughness:.6}),phaseB:new THREE.MeshStandardMaterial({color:'#45627a',roughness:.6}),phaseC:new THREE.MeshStandardMaterial({color:'#b7a46b',roughness:.6})});
 if(!vector&&typeof document!=='undefined'){
  const surface=document.createElement('canvas');surface.width=128;surface.height=128;const ctx=surface.getContext('2d');ctx.fillStyle='#999999';ctx.fillRect(0,0,128,128);for(let i=0;i<128;i++){const shade=120+(i*37%90);ctx.strokeStyle='rgb('+shade+','+shade+','+shade+')';ctx.beginPath();ctx.moveTo(0,i+.5);ctx.lineTo(128,i+.5);ctx.stroke();}const grain=new THREE.CanvasTexture(surface);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(3,1);mats.metal.roughnessMap=grain;mats.copper.roughnessMap=grain;
 }
 const labelCache=new Map();
 const geometryCache=new Map(),geo=(key,make)=>{if(!geometryCache.has(key))geometryCache.set(key,make());return geometryCache.get(key);};
 const mesh=(g,geometry,mat,pos=[0,0,0])=>{const m=new THREE.Mesh(geometry,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
 const box=(g,size,mat,pos)=>mesh(g,geo('b'+size.join(','),()=>new THREE.BoxGeometry(...size)),mat,pos);
 const cyl=(g,r,h,mat,pos=[0,0,0],segments=24)=>mesh(g,geo('c'+r+','+h+','+segments,()=>new THREE.CylinderGeometry(r,r,h,vector?Math.min(segments,8):segments)),mat,pos);
 const tor=(g,r,t,mat,pos=[0,0,0])=>mesh(g,geo('t'+r+','+t,()=>new THREE.TorusGeometry(r,t,vector?4:8,vector?12:40)),mat,pos);
 const ring=(g,inner,outer,depth,mat,pos=[0,0,0])=>{const shape=new THREE.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);return mesh(g,geo('r'+inner+','+outer+','+depth,()=>new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:vector?12:32})),mat,pos);};
 const line=(g,points,r,mat)=>mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,r,5,false),mat);
 const bolts=(g,count,r,z)=>{for(let i=0;i<count;i++){const a=i/count*Math.PI*2;const m=cyl(g,.028,.025,mats.metal,[Math.cos(a)*r,Math.sin(a)*r,z],6);m.rotation.x=Math.PI/2;}};
 const pcb=(g,w=1.8,d=1.15,y=0)=>{box(g,[w,.045,d],mats.pcb,[0,y,0]);for(let i=0;i<12;i++){box(g,[w*.7,.006,.009],mats.copper,[0,y+.026,-d*.4+i*d*.073]);}for(let i=0;i<8;i++)box(g,[.08,.028,.045],mats.white,[-w*.36+i*w*.1,y+.045,d*.3]);};
 const pad=(g,w,h,depth,mat,pos,tab=false)=>{const shape=new THREE.Shape(),x=w/2,y=h/2,r=.035;shape.moveTo(-x+r,-y);shape.lineTo(x-r,-y);shape.quadraticCurveTo(x,-y,x,-y+r);shape.lineTo(x,y-r);shape.quadraticCurveTo(x,y,x-r,y);if(tab){shape.lineTo(.065,y);shape.lineTo(.065,y+.09);shape.quadraticCurveTo(0,y+.16,-.065,y+.09);shape.lineTo(-.065,y);const hole=new THREE.Path();hole.absarc(0,y+.07,.031,0,Math.PI*2,true);shape.holes.push(hole);}shape.lineTo(-x+r,y);shape.quadraticCurveTo(-x,y,-x,y-r);shape.lineTo(-x,-y+r);shape.quadraticCurveTo(-x,-y,-x+r,-y);return mesh(g,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:1,curveSegments:vector?4:8}),mat,pos);};
 const wheelKind=['motor','wheel','rotor','brakes','bearings','steering_bearing','tyre','fork_seal','winding'].includes(kind);
 const nodes=recipe.map((step,index)=>{
  const g=new THREE.Group();g.name=step.key;g.userData.step=step;g.userData.slotId=step.key;root.add(g);const k=step.key;
  if(buildDetailedComponent(kind,k,g,part,recipe,{mesh,box,cyl,tor,ring,line,mats,vector,labelCache})) { /* Detailed assemblies retain the existing stage keys. */ } else if(kind==='motor'||kind==='winding'){
   if(k==='case')ring(g,.83,1,.28,mats.dark,[0,0,-.14]);
   if(k==='stator'){ring(g,.2,.65,.16,mats.metal,[0,0,-.08]);for(let i=0;i<18;i++){const a=i/18*Math.PI*2;box(g,[.11,.22,.2],mats.metal,[Math.cos(a)*.64,Math.sin(a)*.64,0]).rotation.z=a-Math.PI/2;}}
   if(k==='windings'){for(let i=0;i<18;i++){const a=i/18*Math.PI*2;for(let j=0;j<5;j++){const c=tor(g,.071,.012,mats.copper,[Math.cos(a)*.57,Math.sin(a)*.57,-.056+j*.028]);c.scale.y=1.52;c.rotation.z=a-Math.PI/2;}}}
   if(k==='magnets'){for(let i=0;i<26;i++){const a=i/26*Math.PI*2;box(g,[.13,.07,.21],i%2?mats.metal:mats.dark,[Math.cos(a)*.81,Math.sin(a)*.81,0]).rotation.z=a+Math.PI/2;}}
   if(k==='hall'){for(let i=0;i<3;i++){const a=i*Math.PI/3;box(g,[.12,.13,.04],mats.pcb,[Math.cos(a)*.48,Math.sin(a)*.48,.15]);box(g,[.04,.055,.025],mats.dark,[Math.cos(a)*.48,Math.sin(a)*.48,.18]);}}
   if(k==='rotor')ring(g,.88,.99,.14,mats.accent,[0,0,-.07]);
   if(k==='bearings'){ring(g,.08,.21,.1,mats.metal,[0,0,.13]);tor(g,.145,.031,mats.rubber,[0,0,.245]);}
   if(k==='axle'){cyl(g,.08,.86,mats.metal).rotation.x=Math.PI/2;}
   if(k==='cover'){ring(g,.1,.98,.036,mats.dark,[0,0,.21]);bolts(g,8,.9,.26);}
   if(k==='insulation')tor(g,.7,.022,mats.white,[0,0,.16]);
  }else if(kind==='battery'||kind==='cell_balance'){
   const cells=kind==='battery'?recipe.filter(s=>s.key.startsWith('cell-')).length:12,columns=Math.ceil(Math.sqrt(cells*1.6)),rows=Math.ceil(cells/columns),spacing=2/columns;
   if(k==='case'||k==='tray'){box(g,[2.14,.06,rows*spacing+.14],mats.dark,[0,-.44,0]);for(const x of [-1.05,1.05])box(g,[.055,.25,rows*spacing+.14],mats.dark,[x,-.34,0]);}
   const cell=(i)=>{const x=(i%columns-(columns-1)/2)*spacing,z=(Math.floor(i/columns)-(rows-1)/2)*spacing;const c=cyl(g,spacing*.43,.72,i%3?mats.accent:mats.dark,[x,-.035,z],12);c.name='virtual-cell-'+i;cyl(g,spacing*.31,.014,mats.metal,[x,.334,z],12);tor(g,spacing*.34,.007,mats.white,[x,.342,z]).rotation.x=Math.PI/2;};
   if(k.startsWith('cell-'))cell(Number(k.split('-')[1]));
   if(k==='cells')for(let i=0;i<cells;i++)cell(i);
   if(k==='links'){for(let row=0;row<rows;row++)box(g,[1.94,.008,.035],mats.metal,[0,.353,(row-(rows-1)/2)*spacing]);}
   if(k==='bms'){pcb(g,.8,.48,.39);box(g,[.15,.055,.15],mats.dark,[0,.44,0]);}
   if(k==='connector'){box(g,[.22,.13,.18],mats.accent,[1.16,0,0]);line(g,[[1,.35,0],[1.2,.35,.2],[1.2,0,0]],.014,mats.rubber);}
   if(k==='cover')box(g,[2.18,.055,rows*spacing+.17],mats.dark,[0,.52,0]);
  }else if(['controller','bms','electronics','vesc_display'].includes(kind)){
   if(k==='case'){box(g,[2.05,.07,1.4],mats.metal,[0,-.16,0]);for(let i=0;i<12;i++)box(g,[1.95,.15,.025],mats.dark,[0,-.24,-.65+i*.117]);}
   if(k==='pcb')pcb(g);
   if(k==='mosfets'){for(const z of [-.43,.43])for(let i=0;i<6;i++){box(g,[.18,.1,.18],mats.dark,[-.65+i*.26,.09,z]);for(let pin=0;pin<3;pin++)box(g,[.016,.035,.09],mats.metal,[-.7+i*.26+pin*.043,.04,z-Math.sign(z)*.12]);}}
   if(k==='caps'){for(let i=0;i<3;i++){cyl(g,.16,.36,mats.dark,[-.45+i*.45,.22,-.05]);cyl(g,.148,.006,mats.metal,[-.45+i*.45,.405,-.05]);box(g,[.19,.004,.014],mats.dark,[-.45+i*.45,.41,-.05]);}}
   if(k==='processor'){box(g,[.29,.045,.29],mats.dark,[.4,.055,.1]);for(let j=0;j<10;j++){box(g,[.01,.018,.045],mats.metal,[.275+j*.027,.044,-.066]);box(g,[.01,.018,.045],mats.metal,[.275+j*.027,.044,.266]);}}
   if(k==='sensor'){cyl(g,.11,.1,mats.metal,[0,.08,0]);}
   if(k==='connectors'){for(let i=0;i<3;i++){box(g,[.29,.15,.2],mats.white,[-.55+i*.55,.12,.55]);for(let j=0;j<4;j++)cyl(g,.012,.17,mats.metal,[-.63+i*.55+j*.053,.07,.55],8);}}
   if(k==='cooling')box(g,[1.6,.025,.97],mats.white,[0,-.08,0]);
   if(k==='cover')box(g,[2.06,.04,1.42],mats.dark,[0,.48,0]);
   if(k==='screen'){box(g,[1.7,.035,1.02],mats.dark,[0,.17,0]);box(g,[1.52,.015,.88],mats.glass,[0,.195,0]);for(let i=0;i<5;i++)box(g,[.17,.004,.035],mats.accent,[-.5+i*.25,.207,-.2]);}
   if(k==='clamp')tor(g,.28,.065,mats.dark,[0,-.34,0]);
  }else if(['wheel','tyre'].includes(kind)){
   if(k==='rim'){ring(g,.28,.75,.12,mats.metal,[0,0,-.06]);for(let i=0;i<10;i++){const a=i*Math.PI/5;box(g,[.53,.075,.09],mats.dark,[Math.cos(a)*.4,Math.sin(a)*.4,0]).rotation.z=a;}}
   if(['tyre','carcass'].includes(k))tor(g,.83,.17,mats.rubber);
   if(k==='bead')tor(g,.67,.033,mats.metal);
   if(k==='tread'){for(let i=0;i<40;i++){const a=i*Math.PI/20;for(const z of [-.085,.085])box(g,[.06,.025,.07],mats.rubber,[Math.cos(a),Math.sin(a),z]).rotation.z=a-Math.PI/2;}}
   if(k==='bearings')ring(g,.08,.21,.13,mats.metal);
   if(k==='axle')cyl(g,.07,.7,mats.metal).rotation.x=Math.PI/2;
   if(k==='valve')cyl(g,.025,.22,mats.dark,[.4,.56,.13]).rotation.z=-.65;
  }else if(['brakes','rotor','pads'].includes(kind)){
   if(['rotor','ring'].includes(k)){ring(g,.42,1,.025,mats.metal);for(let i=0;i<24;i++){const a=i*Math.PI/12;box(g,[.12,.037,.004],mats.dark,[Math.cos(a)*.86,Math.sin(a)*.86,.029]).rotation.z=a;}}
   if(k==='carrier'){ring(g,.12,.5,.035,mats.dark);for(let i=0;i<6;i++){const a=i*Math.PI/3;box(g,[.42,.1,.026],mats.metal,[Math.cos(a)*.48,Math.sin(a)*.48,0]).rotation.z=a;}}
   if(k==='rivets')bolts(g,6,.52,.07);
   if(k==='caliper'){box(g,[.43,.69,.42],mats.accent,[.83,.26,.1]);cyl(g,.14,.045,mats.dark,[.83,.26,.35]).rotation.x=Math.PI/2;}
   if(k==='pads'||k==='backing'){for(const z of [-.07,.11]){pad(g,.32,.47,.024,mats.dark,[kind==='pads'?.24:.81,kind==='pads'?0:.25,z-.08],true);}}
   if(k==='friction'){for(const z of [-.1,.08]){pad(g,.285,.39,.036,mats.rubber,[.24,0,z]);for(const x of [-.04,.04])box(g,[.009,.37,.002],mats.dark,[.24+x,0,z+.037]);}}
   if(k==='pistons'){for(const y of [.08,.4])cyl(g,.085,.13,mats.metal,[.84,y,.28]).rotation.x=Math.PI/2;}
   if(k==='lever'){tor(g,.12,.039,mats.dark,[-.6,.65,.2]);line(g,[[-.48,.64,.2],[-.19,.72,.2],[.04,.6,.2]],.027,mats.metal);}
   if(k==='hose')line(g,[[.84,.6,.16],[.43,1,.25],[-.62,.96,.23],[-.65,.68,.2]],.018,mats.rubber);
   if(k==='spring')line(g,[[.3,-.1,-.06],[.45,.18,0],[.3,.32,.08]],.014,mats.metal);
  }else if(['bearings','steering_bearing','fork_seal'].includes(kind)){
   if(k==='outer'||k==='ring')ring(g,.67,.88,.2,mats.metal,[0,0,-.1]);
   if(k==='inner')ring(g,.37,.52,.19,mats.metal,[0,0,-.095]);
   if(k==='balls'){for(let i=0;i<14;i++){const a=i*Math.PI/7;mesh(g,geo('ball',()=>new THREE.SphereGeometry(.09,vector?6:12,vector?4:8)),mats.metal,[Math.cos(a)*.59,Math.sin(a)*.59,0]);}}
   if(['seal','cap','lip'].includes(k))ring(g,.4,.85,.03,mats.rubber,[0,0,.13]);
   if(k==='spring')tor(g,.58,.019,mats.metal,[0,0,.08]);
  }else if(kind==='suspension'||kind==='damper'){
   const dual=kind==='suspension',xs=dual?[-.45,.45]:[0];
   if(k==='crown'||k==='clamps'){box(g,[dual?1.2:.5,.16,.38],mats.dark,[0,.79,0]);if(dual)cyl(g,.11,.4,mats.metal,[0,1.02,0]);}
   if(['outer','body'].includes(k))for(const x of xs)cyl(g,dual?.12:.21,1.04,mats.dark,[x,.25,0]);
   if(['slider','shaft'].includes(k))for(const x of xs)cyl(g,.075,1.01,mats.metal,[x,-.56,0]);
   if(k==='seals')for(const x of xs)tor(g,dual?.12:.21,.025,mats.rubber,[x,-.25,0]).rotation.x=Math.PI/2;
   if(k==='axle')cyl(g,.055,1.14,mats.metal,[0,-1.04,0]).rotation.z=Math.PI/2;
  }else if(kind==='gearing'){
   if(k==='carrier')ring(g,.1,.55,.08,mats.dark);
   if(k==='sprocket'){ring(g,.42,.8,.04,mats.metal);for(let i=0;i<32;i++){const a=i*Math.PI/16;box(g,[.07,.1,.044],mats.metal,[Math.cos(a)*.82,Math.sin(a)*.82,0]).rotation.z=a;}}
   if(k==='chain'){for(let i=0;i<44;i++){const a=i*Math.PI/22;tor(g,.033,.012,mats.dark,[Math.cos(a)*1.04,Math.sin(a)*.78,0]).scale.x=1.6;}}
   if(k==='guard')ring(g,.88,1.13,.06,mats.accent,[0,0,.1]);
  }else if(kind==='wheelie_bar'){
   if(k==='plate'){box(g,[.65,.07,.82],mats.dark,[-.7,0,0]);for(const x of [-.85,-.55])for(const z of [-.25,.25])cyl(g,.041,.08,mats.metal,[x,.055,z],6);}
   if(k==='rails')for(const z of [-.43,.43]){box(g,[1.85,.19,.06],mats.dark,[0,.18,z]);for(let i=0;i<20;i++)box(g,[.042,.043,.068],mats.dark,[-.85+i*.087,.3,z]);}
   if(k==='crossbar')cyl(g,.09,.9,mats.dark,[.48,.2,0]).rotation.x=Math.PI/2;
   if(k==='clamps')for(const z of [-.34,.34])tor(g,.056,.026,mats.metal,[-.63,.1,z]).rotation.x=Math.PI/2;
  }else if(kind==='cooling'){
   if(k==='heatsink'){box(g,[1.8,.05,1.5],mats.metal,[0,-.1,0]);for(let i=0;i<16;i++)box(g,[1.8,.2,.028],mats.metal,[0,-.22,-.7+i*.093]);}
   if(k==='fan'){cyl(g,.13,.07,mats.dark,[0,.1,0]);for(let i=0;i<7;i++){const blade=box(g,[.65,.028,.19],mats.dark,[Math.cos(i*Math.PI*2/7)*.32,.15,Math.sin(i*Math.PI*2/7)*.32]);blade.rotation.y=-i*Math.PI*2/7+.55;}}
   if(k==='guard'){tor(g,.74,.03,mats.metal,[0,.23,0]).rotation.x=Math.PI/2;for(let i=0;i<5;i++)box(g,[1.4,.015,.014],mats.metal,[0,.23,-.55+i*.27]);}
   if(k==='mount')for(const x of [-.8,.8])box(g,[.11,.16,1.5],mats.dark,[x,0,0]);
  }else if(['throttle','charge_port','headlight','hall','motor_sensor','screen_delete','wiring','kickstand','chassis'].includes(kind)){
   if(kind==='throttle'){
    if(k==='clamp')tor(g,.35,.07,mats.dark);
    if(k==='sensor')box(g,[.21,.17,.15],mats.pcb,[.3,.11,.1]);
    if(k==='spring')tor(g,.16,.017,mats.metal,[.32,-.16,.1]);
    if(k==='paddle'){line(g,[[.3,0,.1],[.58,-.32,.1],[.73,-.53,.1]],.09,mats.dark);box(g,[.36,.1,.28],mats.rubber,[.67,-.49,.12]);}
   }else if(kind==='headlight'){
    if(k==='body')cyl(g,.65,.58,mats.dark).rotation.x=Math.PI/2;
    if(k==='reflector'){const c=mesh(g,new THREE.ConeGeometry(.59,.35,32,1,true),mats.metal,[0,0,.08]);c.rotation.x=Math.PI/2;}
    if(k==='led'){cyl(g,.15,.025,mats.pcb,[0,0,.14]).rotation.x=Math.PI/2;box(g,[.13,.13,.03],mats.white,[0,0,.18]);}
    if(k==='lens')cyl(g,.61,.025,mats.glass,[0,0,.32]).rotation.x=Math.PI/2;
    if(k==='mount')box(g,[.25,.58,.14],mats.dark,[0,-.63,0]);
   }else if(kind==='chassis'){
    if(k==='frame')box(g,[2,.16,.35],mats.dark);
    if(k==='seam'){for(let i=0;i<14;i++)mesh(g,geo('seam',()=>new THREE.SphereGeometry(.025,8,5)),mats.metal,[-.12+i*.018,.09,.18]);}
    if(k==='finish')box(g,[.35,.013,.37],mats.dark,[0,.087,0]);
   }else if(kind==='kickstand'){
    if(k==='bracket')box(g,[.38,.25,.16],mats.dark,[0,.5,0]);
    if(k==='leg'){cyl(g,.065,1.4,mats.dark,[0,-.25,0]).rotation.z=.2;box(g,[.37,.05,.22],mats.rubber,[.15,-.95,0]);}
    if(k==='spring')line(g,[[.1,.5,0],[.25,.2,0],[.03,-.05,0]],.026,mats.metal);
   }else if(kind==='hall'||kind==='motor_sensor'){
    if(k==='board')pcb(g,1.1,.45);
    if(k==='sensor'||k==='sensors')for(let i=0;i<(kind==='hall'?3:1);i++){box(g,[.13,.15,.14],mats.dark,[-.4+i*.4,.13,0]);for(let j=0;j<3;j++)cyl(g,.01,.1,mats.metal,[-.44+i*.4+j*.04,.05,.08],6);}
    if(k==='connector')box(g,[.3,.13,.2],mats.white,[.55,.08,0]);
   }else{
    if(['housing','connector'].includes(k)){cyl(g,.34,.29,mats.dark).rotation.x=Math.PI/2;ring(g,.2,.36,.04,mats.metal,[0,0,.15]);}
    if(k==='contacts')for(let i=0;i<3;i++){const a=i*Math.PI*2/3;cyl(g,.035,.18,mats.copper,[Math.cos(a)*.12,Math.sin(a)*.12,.15]).rotation.x=Math.PI/2;}
    if(['seal','cap'].includes(k))tor(g,.34,.027,mats.rubber,[0,0,.22]);
    if(k==='cap')cyl(g,.35,.05,mats.dark,[0,0,.26]).rotation.x=Math.PI/2;
    if(k==='rfid'){box(g,[.45,.08,.32],mats.dark,[.65,0,0]);for(let i=0;i<3;i++){const coil=tor(g,.11+i*.025,.008,mats.copper,[.65,.052,0]);coil.rotation.x=Math.PI/2;}}
    if(k==='radio'){const radio=new THREE.Group();g.add(radio);radio.position.set(-.65,0,0);pcb(radio,.45,.3);box(radio,[.14,.045,.12],mats.metal,[0,.05,0]);line(radio,[[-.17,.04,0],[-.17,.04,.1],[.17,.04,.1]],.008,mats.copper);}
    if(k==='mount'){tor(g,.22,.04,mats.dark,[0,-.5,-.1]);box(g,[.4,.045,.65],mats.dark,[0,0,-.5]);for(const x of [-.27,.27])for(const z of [-.83,-.2])box(g,[.14,.14,.09],mats.accent,[x,.06,z]);}
    if(k==='loom'||k==='loop')for(let i=0;i<(kind==='wiring'?3:1);i++)line(g,[[-.2,0,i*.06],[-.6,.45,i*.06],[.2,.6,i*.06],[.4,0,i*.06]],.022,i%2?mats.accent:mats.rubber);
   }
  }
  if(!g.children.length)throw new Error('Empty model: '+kind+'/'+k);
  g.traverse(o=>{if(!o.isMesh)return;o.userData.slotId=k;o.material=o.material.clone();const entry=part.internalBuild?.slots?.[k];if(entry&&entry.model!=='standard'){const option=optionFor(entry);if(!o.material.map)o.material.color.lerp(new THREE.Color(option.color),o.material.metalness<.75?.65:.18);o.material.roughness=Math.min(1,o.material.roughness*(entry.model==='performance'?.75:entry.model==='endurance'?1.18:1));} });if(part.internalBuild?.slots?.[k]?.model==='incompatible'&&!k.startsWith('cell-'))g.scale.setScalar(1.16);
  g.userData.home=g.position.clone();g.userData.index=index;return g;
 });
 const dimension=kind==='battery'?1+Math.min(.18,(part.capacity||12)/300):1+Math.min(.18,((part.size||part.sizeClass||3)-3)*.018);
 root.scale.setScalar(dimension);root.rotation.x=wheelKind?-.08:.46;
 const bounds=new THREE.Box3().setFromObject(root),extent=bounds.getSize(new THREE.Vector3());root.scale.multiplyScalar(2.4/Math.max(.1,extent.x,extent.y,extent.z));const center=new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());root.position.sub(center);
 root.userData.signature=seed+':'+kind+':'+recipe.length;
 const spin=nodes.find(n=>['rotor','fan','rim','ring','inner','sprocket'].includes(n.name));
 return {root,nodes,recipe,spin,mats,kind,dispose(){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.roughnessMap?.dispose();m.dispose();});}};
}
