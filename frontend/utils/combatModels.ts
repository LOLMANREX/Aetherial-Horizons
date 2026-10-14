import * as THREE from 'three';

export interface EnemyInstance3D {
  id: number;
  campId: number;
  group: THREE.Group;
  bodyPivot: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  hpBarFill: THREE.Mesh;
  hpBarGroup: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  homePos: THREE.Vector3;
  patrolTarget: THREE.Vector3;
  yaw: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  attackCooldown: number;
  attackAnimTimer: number;
  hurtFlashTimer: number;
  walkPhase: number;
  setHumanSurvivorMode: (isSurvivor: boolean) => void;
}

export interface BossInstance3D {
  group: THREE.Group;
  bodyPivot: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  chestReceptacle: THREE.Group;
  orbitingOrbs: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;
  hp: number;
  maxHp: number;
  active: boolean;
  defeated: boolean;
  attackCooldown: number;
  slamCooldown: number;
  attackAnimTimer: number;
  walkPhase: number;
}

export interface SovereignThrone3D {
  group: THREE.Group;
  seatWorldOffset: THREE.Vector3;
  floatingMonoliths: THREE.Group;
  chaosRings: THREE.Group;
  lightningBolts: THREE.Line[];
}

export interface ArrowProjectile3D {
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  active: boolean;
  isLightningBolt?: boolean;
}

export interface LootPickup3D {
  id: string;
  group: THREE.Group;
  position: THREE.Vector3;
  arrows: number;
  heal: number;
  collected: boolean;
}

/**
 * Construit le Trône Impérial d'Obsidienne et le Vortex Chaotique lorsque le joueur choisit
 * de garder ses pouvoirs pour contrôler le monde (RULE_WORLD).
 */
export function createSovereignThroneMesh(x: number, y: number, z: number): SovereignThrone3D {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.visible = false;

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x0f071e,
    roughness: 0.3,
    metalness: 0.75,
    flatShading: true,
  });

  const crimsonGlowMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.25,
    metalness: 0.85,
    flatShading: true,
  });

  const step1 = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.8, 0.5, 8),
    obsidianMat
  );
  step1.position.y = 0.25;
  step1.receiveShadow = true;
  group.add(step1);

  const step2 = new THREE.Mesh(
    new THREE.CylinderGeometry(3.0, 3.5, 0.5, 8),
    obsidianMat
  );
  step2.position.y = 0.75;
  step2.receiveShadow = true;
  group.add(step2);

  const throneBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.65, 1.3),
    obsidianMat
  );
  throneBase.position.set(0, 1.32, -0.2);
  throneBase.castShadow = true;
  group.add(throneBase);

  const backrest = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 2.8, 0.28),
    obsidianMat
  );
  backrest.position.set(0, 2.5, -0.75);
  backrest.castShadow = true;
  group.add(backrest);

  for (const sign of [-1, 1]) {
    const armrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.55, 1.25),
      goldMat
    );
    armrest.position.set(sign * 0.72, 1.75, -0.18);
    armrest.castShadow = true;
    group.add(armrest);

    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 3.6, 5),
      obsidianMat
    );
    spire.position.set(sign * 0.95, 2.8, -0.75);
    spire.rotation.z = -sign * 0.18;
    spire.castShadow = true;
    group.add(spire);
  }

  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.06, 8, 24),
    crimsonGlowMat
  );
  haloRing.position.set(0, 2.9, -0.58);
  group.add(haloRing);

  const floatingMonoliths = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const radius = 12 + (i % 3) * 8;
    const rockPivot = new THREE.Group();
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.4 + (i % 3) * 0.8, 0),
      i % 3 === 0 ? crimsonGlowMat : obsidianMat
    );
    rock.position.set(
      Math.cos(angle) * radius,
      6 + (i % 4) * 5,
      Math.sin(angle) * radius
    );
    rockPivot.add(rock);
    floatingMonoliths.add(rockPivot);
  }
  group.add(floatingMonoliths);

  const chaosRings = new THREE.Group();
  chaosRings.position.set(0, 28, 0);
  for (let r = 0; r < 3; r++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(18 + r * 12, 0.45, 8, 32),
      crimsonGlowMat
    );
    ring.rotation.x = Math.PI / 2 + (r - 1) * 0.28;
    chaosRings.add(ring);
  }
  group.add(chaosRings);

  const lightningBolts: THREE.Line[] = [];
  for (let b = 0; b < 6; b++) {
    const a = (b / 6) * Math.PI * 2;
    const dist = 16 + (b % 2) * 10;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 8; s++) {
      const t = s / 8;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * dist + (Math.random() - 0.5) * 3,
          t * 55,
          Math.sin(a) * dist + (Math.random() - 0.5) * 3
        )
      );
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const bolt = new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0xf43f5e })
    );
    group.add(bolt);
    lightningBolts.push(bolt);
  }

  return {
    group,
    seatWorldOffset: new THREE.Vector3(0, 1.15, 0.08),
    floatingMonoliths,
    chaosRings,
    lightningBolts,
  };
}

