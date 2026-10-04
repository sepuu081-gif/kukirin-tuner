const fs=require('node:fs');const {chromium}=require('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage();await p.goto('http://127.0.0.1:5173/');const meta=JSON.parse(fs.readFileSync('../../outputs/v39-new-metadata.json'));for(const row of JSON.parse(fs.readFileSync('../../outputs/v39-selected-inputs.json'))){
 const mime=row.path.endsWith('.png')?'image/png':row.path.endsWith('.webp')?'image/webp':'image/jpeg';const data='data:'+mime+';base64,'+fs.readFileSync(row.path).toString('base64');
 const result=await p.evaluate(async({data,flip,id})=>{
  const {removeStudioBackdrop}=await import('/src/lib/photoBackdrop.js');const im=new Image();im.src=data;await im.decode();
  const c=document.createElement('canvas');const scale=Math.min(900/im.width,900/im.height);c.width=Math.round(im.width*scale);c.height=Math.round(im.height*scale);const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,c.width,c.height);const raw=ctx.getImageData(0,0,c.width,c.height);let transparent=false;for(let i=3;i<raw.data.length;i+=4)if(raw.data[i]<10){transparent=true;break;}
  if(!transparent)removeStudioBackdrop(raw.data,c.width,c.height);
  // Remove retailer stamps in areas that do not contain the photographed chassis.
  const clear=(x0,y0,x1,y1)=>{for(let y=Math.floor(y0*c.height);y<y1*c.height;y++)for(let x=Math.floor(x0*c.width);x<x1*c.width;x++)raw.data[(y*c.width+x)*4+3]=0;};
  
  if(['kaabo_wkgtr','kaabo_mantis8'].includes(id))clear(.73,0,1,.4);
  if(id.startsWith('nami_')||id==='kaabo_mantis10'||id==='dt_mini'){
   const total=c.width*c.height,visited=new Uint8Array(total),queue=new Int32Array(total);let largest=[];
   for(let start=0;start<total;start++){
    if(visited[start]||raw.data[start*4+3]<30)continue;
    let head=0,tail=1;queue[0]=start;visited[start]=1;
    while(head<tail){const point=queue[head++],x=point%c.width,y=Math.floor(point/c.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||nx>=c.width||ny<0||ny>=c.height)continue;const n=ny*c.width+nx;if(!visited[n]&&raw.data[n*4+3]>=30){visited[n]=1;queue[tail++]=n;}}}
    if(tail>largest.length)largest=Array.from(queue.subarray(0,tail));
   }
   const keep=new Uint8Array(total);for(const index of largest)keep[index]=1;for(let i=0;i<total;i++)if(!keep[i])raw.data[i*4+3]=0;
  }
  ctx.putImageData(raw,0,0);let minX=c.width,minY=c.height,maxX=0,maxY=0;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(raw.data[(y*c.width+x)*4+3]>40){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  const w=maxX-minX+1,h=maxY-minY+1,k=Math.min(920/w,900/h),ow=w*k,oh=h*k;
  const out=document.createElement('canvas');out.width=out.height=1000;const o=out.getContext('2d');if(flip){o.translate(1000,0);o.scale(-1,1);}o.drawImage(c,minX,minY,w,h,(1000-ow)/2,950-oh,ow,oh);
  return out.toDataURL('image/webp',.94).split(',')[1];
 },{...row,data});fs.writeFileSync('public/assets/vehicles/'+meta[row.id].file,Buffer.from(result,'base64'));meta[row.id].cutout=true;console.log('Clean cutout',row.id);
 }fs.writeFileSync('../../outputs/v39-new-metadata.json',JSON.stringify(meta,null,2));}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
