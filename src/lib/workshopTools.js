import * as THREE from 'three';
export function createWorkshopTools(){
 const root=new THREE.Group(),tools={},metal=new THREE.MeshStandardMaterial({color:'#c2d2dc',metalness:.82,roughness:.27}),blue=new THREE.MeshStandardMaterial({color:'#257c9a',roughness:.55}),dark=new THREE.MeshStandardMaterial({color:'#16232c',roughness:.75}),glow=new THREE.MeshBasicMaterial({color:'#8ce2ff'});
 const add=(g,shape,m,pos=[0,0,0],rot=0)=>{const mesh=new THREE.Mesh(shape,m);mesh.position.set(...pos);mesh.rotation.z=rot;g.add(mesh);return mesh;};
 const bar=(g,size,m,pos,rot)=>add(g,new THREE.BoxGeometry(...size),m,pos,rot);
 const rod=(g,r,len,m,pos,rot=Math.PI/2)=>add(g,new THREE.CylinderGeometry(r,r,len,12),m,pos,rot);
 for(const name of ['wrench','allen','pliers','driver','drill','levers','welder','grinder','brush','hands','paste']){
  const g=new THREE.Group();g.name=name;root.add(g);tools[name]=g;
  if(name==='wrench'){bar(g,[.65,.065,.04],metal);const jaw=add(g,new THREE.TorusGeometry(.12,.045,6,18,Math.PI*1.45),metal,[-.38,0,0]);jaw.rotation.z=-Math.PI*.73;add(g,new THREE.TorusGeometry(.075,.038,6,18),metal,[.36,0,0]);}
  if(name==='allen'){rod(g,.028,.65,metal,[0,0,0]);rod(g,.028,.21,metal,[-.32,-.09,0],0);}
  if(name==='driver'){rod(g,.026,.5,metal,[-.15,0,0]);rod(g,.08,.35,blue,[.27,0,0]);bar(g,[.06,.018,.028],metal,[-.42,0,0]);}
  if(name==='pliers'){for(const s of [-1,1]){bar(g,[.4,.075,.05],blue,[.22,s*.11,0],s*.22);bar(g,[.27,.045,.06],metal,[-.13,s*.04,0],-s*.16);}rod(g,.055,.1,metal,[0,0,0],0).rotation.x=Math.PI/2;}
  if(name==='drill'){bar(g,[.38,.21,.17],blue,[.1,0,0]);bar(g,[.12,.26,.12],dark,[.22,-.19,0],-.2);bar(g,[.26,.08,.2],dark,[.21,-.34,0]);rod(g,.08,.17,metal,[-.17,0,0]);rod(g,.014,.24,metal,[-.36,0,0]);}
  if(name==='levers'){for(const z of [-.06,.06]){bar(g,[.72,.045,.025],metal,[0,0,z]);bar(g,[.09,.07,.025],metal,[-.36,.025,z],-.45);}}
  if(name==='welder'){rod(g,.075,.39,dark,[.12,0,0]);rod(g,.045,.28,metal,[-.18,-.05,0],1.9);rod(g,.012,.13,metal,[-.35,-.1,0],1.9);const arc=add(g,new THREE.SphereGeometry(.035,8,5),glow,[-.42,-.14,0]);arc.name='arc';}
  if(name==='grinder'){rod(g,.1,.43,blue,[.15,0,0]);bar(g,[.16,.14,.16],metal,[-.15,0,0]);const disc=add(g,new THREE.CylinderGeometry(.19,.19,.024,24),dark,[-.26,-.05,0]);disc.rotation.x=Math.PI/2;disc.name='disc';rod(g,.03,.23,dark,[-.12,.17,0],0);}
  if(name==='brush'){bar(g,[.45,.06,.15],blue);for(let i=0;i<10;i++)for(let j=0;j<3;j++)rod(g,.005,.09,metal,[-.2+i*.044,-.06,-.055+j*.055],0);bar(g,[.24,.07,.09],dark,[.32,0,0]);}
  if(name==='paste'){rod(g,.057,.4,white(),[.06,0,0]);rod(g,.012,.2,metal,[-.24,0,0]);rod(g,.024,.2,dark,[.35,0,0]);bar(g,[.05,.16,.1],blue,[.45,0,0]);}
  if(name==='hands'){for(const s of [-1,1]){const palm=add(g,new THREE.SphereGeometry(.1,12,8),blue,[s*.22,.08,0]);palm.scale.set(1.4,1,.5);for(let i=0;i<4;i++)rod(g,.025,.15,blue,[s*.22+(i-1.5)*.042,-.03,0],0);rod(g,.03,.12,blue,[s*.35,.02,0],s*.4);}}
 }
 function white(){return new THREE.MeshStandardMaterial({color:'#e1e9e9',roughness:.4,transparent:true,opacity:.85});}
 return {root,tools,dispose(){const materials=new Set();root.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});materials.forEach(m=>m.dispose());}};
}
