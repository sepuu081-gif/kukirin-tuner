// Frame the visible wheels + rider, rather than the transparent photo rectangle.
export function photoCenterShift(layout,pose,pitch=0){
 const [fx,fy,rx,ry,d]=layout,a=pitch*Math.PI/180;
 const points=[[fx-d/2,fy],[fx+d/2,fy],[fx,fy-d/2],[fx,fy+d/2],[rx-d/2,ry],[rx+d/2,ry],[rx,ry-d/2],[rx,ry+d/2]];
 if(pose)for(const p of [pose.hip,pose.shoulder,pose.head,...pose.arms.flat(),...pose.legs.flat()])points.push([p[0]-6,p[1]],[p[0]+6,p[1]],[p[0],p[1]-6],[p[0],p[1]+6]);
 const x=points.map(p=>rx+(p[0]-rx)*Math.cos(a)-(p[1]-ry)*Math.sin(a));
 return .5-(Math.min(...x)+Math.max(...x))/200;
}
