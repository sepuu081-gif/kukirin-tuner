from PIL import Image, ImageDraw
from pathlib import Path
files=sorted(Path('../../outputs').glob('v39-detail-*'));out=Image.new('RGB',(180*4,190*2),'white')
for i,p in enumerate(files):
 im=Image.open(p).convert('RGBA');im.thumbnail((175,155));out.paste(im,((i%4)*180,(i//4)*190),im);ImageDraw.Draw(out).text(((i%4)*180,(i//4)*190+160),p.stem.replace('v39-detail-',''),fill='black')
out.save('../../outputs/v39-clean-contact.jpg')