/**
 * Construit le Réceptacle Céleste des 10 Orbes qui tombe du ciel lors de la cinématique du 10ème Orbe
 */
export function createSacredReceptacleMesh(): THREE.Group {
  const group = new THREE.Group();

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.25,
    metalness: 0.85,
    flatShading: true,
  });

  const cyanCrystalMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
  });

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.16, 8, 24),
    goldMat
  );
  group.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.12, 8, 20),
    goldMat
  );
  innerRing.rotation.y = Math.PI / 2;
  group.add(innerRing);

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.05, 1),
    cyanCrystalMat
  );
  group.add(core);

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const socket = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      cyanCrystalMat
    );
    socket.position.set(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0);
    group.add(socket);
  }

  return group;
}

/**
 * Construit le Boss colossal "Malakor, Titan du Néant" (échelle ~4.2x un humain)
 */
export function createBossMesh(x: number, y: number, z: number): BossInstance3D {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.visible = false;

  const SCALE = 4.2;
  const bodyPivot = new THREE.Group();
  bodyPivot.position.set(0, 0.9 * SCALE, 0);
  bodyPivot.scale.set(SCALE, SCALE, SCALE);
  group.add(bodyPivot);

  const obsidianArmorMat = new THREE.MeshStandardMaterial({
    color: 0x0f071e,
    roughness: 0.35,
    metalness: 0.65,
    flatShading: true,
  });

  const magmaTrimMat = new THREE.MeshStandardMaterial({
    color: 0x9f1239,
    emissive: 0x4c0519,
    emissiveIntensity: 0.6,
    roughness: 0.4,
    flatShading: true,
  });

  const voidGlowMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
  });

  const cyanStolenMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.8,
    flatShading: true,
  });

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.72, 0.42),
    obsidianArmorMat
  );
  torso.position.set(0, 0.35, 0);
  torso.castShadow = true;
  bodyPivot.add(torso);

  for (const sign of [-1, 1]) {
    const shoulder = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.24, 0.36),
      magmaTrimMat
    );
    shoulder.position.set(sign * 0.46, 0.64, 0);
    shoulder.rotation.z = -sign * 0.25;
    shoulder.castShadow = true;
    bodyPivot.add(shoulder);

    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.09, 0.38, 5),
      goldMat
    );
    spike.position.set(sign * 0.52, 0.86, 0);
    spike.rotation.z = -sign * 0.35;
    bodyPivot.add(spike);
  }

  const chestReceptacle = new THREE.Group();
  chestReceptacle.position.set(0, 0.4, -0.24);

  const stolenRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.03, 6, 16),
    goldMat
  );
  chestReceptacle.add(stolenRing);

  const stolenCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 1),
    cyanStolenMat
  );
  chestReceptacle.add(stolenCore);
  bodyPivot.add(chestReceptacle);

  const orbitingOrbs = new THREE.Group();
  orbitingOrbs.position.set(0, 0.55, 0);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const orbMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.08, 0),
      i % 2 === 0 ? cyanStolenMat : voidGlowMat
    );
    orbMesh.position.set(Math.cos(a) * 0.85, Math.sin(a * 2) * 0.12, Math.sin(a) * 0.85);
    orbitingOrbs.add(orbMesh);
  }
  bodyPivot.add(orbitingOrbs);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.86, 0);
  bodyPivot.add(headGroup);

  const helm = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.4, 0.38),
    obsidianArmorMat
  );
  helm.castShadow = true;
  headGroup.add(helm);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.06, 0.03),
    voidGlowMat
  );
  visor.position.set(0, 0.03, -0.195);
  headGroup.add(visor);

  for (const sign of [-1, 1]) {
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.48, 6),
      goldMat
    );
    horn.position.set(sign * 0.26, 0.32, -0.04);
    horn.rotation.z = -sign * 0.45;
    horn.rotation.x = 0.25;
    headGroup.add(horn);
  }

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.44, 0.58, 0);
  const leftArmMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.62, 0.2),
    obsidianArmorMat
  );
  leftArmMesh.position.set(0, -0.28, 0);
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  bodyPivot.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.44, 0.58, 0);
  const rightArmMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.62, 0.2),
    obsidianArmorMat
  );
  rightArmMesh.position.set(0, -0.28, 0);
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  const bossWeapon = new THREE.Group();
  bossWeapon.position.set(0, -0.56, -0.08);
  bossWeapon.rotation.x = -Math.PI / 2 + 0.25;

  const hilt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.04, 0.36, 6),
    goldMat
  );
  bossWeapon.add(hilt);

  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.07, 0.1),
    goldMat
  );
  guard.position.set(0, 0.18, 0);
  bossWeapon.add(guard);

  const greatBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 1.25, 0.035),
    magmaTrimMat
  );
  greatBlade.position.set(0, 0.82, 0);
  greatBlade.castShadow = true;
  bossWeapon.add(greatBlade);

  const bladeCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 1.18, 0.042),
    voidGlowMat
  );
  bladeCore.position.set(0, 0.82, 0);
  bossWeapon.add(bladeCore);

  rightArm.add(bossWeapon);
  bodyPivot.add(rightArm);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18, 0, 0);
  const leftLegMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.9, 0.24),
    obsidianArmorMat
  );
  leftLegMesh.position.set(0, -0.45, 0);
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);
  bodyPivot.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, 0, 0);
  const rightLegMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.9, 0.24),
    obsidianArmorMat
  );
  rightLegMesh.position.set(0, -0.45, 0);
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);
  bodyPivot.add(rightLeg);

  return {
    group,
    bodyPivot,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    chestReceptacle,
    orbitingOrbs,
    position: new THREE.Vector3(x, y, z),
    velocity: new THREE.Vector3(),
    yaw: 0,
    hp: 1200,
    maxHp: 1200,
    active: false,
    defeated: false,
    attackCooldown: 0,
    slamCooldown: 4.0,
    attackAnimTimer: 0,
    walkPhase: 0,
  };
}

