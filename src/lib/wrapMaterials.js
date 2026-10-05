export const WRAP_MATERIALS = {
  carbon_black:{color:'#24282d',finish:'carbon',texture:'/assets/wraps/carbon-weave.jpg'},
  carbon_orange:{color:'#dd671f',finish:'carbon',texture:'/assets/wraps/carbon-weave.jpg'},
  camo_green:{color:'#718347',finish:'print',texture:'/assets/wraps/woodland.png'},
  galaxy_purple:{color:'#8b56c8',finish:'print',texture:'/assets/wraps/galaxy.jpg'},
  chrome_silver:{color:'#b9c7d4',finish:'chrome'},gold_chrome:{color:'#dca64e',finish:'chrome'},
  matte_white:{color:'#e9e7df',finish:'matte'},matte_black:{color:'#121417',finish:'matte'},
  bloodred:{color:'#a7202d',finish:'satin'},arctic_blue:{color:'#2279d1',finish:'satin'},toxic_green:{color:'#42b841',finish:'satin'},
};
const cache = new Map();
export function loadWrapTexture(id) {
  const url=WRAP_MATERIALS[id]?.texture;if(!url)return Promise.resolve(null);
  if(!cache.has(url))cache.set(url,new Promise(resolve=>{
    const image=new Image();image.onload=()=>{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,256,256);
      resolve({data:ctx.getImageData(0,0,256,256).data,width:256,height:256});
    };
    image.onerror=()=>{cache.delete(url);resolve(null);};image.src=url;
  }));return cache.get(url);
}
export function wrapPixel(material, texture, x, y, color, lum) {
  let light=.23+lum/255*1.15;
  if(material.finish==='matte')light=.65+lum/255*.38;
  if(material.finish==='chrome')light=.2+Math.pow(lum/255,1.8)*2.2;
  const result=color.map(c=>c*light);
  if(texture){
    const scale=material.finish==='carbon'?9:2.6;
    const tx=Math.floor(x*scale)%texture.width,ty=Math.floor(y*scale)%texture.height;
    const offset=(ty*texture.width+tx)*4,tex=[0,1,2].map(c=>texture.data[offset+c]);
    if(material.finish==='carbon'){
      const weave=(tex[0]+tex[1]+tex[2])/765;
      for(let c=0;c<3;c++)result[c]*=.48+weave*1.55;
    }else for(let c=0;c<3;c++)result[c]=(tex[c]*.78+color[c]*.22)*light;
  }return result.map(c=>Math.max(0,Math.min(255,Math.round(c))));
}

