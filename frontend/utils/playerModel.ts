import * as THREE from 'three';
import { WeaponType } from '../types';

export interface HumanoidCharacter {
  group: THREE.Group;
  bowObject: THREE.Object3D;
  updateAnimation: (params: {
    dt: number;
    time: number;
    speed: number;
    forwardInput: number;
    rightInput: number;
    isSprinting: boolean;
    isGrounded: boolean;
    isSwimming: boolean;
    headPitch: number;
    equippedWeapon: WeaponType;
    attackProgress: number;
    bowDrawProgress: number;
    bowReleaseTimer: number;
    hasArrows: boolean;
    isSeatedOnThrone?: boolean;
    isCorrupted?: boolean;
    isCelestial?: boolean;
    glitchIntensity?: number;
    weaponsDropped?: boolean;
  }) => void;
}

export interface FirstPersonViewModel {
  group: THREE.Group;
  bowObject: THREE.Object3D;
  updateAnimation: (params: {
    dt: number;
    time: number;
    speed: number;
    isSprinting: boolean;
    isGrounded: boolean;
    isSwimming: boolean;
    equippedWeapon: WeaponType;
    attackProgress: number;
    bowDrawProgress: number;
    bowReleaseTimer: number;
    hasArrows: boolean;
    isCorrupted?: boolean;
    isCelestial?: boolean;
  }) => void;
}

export function buildDetailedSwordMesh(): {
  swordRoot: THREE.Group;
  slashTrailMesh: THREE.Mesh;
  setCorruptedMode: (corrupted: boolean, celestial?: boolean, timeSec?: number) => void;
} {
  const swordRoot = new THREE.Group();

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e1b,
    roughness: 0.75,
    flatShading: true,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.3,
    metalness: 0.7,
    flatShading: true,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.85,
    flatShading: true,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.8,
    roughness: 0.1,
    flatShading: true,
  });

  const hilt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.026, 0.22, 6),
    leatherMat
  );
  swordRoot.add(hilt);

  const pommel = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.042, 0),
    goldMat
  );
  pommel.position.set(0, -0.13, 0);
  swordRoot.add(pommel);

  const crossguard = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.042, 0.06),
    goldMat
  );
  crossguard.position.set(0, 0.12, 0);
  swordRoot.add(crossguard);

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.042, 0),
    crystalMat
  );
  gem.position.set(0, 0.12, 0);
  swordRoot.add(gem);

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.86, 0.02),
    steelMat
  );
  blade.position.set(0, 0.56, 0);
  blade.castShadow = true;
  swordRoot.add(blade);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.042, 0.14, 4),
    steelMat
  );
  tip.position.set(0, 1.05, 0);
  tip.rotation.y = Math.PI / 4;
  swordRoot.add(tip);

  const edgeGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.82, 0.025),
    crystalMat
  );
  edgeGlow.position.set(0, 0.56, 0);
  swordRoot.add(edgeGlow);

  const corruptedWingsGroup = new THREE.Group();
  corruptedWingsGroup.visible = false;
  for (const sign of [-1, 1]) {
    const wing = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.34, 4),
      crystalMat
    );
    wing.position.set(sign * 0.14, 0.24, 0);
    wing.rotation.z = -sign * 0.55;
    corruptedWingsGroup.add(wing);

    const tooth = new THREE.Mesh(
      new THREE.ConeGeometry(0.028, 0.18, 4),
      crystalMat
    );
    tooth.position.set(sign * 0.055, 0.65, 0);
    tooth.rotation.z = -sign * 0.8;
    corruptedWingsGroup.add(tooth);
  }
  swordRoot.add(corruptedWingsGroup);

  const originHaloGroup = new THREE.Group();
  originHaloGroup.visible = false;
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const astralShardMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  const guardHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.012, 8, 24),
    haloMat
  );
  guardHalo.position.set(0, 0.22, 0);
  originHaloGroup.add(guardHalo);

  const bladeDistortionRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.11, 0.008, 6, 20),
    haloMat
  );
  bladeDistortionRing.position.set(0, 0.68, 0);
  bladeDistortionRing.rotation.x = Math.PI / 2;
  originHaloGroup.add(bladeDistortionRing);

  for (const sign of [-1, 1]) {
    const celestialWing = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.055, 0),
      astralShardMat
    );
    celestialWing.scale.set(0.45, 2.4, 0.45);
    celestialWing.position.set(sign * 0.16, 0.2, 0);
    celestialWing.rotation.z = -sign * 0.45;
    originHaloGroup.add(celestialWing);
  }
  swordRoot.add(originHaloGroup);

  const slashTrailMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const slashTrailMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 1.05, 14, 1, -0.3, Math.PI * 0.75),
    slashTrailMat
  );
  slashTrailMesh.position.set(0, 0.55, 0);
  slashTrailMesh.rotation.y = Math.PI / 2;
  swordRoot.add(slashTrailMesh);

  let currentCorruptedState = false;
  let currentCelestialState = false;
  const setCorruptedMode = (corrupted: boolean, celestial = false, timeSec = 0) => {
    if (celestial) {
      guardHalo.rotation.z = timeSec * 2.5;
      bladeDistortionRing.rotation.z = -timeSec * 3.2;
      bladeDistortionRing.position.y = 0.58 + Math.sin(timeSec * 4.0) * 0.22;
    }
    if (currentCorruptedState === corrupted && currentCelestialState === celestial) return;
    currentCorruptedState = corrupted;
    currentCelestialState = celestial;
    corruptedWingsGroup.visible = corrupted;
    originHaloGroup.visible = celestial;

    if (corrupted) {
      steelMat.color.setHex(0x0f071e);
      steelMat.emissive.setHex(0x000000);
      goldMat.color.setHex(0x881337);
      goldMat.emissive.setHex(0x000000);
      crystalMat.color.setHex(0xf43f5e);
      crystalMat.emissive.setHex(0xe11d48);
      slashTrailMat.color.setHex(0xf43f5e);
      blade.scale.set(1.35, 1.12, 1.2);
    } else if (celestial) {
      steelMat.color.setHex(0xffffff);
      steelMat.emissive.setHex(0xfef08a);
      steelMat.emissiveIntensity = 0.95;
      goldMat.color.setHex(0xfde047);
      goldMat.emissive.setHex(0xf59e0b);
      goldMat.emissiveIntensity = 0.65;
      crystalMat.color.setHex(0xffffff);
      crystalMat.emissive.setHex(0x38bdf8);
      crystalMat.emissiveIntensity = 2.4;
      slashTrailMat.color.setHex(0xfef08a);
      blade.scale.set(1.22, 1.16, 1.15);
    } else {
      steelMat.color.setHex(0xe2e8f0);
      steelMat.emissive.setHex(0x000000);
      goldMat.color.setHex(0xfbbf24);
      goldMat.emissive.setHex(0x000000);
      crystalMat.color.setHex(0x22d3ee);
      crystalMat.emissive.setHex(0x06b6d4);
      crystalMat.emissiveIntensity = 1.8;
      slashTrailMat.color.setHex(0x38bdf8);
      blade.scale.set(1, 1, 1);
    }
  };

  return { swordRoot, slashTrailMesh, setCorruptedMode };
}

