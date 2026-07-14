import * as THREE from 'three';
import { addGratedFloor, statusLight } from './materials.js';

export const EXTERIOR_QUALITY = Object.freeze({
  low: Object.freeze({ hullSections: 7, navigationLights: 18, stars: 260, maintenancePods: 2 }),
  medium: Object.freeze({ hullSections: 9, navigationLights: 28, stars: 460, maintenancePods: 3 }),
  high: Object.freeze({ hullSections: 11, navigationLights: 42, stars: 760, maintenancePods: 4 }),
});

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function buildForeground(materials) {
  const root = new THREE.Group();
  root.name = 'exterior-foreground';
  addGratedFloor(root, -166, 42, materials.grate);

  const railMaterial = materials.rib.clone();
  railMaterial.color.setHex(0x303a3f);
  for (const x of [-4.35, 4.35]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 40), railMaterial);
    rail.position.set(x, 0.68, -165);
    root.add(rail);
    for (let z = -146; z >= -184; z -= 4.75) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.4, 0.18), railMaterial);
      post.position.set(x, 0.65, z);
      root.add(post);
    }
  }

  const umbilicals = new THREE.Group();
  const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2326, roughness: 0.94, metalness: 0.38 });
  for (let i = 0; i < 5; i += 1) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.6 + i * 0.32, 1.15 + i * 0.08, -147),
      new THREE.Vector3(-5.2 - i * 0.24, 0.45 + i * 0.18, -155),
      new THREE.Vector3(-4.7 + i * 0.18, 0.25, -166 - i * 2.4),
    ]);
    umbilicals.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.055 + i * 0.009, 6, false), cableMaterial));
  }
  root.add(umbilicals);

  const crewSilhouettes = new THREE.Group();
  crewSilhouettes.name = 'crew-silhouettes';
  for (let i = 0; i < 3; i += 1) {
    const crew = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.05, 5, 10), materials.hullDark);
    body.position.y = 1.05;
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.32), materials.rust);
    pack.position.set(0, 1.18, 0.28);
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x16262b, emissive: 0x294d59, emissiveIntensity: 0.45, roughness: 0.18, metalness: 0.72 }),
    );
    visor.position.set(0, 1.83, -0.08);
    visor.rotation.x = -0.25;
    crew.add(body, pack, visor);
    crew.position.set(-2.15 + i * 2.05, 0, -151 - (i % 2) * 1.2);
    crew.rotation.y = (i - 1) * 0.18;
    crewSilhouettes.add(crew);
  }
  root.add(crewSilhouettes);

  return { root, crewSilhouettes, umbilicals };
}

function buildMidground(materials, config) {
  const root = new THREE.Group();
  root.name = 'exterior-midground';

  const structural = materials.hullDark.clone();
  structural.color.setHex(0x182126);
  for (const x of [-18, 18]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.1, 22, 1.1), structural);
    tower.position.set(x, 8, -177);
    tower.rotation.z = x < 0 ? -0.28 : 0.28;
    root.add(tower);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 31), structural);
    boom.position.set(x * 0.82, 9.8, -177);
    boom.rotation.x = x < 0 ? -0.18 : 0.14;
    root.add(boom);
  }

  const serviceRail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 76), materials.rib);
  serviceRail.position.set(-12.5, 3.4, -183);
  root.add(serviceRail);

  const serviceTrain = new THREE.Group();
  serviceTrain.name = 'service-train';
  for (let i = 0; i < 5; i += 1) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.2, 3.1), i === 0 ? materials.rust : materials.hull);
    car.position.z = i * 3.55;
    car.castShadow = true;
    serviceTrain.add(car);
    const lamp = statusLight(i === 0 ? 0xff7b3b : 0x79c8d6, 2.2);
    lamp.position.set(0, 0.18, i * 3.55 - 1.58);
    lamp.scale.set(1.2, 0.7, 0.7);
    serviceTrain.add(lamp);
  }
  serviceTrain.position.set(-12.5, 3.1, -177);
  root.add(serviceTrain);

  const maintenancePods = [];
  for (let i = 0; i < config.maintenancePods; i += 1) {
    const pod = new THREE.Group();
    pod.name = `maintenance-pod-${i + 1}`;
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 8), materials.hull);
    shell.scale.set(1.35, 0.75, 1.7);
    const lens = statusLight(i % 2 ? 0xff8b43 : 0x75d9ec, 3.2);
    lens.position.set(0, 0, -0.92);
    lens.scale.set(1.1, 0.55, 0.55);
    pod.add(shell, lens);
    pod.position.set(-8 + i * 5.4, 4.8 + (i % 2) * 2.7, -174 - i * 6.5);
    root.add(pod);
    maintenancePods.push(pod);
  }

  const workLights = [];
  for (let i = 0; i < 3; i += 1) {
    const beam = new THREE.SpotLight(0x83d8e8, 0, 62, Math.PI / 10, 0.55, 1.45);
    beam.position.set(-14 + i * 14, 7 + i * 2.2, -164 - i * 9);
    beam.target.position.set(-5 + i * 4, 12, -216 - i * 5);
    root.add(beam, beam.target);
    workLights.push(beam);
  }

  return { root, serviceTrain, maintenancePods, workLights };
}

