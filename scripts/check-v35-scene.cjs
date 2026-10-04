const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const THREE = require('three');
const { transformSync } = require('esbuild');
let effect, tick, rendered, refs = [], index = 0, disposed = false;
const host = { dataset:{}, appendChild(){}, addEventListener(){}, removeEventListener(){}, getBoundingClientRect(){return {width:360,height:410};} };
global.window = {devicePixelRatio:2}; global.document = {hidden:false};
global.ResizeObserver = class { constructor(fn){this.fn=fn;} observe(){this.fn();} disconnect(){} };
global.requestAnimationFrame = fn => {tick=fn;return 1;}; global.cancelAnimationFrame = () => {};
class Renderer {
 constructor(){this.domElement={addEventListener(){},removeEventListener(){},remove(){}};this.shadowMap={};}
 setPixelRatio(){} setSize(){} render(scene,camera){rendered={scene,camera};} dispose(){disposed=true;} forceContextLoss(){}
}
const file = path.resolve('src/components/RideScene3D.jsx');
const mod = new Module(file); mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));
const original=mod.require.bind(mod);
mod.require = name => name==='three' ? {...THREE,WebGLRenderer:Renderer} : name==='react' ? {
 useRef:value => refs[index++] ||= {current:value===null?host:value}, useEffect:fn=>{effect=fn;}
} : original(name);
mod._compile(transformSync(fs.readFileSync(file,'utf8'),{loader:'jsx',format:'cjs',jsx:'automatic'}).code,file);
const Scene=mod.exports.default;
for(const motorCount of [1,2]){
 refs=[];index=0;rendered=null;disposed=false;
 const props={vehicle:{id:'g4',name:'G4',tireSize:11,wheelbase:1200},motorCount,speed:36,isWheelying:true,trick:'superman',posture:'upright',wheelieBarFactor:1,onUnavailable(){throw Error('unexpected fallback');}};
 Scene(props);const cleanup=effect();tick(performance.now()+100);
 assert(rendered,'scene must render');assert.equal(rendered.camera.aspect,360/410);
 const front=rendered.scene.getObjectByName('front-wheel'),rear=rendered.scene.getObjectByName('rear-wheel');
 assert(front.rotation.z>0);assert.equal(front.rotation.z,rear.rotation.z,'both wheels rotate at road speed');
 assert(rendered.scene.getObjectByName('wheelie-pivot').rotation.z<0,'wheelie raises front around rear axle');
 let hubs=0;rendered.scene.traverse(m=>{if(m.name==='hub-motor')hubs++; if(m.isMesh){assert(Number.isFinite(m.position.length()));}});
 assert.equal(hubs,motorCount);assert.equal(host.dataset.pose,'superman');
 let now=performance.now()+200;
 for(const trick of ['normal','one-hand','no-hands','leg-wrap','one-footer','can-can','superman','knee-knock','salute','tail-grab','starfish','heel-clicker','nac-nac','cross-hand','heart-hands','bow-arrow','rocket','seat-stand']){
  refs[1].current.trick=trick; tick(now+=100); assert.equal(host.dataset.pose,trick);
 }
 cleanup();assert(disposed);
}
console.log('PASS: 3D scene geometry, front/rear motor meshes, synchronized wheel rotation, rear-axle wheelie pivot, 18 rider poses, mobile aspect and resource disposal.');