export function buildDetailedBowMesh(): {
  bowRoot: THREE.Group;
  upperString: THREE.Mesh;
  lowerString: THREE.Mesh;
  nockedArrow: THREE.Group;
  setCorruptedMode: (corrupted: boolean, celestial?: boolean, timeSec?: number) => void;
} {
  const bowRoot = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c361a,
    roughness: 0.75,
    flatShading: true,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.3,
    metalness: 0.7,
    flatShading: true,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.6,
    flatShading: true,
  });
  const stringMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });

  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.18, 6),
    goldMat
  );
  bowRoot.add(grip);

  const sightGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.032, 0),
    crystalMat
  );
  sightGem.position.set(0, 0.06, -0.028);
  bowRoot.add(sightGem);

  const upperLimb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.024, 0.42, 6),
    woodMat
  );
  upperLimb.position.set(0, 0.25, 0.085);
  upperLimb.rotation.x = 0.44;
  bowRoot.add(upperLimb);

  const lowerLimb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.015, 0.42, 6),
    woodMat
  );
  lowerLimb.position.set(0, -0.25, 0.085);
  lowerLimb.rotation.x = -0.44;
  bowRoot.add(lowerLimb);

  const upperTip = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.025, 0),
    goldMat
  );
  upperTip.position.set(0, 0.44, 0.18);
  bowRoot.add(upperTip);

  const lowerTip = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.025, 0),
    goldMat
  );
  lowerTip.position.set(0, -0.44, 0.18);
  bowRoot.add(lowerTip);

  const stellarBowHaloGroup = new THREE.Group();
  stellarBowHaloGroup.visible = false;
  const stellarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.01, 8, 24),
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  stellarRing.rotation.y = Math.PI / 2;
  stellarBowHaloGroup.add(stellarRing);
  bowRoot.add(stellarBowHaloGroup);

  const upperString = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.44, 4),
    stringMat
  );
  upperString.position.set(0, 0.22, 0.18);
  bowRoot.add(upperString);

  const lowerString = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.44, 4),
    stringMat
  );
  lowerString.position.set(0, -0.22, 0.18);
  bowRoot.add(lowerString);

  const nockedArrow = new THREE.Group();
  const shaftMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.68, 5),
    shaftMat
  );
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = -0.14;
  nockedArrow.add(shaft);

  const arrowHead = new THREE.Mesh(
    new THREE.ConeGeometry(0.028, 0.1, 5),
    crystalMat
  );
  arrowHead.rotation.x = -Math.PI / 2;
  arrowHead.position.z = -0.5;
  nockedArrow.add(arrowHead);

  bowRoot.add(nockedArrow);

  let currentCorruptedState = false;
  let currentCelestialState = false;
  const setCorruptedMode = (corrupted: boolean, celestial = false, timeSec = 0) => {
    if (celestial) {
      stellarRing.rotation.z = timeSec * 2.4;
    }
    if (currentCorruptedState === corrupted && currentCelestialState === celestial) return;
    currentCorruptedState = corrupted;
    currentCelestialState = celestial;
    stellarBowHaloGroup.visible = celestial;

    if (corrupted) {
      woodMat.color.setHex(0x0f071e);
      woodMat.emissive.setHex(0x000000);
      goldMat.color.setHex(0x9f1239);
      goldMat.emissive.setHex(0x000000);
      crystalMat.color.setHex(0xf43f5e);
      crystalMat.emissive.setHex(0xe11d48);
      stringMat.color.setHex(0xf43f5e);
      shaftMat.color.setHex(0xf43f5e);
    } else if (celestial) {
      woodMat.color.setHex(0xffffff);
      woodMat.emissive.setHex(0xfef08a);
      woodMat.emissiveIntensity = 0.75;
      goldMat.color.setHex(0xfde047);
      goldMat.emissive.setHex(0xf59e0b);
      goldMat.emissiveIntensity = 0.7;
      crystalMat.color.setHex(0xffffff);
      crystalMat.emissive.setHex(0x38bdf8);
      crystalMat.emissiveIntensity = 2.2;
      stringMat.color.setHex(0xfef08a);
      shaftMat.color.setHex(0xffffff);
    } else {
      woodMat.color.setHex(0x5c361a);
      woodMat.emissive.setHex(0x000000);
      goldMat.color.setHex(0xfbbf24);
      goldMat.emissive.setHex(0x000000);
      crystalMat.color.setHex(0x22d3ee);
      crystalMat.emissive.setHex(0x06b6d4);
      crystalMat.emissiveIntensity = 1.6;
      stringMat.color.setHex(0xe2e8f0);
      shaftMat.color.setHex(0xfde047);
    }
  };

  return { bowRoot, upperString, lowerString, nockedArrow, setCorruptedMode };
}

/**
 * Construit le personnage humain en 3ème personne ("L'Arpenteur d'Aetheria")
 */
