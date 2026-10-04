from pathlib import Path
import json
from PIL import Image, ImageOps, ImageDraw
import numpy as np
from collections import deque
root=Path('../../outputs'); dest=Path('public/assets/vehicles')
chosen={
'a1':('a1-1.webp',False),'t3':('t3-1.webp',True),'x1':('x1-0.webp',False),'m4_legacy':('m4_legacy-0.jpg',True),'m4_pro_2024':('m4_pro_2024-0.jpg',False),'m5_pro':('m5_pro-0.png',False),
'dt_mini':('dt_mini-0.jpg',False),'dt_spider2':('dt_spider2-1.jpg',False),'dt_x_ltd':('dt_x_ltd-1.jpg',False),'dt_sonic_alien':('dt_sonic_alien-0.jpg',False),
'joyor_t10':('joyor_t10-0.webp',False),'joyor_s10sz':('joyor_s10sz-0.webp',False),'joyor_f5':('joyor_f5-0.webp',False),
'kaabo_wkgtr':('kaabo_wkgtr-0.jpg',False),'kaabo_wolf_gt':('kaabo_wolf_gt-0.jpg',False),'kaabo_mantis8':('kaabo_mantis8-0.webp',False),'kaabo_mantis10':('kaabo_mantis10-0.jpg',False),
'nami_burne2':('nami_burne2-0.jpg',False),'nami_burne_max':('nami_burne_max-0.jpg',False),
'nb_zt3_pro':('nb_zt3_pro-0.png',False),'nb_max_g30':('nb_max_g30-0.png',False),'nb_max_g2':('nb_max_g2-0.png',False),'nb_f30':('nb_f30-0.jpg',False),'nb_e22':('nb_e22-0.png',False),'nb_gt2':('nb_gt2-0.png',False),'nb_p1000e':('nb_p1000e-0.png',False),
'surron_light_bee_x':('page-surron_light_bee_x-2.webp',False),'surron_ultra_bee':('surron_ultra_bee-1.webp',True),'stark_varg_mx':('stark-retail-0.png',True),
'wish01':('wish01-0.png',False),'wish02_pro':('wish02_pro-0.webp',False),'wish04':('wish04-0.jpg',False),
'xm_4ultra':('page-xm_4ultra-0.png',False),'xm_4pro_600w':('page-xm_4pro_600w-0.png',False),'xm_mi3':('page-xm_mi3-0.png',False),'xm_5':('page-xm_5-0.png',False),
}
# Match actual extension, since Shopify serves several formats for one product.
layouts={}; metadata={}
for id,(suffix,flip) in chosen.items():
 path=root/('v39-'+suffix)
 if not path.exists():
  candidates=list(root.glob('v39-'+str(Path(suffix).with_suffix(''))+'.*'))
  if len(candidates)!=1: raise RuntimeError((id,path,candidates))
  path=candidates[0]
 im=Image.open(path).convert('RGBA');im.thumbnail((900,900));px=np.asarray(im).copy();h,w=px.shape[:2]
 # Remove only edge-connected neutral studio backgrounds; preserve enclosed pale metal.
 rgb=px[:,:,:3].astype(int);eligible=(rgb.min(2)>228)&((rgb.max(2)-rgb.min(2))<23)|(px[:,:,3]==0)
 if id in ['kaabo_wkgtr','kaabo_mantis8','dt_mini']:px[:int(h*.58),int(w*.72):,3]=0;eligible[:int(h*.58),int(w*.72):]=True
 if id.startswith('nami_') or id=='kaabo_mantis10':px[:int(h*.56),:int(w*.30),3]=0;eligible[:int(h*.56),:int(w*.30)]=True
 seen=np.zeros((h,w),bool);q=deque()
 for x in range(w):
  for y in [0,h-1]:
   if eligible[y,x] and not seen[y,x]:seen[y,x]=True;q.append((x,y))
 for y in range(h):
  for x in [0,w-1]:
   if eligible[y,x] and not seen[y,x]:seen[y,x]=True;q.append((x,y))
 while q:
  x,y=q.popleft()
  for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
   if 0<=nx<w and 0<=ny<h and eligible[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((nx,ny))
 px[seen,3]=0;px[px[:,:,3]<40,3]=0;im=Image.fromarray(px);bbox=im.getbbox();im=im.crop(bbox)
 if flip:im=ImageOps.mirror(im)
 scale=min(920/im.width,900/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);out=Image.new('RGBA',(1000,1000));out.paste(im,((1000-im.width)//2,950-im.height));
 file='ride-'+id.replace('_','-')+'-v39.webp';out.save(dest/file,'WEBP',quality=90,method=6)
 # Tire detection uses the circular boundary on the lower half, away from frame and forks.
 arr=np.array(out);white=(arr[:,:,:3].min(2)>230)&(np.indices(arr.shape[:2])[0]>680);arr[white,3]=0;out=Image.fromarray(arr);out.save(dest/file,'WEBP',quality=90,method=6)
 small=out.resize((250,250));a=np.array(small);b=a[:,:,:3].mean(2);b[a[:,:,3]<80]=255
 ang=np.linspace(.14,np.pi-.14,38);ca,sa=np.cos(ang),np.sin(ang)
 def detect(left):
  xs=np.arange(8,43,.6) if left else np.arange(57,94,.6)
  ys=np.arange(65,93,.6);rs=np.arange(5.5,17,.5)
  X,Y,R=np.meshgrid(xs,ys,rs,indexing='ij');x=X.reshape(-1,1)*2.5;y=Y.reshape(-1,1)*2.5;r=R.reshape(-1,1)*2.5
  def sample(scale):
   xx=np.clip(np.rint(x+ca*r*scale).astype(int),0,249);yy=np.clip(np.rint(y+sa*r*scale).astype(int),0,249);return b[yy,xx]
  inside=sample(.91);outside=sample(1.09)
  score=((outside-inside)/255).mean(1)*2+(inside<90).mean(1)*.22
  score-=np.maximum(0,(Y.reshape(-1)+R.reshape(-1)-96))*.035
  j=score.argmax();return [float(X.reshape(-1)[j]),float(Y.reshape(-1)[j]),float(R.reshape(-1)[j])*2,float(score[j])]
 front,rear=detect(True),detect(False)
 # Handle position estimated from the topmost occupied pixels, close to the stem.
 arr=np.array(out);top=np.where(arr[:,:,3]>120);topY=int(np.percentile(top[0],.5));topXs=top[1][top[0]<topY+24];hx=float(np.median(topXs)/10)
 deck=min(front[1],rear[1])-7
 layouts[id]=[round(front[0],2),round(front[1],2),round(rear[0],2),round(rear[1],2),round(front[2],2),round(hx,2),round(topY/10+3,2),round(deck,2),round(rear[2],2)]
 metadata[id]={'file':file,'kind':'photo'}
 print(id,path.name,layouts[id],round(front[3],2),round(rear[3],2),flush=True)
 draw=ImageDraw.Draw(out)
 for x,y,d,_ in [front,rear]:draw.ellipse(((x-d/2)*10,(y-d/2)*10,(x+d/2)*10,(y+d/2)*10),outline='cyan',width=4)
 out.thumbnail((175,175));tile=Image.new('RGBA',(200,205),'#313b48');tile.paste(out,((200-out.width)//2,0),out);ImageDraw.Draw(tile).text((3,182),id,fill='white');layouts[id+'-contact']=tile
contacts=[layouts.pop(k) for k in list(layouts) if k.endswith('-contact')];sheet=Image.new('RGBA',(1200,205*((len(contacts)+5)//6)),'#313b48')
for i,tile in enumerate(contacts):sheet.paste(tile,((i%6)*200,(i//6)*205))
sheet.convert('RGB').save(root/'v39-aligned.jpg');(root/'v39-new-metadata.json').write_text(json.dumps(metadata,indent=2));(root/'v39-new-layouts.json').write_text(json.dumps(layouts,indent=2))
