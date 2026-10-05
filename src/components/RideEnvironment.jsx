import {useEffect, useRef} from 'react';

const SCENES = [
  {id:'downtown', photo:'/assets/ride-city-day-v27.png'},
  {id:'suburbs', photo:'/assets/scenery/tallinn-vee.jpg'},
  {id:'forest', photo:'/assets/scenery/ruhnu-forest.jpg'},
];
function sceneAt(distance, environment) {
  if (environment) return environment === 'forest' ? 2 : ['suburbs','oldtown'].includes(environment) ? 1 : 0;
  return Math.floor(Math.max(0,distance)/.35)%SCENES.length;
}

// The camera follows the vehicle: photo scenery and road move past it at
// different rates. Integrating speed avoids animation jumps on throttle changes.
export default function RideEnvironment({speed=0,distance=0,environment=null,killed=false}) {
  const canvas=useRef(null), live=useRef({speed,distance,environment,killed}), paint=useRef(null);
  useEffect(()=>{live.current={speed,distance,environment,killed};paint.current?.();},[speed,distance,environment,killed]);
  useEffect(()=>{
    const node=canvas.current,ctx=node.getContext('2d',{alpha:false});
    const road=document.createElement('canvas'),roadCtx=road.getContext('2d');
    let images=[],frame=0,previous=0,offset=0,w=1,h=1,dpr=1,active=true;
    let displayed=sceneAt(live.current.distance,live.current.environment),from=displayed,fade=1;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    function strip(image,y,height,travel) {
      const tile=Math.max(w,h*image.width/image.height),x=-(travel%(tile*2));
      for(let i=-2;i<3;i++) {
        ctx.save();ctx.translate(i*tile-x,y);
        if(Math.abs(i)%2) {ctx.translate(tile,0);ctx.scale(-1,1);}
        ctx.drawImage(image,0,0,image.width,image.height,0,0,tile,height);ctx.restore();
      }
    }
    function drawScene(index,alpha) {
      const image=images[index];if(!image?.complete||!image.naturalWidth)return;
      ctx.save();ctx.globalAlpha=alpha;
      strip(image,0,h,offset*.28);
      // Use the photograph's road texture as the fast foreground layer.
      const y=h*.78, tile=w*1.5, x=-(offset%tile);
      roadCtx.clearRect(0,0,w,h);roadCtx.globalCompositeOperation='source-over';
      for(let i=-1;i<2;i++)roadCtx.drawImage(image,0,image.height*.89,image.width,image.height*.1,i*tile-x,y,tile,h-y);
      const blend=roadCtx.createLinearGradient(0,y,0,h*.86);blend.addColorStop(0,'transparent');blend.addColorStop(1,'#000');
      roadCtx.globalCompositeOperation='destination-in';roadCtx.fillStyle=blend;roadCtx.fillRect(0,0,w,h);
      ctx.drawImage(road,0,0,w,h);
      if(index!==2) {
        ctx.fillStyle='#e9e3cf';ctx.globalAlpha=alpha*.55;
        for(let x=offset%180-180;x<w;x+=180)ctx.fillRect(x,h*.88,76,2);
      }
      ctx.restore();
    }
    function render(now=performance.now()) {
      frame=0;if(!active)return;
      const dt=previous?Math.min(.05,(now-previous)/1000):0;previous=now;
      const state=live.current,moving=!state.killed&&state.speed>.8&&!reduced.matches;
      if(moving)offset+=state.speed/3.6*dt*9;
      const target=sceneAt(state.distance,state.environment);
      if(target!==displayed){from=displayed;displayed=target;fade=0;}
      fade=Math.min(1,fade+dt/.9);
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#172431';ctx.fillRect(0,0,w,h);
      drawScene(from,1);drawScene(displayed,fade);
      node.dataset.scene=SCENES[displayed].id;node.dataset.offset=offset.toFixed(2);
      if(moving||fade<1)frame=requestAnimationFrame(render);else previous=0;
    }
    function wake(){if(!frame)frame=requestAnimationFrame(render);}
    paint.current=wake;
    const resize=new ResizeObserver(()=>{
      const rect=node.getBoundingClientRect();w=Math.max(1,rect.width);h=Math.max(1,rect.height);dpr=Math.min(1.5,window.devicePixelRatio||1);
      node.width=Math.round(w*dpr);node.height=Math.round(h*dpr);wake();
      road.width=Math.ceil(w);road.height=Math.ceil(h);
    });resize.observe(node);reduced.addEventListener('change',wake);
    images=SCENES.map(scene=>{const image=new Image();image.onload=wake;image.src=scene.photo;return image;});
    wake();
    return ()=>{active=false;cancelAnimationFrame(frame);resize.disconnect();reduced.removeEventListener('change',wake);paint.current=null;images.forEach(image=>image.onload=null);};
  },[]);
  return <div className="ride-photo-city"><canvas ref={canvas} className="ride-environment" aria-hidden="true"/></div>;
}