export function createHumanoidCharacter(): HumanoidCharacter {
  const rootGroup = new THREE.Group();

  const bodyPivot = new THREE.Group();
  bodyPivot.position.set(0, 0.9, 0);
  rootGroup.add(bodyPivot);

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf4c29f,
    roughness: 0.65,
    flatShading: true,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x271c19,
    roughness: 0.8,
    flatShading: true,
  });
  const tunicMat = new THREE.MeshStandardMaterial({
    color: 0x0f4c81,
    roughness: 0.6,
    flatShading: true,
  });
  const armorTrimMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.35,
    metalness: 0.3,
    flatShading: true,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e1b,
    roughness: 0.75,
    flatShading: true,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    flatShading: true,
  });
  const scarfMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.65,
    side: THREE.DoubleSide,
    flatShading: true,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.3,
    metalness: 0.7,
    flatShading: true,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.8,
    roughness: 0.1,
    flatShading: true,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  // 1. BASSIN & TORSE
  const hipsMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.18, 0.26),
    pantsMat
  );
  hipsMesh.castShadow = true;
  hipsMesh.receiveShadow = true;
  bodyPivot.add(hipsMesh);

  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.08, 0);
  bodyPivot.add(torsoPivot);

  const chestMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.56, 0.28),
    tunicMat
  );
  chestMesh.position.set(0, 0.28, 0);
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torsoPivot.add(chestMesh);

  const beltMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.1, 0.3),
    leatherMat
  );
  beltMesh.position.set(0, 0.05, 0);
  beltMesh.castShadow = true;
  torsoPivot.add(beltMesh);

  const buckleMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.11, 0.32),
    goldMat
  );
  buckleMesh.position.set(0, 0.05, 0);
  torsoPivot.add(buckleMesh);

  const chestGuard = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.22, 0.3),
    armorTrimMat
  );
  chestGuard.position.set(0, 0.42, 0);
  chestGuard.castShadow = true;
  torsoPivot.add(chestGuard);

  const coreGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.075, 0),
    crystalMat
  );
  coreGem.position.set(0, 0.42, -0.16);
  torsoPivot.add(coreGem);

  const neckScarf = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.24, 0.14, 8),
    scarfMat
  );
  neckScarf.position.set(0, 0.56, 0);
  neckScarf.castShadow = true;
  torsoPivot.add(neckScarf);

  const capePivot = new THREE.Group();
  capePivot.position.set(0, 0.54, 0.15);
  torsoPivot.add(capePivot);

  const capeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.85, 0.03),
    scarfMat
  );
  capeMesh.position.set(0, -0.42, 0.04);
  capeMesh.castShadow = true;
  capePivot.add(capeMesh);

  const backpackGroup = new THREE.Group();
  backpackGroup.position.set(0, 0.32, 0.21);
  torsoPivot.add(backpackGroup);

  const packBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.38, 0.16),
    leatherMat
  );
  packBody.castShadow = true;
  backpackGroup.add(packBody);

  const quiverMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.055, 0.42, 7),
    leatherMat
  );
  quiverMesh.position.set(-0.16, 0.08, 0.02);
  quiverMesh.rotation.z = -0.22;
  backpackGroup.add(quiverMesh);

  for (let a = 0; a < 3; a++) {
    const featherShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.22, 5),
      goldMat
    );
    featherShaft.position.set(-0.18 + a * 0.025, 0.3, 0.02);
    featherShaft.rotation.z = -0.22;
    backpackGroup.add(featherShaft);
  }

  const lanternCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.075, 0),
    crystalMat
  );
  lanternCrystal.position.set(0.18, 0.08, 0.06);
  backpackGroup.add(lanternCrystal);

  // 2. TÊTE HUMANOÏDE
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.6, 0);
  torsoPivot.add(headPivot);

  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, 0.12, 8),
    skinMat
  );
  neckMesh.position.set(0, 0.04, 0);
  headPivot.add(neckMesh);

  const headMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.34, 0.32),
    skinMat
  );
  headMesh.position.set(0, 0.23, 0);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headPivot.add(headMesh);

  const leftEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.02),
    eyeMat
  );
  leftEye.position.set(-0.075, 0.24, -0.162);
  headPivot.add(leftEye);

  const rightEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.02),
    eyeMat
  );
  rightEye.position.set(0.075, 0.24, -0.162);
  headPivot.add(rightEye);

  const corruptedEyeGlowGroup = new THREE.Group();
  corruptedEyeGlowGroup.visible = false;
  const redEyeFlareMat = new THREE.MeshBasicMaterial({
    color: 0xff1744,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const sign of [-1, 1]) {
    const flare = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.032, 0.025),
      redEyeFlareMat
    );
    flare.position.set(sign * 0.075, 0.24, -0.168);
    corruptedEyeGlowGroup.add(flare);
  }
  headPivot.add(corruptedEyeGlowGroup);

  const leftBrow = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.02, 0.025),
    hairMat
  );
  leftBrow.position.set(-0.075, 0.285, -0.162);
  headPivot.add(leftBrow);

  const rightBrow = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.02, 0.025),
    hairMat
  );
  rightBrow.position.set(0.075, 0.285, -0.162);
  headPivot.add(rightBrow);

  const headband = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.06, 0.34),
    scarfMat
  );
  headband.position.set(0, 0.33, 0);
  headPivot.add(headband);

  const hairTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.12, 0.36),
    hairMat
  );
  hairTop.position.set(0, 0.39, 0.01);
  hairTop.castShadow = true;
  headPivot.add(hairTop);

  const hairBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.28, 0.12),
    hairMat
  );
  hairBack.position.set(0, 0.25, 0.14);
  hairBack.castShadow = true;
  headPivot.add(hairBack);

  const hairSpike = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.22, 5),
    hairMat
  );
  hairSpike.position.set(0, 0.46, 0.06);
  hairSpike.rotation.x = -0.35;
  headPivot.add(hairSpike);

  // 3. BRAS & ATTACHES DIRECTEMENT DANS LA MAIN DROITE
  function createArm(isLeft: boolean) {
    const sign = isLeft ? -1 : 1;
    const armPivot = new THREE.Group();
    armPivot.position.set(sign * 0.32, 0.5, 0);

    const pauldron = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.14, 0.2),
      armorTrimMat
    );
    pauldron.position.set(sign * 0.02, 0.02, 0);
    pauldron.castShadow = true;
    armPivot.add(pauldron);

    const upperArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.3, 0.14),
      tunicMat
    );
    upperArm.position.set(0, -0.16, 0);
    upperArm.castShadow = true;
    armPivot.add(upperArm);

    const forearm = new THREE.Mesh(
      new THREE.BoxGeometry(0.125, 0.26, 0.125),
      leatherMat
    );
    forearm.position.set(0, -0.42, -0.02);
    forearm.rotation.x = 0.18;
    forearm.castShadow = true;
    armPivot.add(forearm);

    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.11, 0.11),
      skinMat
    );
    hand.position.set(0, -0.57, -0.05);
    hand.castShadow = true;
    armPivot.add(hand);

    return { armPivot, hand };
  }

  const leftArm = createArm(true);
  const rightArm = createArm(false);
  const leftArmPivot = leftArm.armPivot;
  const rightArmPivot = rightArm.armPivot;
  torsoPivot.add(leftArmPivot);
  torsoPivot.add(rightArmPivot);

  const {
    swordRoot: swordGroup,
    slashTrailMesh,
    setCorruptedMode: setSwordCorrupted,
  } = buildDetailedSwordMesh();
  swordGroup.position.set(0, -0.02, -0.03);
  swordGroup.rotation.x = -Math.PI / 2 + 0.3;
  rightArm.hand.add(swordGroup);

  const {
    bowRoot: bowGroup,
    upperString: tpUpperString,
    lowerString: tpLowerString,
    nockedArrow: tpNockedArrow,
    setCorruptedMode: setBowCorrupted,
  } = buildDetailedBowMesh();
  bowGroup.position.set(0, -0.02, -0.04);
  bowGroup.rotation.x = -Math.PI / 2 + 0.2;
  rightArm.hand.add(bowGroup);

  // 4. JAMBE GAUCHE & JAMBE DROITE
  function createLeg(isLeft: boolean) {
    const sign = isLeft ? -1 : 1;
    const legPivot = new THREE.Group();
    legPivot.position.set(sign * 0.13, 0, 0);

    const thigh = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.44, 0.18),
      pantsMat
    );
    thigh.position.set(0, -0.22, 0);
    thigh.castShadow = true;
    thigh.receiveShadow = true;
    legPivot.add(thigh);

    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.44, 0.17),
      leatherMat
    );
    boot.position.set(0, -0.64, 0);
    boot.castShadow = true;
    boot.receiveShadow = true;
    legPivot.add(boot);

    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.165, 0.1, 0.24),
      leatherMat
    );
    foot.position.set(0, -0.85, -0.035);
    foot.castShadow = true;
    legPivot.add(foot);

    return legPivot;
  }

  const leftLegPivot = createLeg(true);
  const rightLegPivot = createLeg(false);
  bodyPivot.add(leftLegPivot);
  bodyPivot.add(rightLegPivot);

  const celestialHaloGroup = new THREE.Group();
  celestialHaloGroup.position.set(0, 0.52, 0.14);
  celestialHaloGroup.visible = false;

  const celestialGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const celestialWhiteMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  const backHaloRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.022, 8, 28),
    celestialGlowMat
  );
  celestialHaloGroup.add(backHaloRing);

  const innerHaloRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.014, 8, 24),
    celestialWhiteMat
  );
  celestialHaloGroup.add(innerHaloRing);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const starRay = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.055, 0),
      i % 2 === 0 ? celestialWhiteMat : celestialGlowMat
    );
    starRay.scale.set(0.5, 2.2, 0.5);
    starRay.position.set(Math.cos(a) * 0.54, Math.sin(a) * 0.54, 0);
    starRay.rotation.z = a - Math.PI / 2;
    celestialHaloGroup.add(starRay);
  }
  torsoPivot.add(celestialHaloGroup);

  const voidShadowAuraGroup = new THREE.Group();
  voidShadowAuraGroup.position.set(0, 0.32, 0);
  voidShadowAuraGroup.visible = false;

  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x05010a,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });

  const crimsonAuraMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const purpleLightningMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const shadowRing1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.035, 8, 24),
    shadowMat
  );
  shadowRing1.rotation.x = Math.PI / 2.6;
  voidShadowAuraGroup.add(shadowRing1);

  const shadowRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.74, 0.022, 8, 24),
    crimsonAuraMat
  );
  shadowRing2.rotation.y = Math.PI / 3;
  voidShadowAuraGroup.add(shadowRing2);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const tendril = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.65, 5),
      i % 2 === 0 ? shadowMat : i % 4 === 1 ? crimsonAuraMat : purpleLightningMat
    );
    tendril.position.set(Math.cos(a) * 0.56, (i % 3 - 1) * 0.18, Math.sin(a) * 0.56);
    tendril.rotation.z = Math.sin(a) * 0.4;
    voidShadowAuraGroup.add(tendril);
  }
  const lightningArcsGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const arcGeo = new THREE.BoxGeometry(0.035, 0.52, 0.035);
    const arc = new THREE.Mesh(arcGeo, purpleLightningMat);
    const a = (i / 6) * Math.PI * 2;
    arc.position.set(Math.cos(a) * 0.54, (i % 3 - 1) * 0.22, Math.sin(a) * 0.54);
    arc.rotation.z = 0.35 * (i % 2 === 0 ? 1 : -1);
    lightningArcsGroup.add(arc);
  }
  voidShadowAuraGroup.add(lightningArcsGroup);
  torsoPivot.add(voidShadowAuraGroup);

  const glitchSliceGroup = new THREE.Group();
  glitchSliceGroup.visible = false;
  const glitchColors = [0xd946ef, 0x38bdf8, 0xf43f5e, 0xa855f7];
  for (let i = 0; i < 6; i++) {
    const sMat = new THREE.MeshBasicMaterial({
      color: glitchColors[i % glitchColors.length],
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sliceMesh = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.55), sMat);
    sliceMesh.position.set(0, -0.6 + i * 0.28, 0);
    glitchSliceGroup.add(sliceMesh);
  }
  bodyPivot.add(glitchSliceGroup);

  let walkCycle = 0;

  const updateAnimation = ({
    dt,
    time,
    speed,
    forwardInput,
    rightInput,
    isSprinting,
    isGrounded,
    isSwimming,
    headPitch,
    equippedWeapon,
    attackProgress,
    bowDrawProgress,
    bowReleaseTimer,
    hasArrows,
    isSeatedOnThrone = false,
    isCorrupted = false,
    isCelestial = false,
    glitchIntensity = 0,
    weaponsDropped = false,
  }: {
    dt: number;
    time: number;
    speed: number;
    forwardInput: number;
    rightInput: number;
    isSprinting: boolean;
    isGrounded: boolean;
    isSwimming: boolean;
    headPitch: number;
    equippedWeapon: WeaponType;
    attackProgress: number;
    bowDrawProgress: number;
    bowReleaseTimer: number;
    hasArrows: boolean;
    isSeatedOnThrone?: boolean;
    isCorrupted?: boolean;
    isCelestial?: boolean;
    glitchIntensity?: number;
    weaponsDropped?: boolean;
  }) => {
    const tSec = time * 0.001;

    setSwordCorrupted(isCorrupted, isCelestial, tSec);
    setBowCorrupted(isCorrupted, isCelestial, tSec);
    celestialHaloGroup.visible = isCelestial;
    voidShadowAuraGroup.visible = isCorrupted;
    corruptedEyeGlowGroup.visible = isCorrupted;

    if (isCelestial) {
      backHaloRing.rotation.z = tSec * 1.4;
      innerHaloRing.rotation.z = -tSec * 2.2;
      eyeMat.color.setHex(0xfef08a);
      skinMat.color.setHex(0xfff7ed);
      skinMat.emissive.setHex(0xfef08a);
      skinMat.emissiveIntensity = 0.2;
      tunicMat.color.setHex(0xffffff);
      tunicMat.emissive.setHex(0xfef08a);
      tunicMat.emissiveIntensity = 0.65;
      armorTrimMat.color.setHex(0xfde047);
      armorTrimMat.emissive.setHex(0xf59e0b);
      armorTrimMat.emissiveIntensity = 0.75;
      scarfMat.color.setHex(0xfef08a);
      scarfMat.emissive.setHex(0xfbbf24);
      scarfMat.emissiveIntensity = 0.55;
      pantsMat.color.setHex(0xf8fafc);
      pantsMat.emissive.setHex(0xe2e8f0);
      pantsMat.emissiveIntensity = 0.25;
      hairMat.color.setHex(0xffffff);
      hairMat.emissive.setHex(0xfef08a);
      hairMat.emissiveIntensity = 0.8;
      crystalMat.color.setHex(0xffffff);
      crystalMat.emissive.setHex(0x38bdf8);
      crystalMat.emissiveIntensity = 2.4;
    } else if (isCorrupted) {
      voidShadowAuraGroup.rotation.y = tSec * 2.4;
      shadowRing1.rotation.z = -tSec * 3.1;
      shadowRing2.rotation.x = tSec * 2.8;
      voidShadowAuraGroup.position.y = 0.32 + Math.sin(tSec * 4.5) * 0.08;
      lightningArcsGroup.rotation.y = -tSec * 4.2;
      lightningArcsGroup.children.forEach((child, idx) => {
        const pulse = Math.sin(tSec * 18 + idx * 2.3);
        child.scale.set(1.0 + pulse * 0.4, 1.0 + pulse * 0.6, 1.0 + pulse * 0.4);
        child.visible = pulse > -0.5;
      });
      eyeMat.color.setHex(0xff1744);
      skinMat.color.setHex(0x06020c);
      skinMat.emissive.setHex(0x180324);
      skinMat.emissiveIntensity = 0.45;
      tunicMat.color.setHex(0x090314);
      tunicMat.emissive.setHex(0x3b0764);
      tunicMat.emissiveIntensity = 0.55;
      armorTrimMat.color.setHex(0xe11d48);
      armorTrimMat.emissive.setHex(0xbe123c);
      armorTrimMat.emissiveIntensity = 0.85;
      scarfMat.color.setHex(0x9f1239);
      scarfMat.emissive.setHex(0xe11d48);
      scarfMat.emissiveIntensity = 0.5;
      pantsMat.color.setHex(0x090414);
      pantsMat.emissive.setHex(0x000000);
      hairMat.color.setHex(0x0f071e);
      hairMat.emissive.setHex(0x4c0519);
      hairMat.emissiveIntensity = 0.45;
      crystalMat.color.setHex(0xf43f5e);
      crystalMat.emissive.setHex(0xe11d48);
      crystalMat.emissiveIntensity = 2.4;
    } else {
      eyeMat.color.setHex(0x0f172a);
      skinMat.color.setHex(0xf4c29f);
      skinMat.emissive.setHex(0x000000);
      skinMat.emissiveIntensity = 0;
      tunicMat.color.setHex(0x0f4c81);
      tunicMat.emissive.setHex(0x000000);
      armorTrimMat.color.setHex(0x38bdf8);
      armorTrimMat.emissive.setHex(0x000000);
      scarfMat.color.setHex(0xe11d48);
      scarfMat.emissive.setHex(0x000000);
      pantsMat.color.setHex(0x1e293b);
      pantsMat.emissive.setHex(0x000000);
      hairMat.color.setHex(0x271c19);
      hairMat.emissive.setHex(0x000000);
      crystalMat.color.setHex(0x22d3ee);
      crystalMat.emissive.setHex(0x06b6d4);
      crystalMat.emissiveIntensity = 1.8;
    }

    if (glitchIntensity > 0) {
      glitchSliceGroup.visible = true;
      glitchSliceGroup.children.forEach((slice, idx) => {
        const jx = Math.sin(tSec * 45 + idx * 17.3);
        const jz = Math.cos(tSec * 52 + idx * 23.7);
        slice.position.x = jx * 0.32 * glitchIntensity;
        slice.position.z = jz * 0.22 * glitchIntensity;
        slice.scale.x = 1.0 + Math.sin(tSec * 30 + idx * 11) * 0.5 * glitchIntensity;
        slice.visible = Math.sin(tSec * 25 + idx * 5) > -0.4;
      });
      if (Math.sin(tSec * 50) > 0.45) {
        bodyPivot.position.x = Math.sin(tSec * 90) * 0.28 * glitchIntensity;
        bodyPivot.position.z = Math.cos(tSec * 110) * 0.22 * glitchIntensity;
        headPivot.position.x = Math.cos(tSec * 120) * 0.32 * glitchIntensity;
      } else {
        bodyPivot.position.x = 0;
        bodyPivot.position.z = 0;
        headPivot.position.x = 0;
      }
      if (Math.sin(tSec * 28) > 0.35) {
        tunicMat.emissive.setHex(0xd946ef);
        tunicMat.emissiveIntensity = 1.6;
        skinMat.emissive.setHex(0xa855f7);
        skinMat.emissiveIntensity = 1.4;
      }
    } else {
      glitchSliceGroup.visible = false;
      bodyPivot.position.x = 0;
      bodyPivot.position.z = 0;
      headPivot.position.x = 0;
    }

    if (isSeatedOnThrone) {
      swordGroup.visible = true;
      bowGroup.visible = false;
      (slashTrailMesh.material as THREE.MeshBasicMaterial).opacity = 0;

      bodyPivot.position.y = THREE.MathUtils.lerp(bodyPivot.position.y, 0.58, Math.min(1, dt * 8));
      bodyPivot.rotation.x = THREE.MathUtils.lerp(bodyPivot.rotation.x, 0.06, Math.min(1, dt * 8));
      bodyPivot.rotation.y = THREE.MathUtils.lerp(bodyPivot.rotation.y, 0, Math.min(1, dt * 8));

      leftLegPivot.rotation.x = THREE.MathUtils.lerp(leftLegPivot.rotation.x, 1.35, Math.min(1, dt * 8));
      rightLegPivot.rotation.x = THREE.MathUtils.lerp(rightLegPivot.rotation.x, 1.35, Math.min(1, dt * 8));

      leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, 0.65, Math.min(1, dt * 8));
      leftArmPivot.rotation.z = THREE.MathUtils.lerp(leftArmPivot.rotation.z, -0.32, Math.min(1, dt * 8));

      rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, 0.55, Math.min(1, dt * 8));
      rightArmPivot.rotation.z = THREE.MathUtils.lerp(rightArmPivot.rotation.z, 0.28, Math.min(1, dt * 8));

      headPivot.rotation.x = THREE.MathUtils.lerp(
        headPivot.rotation.x,
        -0.08 + Math.sin(tSec * 1.5) * 0.04,
        Math.min(1, dt * 8)
      );
      capePivot.rotation.x = 0.05;
      return;
    }

    swordGroup.visible = equippedWeapon === 'SWORD' && !isSwimming && !weaponsDropped;
    bowGroup.visible = equippedWeapon === 'BOW' && !isSwimming && !weaponsDropped;

    (slashTrailMesh.material as THREE.MeshBasicMaterial).opacity =
      equippedWeapon === 'SWORD' && attackProgress > 0.1 && attackProgress < 0.8
        ? Math.sin(attackProgress * Math.PI) * 0.8
        : 0;

    headPivot.rotation.x = THREE.MathUtils.lerp(
      headPivot.rotation.x,
      Math.max(-0.5, Math.min(0.5, headPitch * 0.6)),
      Math.min(1, dt * 12)
    );

    if (isSwimming) {
      walkCycle += dt * (4.5 + speed * 0.35);

      const targetBodyPitch = speed > 0.8 ? -1.05 : -0.35;
      bodyPivot.rotation.x = THREE.MathUtils.lerp(
        bodyPivot.rotation.x,
        targetBodyPitch,
        Math.min(1, dt * 6)
      );
      bodyPivot.rotation.y = THREE.MathUtils.lerp(
        bodyPivot.rotation.y,
        0,
        Math.min(1, dt * 8)
      );
      bodyPivot.position.y = THREE.MathUtils.lerp(
        bodyPivot.position.y,
        0.85 + Math.sin(tSec * 2.5) * 0.05,
        Math.min(1, dt * 6)
      );

      leftLegPivot.rotation.x = Math.sin(walkCycle * 1.4) * 0.45;
      rightLegPivot.rotation.x = -Math.sin(walkCycle * 1.4) * 0.45;

      leftArmPivot.rotation.x = Math.cos(walkCycle) * 1.25 - 0.5;
      rightArmPivot.rotation.x = -Math.cos(walkCycle) * 1.25 - 0.5;
      leftArmPivot.rotation.z = -0.25;
      rightArmPivot.rotation.z = 0.25;

      capePivot.rotation.x = 0.35 + Math.sin(walkCycle * 1.5) * 0.2;
      return;
    }

    const isBackingUp = forwardInput < 0;
    const walkDirectionSign = isBackingUp ? -1 : 1;

    let targetHipYaw = 0;
    if (forwardInput > 0 && rightInput !== 0) {
      targetHipYaw = -rightInput * 0.35;
    } else if (forwardInput < 0 && rightInput !== 0) {
      targetHipYaw = rightInput * 0.35;
    } else if (forwardInput === 0 && rightInput !== 0) {
      targetHipYaw = -rightInput * 0.45;
    }

    bodyPivot.rotation.y = THREE.MathUtils.lerp(
      bodyPivot.rotation.y,
      targetHipYaw,
      Math.min(1, dt * 10)
    );

    if (!isGrounded) {
      bodyPivot.rotation.x = THREE.MathUtils.lerp(
        bodyPivot.rotation.x,
        isBackingUp ? 0.06 : -0.1,
        Math.min(1, dt * 8)
      );
      bodyPivot.position.y = THREE.MathUtils.lerp(
        bodyPivot.position.y,
        0.92,
        Math.min(1, dt * 10)
      );

      leftArmPivot.rotation.x = THREE.MathUtils.lerp(
        leftArmPivot.rotation.x,
        -0.45,
        Math.min(1, dt * 10)
      );
      if (attackProgress <= 0 && bowDrawProgress <= 0) {
        rightArmPivot.rotation.x = THREE.MathUtils.lerp(
          rightArmPivot.rotation.x,
          0.22,
          Math.min(1, dt * 12)
        );
      }

      leftLegPivot.rotation.x = THREE.MathUtils.lerp(
        leftLegPivot.rotation.x,
        0.45 * walkDirectionSign,
        Math.min(1, dt * 10)
      );
      rightLegPivot.rotation.x = THREE.MathUtils.lerp(
        rightLegPivot.rotation.x,
        -0.35 * walkDirectionSign,
        Math.min(1, dt * 10)
      );

      capePivot.rotation.x = THREE.MathUtils.lerp(
        capePivot.rotation.x,
        0.55,
        Math.min(1, dt * 8)
      );
    } else {
      const isMoving = speed > 0.6;
      if (isMoving) {
        const freq = isSprinting ? 1.05 : 0.88;
        walkCycle += dt * speed * freq * walkDirectionSign;

        const strideScale = isBackingUp ? 0.72 : 1.0;
        const strideAmp =
          Math.min(0.82, speed * (isSprinting ? 0.048 : 0.042)) * strideScale;
        const leftArmAmp =
          Math.min(0.75, speed * (isSprinting ? 0.045 : 0.038)) * strideScale;

        leftLegPivot.rotation.x = Math.sin(walkCycle) * strideAmp;
        rightLegPivot.rotation.x = -Math.sin(walkCycle) * strideAmp;

        leftArmPivot.rotation.x = -Math.sin(walkCycle) * leftArmAmp;
        rightArmPivot.rotation.x = THREE.MathUtils.lerp(
          rightArmPivot.rotation.x,
          isSprinting ? 0.12 : 0.22,
          Math.min(1, dt * 14)
        );

        leftArmPivot.rotation.z = THREE.MathUtils.lerp(
          leftArmPivot.rotation.z,
          -0.08,
          Math.min(1, dt * 10)
        );
        rightArmPivot.rotation.z = THREE.MathUtils.lerp(
          rightArmPivot.rotation.z,
          0.08,
          Math.min(1, dt * 10)
        );

        torsoPivot.rotation.y = THREE.MathUtils.lerp(
          torsoPivot.rotation.y,
          0,
          Math.min(1, dt * 10)
        );

        const targetLean = isBackingUp
          ? 0.04
          : isSprinting
          ? -0.15
          : -0.04;
        bodyPivot.rotation.x = THREE.MathUtils.lerp(
          bodyPivot.rotation.x,
          targetLean,
          Math.min(1, dt * 10)
        );

        bodyPivot.position.y = THREE.MathUtils.lerp(
          bodyPivot.position.y,
          0.9,
          Math.min(1, dt * 10)
        );

        const targetCapeAngle = isBackingUp
          ? 0.12
          : Math.min(0.78, 0.15 + speed * 0.035);
        capePivot.rotation.x = THREE.MathUtils.lerp(
          capePivot.rotation.x,
          targetCapeAngle,
          Math.min(1, dt * 8)
        );
      } else {
        bodyPivot.rotation.x = THREE.MathUtils.lerp(
          bodyPivot.rotation.x,
          0,
          Math.min(1, dt * 10)
        );
        bodyPivot.position.y = THREE.MathUtils.lerp(
          bodyPivot.position.y,
          0.9,
          Math.min(1, dt * 10)
        );
        torsoPivot.rotation.y = THREE.MathUtils.lerp(
          torsoPivot.rotation.y,
          0,
          Math.min(1, dt * 10)
        );

        leftLegPivot.rotation.x = THREE.MathUtils.lerp(
          leftLegPivot.rotation.x,
          0,
          Math.min(1, dt * 12)
        );
        rightLegPivot.rotation.x = THREE.MathUtils.lerp(
          rightLegPivot.rotation.x,
          0,
          Math.min(1, dt * 12)
        );

        leftArmPivot.rotation.x = THREE.MathUtils.lerp(
          leftArmPivot.rotation.x,
          0,
          Math.min(1, dt * 10)
        );
        rightArmPivot.rotation.x = THREE.MathUtils.lerp(
          rightArmPivot.rotation.x,
          weaponsDropped ? 0 : 0.2,
          Math.min(1, dt * 10)
        );
        leftArmPivot.rotation.z = THREE.MathUtils.lerp(
          leftArmPivot.rotation.z,
          -0.06,
          Math.min(1, dt * 10)
        );
        rightArmPivot.rotation.z = THREE.MathUtils.lerp(
          rightArmPivot.rotation.z,
          0.08,
          Math.min(1, dt * 10)
        );

        capePivot.rotation.x = THREE.MathUtils.lerp(
          capePivot.rotation.x,
          0.08,
          Math.min(1, dt * 8)
        );
      }
    }

    if (equippedWeapon === 'SWORD' && attackProgress > 0) {
      const swingCurve = Math.sin(attackProgress * Math.PI);
      const slashRotX =
        attackProgress < 0.28
          ? 0.2 + (attackProgress / 0.28) * 1.35
          : 1.55 - ((attackProgress - 0.28) / 0.72) * 2.45;

      rightArmPivot.rotation.x = slashRotX;
      rightArmPivot.rotation.z = -0.35 * swingCurve;
      torsoPivot.rotation.y = swingCurve * 0.42;
    } else if (equippedWeapon === 'BOW') {
      const isDrawingOrReleasing = bowDrawProgress > 0.01 || bowReleaseTimer > 0;
      const pullBackZ = bowDrawProgress * 0.24;

      if (isDrawingOrReleasing) {
        rightArmPivot.rotation.x = Math.PI / 2 - 0.18 + headPitch * 0.75;
        rightArmPivot.rotation.z = 0.05;
        bowGroup.rotation.x = -Math.PI / 2 + 0.15;

        leftArmPivot.rotation.x =
          (Math.PI / 2 - 0.2) * (0.35 + bowDrawProgress * 0.65) +
          headPitch * 0.5;
        leftArmPivot.rotation.z = 0.22;
        torsoPivot.rotation.y = 0.28 * bowDrawProgress;

        tpNockedArrow.visible = (hasArrows || isCorrupted || isCelestial) && bowReleaseTimer <= 0;
        tpNockedArrow.position.set(0, 0, pullBackZ);
        tpUpperString.position.set(0, 0.22, 0.18 + pullBackZ * 0.5);
        tpUpperString.rotation.x = -pullBackZ * 1.85;
        tpLowerString.position.set(0, -0.22, 0.18 + pullBackZ * 0.5);
        tpLowerString.rotation.x = pullBackZ * 1.85;
      } else {
        bowGroup.rotation.x = -Math.PI / 2 + 0.2;
        tpNockedArrow.visible = hasArrows || isCorrupted || isCelestial;
        tpNockedArrow.position.set(0, 0, 0);
        tpUpperString.position.set(0, 0.22, 0.18);
        tpUpperString.rotation.x = 0;
        tpLowerString.position.set(0, -0.22, 0.18);
        tpLowerString.rotation.x = 0;
      }
    }
  };

  return {
    group: rootGroup,
    bowObject: bowGroup,
    updateAnimation,
  };
}

