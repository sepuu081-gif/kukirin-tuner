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
    dt_thunder3:[[59,81],[69,81],[69,95],[59,95]],
    dt_victor_limited:[[59,81],[69,81],[69,95],[59,95]],
    dt_city:[[60,80],[68,80],[68,93],[60,93]],
    dt_new_storm:[[63,81],[71,81],[71,97],[63,97]],
  }[vehicle?.id];
}

// Hand positions on the actual visible rubber grips of the G2 product photo.
export function getVehicleHandGrips(vehicle,layout){
 if(vehicle?.id==='g2_2026'||VEHICLE_MEDIA[vehicle?.id]?.base==='g2_2026')return [[38.4,7.5],[32,7.4]];
 return [[layout[5],layout[6]],[layout[5]+1.8,layout[6]+1]];
}