/**
 * Crée un Maraudeur de l'Ombre pouvant se convertir en Survivant Humain Vengeur (post-game mauvaise fin)
 */
export function createEnemyMesh(
  id: number,
  campId: number,
  x: number,
  y: number,
  z: number
): EnemyInstance3D {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const bodyPivot = new THREE.Group();
  bodyPivot.position.set(0, 0.9, 0);
  group.add(bodyPivot);

  const darkArmorMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b2e,
    roughness: 0.5,
    metalness: 0.4,
    flatShading: true,
  });

  const headSkinOrHelmMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b2e,
    roughness: 0.55,
    flatShading: true,
  });

  const crimsonTrimMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.55,
    flatShading: true,
  });

  const glowingRedMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
  });

  const hornMat = new THREE.MeshStandardMaterial({
    color: 0xd6d3d1,
    roughness: 0.7,
    flatShading: true,
  });

  const survivorHairMat = new THREE.MeshStandardMaterial({
    color: 0x3b2314,
    roughness: 0.8,
    flatShading: true,
  });

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.62, 0.32),
    darkArmorMat
  );
  torso.position.set(0, 0.32, 0);
  torso.castShadow = true;
  bodyPivot.add(torso);

  const coreRune = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.09, 0),
    glowingRedMat
  );
  coreRune.position.set(0, 0.38, -0.17);
  bodyPivot.add(coreRune);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.76, 0);
  bodyPivot.add(headGroup);

  const helmet = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.36, 0.34),
    headSkinOrHelmMat
  );
  helmet.castShadow = true;
  headGroup.add(helmet);

  // Cheveux + Bandeau pour les Survivants Humains (cachés tant que ce sont des Maraudeurs)
  const survivorHairGroup = new THREE.Group();
  survivorHairGroup.visible = false;
  const hairTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.12, 0.36),
    survivorHairMat
  );
  hairTop.position.set(0, 0.18, 0.01);
  survivorHairGroup.add(hairTop);

  const headband = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.055, 0.35),
    crimsonTrimMat
  );
  headband.position.set(0, 0.1, 0);
  survivorHairGroup.add(headband);
  headGroup.add(survivorHairGroup);

  const eyeL = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.035, 0.02),
    glowingRedMat
  );
  eyeL.position.set(-0.075, 0.02, -0.172);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.035, 0.02),
    glowingRedMat
  );
  eyeR.position.set(0.075, 0.02, -0.172);
  headGroup.add(eyeR);

  const hornL = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.28, 5),
    hornMat
  );
  hornL.position.set(-0.2, 0.22, 0);
  hornL.rotation.z = 0.45;
  headGroup.add(hornL);

  const hornR = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.28, 5),
    hornMat
  );
  hornR.position.set(0.2, 0.22, 0);
  hornR.rotation.z = -0.45;
  headGroup.add(hornR);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.34, 0.54, 0);
  const leftArmMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.54, 0.15),
    crimsonTrimMat
  );
  leftArmMesh.position.set(0, -0.24, 0);
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  bodyPivot.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.34, 0.54, 0);
  const rightArmMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.54, 0.15),
    crimsonTrimMat
  );
  rightArmMesh.position.set(0, -0.24, 0);
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  const enemyWeapon = new THREE.Group();
  enemyWeapon.position.set(0, -0.5, -0.06);
  enemyWeapon.rotation.x = -Math.PI / 2 + 0.3;

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.03, 0.26, 6),
    darkArmorMat
  );
  enemyWeapon.add(handle);

  const crossguard = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.045, 0.065),
    hornMat
  );
  crossguard.position.set(0, 0.13, 0);
  enemyWeapon.add(crossguard);

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.82, 0.025),
    crimsonTrimMat
  );
  blade.position.set(0, 0.54, 0);
  blade.castShadow = true;
  enemyWeapon.add(blade);

  const bladeTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.15, 4),
    crimsonTrimMat
  );
  bladeTip.position.set(0, 1.02, 0);
  bladeTip.rotation.y = Math.PI / 4;
  enemyWeapon.add(bladeTip);

  const bladeGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.78, 0.03),
    glowingRedMat
  );
  bladeGlow.position.set(0, 0.54, 0);
  enemyWeapon.add(bladeGlow);

  rightArm.add(enemyWeapon);
  bodyPivot.add(rightArm);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.14, 0, 0);
  const leftLegMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.88, 0.18),
    darkArmorMat
  );
  leftLegMesh.position.set(0, -0.44, 0);
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);
  bodyPivot.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.14, 0, 0);
  const rightLegMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 0.88, 0.18),
    darkArmorMat
  );
  rightLegMesh.position.set(0, -0.44, 0);
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);
  bodyPivot.add(rightLeg);

  const hpBarGroup = new THREE.Group();
  hpBarGroup.position.set(0, 2.35, 0);

  const hpBg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.13),
    new THREE.MeshBasicMaterial({
      color: 0x090d16,
      side: THREE.DoubleSide,
    })
  );
  hpBarGroup.add(hpBg);

  const hpBarFillMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    side: THREE.DoubleSide,
  });
  const hpBarFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.04, 0.085),
    hpBarFillMat
  );
  hpBarFill.position.set(0, 0, 0.01);
  hpBarGroup.add(hpBarFill);

  group.add(hpBarGroup);

  // Permet de transformer les Maraudeurs en Survivants Humains Résistants lorsque le joueur a choisi la mauvaise fin !
  let currentSurvivorMode = false;
  const setHumanSurvivorMode = (isSurvivor: boolean) => {
    if (currentSurvivorMode === isSurvivor) return;
    currentSurvivorMode = isSurvivor;

    hornL.visible = !isSurvivor;
    hornR.visible = !isSurvivor;
    survivorHairGroup.visible = isSurvivor;

    if (isSurvivor) {
      headSkinOrHelmMat.color.setHex(0xf4c29f); // Visage humain
      darkArmorMat.color.setHex(0x1e3a8a); // Tunique de la Résistance Humaine
      crimsonTrimMat.color.setHex(0xd97706); // Épaulières bronze/or et lame acier clair
      glowingRedMat.color.setHex(0x38bdf8); // Yeux déterminés & lame Aethérique bleue
      hpBarFillMat.color.setHex(0x38bdf8);
    } else {
      headSkinOrHelmMat.color.setHex(0x1e1b2e);
      darkArmorMat.color.setHex(0x1e1b2e);
      crimsonTrimMat.color.setHex(0x991b1b);
      glowingRedMat.color.setHex(0xf43f5e);
      hpBarFillMat.color.setHex(0xf43f5e);
    }
  };

  const startPos = new THREE.Vector3(x, y, z);
  return {
    id,
    campId,
    group,
    bodyPivot,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    hpBarFill,
    hpBarGroup,
    position: startPos.clone(),
    velocity: new THREE.Vector3(),
    homePos: startPos.clone(),
    patrolTarget: startPos.clone(),
    yaw: Math.random() * Math.PI * 2,
    hp: 100,
    maxHp: 100,
    alive: true,
    attackCooldown: 0,
    attackAnimTimer: 0,
    hurtFlashTimer: 0,
    walkPhase: Math.random() * 10,
    setHumanSurvivorMode,
  };
}