export function createFirstPersonViewModel(): FirstPersonViewModel {
  const fpRoot = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf4c29f,
    roughness: 0.65,
    flatShading: true,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e1b,
    roughness: 0.75,
    flatShading: true,
  });
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0x0f4c81,
    roughness: 0.6,
    flatShading: true,
  });

  const fpSwordHolder = new THREE.Group();
  fpSwordHolder.position.set(0.38, -0.34, -0.52);
  fpRoot.add(fpSwordHolder);

  const rightForearm = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.28, 0.09),
    leatherMat
  );
  rightForearm.position.set(0.02, -0.14, 0.14);
  rightForearm.rotation.x = Math.PI / 3;
  fpSwordHolder.add(rightForearm);

  const rightSleeve = new THREE.Mesh(
    new THREE.BoxGeometry(0.105, 0.18, 0.105),
    sleeveMat
  );
  rightSleeve.position.set(0.02, -0.22, 0.24);
  rightSleeve.rotation.x = Math.PI / 3;
  fpSwordHolder.add(rightSleeve);

  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.085, 0.085),
    skinMat
  );
  fpSwordHolder.add(rightHand);

  const {
    swordRoot: fpSword,
    slashTrailMesh: fpSlashTrail,
    setCorruptedMode: setFpSwordCorrupted,
  } = buildDetailedSwordMesh();
  fpSword.scale.set(0.78, 0.78, 0.78);
  fpSword.rotation.set(-0.35, -0.25, 0.12);
  fpSwordHolder.add(fpSword);

  const fpBowHolder = new THREE.Group();
  fpBowHolder.position.set(0.34, -0.24, -0.54);
  fpRoot.add(fpBowHolder);

  const bowRightForearm = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.26, 0.085),
    leatherMat
  );
  bowRightForearm.position.set(0.02, -0.1, 0.16);
  bowRightForearm.rotation.x = Math.PI / 2.4;
  fpBowHolder.add(bowRightForearm);

  const bowRightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.08),
    skinMat
  );
  fpBowHolder.add(bowRightHand);

  const {
    bowRoot: fpBow,
    upperString: fpUpperString,
    lowerString: fpLowerString,
    nockedArrow: fpNockedArrow,
    setCorruptedMode: setFpBowCorrupted,
  } = buildDetailedBowMesh();
  fpBow.scale.set(0.85, 0.85, 0.85);
  fpBowHolder.add(fpBow);

  const drawHandGroup = new THREE.Group();
  const drawHandMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.075, 0.075),
    skinMat
  );
  drawHandGroup.add(drawHandMesh);
  fpBow.add(drawHandGroup);

  const updateAnimation = ({
    dt,
    time,
    isSprinting,
    isSwimming,
    equippedWeapon,
    attackProgress,
    bowDrawProgress,
    bowReleaseTimer,
    hasArrows,
    isCorrupted = false,
    isCelestial = false,
  }: {
    dt: number;
    time: number;
    speed: number;
    isSprinting: boolean;
    isGrounded: boolean;
    isSwimming: boolean;
    equippedWeapon: WeaponType;
    attackProgress: number;
    bowDrawProgress: number;
    bowReleaseTimer: number;
    hasArrows: boolean;
    isCorrupted?: boolean;
    isCelestial?: boolean;
  }) => {
    const tSec = time * 0.001;
    setFpSwordCorrupted(isCorrupted, isCelestial, tSec);
    setFpBowCorrupted(isCorrupted, isCelestial, tSec);

    if (isCelestial) {
      sleeveMat.color.setHex(0xffffff);
      sleeveMat.emissive.setHex(0xfef08a);
      sleeveMat.emissiveIntensity = 0.65;
    } else if (isCorrupted) {
      sleeveMat.color.setHex(0x181028);
      sleeveMat.emissive.setHex(0x000000);
    } else {
      sleeveMat.color.setHex(0x0f4c81);
      sleeveMat.emissive.setHex(0x000000);
    }

    if (isSwimming) {
      fpSwordHolder.visible = false;
      fpBowHolder.visible = false;
      return;
    }

    fpSwordHolder.visible = equippedWeapon === 'SWORD';
    fpBowHolder.visible = equippedWeapon === 'BOW';

    if (equippedWeapon === 'SWORD') {
      if (attackProgress > 0) {
        let rotX = -0.35;
        let rotY = -0.25;
        let rotZ = 0.12;
        let posX = 0.38;
        let posY = -0.34;
        let posZ = -0.52;

        if (attackProgress < 0.25) {
          const p = attackProgress / 0.25;
          const ease = p * (2 - p);
          posX = THREE.MathUtils.lerp(0.38, 0.46, ease);
          posY = THREE.MathUtils.lerp(-0.34, -0.16, ease);
          posZ = THREE.MathUtils.lerp(-0.52, -0.44, ease);
          rotX = THREE.MathUtils.lerp(-0.35, 0.35, ease);
          rotY = THREE.MathUtils.lerp(-0.25, -0.55, ease);
          rotZ = THREE.MathUtils.lerp(0.12, -0.4, ease);
        } else if (attackProgress < 0.68) {
          const p = (attackProgress - 0.25) / 0.43;
          const ease = p * p * (3 - 2 * p);
          posX = THREE.MathUtils.lerp(0.46, -0.26, ease);
          posY = THREE.MathUtils.lerp(-0.16, -0.42, ease);
          posZ = THREE.MathUtils.lerp(-0.44, -0.66, ease);
          rotX = THREE.MathUtils.lerp(0.35, -1.35, ease);
          rotY = THREE.MathUtils.lerp(-0.55, 0.65, ease);
          rotZ = THREE.MathUtils.lerp(-0.4, 1.15, ease);
        } else {
          const p = (attackProgress - 0.68) / 0.32;
          const ease = p * (2 - p);
          posX = THREE.MathUtils.lerp(-0.26, 0.38, ease);
          posY = THREE.MathUtils.lerp(-0.42, -0.34, ease);
          posZ = THREE.MathUtils.lerp(-0.66, -0.52, ease);
          rotX = THREE.MathUtils.lerp(-1.35, -0.35, ease);
          rotY = THREE.MathUtils.lerp(0.65, -0.25, ease);
          rotZ = THREE.MathUtils.lerp(1.15, 0.12, ease);
        }

        fpSwordHolder.position.set(posX, posY, posZ);
        fpSword.rotation.set(rotX, rotY, rotZ);
        (fpSlashTrail.material as THREE.MeshBasicMaterial).opacity =
          attackProgress > 0.2 && attackProgress < 0.72
            ? Math.sin(((attackProgress - 0.2) / 0.52) * Math.PI) * 0.85
            : 0;
      } else {
        const sprintTilt = isSprinting ? -0.18 : 0;
        fpSwordHolder.position.set(0.38, -0.34, -0.52);
        fpSword.rotation.x = THREE.MathUtils.lerp(
          fpSword.rotation.x,
          -0.35 + sprintTilt,
          Math.min(1, dt * 12)
        );
        fpSword.rotation.y = -0.25;
        fpSword.rotation.z = 0.12;
        (fpSlashTrail.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }

    if (equippedWeapon === 'BOW') {
      const isDrawingOrReleasing = bowDrawProgress > 0.01 || bowReleaseTimer > 0;

      if (isDrawingOrReleasing) {
        const pullBackZ = bowDrawProgress * 0.26;
        const recoilKick = bowReleaseTimer > 0 ? Math.sin((bowReleaseTimer / 0.18) * Math.PI) * 0.06 : 0;

        fpBowHolder.position.set(
          THREE.MathUtils.lerp(0.34, 0.1, bowDrawProgress),
          THREE.MathUtils.lerp(-0.24, -0.14, bowDrawProgress) + recoilKick * 0.5,
          THREE.MathUtils.lerp(-0.54, -0.45, bowDrawProgress) + recoilKick
        );
        fpBow.rotation.set(
          0.02 - recoilKick * 1.2,
          -0.12 * (1 - bowDrawProgress),
          0.08 * (1 - bowDrawProgress)
        );

        fpNockedArrow.visible = (hasArrows || isCorrupted || isCelestial) && bowReleaseTimer <= 0;
        fpNockedArrow.position.set(0, 0, pullBackZ);

        drawHandGroup.visible = bowReleaseTimer <= 0;
        drawHandGroup.position.set(-0.04, 0, 0.18 + pullBackZ);

        fpUpperString.position.set(0, 0.22, 0.18 + pullBackZ * 0.5);
        fpUpperString.rotation.x = -pullBackZ * 1.85;

        fpLowerString.position.set(0, -0.22, 0.18 + pullBackZ * 0.5);
        fpLowerString.rotation.x = pullBackZ * 1.85;
      } else {
        fpBowHolder.position.set(0.34, -0.24, -0.54);
        fpBow.rotation.x = THREE.MathUtils.lerp(
          fpBow.rotation.x,
          0.08 + (isSprinting ? -0.16 : 0),
          Math.min(1, dt * 12)
        );
        fpBow.rotation.y = -0.22;
        fpBow.rotation.z = 0.18;

        fpNockedArrow.visible = hasArrows || isCorrupted || isCelestial;
        fpNockedArrow.position.set(0, 0, 0);
        drawHandGroup.visible = false;

        fpUpperString.position.set(0, 0.22, 0.18);
        fpUpperString.rotation.x = 0;
        fpLowerString.position.set(0, -0.22, 0.18);
        fpLowerString.rotation.x = 0;
      }
    }
  };

  return {
    group: fpRoot,
    bowObject: fpBow,
    updateAnimation,
  };
}
