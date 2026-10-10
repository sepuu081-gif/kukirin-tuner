import { VEHICLE_MEDIA, VEHICLE_MEDIA_LAYOUTS } from './vehicleMediaData.js';
// Local product photographs and explicitly identified game illustrations.
const photos = {
  inmotion_rs:'ride-inmotion-rs.png', inmotion_rs_lite:'ride-inmotion-rs-lite.png', inmotion_air_pro:'ride-inmotion-air-pro.png',
  dt_victor_limited:'ride-dt-victor-limited.jpg', dt_city:'ride-dt-city.jpg', dt_new_storm:'ride-dt-new-storm.jpg',dt_thunder3:'ride-dt-thunder3.jpg',
  g2_2026: 'ride-g2.png', g2_pro_2023: 'ride-g2-pro.png', g2_pro_2026: 'ride-g2-pro.png',
  g2_max: 'ride-g2-max.png', g2_master: 'ride-g2-master.png', g2_ultra: 'g2-ultra',
  g3: 'ride-g3.png', g3_pro: 'ride-g3-pro.png', g4: 'g4', g4_max: 'ride-g4-max.png', g2_vmp: 'g2-vmp',
  g2_pro_vmp: 'g2-pro-vmp', g2_pro_abe: 'g2-pro-abe',
  t3: 't3', m4_max: 'm4-max', s1_max: 's1-max',
};

export function getVehiclePhoto(vehicle) {
  const media = VEHICLE_MEDIA[vehicle?.id];
  if (media) return `/assets/vehicles/${media.file}`;
  const photo = photos[vehicle?.id];
  return photo ? `/assets/vehicles/${photo.includes('.') ? photo : `${photo}.jpg`}` : null;
}

export function getVehiclePhotoInfo(vehicle) {
  return VEHICLE_MEDIA[vehicle?.id] || null;
}

export function getVehiclePhotoLayout(vehicle, legacyLayouts = {}) {
  return VEHICLE_MEDIA_LAYOUTS[vehicle?.id] || legacyLayouts[vehicle?.id]
    || VEHICLE_MEDIA_LAYOUTS[VEHICLE_MEDIA[vehicle?.id]?.base]
    || legacyLayouts[VEHICLE_MEDIA[vehicle?.id]?.base] || [18,84,84,84,16,34,8,78];
}

// Hide deployed display kickstands while the photographed vehicle is riding.
export function getVehiclePhotoMask(vehicle) {
  return {
    c1_pro:[[65,88],[72,88],[72,97],[65,97]],
    s3_pro:[[48,83],[53,83],[53,92],[48,92]],
    kaabo_wolf_warrior:[[73,75],[82,75],[82,90],[73,90]],
    dt_thunder3:[[59,81],[69,81],[69,95],[59,95]],
    dt_victor_limited:[[59,81],[69,81],[69,95],[59,95]],
    dt_city:[[60,80],[68,80],[68,93],[60,93]],
    dt_new_storm:[[63,81],[71,81],[71,97],[63,97]],
  }[vehicle?.id];
}

// Hand positions on the actual visible rubber grips of the G2 product photo.
export function getVehicleHandGrips(vehicle,layout){
 if(VEHICLE_MEDIA[vehicle?.id]?.grips)return VEHICLE_MEDIA[vehicle.id].grips;
 if(vehicle?.id==='g2_2026'||VEHICLE_MEDIA[vehicle?.id]?.base==='g2_2026')return [[38.4,7.5],[32,7.4]];
 return [[layout[5],layout[6]],[layout[5]+1.8,layout[6]+1]];
}

// Display the untouched original through a silhouette mask, without synthesising hidden parts.
export function drawVehiclePhoto(ctx,image,vehicle){
 const media=VEHICLE_MEDIA[vehicle?.id];
 if(media?.squareFrame){const side=Math.max(image.naturalWidth,image.naturalHeight);ctx.save();if(media.mirrorPhoto){ctx.translate(side,0);ctx.scale(-1,1);}ctx.drawImage(image,(side-image.naturalWidth)/2,(side-image.naturalHeight)/2);ctx.restore();return;}
 if(!media?.sourceFrame){ctx.drawImage(image,0,0);return;}
 const side=Math.max(image.naturalWidth,image.naturalHeight),pad=(side-image.naturalWidth)/2;
 ctx.save();ctx.translate(pad,0);ctx.beginPath();
 const polygons=[[[106,23],[147,19],[175,32],[166,48],[194,55],[197,75],[177,88],[145,84],[142,125],[170,148],[174,176],[148,182],[127,171],[108,291],[101,342],[109,363],[99,380],[70,384],[69,359],[77,298],[110,147],[112,101],[104,84],[100,63]],[[72,364],[96,366],[121,416],[146,456],[157,488],[126,495],[99,449],[73,418],[24,442],[0,444],[0,417],[30,395],[65,383]],[[119,462],[151,460],[325,489],[389,486],[411,493],[419,513],[401,535],[366,532],[288,578],[231,580],[147,542],[116,522]],[[285,531],[333,511],[370,529],[441,568],[441,655],[408,682],[361,677],[314,610],[274,580]],[[0,426],[24,415],[54,419],[80,431],[92,453],[42,451]],[[332,510],[375,517],[425,548],[441,574],[416,576],[372,548],[325,537]]];
 for(const points of polygons){points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
 ctx.moveTo(111,479);ctx.arc(60,479,51,0,Math.PI*2);ctx.moveTo(468,625);ctx.arc(403,625,65,0,Math.PI*2);ctx.clip();ctx.drawImage(image,0,0);ctx.restore();
}
