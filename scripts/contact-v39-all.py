from PIL import Image,ImageDraw
from pathlib import Path
files=sorted(Path('../../outputs').glob('v39-*-?.*'));thumbs=[]
for p in files:
 try:
  im=Image.open(p).convert('RGBA');im.thumbnail((110,110));tile=Image.new('RGB',(155,145),'white');tile.paste(im,((155-im.width)//2,3),im);ImageDraw.Draw(tile).text((2,120),p.stem.replace('v39-',''),fill='black');thumbs.append(tile)
 except:pass
for k in range(0,len(thumbs),48):
 out=Image.new('RGB',(155*8,145*6),'#dddddd')
 for i,im in enumerate(thumbs[k:k+48]):out.paste(im,((i%8)*155,(i//8)*145))
 out.save('../../outputs/v39-contact-'+str(k//48)+'.jpg')
