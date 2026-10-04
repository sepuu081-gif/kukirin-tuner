import fs from 'node:fs/promises';
const urls={stark_varg_mx:'https://assets.starkfuture.com/frontend-assets/varg/mx1.2/red.webp'};
for(const[id,url]of Object.entries(urls)){await fs.writeFile('../../outputs/v39-clean-'+id+'.webp',Buffer.from(await(await fetch(url)).arrayBuffer()));}
