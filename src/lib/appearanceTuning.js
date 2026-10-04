export const BLUE_G2_STYLE = { customEnabled:true, deckColor:'#111827', stemColor:'#1266b4', wheelColor:'#111827', accentColor:'#38bdf8', riderHelmetColor:'#38bdf8', ledEnabled:true, ledColor:'#38bdf8', ledMode:'steady', sticker:'factory', stickerColor:'#e0f2fe', wrap:null };
export const ORANGE_G2_STYLE = { ...BLUE_G2_STYLE, stemColor:'#202832', accentColor:'#f97316', ledColor:'#f97316', riderHelmetColor:'#f97316' };
export function parseHex(value, fallback='#38bdf8') {
  const hex = /^#[a-f\d]{6}$/i.test(value || '') ? value : fallback;
  return [1,3,5].map(offset => parseInt(hex.slice(offset,offset+2),16));
}
export function insidePolygon(x,y,points) {
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const [xi,yi]=points[i], [xj,yj]=points[j];
    if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
const G2_PAINT = [
  {area:'stem',points:[[24.0,58.4],[27.4,58.8],[38.6,17.2],[35.4,17.1]]},
  {area:'deck',points:[[19.8,64.5],[26.2,64.5],[37.1,80.8],[36.8,87.6],[35.4,87.6],[22.1,70.8],[19.1,70.2]]},
  {area:'deck',points:[[36.6,81.4],[70.1,81.4],[70.6,87.6],[36.0,87.6]]},
  {area:'deck',points:[[14.8,86.9],[29.6,81.5],[31.6,85.5],[17.4,90.3]]},
  {area:'deck',points:[[70.7,83.0],[87.0,88.3],[87.0,90.5],[71.1,86.6]]},
];
// Repaint only fitted panels on the bundled G2 photograph, retaining lighting,
// silhouette, tyre pixels and alpha. No filters apply to the whole photograph.
export function paintG2Pixels(data,width,height,appearance) {
  if (!appearance?.customEnabled) return data;
  const deck=parseHex(appearance.deckColor,'#111827'), stem=parseHex(appearance.stemColor,'#1266b4'), accent=parseHex(appearance.accentColor);
  for(let py=0;py<height;py++) {
    const y=py/height*100;if(y<17||y>91)continue;
    for(let px=0;px<width;px++) {
      const i=(py*width+px)*4;if(data[i+3]<40)continue;
      const x=px/width*100;
      const r=data[i],g=data[i+1],b=data[i+2],lum=.2126*r+.7152*g+.0722*b;
      const warm=r>g*1.04&&r>b*1.15;
      const panel=G2_PAINT.find(p=>insidePolygon(x,y,p.points));
      const orangeTrim=r>g*1.12&&g>b*1.2&&g>45;
      if(!panel&&!orangeTrim)continue;
      const colour=warm?accent:panel?.area==='stem'?stem:deck;
      const shade=warm ? .55+lum/255*.8 : .18+lum/255*1.55;
      const highlight=Math.max(0,(lum-170)/85)*36;
      const weave=appearance.wrap?.includes('carbon') ? ((px+py)%9<4?.87:1) : 1;
      for(let c=0;c<3;c++)data[i+c]=Math.min(255,Math.round(colour[c]*shade*weave+highlight));
    }
  }
  return data;
}
export function stickerLabel(appearance) {
  return appearance?.sticker==='racing'?'G2 RACING':null;
}

// Work on the photograph's opaque pixels, excluding the rubber tyre circles.
export function paintVehiclePixels(data,width,height,appearance,layout,{moto=false}={}) {
  const [fx,fy,rx,ry,diameter,hx,hy,deck]=layout;
  const frontRadius=diameter/2,rearRadius=(layout[8]||diameter)/2;
  const painted=appearance?.customEnabled;
  const colors={deck:parseHex(appearance?.deckColor,'#111827'),stem:parseHex(appearance?.stemColor,'#111827'),accent:parseHex(appearance?.accentColor,'#111827'),wheel:parseHex(appearance?.wheelColor,'#111827')};
  const removed=appearance?.fendersRemoved&&localStorage.getItem('kukirin_unlock_fenders')==='true'&&!moto;
  for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    const i=(py*width+px)*4;if(data[i+3]<40)continue;
    const x=px/width*100,y=py/height*100;
    const fd=Math.hypot(x-fx,(y-fy)*height/width),rd=Math.hypot(x-rx,(y-ry)*height/width);
    if(removed&&((x>rx-8&&x<rx+8&&y>deck-4&&y<ry-rearRadius*.7&&rd>rearRadius*.85)||(x>fx-7&&x<fx+7&&y>deck-4&&y<fy-frontRadius*.72&&fd>frontRadius*.85))){data[i+3]=0;continue;}
    if(!painted)continue;
    const wheel=fd<frontRadius*.91||rd<rearRadius*.91;
    const lum=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
    if(wheel&&lum<65)continue;
    const warm=data[i]>data[i+1]*1.12&&data[i+1]>data[i+2]*1.15;
    const stemX=hx+(fx-hx)*Math.max(0,Math.min(1,(y-hy)/Math.max(1,deck-hy)));
    const key=wheel?'wheel':warm?'accent':(y<deck-3&&Math.abs(x-stemX)<12)?'stem':'deck';
    const color=colors[key],shade=.2+lum/255*1.1;
    // Dark paint retains a small highlight, rather than turning metal grey.
    const highlight=Math.max(...color)<30?Math.max(0,lum-35)*.085:Math.max(0,lum-170)/85*18;
    for(let c=0;c<3;c++)data[i+c]=Math.min(255,Math.round(color[c]*shade+highlight));
  }
  return data;
}
