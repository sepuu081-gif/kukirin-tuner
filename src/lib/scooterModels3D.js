import * as THREE from 'three';

// Silhouettes and details reconstructed from the bundled product photos.
// Approximate visual dimensions; these are not manufacturer CAD models.
export const SCOOTER_PROFILES = {
  t3: { label:'T3', frame:'#272d31', arm:'#32383c', trim:'#eabf24', suspension:'coil', deck:.65, width:.21, height:.24, stem:'box', lamp:'bar', tread:'road', deckRails:true },
  g2_2026: { label:'G2', frame:'#41484a', arm:'#41484a', trim:'#ff871c', suspension:'coil', deck:.57, width:.19, height:.25, stem:'box', lamp:'bar', tread:'block', checker:true },
  g2_pro_2023: { label:'G2 Pro', frame:'#171b20', arm:'#fa761b', trim:'#ff7b16', suspension:'coil', deck:.52, width:.18, height:.23, stem:'telescopic', lamp:'round', tread:'block' },
  g2_pro_2026: { label:'G2 Pro', frame:'#171b20', arm:'#fa761b', trim:'#ff7b16', suspension:'coil', deck:.52, width:.18, height:.23, stem:'telescopic', lamp:'round', tread:'block' },
  g2_max: { label:'G2 Max', frame:'#171b20', arm:'#ef781c', trim:'#ff8b25', suspension:'coil', deck:.65, width:.21, height:.26, stem:'telescopic', lamp:'round', tread:'block', rimStripe:true },
  g2_master: { label:'G2 Master', frame:'#202428', arm:'#252a2d', trim:'#ff821b', suspension:'orange-coil', deck:.65, width:.23, height:.26, stem:'box', lamp:'round', tread:'road', armInset:true },
  g3: { label:'G3', frame:'#242829', arm:'#ff871d', trim:'#ff871d', suspension:'elastomer', deck:.6, width:.22, height:.25, stem:'box', lamp:'bar', tread:'block', rimStripe:true },
  g3_pro: { label:'G3 Pro', frame:'#1b1f24', arm:'#ff7b13', trim:'#ff7b13', suspension:'hydraulic', deck:.68, width:.24, height:.28, stem:'orange-panel', lamp:'bar', tread:'block', openArm:true, deckRails:true },
  g4: { label:'G4', frame:'#50595b', arm:'#50595b', trim:'#ff881b', suspension:'coil', deck:.66, width:.23, height:.29, stem:'box', lamp:'bar', tread:'road', checker:true },
  g4_max: { label:'G4 Max', frame:'#191e23', arm:'#202529', trim:'#ff951b', suspension:'fork', deck:.74, width:.28, height:.3, stem:'twin-tube', lamp:'large-round', tread:'block', checker:true, deckRails:true },
};

