from pathlib import Path
root=Path(__file__).resolve().parent.parent
def edit(file,pairs):
 p=root/file;s=p.read_text(encoding='utf-8')
 for old,new in pairs:
  assert old in s,(file,old[:100]);s=s.replace(old,new)
 p.write_text(s,encoding='utf-8')
edit('src/lib/buildState.js',[
 ('import { getMotorDriveSpec', "import { BLUE_G2_STYLE } from './appearanceTuning.js';\nimport { getMotorDriveSpec"),
 ('  wrap: null, // wrap id or null', '''  customEnabled:false,
  ledEnabled:false,
  ledColor:'#38bdf8',
  ledMode:'steady',
  sticker:'factory',
  stickerColor:'#e0f2fe',
  wrap: null, // wrap id or null'''),
 ('  if (all[vehicleId]) {', '''  if (vehicleId === 'g2_2026' && localStorage.getItem('kukirin_g2_style_v41') !== 'true') {
    const next = all[vehicleId] || createStockBuild(vehicleId);
    next.appearance = { ...DEFAULT_APPEARANCE, ...next.appearance, ...BLUE_G2_STYLE };
    saveBuild(next);
    localStorage.setItem('kukirin_g2_style_v41','true');
    return next;
  }
  if (all[vehicleId]) {'''),
 ('if (!all[vehicleId].appearance) all[vehicleId].appearance = { ...DEFAULT_APPEARANCE };', 'all[vehicleId].appearance = { ...DEFAULT_APPEARANCE, ...all[vehicleId].appearance };'),
 ])
edit('src/pages/BuildShop.jsx',[
 ('from "../components/AppearanceEditor"','from "../components/AppearanceStudio"'),
 ('<AppearanceEditor\n', '<AppearanceEditor\n            vehicle={vehicle}\n            build={build}\n'),
 ])
edit('src/components/VehicleRideArt.jsx',[
 ("import { removeStudioBackdrop }", "import { paintG2Pixels } from '../lib/appearanceTuning';\nimport PhotoTuningOverlay from './PhotoTuningOverlay';\nimport { removeStudioBackdrop }"),
 ('function OpaquePhoto({ photo, onError, name, vehicle })', 'function OpaquePhoto({ photo, onError, name, vehicle, appearance })'),
 ('      ctx.putImageData(pixels, 0, 0);\n      const mask', '''      if (vehicle.id === 'g2_2026' || getVehiclePhotoInfo(vehicle)?.base === 'g2_2026') paintG2Pixels(pixels.data,target.width,target.height,appearance);
      ctx.putImageData(pixels, 0, 0);
      const mask'''),
 ('  }, [photo, vehicle]);', '  }, [photo, vehicle, appearance?.customEnabled, appearance?.deckColor, appearance?.stemColor, appearance?.accentColor, appearance?.wrap, appearance?.sticker]);'),
 ('({ balance = 0, braking = false, turn = 0, vehicle,', '({ showRider = true, balance = 0, braking = false, turn = 0, vehicle,'),
 ('<OpaquePhoto photo={photo}', '<OpaquePhoto appearance={appearance} photo={photo}'),
 ('    <DetailedPhotoRider moto={vehicle?', '    <PhotoTuningOverlay appearance={appearance} layout={layout} g2={vehicle.id === \'g2_2026\' || getVehiclePhotoInfo(vehicle)?.base === \'g2_2026\'} />\n    {showRider && <DetailedPhotoRider moto={vehicle?'),
 ('layout={layout} trick={trick} posture={posture} />', 'layout={layout} trick={trick} posture={posture} />}'),
 ])
edit('src/lib/scooterModels3D.js',[
 ("const arms = material(p.arm,.6)", "const stemPaint = appearance.customEnabled ? material(appearance.stemColor || p.frame,.55) : black;\n  const rimPaint = appearance.customEnabled ? material(appearance.wheelColor || '#111827',.65) : silver;\n  const arms = material(appearance.customEnabled ? appearance.deckColor : p.arm,.6)"),
 ('powered?black:silver', 'appearance.customEnabled?rimPaint:powered?black:silver'),
 ('p.rimStripe?trim:silver', 'appearance.customEnabled?trim:p.rimStripe?trim:silver'),
 ("rod(stemBase,stemTop,.028,black)", 'rod(stemBase,stemTop,.028,stemPaint)'),
 ("box([.058,.74,.055],black,", "box([.058,.74,.055],stemPaint,"),
 ("p.stem==='orange-panel'?trim:black,.032,'stem-panel'", "appearance.customEnabled?stemPaint:p.stem==='orange-panel'?trim:black,.032,'stem-panel'"),
 ('  decal(modelLabel,.49', "  if(!appearance.customEnabled || appearance.sticker !== 'none') {\n  decal(modelLabel,.49"),
 ("  if(p.checker)for", '''  }
  if(appearance.customEnabled && appearance.sticker && !['none','factory'].includes(appearance.sticker))decal(appearance.sticker==='racing'?'G2 RACING':'KuKirin',.24,.028,[.08,p.height+.027,p.width/2+.008],0,appearance.stickerColor || '#e0f2fe',appearance.deckColor);
  if(appearance.customEnabled && appearance.ledEnabled && appearance.ledMode!=='off') {
    const led=material(appearance.ledColor || '#38bdf8');led.emissive.set(appearance.ledColor || '#38bdf8');led.emissiveIntensity=2.5;
    for(const z of [-p.width/2-.009,p.width/2+.009])box([p.deck*.94,.007,.007],led,[0,p.height-.047,z],'tuning-led');
    const glow=new THREE.PointLight(appearance.ledColor || '#38bdf8',.75,.7,2);glow.position.set(0,p.height-.06,0);glow.name='underdeck-glow';group.add(glow);
  }
  if(p.checker)for'''),
 ])
edit('src/components/RideScene3D.jsx',[
 ('({ balance = 0,', '({ showRider = true, balance = 0,'),
 ('    const helmetMaterial', '    const rider = new THREE.Group(); rider.visible=showRider; bike.add(rider);\n    const helmetMaterial'),
 ('    const head = mesh(bike,', '    const head = mesh(rider,'),
 ('const neck = segment(bike,', 'const neck = segment(rider,'),
 ('const torso = segment(bike,', 'const torso = segment(rider,'),
 ('(_, i) => segment(bike,', '(_, i) => segment(rider,'),
 ('map(() => mesh(bike,', 'map(() => mesh(rider,'),
 ('appearance?.riderHelmetColor, weather]);', 'appearance?.riderHelmetColor, appearance?.stemColor, appearance?.wheelColor, appearance?.customEnabled, appearance?.ledEnabled, appearance?.ledColor, appearance?.ledMode, appearance?.sticker, appearance?.stickerColor, showRider, weather]);'),
 ('data-motors={motorCount}', "data-led={appearance?.customEnabled && appearance?.ledEnabled && appearance?.ledMode !== 'off' ? 'on' : 'off'} data-sticker={appearance?.sticker || 'factory'} data-rider={showRider ? 'on' : 'off'} data-motors={motorCount}"),
 ])
print('v41 wiring applied')
