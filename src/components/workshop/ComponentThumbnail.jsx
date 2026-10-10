import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import {createWorkshopModel} from '../../lib/workshopModels';
import {componentKind} from '../../lib/workshopParts';

const cache=new Map();
export default function ComponentThumbnail({part}){
 const host=useRef(null),key=JSON.stringify(part);
 useEffect(()=>{
  let svg=cache.get(key);
  if(!svg){
   const model=createWorkshopModel(part,'vector'),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1.5,.1,30),renderer=new SVGRenderer();
   renderer.setSize(210,140);renderer.setClearColor('#112a35');renderer.setQuality('low');renderer.setPrecision(2);camera.position.set(0,1.9,5.8);camera.lookAt(0,0,0);scene.add(model.root,new THREE.HemisphereLight('#e2f3ff','#183343',3));
   const light=new THREE.DirectionalLight('#ffffff',3);light.position.set(-3,5,4);scene.add(light);
   // Show internal structure instead of hiding every variant under an opaque lid.
   model.nodes.filter(n=>['cover'].includes(n.name)).forEach(n=>{n.visible=false;});
   renderer.render(scene,camera);svg=renderer.domElement.outerHTML;model.dispose();
   if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(key,svg);
  }
  host.current.innerHTML=svg;
 },[key]);
 return <figure className="workshop-thumbnail" data-kind={componentKind(part)}><div ref={host} role="img" aria-label={part.name||componentKind(part)}/></figure>;
}
