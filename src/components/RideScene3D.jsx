import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createScooterModel } from '../lib/scooterModels3D';

// Dimensions are model-inspired procedural geometry, not scanned factory models.
export default function RideScene3D({ showRider = true, balance = 0, braking = false, turn = 0, vehicle, motorCount, speed, isWheelying, trick, posture, appearance, weather, wheelieBarFactor, onUnavailable }) {
  const host = useRef(null);
  const live = useRef({ speed, isWheelying, trick, posture, braking, turn, balance });
  live.current = { speed, isWheelying, trick, posture, braking, turn, balance };
  useEffect(() => {
    const el = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch { onUnavailable(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const sky = weather === 'rain' || weather === 'storm' ? '#52677e' : '#91b1ce';
    scene.background = new THREE.Color(showRider ? sky : '#091b2a');
    scene.fog = new THREE.Fog(showRider ? sky : '#091b2a', 12, 32);
    // A small local reflection map gives metal readable sky/road highlights offline.
    if (document.createElement) {
      const faces = Array.from({ length: 6 }, (_, i) => {
        const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = i === 3 ? '#313842' : i === 2 ? '#dceeff' : '#8fa5b8'; ctx.fillRect(0, 0, 64, 64);
        if(i !== 3){ctx.fillStyle='#eaf4ff';ctx.fillRect(0,8,64,13);ctx.fillStyle='#526171';ctx.fillRect(0,48,64,16);}
        return canvas;
      });
      scene.environment = new THREE.CubeTexture(faces); scene.environment.colorSpace = THREE.SRGBColorSpace; scene.environment.needsUpdate = true;
      scene.environmentIntensity = .65;
    }
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 60);
    scene.add(new THREE.HemisphereLight(0xd5edff, 0x3b4350, 2.6));
    const sun = new THREE.DirectionalLight(0xffe8ce, 3);
    sun.position.set(-3, 6, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512); scene.add(sun);
    const mat = (color, metalness = 0) => new THREE.MeshStandardMaterial({ color, metalness, roughness: metalness ? .35 : .8 });
    const black = mat('#202630', .55), rubber = mat('#111318'), metal = mat('#8996a5', .8);
    const accent = mat(appearance?.accentColor || vehicle?.accentColor || '#f5a323', .35);
    const motorMat = mat('#1689da', .7), cloth = mat('#243a5c');
    const mesh = (parent, geometry, material, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z);
      m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    };
    const box = (parent, size, material, pos) => mesh(parent, new THREE.BoxGeometry(...size), material, ...pos);
    const segment = (parent, a, b, radius, material) => {
      const m = mesh(parent, new THREE.CylinderGeometry(radius === .1 ? .125 : radius, radius === .1 ? .09 : radius, 1, 14), material);
      const update = (from, to) => {
        const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to);
        m.position.copy(start).add(end).multiplyScalar(.5); m.scale.y = start.distanceTo(end);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
      }; update(a, b); return update;
    };
    box(scene, [50, .08, 8], mat(showRider ? '#343e4b' : '#162b3e'), [0, -.05, 0]);
    if(showRider)box(scene, [50, .2, 2], mat('#7d8994'), [0, .04, -5]);
    const streets = new THREE.Group(); scene.add(streets);
    for (let i = 0; i < (showRider ? 18 : 0); i++) box(streets, [1.1, .01, .035], mat('#e5e0cc'), [i * 2 - 18, .002, 1.3]);
    for (let i = 0; i < (showRider ? 14 : 0); i++) {
      const h = 2 + (i * 7 % 9) * .45, x = i * 2.7 - 18;
      box(scene, [2.1, h, 1.7], mat(i % 2 ? '#687e93' : '#a3acb4'), [x, h / 2, -7]);
      for (let y = .6; y < h; y += .65) box(scene, [1.5, .24, .02], mat('#bad9e7'), [x, y, -6.14]);
    }
    const moto = /surron|sur_ron|light_bee|ultra_bee|stark/i.test(`${vehicle?.id} ${vehicle?.name}`);
    const detailed = createScooterModel(vehicle, motorCount, appearance);
    const radius = detailed?.radius || (vehicle?.tireSize || (moto ? 19 : 10)) * .0254 / 2;
    const wb = detailed?.wheelbase || Math.min(1.55, Math.max(.9, (vehicle?.wheelbase || (moto ? 1300 : 1100)) / 1000));
    const pivot = new THREE.Group(); pivot.position.set(wb / 2, radius, 0); scene.add(pivot);
    pivot.name = 'wheelie-pivot';
    const bike = new THREE.Group(); bike.position.set(-wb / 2, -radius, 0); pivot.add(bike);
    const wheels = detailed?.wheels || [];
    const handle = detailed?.handle || [-.37, moto ? 1.15 : 1.16, 0];
    if (detailed) bike.add(detailed.group);
    if (!detailed) {
    [-wb / 2, wb / 2].forEach((x, index) => {
      const rotor = new THREE.Group(); rotor.position.set(x, radius, 0); bike.add(rotor); wheels.push(rotor);
      rotor.name = index === 0 ? 'front-wheel' : 'rear-wheel';
      mesh(rotor, new THREE.TorusGeometry(radius * .81, radius * .19, 10, 36), rubber);
      const powered = !moto && (index === 1 || motorCount === 2);
      const hub = mesh(rotor, new THREE.CylinderGeometry(radius * (powered ? .6 : .25), radius * (powered ? .6 : .25), .13, 24), powered ? black : metal);
      hub.name = powered ? 'hub-motor' : 'free-hub';
      hub.rotation.x = Math.PI / 2;
      if (powered) {
        mesh(rotor, new THREE.TorusGeometry(radius * .5, .009, 6, 24), motorMat, 0, 0, .071);
        for (let j = 0; j < 6; j++) mesh(rotor, new THREE.SphereGeometry(.009, 6, 4), metal, Math.cos(j * Math.PI / 3) * radius * .4, Math.sin(j * Math.PI / 3) * radius * .4, .075);
      } else for (let j = 0; j < 8; j++) segment(rotor, [0, 0, .01], [Math.cos(j * Math.PI / 4) * radius * .8, Math.sin(j * Math.PI / 4) * radius * .8, .01], .005, metal);
      for (const z of [-.09, .09]) segment(bike, [x, radius, z], [index ? .3 : -.38, moto ? .7 : .33, z], .021, accent);
      const fender = mesh(bike, new THREE.TorusGeometry(radius * 1.12, .017, 6, 20, Math.PI), black, x, radius);
      fender.scale.z = 3;
    });
    if (moto) {
      box(bike, [.38, .5, .25], black, [0, .73, 0]);
      box(bike, [.55, .08, .28], rubber, [.17, 1.02, 0]);
      segment(bike, [-.38, .7, 0], [.38, .6, 0], .035, accent);
      const motor = mesh(bike, new THREE.CylinderGeometry(.11, .11, .28, 24), motorMat, .16, .4); motor.rotation.x = Math.PI / 2;
    } else {
      box(bike, [.67, .09, .21], mat(appearance?.deckColor || '#202630', .4), [.04, .28, 0]);
      box(bike, [.6, .012, .2], rubber, [.04, .334, 0]);
      box(bike, [.6, .025, .025], accent, [.04, .28, .115]);
    }
    segment(bike, [-.42, .32, 0], handle, moto ? .025 : .034, black);
    segment(bike, [-.37, handle[1], -.28], [-.37, handle[1], .28], .018, metal);
    for (const z of [-.23, .23]) segment(bike, [-.37, handle[1], z - .05], [-.37, handle[1], z + .05], .025, rubber);
    box(bike, [.08, .035, .12], motorMat, [-.37, handle[1] + .035, 0]);
    const lamp = new THREE.MeshStandardMaterial({ color:'#eaf8ff', emissive:'#b3eaff', emissiveIntensity:2 });
    box(bike, [.022, .04, .08], lamp, [-.46, moto ? .94 : .42, 0]);
    }
    if (wheelieBarFactor > 0) {
      segment(bike, [.3, .28, 0], [wb / 2 + .18, .07, 0], .018, metal);
      mesh(bike, new THREE.TorusGeometry(.045, .015, 6, 16), rubber, wb / 2 + .18, .06);
    }
    const rider = new THREE.Group(); rider.visible=showRider; bike.add(rider);
    const helmetMaterial = mat(appearance?.riderHelmetColor || '#202630', .3);
    const head = mesh(rider, new THREE.SphereGeometry(.105, 24, 18), helmetMaterial);head.scale.z=.9;
    const visor = mesh(head, new THREE.SphereGeometry(1, 20, 12), mat('#152c40', .6)); visor.scale.set(.06, .035, .095); visor.position.set(-.074, .01, 0);
    box(head,[.105,.045,.15],helmetMaterial,[-.05,-.065,0]);
    const neck = segment(rider,[0,1.4,0],[0,1.45,0],.031,mat('#b58568'));
    const torso = segment(rider, [0, 1, 0], [0, 1.35, 0], .1, cloth);
    const limbs = Array.from({ length: 8 }, (_, i) => segment(rider, [0, 0, 0], [0, 1, 0], i < 4 ? .037 : .048, i < 4 ? cloth : black));
    const boots = [-1, 1].map(() => mesh(rider, new THREE.BoxGeometry(.15, .075, .085), rubber));
    const gloves = [-1, 1].map(() => mesh(rider, new THREE.SphereGeometry(.04, 10, 8), black));
    const kneesMesh = [-1,1].map(() => mesh(rider,new THREE.SphereGeometry(.051,12,8),black));
    const elbowsMesh = [-1,1].map(() => mesh(rider,new THREE.SphereGeometry(.04,12,8),cloth));
    const pose = () => {
      const p = live.current, stunt = p.isWheelying ? p.trick : 'normal';
      const footY = detailed ? detailed.deckTop + .035 : moto ? .55 : .38;
      const rise = detailed ? handle[1] - 1.16 : 0;
      let hip = [.18, moto ? 1.12 : footY + .56, 0], shoulder = [p.posture === 'tuck' ? -.12 : .02, 1.37 + rise, 0];
      let hands = [[handle[0], handle[1], -.24], [handle[0], handle[1], .24]];
      let knees = [[.04, footY + .26, -.065], [.25, footY + .26, .065]], feet = [[-.03, footY, -.065], [.23, footY, .065]];
      if (moto && stunt === 'normal') {
        hip=[.25,.88,0]; shoulder=[-.04,1.22,0];
        knees=[[.02,.66,-.13],[.02,.66,.13]]; feet=[[.22,.46,-.13],[.22,.46,.13]];
      }
      if (stunt === 'normal') {
        const shift = p.braking ? -.13 : p.posture === 'tuck' ? -.09 : 0;
        hip[0] += shift * .35; shoulder[0] += shift;
        shoulder[1] -= p.braking ? .06 : 0;
        hip[2] += p.turn * .05; shoulder[2] += p.turn * .16;
      }
      el.dataset.riderState = moto && stunt === 'normal' ? 'seated' : p.braking ? 'braking' : p.turn ? 'leaning' : 'standing';
      if (stunt === 'one-hand') hands[0] = [.35, 1.58, -.3];
      if (stunt === 'no-hands') hands = [[.02, 1.42, -.55], [.02, 1.42, .55]];
      if (stunt === 'salute') hands[0] = [-.1, 1.58, -.15];
      if (stunt === 'one-footer') feet[1] = [.65, .75, .15];
      if (stunt === 'leg-wrap') { knees[1] = [-.27, .8, .16]; feet[1] = [-.42, .94, -.07]; }
      if (stunt === 'can-can') { knees[1] = [-.15, .7, .27]; feet[1] = [-.4, .42, -.3]; }
      if (stunt === 'superman') { hip = [.38, 1.05, 0]; shoulder = [-.13, 1.17, 0]; knees = [[.66, 1.04, -.07], [.66, 1.04, .07]]; feet = [[.98, 1.02, -.07], [.98, 1.02, .07]]; }
      if (stunt === 'knee-knock' || stunt === 'tail-grab') { hip = [.27, .69, 0]; shoulder = [.02, 1.03, 0]; knees = [[.08, .4, -.07], [.22, .4, .07]]; }
      if (stunt === 'tail-grab') hands[0] = [.36, .34, -.12];
      if (stunt === 'starfish') { hands=[[.05,1.6,-.55],[.05,1.6,.55]];feet=[[.4,.75,-.48],[.4,.75,.48]];knees=[[.22,.77,-.25],[.22,.77,.25]]; }
      if (stunt === 'heel-clicker') { knees=[[-.19,.91,-.25],[-.19,.91,.25]];feet=[[-.38,1.1,-.025],[-.38,1.1,.025]]; }
      if (stunt === 'nac-nac') { knees[1]=[.45,.7,-.12];feet[1]=[.65,.5,-.2]; }
      if (stunt === 'cross-hand') hands=[[handle[0],handle[1],.24],[handle[0],handle[1],-.24]];
      if (stunt === 'heart-hands') hands=[[shoulder[0]-.1,shoulder[1]-.08,-.015],[shoulder[0]-.1,shoulder[1]-.08,.015]];
      if (stunt === 'bow-arrow') hands=[[.15,1.4,-.2],[-.48,1.4,.1]];
      if (stunt === 'rocket') { hip=[.35,1.1,0];shoulder=[-.08,1.25,0];knees=[[.67,1.28,-.07],[.67,1.28,.07]];feet=[[.98,1.52,-.07],[.98,1.52,.07]]; }
      if (stunt === 'seat-stand') { hip=[.38,1.04,0];shoulder=[.2,1.5,0];feet=[[.42,footY+.07,-.07],[.5,footY+.07,.07]];knees=[[.42,.7,-.07],[.5,.7,.07]]; }
      torso(hip, shoulder); head.position.set(shoulder[0] - .035, shoulder[1] + .15, 0);
      neck(shoulder,[head.position.x,head.position.y-.08,0]);
      for (let i = 0; i < 2; i++) {
        const z = i ? .1 : -.1, arm = [shoulder[0], shoulder[1] - .04, z];
        const elbow = [(arm[0] + hands[i][0]) / 2 + .06, (arm[1] + hands[i][1]) / 2 - .05, (z + hands[i][2]) / 2];
        limbs[i * 2](arm, elbow); limbs[i * 2 + 1](elbow, hands[i]);
        limbs[4 + i * 2]([hip[0], hip[1], z * .65], knees[i]); limbs[5 + i * 2](knees[i], feet[i]);
        boots[i].position.set(...feet[i]); gloves[i].position.set(...hands[i]);
        kneesMesh[i].position.set(...knees[i]);elbowsMesh[i].position.set(...elbow);
      }
      el.dataset.pose = stunt;
    };
    let yaw = .4, dragging = false, startX = 0;
    const down = e => { dragging = true; startX = e.clientX; el.setPointerCapture(e.pointerId); };
    const move = e => { if (dragging) { yaw = Math.max(-.8, Math.min(.8, yaw + (e.clientX - startX) * .006)); startX = e.clientX; } };
    const up = () => { dragging = false; };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    const lost = e => { e.preventDefault(); onUnavailable(); }; renderer.domElement.addEventListener('webglcontextlost', lost);
    const resize = new ResizeObserver(() => { const { width, height } = el.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(1, height); camera.updateProjectionMatrix(); }); resize.observe(el);
    let frame, last = performance.now(), wheelAngle = 0;
    const animate = now => {
      frame = requestAnimationFrame(animate);
      if (document.hidden || now - last < 32) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      wheelAngle += live.current.speed / 3.6 / radius * dt;
      wheels.forEach(w => { w.rotation.z = wheelAngle; });
      if (appearance?.ledMode === 'breathe' && detailed) {
        const intensity=.55+.45*Math.sin(now/500);
        detailed.group.traverse(object => { if(object.name==='tuning-led')object.material.emissiveIntensity=2.5*intensity; });
        const glow=detailed.group.getObjectByName('underdeck-glow');if(glow)glow.intensity=.75*intensity;
      }
      pivot.rotation.z = THREE.MathUtils.damp(pivot.rotation.z, live.current.isWheelying ? -.42 - live.current.balance * .2 : 0, 7, dt);
      streets.position.x = (streets.position.x + live.current.speed / 3.6 * dt) % 2;
      const cameraRange=showRider?4.2:2.8;
      camera.position.set(Math.sin(yaw) * cameraRange, showRider ? 1.9 : 1.35, Math.cos(yaw) * cameraRange); camera.lookAt(0, showRider ? .89 : .74, 0);
      pose(); renderer.render(scene, camera); el.dataset.wheelAngle = wheelAngle.toFixed(3);
    }; frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect();
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      const materials = new Set(), textures = new Set(); scene.traverse(o => { o.geometry?.dispose(); if (o.material) materials.add(o.material); }); materials.forEach(m => { if(m.map)textures.add(m.map); m.dispose(); }); textures.forEach(t => t.dispose());
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
      scene.environment?.dispose();
    };
  }, [vehicle, motorCount, wheelieBarFactor, onUnavailable, appearance?.accentColor, appearance?.deckColor, appearance?.riderHelmetColor, appearance?.stemColor, appearance?.wheelColor, appearance?.customEnabled, appearance?.ledEnabled, appearance?.ledColor, appearance?.ledMode, appearance?.sticker, appearance?.stickerColor, showRider, weather]);
  return <div ref={host} className="ride-scene-3d" aria-label="3D ride scene — drag to rotate camera" data-led={appearance?.customEnabled && appearance?.ledEnabled && appearance?.ledMode !== 'off' ? 'on' : 'off'} data-sticker={appearance?.sticker || 'factory'} data-rider={showRider ? 'on' : 'off'} data-motors={motorCount} data-front-motor={motorCount === 2} />;
}