export function createScooterModel(vehicle, motorCount, appearance = {}) {
  const p = SCOOTER_PROFILES[vehicle.id];
  if (!p) return null;
  const group = new THREE.Group(); group.name = `scooter-${vehicle.id}`;
  group.userData.profile = p.label;
  const r = (vehicle.tireSize || 10) * .0254 / 2;
  const wb = vehicle.wheelbase / 1000;
  const deckTop = p.height + .055;
  const handle = [-.25, p.stem === 'twin-tube' ? 1.4 : p.stem === 'telescopic' ? 1.31 : 1.34, 0];
  const material = (color, metallic = 0, roughness = .5) => new THREE.MeshStandardMaterial({color,metalness:metallic,roughness});
  const frame = material(appearance.deckColor && (appearance.customEnabled || appearance.deckColor !== '#f97316') ? appearance.deckColor : p.frame,.55);
  const black = material('#161b20', .5), rubber = material('#111315',0,.92), silver = material('#9ca4ab',.9,.28);
  const trim = material(appearance.accentColor && (appearance.customEnabled || appearance.accentColor !== '#f97316') ? appearance.accentColor : p.trim,.4);
  const stemPaint = appearance.customEnabled ? material(appearance.stemColor || p.frame,.55) : black;
  const rimPaint = appearance.customEnabled ? material(appearance.wheelColor || '#111827',.65) : silver;
  const arms = material(appearance.customEnabled ? appearance.deckColor : p.arm,.6), dark = material('#070a0e'), light = material('#edf8ff'); light.emissive.set('#bedfff');light.emissiveIntensity=1.5;
  const red = material('#a90914'); red.emissive.set('#ef1723');red.emissiveIntensity=.6;
  const mesh = (parent, geo, mat, xyz=[0,0,0], name='') => {const m=new THREE.Mesh(geo,mat);m.position.set(...xyz);m.castShadow=true;m.receiveShadow=true;m.name=name;parent.add(m);return m;};
  const box = (size,mat,xyz,name='') => mesh(group,new THREE.BoxGeometry(...size),mat,xyz,name);
  const rod = (a,b,radius,mat=black,parent=group) => {const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const m=mesh(parent,new THREE.CylinderGeometry(radius,radius,av.distanceTo(bv),12),mat);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return m;};
  const plate = (points,depth,mat,z=0,name='',hole) => {
    const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
    if(hole){const h=new THREE.Path();hole.forEach(([x,y],i)=>i?h.lineTo(x,y):h.moveTo(x,y));h.closePath();s.holes.push(h);}
    const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.003,bevelThickness:.003});geo.translate(0,0,-depth/2);
    return mesh(group,geo,mat,[0,0,z],name);
  };
  const bolt = (x,y,z,radius=.007) => {const b=mesh(group,new THREE.CylinderGeometry(radius,radius,.008,6),silver,[x,y,z],'frame-bolt');b.rotation.x=Math.PI/2;};
  const spring = (a,b,color) => {
    rod(a,b,.009,silver);
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),length=av.distanceTo(bv);
    const pts=Array.from({length:97},(_,i)=>{const t=i/96;return new THREE.Vector3(Math.cos(t*Math.PI*16)*.025,(t-.5)*length,Math.sin(t*Math.PI*16)*.025);});
    const coil=mesh(group,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),96,.004,5,false),color, [0,0,0],'suspension-spring');coil.position.copy(av).add(bv).multiplyScalar(.5);coil.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());
  };
  const deck = plate([[-p.deck/2,p.height-.04],[-p.deck/2,p.height+.035],[p.deck/2,p.height+.035],[p.deck/2+.015,p.height-.04]],p.width,frame,0,'battery-deck');
  deck.userData.width=p.width;
  box([p.deck-.025,.014,p.width-.015],rubber,[0,deckTop-.012,0],'grip-deck');
  for(let i=0;i<12;i++) box([.018,.003,p.width-.035],black,[-p.deck/2+.035+i*(p.deck-.07)/12,deckTop-.003,0]);
  const neck=[[-p.deck/2-.015,p.height],[-p.deck/2-.05,p.height+.025],[-.48,.49],[-.43,.53],[-p.deck/2+.075,p.height+.04]];
  plate(neck,.09,frame,0,'angled-neck');
  const wheels=[];
  [-wb/2,wb/2].forEach((x,index)=>{
    const rotor=new THREE.Group();rotor.name=index?'rear-wheel':'front-wheel';rotor.position.set(x,r,0);group.add(rotor);wheels.push(rotor);
    const tire=mesh(rotor,new THREE.TorusGeometry(r*.83,r*.17,14,48),rubber,[0,0,0],'tire');tire.scale.z=1.8;
    const blockGeo=new THREE.BoxGeometry(p.tread==='road'?.028:.021,.008,.029);
    const blocks=new THREE.InstancedMesh(blockGeo,rubber,96);blocks.name='tire-tread';rotor.add(blocks);
    const dummy=new THREE.Object3D();for(let j=0;j<96;j++){const angle=(j%48)/48*Math.PI*2+(j>=48?.045:0);dummy.position.set(Math.cos(angle)*(r-.002),Math.sin(angle)*(r-.002),j>=48?.024:-.024);dummy.rotation.set(0,0,angle-Math.PI/2);dummy.updateMatrix();blocks.setMatrixAt(j,dummy.matrix);}
    const powered=index===1||motorCount===2;
    const hub=mesh(rotor,new THREE.CylinderGeometry(r*.64,r*.64,.12,32),appearance.customEnabled?rimPaint:powered?black:silver,[0,0,0],powered?'hub-motor':'free-hub');hub.rotation.x=Math.PI/2;
    for(const z of [-.065,.065]){
      mesh(rotor,new THREE.TorusGeometry(r*.62,.006,6,32),appearance.customEnabled?trim:p.rimStripe?trim:silver,[0,0,z]);
      for(let j=0;j<8;j++){const a=j*Math.PI/4;const cap=mesh(rotor,new THREE.SphereGeometry(.005,6,4),silver,[Math.cos(a)*r*.5,Math.sin(a)*r*.5,z]);cap.scale.z=.5;}
    }
    const brakeMat=silver.clone();brakeMat.side=THREE.DoubleSide;
    mesh(rotor,new THREE.RingGeometry(r*.33,r*.74,40),brakeMat,[0,0,.084],'brake-disc');
    for(let j=0;j<16;j++){const a=j*Math.PI/8;mesh(rotor,new THREE.CircleGeometry(.006,6),dark,[Math.cos(a)*r*.63,Math.sin(a)*r*.63,.085]);}
    const pivotX=index?p.deck/2+.03:-p.deck/2-.03;
    for(const z of [-p.width/2,p.width/2]){
      if(index===0&&p.suspension==='fork'){
        rod([x,r,z],[x+.025,.69,z],.026,black);rod([x,r+.07,z],[x+.02,.49,z],.016,silver);
      }else{
        const points=[[x-.025,r-.015],[x-.023,r+.04],[pivotX,p.height+.055],[pivotX+.025,p.height-.025]];
        const hole=p.openArm?[[x+(index?-.055:.055),r+.015],[pivotX+(index?.025:-.025),p.height+.02],[pivotX+(index?.025:-.025),p.height-.001]]:undefined;
        plate(points,.025,arms,z,'swingarm',hole);
        if(p.armInset)box([.07,.012,.005],trim,[(x+pivotX)/2,(r+p.height)/2+.01,z+Math.sign(z)*.016]);
        if(p.suspension==='elastomer'){
          const b=mesh(group,new THREE.CylinderGeometry(.04,.04,.04,24),trim,[pivotX,p.height+.02,z],'elastomer-block');b.rotation.x=Math.PI/2;
        }else{
          const end=[pivotX+(index?.02:-.02),p.height+.22,z*.6], start=[(x+pivotX)/2,p.height+.045,z*.6];
          spring(start,end,p.suspension==='orange-coil'?trim:black);
          if(p.suspension==='hydraulic')rod(start,end,.018,silver);
        }
      }
      bolt(x,r,z+Math.sign(z)*.018,.013);bolt(pivotX,p.height+.02,z+Math.sign(z)*.018,.014);
    }
    const fender=mesh(group,new THREE.TorusGeometry(r+.024,.014,8,30,Math.PI*.85),black,[x,r,0],'mudguard');fender.rotation.z=Math.PI*.075;fender.scale.z=4.8;
    box([.046,.032,.024],black,[x+(index?-.04:.04),r+.065,.093],'brake-caliper');
  });
  const stemBase=[-.45,.51,0], stemTop=handle;
  if(p.stem==='twin-tube'){
    for(const z of [-.032,.032]){rod([stemBase[0],.5,z],[handle[0],handle[1],z],.019,black);rod([-.44,.52,z],[-.4,.74,z],.015,silver);}
    box([.075,.1,.09],black,[-.43,.53,0],'fork-crown');
  }else{
    const stem=rod(stemBase,stemTop,.028,stemPaint);stem.name='model-stem';
    if(p.stem!=='telescopic'){
      const beam=box([.058,.74,.055],stemPaint,[(stemBase[0]+handle[0])/2,.92,0],'rectangular-stem');beam.rotation.z=-Math.atan2(handle[0]-stemBase[0],handle[1]-stemBase[1]);
    }else rod([-.32,1.04,0],handle,.018,silver);
  }
  box([.077,.055,.071],black,[-.432,.59,0],'folding-hinge');
  box([.012,.08,.022],trim,[-.47,.64,.052],'folding-lock');
  const panel=plate([[-.425,.66],[-.265,1.27],[-.238,1.27],[-.397,.66]],.003,appearance.customEnabled?stemPaint:p.stem==='orange-panel'?trim:black,.032,'stem-panel');
  panel.userData.label=p.label;
  // Embossed stripes and model plates remain readable without external textures.
  const textTexture = (text,color,bg,width=512,height=128) => {
    if(!globalThis.document?.createElement)return null;
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');if(!ctx)return null;
    ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.fillStyle=color;ctx.font='italic bold 54px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,width/2,height/2);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
  };
  const decal=(text,w,h,pos,rotation=0,color=appearance.customEnabled ? appearance.accentColor : p.trim,bg=appearance.customEnabled ? appearance.deckColor : p.frame)=>{
    const tex=textTexture(text,color,bg);if(!tex)return;
    const mat=new THREE.MeshStandardMaterial({map:tex,roughness:.6});
    const m=mesh(group,new THREE.PlaneGeometry(w,h),mat,pos,'model-decal');m.rotation.z=rotation;
  };
  const modelLabel = p.brand === undefined ? `KuKirin ${p.label}` : `${p.brand} ${p.label}`.trim();
  if(!appearance.customEnabled || appearance.sticker !== 'none') {
  decal(modelLabel,.49,.04,[0,p.height+.003,p.width/2+.005]);
  decal(modelLabel,.52,.05,[-.33,.99,.037],Math.PI/2-.25,appearance.customEnabled ? appearance.stickerColor : p.stem==='orange-panel'?'#13171c':p.trim,appearance.customEnabled ? appearance.stemColor : p.stem==='orange-panel'?p.trim:'#151a20');
  }
  if(appearance.customEnabled && appearance.sticker === 'racing')decal(appearance.sticker==='racing'?'G2 RACING':'KuKirin',.24,.028,[.08,p.height+.027,p.width/2+.008],0,appearance.stickerColor || '#e0f2fe',appearance.deckColor);
  if(appearance.customEnabled && appearance.ledEnabled && appearance.ledMode!=='off') {
    const led=material(appearance.ledColor || '#38bdf8');led.emissive.set(appearance.ledColor || '#38bdf8');led.emissiveIntensity=2.5;
    for(const z of [-p.width/2-.009,p.width/2+.009])box([p.deck*.94,.007,.007],led,[0,p.height-.047,z],'tuning-led');
    const glow=new THREE.PointLight(appearance.ledColor || '#38bdf8',.75,.7,2);glow.position.set(0,p.height-.06,0);glow.name='underdeck-glow';group.add(glow);
  }
  if(p.checker)for(let i=0;i<8;i++){const row=i%2,col=Math.floor(i/2);box([.018,.016,.005],trim,[-p.deck/2+.055+col*.018,p.height-.003+row*.016,p.width/2+.005]);}
  if(p.deckRails)for(const z of [-p.width/2-.014,p.width/2+.014]){rod([-p.deck/2+.03,p.height-.04,z],[p.deck/2-.03,p.height-.04,z],.012,silver);box([p.deck*.85,.022,.008],p.label==='G4 Max'?trim:black,[0,p.height+.005,z]);}
  const kick=box([.16,.025,p.width*.8],black,[p.deck/2+.045,deckTop+.08,0],'rear-footrest');kick.rotation.z=.46;
  box([.047,.015,.095],red,[p.deck/2+.115,deckTop+.105,0],'tail-light');
  rod([handle[0],handle[1],-.31],[handle[0],handle[1],.31],.015,silver);
  for(const z of [-.255,.255]){
    rod([handle[0],handle[1],z-.052],[handle[0],handle[1],z+.052],.023,rubber);
    rod([handle[0]-.04,handle[1]-.025,z-.038],[handle[0]-.06,handle[1]-.025,z+.025],.007,silver);
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(handle[0]-.04,handle[1],z),new THREE.Vector3(-.49,1.05,z*.4),new THREE.Vector3(-.43,.65,.06),new THREE.Vector3(-wb/2,r+.05,.09)]);
    mesh(group,new THREE.TubeGeometry(curve,24,.0035,5,false),rubber,[0,0,0],'brake-cable');
  }
  const display=box([.1,.025,.085],black,[handle[0],handle[1]+.03,0],'handlebar-display');display.rotation.z=.15;
  box([.071,.003,.06],material('#19343e'),[handle[0],handle[1]+.045,0]);
  const lampY=p.lamp==='large-round'?.73:.55, lampX=p.lamp==='large-round'?-.52:-.47;
  if(p.lamp.includes('round')){
    const shell=mesh(group,new THREE.CylinderGeometry(p.lamp==='large-round'?.049:.027,p.lamp==='large-round'?.043:.023,.038,24),black,[lampX,lampY,0],'headlight');shell.rotation.z=Math.PI/2;
    const lens=mesh(group,new THREE.CircleGeometry(p.lamp==='large-round'?.042:.022,24),light,[lampX-.022,lampY,0]);lens.rotation.y=-Math.PI/2;
  }else box([.028,.03,.105],light,[lampX,lampY,0],'headlight');
  for(const z of [-p.width/2-.005,p.width/2+.005])box([.041,.019,.006],trim,[-p.deck/2+.03,p.height+.01,z],'side-reflector');
  return {group,wheels,radius:r,wheelbase:wb,handle,deckTop,profile:p};
}