function buildFarHull(materials, config) {
  const root = new THREE.Group();
  root.name = 'exterior-far-hull';

  const shadowCards = new THREE.Group();
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x030607,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (const [x, y, z, width, height, rz] of [
    [-31, 18, -213, 31, 96, -0.34],
    [31, 18, -213, 31, 96, 0.34],
    [0, 25, -241, 46, 78, 0],
  ]) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(width, height), shadowMaterial);
    card.position.set(x, y, z);
    card.rotation.set(-Math.PI / 2, 0, rz);
    shadowCards.add(card);
  }
  root.add(shadowCards);

  const hullStrips = new THREE.Group();
  hullStrips.name = 'far-hull-armor';
  const exteriorHull = materials.hull.clone();
  exteriorHull.color.setHex(0x526269);
  exteriorHull.roughness = 0.76;
  exteriorHull.metalness = 0.82;
  const seam = new THREE.MeshBasicMaterial({ color: 0x73949a, transparent: true, opacity: 0.38 });
  const half = (config.hullSections - 1) / 2;
  for (let i = 0; i < config.hullSections; i += 1) {
    const lane = i - half;
    const normalized = lane / Math.max(1, half);
    const x = normalized * 31;
    const y = 12.5 + Math.pow(Math.abs(normalized), 1.65) * 15;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(6.15, 0.92, 132), exteriorHull);
    strip.position.set(x, y, -214);
    strip.rotation.z = -normalized * 0.37;
    strip.castShadow = true;
    strip.receiveShadow = true;
    hullStrips.add(strip);

    const channel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 129), seam);
    channel.position.set(x + 3.02, y - 0.52, -214);
    channel.rotation.z = -normalized * 0.37;
    hullStrips.add(channel);
  }
  root.add(hullStrips);

  const crossRibs = new THREE.Group();
  for (let z = -158; z >= -268; z -= 18.5) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(37, 0.46, 8, 48, Math.PI), materials.rib);
    rib.position.set(0, -7.5, z);
    rib.scale.y = 0.62;
    crossRibs.add(rib);
  }
  root.add(crossRibs);

  const navigationLights = [];
  for (let i = 0; i < config.navigationLights; i += 1) {
    const side = i % 2 ? 1 : -1;
    const lane = Math.floor(i / 2) % 7;
    const light = statusLight(i % 11 === 0 ? 0xff4b2d : 0x7fc9d6, 1.5);
    light.position.set(side * (9 + lane * 3.2), 13 + lane * 1.45, -158 - Math.floor(i / 14) * 27 - lane * 2.2);
    light.scale.set(0.72, 0.5, 1.8);
    root.add(light);
    navigationLights.push(light);
  }

  const d9PowerBand = [];
  const powerRoot = new THREE.Group();
  powerRoot.name = 'd9-power-band';
  for (let i = 0; i < 24; i += 1) {
    const normalized = (i / 23) * 2 - 1;
    const light = statusLight(0x94edff, 0.03);
    light.geometry = new THREE.BoxGeometry(1.6, 0.16, 0.32);
    light.position.set(normalized * 28, 14.4 + Math.abs(normalized) * 11.5, -222);
    light.rotation.z = -normalized * 0.37;
    powerRoot.add(light);
    d9PowerBand.push(light);
  }
  root.add(powerRoot);

  const random = seededRandom(0xd9a11);
  const starPositions = [];
  for (let i = 0; i < config.stars; i += 1) {
    const x = (random() - 0.5) * 320;
    const y = random() * 135 - 35;
    const z = -180 - random() * 250;
    starPositions.push(x, y, z);
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starsGeometry,
    new THREE.PointsMaterial({ color: 0xb9d4df, size: 0.14, transparent: true, opacity: 0.72, sizeAttenuation: true }),
  );
  root.add(stars);

  return { root, shadowCards, hullStrips, crossRibs, navigationLights, d9PowerBand, stars };
}

export function buildExteriorScaleLayers(materials, { qualityTier = 'high' } = {}) {
  const config = EXTERIOR_QUALITY[qualityTier] ?? EXTERIOR_QUALITY.high;
  const root = new THREE.Group();
  root.name = 'exterior-scale-layers';
  const foreground = buildForeground(materials);
  const midground = buildMidground(materials, config);
  const farHull = buildFarHull(materials, config);
  root.add(foreground.root, midground.root, farHull.root);

  const nearFill = new THREE.PointLight(0x8fc4d2, 380, 92, 1.3);
  nearFill.position.set(5, 5.5, -159);
  const hullFill = new THREE.PointLight(0x587f94, 680, 126, 1.45);
  hullFill.position.set(-16, 22, -222);
  const workFill = new THREE.PointLight(0xd18c58, 260, 58, 1.6);
  workFill.position.set(14, 7, -178);
  root.add(nearFill, hullFill, workFill);

  return {
    root,
    layers: { foreground: foreground.root, midground: midground.root, farHull: farHull.root },
    handles: {
      crewSilhouettes: foreground.crewSilhouettes,
      umbilicals: foreground.umbilicals,
      serviceTrain: midground.serviceTrain,
      maintenancePods: midground.maintenancePods,
      workLights: midground.workLights,
      shadowCards: farHull.shadowCards,
      hullStrips: farHull.hullStrips,
      navigationLights: farHull.navigationLights,
      d9PowerBand: farHull.d9PowerBand,
      stars: farHull.stars,
      fillLights: [nearFill, hullFill, workFill],
    },
  };
}