/**
 * Construit un Camp de Maraudeurs 3D (Tente, Feu de camp, Bannière)
 */
export function createEnemyCampGroup(x: number, y: number, z: number): THREE.Group {
  const campGroup = new THREE.Group();
  campGroup.position.set(x, y, z);

  const tentMat = new THREE.MeshStandardMaterial({
    color: 0x451a1c,
    roughness: 0.85,
    flatShading: true,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.9,
    flatShading: true,
  });

  const tentMesh = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, 3.8, 5),
    tentMat
  );
  tentMesh.position.set(-3.8, 1.8, -2.5);
  tentMesh.castShadow = true;
  tentMesh.receiveShadow = true;
  campGroup.add(tentMesh);

  const firePitGroup = new THREE.Group();
  firePitGroup.position.set(0, 0.1, 0);

  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 1.4, 6),
      woodMat
    );
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i * Math.PI) / 4;
    log.position.y = 0.12;
    firePitGroup.add(log);
  }

  const flameMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 1.35, 6),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  flameMesh.position.y = 0.65;
  firePitGroup.add(flameMesh);

  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.9, 5),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  innerFlame.position.y = 0.5;
  firePitGroup.add(innerFlame);

  campGroup.add(firePitGroup);

  const bannerPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6),
    woodMat
  );
  bannerPole.position.set(3.2, 2.2, -2.2);
  bannerPole.castShadow = true;
  campGroup.add(bannerPole);

  const bannerFlag = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.6, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      flatShading: true,
    })
  );
  bannerFlag.position.set(3.75, 3.4, -2.2);
  bannerFlag.castShadow = true;
  campGroup.add(bannerFlag);

  return campGroup;
}

