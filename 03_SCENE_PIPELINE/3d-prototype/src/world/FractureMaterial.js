import * as THREE from 'three';

export const FRACTURE_BOUNDS = Object.freeze({ width: 9.5, height: 24, depth: 2.4 });

const QUALITY = Object.freeze({
  low: Object.freeze({ subdivisions: 12, arcParticles: 38 }),
  medium: Object.freeze({ subdivisions: 22, arcParticles: 72 }),
  high: Object.freeze({ subdivisions: 34, arcParticles: 116 }),
});

export function createFractureProfile(tier = 'high', { reducedMotion = false } = {}) {
  const quality = QUALITY[tier] ?? QUALITY.high;
  return Object.freeze({
    tier: Object.hasOwn(QUALITY, tier) ? tier : 'high',
    silhouette: 'vertical-wound',
    aspectRatio: FRACTURE_BOUNDS.width / FRACTURE_BOUNDS.height,
    bounds: FRACTURE_BOUNDS,
    occludesBackground: true,
    edgeDepthLayers: 2,
    asymmetry: 0.68,
    subdivisions: quality.subdivisions,
    arcParticles: quality.arcParticles,
    displacementSpeed: reducedMotion ? 0.12 : 0.42,
    flashContrast: reducedMotion ? 0.34 : 1,
  });
}

const vertexShader = /* glsl */`
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSpeed;
  uniform float uDepthOffset;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 displaced = position;
    float verticalFade = 1.0 - smoothstep(0.58, 1.0, abs(uv.y * 2.0 - 1.0));
    float ripple = sin(position.y * 1.13 + uTime * uSpeed * 7.0)
      + 0.5 * sin(position.y * 2.87 - uTime * uSpeed * 4.0);
    displaced.x += ripple * 0.055 * uIntensity * verticalFade;
    displaced.z += (ripple * 0.045 + uDepthOffset) * uIntensity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const woundFunctions = /* glsl */`
  float centerLine(vec2 p, float time) {
    return sin(p.y * 8.7 + time * 0.31) * 0.038
      + sin(p.y * 19.3 - time * 0.19) * 0.017
      + p.y * 0.024;
  }

  float woundDistance(vec2 p, float time) {
    float center = centerLine(p, time);
    float taper = 1.0 - smoothstep(0.58, 0.98, abs(p.y));
    float widthNoise = sin(p.y * 14.0 - time * 0.27) * 0.012
      + sin(p.y * 31.0 + 1.7) * 0.006;
    float halfWidth = (0.052 + widthNoise) * mix(0.28, 1.0, taper);
    float side = abs(p.x - center) - halfWidth;
    float raggedEnd = abs(p.y) - (0.94 + sin(p.x * 39.0 + time * 0.16) * 0.018);
    return max(side, raggedEnd);
  }
`;

const coreFragmentShader = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uFlashContrast;
  varying vec2 vUv;
  ${woundFunctions}

  void main() {
    vec2 p = (vUv - 0.5) * vec2(2.0, 2.0);
    float distanceToWound = woundDistance(p, uTime);
    if (distanceToWound > 0.018) discard;

    float innerEdge = 1.0 - smoothstep(0.0, 0.022, abs(distanceToWound));
    float pulse = 0.72 + 0.28 * sin(uTime * 2.3) * uFlashContrast;
    vec3 voidColor = vec3(0.0008, 0.0025, 0.0045);
    vec3 chargedEdge = vec3(0.13, 0.58, 0.72) * innerEdge * uIntensity * pulse;
    gl_FragColor = vec4(voidColor + chargedEdge, 1.0);
  }
`;

const edgeFragmentShader = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uFlashContrast;
  uniform float uEdgeOffset;
  uniform vec3 uColor;
  varying vec2 vUv;
  ${woundFunctions}

  void main() {
    vec2 p = (vUv - 0.5) * vec2(2.0, 2.0);
    float distanceToWound = woundDistance(p, uTime);
    float band = 1.0 - smoothstep(0.008, 0.035, abs(distanceToWound - uEdgeOffset));
    float brokenArc = 0.42 + 0.58 * smoothstep(0.18, 0.85, sin(p.y * 51.0 + uTime * 1.7) * 0.5 + 0.5);
    float pulse = 0.68 + 0.32 * sin(uTime * 3.1 + p.y * 9.0) * uFlashContrast;
    float alpha = band * brokenArc * uIntensity * pulse;
    if (alpha < 0.018) discard;
    gl_FragColor = vec4(uColor * (1.25 + pulse), alpha);
  }
