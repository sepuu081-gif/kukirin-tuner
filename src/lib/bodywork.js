export const BODYWORK_PROJECTS = [
 {id:'deck_extension',en:'Deck extension',et:'Teki laiendus'},
 {id:'frame_brace',en:'Frame reinforcement',et:'Raami tugevdus'},
];
export function canDoBodywork(build,vehicle,id) {
 if(id==='deck_extension')return vehicle.chassisStrength+(build.weldCount||0)<10;
 return id==='frame_brace'&&!build.bodywork?.frame_brace;
}
export function completeBodywork(build,vehicle,id) {
 if(!canDoBodywork(build,vehicle,id))return build;
 const next={...build,bodywork:{...build.bodywork,[id]:(build.bodywork?.[id]||0)+1}};
 if(id==='deck_extension'){next.weldCount=(build.weldCount||0)+1;next.frameExpansion=(build.frameExpansion||0)+1;}
 return next;
}
export const WORKSHOP_PHOTOS={
 weld:{src:'/assets/workshop/tig-welding.jpg',author:'Mak04',license:'Public domain',url:'https://commons.wikimedia.org/wiki/File:TIG_welding.jpg'},
 inspect:{src:'/assets/workshop/tig-weld-inspection.jpg',author:'TTLightningRod',license:'CC BY-SA 2.5',licenseUrl:'https://creativecommons.org/licenses/by-sa/2.5/',url:'https://commons.wikimedia.org/wiki/File:08-TIG-weld.jpg'},
};
