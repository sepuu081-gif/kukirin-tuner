// Only erase neutral studio backdrop connected to an image edge.
// Bright metal inside an enclosed wheel/frame stays opaque.
export function removeStudioBackdrop(data, width, height) {
  const visited = new Uint8Array(width * height), queue = new Int32Array(width * height);
  let start = 0, end = 0;
  const visit = i => {
    if(visited[i])return;
    visited[i]=1;
    const n=i*4, low=Math.min(data[n],data[n+1],data[n+2]), high=Math.max(data[n],data[n+1],data[n+2]);
    if(data[n+3]===0 || (low>=170 && high-low<20)){queue[end++]=i;data[n+3]=0;}
  };
  for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}
  for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
  while(start<end){const i=queue[start++],x=i%width;if(x)visit(i-1);if(x<width-1)visit(i+1);if(i>=width)visit(i-width);if(i<(height-1)*width)visit(i+width);}
  return data;
}
