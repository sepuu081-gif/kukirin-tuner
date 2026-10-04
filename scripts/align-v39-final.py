import json
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
root=Path('../../outputs');meta=json.loads((root/'v39-new-metadata.json').read_text());layouts={};tiles=[]
for id,entry in meta.items():
 out=Image.open(Path('public/assets/vehicles')/entry['file']).convert('RGBA');a=np.array(out.resize((250,250)));b=a[:,:,:3].mean(2);b[a[:,:,3]<80]=255;ang=np.linspace(.14,np.pi-.14,38);ca,sa=np.cos(ang),np.sin(ang)
 def detect(left):
  xs=np.arange(8,43,.6) if left else np.arange(57,94,.6);ys=np.arange(65,93,.6);rs=np.arange(5.5,17,.5)
  X,Y,R=np.meshgrid(xs,ys,rs,indexing='ij');x=X.reshape(-1,1)*2.5;y=Y.reshape(-1,1)*2.5;r=R.reshape(-1,1)*2.5
  def sample(scale):return b[np.clip(np.rint(y+sa*r*scale).astype(int),0,249),np.clip(np.rint(x+ca*r*scale).astype(int),0,249)]
  inside=sample(.91);outside=sample(1.09);score=((outside-inside)/255).mean(1)*2+(inside<90).mean(1)*.22;score-=np.maximum(0,(Y.reshape(-1)+R.reshape(-1)-96))*.035;j=score.argmax();return [float(X.reshape(-1)[j]),float(Y.reshape(-1)[j]),float(R.reshape(-1)[j])*2]
 front,rear=detect(True),detect(False);arr=np.array(out);coords=np.where(arr[:,:,3]>120);topY=int(np.percentile(coords[0],.5));topXs=coords[1][coords[0]<topY+24];hx=float(np.median(topXs)/10);deck=min(front[1],rear[1])-7
 # Cargo floorpan ends lower than its high rear mudguard; use the flat foot deck.
 if id=='m5_pro':deck=76
 layouts[id]=[round(front[0],2),round(front[1],2),round(rear[0],2),round(rear[1],2),round(front[2],2),round(hx,2),round(topY/10+3,2),round(deck,2),round(rear[2],2)]
 print(id,layouts[id],flush=True);draw=ImageDraw.Draw(out)
 for x,y,d in [front,rear]:draw.ellipse(((x-d/2)*10,(y-d/2)*10,(x+d/2)*10,(y+d/2)*10),outline='cyan',width=4)
 out.thumbnail((175,175));tile=Image.new('RGBA',(200,205),'#313b48');tile.paste(out,((200-out.width)//2,0),out);ImageDraw.Draw(tile).text((3,182),id,fill='white');tiles.append(tile)
(root/'v39-new-layouts.json').write_text(json.dumps(layouts,indent=2));sheet=Image.new('RGBA',(1200,205*((len(tiles)+5)//6)),'#313b48')
for i,tile in enumerate(tiles):sheet.paste(tile,((i%6)*200,(i//6)*205))
sheet.convert('RGB').save(root/'v39-final-aligned.jpg')
