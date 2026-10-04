from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
files=list(Path('../../outputs').glob('v39-*-0.*'))
thumbs=[]
for p in files:
 try:
  im=Image.open(p).convert('RGB');im.thumbnail((150,150));tile=Image.new('RGB',(190,180),'white');tile.paste(im,((190-im.width)//2,5));ImageDraw.Draw(tile).text((3,158),p.stem.replace('v39-',''),fill='black');thumbs.append(tile)
 except Exception as e: print(p,e)
out=Image.new('RGB',(190*6,180*((len(thumbs)+5)//6)), '#dddddd')
for i,im in enumerate(thumbs):out.paste(im,((i%6)*190,(i//6)*180))
out.save('../../outputs/v39-contact.jpg')