/**
 * Crée une Caisse / Trousse de Flèches ramassable
 */
export function createLootPickupMesh(
  id: string,
  x: number,
  y: number,
  z: number,
  arrows: number,
  heal: number
): LootPickup3D {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.55, 0.75),
    new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.8,
      flatShading: true,
    })
  );
  crate.position.y = 0.28;
  crate.castShadow = true;
  group.add(crate);

  const indicator = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.32, 0),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
    })
  );
  indicator.position.y = 1.05;
  group.add(indicator);

  const shaftMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  for (let i = -1; i <= 1; i++) {
    const arrowVisual = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.7, 5),
      shaftMat
    );
    arrowVisual.position.set(i * 0.14, 0.65, 0);
    arrowVisual.rotation.z = i * 0.15;
    group.add(arrowVisual);
  }

  return {
    id,
    group,
    position: new THREE.Vector3(x, y, z),
    arrows,
    heal,
    collected: false,
  };
}

/**
 * Crée un projectile de flèche 3D tiré par l'arc du joueur
 */
export function createArrowProjectileMesh(): THREE.Group {
  const group = new THREE.Group();

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 1.2, 6),
    new THREE.MeshBasicMaterial({ color: 0xfde047 })
  );
  shaft.rotation.x = Math.PI / 2;
  group.add(shaft);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.24, 6),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee })
  );
  tip.rotation.x = Math.PI / 2;
  tip.position.z = 0.65;
  group.add(tip);

  const tailGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.35),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
    })
  );
  tailGlow.position.z = -0.45;
  group.add(tailGlow);

  return group;
}

