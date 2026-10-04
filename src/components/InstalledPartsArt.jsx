import {useId} from 'react';
// Coordinates are in the product photo's own frame, so every mount follows pitch.
export function stuntBarGeometry(layout,part={},vehicle={}) {
 const [, ,rx,ry,diameter,,,deck]=layout;
 const offsets={g2_2026:[-14.5,2],g2_pro_2023:[-8,-3],g2_pro_2026:[-8,-3],g2_max:[-6,-4],g2_master:[-6,-4],g3:[-7,-3],g3_pro:[-6,-4],g4:[-5,-4],g4_max:[-5,-5]};
 const offset=vehicle.id==='g2_2026'?offsets.g2_2026:[(offsets[vehicle.id]||[-7])[0],0];
 const mount=[rx+offset[0],deck+offset[1]];
 const length=part.mount==='footrest'?9:part.guardFactor>.8?18:11;
 return {mount,tip:[rx+length,mount[1]-3],radius:Math.max(1.2,diameter*.09)};
}
export default function InstalledPartsArt({vehicle,layout,build,wheelieBarFactor=0}){
 const photoId=useId().replace(/:/g,'');
 const p=build?.parts||{};
 const bar=p.wheelie_bar||(wheelieBarFactor?{guardFactor:wheelieBarFactor}:null);
 const g=bar&&stuntBarGeometry(layout,bar,vehicle);
 if(!g)return null;
 // Project the supplied oblique product photograph into the side-on ride view.
 // The mounting plate in the source image sits at (14,75), in percent units.
 // Rotate the already projected photograph upward around its mounting plate.
 const radians=13*Math.PI/180,tilt=-43*Math.PI/180;
 const ax=.32*Math.cos(radians),ay=.18*Math.sin(radians),cx=-.32*Math.sin(radians),cy=.18*Math.cos(radians);
 const a=Math.cos(tilt)*ax-Math.sin(tilt)*ay,b=Math.sin(tilt)*ax+Math.cos(tilt)*ay;
 const c=Math.cos(tilt)*cx-Math.sin(tilt)*cy,d=Math.sin(tilt)*cx+Math.cos(tilt)*cy;
 const e=g.mount[0]-a*14-c*75,f=g.mount[1]-b*14-d*75;
 return <svg className="photo-parts-overlay" viewBox="0 0 100 100" aria-label="Installed stunt footrest photograph">
 {g&&<g data-category="wheelie_bar" data-part={bar.id||'bar'} data-mount="footrest" transform={`matrix(${a} ${b} ${c} ${d} ${e} ${f})`}><title>{bar.name||'Stunt bar'}</title>
 <defs><filter id={`bar-invert-${photoId}`}><feComponentTransfer><feFuncR type="discrete" tableValues="1 1 1 1 1 1 1 0 0 0"/><feFuncG type="discrete" tableValues="1 1 1 1 1 1 1 0 0 0"/><feFuncB type="discrete" tableValues="1 1 1 1 1 1 1 0 0 0"/></feComponentTransfer></filter><mask id={`bar-photo-${photoId}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><image href="/assets/parts/t2u-stunt-bar.jpg" x="0" y="0" width="100" height="100" filter={`url(#bar-invert-${photoId})`}/></mask></defs>
 <image href="/assets/parts/t2u-stunt-bar.jpg" x="0" y="0" width="100" height="100" mask={`url(#bar-photo-${photoId})`}/>
 </g>}
 </svg>;
}
