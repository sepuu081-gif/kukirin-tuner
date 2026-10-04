from PIL import Image,ImageDraw
from pathlib import Path
files=sorted(Path('../../outputs').glob('v39-stark-retail-?.*'))+sorted(Path('../../outputs').glob('v39-page-surron_light_bee_x-?.*'))
out=Image.new('RGB',(180*6,180*2),'white')
for i,p in enumerate(files):
 try:
  im=Image.open(p).convert('RGBA');im.thumbnail((170,150));out.paste(im,((i%6)*180,(i//6)*180),im);ImageDraw.Draw(out).text(((i%6)*180,(i//6)*180+153),p.stem.replace('v39-',''),fill='black')
 except:pass
out.save('../../outputs/v39-moto-contact.jpg')