/**
 * Crée un projectile de Mini-Éclair Rouge tiré à distance en post-game (Mauvaise Fin)
 */
export function createLightningBoltProjectileMesh(): THREE.Group {
  const group = new THREE.Group();

  const coreMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  // Segments en zigzag formant un mini-éclair ardent
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.07, 0.45),
      i % 2 === 0 ? coreMat : innerMat
    );
    seg.position.set(
      (i % 2 === 0 ? 1 : -1) * 0.04,
      (i % 2 === 0 ? -1 : 1) * 0.03,
      (i - 1.5) * 0.36
    );
    seg.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.22;
    group.add(seg);
  }

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xe11d48,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(halo);

  return group;
}

/**
 * Crée l'effet visuel 3D d'un Vortex Céleste générant un Éclair Destructeur géant sur une cible (Touche T en post-game)
 */
export function createSkyVortexStrikeEffect(x: number, y: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const crimsonMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const coreWhiteMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Vortex tournoyant dans le ciel (à 36m de haut)
  const skyVortex = new THREE.Group();
  skyVortex.position.set(0, 36, 0);
  for (let r = 0; r < 3; r++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.5 + r * 2.4, 0.28, 8, 24),
      r === 0 ? coreWhiteMat : crimsonMat
    );
    ring.rotation.x = Math.PI / 2;
    skyVortex.add(ring);
  }
  group.add(skyVortex);

  // Colonne de foudre destructrice frappant du vortex jusqu'au sol
  const beamOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 2.2, 36, 12, 1, true),
    crimsonMat
  );
  beamOuter.position.set(0, 18, 0);
  group.add(beamOuter);

  const beamInner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.9, 36, 8, 1, true),
    coreWhiteMat
  );
  beamInner.position.set(0, 18, 0);
  group.add(beamInner);

  // Cratère d'impact au sol
  const groundShock = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 4.5, 24),
    crimsonMat
  );
  groundShock.rotation.x = -Math.PI / 2;
  groundShock.position.y = 0.25;
  group.add(groundShock);

  return group;
}

/**
 * Crée l'effet visuel 3D d'une Fissure Dimensionnelle qui déchire la réalité (Touche G en post-game)
 */
export function createRealityRiftEffect(x: number, y: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const voidMat = new THREE.MeshBasicMaterial({
    color: 0x090414,
    side: THREE.DoubleSide,
  });

  const riftEdgeMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // 6 grandes brèches verticales et obliques qui déchirent l'espace autour du joueur
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dist = 4.5 + (i % 2) * 3.0;
    const shardGroup = new THREE.Group();
    shardGroup.position.set(Math.cos(angle) * dist, 2.8, Math.sin(angle) * dist);
    shardGroup.rotation.y = -angle;
    shardGroup.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.35;

    const voidCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.4, 0),
      voidMat
    );
    voidCore.scale.set(0.25, 2.6, 0.85);
    shardGroup.add(voidCore);

    const riftOutline = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.65, 0),
      riftEdgeMat
    );
    riftOutline.scale.set(0.3, 2.8, 0.95);
    shardGroup.add(riftOutline);

    group.add(shardGroup);
  }

  // Anneau de fracture dimensionnelle au sol
  const groundCrack = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 3.8, 16),
    riftEdgeMat
  );
  groundCrack.rotation.x = -Math.PI / 2;
  groundCrack.position.y = 0.2;
  group.add(groundCrack);

  return group;
}