`;

function createUniforms(profile, depthOffset = 0) {
  return {
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uSpeed: { value: profile.displacementSpeed },
    uFlashContrast: { value: profile.flashContrast },
    uDepthOffset: { value: depthOffset },
  };
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1103515245 + 12345) >>> 0;
    return value / 4294967296;
  };
}

function beamSegment(start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.18, radius, length, 12, 1, true), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export function buildFractureWound({ qualityTier = 'high', reducedMotion = false } = {}) {
  const profile = createFractureProfile(qualityTier, { reducedMotion });
  const root = new THREE.Group();
  root.name = 'vertical-depth-wound';

  const segmentsX = Math.max(4, Math.floor(profile.subdivisions * 0.38));
  const geometry = new THREE.PlaneGeometry(
    profile.bounds.width,
    profile.bounds.height,
    segmentsX,
    profile.subdivisions,
  );
  const coreUniforms = createUniforms(profile, 0);
  const core = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    vertexShader,
    fragmentShader: coreFragmentShader,
    side: THREE.DoubleSide,
    transparent: false,
    depthWrite: true,
    depthTest: true,
  }));
  core.renderOrder = 2;
  root.add(core);

  const edgeLayers = [];
  const layerSpecs = [
    { z: 0.09, offset: 0.013, color: 0x82dff2, scale: 1 },
    { z: -0.16, offset: 0.036, color: 0x2e789e, scale: 1.045 },
  ];
  for (const [index, spec] of layerSpecs.entries()) {
    const uniforms = {
      ...createUniforms(profile, index ? -0.05 : 0.04),
      uEdgeOffset: { value: spec.offset },
      uColor: { value: new THREE.Color(spec.color) },
    };
    const edge = new THREE.Mesh(geometry.clone(), new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader: edgeFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }));
    edge.position.z = spec.z;
    edge.scale.set(spec.scale, spec.scale, 1);
    edge.renderOrder = 3 + index;
    root.add(edge);
    edgeLayers.push(edge);
  }

  const random = seededRandom(0xf12ac7);
  const arcPositions = [];
  for (let i = 0; i < profile.arcParticles; i += 1) {
    const y = (random() * 2 - 1) * profile.bounds.height * 0.46;
    const normalizedY = y / (profile.bounds.height * 0.5);
    const side = i % 2 ? 1 : -1;
    const taper = Math.max(0.25, 1 - Math.pow(Math.abs(normalizedY), 2.4));
    const x = side * (0.2 + random() * 0.5) * taper + Math.sin(normalizedY * 8.7) * 0.18;
    arcPositions.push(x, y, (random() - 0.5) * profile.bounds.depth);
  }
  const arcGeometry = new THREE.BufferGeometry();
  arcGeometry.setAttribute('position', new THREE.Float32BufferAttribute(arcPositions, 3));
  const arcParticles = new THREE.Points(arcGeometry, new THREE.PointsMaterial({
    color: 0x9beaff,
    size: qualityTier === 'low' ? 0.07 : 0.1,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  root.add(arcParticles);

  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0x6ac9e2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const incomingBeam = beamSegment(
    new THREE.Vector3(-14, -5.2, 1.1),
    new THREE.Vector3(-0.55, -1.1, 0.3),
    0.9,
    beamMaterial.clone(),
  );
  const bentBeam = beamSegment(
    new THREE.Vector3(-0.55, -1.1, 0.2),
    new THREE.Vector3(8.4, 2.4, -1.1),
    1.35,
    beamMaterial.clone(),
  );
  root.add(incomingBeam, bentBeam);

  return {
    root,
    profile,
    handles: { core, edgeLayers, arcParticles, incomingBeam, bentBeam },
  };
}

export function updateFractureWound(fracture, { time = 0, intensity = 0, spotlightBend = 0 } = {}) {
  const clampedIntensity = THREE.MathUtils.clamp(intensity, 0, 1);
  const materials = [fracture.handles.core, ...fracture.handles.edgeLayers].map((mesh) => mesh.material);
  for (const material of materials) {
    material.uniforms.uTime.value = time;
    material.uniforms.uIntensity.value = clampedIntensity;
  }
  fracture.root.visible = clampedIntensity > 0.004;
  fracture.handles.arcParticles.material.opacity = clampedIntensity * (0.34 + Math.sin(time * 2.7) * 0.12);
  fracture.handles.arcParticles.rotation.y = Math.sin(time * fracture.profile.displacementSpeed) * 0.08;
  fracture.handles.incomingBeam.material.opacity = spotlightBend * 0.2;
  fracture.handles.bentBeam.material.opacity = spotlightBend * 0.32;
  fracture.handles.bentBeam.rotation.z = spotlightBend * 0.035;
}

export function setFractureReducedMotion(fracture, reducedMotion) {
  const profile = createFractureProfile(fracture.profile.tier, { reducedMotion });
  fracture.profile = profile;
  for (const mesh of [fracture.handles.core, ...fracture.handles.edgeLayers]) {
    mesh.material.uniforms.uSpeed.value = profile.displacementSpeed;
    mesh.material.uniforms.uFlashContrast.value = profile.flashContrast;
  }
  return profile;
}
