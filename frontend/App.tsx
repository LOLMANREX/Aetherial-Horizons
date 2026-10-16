import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import {
  CutsceneOverlay,
  INTRO_SLIDES,
  BOSS_SLIDES,
  OUTRO_SLIDES,
  CLASH_SLIDES,
} from './components/CutsceneOverlay';
import {
  getTerrainHeight,
  getTerrainSlope,
  pseudoRandom,
  WORLD_SIZE,
  WATER_LEVEL,
} from './utils/noise';
import {
  createHumanoidCharacter,
  createFirstPersonViewModel,
  HumanoidCharacter,
} from './utils/playerModel';
import {
  createEnemyMesh,
  createEnemyCampGroup,
  createLootPickupMesh,
  createArrowProjectileMesh,
  createLightningBoltProjectileMesh,
  createCometArrowProjectileMesh,
  createSkyVortexStrikeEffect,
  createRealityRiftEffect,
  createBossMesh,
  createSacredReceptacleMesh,
  createSovereignThroneMesh,
  EnemyInstance3D,
  BossInstance3D,
  SovereignThrone3D,
  ArrowProjectile3D,
  LootPickup3D,
} from './utils/combatModels';
import {
  OrbData,
  PlayerStats,
  WorldState,
  GameScreen,
  SaveSlotData,
  WeaponType,
  CampData,
  EndingChoice,
} from './types';
import {
  getAllSaves,
  saveToSlot,
  deleteSaveSlot,
  syncSavesFromCloud,
  SaveManager,
} from './utils/saveManager';
import { soundFX } from './utils/sound';
import { renderMinimapFrame } from './utils/minimapBridge';

const ORB_NAMES = [
  'Orbe de l’Aube Éternelle',
  'Totem des Vents Sylvestres',
  'Cristal du Sommet Brumeux',
  'Cœur de la Vallée d’Émeraude',
  'Éclat Stellaire d’Hélios',
  'Relique du Crépuscule',
  'Larme des Anciens Titans',
  'Phare de l’Horizon Perdu',
  'Essence Boréale Pure',
  'Sceau d’Aetheria',
];

const ORB_POWER_UNLOCK_MESSAGES: Record<number, string> = {
  1: 'Pouvoir Débloqué : Dash Éclair [Touche R] !',
  2: 'Pouvoir Débloqué : Contrôle Jour / Nuit [Touche T] !',
  3: 'Pouvoir Débloqué : Bond Céleste & Vitesse accrue !',
  4: 'Pouvoir Débloqué : Nova Solaire Foudroyante [Touche G] !',
  5: 'Pouvoir Débloqué : Lame & Flèches Surpuissantes (+50% Dégâts) !',
  6: 'Pouvoir Débloqué : Régénération Aethérique continue !',
  7: 'Pouvoir Débloqué : Souffle Abyssal (Apnée x3 sous l’eau) !',
  8: 'Pouvoir Débloqué : Carquois Céleste (Régénération de flèches) !',
  9: 'Pouvoir Débloqué : Maîtrise de la Foudre (Cooldowns divisés par 2) !',
  10: '10ème Orbe récupérée ! Le Réceptacle Céleste descend des cieux...',
};

const CAMP_NAMES = [
  'Bastion des Ronces',
  'Campement de l’Éclipse',
  'Avant-Poste Cendré',
  'Repaire des Maraudeurs',
  'Garnison du Crépuscule',
];

const CUTSCENE_ANIM_DURATION = 10.0;
const BOW_FULL_DRAW_DURATION = 0.62;
const ARROW_GRAVITY = 15.0;

interface ObstacleCollider {
  x: number;
  z: number;
  radius: number;
  maxY: number;
}

interface VisualEffect3D {
  mesh: THREE.Object3D;
  age: number;
  maxAge: number;
  targetX?: number;
  targetZ?: number;
  type:
    | 'LIGHTNING'
    | 'NOVA_RING'
    | 'BOSS_SLAM_RING'
    | 'SKY_VORTEX'
    | 'REALITY_RIFT'
    | 'SUPERNOVA'
    | 'CONSTELLATION_TRAIL'
    | 'SCARLET_TELEGRAPH'
    | 'SCARLET_LIGHTNING_PILLAR';
}

function generateInitialOrbs(seedOffset = 0): OrbData[] {
  const list: OrbData[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + pseudoRandom(i + 10 + seedOffset) * 0.45;
    const radius = 50 + pseudoRandom(i + 50 + seedOffset) * 215;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = getTerrainHeight(x, z) + 2.2;
    list.push({
      id: i,
      x,
      y,
      z,
      collected: false,
      name: ORB_NAMES[i % ORB_NAMES.length],
    });
  }
  return list;
}

function generateEnemyCamps(seedOffset = 0): CampData[] {
  const camps: CampData[] = [];
  let idx = 0;
  let attempt = 0;
  while (camps.length < 5 && attempt < 60) {
    attempt++;
    const angle = (camps.length / 5) * Math.PI * 2 + pseudoRandom(attempt * 9.1 + seedOffset) * 0.7;
    const radius = 65 + pseudoRandom(attempt * 17.3 + seedOffset) * 165;
    const cx = Math.cos(angle) * radius;
    const cz = Math.sin(angle) * radius;
    const cy = getTerrainHeight(cx, cz);

    if (cy < WATER_LEVEL + 2.5 || cy > 26 || getTerrainSlope(cx, cz) > 0.55) {
      continue;
    }

    camps.push({
      id: idx,
      x: cx,
      y: cy,
      z: cz,
      name: CAMP_NAMES[idx % CAMP_NAMES.length],
    });
    idx++;
  }
  return camps;
}

export function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [screen, setScreen] = useState<GameScreen>('MAIN_MENU');
  const [saves, setSaves] = useState<Record<number, SaveSlotData | null>>(() =>
    getAllSaves()
  );
  const [activeSlot, setActiveSlot] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentCollectName, setRecentCollectName] = useState<string | null>(null);

  const [isMouseCaptured, setIsMouseCaptured] = useState(false);

  const [fadeOpacity, setFadeOpacity] = useState(0);

  const [cutsceneStep, setCutsceneStep] = useState(0);
  const [cutsceneProgress, setCutsceneProgress] = useState(0);
  const [endingChoice, setEndingChoice] = useState<EndingChoice>('NONE');
  const [progressionState, setProgressionState] = useState(() =>
    SaveManager.getState()
  );

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    x: 0,
    y: getTerrainHeight(0, 0) + 2,
    z: 0,
    heading: 0,
    health: 100,
    stamina: 100,
    oxygen: 100,
    arrows: 12,
    equippedWeapon: 'SWORD',
    isAttacking: false,
    isDrawingBow: false,
    bowCharge: 0,
    isSprinting: false,
    isGrounded: true,
    isSwimming: false,
    isUnderwater: false,
    cameraMode: 'THIRD_PERSON',
    activePowersCount: 0,
    dashCooldown: 0,
    maxDashCooldown: 2.5,
    novaCooldown: 0,
    maxNovaCooldown: 6.0,
    endingChoice: 'NONE',
  });

  const [worldState, setWorldState] = useState<WorldState>(() => ({
    orbsCollected: 0,
    totalOrbs: 10,
    timeOfDay: 9.5,
    enemyTier: 1,
    nearestOrbDistance: null,
    nearestOrbAngle: null,
    orbs: generateInitialOrbs(0),
    enemies: [],
    camps: generateEnemyCamps(0),
    lootPickups: [],
    boss: {
      active: false,
      defeated: false,
      name: 'Malakor, Titan du Néant',
      x: 0,
      y: getTerrainHeight(0, 0),
      z: 0,
      hp: 1200,
      maxHp: 1200,
    },
  }));

  useEffect(() => {
    syncSavesFromCloud().then((mergedSaves) => {
      setSaves({ ...mergedSaves });
    });
  }, []);

  const gameRef = useRef({
    screen: 'MAIN_MENU' as GameScreen,
    activeSlot: 1,
    yaw: 0,
    pitch: -0.05,
    cameraMode: 'THIRD_PERSON' as 'FIRST_PERSON' | 'THIRD_PERSON',
    timeOfDay: 9.5,
    health: 100,
    stamina: 100,
    oxygen: 100,
    arrows: 12,
    equippedWeapon: 'SWORD' as WeaponType,
    attackTimer: 0,
    attackDuration: 0.36,
    swordHitDealt: false,
    isDrawingBow: false,
    bowDrawProgress: 0,
    bowAutoReleaseOnFull: false,
    bowCooldownTimer: 0,
    bowReleaseAnimTimer: 0,
    dashCooldownTimer: 0,
    novaCooldownTimer: 0,
    arrowRegenTimer: 0,
    divineInvulnTimer: 0,
    endingChoice: 'NONE' as EndingChoice,
    isDimensionalClashActive: false,
    alterEgoPhase: 1 as 1 | 2 | 3,
    alterEgoDashCooldown: 0,
    alterEgoLightningCooldown: 0,
    alterEgoTeleportCooldown: 0,
    alterEgoRiftCooldown: 0,
    alterEgoComboStep: 0,
    alterEgoHumanoid: null as HumanoidCharacter | null,
    visualEffects: [] as VisualEffect3D[],
    exhaustedCooldown: false,
    wasSwimming: false,
    bobPhase: 0,
    playerPos: new THREE.Vector3(0, getTerrainHeight(0, 0) + 2.0, 0),
    playerVel: new THREE.Vector3(0, 0, 0),
    isGrounded: true,
    orbs: generateInitialOrbs(0),
    camps: generateEnemyCamps(0),
    orbMeshes: [] as {
      group: THREE.Group;
      core: THREE.Mesh;
      glowSphere: THREE.Mesh;
      ring1: THREE.Mesh;
      ring2: THREE.Mesh;
      particles: THREE.Points;
    }[],
    enemyInstances: [] as EnemyInstance3D[],
    bossInstance: null as BossInstance3D | null,
    sovereignThrone: null as SovereignThrone3D | null,
    purificationWaveMesh: null as THREE.Mesh | null,
    fallingReceptacleMesh: null as THREE.Group | null,
    lootInstances: [] as LootPickup3D[],
    arrowProjectiles: [] as ArrowProjectile3D[],
    sceneRef: null as THREE.Scene | null,
    cameraRef: null as THREE.PerspectiveCamera | null,
    finaleMonumentGroup: null as THREE.Group | null,
    skyPillarMesh: null as THREE.Mesh | null,
    restoredHeartMesh: null as THREE.Mesh | null,
    crownGroupMesh: null as THREE.Group | null,
    cutsceneStepTimer: 0,
    cutsceneStepIndex: 0,
    isFadingTransition: false,
    keys: {} as Record<string, boolean>,
    mouseCaptured: false,
    isDraggingFallback: false,
    lastMousePos: null as { x: number; y: number } | null,
    mouseDownPos: { x: 0, y: 0 },
    mouseNDC: { x: 0, y: 0 },
    isMouseInsideWindow: true,
  });

  const bossDamageHandlerRef = useRef<
    ((damage: number, knockDirX: number, knockDirZ: number) => void) | null
  >(null);

  const showToast = useCallback((msg: string) => {
    setRecentCollectName(msg);
    setTimeout(() => setRecentCollectName(null), 3200);
  }, []);

  const updateScreen = useCallback((nextScreen: GameScreen) => {
    gameRef.current.screen = nextScreen;
    setScreen(nextScreen);
  }, []);

  const requestLockSafe = useCallback(() => {
    soundFX.init();
    gameRef.current.mouseCaptured = true;
    gameRef.current.lastMousePos = null;
    setIsMouseCaptured(true);

    const el = mountRef.current;
    if (!el) return;
    try {
      if (typeof el.requestPointerLock === 'function') {
        const lockPromise = el.requestPointerLock() as unknown as Promise<void> | undefined;
        if (lockPromise && typeof lockPromise.catch === 'function') {
          lockPromise.catch(() => {});
        }
      }
    } catch {
      // Fallback transparent
    }
  }, []);

  const exitLockSafe = useCallback(() => {
    gameRef.current.mouseCaptured = false;
    gameRef.current.lastMousePos = null;
    gameRef.current.mouseNDC = { x: 0, y: 0 };
    setIsMouseCaptured(false);

    if (document.pointerLockElement) {
      try {
        document.exitPointerLock();
      } catch {
        // Ignore
      }
    }
  }, []);

  // Fix activePowersCount so both SAVE_WORLD (transcendent mode) and RULE_WORLD keep all 10 powers in post-game
  const getActivePowersCount = () => {
    const st = gameRef.current;
    if (st.endingChoice === 'SAVE_WORLD') return 10;
    return st.orbs.filter((o) => o.collected).length;
  };

  const handleSelectWeapon = useCallback((weapon: WeaponType) => {
    gameRef.current.equippedWeapon = weapon;
    gameRef.current.isDrawingBow = false;
    gameRef.current.bowDrawProgress = 0;
    gameRef.current.bowAutoReleaseOnFull = false;
    setPlayerStats((prev) => ({
      ...prev,
      equippedWeapon: weapon,
      isDrawingBow: false,
      bowCharge: 0,
    }));
  }, []);

  const performSave = useCallback((slotId: number) => {
    const st = gameRef.current;
    const orbsCollected = st.orbs.filter((o) => o.collected).length;
    saveToSlot(slotId, {
      name: `Emplacement ${slotId}`,
      orbsCollected,
      totalOrbs: st.orbs.length,
      timeOfDay: st.timeOfDay,
      playerPos: {
        x: st.playerPos.x,
        y: st.playerPos.y,
        z: st.playerPos.z,
      },
      yaw: st.yaw,
      pitch: st.pitch,
      cameraMode: st.cameraMode,
      orbs: st.orbs.map((o) => ({ ...o })),
      health: st.health,
      arrows: st.arrows,
      equippedWeapon: st.equippedWeapon,
      endingChoice: st.endingChoice,
      bossActive: st.bossInstance?.active ?? false,
      bossDefeated: st.bossInstance?.defeated ?? false,
      bossHp: st.bossInstance?.hp ?? 1200,
    });
    setSaves(getAllSaves());
  }, []);

  const applyEnemyPowerScaling = useCallback((orbsCount: number) => {
    const st = gameRef.current;
    const isSurvivor = st.endingChoice === 'RULE_WORLD';
    const isDemon = st.endingChoice === 'SAVE_WORLD';
    const scaleVisual = isSurvivor ? 1.12 : isDemon ? 1.32 : 1 + orbsCount * 0.055;
    const newMaxHp = isDemon ? 450 : 100 + orbsCount * 28;

    st.enemyInstances.forEach((enemy) => {
      enemy.setHumanSurvivorMode(isSurvivor);
      enemy.setSpacetimeDemonMode(isDemon);
      const ratio = enemy.hp / Math.max(1, enemy.maxHp);
      enemy.maxHp = newMaxHp;
      enemy.hp = Math.round(ratio * newMaxHp);
      enemy.bodyPivot.scale.set(scaleVisual, scaleVisual, scaleVisual);
      enemy.hpBarGroup.position.y = 2.35 * scaleVisual;
    });
  }, []);

  const syncOrbMeshesWithState = useCallback((orbsList: OrbData[]) => {
    orbsList.forEach((orb, idx) => {
      const meshObj = gameRef.current.orbMeshes[idx];
      if (meshObj) {
        meshObj.group.position.set(orb.x, orb.y, orb.z);
        meshObj.group.visible = !orb.collected;
      }
    });
  }, []);

  const respawnEnemiesAndLoot = useCallback(() => {
    const st = gameRef.current;
    const orbsCount = st.orbs.filter((o) => o.collected).length;
    const isSurvivor = st.endingChoice === 'RULE_WORLD';
    const isDemon = st.endingChoice === 'SAVE_WORLD';
    applyEnemyPowerScaling(orbsCount);

    st.enemyInstances.forEach((enemy) => {
      enemy.setHumanSurvivorMode(isSurvivor);
      enemy.setSpacetimeDemonMode(isDemon);
      enemy.hp = enemy.maxHp;
      enemy.alive = true;
      enemy.position.copy(enemy.homePos);
      enemy.patrolTarget.copy(enemy.homePos);
      enemy.group.position.copy(enemy.homePos);
      enemy.group.scale.set(1, 1, 1);
      enemy.bodyPivot.rotation.x = 0;
      enemy.group.visible = true;
      enemy.hpBarGroup.visible = true;
      enemy.hpBarFill.scale.x = 1;
    });

    st.lootInstances.forEach((loot) => {
      loot.collected = false;
      loot.group.visible = true;
    });
  }, [applyEnemyPowerScaling]);

  const triggerBossIntroWithFade = useCallback(() => {
    const st = gameRef.current;
    if (st.isFadingTransition) return;
    st.isFadingTransition = true;
    st.keys = {};
    st.isDrawingBow = false;
    st.bowDrawProgress = 0;

    setFadeOpacity(1);

    setTimeout(() => {
      exitLockSafe();
      st.cutsceneStepTimer = 0;
      st.cutsceneStepIndex = 0;
      setCutsceneStep(0);
      setCutsceneProgress(0);

      const centerGroundY = getTerrainHeight(0, 0);
      if (st.bossInstance) {
        st.bossInstance.hp = st.bossInstance.maxHp;
        st.bossInstance.active = true;
        st.bossInstance.defeated = false;
        st.bossInstance.position.set(0, centerGroundY, 0);
        st.bossInstance.group.position.set(0, centerGroundY, 0);
        st.bossInstance.group.visible = false;
      }

      if (st.fallingReceptacleMesh) {
        st.fallingReceptacleMesh.visible = true;
        st.fallingReceptacleMesh.position.set(0, centerGroundY + 45, 0);
      }

      if (st.finaleMonumentGroup) {
        st.finaleMonumentGroup.visible = true;
      }
      if (st.skyPillarMesh) {
        (st.skyPillarMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
      }

      soundFX.init();
      soundFX.playCinematicChord(0, false);
      updateScreen('BOSS_CUTSCENE');

      setTimeout(() => {
        setFadeOpacity(0);
        st.isFadingTransition = false;
      }, 300);
    }, 1250);
  }, [exitLockSafe, updateScreen]);

  const startOutroCutscene = useCallback(() => {
    const st = gameRef.current;
    st.isFadingTransition = true;
    setFadeOpacity(1);

    setTimeout(() => {
      exitLockSafe();
      st.keys = {};
      st.isDrawingBow = false;
      st.bowDrawProgress = 0;
      st.endingChoice = 'NONE';
      st.cutsceneStepTimer = 0;
      st.cutsceneStepIndex = 0;
      setEndingChoice('NONE');
      setCutsceneStep(0);
      setCutsceneProgress(0);

      if (st.sovereignThrone) {
        st.sovereignThrone.group.visible = false;
      }
      if (st.purificationWaveMesh) {
        st.purificationWaveMesh.visible = false;
      }
      if (st.finaleMonumentGroup) {
        st.finaleMonumentGroup.visible = true;
      }
      if (st.skyPillarMesh) {
        (st.skyPillarMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
      }
      if (st.restoredHeartMesh) {
        st.restoredHeartMesh.visible = true;
        (st.restoredHeartMesh.material as THREE.MeshBasicMaterial).color.setHex(0xfef08a);
      }

      soundFX.init();
      soundFX.playCinematicChord(0, true);
      updateScreen('OUTRO_CUTSCENE');

      setTimeout(() => {
        setFadeOpacity(0);
        st.isFadingTransition = false;
      }, 300);
    }, 1100);
  }, [exitLockSafe, updateScreen]);

  const handleDebugJumpToEndingChoice = useCallback(() => {
    const st = gameRef.current;
    exitLockSafe();

    const completedOrbs = (st.orbs.length > 0 ? st.orbs : generateInitialOrbs(st.activeSlot * 137)).map(
      (o) => ({ ...o, collected: true })
    );
    const heroZ = 12;
    const startY = getTerrainHeight(0, heroZ) + 2.0;

    st.orbs = completedOrbs;
    st.playerPos.set(0, startY, heroZ);
    st.playerVel.set(0, 0, 0);
    st.yaw = 0;
    st.pitch = 0.05;
    st.health = 100;
    st.stamina = 100;
    st.oxygen = 100;
    st.arrows = 20;
    st.equippedWeapon = 'SWORD';
    st.isDrawingBow = false;
    st.bowDrawProgress = 0;
    st.dashCooldownTimer = 0;
    st.novaCooldownTimer = 0;
    st.divineInvulnTimer = 0;
    st.endingChoice = 'NONE';
    st.keys = {};
    st.cutsceneStepTimer = 0;
    st.cutsceneStepIndex = 1;

    if (st.bossInstance) {
      st.bossInstance.active = false;
      st.bossInstance.defeated = true;
      st.bossInstance.hp = 0;
      st.bossInstance.group.visible = false;
    }
    if (st.fallingReceptacleMesh) {
      st.fallingReceptacleMesh.visible = false;
    }
    if (st.sovereignThrone) {
      st.sovereignThrone.group.visible = false;
    }
    if (st.purificationWaveMesh) {
      st.purificationWaveMesh.visible = false;
    }
    if (st.finaleMonumentGroup) {
      st.finaleMonumentGroup.visible = true;
    }
    if (st.skyPillarMesh) {
      (st.skyPillarMesh.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
    }
    if (st.restoredHeartMesh) {
      st.restoredHeartMesh.visible = true;
      (st.restoredHeartMesh.material as THREE.MeshBasicMaterial).color.setHex(0xfef08a);
    }

    syncOrbMeshesWithState(completedOrbs);
    setEndingChoice('NONE');
    setCutsceneStep(1);
    setCutsceneProgress(0);

    setPlayerStats((prev) => ({
      ...prev,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      oxygen: 100,
      arrows: 20,
      maxArrows: 20,
      equippedWeapon: 'SWORD',
      activePowers: completedOrbs.length,
      endingChoice: 'NONE',
    }));

    setWorldState((prev) => ({
      ...prev,
      orbsCollected: completedOrbs.length,
      totalOrbs: completedOrbs.length,
      enemyTier: 1 + completedOrbs.length,
      nearestOrbDistance: null,
      nearestOrbAngle: null,
      orbs: completedOrbs,
      boss: {
        ...prev.boss,
        active: false,
        defeated: true,
        hp: 0,
      },
    }));

    performSave(st.activeSlot);
    soundFX.init();
    soundFX.playCinematicChord(1, true);
    updateScreen('OUTRO_CUTSCENE');
  }, [exitLockSafe, performSave, syncOrbMeshesWithState, updateScreen]);

  const triggerDimensionalClashCutscene = useCallback(() => {
    const st = gameRef.current;
    exitLockSafe();

    const completedOrbs = (
      st.orbs.length > 0 ? st.orbs : generateInitialOrbs(st.activeSlot * 137)
    ).map((o) => ({
      ...o,
      collected: true,
    }));

    const centerGroundY = getTerrainHeight(0, 0);
    st.orbs = completedOrbs;
    st.playerPos.set(0, centerGroundY + 2.0, 14);
    st.playerVel.set(0, 0, 0);
    st.yaw = 0;
    st.pitch = 0.05;
    st.health = 100;
    st.stamina = 100;
    st.oxygen = 100;
    st.arrows = 20;
    st.equippedWeapon = 'SWORD';
    st.isDrawingBow = false;
    st.bowDrawProgress = 0;
    st.dashCooldownTimer = 0;
    st.novaCooldownTimer = 0;
    st.divineInvulnTimer = 0;
    st.endingChoice = 'SAVE_WORLD';
    st.isDimensionalClashActive = true;
    st.timeOfDay = 15.0;
    st.keys = {};
    st.cutsceneStepTimer = 0;
    st.cutsceneStepIndex = 0;

    if (st.bossInstance) {
      st.bossInstance.active = false;
      st.bossInstance.defeated = false;
      st.bossInstance.maxHp = 2400;
      st.bossInstance.hp = 2400;
      st.bossInstance.group.visible = false;
    }
    if (st.fallingReceptacleMesh) {
      st.fallingReceptacleMesh.visible = false;
    }
    if (st.sovereignThrone) {
      st.sovereignThrone.group.visible = true;
      st.sovereignThrone.group.position.set(0, centerGroundY, 0);
    }
    if (st.purificationWaveMesh) {
      st.purificationWaveMesh.visible = true;
      st.purificationWaveMesh.position.set(0, centerGroundY + 1.5, 0);
      st.purificationWaveMesh.scale.set(1, 1, 1);
      (st.purificationWaveMesh.material as THREE.MeshBasicMaterial).color.setHex(0xc084fc);
    }
    if (st.finaleMonumentGroup) {
      st.finaleMonumentGroup.visible = true;
    }
    if (st.skyPillarMesh) {
      (st.skyPillarMesh.material as THREE.MeshBasicMaterial).color.setHex(0xe11d48);
    }
    if (st.restoredHeartMesh) {
      st.restoredHeartMesh.visible = true;
      (st.restoredHeartMesh.material as THREE.MeshBasicMaterial).color.setHex(0xfde047);
    }
    if (st.alterEgoHumanoid) {
      st.alterEgoHumanoid.group.visible = true;
      st.alterEgoHumanoid.group.position.set(0, centerGroundY + 1.2, 0);
      st.alterEgoHumanoid.group.rotation.set(0, Math.PI, 0);
    }

    st.enemyInstances.forEach((enemy) => {
      enemy.group.visible = false;
      enemy.alive = false;
    });

    syncOrbMeshesWithState(completedOrbs);
    setEndingChoice('SAVE_WORLD');
    setCutsceneStep(0);
    setCutsceneProgress(0);

    setPlayerStats((prev) => ({
      ...prev,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      oxygen: 100,
      arrows: 20,
      maxArrows: 20,
      equippedWeapon: 'SWORD',
      activePowers: completedOrbs.length,
      endingChoice: 'SAVE_WORLD',
    }));

    setWorldState((prev) => ({
      ...prev,
      orbsCollected: completedOrbs.length,
      totalOrbs: completedOrbs.length,
      enemyTier: 1 + completedOrbs.length,
      nearestOrbDistance: null,
      nearestOrbAngle: null,
      orbs: completedOrbs,
      boss: {
        ...prev.boss,
        name: "L'Autre Réalité - Souverain du Néant",
        active: false,
        defeated: false,
        hp: 2400,
        maxHp: 2400,
        phase: 1,
        isAlterEgo: true,
      },
    }));

    soundFX.init();
    soundFX.playNovaBlast();
    soundFX.playBossRoar();
    soundFX.playCinematicChord(0, true);
    updateScreen('CLASH_CUTSCENE');
  }, [exitLockSafe, syncOrbMeshesWithState, updateScreen]);

  const triggerCollapseBreakthrough = useCallback(() => {
    const st = gameRef.current;
    exitLockSafe();

    const cY = getTerrainHeight(0, 0);
    st.keys = {};
    st.isDrawingBow = false;
    st.bowDrawProgress = 0;
    st.attackTimer = 0;
    st.playerVel.set(0, 0, 0);
    st.playerPos.set(-1.4, cY + 1.2, 0);
    st.yaw = Math.PI;
    st.pitch = 0;
    st.isDimensionalClashActive = true;
    st.alterEgoPhase = 3;
    st.visualEffects = [];

    if (st.bossInstance) {
      st.bossInstance.hp = 0;
      st.bossInstance.active = false;
      st.bossInstance.defeated = false;
      st.bossInstance.position.set(1.4, cY, 0);
      st.bossInstance.group.position.set(1.4, cY, 0);
      st.bossInstance.group.visible = false;
    }

    if (st.alterEgoHumanoid) {
      st.alterEgoHumanoid.group.visible = true;
      st.alterEgoHumanoid.group.position.set(1.4, cY, 0);
      st.alterEgoHumanoid.group.rotation.set(0, Math.PI, 0);
      st.alterEgoHumanoid.group.scale.set(1.4, 1.4, 1.4);
    }

    st.enemyInstances.forEach((enemy) => {
      enemy.alive = false;
      enemy.group.visible = false;
    });

    setWorldState((prev) => ({
      ...prev,
      boss: {
        ...prev.boss,
        name: "L'Autre Réalité - Souverain du Néant",
        active: false,
        defeated: false,
        hp: 0,
        maxHp: 2400,
        phase: 3,
        isAlterEgo: true,
      },
    }));

    soundFX.init();
    soundFX.playVoidDimensionSeal();
    soundFX.playCinematicChord(2, true);
    showToast('COLLAPSE_BREAKTHROUGH : Les deux avatars refusent de disparaître et brisent le 4ème mur !');
    updateScreen('COLLAPSE_BREAKTHROUGH');
  }, [exitLockSafe, showToast, updateScreen]);

  const setupAlterEgoArena = useCallback(
    (targetPhase: 1 | 2 | 3) => {
      const st = gameRef.current;
      const completedOrbs = (
        st.orbs.length > 0 ? st.orbs : generateInitialOrbs(st.activeSlot * 137)
      ).map((o) => ({
        ...o,
        collected: true,
      }));

      const cY = getTerrainHeight(0, 0);
      const fightStartZ = 24;
      const fightStartY = getTerrainHeight(0, fightStartZ) + 2.0;

      st.orbs = completedOrbs;
      st.playerPos.set(0, fightStartY, fightStartZ);
      st.playerVel.set(0, 0, 0);
      st.yaw = 0;
      st.pitch = 0.05;
      st.health = 100;
      st.stamina = 100;
      st.oxygen = 100;
      st.arrows = 20;
      st.equippedWeapon = 'SWORD';
      st.isDrawingBow = false;
      st.bowDrawProgress = 0;
      st.dashCooldownTimer = 0;
      st.novaCooldownTimer = 0;
      st.divineInvulnTimer = 0;
      st.endingChoice = 'SAVE_WORLD';
      st.isDimensionalClashActive = true;
      st.alterEgoPhase = targetPhase;
      st.alterEgoDashCooldown = 1.2;
      st.alterEgoLightningCooldown = 1.5;
      st.alterEgoTeleportCooldown = 1.2;
      st.alterEgoComboStep = 0;
      st.timeOfDay = 15.0;
      st.keys = {};

      const maxHp = 2400;
      const targetHp =
        targetPhase === 1
          ? maxHp
          : targetPhase === 2
          ? Math.round(maxHp * 0.65)
          : Math.round(maxHp * 0.32);

      if (st.sovereignThrone) {
        st.sovereignThrone.group.visible = true;
        st.sovereignThrone.group.position.set(0, cY, 0);
      }
      if (st.finaleMonumentGroup) {
        st.finaleMonumentGroup.visible = true;
      }
      if (st.purificationWaveMesh) {
        st.purificationWaveMesh.visible = false;
      }
      if (st.fallingReceptacleMesh) {
        st.fallingReceptacleMesh.visible = false;
      }

      if (st.bossInstance) {
        st.bossInstance.active = true;
        st.bossInstance.defeated = false;
        st.bossInstance.maxHp = maxHp;
        st.bossInstance.hp = targetHp;
        st.bossInstance.position.set(0, cY, 0);
        st.bossInstance.group.position.set(0, cY, 0);
        st.bossInstance.group.visible = false;
        st.bossInstance.attackCooldown = 0.8;
        st.bossInstance.slamCooldown = 2.0;
      }

      if (st.alterEgoHumanoid) {
        st.alterEgoHumanoid.group.visible = true;
        st.alterEgoHumanoid.group.position.set(0, cY, 0);
        st.alterEgoHumanoid.group.scale.set(1.4, 1.4, 1.4);
      }

      st.enemyInstances.forEach((enemy) => {
        enemy.alive = false;
        enemy.group.visible = false;
      });

      syncOrbMeshesWithState(completedOrbs);
      setEndingChoice('SAVE_WORLD');

      setPlayerStats((prev) => ({
        ...prev,
        health: 100,
        stamina: 100,
        oxygen: 100,
        arrows: 20,
        equippedWeapon: 'SWORD',
        activePowersCount: completedOrbs.length,
        endingChoice: 'SAVE_WORLD',
      }));

      setWorldState((prev) => ({
        ...prev,
        orbsCollected: completedOrbs.length,
        totalOrbs: completedOrbs.length,
        enemyTier: 1 + completedOrbs.length,
        orbs: completedOrbs,
        boss: {
          ...prev.boss,
          name: "L'Autre Réalité - Souverain du Néant",
          active: true,
          defeated: false,
          hp: targetHp,
          maxHp,
          phase: targetPhase,
          isAlterEgo: true,
        },
      }));

      soundFX.init();
      soundFX.playBossRoar();
      updateScreen('PLAYING');
      requestLockSafe();
    },
    [requestLockSafe, syncOrbMeshesWithState, updateScreen]
  );

  const handleSpawnBossPhase1 = useCallback(() => {
    setupAlterEgoArena(1);
    showToast("BOSS FINAL (PHASE 1) : L'Autre Réalité - Souverain du Néant !");
  }, [setupAlterEgoArena, showToast]);

  const handleForceBossPhase2 = useCallback(() => {
    setupAlterEgoArena(2);
    showToast("BOSS FINAL (PHASE 2) : L'Autre Réalité - Tempête Écarlate !");
  }, [setupAlterEgoArena, showToast]);

  const handleForceBossPhase3 = useCallback(() => {
    setupAlterEgoArena(3);
    showToast("BOSS FINAL (PHASE 3) : L'Autre Réalité - Frénésie Totale & Glitch !");
  }, [setupAlterEgoArena, showToast]);

  const handleForceBossZeroHp = useCallback(() => {
    triggerCollapseBreakthrough();
  }, [triggerCollapseBreakthrough]);

  const handleSimulateBadEndingCompleted = useCallback(() => {
    const nextState = SaveManager.setBadEndingCompleted(true);
    setProgressionState(nextState);
    showToast('DEBUG : Sauvegarde Mauvaise Fin validée (badEndingCompleted = true)');
  }, [showToast]);

  const handleTestDimensionalClash = useCallback(() => {
    const nextState = SaveManager.setBadEndingCompleted(true);
    setProgressionState(nextState);
    triggerDimensionalClashCutscene();
  }, [triggerDimensionalClashCutscene]);

  const handleResetAllSaves = useCallback(() => {
    const resetProgression = SaveManager.resetAllSaves();
    setProgressionState(resetProgression);
    for (let i = 1; i <= 3; i++) {
      deleteSaveSlot(i);
    }
    setSaves(getAllSaves());
    gameRef.current.isDimensionalClashActive = false;
    gameRef.current.alterEgoPhase = 1;
    if (gameRef.current.alterEgoHumanoid) {
      gameRef.current.alterEgoHumanoid.group.visible = false;
    }
    showToast('DEBUG : Toutes les sauvegardes et flags multiversels ont été réinitialisés.');
  }, [showToast]);

  const triggerGameOver = useCallback(() => {
    const st = gameRef.current;
    if (st.screen === 'GAME_OVER') return;
    st.health = 0;
    st.keys = {};
    st.isDrawingBow = false;
    st.bowDrawProgress = 0;
    st.attackTimer = 0;
    st.playerVel.set(0, 0, 0);

    setPlayerStats((prev) => ({
      ...prev,
      health: 0,
      isAttacking: false,
      isDrawingBow: false,
      isSprinting: false,
    }));

    exitLockSafe();
    soundFX.init();
    soundFX.playPlayerHurt();
    soundFX.playCinematicChord(0, true);
    updateScreen('GAME_OVER');
  }, [exitLockSafe, updateScreen]);

  const handleRetryGameOver = useCallback(() => {
    const st = gameRef.current;
    st.health = 100;
    st.stamina = 100;
    st.oxygen = 100;
    st.dashCooldownTimer = 0;
    st.novaCooldownTimer = 0;
    st.divineInvulnTimer = 1.8;
    st.keys = {};
    st.isDrawingBow = false;
    st.bowDrawProgress = 0;
    st.attackTimer = 0;
    st.playerVel.set(0, 0, 0);

    if (st.isDimensionalClashActive) {
      const fightStartZ = 24;
      st.playerPos.set(0, getTerrainHeight(0, fightStartZ) + 2.0, fightStartZ);
      st.yaw = 0;
      st.pitch = 0.05;
      st.alterEgoPhase = 1;
      st.alterEgoDashCooldown = 1.4;
      st.alterEgoLightningCooldown = 2.0;
      st.alterEgoTeleportCooldown = 1.5;
      st.alterEgoComboStep = 0;
      if (st.bossInstance) {
        const cY = getTerrainHeight(0, 0);
        st.bossInstance.active = true;
        st.bossInstance.defeated = false;
        st.bossInstance.maxHp = 2400;
        st.bossInstance.hp = 2400;
        st.bossInstance.position.set(0, cY, 0);
        st.bossInstance.group.position.set(0, cY, 0);
        st.bossInstance.group.visible = false;
      }
      if (st.alterEgoHumanoid) {
        const cY = getTerrainHeight(0, 0);
        st.alterEgoHumanoid.group.visible = true;
        st.alterEgoHumanoid.group.position.set(0, cY, 0);
        st.alterEgoHumanoid.group.scale.set(1.4, 1.4, 1.4);
      }
    } else if (st.bossInstance && st.bossInstance.active && !st.bossInstance.defeated) {
      const fightStartZ = 34;
      st.playerPos.set(0, getTerrainHeight(0, fightStartZ) + 2.0, fightStartZ);
      st.yaw = 0;
      st.pitch = 0.05;
      const cY = getTerrainHeight(0, 0);
      st.bossInstance.hp = st.bossInstance.maxHp;
      st.bossInstance.position.set(0, cY, 0);
      st.bossInstance.group.position.set(0, cY, 0);
      st.bossInstance.group.visible = true;
    } else if (st.endingChoice !== 'NONE') {
      const spawnZ = 18;
      st.playerPos.set(0, getTerrainHeight(0, spawnZ) + 2.0, spawnZ);
      st.yaw = 0;
      st.pitch = 0.05;
      respawnEnemiesAndLoot();
    } else {
      st.playerPos.set(0, getTerrainHeight(0, 0) + 2.0, 0);
      st.yaw = 0;
      st.pitch = -0.05;
      respawnEnemiesAndLoot();
    }

    setPlayerStats((prev) => ({
      ...prev,
      health: 100,
      stamina: 100,
      oxygen: 100,
      isAttacking: false,
      isDrawingBow: false,
      isSprinting: false,
    }));

    soundFX.init();
    soundFX.playTimeShift();
    updateScreen('PLAYING');
    requestLockSafe();
  }, [requestLockSafe, respawnEnemiesAndLoot, updateScreen]);

  const handleForceGameOver = useCallback(() => {
    triggerGameOver();
  }, [triggerGameOver]);

  const handleSelectEndingChoice = useCallback(
    (choice: 'SAVE_WORLD' | 'RULE_WORLD') => {
      const st = gameRef.current;
      st.endingChoice = choice;
      setEndingChoice(choice);

      const centerGroundY = getTerrainHeight(0, 0);

      if (choice === 'SAVE_WORLD') {
        const updatedProgression = SaveManager.setGoodEndingCompleted(true);
        setProgressionState(updatedProgression);

        if (SaveManager.isBadEndingCompleted()) {
          performSave(st.activeSlot);
          triggerDimensionalClashCutscene();
          return;
        }

        st.isDimensionalClashActive = false;
        st.timeOfDay = 11.2;
        soundFX.playNovaBlast();
        soundFX.playTimeShift();

        if (st.sovereignThrone) {
          st.sovereignThrone.group.visible = false;
        }
        if (st.skyPillarMesh) {
          (st.skyPillarMesh.material as THREE.MeshBasicMaterial).color.setHex(0xfef08a);
        }
        if (st.restoredHeartMesh) {
          st.restoredHeartMesh.visible = true;
          (st.restoredHeartMesh.material as THREE.MeshBasicMaterial).color.setHex(0xfef08a);
        }

        st.enemyInstances.forEach((enemy, idx) => {
          enemy.setHumanSurvivorMode(false);
          enemy.setSpacetimeDemonMode(true);
          if (idx < 12) {
            const angle = (idx / 12) * Math.PI * 2;
            const radius = 14 + (idx % 2) * 5;
            const ex = Math.cos(angle) * radius;
            const ez = Math.sin(angle) * radius;
            const ey = getTerrainHeight(ex, ez);
            enemy.position.set(ex, ey, ez);
            enemy.group.position.set(ex, ey, ez);
            enemy.group.scale.set(1.3, 1.3, 1.3);
            enemy.group.rotation.y = Math.atan2(-ex, -ez);
            enemy.group.visible = true;
            enemy.hpBarGroup.visible = false;
          } else {
            enemy.group.visible = false;
          }
          enemy.alive = false;
        });

        if (st.purificationWaveMesh) {
          st.purificationWaveMesh.visible = true;
          st.purificationWaveMesh.position.set(0, centerGroundY + 1.5, 0);
          st.purificationWaveMesh.scale.set(1, 1, 1);
          (st.purificationWaveMesh.material as THREE.MeshBasicMaterial).color.setHex(0xfde047);
        }
      } else {
        const updatedProgression = SaveManager.setBadEndingCompleted(true);
        setProgressionState(updatedProgression);
        st.isDimensionalClashActive = false;
        st.timeOfDay = 18.6;
        soundFX.playBossRoar();
        soundFX.playLightningDash();

        if (st.sovereignThrone) {
          st.sovereignThrone.group.visible = true;
          st.sovereignThrone.group.position.set(0, centerGroundY, 0);
        }
        if (st.purificationWaveMesh) {
          st.purificationWaveMesh.visible = false;
        }
        if (st.skyPillarMesh) {
          (st.skyPillarMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e);
        }
        if (st.restoredHeartMesh) {
          st.restoredHeartMesh.visible = true;
          (st.restoredHeartMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e);
        }

        st.enemyInstances.forEach((enemy, idx) => {
          enemy.setHumanSurvivorMode(true);
          if (idx < 8) {
            const side = idx % 2 === 0 ? -1 : 1;
            const row = Math.floor(idx / 2);
            const ex = side * (5.5 + row * 1.5);
            const ez = 8 + row * 4.0;
            const ey = getTerrainHeight(ex, ez);
            enemy.position.set(ex, ey, ez);
            enemy.group.position.set(ex, ey, ez);
            enemy.group.scale.set(1.2, 1.2, 1.2);
            enemy.group.rotation.y = Math.atan2(ex, ez);
            enemy.bodyPivot.rotation.x = 0.45;
            enemy.group.visible = true;
            enemy.hpBarGroup.visible = false;
          } else {
            enemy.group.visible = false;
          }
        });
      }

      st.cutsceneStepIndex = 2;
      st.cutsceneStepTimer = 0;
      setCutsceneStep(2);
      setCutsceneProgress(0);
      soundFX.playCinematicChord(2, true);
      performSave(st.activeSlot);
    },
    [performSave, triggerDimensionalClashCutscene]
  );

  const handleStartNewGame = useCallback(
    (slotId: number) => {
      const freshOrbs = generateInitialOrbs(slotId * 137);
      const startY = getTerrainHeight(0, 0) + 2.0;

      gameRef.current.activeSlot = slotId;
      gameRef.current.orbs = freshOrbs;
      gameRef.current.playerPos.set(0, startY, 0);
      gameRef.current.playerVel.set(0, 0, 0);
      gameRef.current.yaw = 0;
      gameRef.current.pitch = -0.05;
      gameRef.current.health = 100;
      gameRef.current.stamina = 100;
      gameRef.current.oxygen = 100;
      gameRef.current.arrows = 12;
      gameRef.current.equippedWeapon = 'SWORD';
      gameRef.current.isDrawingBow = false;
      gameRef.current.bowDrawProgress = 0;
      gameRef.current.dashCooldownTimer = 0;
      gameRef.current.novaCooldownTimer = 0;
      gameRef.current.divineInvulnTimer = 0;
      gameRef.current.endingChoice = 'NONE';
      gameRef.current.isDimensionalClashActive = false;
      gameRef.current.alterEgoPhase = 1;
      gameRef.current.timeOfDay = 8.5;
      gameRef.current.keys = {};
      gameRef.current.cutsceneStepTimer = 0;
      gameRef.current.cutsceneStepIndex = 0;

      if (gameRef.current.finaleMonumentGroup) {
        gameRef.current.finaleMonumentGroup.visible = false;
      }
      if (gameRef.current.sovereignThrone) {
        gameRef.current.sovereignThrone.group.visible = false;
      }
      if (gameRef.current.purificationWaveMesh) {
        gameRef.current.purificationWaveMesh.visible = false;
      }
      if (gameRef.current.fallingReceptacleMesh) {
        gameRef.current.fallingReceptacleMesh.visible = false;
      }
      if (gameRef.current.alterEgoHumanoid) {
        gameRef.current.alterEgoHumanoid.group.visible = false;
      }
      if (gameRef.current.bossInstance) {
        gameRef.current.bossInstance.active = false;
        gameRef.current.bossInstance.defeated = false;
        gameRef.current.bossInstance.maxHp = 1200;
        gameRef.current.bossInstance.hp = 1200;
        gameRef.current.bossInstance.group.visible = false;
      }

      syncOrbMeshesWithState(freshOrbs);
      respawnEnemiesAndLoot();
      setActiveSlot(slotId);
      setEndingChoice('NONE');
      setCutsceneStep(0);
      setCutsceneProgress(0);

      setWorldState((prev) => ({
        ...prev,
        orbsCollected: 0,
        totalOrbs: freshOrbs.length,
        timeOfDay: 8.5,
        enemyTier: 1,
        nearestOrbDistance: null,
        nearestOrbAngle: null,
        orbs: freshOrbs,
        boss: {
          ...prev.boss,
          name: 'Malakor, Titan du Néant',
          active: false,
          defeated: false,
          hp: 1200,
          maxHp: 1200,
          phase: 1,
          isAlterEgo: false,
        },
      }));

      performSave(slotId);
      soundFX.init();
      soundFX.playCinematicChord(0, false);
      updateScreen('INTRO_CUTSCENE');
    },
    [performSave, respawnEnemiesAndLoot, syncOrbMeshesWithState, updateScreen]
  );

  const finishCutscene = useCallback(() => {
    const st = gameRef.current;
    const currentScreen = st.screen;
    st.keys = {};

    if (st.cameraRef) {
      st.cameraRef.up.set(0, 1, 0);
    }

    if (currentScreen === 'INTRO_CUTSCENE') {
      const firstOrb = st.orbs[0];
      if (firstOrb) {
        const dx = firstOrb.x - st.playerPos.x;
        const dz = firstOrb.z - st.playerPos.z;
        st.yaw = Math.atan2(-dx, -dz);
      }
      st.pitch = -0.05;
      updateScreen('PLAYING');
      requestLockSafe();
    } else if (currentScreen === 'BOSS_CUTSCENE') {
      const fightStartZ = 34;
      const fightStartY = getTerrainHeight(0, fightStartZ) + 2.0;
      st.playerPos.set(0, fightStartY, fightStartZ);
      st.playerVel.set(0, 0, 0);
      st.yaw = 0;
      st.pitch = 0.05;

      if (st.fallingReceptacleMesh) {
        st.fallingReceptacleMesh.visible = false;
      }
      if (st.restoredHeartMesh) {
        st.restoredHeartMesh.visible = false;
      }
      if (st.bossInstance) {
        const cY = getTerrainHeight(0, 0);
        st.bossInstance.active = true;
        st.bossInstance.defeated = false;
        st.bossInstance.position.set(0, cY, 0);
        st.bossInstance.group.position.set(0, cY, 0);
        st.bossInstance.group.visible = true;
      }

      performSave(st.activeSlot);
      showToast('COMBAT DE BOSS : Terrassez Malakor pour récupérer le Réceptacle !');
      updateScreen('PLAYING');
      requestLockSafe();
    } else if (currentScreen === 'CLASH_CUTSCENE') {
      if (st.purificationWaveMesh) {
        st.purificationWaveMesh.visible = false;
      }
      if (st.sovereignThrone) {
        st.sovereignThrone.group.visible = true;
      }
      if (st.finaleMonumentGroup) {
        st.finaleMonumentGroup.visible = true;
      }

      respawnEnemiesAndLoot();

      const fightStartZ = 24;
      const fightStartY = getTerrainHeight(0, fightStartZ) + 2.0;
      st.playerPos.set(0, fightStartY, fightStartZ);
      st.playerVel.set(0, 0, 0);
      st.yaw = 0;
      st.pitch = 0.05;
      st.health = 100;
      st.stamina = 100;
      st.oxygen = 100;
      st.dashCooldownTimer = 0;
      st.novaCooldownTimer = 0;
      st.isDimensionalClashActive = true;
      st.alterEgoPhase = 1;
      st.alterEgoDashCooldown = 1.4;
      st.alterEgoLightningCooldown = 2.0;
      st.alterEgoTeleportCooldown = 1.5;
      st.alterEgoComboStep = 0;

      if (st.bossInstance) {
        const cY = getTerrainHeight(0, 0);
        st.bossInstance.active = true;
        st.bossInstance.defeated = false;
        st.bossInstance.maxHp = 2400;
        st.bossInstance.hp = 2400;
        st.bossInstance.position.set(0, cY, 0);
        st.bossInstance.group.position.set(0, cY, 0);
        st.bossInstance.group.visible = false;
      }

      if (st.alterEgoHumanoid) {
        const cY = getTerrainHeight(0, 0);
        st.alterEgoHumanoid.group.visible = true;
        st.alterEgoHumanoid.group.position.set(0, cY, 0);
        st.alterEgoHumanoid.group.scale.set(1.4, 1.4, 1.4);
      }

      st.enemyInstances.forEach((enemy) => {
        enemy.alive = false;
        enemy.group.visible = false;
      });

      performSave(st.activeSlot);
      showToast("COLLISION MULTIVERSELLE : Affrontez L'Autre Réalité - Souverain du Néant !");
      updateScreen('PLAYING');
      requestLockSafe();
    } else if (currentScreen === 'OUTRO_CUTSCENE') {
      if (st.purificationWaveMesh) {
        st.purificationWaveMesh.visible = false;
      }

      respawnEnemiesAndLoot();

      const centerH = getTerrainHeight(0, 18) + 2.0;
      st.playerPos.set(0, centerH, 18);
      st.playerVel.set(0, 0, 0);
      st.yaw = 0;
      st.pitch = 0.05;
      st.health = 100;
      st.stamina = 100;
      st.oxygen = 100;
      st.dashCooldownTimer = 0;
      st.novaCooldownTimer = 0;

      if (st.endingChoice === 'RULE_WORLD') {
        const updatedProgression = SaveManager.setBadEndingCompleted(true);
        setProgressionState(updatedProgression);
        if (st.sovereignThrone) {
          st.sovereignThrone.group.visible = true;
        }
        performSave(st.activeSlot);
        showToast('SOUVERAIN DU NÉANT : Tous vos pouvoirs abyssaux sont débloqués !');
        updateScreen('PLAYING');
        requestLockSafe();
      } else {
        const updatedProgression = SaveManager.setGoodEndingCompleted(true);
        setProgressionState(updatedProgression);
        st.pitch = 0.15;
        exitLockSafe();
        updateScreen('VICTORY');
      }
    }
  }, [exitLockSafe, performSave, requestLockSafe, respawnEnemiesAndLoot, showToast, updateScreen]);

  const handleNextCutsceneStep = useCallback(() => {
    const scr = gameRef.current.screen;
    const slides =
      scr === 'INTRO_CUTSCENE'
        ? INTRO_SLIDES
        : scr === 'BOSS_CUTSCENE'
        ? BOSS_SLIDES
        : scr === 'CLASH_CUTSCENE'
        ? CLASH_SLIDES
        : OUTRO_SLIDES;
    const nextIdx = gameRef.current.cutsceneStepIndex + 1;

    if (
      scr === 'OUTRO_CUTSCENE' &&
      gameRef.current.cutsceneStepIndex === 1 &&
      gameRef.current.endingChoice === 'NONE'
    ) {
      return;
    }

    if (nextIdx >= slides.length) {
      finishCutscene();
    } else {
      gameRef.current.cutsceneStepIndex = nextIdx;
      gameRef.current.cutsceneStepTimer = 0;
      setCutsceneStep(nextIdx);
      setCutsceneProgress(0);
      if ((scr === 'BOSS_CUTSCENE' || scr === 'CLASH_CUTSCENE') && nextIdx === 1) {
        soundFX.playBossRoar();
      } else {
        soundFX.playCinematicChord(nextIdx, scr === 'OUTRO_CUTSCENE' || scr === 'CLASH_CUTSCENE');
      }
    }
  }, [finishCutscene]);

  const handlePrevCutsceneStep = useCallback(() => {
    const prevIdx = Math.max(0, gameRef.current.cutsceneStepIndex - 1);
    gameRef.current.cutsceneStepIndex = prevIdx;
    gameRef.current.cutsceneStepTimer = 0;
    setCutsceneStep(prevIdx);
    setCutsceneProgress(0);
  }, []);

  const handleLoadGame = useCallback(
    (slot: SaveSlotData) => {
      const loadedOrbs = slot.orbs.map((o) => ({ ...o }));
      const collectedCount = loadedOrbs.filter((o) => o.collected).length;

      gameRef.current.activeSlot = slot.slotId;
      gameRef.current.orbs = loadedOrbs;
      gameRef.current.playerPos.set(
        slot.playerPos.x,
        slot.playerPos.y,
        slot.playerPos.z
      );
      gameRef.current.playerVel.set(0, 0, 0);
      gameRef.current.yaw = slot.yaw || 0;
      gameRef.current.pitch = Math.max(-1.4, Math.min(1.4, slot.pitch || -0.05));
      gameRef.current.cameraMode = slot.cameraMode;
      gameRef.current.timeOfDay = slot.timeOfDay;
      gameRef.current.health = slot.health ?? 100;
      gameRef.current.arrows = slot.arrows ?? 12;
      gameRef.current.equippedWeapon = slot.equippedWeapon ?? 'SWORD';
      gameRef.current.endingChoice = slot.endingChoice ?? 'NONE';
      gameRef.current.isDrawingBow = false;
      gameRef.current.bowDrawProgress = 0;
      gameRef.current.stamina = 100;
      gameRef.current.oxygen = 100;
      gameRef.current.keys = {};

      setEndingChoice(slot.endingChoice ?? 'NONE');
      syncOrbMeshesWithState(loadedOrbs);
      respawnEnemiesAndLoot();
      setActiveSlot(slot.slotId);

      const isBossActive =
        slot.bossActive ?? (collectedCount === loadedOrbs.length && !slot.bossDefeated);
      const isBossDefeated = slot.bossDefeated ?? false;

      if (gameRef.current.bossInstance) {
        const cY = getTerrainHeight(0, 0);
        gameRef.current.bossInstance.active = isBossActive;
        gameRef.current.bossInstance.defeated = isBossDefeated;
        gameRef.current.bossInstance.hp = slot.bossHp ?? 1200;
        gameRef.current.bossInstance.position.set(0, cY, 0);
        gameRef.current.bossInstance.group.position.set(0, cY, 0);
        gameRef.current.bossInstance.group.visible = isBossActive && !isBossDefeated;
      }

      if (gameRef.current.sovereignThrone) {
        gameRef.current.sovereignThrone.group.visible =
          slot.endingChoice === 'RULE_WORLD';
      }

      if (gameRef.current.finaleMonumentGroup) {
        gameRef.current.finaleMonumentGroup.visible =
          collectedCount === loadedOrbs.length;
      }

      setWorldState((prev) => ({
        ...prev,
        orbsCollected: collectedCount,
        totalOrbs: loadedOrbs.length,
        timeOfDay: slot.timeOfDay,
        enemyTier: 1 + collectedCount,
        nearestOrbDistance: null,
        nearestOrbAngle: null,
        orbs: loadedOrbs,
        boss: {
          ...prev.boss,
          active: isBossActive,
          defeated: isBossDefeated,
          hp: slot.bossHp ?? 1200,
        },
      }));

      updateScreen('PLAYING');
      requestLockSafe();
    },
    [requestLockSafe, respawnEnemiesAndLoot, syncOrbMeshesWithState, updateScreen]
  );

  const handleDeleteSave = useCallback((slotId: number) => {
    deleteSaveSlot(slotId);
    setSaves(getAllSaves());
  }, []);

  const handleResumeGame = useCallback(() => {
    gameRef.current.keys = {};
    if (gameRef.current.endingChoice === 'RULE_WORLD') {
      respawnEnemiesAndLoot();
      showToast('Post-Game : Vos Pouvoirs du Néant sont éveillés ! Les Survivants Humains attaquent !');
    } else if (gameRef.current.endingChoice === 'SAVE_WORLD') {
      respawnEnemiesAndLoot();
      showToast('Transcendance Céleste : Saut Divin [R], Firmament [T] & Jugement du Cosmos [G] débloqués !');
    }
    updateScreen('PLAYING');
    requestLockSafe();
  }, [requestLockSafe, respawnEnemiesAndLoot, showToast, updateScreen]);

  const handleOpenPauseMenu = useCallback(() => {
    exitLockSafe();
    gameRef.current.keys = {};
    gameRef.current.isDrawingBow = false;
    gameRef.current.bowDrawProgress = 0;
    updateScreen('PAUSED');
  }, [exitLockSafe, updateScreen]);

  const handleReturnToMainMenu = useCallback(() => {
    performSave(gameRef.current.activeSlot);
    exitLockSafe();
    gameRef.current.keys = {};
    gameRef.current.isDrawingBow = false;
    gameRef.current.bowDrawProgress = 0;
    updateScreen('MAIN_MENU');
  }, [exitLockSafe, performSave, updateScreen]);

  const handleToggleCamera = useCallback(() => {
    const nextMode =
      gameRef.current.cameraMode === 'FIRST_PERSON'
        ? 'THIRD_PERSON'
        : 'FIRST_PERSON';
    gameRef.current.cameraMode = nextMode;
    setPlayerStats((prev) => ({ ...prev, cameraMode: nextMode }));
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFX.enabled = next;
      return next;
    });
  }, []);

  const triggerLightningDash = useCallback(() => {
    const st = gameRef.current;
    const powers = getActivePowersCount();
    if (st.screen !== 'PLAYING' || powers < 1 || st.dashCooldownTimer > 0) return;

    const scene = st.sceneRef;
    if (!scene) return;

    const isCorrupted = st.endingChoice === 'RULE_WORLD';
    const isTranscendent = st.endingChoice === 'SAVE_WORLD';
    const maxCd = isTranscendent ? 0.65 : isCorrupted ? 0.85 : powers >= 9 ? 1.2 : 2.5;
    st.dashCooldownTimer = maxCd;
    soundFX.playLightningDash();

    const startPos = st.playerPos.clone();
    const dashDir = new THREE.Vector3(
      -Math.sin(st.yaw),
      0,
      -Math.cos(st.yaw)
    ).normalize();

    const dashDistance = isTranscendent ? 28 : isCorrupted ? 24 : 16;
    const endPos = startPos.clone().addScaledVector(dashDir, dashDistance);
    const maxCoord = WORLD_SIZE / 2 - 15;
    endPos.x = Math.max(-maxCoord, Math.min(maxCoord, endPos.x));
    endPos.z = Math.max(-maxCoord, Math.min(maxCoord, endPos.z));
    endPos.y = Math.max(
      getTerrainHeight(endPos.x, endPos.z) + 2.0,
      startPos.y + Math.sin(st.pitch) * (isTranscendent || isCorrupted ? 9 : 5)
    );

    st.playerPos.copy(endPos);
    st.playerVel.set(dashDir.x * 12, 2.0, dashDir.z * 12);

    if (isTranscendent) {
      const constellationGroup = new THREE.Group();
      const starNodes: THREE.Vector3[] = [];
      const nodeCount = 12;
      const starMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const nodeGeo = new THREE.OctahedronGeometry(0.24, 0);

      for (let i = 0; i <= nodeCount; i++) {
        const t = i / nodeCount;
        const pt = new THREE.Vector3().lerpVectors(startPos, endPos, t);
        pt.y -= 0.4;
        if (i > 0 && i < nodeCount) {
          pt.x += (Math.random() - 0.5) * 2.2;
          pt.y += (Math.random() - 0.5) * 1.8;
          pt.z += (Math.random() - 0.5) * 2.2;
        }
        starNodes.push(pt);
        const starMesh = new THREE.Mesh(nodeGeo, starMat);
        starMesh.position.copy(pt);
        constellationGroup.add(starMesh);
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(starNodes);
      const constellationLine = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({
          color: 0x67e8f9,
          transparent: true,
          opacity: 0.95,
        })
      );
      constellationGroup.add(constellationLine);

      for (const pos of [startPos, endPos]) {
        const flashRing = new THREE.Mesh(
          new THREE.RingGeometry(0.4, 2.8, 24),
          new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        flashRing.position.copy(pos);
        flashRing.lookAt(pos.clone().add(dashDir));
        constellationGroup.add(flashRing);
      }

      scene.add(constellationGroup);
      st.visualEffects.push({
        mesh: constellationGroup,
        age: 0,
        maxAge: 0.75,
        type: 'CONSTELLATION_TRAIL',
      });
    } else {
      const boltCount = isCorrupted ? 4 : 1;
      for (let b = 0; b < boltCount; b++) {
        const boltPoints: THREE.Vector3[] = [];
        const segments = 9;
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const pt = new THREE.Vector3().lerpVectors(startPos, endPos, t);
          pt.y -= 0.5;
          if (i > 0 && i < segments) {
            const spread = isCorrupted ? 2.2 : 1.4;
            pt.x += (Math.random() - 0.5) * spread;
            pt.y += (Math.random() - 0.5) * spread;
            pt.z += (Math.random() - 0.5) * spread;
          }
          boltPoints.push(pt);
        }

        const boltGeo = new THREE.BufferGeometry().setFromPoints(boltPoints);
        const boltLine = new THREE.Line(
          boltGeo,
          new THREE.LineBasicMaterial({
            color: isCorrupted ? (b % 2 === 0 ? 0xf43f5e : 0xfef08a) : 0x38bdf8,
            linewidth: 3,
          })
        );
        scene.add(boltLine);
        st.visualEffects.push({
          mesh: boltLine,
          age: 0,
          maxAge: isCorrupted ? 0.48 : 0.35,
          type: 'LIGHTNING',
        });
      }
    }

    const dashDmg = isTranscendent ? 150 : isCorrupted ? 120 : powers >= 5 ? 65 : 45;
    st.enemyInstances.forEach((enemy) => {
      if (!enemy.alive) return;
      const d = enemy.position.distanceTo(endPos);
      const dStart = enemy.position.distanceTo(startPos);
      if (d < 7.0 || dStart < 6.0) {
        enemy.hp = Math.max(0, enemy.hp - dashDmg);
        enemy.velocity.x += dashDir.x * 16;
        enemy.velocity.z += dashDir.z * 16;
        enemy.hpBarFill.scale.x = Math.max(0.001, enemy.hp / enemy.maxHp);
        if (enemy.hp <= 0) {
          enemy.alive = false;
          enemy.group.visible = false;
          soundFX.playEnemyHit(true);
        }
      }
    });

    const boss = st.bossInstance;
    if (boss && boss.active && !boss.defeated) {
      if (
        boss.position.distanceTo(endPos) < 7.5 ||
        boss.position.distanceTo(startPos) < 7.5
      ) {
        if (st.isDimensionalClashActive && bossDamageHandlerRef.current) {
          bossDamageHandlerRef.current(dashDmg, dashDir.x, dashDir.z);
        } else {
          boss.hp = Math.max(0, boss.hp - dashDmg);
          soundFX.playEnemyHit(boss.hp <= 0);
          if (boss.hp <= 0) {
            boss.defeated = true;
            boss.active = false;
            boss.group.visible = false;
            showToast('MALAKOR VAINCU ! Le Réceptacle des 10 Orbes est libéré !');
            startOutroCutscene();
          }
        }
      }
    }
  }, [showToast, startOutroCutscene]);

  const triggerTimeShift = useCallback(() => {
    const st = gameRef.current;
    const powers = getActivePowersCount();
    if (st.screen !== 'PLAYING' || powers < 2) return;

    const scene = st.sceneRef;
    const isCorrupted = st.endingChoice === 'RULE_WORLD';
    const isTranscendent = st.endingChoice === 'SAVE_WORLD';

    if (isTranscendent) {
      st.timeOfDay = 11.2;
      st.health = 100;
      st.stamina = 100;
      st.oxygen = 100;
      st.divineInvulnTimer = 10.0;
      soundFX.playTimeShift();
      showToast('Firmament Divin : Aurore Cosmique active, PV/Endurance max & Invulnérabilité !');
      return;
    }

    if (isCorrupted && scene) {
      let targetEnemy: EnemyInstance3D | null = null;
      let minDist = 65;

      const lookDirX = -Math.sin(st.yaw);
      const lookDirZ = -Math.cos(st.yaw);

      st.enemyInstances.forEach((enemy) => {
        if (!enemy.alive) return;
        const dx = enemy.position.x - st.playerPos.x;
        const dz = enemy.position.z - st.playerPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < minDist) {
          const dot = (dx / Math.max(0.1, dist)) * lookDirX + (dz / Math.max(0.1, dist)) * lookDirZ;
          if (dot > 0.1 || dist < 18) {
            minDist = dist;
            targetEnemy = enemy;
          }
        }
      });

      const strikeX = targetEnemy
        ? (targetEnemy as EnemyInstance3D).position.x
        : st.playerPos.x + lookDirX * 16;
      const strikeZ = targetEnemy
        ? (targetEnemy as EnemyInstance3D).position.z
        : st.playerPos.z + lookDirZ * 16;
      const strikeY = getTerrainHeight(strikeX, strikeZ);

      const vortexEffect = createSkyVortexStrikeEffect(strikeX, strikeY, strikeZ);
      scene.add(vortexEffect);
      st.visualEffects.push({
        mesh: vortexEffect,
        age: 0,
        maxAge: 0.95,
        type: 'SKY_VORTEX',
      });

      soundFX.playBossSlam();
      soundFX.playLightningDash();

      let annihilatedCount = 0;
      st.enemyInstances.forEach((enemy) => {
        if (!enemy.alive) return;
        const d = Math.hypot(enemy.position.x - strikeX, enemy.position.z - strikeZ);
        if (d < 9.5) {
          enemy.hp = 0;
          enemy.alive = false;
          enemy.group.visible = false;
          annihilatedCount++;
        }
      });

      if (annihilatedCount > 0) {
        soundFX.playEnemyHit(true);
        showToast(`Vortex Céleste : ${annihilatedCount} Survivant(s) désintégré(s) par la foudre !`);
      } else {
        showToast('Vortex Céleste : La foudre du Néant frappe la terre !');
      }
      return;
    }

    const isDayNow = st.timeOfDay >= 6 && st.timeOfDay < 18;
    st.timeOfDay = isDayNow ? 22.5 : 10.5;
    soundFX.playTimeShift();
    showToast(
      isDayNow
        ? 'Pouvoir du Temps : Nuit Étoilée invoquée !'
        : 'Pouvoir du Temps : Aube Solaire invoquée !'
    );
  }, [showToast]);

  const triggerSolarNova = useCallback(() => {
    const st = gameRef.current;
    const powers = getActivePowersCount();
    if (st.screen !== 'PLAYING' || powers < 4 || st.novaCooldownTimer > 0) return;

    const scene = st.sceneRef;
    if (!scene) return;

    const isCorrupted = st.endingChoice === 'RULE_WORLD';
    const isTranscendent = st.endingChoice === 'SAVE_WORLD';
    const maxCd = isTranscendent ? 2.0 : isCorrupted ? 2.5 : powers >= 9 ? 3.0 : 6.0;
    st.novaCooldownTimer = maxCd;

    if (isTranscendent) {
      soundFX.playNovaBlast();
      soundFX.playTimeShift();

      const supernovaGroup = new THREE.Group();
      supernovaGroup.position.set(
        st.playerPos.x,
        st.playerPos.y - 0.5,
        st.playerPos.z
      );

      const coreSphere = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 24, 24),
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      supernovaGroup.add(coreSphere);

      const nebulaWave = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 3.8, 32),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      nebulaWave.rotation.x = -Math.PI / 2;
      supernovaGroup.add(nebulaWave);

      scene.add(supernovaGroup);
      st.visualEffects.push({
        mesh: supernovaGroup,
        age: 0,
        maxAge: 0.9,
        type: 'SUPERNOVA',
      });

      let disintegrated = 0;
      st.enemyInstances.forEach((enemy) => {
        if (!enemy.alive) return;
        const dist = Math.hypot(
          enemy.position.x - st.playerPos.x,
          enemy.position.z - st.playerPos.z
        );
        if (dist < 25.0) {
          disintegrated++;
          enemy.hp = 0;
          enemy.alive = false;
          enemy.group.visible = false;
        }
      });

      if (disintegrated > 0) {
        soundFX.playEnemyHit(true);
        showToast(`Jugement du Cosmos : ${disintegrated} cible(s) désintégrée(s) en poussière d’or !`);
      } else {
        showToast('Jugement du Cosmos : Supernova Céleste déchaînée !');
      }
      return;
    }

    if (isCorrupted) {
      soundFX.playBossSlam();
      soundFX.playNovaBlast();

      const riftEffect = createRealityRiftEffect(
        st.playerPos.x,
        getTerrainHeight(st.playerPos.x, st.playerPos.z),
        st.playerPos.z
      );
      scene.add(riftEffect);
      st.visualEffects.push({
        mesh: riftEffect,
        age: 0,
        maxAge: 0.85,
        type: 'REALITY_RIFT',
      });

      let annihilated = 0;
      st.enemyInstances.forEach((enemy) => {
        if (!enemy.alive) return;
        const dist = Math.hypot(
          enemy.position.x - st.playerPos.x,
          enemy.position.z - st.playerPos.z
        );
        if (dist < 22.0) {
          annihilated++;
          enemy.hp = 0;
          enemy.alive = false;
          enemy.group.visible = false;
        }
      });

      if (annihilated > 0) {
        soundFX.playEnemyHit(true);
        showToast(`Fissure de la Réalité : ${annihilated} Survivant(s) annihilé(s) !`);
      } else {
        showToast('Fissure de la Réalité : L’espace-temps se brise sous votre volonté !');
      }
      return;
    }

    soundFX.playNovaBlast();

    const ringGeo = new THREE.RingGeometry(0.8, 2.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(
      st.playerPos.x,
      st.playerPos.y - 1.5,
      st.playerPos.z
    );
    scene.add(ringMesh);
    st.visualEffects.push({
      mesh: ringMesh,
      age: 0,
      maxAge: 0.55,
      type: 'NOVA_RING',
    });

    const novaDamage = 95 + powers * 10;
    let hitCount = 0;
    st.enemyInstances.forEach((enemy) => {
      if (!enemy.alive) return;
      const dx = enemy.position.x - st.playerPos.x;
      const dz = enemy.position.z - st.playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 15.0) {
        hitCount++;
        const inv = 1 / Math.max(0.1, dist);
        enemy.hp = Math.max(0, enemy.hp - novaDamage);
        enemy.velocity.x += dx * inv * 22;
        enemy.velocity.z += dz * inv * 22;
        enemy.hpBarFill.scale.x = Math.max(0.001, enemy.hp / enemy.maxHp);
        if (enemy.hp <= 0) {
          enemy.alive = false;
          enemy.group.visible = false;
        }
      }
    });

    const boss = st.bossInstance;
    if (boss && boss.active && !boss.defeated) {
      const distBoss = Math.hypot(
        boss.position.x - st.playerPos.x,
        boss.position.z - st.playerPos.z
      );
      if (distBoss < 17.0) {
        hitCount++;
        if (st.isDimensionalClashActive && bossDamageHandlerRef.current) {
          bossDamageHandlerRef.current(novaDamage, 0, 0);
        } else {
          boss.hp = Math.max(0, boss.hp - novaDamage);
          if (boss.hp <= 0) {
            boss.defeated = true;
            boss.active = false;
            boss.group.visible = false;
            soundFX.playEnemyHit(true);
            showToast('MALAKOR VAINCU ! Le Réceptacle des 10 Orbes est libéré !');
            startOutroCutscene();
            return;
          }
        }
      }
    }

    if (hitCount > 0) {
      soundFX.playEnemyHit(true);
      showToast(`Nova Solaire : ${hitCount} cible(s) foudroyée(s) !`);
    }
  }, [showToast, startOutroCutscene]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // ============================================================================
    // 1. ARCHITECTURE & RENDU THREE.JS
    // ============================================================================
    const scene = new THREE.Scene();
    gameRef.current.sceneRef = scene;

    const skyColor = new THREE.Color(0x87ceeb);
    scene.background = skyColor;

    const fog = new THREE.FogExp2(0x87ceeb, 0.0024);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      950
    );
    camera.up.set(0, 1, 0);
    camera.rotation.order = 'YXZ';
    scene.add(camera);
    gameRef.current.cameraRef = camera;

    const fpViewModel = createFirstPersonViewModel();
    camera.add(fpViewModel.group);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.55);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.45);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 450;
    const shadowBounds = 165;
    sunLight.shadow.camera.left = -shadowBounds;
    sunLight.shadow.camera.right = shadowBounds;
    sunLight.shadow.camera.top = shadowBounds;
    sunLight.shadow.camera.bottom = -shadowBounds;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    scene.add(sunLight.target);

    const sunSphere = new THREE.Mesh(
      new THREE.SphereGeometry(12, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    scene.add(sunSphere);

    const starsGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.15);
      const r = 460;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // ============================================================================
    // 2. GÉNÉRATION DE L'OPEN WORLD + COLLIDERS (Arbres & Rochers)
    // ============================================================================
    const segments = 220;
    const terrainGeo = new THREE.PlaneGeometry(
      WORLD_SIZE,
      WORLD_SIZE,
      segments,
      segments
    );
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const vertexColor = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);

      const slope = getTerrainSlope(vx, vz);

      if (vy < -8.0) {
        vertexColor.setHex(0x1e3a5f);
      } else if (vy < -5.2) {
        vertexColor.setHex(0xd4a373);
      } else if (slope > 0.75) {
        vertexColor.setHex(0x475569);
      } else if (vy < 9) {
        vertexColor.setHex(0x2d6a4f);
      } else if (vy < 22) {
        vertexColor.setHex(0x40916c);
      } else if (vy < 32) {
        vertexColor.setHex(0x64748b);
      } else {
        vertexColor.setHex(0xf1f5f9);
      }

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.92,
      metalness: 0.04,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    const waterGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.62,
      roughness: 0.15,
      metalness: 0.25,
      side: THREE.DoubleSide,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = WATER_LEVEL;
    scene.add(waterMesh);

    const TREE_COUNT = 900;
    const ROCK_COUNT = 600;
    const obstacleColliders: ObstacleCollider[] = [];

    const trunkGeo = new THREE.CylinderGeometry(0.26, 0.44, 2.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      flatShading: true,
      roughness: 0.9,
    });
    const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, TREE_COUNT);

    const foliageBottomGeo = new THREE.ConeGeometry(2.0, 4.0, 7);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x1b4332,
      flatShading: true,
      roughness: 0.85,
    });
    const foliageBottomInstanced = new THREE.InstancedMesh(
      foliageBottomGeo,
      foliageMat,
      TREE_COUNT
    );

    const foliageTopGeo = new THREE.IcosahedronGeometry(1.45, 0);
    const foliageTopMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      flatShading: true,
      roughness: 0.8,
    });
    const foliageTopInstanced = new THREE.InstancedMesh(
      foliageTopGeo,
      foliageTopMat,
      TREE_COUNT
    );

    trunkInstanced.castShadow = true;
    trunkInstanced.receiveShadow = true;
    foliageBottomInstanced.castShadow = true;
    foliageBottomInstanced.receiveShadow = true;
    foliageTopInstanced.castShadow = true;
    foliageTopInstanced.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const treeColorTint = new THREE.Color();

    let placedTrees = 0;
    let attempt = 0;
    while (placedTrees < TREE_COUNT && attempt < TREE_COUNT * 4) {
      attempt++;
      const tx = (pseudoRandom(attempt * 3.1) - 0.5) * (WORLD_SIZE - 70);
      const tz = (pseudoRandom(attempt * 7.7) - 0.5) * (WORLD_SIZE - 70);

      if (Math.hypot(tx, tz) < 24) continue;
      const inCamp = gameRef.current.camps.some(
        (c) => Math.hypot(tx - c.x, tz - c.z) < 12
      );
      if (inCamp) continue;

      const ty = getTerrainHeight(tx, tz);
      const slope = getTerrainSlope(tx, tz);

      if (ty < -4.5 || ty > 27 || slope > 0.68) continue;

      const scale = 0.7 + pseudoRandom(attempt * 11.3) * 0.95;
      const rotY = pseudoRandom(attempt * 5.9) * Math.PI * 2;

      dummy.position.set(tx, ty + 1.15 * scale, tz);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(0, rotY, 0);
      dummy.updateMatrix();
      trunkInstanced.setMatrixAt(placedTrees, dummy.matrix);

      dummy.position.set(tx, ty + 3.2 * scale, tz);
      dummy.updateMatrix();
      foliageBottomInstanced.setMatrixAt(placedTrees, dummy.matrix);

      dummy.position.set(tx, ty + 4.9 * scale, tz);
      dummy.scale.set(scale * 0.85, scale * 0.95, scale * 0.85);
      dummy.updateMatrix();
      foliageTopInstanced.setMatrixAt(placedTrees, dummy.matrix);

      const hueShift = (pseudoRandom(attempt * 19.1) - 0.5) * 0.08;
      treeColorTint.setHSL(0.38 + hueShift, 0.55, 0.24 + pseudoRandom(attempt) * 0.1);
      foliageBottomInstanced.setColorAt(placedTrees, treeColorTint);
      foliageTopInstanced.setColorAt(placedTrees, treeColorTint);

      obstacleColliders.push({
        x: tx,
        z: tz,
        radius: 0.48 * scale,
        maxY: ty + 6.0 * scale,
      });

      placedTrees++;
    }

    scene.add(trunkInstanced);
    scene.add(foliageBottomInstanced);
    scene.add(foliageTopInstanced);

    const rockGeo = new THREE.DodecahedronGeometry(1.3, 0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      flatShading: true,
      roughness: 0.88,
    });
    const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, ROCK_COUNT);
    rockInstanced.castShadow = true;
    rockInstanced.receiveShadow = true;

    for (let i = 0; i < ROCK_COUNT; i++) {
      const rx = (pseudoRandom(i * 13.7 + 500) - 0.5) * (WORLD_SIZE - 50);
      const rz = (pseudoRandom(i * 29.3 + 500) - 0.5) * (WORLD_SIZE - 50);
      if (Math.hypot(rx, rz) < 22) continue;

      const inCamp = gameRef.current.camps.some(
        (c) => Math.hypot(rx - c.x, rz - c.z) < 10
      );
      if (inCamp) continue;

      const ry = getTerrainHeight(rx, rz);
      const sx = 0.45 + pseudoRandom(i * 4.1) * 1.9;
      const sy = sx * (0.55 + pseudoRandom(i * 8.2) * 0.6);
      const sz = sx * (0.7 + pseudoRandom(i * 6.5) * 0.5);

      dummy.position.set(rx, ry + sy * 0.35, rz);
      dummy.scale.set(sx, sy, sz);
      dummy.rotation.set(
        pseudoRandom(i * 2.1) * Math.PI,
        pseudoRandom(i * 5.3) * Math.PI,
        pseudoRandom(i * 9.8) * Math.PI
      );
      dummy.updateMatrix();
      rockInstanced.setMatrixAt(i, dummy.matrix);

      const avgHorizontalScale = (sx + sz) * 0.5;
      obstacleColliders.push({
        x: rx,
        z: rz,
        radius: avgHorizontalScale * 0.92,
        maxY: ry + sy * 1.15,
      });
    }
    scene.add(rockInstanced);

    // ============================================================================
    // 3. CAMPS ENNEMIS, CAISSES DE FLÈCHES, MARAUDEURS, BOSS & TRÔNE DU SOUVERAIN
    // ============================================================================
    gameRef.current.enemyInstances = [];
    gameRef.current.lootInstances = [];
    gameRef.current.arrowProjectiles = [];
    gameRef.current.visualEffects = [];

    let enemyIdCounter = 1;
    gameRef.current.camps.forEach((camp) => {
      const campGroup = createEnemyCampGroup(camp.x, camp.y, camp.z);
      scene.add(campGroup);

      obstacleColliders.push({
        x: camp.x - 3.8,
        z: camp.z - 2.5,
        radius: 2.8,
        maxY: camp.y + 4.0,
      });

      for (let c = 0; c < 2; c++) {
        const lx = camp.x + (c === 0 ? 2.4 : -1.8);
        const lz = camp.z + (c === 0 ? 2.2 : 3.0);
        const ly = getTerrainHeight(lx, lz);
        const cratePickup = createLootPickupMesh(
          `camp_ammo_${camp.id}_${c}`,
          lx,
          ly,
          lz,
          6,
          15
        );
        scene.add(cratePickup.group);
        gameRef.current.lootInstances.push(cratePickup);
      }

      for (let e = 0; e < 3; e++) {
        const a = (e / 3) * Math.PI * 2;
        const ex = camp.x + Math.cos(a) * 7.5;
        const ez = camp.z + Math.sin(a) * 7.5;
        const ey = getTerrainHeight(ex, ez);
        const enemyInst = createEnemyMesh(enemyIdCounter++, camp.id, ex, ey, ez);
        scene.add(enemyInst.group);
        gameRef.current.enemyInstances.push(enemyInst);
      }
    });

    for (let r = 0; r < 6; r++) {
      const a = (r / 6) * Math.PI * 2 + 0.4;
      const dist = 42 + r * 28;
      const ex = Math.cos(a) * dist;
      const ez = Math.sin(a) * dist;
      const ey = getTerrainHeight(ex, ez);
      if (ey > WATER_LEVEL + 1.5) {
        const roamer = createEnemyMesh(enemyIdCounter++, -1, ex, ey, ez);
        scene.add(roamer.group);
        gameRef.current.enemyInstances.push(roamer);
      }
    }

    const centerGroundY = getTerrainHeight(0, 0);
    const bossInst = createBossMesh(0, centerGroundY, 0);
    scene.add(bossInst.group);
    gameRef.current.bossInstance = bossInst;

    const throneInst = createSovereignThroneMesh(0, centerGroundY, 0);
    scene.add(throneInst.group);
    gameRef.current.sovereignThrone = throneInst;

    const purificationWave = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    purificationWave.position.set(0, centerGroundY + 1.5, 0);
    purificationWave.visible = false;
    scene.add(purificationWave);
    gameRef.current.purificationWaveMesh = purificationWave;

    const fallingReceptacle = createSacredReceptacleMesh();
    fallingReceptacle.position.set(0, centerGroundY + 45, 0);
    fallingReceptacle.visible = false;
    scene.add(fallingReceptacle);
    gameRef.current.fallingReceptacleMesh = fallingReceptacle;

    // ============================================================================
    // 4. PERSONNAGE HUMANOÏDE ARTICULÉ ("L'Arpenteur d'Aetheria")
    // ============================================================================
    const humanoid = createHumanoidCharacter();
    const playerGroup = humanoid.group;
    scene.add(playerGroup);

    const alterEgo = createHumanoidCharacter();
    alterEgo.group.scale.set(1.4, 1.4, 1.4);
    alterEgo.group.visible = false;
    scene.add(alterEgo.group);
    gameRef.current.alterEgoHumanoid = alterEgo;

    // ============================================================================
    // 5. ORBES & MONUMENT DE CONVERGENCE FINALE
    // ============================================================================
    gameRef.current.orbMeshes = [];

    const sharedPedestalGeo = new THREE.CylinderGeometry(0.65, 0.95, 1.2, 6);
    const sharedPedestalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      flatShading: true,
    });
    const sharedCoreGeo = new THREE.OctahedronGeometry(0.85, 1);
    const sharedCoreMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
    });
    const sharedGlowGeo = new THREE.SphereGeometry(1.5, 12, 12);
    const sharedGlowMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sharedRing1Geo = new THREE.TorusGeometry(1.35, 0.06, 8, 24);
    const sharedRing1Mat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const sharedRing2Geo = new THREE.TorusGeometry(1.65, 0.04, 8, 24);
    const sharedRing2Mat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const sharedBeamGeo = new THREE.CylinderGeometry(0.12, 0.45, 28, 8, 1, true);
    const sharedBeamMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    gameRef.current.orbs.forEach((orb) => {
      const group = new THREE.Group();
      group.position.set(orb.x, orb.y, orb.z);
      group.visible = !orb.collected;

      const pedestal = new THREE.Mesh(sharedPedestalGeo, sharedPedestalMat);
      pedestal.position.y = -1.6;
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      group.add(pedestal);

      const core = new THREE.Mesh(sharedCoreGeo, sharedCoreMat);
      group.add(core);

      const glowSphere = new THREE.Mesh(sharedGlowGeo, sharedGlowMat);
      group.add(glowSphere);

      const ring1 = new THREE.Mesh(sharedRing1Geo, sharedRing1Mat);
      const ring2 = new THREE.Mesh(sharedRing2Geo, sharedRing2Mat);
      ring2.rotation.x = Math.PI / 3;
      group.add(ring1, ring2);

      const pCount = 20;
      const pPos = new Float32Array(pCount * 3);
      for (let p = 0; p < pCount; p++) {
        const a = (p / pCount) * Math.PI * 2;
        const r = 1.2 + Math.random() * 1.3;
        pPos[p * 3] = Math.cos(a) * r;
        pPos[p * 3 + 1] = (Math.random() - 0.5) * 2.5;
        pPos[p * 3 + 2] = Math.sin(a) * r;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
          color: 0xa5f3fc,
          size: 0.22,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        })
      );
      group.add(particles);

      const beam = new THREE.Mesh(sharedBeamGeo, sharedBeamMat);
      beam.position.y = 13;
      group.add(beam);

      scene.add(group);
      gameRef.current.orbMeshes.push({
        group,
        core,
        glowSphere,
        ring1,
        ring2,
        particles,
      });
    });

    const finaleGroup = new THREE.Group();
    finaleGroup.position.set(0, centerGroundY, 0);
    finaleGroup.visible = false;

    const skyPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 3.8, 220, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    skyPillar.position.y = 110;
    finaleGroup.add(skyPillar);
    gameRef.current.skyPillarMesh = skyPillar;

    const restoredHeart = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.8, 1),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    restoredHeart.position.y = 9;
    finaleGroup.add(restoredHeart);
    gameRef.current.restoredHeartMesh = restoredHeart;

    const crownGroup = new THREE.Group();
    crownGroup.position.y = 9;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const miniOrb = new THREE.Mesh(
        sharedCoreGeo,
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      );
      miniOrb.position.set(Math.cos(a) * 7.5, 0, Math.sin(a) * 7.5);
      crownGroup.add(miniOrb);
    }
    finaleGroup.add(crownGroup);
    gameRef.current.crownGroupMesh = crownGroup;

    scene.add(finaleGroup);
    gameRef.current.finaleMonumentGroup = finaleGroup;

    // ============================================================================
    // 6. SYSTÈME DE COMBAT : FLÈCHE BALISTIQUE OU TIR DE MINI-ÉCLAIRS ROUGES (MAUVAISE FIN)
    // ============================================================================
    const crosshairRaycaster = new THREE.Raycaster();
    const centerScreenNDC = new THREE.Vector2(0, 0);

    const fireChargedBowArrow = (charge: number) => {
      const st = gameRef.current;
      const isCorrupted = st.endingChoice === 'RULE_WORLD';
      const isTranscendent = st.endingChoice === 'SAVE_WORLD';
      st.isDrawingBow = false;
      st.bowDrawProgress = 0;
      st.bowAutoReleaseOnFull = false;

      if (!isCorrupted && !isTranscendent && st.arrows <= 0) {
        return;
      }

      if (!isCorrupted && !isTranscendent) {
        st.arrows -= 1;
      }
      st.bowCooldownTimer = isCorrupted || isTranscendent ? 0.22 : 0.38;
      st.bowReleaseAnimTimer = 0.18;

      if (isCorrupted) {
        soundFX.playLightningDash();
      } else if (isTranscendent) {
        soundFX.playBowShoot();
        soundFX.playOrbCollect(9);
      } else {
        soundFX.playBowShoot();
      }

      camera.updateMatrixWorld(true);
      playerGroup.updateMatrixWorld(true);

      const spawnPos = new THREE.Vector3();
      if (st.cameraMode === 'FIRST_PERSON') {
        fpViewModel.bowObject.getWorldPosition(spawnPos);
      } else {
        humanoid.bowObject.getWorldPosition(spawnPos);
      }

      crosshairRaycaster.setFromCamera(centerScreenNDC, camera);
      const rayOrigin = crosshairRaycaster.ray.origin;
      const rayDir = crosshairRaycaster.ray.direction;

      let aimDistance = 32;
      if (st.bossInstance && st.bossInstance.active && !st.bossInstance.defeated) {
        const bossCenter = new THREE.Vector3(
          st.bossInstance.position.x,
          st.bossInstance.position.y + 5.2,
          st.bossInstance.position.z
        );
        const toBoss = bossCenter.sub(rayOrigin);
        const proj = toBoss.dot(rayDir);
        if (proj > 3 && proj < 85) {
          const perpDistSq = toBoss.lengthSq() - proj * proj;
          if (perpDistSq < 18.0) {
            aimDistance = proj;
          }
        }
      }

      for (let i = 0; i < st.enemyInstances.length; i++) {
        const enemy = st.enemyInstances[i];
        if (!enemy.alive) continue;
        const enemyCenter = new THREE.Vector3(
          enemy.position.x,
          enemy.position.y + 1.15,
          enemy.position.z
        );
        const toEnemy = enemyCenter.sub(rayOrigin);
        const proj = toEnemy.dot(rayDir);
        if (proj > 3 && proj < 65) {
          const perpDistSq = toEnemy.lengthSq() - proj * proj;
          if (perpDistSq < 4.0) {
            aimDistance = proj;
            break;
          }
        }
      }

      const targetPoint = rayOrigin
        .clone()
        .addScaledVector(rayDir, aimDistance);

      const dirToTarget = targetPoint.clone().sub(spawnPos).normalize();
      spawnPos.addScaledVector(dirToTarget, 0.35);

      if (isCorrupted) {
        const boltSpeed = 62;
        const boltVel = dirToTarget.multiplyScalar(boltSpeed);
        const boltMesh = createLightningBoltProjectileMesh();
        boltMesh.position.copy(spawnPos);
        boltMesh.lookAt(spawnPos.clone().add(boltVel));
        scene.add(boltMesh);

        st.arrowProjectiles.push({
          mesh: boltMesh,
          position: spawnPos,
          velocity: boltVel,
          age: 0,
          active: true,
          isLightningBolt: true,
        });
        return;
      }

      if (isTranscendent) {
        const cometSpeed = 60;
        const cometVel = dirToTarget.multiplyScalar(cometSpeed);
        const cometMesh = createCometArrowProjectileMesh();
        cometMesh.position.copy(spawnPos);
        cometMesh.lookAt(spawnPos.clone().add(cometVel));
        scene.add(cometMesh);

        st.arrowProjectiles.push({
          mesh: cometMesh,
          position: spawnPos,
          velocity: cometVel,
          age: 0,
          active: true,
          isLightningBolt: false,
          isCosmicArrow: true,
        });
        return;
      }

      const arrowSpeed = 26 + charge * 12;

      const distToTarget = spawnPos.distanceTo(targetPoint);
      const flightTime = distToTarget / arrowSpeed;
      const gravityDropCompensation = 0.5 * ARROW_GRAVITY * flightTime * flightTime;

      const ballisticAimPoint = targetPoint
        .clone()
        .add(new THREE.Vector3(0, Math.min(gravityDropCompensation, 3.2), 0));

      const launchDir = ballisticAimPoint.sub(spawnPos).normalize();
      const arrowVel = launchDir.multiplyScalar(arrowSpeed);

      const arrowMesh = createArrowProjectileMesh();
      arrowMesh.position.copy(spawnPos);
      arrowMesh.lookAt(spawnPos.clone().add(arrowVel));
      scene.add(arrowMesh);

      st.arrowProjectiles.push({
        mesh: arrowMesh,
        position: spawnPos,
        velocity: arrowVel,
        age: 0,
        active: true,
        isLightningBolt: false,
      });
    };

    const startPrimaryWeaponAction = () => {
      const st = gameRef.current;
      if (st.screen !== 'PLAYING' || st.isFadingTransition) return;

      if (st.equippedWeapon === 'SWORD') {
        if (st.attackTimer > 0) return;
        st.attackDuration = 0.36;
        st.attackTimer = st.attackDuration;
        st.swordHitDealt = false;
        soundFX.playSwordSwing();
      } else if (st.equippedWeapon === 'BOW') {
        if (st.bowCooldownTimer > 0 || st.isDrawingBow) return;
        if (st.endingChoice === 'RULE_WORLD' || st.endingChoice === 'SAVE_WORLD') {
          fireChargedBowArrow(1.0);
          return;
        }
        if (st.arrows <= 0) {
          showToast('Plus de flèches ! Fouillez un camp ou tuez des ennemis.');
          return;
        }
        st.isDrawingBow = true;
        st.bowDrawProgress = 0.02;
        st.bowAutoReleaseOnFull = false;
        soundFX.playBowDraw();
      }
    };

    const releasePrimaryWeaponAction = () => {
      const st = gameRef.current;
      if (st.equippedWeapon === 'BOW' && st.isDrawingBow) {
        if (st.bowDrawProgress >= 0.45) {
          fireChargedBowArrow(st.bowDrawProgress);
        } else {
          st.bowAutoReleaseOnFull = true;
        }
      }
    };

    // ============================================================================
    // 7. CONTRÔLES CLAVIER & ROTATION 360° ILLIMITÉE DE LA SOURIS
    // ============================================================================
    const clearAllMovementKeys = () => {
      gameRef.current.keys = {};
      gameRef.current.isDraggingFallback = false;
      gameRef.current.lastMousePos = null;
      gameRef.current.mouseNDC = { x: 0, y: 0 };
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const scr = gameRef.current.screen;
      if (
        scr === 'INTRO_CUTSCENE' ||
        scr === 'BOSS_CUTSCENE' ||
        scr === 'OUTRO_CUTSCENE'
      ) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
          e.preventDefault();
          handleNextCutsceneStep();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          handlePrevCutsceneStep();
        } else if (e.code === 'Escape') {
          finishCutscene();
        }
        return;
      }

      if (scr !== 'PLAYING') {
        if (e.code === 'Escape' && scr === 'PAUSED') {
          handleResumeGame();
        }
        return;
      }

      gameRef.current.keys[e.code] = true;
      if (e.code === 'KeyV') {
        handleToggleCamera();
      } else if (e.code === 'Digit1') {
        handleSelectWeapon('SWORD');
      } else if (e.code === 'Digit2') {
        handleSelectWeapon('BOW');
      } else if (e.code === 'KeyE') {
        handleSelectWeapon(
          gameRef.current.equippedWeapon === 'SWORD' ? 'BOW' : 'SWORD'
        );
      } else if (e.code === 'KeyF' && !e.repeat) {
        startPrimaryWeaponAction();
      } else if (e.code === 'KeyR' && !e.repeat) {
        triggerLightningDash();
      } else if (e.code === 'KeyT' && !e.repeat) {
        triggerTimeShift();
      } else if (e.code === 'KeyG' && !e.repeat) {
        triggerSolarNova();
      } else if (e.code === 'Escape') {
        handleOpenPauseMenu();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.code] = false;
      if (e.code === 'KeyF') {
        releasePrimaryWeaponAction();
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (gameRef.current.screen !== 'PLAYING') return;
      if (Math.abs(e.deltaY) > 4) {
        handleSelectWeapon(
          gameRef.current.equippedWeapon === 'SWORD' ? 'BOW' : 'SWORD'
        );
      }
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === container;
      if (!locked) {
        clearAllMovementKeys();
        if (gameRef.current.screen === 'PLAYING' && !gameRef.current.isFadingTransition) {
          updateScreen('PAUSED');
        }
      }
    };

    const onWindowBlur = () => {
      clearAllMovementKeys();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        clearAllMovementKeys();
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      clearAllMovementKeys();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (gameRef.current.screen !== 'PLAYING') return;
      const locked = document.pointerLockElement === container;

      const normX = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const normY = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      gameRef.current.mouseNDC = { x: normX, y: normY };
      gameRef.current.isMouseInsideWindow = true;

      if (!locked && !gameRef.current.mouseCaptured && !gameRef.current.isDraggingFallback) {
        return;
      }

      let dx = e.movementX;
      let dy = e.movementY;

      if (!locked && gameRef.current.lastMousePos) {
        if (dx === 0 && dy === 0) {
          dx = e.clientX - gameRef.current.lastMousePos.x;
          dy = e.clientY - gameRef.current.lastMousePos.y;
        }
      }
      gameRef.current.lastMousePos = { x: e.clientX, y: e.clientY };

      if (Math.abs(dx) > 350 || Math.abs(dy) > 350) return;

      const sensitivity = locked ? 0.0024 : 0.0046;
      gameRef.current.yaw -= dx * sensitivity;
      gameRef.current.pitch = Math.max(
        -1.45,
        Math.min(1.45, gameRef.current.pitch - dy * (locked ? 0.0024 : 0.0036))
      );
    };

    const onMouseLeave = () => {
      if (Math.abs(gameRef.current.mouseNDC.x) > 0.65) {
        gameRef.current.mouseNDC.x = Math.sign(gameRef.current.mouseNDC.x) * 0.95;
      } else {
        gameRef.current.isMouseInsideWindow = false;
      }
    };

    const onMouseEnter = () => {
      gameRef.current.isMouseInsideWindow = true;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (gameRef.current.screen !== 'PLAYING') return;
      if (e.button === 0) {
        gameRef.current.mouseCaptured = true;
        setIsMouseCaptured(true);
        gameRef.current.isDraggingFallback = true;
        gameRef.current.mouseDownPos = { x: e.clientX, y: e.clientY };
        gameRef.current.lastMousePos = { x: e.clientX, y: e.clientY };
        startPrimaryWeaponAction();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && gameRef.current.screen === 'PLAYING') {
        releasePrimaryWeaponAction();
      }
      gameRef.current.isDraggingFallback = false;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('wheel', onWheel);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    container.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', onResize);

    // ============================================================================
    // 8. FONCTIONS DE DÉGÂTS SUR LES ENNEMIS & SUR LE BOSS MALAKOR
    // ============================================================================
    const damageEnemy = (
      enemy: EnemyInstance3D,
      damage: number,
      knockDirX: number,
      knockDirZ: number
    ) => {
      if (!enemy.alive) return;
      enemy.hp = Math.max(0, enemy.hp - damage);
      enemy.hurtFlashTimer = 0.2;
      enemy.velocity.x += knockDirX * 10;
      enemy.velocity.z += knockDirZ * 10;

      const hpRatio = Math.max(0.001, enemy.hp / enemy.maxHp);
      enemy.hpBarFill.scale.x = hpRatio;

      if (enemy.hp <= 0) {
        enemy.alive = false;
        enemy.group.visible = false;
        soundFX.playEnemyHit(true);

        const dropY = getTerrainHeight(enemy.position.x, enemy.position.z);
        const dropLoot = createLootPickupMesh(
          `drop_${enemy.id}_${Date.now()}`,
          enemy.position.x,
          dropY,
          enemy.position.z,
          4,
          20
        );
        scene.add(dropLoot.group);
        gameRef.current.lootInstances.push(dropLoot);
        const isRuler = gameRef.current.endingChoice === 'RULE_WORLD';
        const isCelestial = gameRef.current.endingChoice === 'SAVE_WORLD';
        showToast(
          isRuler
            ? 'Survivant Humain éliminé !'
            : isCelestial
            ? 'Démon de l’Espace-Temps banni dans le Néant !'
            : 'Maraudeur vaincu ! Flèches lâchées au sol.'
        );
      } else {
        soundFX.playEnemyHit(false);
      }
    };

    const damageBoss = (
      boss: BossInstance3D,
      damage: number,
      knockDirX: number,
      knockDirZ: number
    ) => {
      if (!boss.active || boss.defeated) return;
      boss.hp = Math.max(0, boss.hp - damage);
      boss.velocity.x += knockDirX * 4;
      boss.velocity.z += knockDirZ * 4;

      if (gameRef.current.isDimensionalClashActive) {
        if (boss.hp <= 0) {
          triggerCollapseBreakthrough();
          return;
        }
        if (gameRef.current.alterEgoPhase === 1 && boss.hp <= boss.maxHp * 0.66) {
          gameRef.current.alterEgoPhase = 2;
          soundFX.playNovaBlast();
          soundFX.playBossRoar();
          const pX = gameRef.current.playerPos.x - boss.position.x;
          const pZ = gameRef.current.playerPos.z - boss.position.z;
          const pDist = Math.hypot(pX, pZ);
          const pDirX = pX / Math.max(0.001, pDist);
          const pDirZ = pZ / Math.max(0.001, pDist);
          gameRef.current.playerVel.x += pDirX * 24;
          gameRef.current.playerVel.z += pDirZ * 24;
          gameRef.current.playerVel.y = 8.5;
          const burstMesh = new THREE.Mesh(
            new THREE.RingGeometry(1.2, 5.5, 32),
            new THREE.MeshBasicMaterial({
              color: 0xf43f5e,
              transparent: true,
              opacity: 0.95,
              side: THREE.DoubleSide,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            })
          );
          burstMesh.rotation.x = -Math.PI / 2;
          burstMesh.position.set(boss.position.x, boss.position.y + 0.4, boss.position.z);
          scene.add(burstMesh);
          gameRef.current.visualEffects.push({
            mesh: burstMesh,
            age: 0,
            maxAge: 0.7,
            type: 'BOSS_SLAM_RING',
          });
          showToast("TRANSITION PHASE 2 : L'Autre Réalité déchaîne la Tempête Écarlate !");
        } else if (gameRef.current.alterEgoPhase === 2 && boss.hp <= boss.maxHp * 0.33) {
          gameRef.current.alterEgoPhase = 3;
          soundFX.playVoidDimensionSeal();
          soundFX.playBossRoar();
          const burstMesh = new THREE.Mesh(
            new THREE.RingGeometry(1.5, 6.5, 32),
            new THREE.MeshBasicMaterial({
              color: 0xd946ef,
              transparent: true,
              opacity: 0.95,
              side: THREE.DoubleSide,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            })
          );
          burstMesh.rotation.x = -Math.PI / 2;
          burstMesh.position.set(boss.position.x, boss.position.y + 0.4, boss.position.z);
          scene.add(burstMesh);
          gameRef.current.visualEffects.push({
            mesh: burstMesh,
            age: 0,
            maxAge: 0.75,
            type: 'NOVA_RING',
          });
          showToast("TRANSITION PHASE 3 : Frénésie Totale - Rupture Dimensionnelle !");
        }
        soundFX.playEnemyHit(false);
      } else {
        if (boss.hp <= 0) {
          boss.defeated = true;
          boss.active = false;
          boss.group.visible = false;
          soundFX.playEnemyHit(true);
          showToast('MALAKOR TERRASSÉ ! Le Réceptacle des 10 Orbes est à vous !');
          startOutroCutscene();
        } else {
          soundFX.playEnemyHit(false);
        }
      }
    };

    bossDamageHandlerRef.current = (dmg, kX, kZ) => {
      if (gameRef.current.bossInstance) {
        damageBoss(gameRef.current.bossInstance, dmg, kX, kZ);
      }
    };

    // ============================================================================
    // 9. BOUCLE DE SIMULATION PHYSIQUE, CINÉMATIQUES & RENDU TEMPS RÉEL
    // ============================================================================
    let animationFrameId: number;
    let prevTime = performance.now();
    let hudSyncTimer = 0;
    let voidRumbleTimer = 0;
    let voidSealSoundPlayed = false;
    let purpleStepTrailTimer = 0;

    const skyDayColor = new THREE.Color(0x7dd3fc);
    const skySunsetColor = new THREE.Color(0xf97316);
    const skyNightColor = new THREE.Color(0x090d16);
    const skyChaosColor = new THREE.Color(0x2e0514);
    const skyAbyssBlackColor = new THREE.Color(0x04010a);
    const skyTranscendentColor = new THREE.Color(0x1e1b4b);
    const underwaterFogColor = new THREE.Color(0x0369a1);
    const currentSkyColor = new THREE.Color();

    const animate = (now: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      const state = gameRef.current;
      const isCorruptedRuler = state.endingChoice === 'RULE_WORLD';
      const isTranscendentSavior = state.endingChoice === 'SAVE_WORLD';

      if (isTranscendentSavior) {
        state.timeOfDay = 11.2;
      } else if (isCorruptedRuler) {
        state.timeOfDay = 18.8;
      } else {
        state.timeOfDay = (state.timeOfDay + dt * 0.12) % 24;
      }

      const sunAngle = ((state.timeOfDay - 6) / 24) * Math.PI * 2;
      const sunElevation = Math.sin(sunAngle);
      const sunHorizontal = Math.cos(sunAngle);

      const sunDist = 240;
      sunLight.position.set(
        state.playerPos.x + sunHorizontal * sunDist,
        Math.max(12, sunElevation * sunDist),
        state.playerPos.z + 75
      );
      sunLight.target.position.copy(state.playerPos);
      sunSphere.position.set(
        state.playerPos.x + sunHorizontal * 400,
        sunElevation * 400,
        state.playerPos.z + 120
      );
      starField.position.set(state.playerPos.x, 0, state.playerPos.z);

      if (isTranscendentSavior) {
        currentSkyColor.lerpColors(
          skyTranscendentColor,
          skyDayColor,
          0.55 + Math.sin(now * 0.001) * 0.15
        );
        sunLight.intensity = 2.1;
        sunLight.color.setHex(0xfef08a);
        ambientLight.intensity = 0.85;
        starsMat.opacity = 0.85;
        starField.rotation.y += dt * 0.08;
      } else if (isCorruptedRuler) {
        currentSkyColor.lerpColors(
          skyAbyssBlackColor,
          skyChaosColor,
          0.5 + Math.sin(now * 0.0025) * 0.35
        );
        sunLight.intensity = 2.2;
        sunLight.color.setHex(0xf43f5e);
        ambientLight.intensity = 0.45;
        starsMat.opacity = 0.7;
        starField.rotation.y -= dt * 0.18;
        if (state.sovereignThrone) {
          state.sovereignThrone.group.visible = true;
          state.sovereignThrone.updateAbyssalEffects(now * 0.001, 1.0);
        }
      } else if (sunElevation > 0.22) {
        const t = Math.min(1, (sunElevation - 0.22) / 0.78);
        currentSkyColor.lerpColors(skySunsetColor, skyDayColor, t);
        sunLight.intensity = 1.0 + t * 0.9;
        sunLight.color.setHex(0xfffbeb);
        ambientLight.intensity = 0.45 + t * 0.25;
        starsMat.opacity = 0;
      } else if (sunElevation > -0.18) {
        const t = (sunElevation + 0.18) / 0.4;
        currentSkyColor.lerpColors(skyNightColor, skySunsetColor, t);
        sunLight.intensity = 0.2 + t * 0.8;
        sunLight.color.setHex(0xfb923c);
        ambientLight.intensity = 0.22 + t * 0.23;
        starsMat.opacity = 1 - t;
      } else {
        currentSkyColor.copy(skyNightColor);
        sunLight.intensity = 0.15;
        sunLight.color.setHex(0x818cf8);
        ambientLight.intensity = 0.2;
        starsMat.opacity = 0.9;
      }

      for (let i = state.visualEffects.length - 1; i >= 0; i--) {
        const fx = state.visualEffects[i];
        fx.age += dt;
        const p = fx.age / fx.maxAge;
        if (fx.type === 'NOVA_RING' || fx.type === 'BOSS_SLAM_RING') {
          const maxScale = fx.type === 'BOSS_SLAM_RING' ? 9.5 : 7.5;
          const s = 1 + p * maxScale;
          fx.mesh.scale.set(s, s, 1);
          const mat = (fx.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, (1 - p) * 0.85);
        } else if (fx.type === 'SKY_VORTEX') {
          fx.mesh.rotation.y += dt * 5.0;
          const beamScale = Math.max(0.05, 1 - p * 0.8);
          fx.mesh.scale.set(beamScale, 1, beamScale);
        } else if (fx.type === 'REALITY_RIFT') {
          const riftScale = p < 0.2 ? p / 0.2 : 1.0;
          fx.mesh.scale.set(riftScale, riftScale, 1);
          fx.mesh.rotation.z += dt * 3.5;
          if (fx.targetX !== undefined && fx.targetZ !== undefined) {
            const distToRift = Math.hypot(
              state.playerPos.x - fx.targetX,
              state.playerPos.z - fx.targetZ
            );
            if (distToRift < 3.4 && state.divineInvulnTimer <= 0) {
              state.health = Math.max(0, state.health - dt * 26);
              state.playerVel.x *= 0.88;
              state.playerVel.z *= 0.88;
              if (Math.sin(fx.age * 12) > 0.8) {
                soundFX.playPlayerHurt();
              }
            }
          }
        } else if (fx.type === 'SCARLET_TELEGRAPH') {
          const pulse = Math.sin(fx.age * 16) * 0.25 + 0.75;
          const mat = (fx.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = pulse;
          const s = 1.0 + Math.sin(fx.age * 8) * 0.08;
          fx.mesh.scale.set(s, s, 1);
        } else if (fx.type === 'SCARLET_LIGHTNING_PILLAR') {
          const mat = (fx.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, (1 - p) * 0.95);
          fx.mesh.scale.x = 1.0 + p * 1.5;
          fx.mesh.scale.z = 1.0 + p * 1.5;
        } else if (fx.type === 'SUPERNOVA') {
          const novaScale = 1 + p * 11.5;
          fx.mesh.scale.set(novaScale, novaScale, novaScale);
          fx.mesh.rotation.y += dt * 3.0;
        } else if (fx.type === 'CONSTELLATION_TRAIL') {
          fx.mesh.position.y += dt * 0.6;
        }
        if (fx.age >= fx.maxAge) {
          if (fx.type === 'SCARLET_TELEGRAPH' && fx.targetX !== undefined && fx.targetZ !== undefined) {
            const tY = getTerrainHeight(fx.targetX, fx.targetZ);
            const boltGeo = new THREE.CylinderGeometry(0.55, 0.75, 75, 12);
            const boltMat = new THREE.MeshBasicMaterial({
              color: 0xff1744,
              transparent: true,
              opacity: 0.95,
              side: THREE.DoubleSide,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
            const boltMesh = new THREE.Mesh(boltGeo, boltMat);
            boltMesh.position.set(fx.targetX, tY + 37.5, fx.targetZ);
            scene.add(boltMesh);
            state.visualEffects.push({
              mesh: boltMesh,
              age: 0,
              maxAge: 0.38,
              type: 'SCARLET_LIGHTNING_PILLAR',
            });

            const impactRingGeo = new THREE.RingGeometry(0.8, 4.2, 32);
            impactRingGeo.rotateX(-Math.PI / 2);
            const impactRingMat = new THREE.MeshBasicMaterial({
              color: 0xff1744,
              transparent: true,
              opacity: 0.9,
              side: THREE.DoubleSide,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
            const impactMesh = new THREE.Mesh(impactRingGeo, impactRingMat);
            impactMesh.position.set(fx.targetX, tY + 0.15, fx.targetZ);
            scene.add(impactMesh);
            state.visualEffects.push({
              mesh: impactMesh,
              age: 0,
              maxAge: 0.5,
              type: 'BOSS_SLAM_RING',
            });

            soundFX.playNovaBlast();
            soundFX.playLightningDash();

            const distToBolt = Math.hypot(
              state.playerPos.x - fx.targetX,
              state.playerPos.z - fx.targetZ
            );
            if (distToBolt < 3.6 && state.divineInvulnTimer <= 0) {
              state.health = Math.max(0, state.health - 32);
              state.playerVel.y = 8.5;
              soundFX.playPlayerHurt();
            }
          }
          scene.remove(fx.mesh);
          state.visualEffects.splice(i, 1);
        }
      }

      // Animation des Orbes
      for (let idx = 0; idx < state.orbs.length; idx++) {
        const orb = state.orbs[idx];
        const meshObj = state.orbMeshes[idx];
        if (!meshObj || !meshObj.group.visible) continue;

        const floatY = orb.y + Math.sin(now * 0.003 + idx) * 0.45;
        meshObj.group.position.y = floatY;
        meshObj.core.rotation.y += dt * 1.6;
        meshObj.core.rotation.x += dt * 0.8;

        const pulseScale = 1.0 + Math.sin(now * 0.005 + idx) * 0.18;
        meshObj.glowSphere.scale.set(pulseScale, pulseScale, pulseScale);

        meshObj.ring1.rotation.z += dt * 2.2;
        meshObj.ring1.rotation.x += dt * 1.1;
        meshObj.ring2.rotation.y -= dt * 1.9;
        meshObj.particles.rotation.y += dt * 0.6;
      }

      if (finaleGroup.visible) {
        restoredHeart.rotation.y += dt * 1.2;
        restoredHeart.rotation.x += dt * 0.7;
        crownGroup.rotation.y += dt * 0.9;
        crownGroup.position.y = 9 + Math.sin(now * 0.003) * 0.8;
      }

      if (state.sovereignThrone && state.sovereignThrone.group.visible) {
        state.sovereignThrone.floatingMonoliths.rotation.y += dt * 0.65;
        state.sovereignThrone.floatingMonoliths.children.forEach((child, idx) => {
          child.position.y = Math.sin(now * 0.0025 + idx) * 2.5;
          child.rotation.x += dt * 0.4;
        });
        state.sovereignThrone.chaosRings.rotation.y -= dt * 1.4;
        state.sovereignThrone.chaosRings.rotation.z = Math.sin(now * 0.002) * 0.35;
        state.sovereignThrone.lightningBolts.forEach((bolt, bIdx) => {
          bolt.visible = Math.sin(now * 0.025 + bIdx * 1.7) > 0.1;
        });
      }

      // --- A. ÉCRAN MENU PRINCIPAL ---
      if (state.screen === 'MAIN_MENU') {
        fpViewModel.group.visible = false;
        scene.background = currentSkyColor;
        fog.color.copy(currentSkyColor);
        fog.density = 0.0024;
        const spawnGroundY = getTerrainHeight(0, 0);
        playerGroup.position.set(0, spawnGroundY, 0);
        playerGroup.visible = true;
        humanoid.updateAnimation({
          dt,
          time: now,
          speed: 0,
          forwardInput: 0,
          rightInput: 0,
          isSprinting: false,
          isGrounded: true,
          isSwimming: false,
          headPitch: 0,
          equippedWeapon: state.equippedWeapon,
          attackProgress: 0,
          bowDrawProgress: 0,
          bowReleaseTimer: 0,
          hasArrows: state.arrows > 0,
          isSeatedOnThrone: false,
          isCorrupted: isCorruptedRuler,
          isCelestial: isTranscendentSavior,
        });

        const menuAngle = now * 0.00015;
        const camRadius = 38;
        const cx = Math.cos(menuAngle) * camRadius;
        const cz = Math.sin(menuAngle) * camRadius;
        const cy = getTerrainHeight(cx, cz) + 14;
        camera.up.set(0, 1, 0);
        camera.position.set(cx, cy, cz);
        camera.lookAt(0, spawnGroundY + 4, 0);
        renderer.render(scene, camera);
        return;
      }

      // --- B. CINÉMATIQUE D'INTRODUCTION ---
      if (state.screen === 'INTRO_CUTSCENE') {
        fpViewModel.group.visible = false;
        scene.background = currentSkyColor;
        fog.color.copy(currentSkyColor);
        fog.density = 0.0024;

        state.cutsceneStepTimer += dt;
        const stepIdx = state.cutsceneStepIndex;
        const stepProgress = Math.min(
          1,
          state.cutsceneStepTimer / CUTSCENE_ANIM_DURATION
        );

        hudSyncTimer += dt;
        if (hudSyncTimer >= 0.08) {
          hudSyncTimer = 0;
          setCutsceneProgress(stepProgress);
        }

        const spawnGroundY = getTerrainHeight(0, 0);
        playerGroup.position.set(0, spawnGroundY, 0);
        playerGroup.rotation.y = 0;
        playerGroup.visible = true;
        humanoid.updateAnimation({
          dt,
          time: now,
          speed: 0,
          forwardInput: 0,
          rightInput: 0,
          isSprinting: false,
          isGrounded: true,
          isSwimming: false,
          headPitch: 0.1,
          equippedWeapon: state.equippedWeapon,
          attackProgress: 0,
          bowDrawProgress: 0,
          bowReleaseTimer: 0,
          hasArrows: state.arrows > 0,
          isSeatedOnThrone: false,
          isCorrupted: false,
        });
        camera.up.set(0, 1, 0);

        if (stepIdx === 0) {
          const angle = -0.6 + now * 0.00018;
          const rad = 105 - stepProgress * 18;
          const cx = Math.cos(angle) * rad;
          const cz = Math.sin(angle) * rad;
          const cy = Math.max(getTerrainHeight(cx, cz) + 18, 40 - stepProgress * 6);
          camera.position.set(cx, cy, cz);
          camera.lookAt(0, spawnGroundY + 6, 0);
        } else if (stepIdx === 1) {
          const targetOrb = state.orbs[0] || { x: 60, y: 12, z: 60 };
          const orbAngle = now * 0.00035;
          const dist = 18 - stepProgress * 4;
          const cx = targetOrb.x + Math.cos(orbAngle) * dist;
          const cz = targetOrb.z + Math.sin(orbAngle) * dist;
          const cy = Math.max(
            getTerrainHeight(cx, cz) + 3,
            targetOrb.y + 4.0 - stepProgress * 1.5
          );
          camera.position.set(cx, cy, cz);
          camera.lookAt(targetOrb.x, targetOrb.y + 0.5, targetOrb.z);
        } else {
          const startPos = new THREE.Vector3(0, spawnGroundY + 18, 28);
          const endPos = new THREE.Vector3(
            Math.sin(now * 0.0003) * 2.5,
            spawnGroundY + 3.2,
            6.5
          );
          const smooth = stepProgress * stepProgress * (3 - 2 * stepProgress);
          camera.position.lerpVectors(startPos, endPos, smooth);
          camera.lookAt(0, spawnGroundY + 1.6, -6);
        }

        renderer.render(scene, camera);
        return;
      }

      // --- C. CINÉMATIQUE D'APPARITION DU BOSS ---
      if (state.screen === 'BOSS_CUTSCENE') {
        fpViewModel.group.visible = false;
        scene.background = currentSkyColor;
        fog.color.copy(currentSkyColor);
        fog.density = 0.0024;

        state.cutsceneStepTimer += dt;
        const stepIdx = state.cutsceneStepIndex;
        const stepProgress = Math.min(
          1,
          state.cutsceneStepTimer / CUTSCENE_ANIM_DURATION
        );

        hudSyncTimer += dt;
        if (hudSyncTimer >= 0.08) {
          hudSyncTimer = 0;
          setCutsceneProgress(stepProgress);
        }

        const spawnGroundY = getTerrainHeight(0, 0);
        const heroZ = 28;
        playerGroup.position.set(0, getTerrainHeight(0, heroZ), heroZ);
        playerGroup.rotation.y = 0;
        playerGroup.visible = true;
        camera.up.set(0, 1, 0);

        if (stepIdx === 0) {
          if (state.fallingReceptacleMesh) {
            state.fallingReceptacleMesh.visible = true;
            const receptacleY =
              spawnGroundY + 42 - stepProgress * 30 + Math.sin(now * 0.003) * 0.6;
            state.fallingReceptacleMesh.position.set(0, receptacleY, 0);
            state.fallingReceptacleMesh.rotation.y += dt * 2.2;
            state.fallingReceptacleMesh.rotation.z = Math.sin(now * 0.004) * 0.2;

            const camAngle = now * 0.00025;
            camera.position.set(
              Math.cos(camAngle) * 26,
              spawnGroundY + 14 + (1 - stepProgress) * 10,
              Math.sin(camAngle) * 26
            );
            camera.lookAt(0, receptacleY, 0);
          }
          if (state.bossInstance) {
            state.bossInstance.group.visible = false;
          }
          restoredHeart.visible = false;
        } else if (stepIdx === 1) {
          state.timeOfDay = 18.8;
          if (state.skyPillarMesh) {
            (state.skyPillarMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e);
          }
          if (state.fallingReceptacleMesh) {
            if (stepProgress < 0.35) {
              const p = stepProgress / 0.35;
              state.fallingReceptacleMesh.visible = true;
              state.fallingReceptacleMesh.position.set(
                0,
                spawnGroundY + 10 - p * 4.5,
                -p * 1.0
              );
              const sc = 1 - p * 0.7;
              state.fallingReceptacleMesh.scale.set(sc, sc, sc);
            } else {
              state.fallingReceptacleMesh.visible = false;
              state.fallingReceptacleMesh.scale.set(1, 1, 1);
            }
          }

          if (state.bossInstance) {
            state.bossInstance.group.visible = true;
            state.bossInstance.group.position.set(0, spawnGroundY, 0);
            state.bossInstance.group.rotation.y = Math.PI;
            state.bossInstance.orbitingOrbs.rotation.y += dt * 2.5;
            state.bossInstance.chestReceptacle.rotation.z += dt * 3.0;
            state.bossInstance.rightArm.rotation.x =
              -0.8 - Math.sin(now * 0.003) * 0.6;
            state.bossInstance.leftArm.rotation.x =
              -0.6 - Math.sin(now * 0.003) * 0.4;
          }

          const camDist = 17 + stepProgress * 4;
          const camX = Math.sin(now * 0.00025) * camDist;
          const camZ = Math.cos(now * 0.00025) * camDist;
          camera.position.set(camX, spawnGroundY + 4.5, camZ);
          camera.lookAt(0, spawnGroundY + 6.5, 0);
        } else {
          if (state.bossInstance) {
            state.bossInstance.group.visible = true;
            state.bossInstance.orbitingOrbs.rotation.y += dt * 2.5;
            state.bossInstance.rightArm.rotation.x = 0.25;
          }
          const startCam = new THREE.Vector3(10, spawnGroundY + 12, 18);
          const endCam = new THREE.Vector3(0, getTerrainHeight(0, heroZ) + 3.5, heroZ + 6.5);
          const smooth = stepProgress * stepProgress * (3 - 2 * stepProgress);
          camera.position.lerpVectors(startCam, endCam, smooth);
          camera.lookAt(0, spawnGroundY + 5.5, 0);
        }

        renderer.render(scene, camera);
        return;
      }

      // --- D. CINÉMATIQUE DE FIN ---
      if (state.screen === 'OUTRO_CUTSCENE') {
        fpViewModel.group.visible = false;

        state.cutsceneStepTimer += dt;
        const stepIdx = state.cutsceneStepIndex;
        const stepProgress = Math.min(
          1,
          state.cutsceneStepTimer / CUTSCENE_ANIM_DURATION
        );

        hudSyncTimer += dt;
        if (hudSyncTimer >= 0.08) {
          hudSyncTimer = 0;
          setCutsceneProgress(stepProgress);
        }

        finaleGroup.visible = true;
        const spawnGroundY = getTerrainHeight(0, 0);
        const heroZ = 12;

        if (stepIdx === 0 || stepIdx === 1) {
          scene.background = currentSkyColor;
          fog.color.copy(currentSkyColor);
          fog.density = 0.0024;
          camera.up.set(0, 1, 0);

          playerGroup.position.set(0, getTerrainHeight(0, heroZ), heroZ);
          playerGroup.rotation.y = 0;
          playerGroup.visible = true;
          humanoid.updateAnimation({
            dt,
            time: now,
            speed: 0,
            forwardInput: 0,
            rightInput: 0,
            isSprinting: false,
            isGrounded: true,
            isSwimming: false,
            headPitch: 0.25,
            equippedWeapon: state.equippedWeapon,
            attackProgress: 0,
            bowDrawProgress: 0,
            bowReleaseTimer: 0,
            hasArrows: state.arrows > 0,
            isSeatedOnThrone: false,
            isCorrupted: false,
          });

          const a = now * 0.00035;
          const r = stepIdx === 0 ? 22 : 20;
          camera.position.set(
            Math.cos(a) * r,
            spawnGroundY + 8,
            Math.sin(a) * r
          );
          camera.lookAt(0, spawnGroundY + 7, 2);
        } else if (state.endingChoice === 'RULE_WORLD') {
          currentSkyColor.lerpColors(
            skyAbyssBlackColor,
            skyChaosColor,
            0.35 + stepProgress * 0.55
          );
          scene.background = currentSkyColor;
          fog.color.copy(currentSkyColor);
          fog.density = 0.0046;
          sunLight.color.setHex(0xf43f5e);
          sunLight.intensity = 2.2 + stepProgress * 1.4;

          const voidLevitation =
            Math.min(1, stepProgress * 1.35) * 6.5 + Math.sin(now * 0.005) * 0.42;

          if (state.sovereignThrone) {
            state.sovereignThrone.group.visible = true;
            state.sovereignThrone.updateAbyssalEffects(now * 0.001, stepProgress);
          }

          playerGroup.position.set(
            0,
            spawnGroundY + 1.2 + voidLevitation,
            0
          );
          playerGroup.rotation.y = Math.PI + Math.sin(now * 0.0015) * 0.18;
          playerGroup.visible = true;

          if (state.restoredHeartMesh) {
            state.restoredHeartMesh.position.y =
              playerGroup.position.y - spawnGroundY + 1.4;
            const crushScale = Math.max(0.15, 1.0 - stepProgress * 0.85);
            state.restoredHeartMesh.scale.set(crushScale, crushScale, crushScale);
          }

          crownGroup.position.y = playerGroup.position.y - spawnGroundY + 2.2;
          crownGroup.rotation.y += dt * (3.2 + stepProgress * 5.0);

          const finalStrikeProgress =
            stepProgress > 0.78 ? Math.min(1, (stepProgress - 0.78) / 0.18) : 0;

          if (stepProgress < 0.1) {
            voidSealSoundPlayed = false;
          }
          voidRumbleTimer += dt;
          if (voidRumbleTimer >= 0.32 && stepProgress < 0.82) {
            voidRumbleTimer = 0;
            soundFX.playVoidChargeRumble(stepProgress);
          }
          if (stepProgress >= 0.82 && !voidSealSoundPlayed) {
            voidSealSoundPlayed = true;
            soundFX.playVoidDimensionSeal();
          }

          humanoid.updateAnimation({
            dt,
            time: now,
            speed: 0,
            forwardInput: 0,
            rightInput: 0,
            isSprinting: false,
            isGrounded: false,
            isSwimming: false,
            headPitch: -0.22 - stepProgress * 0.25,
            equippedWeapon: 'SWORD',
            attackProgress: finalStrikeProgress,
            bowDrawProgress: 0,
            bowReleaseTimer: 0,
            hasArrows: true,
            isSeatedOnThrone: false,
            isCorrupted: true,
            isCelestial: false,
          });

          const energyCharge = Math.pow(stepProgress, 1.75);
          const sealBurst =
            stepProgress >= 0.8 && stepProgress <= 0.95 ? 0.65 : 0;
          const shakeAmp = energyCharge * 0.42 + sealBurst;
          const shakeX = (Math.random() - 0.5) * shakeAmp;
          const shakeY = (Math.random() - 0.5) * shakeAmp;

          const camAngle = Math.sin(now * 0.0004) * 0.45 + stepProgress * 0.65;
          const camDist = 4.2 + stepProgress * 8.5;
          const camHeight = spawnGroundY + 0.45 + Math.pow(stepProgress, 1.15) * 14.2;
          const tiltRoll = Math.sin(now * 0.004) * (0.04 + energyCharge * 0.12);
          camera.up.set(Math.sin(tiltRoll), Math.cos(tiltRoll), 0);
          camera.position.set(
            Math.sin(camAngle) * camDist + shakeX,
            camHeight + shakeY,
            Math.cos(camAngle) * camDist
          );
          camera.lookAt(
            0,
            playerGroup.position.y + 0.6 + stepProgress * 3.8,
            0
          );
        } else {
          currentSkyColor.lerpColors(skyTranscendentColor, skyDayColor, 0.55);
          scene.background = currentSkyColor;
          fog.color.copy(currentSkyColor);
          fog.density = 0.0018;
          sunLight.color.setHex(0xfef08a);
          sunLight.intensity = 2.4;
          starsMat.opacity = 0.9;
          camera.up.set(0, 1, 0);

          const ascensionHeight = stepIdx === 2 ? Math.min(1, stepProgress * 1.35) * 4.5 + Math.sin(now * 0.004) * 0.35 : 0;
          playerGroup.position.set(0, getTerrainHeight(0, 0) + ascensionHeight, 0);
          playerGroup.rotation.y = stepIdx === 2 ? now * 0.0008 : 0;
          playerGroup.visible = true;

          if (state.restoredHeartMesh) {
            state.restoredHeartMesh.position.y = 9 - Math.min(1, stepProgress * 1.4) * 6.5;
            const heartScale = Math.max(0.25, 1 - stepProgress * 0.75);
            state.restoredHeartMesh.scale.set(heartScale, heartScale, heartScale);
          }
          crownGroup.position.y = playerGroup.position.y - spawnGroundY + 1.5;
          crownGroup.rotation.y -= dt * 3.8;

          humanoid.updateAnimation({
            dt,
            time: now,
            speed: 0,
            forwardInput: 0,
            rightInput: 0,
            isSprinting: false,
            isGrounded: ascensionHeight < 0.2,
            isSwimming: false,
            headPitch: -0.25,
            equippedWeapon: 'SWORD',
            attackProgress: 0,
            bowDrawProgress: 0,
            bowReleaseTimer: 0,
            hasArrows: true,
            isSeatedOnThrone: false,
            isCorrupted: false,
            isCelestial: true,
          });

          if (stepIdx === 2) {
            if (state.purificationWaveMesh) {
              state.purificationWaveMesh.visible = true;
              const waveScale = 1 + stepProgress * 26;
              state.purificationWaveMesh.scale.set(
                waveScale,
                waveScale,
                waveScale
              );
              const mat = state.purificationWaveMesh
                .material as THREE.MeshBasicMaterial;
              mat.opacity = Math.max(0.08, (1 - stepProgress * 0.8) * 0.55);
            }

            state.enemyInstances.forEach((enemy, idx) => {
              if (idx < 12) {
                const localP = Math.max(
                  0,
                  Math.min(1, (stepProgress - (idx % 4) * 0.06) / 0.8)
                );
                const baseH = getTerrainHeight(
                  enemy.position.x,
                  enemy.position.z
                );
                enemy.group.position.y = baseH + Math.sin(now * 0.006 + idx) * 0.6;
                enemy.group.rotation.y = Math.atan2(-enemy.position.x, -enemy.position.z) + Math.sin(now * 0.012 + idx) * 0.25;
                enemy.leftArm.rotation.x = -0.9 - Math.sin(now * 0.008 + idx) * 0.35;
                enemy.rightArm.rotation.x = -0.9 + Math.cos(now * 0.008 + idx) * 0.35;
                const emergeScale = Math.max(0.01, localP * 1.35);
                enemy.group.scale.set(emergeScale, emergeScale, emergeScale);
                enemy.group.visible = true;
              }
            });

            const camAngle = now * 0.00045;
            const camRadius = 18 - stepProgress * 4;
            camera.position.set(
              Math.sin(camAngle) * camRadius,
              spawnGroundY + 4.5 + stepProgress * 3.5,
              Math.cos(camAngle) * camRadius
            );
            camera.lookAt(0, playerGroup.position.y + 1.2, 0);
          } else {
            if (state.purificationWaveMesh) {
              state.purificationWaveMesh.visible = false;
            }
            state.enemyInstances.forEach((enemy) => {
              enemy.group.visible = false;
            });

            const a = now * 0.0003;
            const r = 38 + stepProgress * 22;
            camera.position.set(
              Math.cos(a) * r,
              spawnGroundY + 24 + stepProgress * 12,
              Math.sin(a) * r
            );
            camera.lookAt(0, spawnGroundY + 8, 0);
          }
        }

        renderer.render(scene, camera);
        return;
      }

      if (state.screen === 'CLASH_CUTSCENE') {
        playerGroup.visible = true;
        fpViewModel.group.visible = false;
        alterEgo.group.visible = true;

        state.cutsceneStepTimer += dt;
        const stepProgress = Math.min(
          1,
          state.cutsceneStepTimer / CUTSCENE_ANIM_DURATION
        );
        setCutsceneProgress(stepProgress);

        if (state.cutsceneStepTimer >= CUTSCENE_ANIM_DURATION) {
          handleNextCutsceneStep();
        }

        const spawnGroundY = getTerrainHeight(0, 0);

        if (state.sovereignThrone) {
          state.sovereignThrone.group.visible = true;
          state.sovereignThrone.updateAbyssalEffects(now * 0.001, 1.0);
        }

        if (state.purificationWaveMesh) {
          state.purificationWaveMesh.visible = true;
          const riftScale = 1 + Math.sin(now * 0.004) * 0.35 + stepProgress * 6.5;
          state.purificationWaveMesh.scale.set(riftScale, riftScale, 1);
          (state.purificationWaveMesh.material as THREE.MeshBasicMaterial).opacity =
            0.55 + Math.sin(now * 0.01) * 0.25;
        }

        playerGroup.position.set(0, spawnGroundY + 1.4 + Math.sin(now * 0.004) * 0.25, 9.5);
        playerGroup.rotation.set(0, Math.PI, 0);

        humanoid.updateAnimation({
          dt,
          time: now,
          speed: 0,
          forwardInput: 0,
          rightInput: 0,
          isSprinting: false,
          isGrounded: false,
          isSwimming: false,
          headPitch: 0.1,
          attackProgress: stepProgress > 0.65 ? (stepProgress - 0.65) / 0.35 : 0,
          equippedWeapon: 'SWORD',
          bowDrawProgress: 0,
          bowReleaseTimer: 0,
          hasArrows: true,
          isSeatedOnThrone: false,
          isCorrupted: false,
          isCelestial: true,
        });

        const alterZ = -7.5 + stepProgress * 3.0;
        alterEgo.group.position.set(
          0,
          spawnGroundY + 1.5 + Math.cos(now * 0.0045) * 0.3,
          alterZ
        );
        alterEgo.group.rotation.set(0, 0, 0);

        alterEgo.updateAnimation({
          dt,
          time: now,
          speed: 0,
          forwardInput: 0,
          rightInput: 0,
          isSprinting: false,
          isGrounded: false,
          isSwimming: false,
          headPitch: -0.1,
          attackProgress: stepProgress > 0.5 ? (stepProgress - 0.5) * 2.0 : 0,
          equippedWeapon: 'SWORD',
          bowDrawProgress: 0,
          bowReleaseTimer: 0,
          hasArrows: true,
          isSeatedOnThrone: false,
          isCorrupted: true,
          isCelestial: false,
        });

        const shakeAmp = 0.28;
        const shakeX = Math.sin(now * 0.043) * shakeAmp;
        const shakeY = Math.cos(now * 0.051) * shakeAmp;

        if (state.cutsceneStepIndex === 0) {
          const angle = stepProgress * 1.2 - 0.6;
          camera.position.set(
            Math.sin(angle) * 18 + shakeX,
            spawnGroundY + 6.5 + stepProgress * 4.0 + shakeY,
            Math.cos(angle) * 18
          );
          camera.lookAt(0, spawnGroundY + 3.2, 1.0);
        } else {
          const orbitAngle = Math.PI * 0.5 + (stepProgress - 0.5) * 0.9;
          const radius = 14.5 - stepProgress * 2.5;
          camera.position.set(
            Math.sin(orbitAngle) * radius + shakeX,
            spawnGroundY + 4.2 + Math.sin(stepProgress * Math.PI) * 2.5 + shakeY,
            Math.cos(orbitAngle) * radius + 1.0
          );
          camera.lookAt(0, spawnGroundY + 2.6, 1.0);
        }

        renderer.render(scene, camera);
        return;
      }

      if (state.screen === 'COLLAPSE_BREAKTHROUGH') {
        playerGroup.visible = true;
        fpViewModel.group.visible = false;
        alterEgo.group.visible = true;
        alterEgo.group.scale.set(1.4, 1.4, 1.4);
        if (state.bossInstance) {
          state.bossInstance.group.visible = false;
        }

        const cY = getTerrainHeight(0, 0);
        playerGroup.position.set(-1.4, cY + 1.2, 0);
        playerGroup.rotation.set(0, Math.PI, 0);

        alterEgo.group.position.set(1.4, cY, 0);
        alterEgo.group.rotation.set(0, Math.PI, 0);

        humanoid.updateAnimation({
          dt,
          time: now,
          speed: 0,
          forwardInput: 0,
          rightInput: 0,
          isSprinting: false,
          isGrounded: true,
          isSwimming: false,
          headPitch: 0,
          equippedWeapon: 'SWORD',
          attackProgress: 0,
          bowDrawProgress: 0,
          bowReleaseTimer: 0,
          hasArrows: true,
          isSeatedOnThrone: false,
          isCorrupted: false,
          isCelestial: true,
        });

        alterEgo.updateAnimation({
          dt,
          time: now,
          speed: 0,
          forwardInput: 0,
          rightInput: 0,
          isSprinting: false,
          isGrounded: true,
          isSwimming: false,
          headPitch: 0,
          equippedWeapon: 'SWORD',
          attackProgress: 0,
          bowDrawProgress: 0,
          bowReleaseTimer: 0,
          hasArrows: true,
          isSeatedOnThrone: false,
          isCorrupted: true,
          isCelestial: false,
          glitchIntensity: 0.25 + Math.sin(now * 0.003) * 0.15,
        });

        const camBreathing = Math.sin(now * 0.0015) * 0.12;
        camera.position.set(0, cY + 2.3 + camBreathing, 6.2);
        camera.lookAt(0, cY + 1.8, 0);

        renderer.render(scene, camera);
        return;
      }

      if (state.screen === 'GAME_OVER') {
        fpViewModel.group.visible = false;
        playerGroup.visible = true;

        const slowDt = dt * 0.15;
        const groundY = getTerrainHeight(state.playerPos.x, state.playerPos.z);
        playerGroup.position.set(state.playerPos.x, groundY, state.playerPos.z);
        playerGroup.rotation.y = state.yaw;

        humanoid.updateAnimation({
          dt: slowDt,
          time: now * 0.18,
          speed: 0,
          forwardInput: 0,
          rightInput: 0,
          isSprinting: false,
          isGrounded: true,
          isSwimming: false,
          headPitch: -0.65,
          equippedWeapon: state.equippedWeapon,
          attackProgress: 0,
          bowDrawProgress: 0,
          bowReleaseTimer: 0,
          hasArrows: state.arrows > 0,
          isSeatedOnThrone: false,
          isCorrupted: isCorruptedRuler,
          isCelestial: isTranscendentSavior,
        });

        const slowOrbit = now * 0.00012;
        const radius = 7.2;
        const camX = state.playerPos.x + Math.sin(state.yaw + slowOrbit) * radius;
        const camZ = state.playerPos.z + Math.cos(state.yaw + slowOrbit) * radius;
        const camY = Math.max(getTerrainHeight(camX, camZ) + 1.5, groundY + 3.8);
        const tilt = Math.sin(now * 0.00035) * 0.08;
        camera.up.set(Math.sin(tilt), Math.cos(tilt), 0);
        camera.position.lerp(new THREE.Vector3(camX, camY, camZ), Math.min(1, dt * 2.5));
        camera.lookAt(state.playerPos.x, groundY + 1.1, state.playerPos.z);

        renderer.render(scene, camera);
        return;
      }

      // --- E. GAMEPLAY ACTIF (PLAYING) ---
      if (state.screen === 'PLAYING') {
        const orbsCollectedCount = state.orbs.filter((o) => o.collected).length;
        const activePowers = getActivePowersCount();

        if (state.dashCooldownTimer > 0) {
          state.dashCooldownTimer = Math.max(0, state.dashCooldownTimer - dt);
        }
        if (state.novaCooldownTimer > 0) {
          state.novaCooldownTimer = Math.max(0, state.novaCooldownTimer - dt);
        }
        if (state.divineInvulnTimer > 0) {
          state.divineInvulnTimer = Math.max(0, state.divineInvulnTimer - dt);
        }

        if (isTranscendentSavior) {
          state.health = Math.min(100, state.health + 18.0 * dt);
          state.stamina = 100;
          state.oxygen = 100;
        } else if (activePowers >= 6 && state.health < 100) {
          state.health = Math.min(100, state.health + 3.5 * dt);
        }

        if (activePowers >= 8 && state.arrows < 20) {
          state.arrowRegenTimer += dt;
          if (state.arrowRegenTimer >= 4.0) {
            state.arrowRegenTimer = 0;
            state.arrows += 1;
          }
        }

        const k = state.keys;
        const locked = document.pointerLockElement === container;
        if (!locked && state.mouseCaptured && state.isMouseInsideWindow) {
          const edgeThresholdX = 0.52;
          const absX = Math.abs(state.mouseNDC.x);
          if (absX > edgeThresholdX) {
            const strength = (absX - edgeThresholdX) / (1 - edgeThresholdX);
            const turnRate = 2.85;
            state.yaw -= Math.sign(state.mouseNDC.x) * strength * strength * turnRate * dt;
          }

          const edgeThresholdY = 0.68;
          const absY = Math.abs(state.mouseNDC.y);
          if (absY > edgeThresholdY) {
            const strengthY = (absY - edgeThresholdY) / (1 - edgeThresholdY);
            state.pitch = Math.max(
              -1.45,
              Math.min(
                1.45,
                state.pitch - Math.sign(state.mouseNDC.y) * strengthY * 1.5 * dt
              )
            );
          }
        }

        if (k['ArrowLeft']) {
          state.yaw += 2.2 * dt;
        }
        if (k['ArrowRight']) {
          state.yaw -= 2.2 * dt;
        }

        const eyeOffset = 2.0;
        const groundHeight = getTerrainHeight(state.playerPos.x, state.playerPos.z);

        const waterDepthHere = WATER_LEVEL - groundHeight;
        const isSwimming =
          waterDepthHere > 1.05 && state.playerPos.y <= WATER_LEVEL + 0.65;
        const isUnderwater = state.playerPos.y < WATER_LEVEL - 0.12;

        if (isSwimming && !state.wasSwimming) {
          soundFX.playSplash();
        }
        state.wasSwimming = isSwimming;

        const forwardInput =
          (k['KeyW'] || k['KeyZ'] || k['ArrowUp'] ? 1 : 0) -
          (k['KeyS'] || k['ArrowDown'] ? 1 : 0);
        const rightInput =
          (k['KeyD'] ? 1 : 0) -
          (k['KeyA'] || k['KeyQ'] ? 1 : 0);

        const isMoving = forwardInput !== 0 || rightInput !== 0;

        const wantsSprint =
          Boolean(k['ShiftLeft'] || k['ShiftRight']) &&
          isMoving &&
          forwardInput >= 0 &&
          !state.isDrawingBow;
        if (state.stamina <= 1) {
          state.exhaustedCooldown = true;
        } else if (state.stamina >= 25) {
          state.exhaustedCooldown = false;
        }

        const isSprinting =
          wantsSprint && !state.exhaustedCooldown && state.stamina > 0;
        if (isSprinting && !isTranscendentSavior) {
          const drainRate = Math.max(8, 20 - activePowers * 1.1);
          state.stamina = Math.max(0, state.stamina - drainRate * dt);
        } else if (!isTranscendentSavior) {
          state.stamina = Math.min(100, state.stamina + (16 + activePowers) * dt);
        }

        if (isUnderwater && !isTranscendentSavior) {
          const oxyDrain = activePowers >= 7 ? 2.2 : 6.8;
          state.oxygen = Math.max(0, state.oxygen - oxyDrain * dt);
          if (state.oxygen <= 0) {
            state.health = Math.max(0, state.health - 18.0 * dt);
          }
        } else if (!isTranscendentSavior) {
          state.oxygen = Math.min(100, state.oxygen + 30 * dt);
        }

        if (state.health <= 0) {
          triggerGameOver();
          return;
        }

        const powerSpeedBonus = activePowers >= 3 ? 1.0 + activePowers * 0.035 : 1.0;

        if (isSwimming) {
          const swimSpeed = (isSprinting ? 13.5 : 8.5) * powerSpeedBonus;

          const forward2D = new THREE.Vector3(
            -Math.sin(state.yaw),
            0,
            -Math.cos(state.yaw)
          );
          const right2D = new THREE.Vector3(
            Math.cos(state.yaw),
            0,
            -Math.sin(state.yaw)
          );

          const moveHoriz = new THREE.Vector3();
          moveHoriz.addScaledVector(forward2D, forwardInput);
          moveHoriz.addScaledVector(right2D, rightInput);
          if (moveHoriz.lengthSq() > 1) moveHoriz.normalize();

          state.playerVel.x = THREE.MathUtils.lerp(
            state.playerVel.x,
            moveHoriz.x * swimSpeed,
            Math.min(1, dt * 6.0)
          );
          state.playerVel.z = THREE.MathUtils.lerp(
            state.playerVel.z,
            moveHoriz.z * swimSpeed,
            Math.min(1, dt * 6.0)
          );

          let targetVelY = 0;
          if (forwardInput !== 0) {
            targetVelY += Math.sin(state.pitch) * forwardInput * swimSpeed * 0.95;
          }
          if (k['Space']) {
            targetVelY = 7.5;
          } else if (k['KeyC'] || k['ControlLeft']) {
            targetVelY = -7.5;
          }

          if (state.oxygen <= 0.5) {
            targetVelY = 8.5;
          } else if (!k['Space'] && !k['KeyC'] && !k['ControlLeft'] && Math.abs(targetVelY) < 0.8) {
            const surfaceEyeTarget = WATER_LEVEL + 0.38;
            if (state.playerPos.y > WATER_LEVEL - 0.8) {
              targetVelY += (surfaceEyeTarget - state.playerPos.y) * 3.2;
            }
          }

          state.playerVel.y = THREE.MathUtils.lerp(
            state.playerVel.y,
            targetVelY,
            Math.min(1, dt * 6.0)
          );

          state.playerPos.addScaledVector(state.playerVel, dt);

          const newGroundH = getTerrainHeight(state.playerPos.x, state.playerPos.z);
          if (state.playerPos.y < newGroundH + eyeOffset) {
            state.playerPos.y = newGroundH + eyeOffset;
            state.playerVel.y = Math.max(0, state.playerVel.y);
          }

          if (state.playerPos.y > WATER_LEVEL + 0.25 && k['Space']) {
            state.playerVel.y = 9.5;
          }

          state.isGrounded = false;
        } else {
          const forward = new THREE.Vector3(
            -Math.sin(state.yaw),
            0,
            -Math.cos(state.yaw)
          );
          const right = new THREE.Vector3(
            Math.cos(state.yaw),
            0,
            -Math.sin(state.yaw)
          );

          const moveDir = new THREE.Vector3();
          moveDir.addScaledVector(forward, forwardInput);
          moveDir.addScaledVector(right, rightInput);
          if (moveDir.lengthSq() > 0.001) moveDir.normalize();

          const baseWalkSpeed = state.isDrawingBow
            ? 6.5
            : forwardInput < 0
            ? 8.5
            : 11.5 * powerSpeedBonus;
          const targetSpeed = isSprinting ? 20.0 * powerSpeedBonus : baseWalkSpeed;
          const accel = state.isGrounded ? 12.0 : 4.5;

          state.playerVel.x = THREE.MathUtils.lerp(
            state.playerVel.x,
            moveDir.x * targetSpeed,
            Math.min(1, dt * accel)
          );
          state.playerVel.z = THREE.MathUtils.lerp(
            state.playerVel.z,
            moveDir.z * targetSpeed,
            Math.min(1, dt * accel)
          );

          if (!isMoving && Math.hypot(state.playerVel.x, state.playerVel.z) < 0.08) {
            state.playerVel.x = 0;
            state.playerVel.z = 0;
          }

          const GRAVITY = 30.0;
          state.playerVel.y -= GRAVITY * dt;
          state.playerPos.addScaledVector(state.playerVel, dt);
        }

        const playerRadius = 0.55;
        const currentFeetY = state.playerPos.y - eyeOffset;

        for (let i = 0; i < obstacleColliders.length; i++) {
          const col = obstacleColliders[i];
          if (currentFeetY > col.maxY - 0.35) continue;

          const dx = state.playerPos.x - col.x;
          const dz = state.playerPos.z - col.z;
          const minDist = col.radius + playerRadius;

          if (Math.abs(dx) > minDist || Math.abs(dz) > minDist) continue;

          const distSq = dx * dx + dz * dz;
          if (distSq < minDist * minDist && distSq > 0.00001) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const nz = dz / dist;
            const overlap = minDist - dist;

            state.playerPos.x += nx * overlap;
            state.playerPos.z += nz * overlap;

            const vn = state.playerVel.x * nx + state.playerVel.z * nz;
            if (vn < 0) {
              state.playerVel.x -= vn * nx;
              state.playerVel.z -= vn * nz;
            }
          }
        }

        const arenaOutBound = WORLD_SIZE / 2 - 4;
        if (
          state.playerPos.y < -25 ||
          Math.abs(state.playerPos.x) > arenaOutBound ||
          Math.abs(state.playerPos.z) > arenaOutBound
        ) {
          triggerGameOver();
          return;
        }

        const maxCoord = WORLD_SIZE / 2 - 15;
        state.playerPos.x = Math.max(
          -maxCoord,
          Math.min(maxCoord, state.playerPos.x)
        );
        state.playerPos.z = Math.max(
          -maxCoord,
          Math.min(maxCoord, state.playerPos.z)
        );

        if (!isSwimming) {
          const finalGroundHeight = getTerrainHeight(
            state.playerPos.x,
            state.playerPos.z
          );
          if (state.playerPos.y <= finalGroundHeight + eyeOffset) {
            state.playerPos.y = finalGroundHeight + eyeOffset;
            state.playerVel.y = 0;
            state.isGrounded = true;

            if (k['Space']) {
              state.playerVel.y = activePowers >= 3 ? 16.8 : 13.5;
              state.isGrounded = false;
              soundFX.playJump();
            }
          } else {
            state.isGrounded = false;
          }
        }

        // --- MISE À JOUR DE LA CAMÉRA ---
        const horizontalSpeed = Math.hypot(
          state.playerVel.x,
          state.playerVel.z
        );
        camera.up.set(0, 1, 0);

        if (state.cameraMode === 'FIRST_PERSON') {
          camera.position.set(
            state.playerPos.x,
            state.playerPos.y,
            state.playerPos.z
          );
          camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
        } else {
          const camDist = 5.6;
          const pivotY = state.playerPos.y + 0.15;
          const camX =
            state.playerPos.x +
            Math.sin(state.yaw) * Math.cos(state.pitch) * camDist;
          const camZ =
            state.playerPos.z +
            Math.cos(state.yaw) * Math.cos(state.pitch) * camDist;
          const camTerrainY = getTerrainHeight(camX, camZ) + 0.8;
          const camY = Math.max(
            camTerrainY,
            pivotY - Math.sin(state.pitch) * camDist
          );

          camera.position.set(camX, camY, camZ);
          camera.lookAt(state.playerPos.x, pivotY, state.playerPos.z);
        }

        const targetFov =
          state.equippedWeapon === 'BOW' && state.isDrawingBow
            ? 70 - state.bowDrawProgress * 10
            : 70;
        if (Math.abs(camera.fov - targetFov) > 0.05) {
          camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1, dt * 10));
          camera.updateProjectionMatrix();
        }

        // --- MISE À JOUR DU PERSONNAGE JOUEUR (3P) & VIEWMODEL (1P) ---
        const damageMultiplier = isCorruptedRuler || isTranscendentSavior ? 2.0 : activePowers >= 5 ? 1.5 : 1.0;

        let attackProgress = 0;
        if (state.attackTimer > 0) {
          state.attackTimer = Math.max(0, state.attackTimer - dt);
          attackProgress = 1.0 - state.attackTimer / state.attackDuration;

          if (
            state.equippedWeapon === 'SWORD' &&
            !state.swordHitDealt &&
            attackProgress >= 0.35
          ) {
            state.swordHitDealt = true;
            const lookDirX = -Math.sin(state.yaw);
            const lookDirZ = -Math.cos(state.yaw);

            state.enemyInstances.forEach((enemy) => {
              if (!enemy.alive) return;
              const dx = enemy.position.x - state.playerPos.x;
              const dz = enemy.position.z - state.playerPos.z;
              const dy = enemy.position.y + 1.0 - state.playerPos.y;
              const dist = Math.hypot(dx, dz);

              if (dist < 4.6 && Math.abs(dy) < 3.0) {
                const invDist = 1 / Math.max(0.001, dist);
                const dot = (dx * invDist) * lookDirX + (dz * invDist) * lookDirZ;
                if (dot > 0.25 || dist < 1.8) {
                  damageEnemy(
                    enemy,
                    Math.round(45 * damageMultiplier),
                    dx * invDist,
                    dz * invDist
                  );
                }
              }
            });

            const boss = state.bossInstance;
            if (boss && boss.active && !boss.defeated) {
              const dxB = boss.position.x - state.playerPos.x;
              const dzB = boss.position.z - state.playerPos.z;
              const distB = Math.hypot(dxB, dzB);
              if (distB < 6.8) {
                const invB = 1 / Math.max(0.001, distB);
                const dotB = (dxB * invB) * lookDirX + (dzB * invB) * lookDirZ;
                if (dotB > 0.15 || distB < 3.5) {
                  damageBoss(
                    boss,
                    Math.round(55 * damageMultiplier),
                    dxB * invB,
                    dzB * invB
                  );
                }
              }
            }
          }
        }

        playerGroup.position.set(
          state.playerPos.x,
          state.playerPos.y - eyeOffset,
          state.playerPos.z
        );
        playerGroup.rotation.y = state.yaw;
        playerGroup.visible = state.cameraMode === 'THIRD_PERSON';
        fpViewModel.group.visible = state.cameraMode === 'FIRST_PERSON';

        if (isCorruptedRuler && horizontalSpeed > 1.5) {
          purpleStepTrailTimer += dt;
          if (purpleStepTrailTimer >= 0.08) {
            purpleStepTrailTimer = 0;
            const trailGroup = new THREE.Group();
            const pts: THREE.Vector3[] = [];
            const basePos = new THREE.Vector3(
              state.playerPos.x + (Math.random() - 0.5) * 0.5,
              state.playerPos.y - eyeOffset + 0.15,
              state.playerPos.z + (Math.random() - 0.5) * 0.5
            );
            for (let s = 0; s <= 4; s++) {
              pts.push(
                new THREE.Vector3(
                  basePos.x + (Math.random() - 0.5) * 0.45,
                  basePos.y + s * 0.35,
                  basePos.z + (Math.random() - 0.5) * 0.45
                )
              );
            }
            const arcLine = new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(pts),
              new THREE.LineBasicMaterial({
                color: Math.random() > 0.4 ? 0xa855f7 : 0xf43f5e,
              })
            );
            trailGroup.add(arcLine);
            scene.add(trailGroup);
            state.visualEffects.push({
              mesh: trailGroup,
              age: 0,
              maxAge: 0.42,
              type: 'CONSTELLATION_TRAIL',
            });
          }
        }

        humanoid.updateAnimation({
          dt,
          time: now,
          speed: horizontalSpeed,
          forwardInput,
          rightInput,
          isSprinting,
          isGrounded: state.isGrounded,
          isSwimming,
          headPitch: state.pitch,
          equippedWeapon: state.equippedWeapon,
          attackProgress,
          bowDrawProgress: state.bowDrawProgress,
          bowReleaseTimer: state.bowReleaseAnimTimer,
          hasArrows: state.arrows > 0 || isCorruptedRuler || isTranscendentSavior,
          isSeatedOnThrone: false,
          isCorrupted: isCorruptedRuler,
          isCelestial: isTranscendentSavior,
        });

        fpViewModel.updateAnimation({
          dt,
          time: now,
          speed: horizontalSpeed,
          isSprinting,
          isGrounded: state.isGrounded,
          isSwimming,
          equippedWeapon: state.equippedWeapon,
          attackProgress,
          bowDrawProgress: state.bowDrawProgress,
          bowReleaseTimer: state.bowReleaseAnimTimer,
          hasArrows: state.arrows > 0 || isCorruptedRuler || isTranscendentSavior,
          isCorrupted: isCorruptedRuler,
          isCelestial: isTranscendentSavior,
        });

        if (state.bowCooldownTimer > 0) {
          state.bowCooldownTimer = Math.max(0, state.bowCooldownTimer - dt);
        }
        if (state.bowReleaseAnimTimer > 0) {
          state.bowReleaseAnimTimer = Math.max(0, state.bowReleaseAnimTimer - dt);
        }

        if (state.isDrawingBow) {
          state.bowDrawProgress = Math.min(
            1,
            state.bowDrawProgress + dt / BOW_FULL_DRAW_DURATION
          );
          if (state.bowAutoReleaseOnFull && state.bowDrawProgress >= 0.88) {
            fireChargedBowArrow(state.bowDrawProgress);
          }
        }

        for (let i = state.arrowProjectiles.length - 1; i >= 0; i--) {
          const arrow = state.arrowProjectiles[i];
          if (!arrow.active) continue;

          arrow.age += dt;
          if (!arrow.isLightningBolt && !arrow.isCosmicArrow) {
            arrow.velocity.y -= ARROW_GRAVITY * dt;
          }

          const nextPos = arrow.position
            .clone()
            .addScaledVector(arrow.velocity, dt);

          arrow.mesh.position.copy(nextPos);
          arrow.mesh.lookAt(nextPos.clone().add(arrow.velocity));
          if (arrow.isCosmicArrow) {
            arrow.mesh.rotateZ(arrow.age * 10);
          }
          arrow.position.copy(nextPos);

          let hitSomething = false;

          const boss = state.bossInstance;
          if (boss && boss.active && !boss.defeated) {
            const dxB = arrow.position.x - boss.position.x;
            const dzB = arrow.position.z - boss.position.z;
            const dyB = arrow.position.y - (state.isDimensionalClashActive ? boss.position.y + 1.2 : boss.position.y + 4.5);
            const distB2 = dxB * dxB + dzB * dzB;
            if (state.isDimensionalClashActive && state.alterEgoPhase === 1 && distB2 < 20.0 && Math.abs(dyB) < 4.5) {
              hitSomething = true;
              soundFX.playSwordSwing();
              soundFX.playLightningDash();
              const pX = state.playerPos.x - boss.position.x;
              const pZ = state.playerPos.z - boss.position.z;
              const pDist = Math.hypot(pX, pZ);
              const pDirX = pX / Math.max(0.001, pDist);
              const pDirZ = pZ / Math.max(0.001, pDist);
              boss.position.x = state.playerPos.x - pDirX * 2.2;
              boss.position.z = state.playerPos.z - pDirZ * 2.2;
              boss.position.y = getTerrainHeight(boss.position.x, boss.position.z);
              boss.attackAnimTimer = 0.45;
              boss.attackCooldown = 0.5;
              state.alterEgoComboStep = 1;
              if (state.divineInvulnTimer <= 0) {
                state.health = Math.max(0, state.health - 22);
                soundFX.playPlayerHurt();
              }
              const counterRing = new THREE.Mesh(
                new THREE.RingGeometry(0.5, 2.5, 24),
                new THREE.MeshBasicMaterial({
                  color: 0xa855f7,
                  transparent: true,
                  opacity: 0.9,
                  side: THREE.DoubleSide,
                  blending: THREE.AdditiveBlending,
                  depthWrite: false,
                })
              );
              counterRing.rotation.x = -Math.PI / 2;
              counterRing.position.set(boss.position.x, boss.position.y + 0.3, boss.position.z);
              scene.add(counterRing);
              state.visualEffects.push({
                mesh: counterRing,
                age: 0,
                maxAge: 0.45,
                type: 'NOVA_RING',
              });
              showToast("L'Autre Réalité pare votre tir et contre-attaque dans votre dos !");
            } else if (distB2 < (state.isDimensionalClashActive ? 4.5 : 7.5) && Math.abs(dyB) < 5.0) {
              const horizLen = Math.max(
                0.01,
                Math.hypot(arrow.velocity.x, arrow.velocity.z)
              );
              damageBoss(
                boss,
                Math.round(70 * damageMultiplier),
                arrow.velocity.x / horizLen,
                arrow.velocity.z / horizLen
              );
              hitSomething = true;
            }
          }

          if (!hitSomething) {
            for (let e = 0; e < state.enemyInstances.length; e++) {
              const enemy = state.enemyInstances[e];
              if (!enemy.alive) continue;
              const dx = arrow.position.x - enemy.position.x;
              const dz = arrow.position.z - enemy.position.z;
              const dy = arrow.position.y - (enemy.position.y + 1.15);
              if (dx * dx + dz * dz < 1.5 && Math.abs(dy) < 1.55) {
                const horizLen = Math.max(
                  0.01,
                  Math.hypot(arrow.velocity.x, arrow.velocity.z)
                );
                damageEnemy(
                  enemy,
                  Math.round((arrow.isLightningBolt || arrow.isCosmicArrow ? 80 : 55) * damageMultiplier),
                  arrow.velocity.x / horizLen,
                  arrow.velocity.z / horizLen
                );
                hitSomething = true;
                break;
              }
            }
          }

          const terrainY = getTerrainHeight(arrow.position.x, arrow.position.z);
          if (hitSomething || arrow.position.y <= terrainY || arrow.age > 5.0) {
            arrow.active = false;
            scene.remove(arrow.mesh);
            state.arrowProjectiles.splice(i, 1);
          }
        }

        // --- IA & COMBAT DU BOSS TITAN MALAKOR ---
        const boss = state.bossInstance;
        if (boss && boss.active && !boss.defeated) {
          if (state.isDimensionalClashActive) {
            boss.group.visible = false;
            alterEgo.group.visible = true;

            const dxP = state.playerPos.x - boss.position.x;
            const dzP = state.playerPos.z - boss.position.z;
            const distP = Math.hypot(dxP, dzP);
            const dirX = dxP / Math.max(0.001, distP);
            const dirZ = dzP / Math.max(0.001, distP);

            boss.yaw = Math.atan2(-dirX, -dirZ);

            if (boss.attackCooldown > 0) boss.attackCooldown = Math.max(0, boss.attackCooldown - dt);
            if (boss.attackAnimTimer > 0) boss.attackAnimTimer = Math.max(0, boss.attackAnimTimer - dt);
            if (boss.slamCooldown > 0) boss.slamCooldown = Math.max(0, boss.slamCooldown - dt);
            state.alterEgoDashCooldown = Math.max(0, state.alterEgoDashCooldown - dt);
            state.alterEgoLightningCooldown = Math.max(0, state.alterEgoLightningCooldown - dt);
            state.alterEgoTeleportCooldown = Math.max(0, state.alterEgoTeleportCooldown - dt);
            state.alterEgoRiftCooldown = Math.max(0, state.alterEgoRiftCooldown - dt);

            const phase = state.alterEgoPhase;
            const phaseSpeed = phase === 3 ? 14.5 : phase === 2 ? 9.5 : 12.0;
            const stopDist = phase === 1 ? 2.8 : phase === 2 ? 4.2 : 2.6;
            const targetSpeed = distP > stopDist ? phaseSpeed : 0;

            boss.velocity.x = THREE.MathUtils.lerp(
              boss.velocity.x,
              dirX * targetSpeed,
              Math.min(1, dt * 7)
            );
            boss.velocity.z = THREE.MathUtils.lerp(
              boss.velocity.z,
              dirZ * targetSpeed,
              Math.min(1, dt * 7)
            );

            boss.position.x += boss.velocity.x * dt;
            boss.position.z += boss.velocity.z * dt;
            boss.position.y = getTerrainHeight(boss.position.x, boss.position.z);

            alterEgo.group.position.copy(boss.position);
            alterEgo.group.rotation.y = boss.yaw + Math.PI;

            const bSpd = Math.hypot(boss.velocity.x, boss.velocity.z);

            if (phase === 1) {
              if (state.alterEgoDashCooldown <= 0 && distP > 5.5 && distP < 32.0) {
                state.alterEgoDashCooldown = 3.2 + Math.random() * 1.5;
                soundFX.playLightningDash();
                const trailMesh = new THREE.Mesh(
                  new THREE.RingGeometry(0.5, 2.2, 20),
                  new THREE.MeshBasicMaterial({
                    color: 0x4a044e,
                    transparent: true,
                    opacity: 0.9,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                  })
                );
                trailMesh.rotation.x = -Math.PI / 2;
                trailMesh.position.copy(boss.position);
                scene.add(trailMesh);
                state.visualEffects.push({
                  mesh: trailMesh,
                  age: 0,
                  maxAge: 0.45,
                  type: 'NOVA_RING',
                });
                boss.position.x = state.playerPos.x - dirX * 2.2;
                boss.position.z = state.playerPos.z - dirZ * 2.2;
                boss.position.y = getTerrainHeight(boss.position.x, boss.position.z);
                boss.velocity.set(dirX * 6, 0, dirZ * 6);
                boss.attackCooldown = 0.15;
              }

              if (distP < 3.8 && boss.attackCooldown <= 0) {
                const step = state.alterEgoComboStep;
                boss.attackAnimTimer = 0.38;
                soundFX.playSwordSwing();
                if (step === 0) {
                  boss.attackCooldown = 0.4;
                  state.alterEgoComboStep = 1;
                  if (state.divineInvulnTimer <= 0) {
                    state.health = Math.max(0, state.health - 16);
                    soundFX.playPlayerHurt();
                  }
                } else if (step === 1) {
                  boss.attackCooldown = 0.42;
                  state.alterEgoComboStep = 2;
                  if (state.divineInvulnTimer <= 0) {
                    state.health = Math.max(0, state.health - 20);
                    soundFX.playPlayerHurt();
                  }
                } else {
                  boss.attackCooldown = 1.15;
                  state.alterEgoComboStep = 0;
                  soundFX.playBossSlam();
                  if (state.divineInvulnTimer <= 0) {
                    state.health = Math.max(0, state.health - 26);
                    state.playerVel.x += dirX * 14;
                    state.playerVel.z += dirZ * 14;
                    state.playerVel.y = 6.0;
                    soundFX.playPlayerHurt();
                  }
                }
              }
            } else if (phase === 2) {
              if (boss.slamCooldown <= 0 && distP < 14.0) {
                boss.slamCooldown = 5.2;
                boss.attackAnimTimer = 0.65;
                soundFX.playBossSlam();
                const slamGeo = new THREE.RingGeometry(1.2, 4.5, 32);
                slamGeo.rotateX(-Math.PI / 2);
                const slamMat = new THREE.MeshBasicMaterial({
                  color: 0xf43f5e,
                  transparent: true,
                  opacity: 0.95,
                  side: THREE.DoubleSide,
                  blending: THREE.AdditiveBlending,
                  depthWrite: false,
                });
                const slamMesh = new THREE.Mesh(slamGeo, slamMat);
                slamMesh.position.set(boss.position.x, boss.position.y + 0.35, boss.position.z);
                scene.add(slamMesh);
                state.visualEffects.push({
                  mesh: slamMesh,
                  age: 0,
                  maxAge: 0.68,
                  type: 'BOSS_SLAM_RING',
                });
                if (distP < 11.0 && state.divineInvulnTimer <= 0) {
                  state.health = Math.max(0, state.health - 26);
                  state.playerVel.x += dirX * 18;
                  state.playerVel.z += dirZ * 18;
                  state.playerVel.y = 8.5;
                  soundFX.playPlayerHurt();
                }
              } else if (state.alterEgoLightningCooldown <= 0) {
                state.alterEgoLightningCooldown = 4.2;
                boss.attackAnimTimer = 0.95;
                const targetX = state.playerPos.x;
                const targetZ = state.playerPos.z;
                const targetY = getTerrainHeight(targetX, targetZ);
                const telegGeo = new THREE.RingGeometry(0.4, 3.2, 32);
                telegGeo.rotateX(-Math.PI / 2);
                const telegMat = new THREE.MeshBasicMaterial({
                  color: 0xff1744,
                  transparent: true,
                  opacity: 0.85,
                  side: THREE.DoubleSide,
                  blending: THREE.AdditiveBlending,
                  depthWrite: false,
                });
                const telegMesh = new THREE.Mesh(telegGeo, telegMat);
                telegMesh.position.set(targetX, targetY + 0.08, targetZ);
                scene.add(telegMesh);
                state.visualEffects.push({
                  mesh: telegMesh,
                  age: 0,
                  maxAge: 1.05,
                  targetX,
                  targetZ,
                  type: 'SCARLET_TELEGRAPH',
                });
              } else if (distP < 3.2 && boss.attackCooldown <= 0) {
                boss.attackCooldown = 1.2;
                boss.attackAnimTimer = 0.45;
                soundFX.playSwordSwing();
                if (state.divineInvulnTimer <= 0) {
                  state.health = Math.max(0, state.health - 22);
                  soundFX.playPlayerHurt();
                }
              }
            } else if (phase === 3) {
              if (state.alterEgoTeleportCooldown <= 0) {
                state.alterEgoTeleportCooldown = 1.6 + Math.random() * 0.9;
                soundFX.playVoidDimensionSeal();
                const warpMesh = new THREE.Mesh(
                  new THREE.RingGeometry(0.5, 2.8, 24),
                  new THREE.MeshBasicMaterial({
                    color: 0xd946ef,
                    transparent: true,
                    opacity: 0.9,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                  })
                );
                warpMesh.rotation.x = -Math.PI / 2;
                warpMesh.position.copy(boss.position);
                scene.add(warpMesh);
                state.visualEffects.push({
                  mesh: warpMesh,
                  age: 0,
                  maxAge: 0.42,
                  type: 'NOVA_RING',
                });

                const ang = Math.random() * Math.PI * 2;
                const d = 3.2 + Math.random() * 4.5;
                const newX = state.playerPos.x + Math.cos(ang) * d;
                const newZ = state.playerPos.z + Math.sin(ang) * d;
                const newY = getTerrainHeight(newX, newZ);
                boss.position.set(newX, newY, newZ);
                boss.velocity.set(0, 0, 0);
                boss.attackAnimTimer = 0.4;
                boss.attackCooldown = 0.45;
              }

              if (state.alterEgoRiftCooldown <= 0) {
                state.alterEgoRiftCooldown = 4.0 + Math.random() * 1.5;
                const riftX = state.playerPos.x + (Math.random() - 0.5) * 6;
                const riftZ = state.playerPos.z + (Math.random() - 0.5) * 6;
                const riftY = getTerrainHeight(riftX, riftZ);
                const riftGeo = new THREE.RingGeometry(0.6, 3.4, 28);
                riftGeo.rotateX(-Math.PI / 2);
                const riftMat = new THREE.MeshBasicMaterial({
                  color: 0x9333ea,
                  transparent: true,
                  opacity: 0.85,
                  side: THREE.DoubleSide,
                  blending: THREE.AdditiveBlending,
                  depthWrite: false,
                });
                const riftMesh = new THREE.Mesh(riftGeo, riftMat);
                riftMesh.position.set(riftX, riftY + 0.08, riftZ);
                scene.add(riftMesh);
                state.visualEffects.push({
                  mesh: riftMesh,
                  age: 0,
                  maxAge: 4.5,
                  targetX: riftX,
                  targetZ: riftZ,
                  type: 'REALITY_RIFT',
                });
              }

              if (distP < 3.5 && boss.attackCooldown <= 0) {
                boss.attackCooldown = 0.55;
                boss.attackAnimTimer = 0.35;
                soundFX.playSwordSwing();
                if (state.divineInvulnTimer <= 0) {
                  state.health = Math.max(0, state.health - 24);
                  state.playerVel.x += dirX * 8;
                  state.playerVel.z += dirZ * 8;
                  soundFX.playPlayerHurt();
                }
              }
            }

            alterEgo.updateAnimation({
              dt,
              time: now,
              speed: bSpd,
              forwardInput: bSpd > 0.5 ? 1 : 0,
              rightInput: 0,
              isSprinting: bSpd > 3.5,
              isGrounded: true,
              isSwimming: false,
              headPitch: 0,
              attackProgress:
                boss.attackAnimTimer > 0
                  ? 1 - boss.attackAnimTimer / 0.5
                  : 0,
              equippedWeapon: 'SWORD',
              bowDrawProgress: 0,
              bowReleaseTimer: 0,
              hasArrows: true,
              isSeatedOnThrone: false,
              isCorrupted: true,
              isCelestial: false,
              glitchIntensity: phase === 3 ? 1.0 : 0,
            });
          } else {
            alterEgo.group.visible = false;

            boss.orbitingOrbs.rotation.y += dt * 2.0;
            boss.chestReceptacle.rotation.z += dt * 2.5;

            const dxP = state.playerPos.x - boss.position.x;
            const dzP = state.playerPos.z - boss.position.z;
            const distP = Math.hypot(dxP, dzP);
            const dirX = dxP / Math.max(0.001, distP);
            const dirZ = dzP / Math.max(0.001, distP);

            boss.yaw = Math.atan2(-dirX, -dirZ);

            if (boss.attackCooldown > 0) {
              boss.attackCooldown = Math.max(0, boss.attackCooldown - dt);
            }
            if (boss.slamCooldown > 0) {
              boss.slamCooldown = Math.max(0, boss.slamCooldown - dt);
            }
            if (boss.attackAnimTimer > 0) {
              boss.attackAnimTimer = Math.max(0, boss.attackAnimTimer - dt);
            }

            const bossSpeed = distP > 5.2 ? 7.8 : 0;
            boss.velocity.x = THREE.MathUtils.lerp(
              boss.velocity.x,
              dirX * bossSpeed,
              Math.min(1, dt * 5)
            );
            boss.velocity.z = THREE.MathUtils.lerp(
              boss.velocity.z,
              dirZ * bossSpeed,
              Math.min(1, dt * 5)
            );

            boss.position.x += boss.velocity.x * dt;
            boss.position.z += boss.velocity.z * dt;
            boss.position.y = getTerrainHeight(boss.position.x, boss.position.z);

            boss.group.position.copy(boss.position);
            boss.group.rotation.y = boss.yaw;

            const bSpd = Math.hypot(boss.velocity.x, boss.velocity.z);

            if (bSpd > 0.5) {
              boss.walkPhase += dt * bSpd * 0.65;
              boss.leftLeg.rotation.x = Math.sin(boss.walkPhase) * 0.55;
              boss.rightLeg.rotation.x = -Math.sin(boss.walkPhase) * 0.55;
              boss.leftArm.rotation.x = -Math.sin(boss.walkPhase) * 0.45;
            } else {
              boss.leftLeg.rotation.x *= 0.85;
              boss.rightLeg.rotation.x *= 0.85;
              boss.leftArm.rotation.x *= 0.85;
            }

            if (distP < 12.5 && boss.slamCooldown <= 0) {
              boss.slamCooldown = 5.5;
              boss.attackAnimTimer = 0.55;
              soundFX.playBossSlam();

              const slamGeo = new THREE.RingGeometry(1.2, 3.0, 32);
              slamGeo.rotateX(-Math.PI / 2);
              const slamMat = new THREE.MeshBasicMaterial({
                color: 0xf43f5e,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              });
              const slamMesh = new THREE.Mesh(slamGeo, slamMat);
              slamMesh.position.set(
                boss.position.x,
                boss.position.y + 0.4,
                boss.position.z
              );
              scene.add(slamMesh);
              state.visualEffects.push({
                mesh: slamMesh,
                age: 0,
                maxAge: 0.65,
                type: 'BOSS_SLAM_RING',
              });

              if (distP < 11.5 && state.divineInvulnTimer <= 0) {
                state.health = Math.max(0, state.health - 24);
                state.playerVel.x += dirX * 16;
                state.playerVel.z += dirZ * 16;
                state.playerVel.y = 8.5;
                soundFX.playPlayerHurt();
              }
            } else if (distP < 6.0 && boss.attackCooldown <= 0) {
              boss.attackCooldown = 1.6;
              boss.attackAnimTimer = 0.45;
              if (state.divineInvulnTimer <= 0) {
                state.health = Math.max(0, state.health - 20);
                soundFX.playPlayerHurt();
              }
            }

            if (boss.attackAnimTimer > 0) {
              const p = 1 - boss.attackAnimTimer / 0.5;
              const slashRot =
                p < 0.35
                  ? 0.2 + (p / 0.35) * 1.4
                  : 1.6 - ((p - 0.35) / 0.65) * 2.4;
              boss.rightArm.rotation.x = slashRot;
            } else {
              boss.rightArm.rotation.x = THREE.MathUtils.lerp(
                boss.rightArm.rotation.x,
                0.25,
                Math.min(1, dt * 8)
              );
            }
          }

          if (state.health <= 0) {
            triggerGameOver();
            return;
          }
        }

        const aggroRadius = isTranscendentSavior ? 75 : 34 + orbsCollectedCount * 3.0;
        const enemyChaseSpeed = isTranscendentSavior ? 12.8 : 6.6 + orbsCollectedCount * 0.42;
        const enemyAttackDamage = isTranscendentSavior ? 42 : 12 + orbsCollectedCount * 2.5;
        const enemyAttackInterval = isTranscendentSavior
          ? 0.65
          : Math.max(0.75, 1.45 - orbsCollectedCount * 0.06);

        state.enemyInstances.forEach((enemy) => {
          if (!enemy.alive || state.screen !== 'PLAYING') return;

          enemy.setHumanSurvivorMode(isCorruptedRuler);
          enemy.setSpacetimeDemonMode(isTranscendentSavior, now * 0.001);

          const dxToPlayer = state.playerPos.x - enemy.position.x;
          const dzToPlayer = state.playerPos.z - enemy.position.z;
          const distToPlayer = Math.hypot(dxToPlayer, dzToPlayer);

          enemy.hpBarGroup.lookAt(camera.position);

          if (enemy.attackCooldown > 0) {
            enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
          }
          if (enemy.attackAnimTimer > 0) {
            enemy.attackAnimTimer = Math.max(0, enemy.attackAnimTimer - dt);
          }
          if (enemy.hurtFlashTimer > 0) {
            enemy.hurtFlashTimer = Math.max(0, enemy.hurtFlashTimer - dt);
          }
          if (enemy.warpCooldown > 0) {
            enemy.warpCooldown = Math.max(0, enemy.warpCooldown - dt);
          }

          let moveTargetX = 0;
          let moveTargetZ = 0;
          let moveSpeed = 0;

          if (distToPlayer < aggroRadius && !isSwimming) {
            const dirX = dxToPlayer / Math.max(0.001, distToPlayer);
            const dirZ = dzToPlayer / Math.max(0.001, distToPlayer);
            enemy.yaw = Math.atan2(-dirX, -dirZ);

            if (
              isTranscendentSavior &&
              distToPlayer > 5.5 &&
              distToPlayer < 36.0 &&
              enemy.warpCooldown <= 0
            ) {
              enemy.warpCooldown = 2.6 + Math.random() * 1.6;
              const flankAngle = Math.atan2(dzToPlayer, dxToPlayer) + (Math.random() - 0.5) * 1.4;
              const warpDist = Math.max(2.6, distToPlayer * 0.42);
              const wx = state.playerPos.x - Math.cos(flankAngle) * warpDist;
              const wz = state.playerPos.z - Math.sin(flankAngle) * warpDist;
              const wy = getTerrainHeight(wx, wz);

              const warpRing = new THREE.Mesh(
                new THREE.RingGeometry(0.4, 2.2, 20),
                new THREE.MeshBasicMaterial({
                  color: 0xa855f7,
                  transparent: true,
                  opacity: 0.9,
                  side: THREE.DoubleSide,
                  blending: THREE.AdditiveBlending,
                  depthWrite: false,
                })
              );
              warpRing.rotation.x = -Math.PI / 2;
              warpRing.position.set(wx, wy + 0.35, wz);
              scene.add(warpRing);
              state.visualEffects.push({
                mesh: warpRing,
                age: 0,
                maxAge: 0.45,
                type: 'NOVA_RING',
              });

              enemy.position.set(wx, wy, wz);
              enemy.group.position.copy(enemy.position);
            }

            if (distToPlayer > (isTranscendentSavior ? 2.9 : 2.3)) {
              moveTargetX = dirX;
              moveTargetZ = dirZ;
              moveSpeed = enemyChaseSpeed;
            } else if (enemy.attackCooldown <= 0) {
              enemy.attackCooldown = enemyAttackInterval;
              enemy.attackAnimTimer = 0.4;

              if (isTranscendentSavior) {
                const anomalyBurst = new THREE.Mesh(
                  new THREE.RingGeometry(0.5, 2.4, 24),
                  new THREE.MeshBasicMaterial({
                    color: 0xd946ef,
                    transparent: true,
                    opacity: 0.85,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                  })
                );
                anomalyBurst.rotation.x = -Math.PI / 2;
                anomalyBurst.position.set(
                  enemy.position.x,
                  enemy.position.y + 0.5,
                  enemy.position.z
                );
                scene.add(anomalyBurst);
                state.visualEffects.push({
                  mesh: anomalyBurst,
                  age: 0,
                  maxAge: 0.38,
                  type: 'NOVA_RING',
                });
              }

              if (state.divineInvulnTimer <= 0) {
                state.health = Math.max(0, state.health - enemyAttackDamage);
                if (isTranscendentSavior) {
                  state.playerVel.x += dirX * 9.5;
                  state.playerVel.z += dirZ * 9.5;
                }
                soundFX.playPlayerHurt();
              }

              if (state.health <= 0) {
                triggerGameOver();
                return;
              }
            }
          } else {
            const dxPatrol = enemy.patrolTarget.x - enemy.position.x;
            const dzPatrol = enemy.patrolTarget.z - enemy.position.z;
            const distPatrol = Math.hypot(dxPatrol, dzPatrol);

            if (distPatrol < 1.5) {
              const randAngle = Math.random() * Math.PI * 2;
              const randRadius = 4 + Math.random() * 12;
              enemy.patrolTarget.set(
                enemy.homePos.x + Math.cos(randAngle) * randRadius,
                enemy.homePos.y,
                enemy.homePos.z + Math.sin(randAngle) * randRadius
              );
            } else {
              moveTargetX = dxPatrol / distPatrol;
              moveTargetZ = dzPatrol / distPatrol;
              moveSpeed = 3.2;
              enemy.yaw = Math.atan2(-moveTargetX, -moveTargetZ);
            }
          }

          enemy.velocity.x = THREE.MathUtils.lerp(
            enemy.velocity.x,
            moveTargetX * moveSpeed,
            Math.min(1, dt * 6)
          );
          enemy.velocity.z = THREE.MathUtils.lerp(
            enemy.velocity.z,
            moveTargetZ * moveSpeed,
            Math.min(1, dt * 6)
          );

          enemy.position.x += enemy.velocity.x * dt;
          enemy.position.z += enemy.velocity.z * dt;
          enemy.position.y = getTerrainHeight(enemy.position.x, enemy.position.z);

          enemy.group.position.copy(enemy.position);
          enemy.group.rotation.y = enemy.yaw;

          const enemySpd = Math.hypot(enemy.velocity.x, enemy.velocity.z);
          if (enemySpd > 0.4) {
            enemy.walkPhase += dt * enemySpd * 1.1;
            const amp = Math.min(0.7, enemySpd * 0.08);
            enemy.leftLeg.rotation.x = Math.sin(enemy.walkPhase) * amp;
            enemy.rightLeg.rotation.x = -Math.sin(enemy.walkPhase) * amp;
            enemy.leftArm.rotation.x = -Math.sin(enemy.walkPhase) * amp;
          } else {
            enemy.leftLeg.rotation.x *= 0.85;
            enemy.rightLeg.rotation.x *= 0.85;
            enemy.leftArm.rotation.x *= 0.85;
          }

          if (enemy.attackAnimTimer > 0) {
            const p = 1 - enemy.attackAnimTimer / 0.4;
            const slashRot =
              p < 0.35
                ? 0.2 + (p / 0.35) * 1.25
                : 1.45 - ((p - 0.35) / 0.65) * 2.1;
            enemy.rightArm.rotation.x = slashRot;
          } else {
            enemy.rightArm.rotation.x = THREE.MathUtils.lerp(
              enemy.rightArm.rotation.x,
              0.2,
              Math.min(1, dt * 8)
            );
          }
        });

        // --- RAMASSAGE DES CAISSES DE FLÈCHES & BUTIN ---
        state.lootInstances.forEach((loot) => {
          if (loot.collected) return;
          loot.group.rotation.y += dt * 1.4;

          const dist = state.playerPos.distanceTo(loot.position);
          if (dist < 2.8) {
            loot.collected = true;
            loot.group.visible = false;
            state.arrows += loot.arrows;
            state.health = Math.min(100, state.health + loot.heal);
            soundFX.playPickupAmmo();
            showToast(`+${loot.arrows} Flèches récupérées !`);
          }
        });

        const cameraUnderwater = camera.position.y < WATER_LEVEL;
        if (cameraUnderwater) {
          scene.background = underwaterFogColor;
          fog.color.copy(underwaterFogColor);
          fog.density = 0.032;
        } else {
          scene.background = currentSkyColor;
          fog.color.copy(currentSkyColor);
          fog.density = 0.0024;
        }

        // Détection de proximité des Orbes (ou direction du Boss si les 10 Orbes sont collectées)
        let nearestDist: number | null = null;
        let nearestAngle: number | null = null;

        if (boss && boss.active && !boss.defeated) {
          const dxB = boss.position.x - state.playerPos.x;
          const dzB = boss.position.z - state.playerPos.z;
          nearestDist = Math.hypot(dxB, dzB);
          const angleToBoss = Math.atan2(dxB, -dzB) * (180 / Math.PI);
          const playerHeading = ((-state.yaw * 180) / Math.PI + 360) % 360;
          nearestAngle = (angleToBoss - playerHeading + 360) % 360;
        } else {
          for (let idx = 0; idx < state.orbs.length; idx++) {
            const orb = state.orbs[idx];
            if (orb.collected) continue;

            const meshObj = state.orbMeshes[idx];
            if (!meshObj) continue;

            const floatY = meshObj.group.position.y;
            const dx = orb.x - state.playerPos.x;
            const dy = floatY - state.playerPos.y;
            const dz = orb.z - state.playerPos.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (nearestDist === null || dist < nearestDist) {
              nearestDist = dist;
              const angleToOrb = Math.atan2(dx, -dz) * (180 / Math.PI);
              const playerHeading = ((-state.yaw * 180) / Math.PI + 360) % 360;
              nearestAngle = (angleToOrb - playerHeading + 360) % 360;
            }

            if (dist < 3.6) {
              orb.collected = true;
              meshObj.group.visible = false;

              const collectedCount = state.orbs.filter((o) => o.collected).length;
              soundFX.playOrbCollect(collectedCount);

              applyEnemyPowerScaling(collectedCount);
              const powerMsg =
                ORB_POWER_UNLOCK_MESSAGES[collectedCount] || orb.name;
              showToast(`${orb.name} • ${powerMsg}`);

              performSave(state.activeSlot);

              setWorldState((prev) => ({
                ...prev,
                orbsCollected: collectedCount,
                enemyTier: 1 + collectedCount,
                orbs: [...state.orbs],
              }));

              if (collectedCount === state.orbs.length) {
                triggerBossIntroWithFade();
                break;
              }
            }
          }
        }

        // Synchronisation HUD & Minimap (50ms)
        hudSyncTimer += dt;
        if (hudSyncTimer >= 0.05) {
          hudSyncTimer = 0;
          const headingDeg =
            (((-state.yaw * 180) / Math.PI) % 360 + 360) % 360;

          setPlayerStats({
            x: state.playerPos.x,
            y: state.playerPos.y,
            z: state.playerPos.z,
            heading: headingDeg,
            health: state.health,
            stamina: state.stamina,
            oxygen: state.oxygen,
            arrows: state.arrows,
            equippedWeapon: state.equippedWeapon,
            isAttacking: state.attackTimer > 0,
            isDrawingBow: state.isDrawingBow,
            bowCharge: state.bowDrawProgress,
            isSprinting,
            isGrounded: state.isGrounded,
            isSwimming,
            isUnderwater: cameraUnderwater || isUnderwater,
            cameraMode: state.cameraMode,
            activePowersCount: activePowers,
            dashCooldown: state.dashCooldownTimer,
            maxDashCooldown: isTranscendentSavior ? 0.65 : isCorruptedRuler ? 0.85 : activePowers >= 9 ? 1.2 : 2.5,
            novaCooldown: state.novaCooldownTimer,
            maxNovaCooldown: isTranscendentSavior ? 2.0 : isCorruptedRuler ? 2.5 : activePowers >= 9 ? 3.0 : 6.0,
            endingChoice: state.endingChoice,
          });

          setWorldState((prev) => ({
            ...prev,
            timeOfDay: state.timeOfDay,
            enemyTier: 1 + orbsCollectedCount,
            nearestOrbDistance: nearestDist,
            nearestOrbAngle: nearestAngle,
            enemies: state.enemyInstances.map((e) => ({
              id: e.id,
              x: e.position.x,
              y: e.position.y,
              z: e.position.z,
              hp: e.hp,
              maxHp: e.maxHp,
              alive: e.alive,
              campId: e.campId,
            })),
            lootPickups: state.lootInstances.map((l) => ({
              id: l.id,
              x: l.position.x,
              y: l.position.y,
              z: l.position.z,
              arrows: l.arrows,
              heal: l.heal,
              collected: l.collected,
            })),
            boss: {
              active: boss?.active ?? false,
              defeated: boss?.defeated ?? false,
              name: state.isDimensionalClashActive
                ? "L'Autre Réalité - Souverain du Néant"
                : 'Malakor, Titan du Néant',
              x: boss?.position.x ?? 0,
              y: boss?.position.y ?? 0,
              z: boss?.position.z ?? 0,
              hp: boss?.hp ?? 1200,
              maxHp: boss?.maxHp ?? 1200,
              phase: state.alterEgoPhase,
              isAlterEgo: state.isDimensionalClashActive,
            },
          }));
        }
      }

      renderer.render(scene, camera);

      if (state.screen === 'PLAYING') {
        renderMinimapFrame({
          playerPos: state.playerPos,
          yaw: state.yaw,
          orbs: state.orbs,
          camps: state.camps,
          enemies: state.enemyInstances,
          lootPickups: state.lootInstances,
          boss: state.bossInstance,
        });
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      bossDamageHandlerRef.current = null;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      container.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [
    applyEnemyPowerScaling,
    exitLockSafe,
    finishCutscene,
    handleNextCutsceneStep,
    handlePrevCutsceneStep,
    handleOpenPauseMenu,
    handleResumeGame,
    handleSelectWeapon,
    handleToggleCamera,
    performSave,
    showToast,
    startOutroCutscene,
    triggerBossIntroWithFade,
    triggerGameOver,
    triggerLightningDash,
    triggerSolarNova,
    triggerTimeShift,
    updateScreen,
  ]);

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden bg-slate-950 select-none ${
        screen === 'PLAYING' && isMouseCaptured ? 'cursor-none' : ''
      }`}
    >
      <div
        ref={mountRef}
        onClick={() => {
          if (screen === 'PLAYING') {
            requestLockSafe();
          }
        }}
        style={
          screen === 'GAME_OVER'
            ? {
                filter: 'grayscale(0.88) contrast(1.2) brightness(0.42) blur(1.5px)',
              }
            : endingChoice === 'RULE_WORLD'
            ? {
                filter: 'contrast(1.1) saturate(1.18)',
              }
            : undefined
        }
        className={`fixed inset-0 w-full h-full z-0 transition-all duration-1000 ${
          screen === 'PLAYING' && isMouseCaptured
            ? 'cursor-none'
            : 'cursor-crosshair'
        }`}
      />

      {endingChoice === 'RULE_WORLD' && (
        <div
          className="fixed inset-0 pointer-events-none z-10"
          style={{
            background:
              'radial-gradient(circle at center, transparent 42%, rgba(88, 28, 135, 0.34) 76%, rgba(9, 2, 18, 0.88) 100%)',
            boxShadow:
              'inset 0 0 110px rgba(225, 29, 72, 0.38), inset 0 0 55px rgba(147, 51, 234, 0.45)',
          }}
        />
      )}

      <div
        className="fixed inset-0 bg-black pointer-events-none z-50 transition-opacity duration-1000"
        style={{ opacity: fadeOpacity }}
      />

      {(screen === 'INTRO_CUTSCENE' ||
        screen === 'BOSS_CUTSCENE' ||
        screen === 'OUTRO_CUTSCENE' ||
        screen === 'CLASH_CUTSCENE') && (
        <CutsceneOverlay
          mode={
            screen === 'INTRO_CUTSCENE'
              ? 'INTRO'
              : screen === 'BOSS_CUTSCENE'
              ? 'BOSS'
              : screen === 'CLASH_CUTSCENE'
              ? 'CLASH'
              : 'OUTRO'
          }
          stepIndex={cutsceneStep}
          stepProgress={cutsceneProgress}
          endingChoice={endingChoice}
          onSelectEndingChoice={handleSelectEndingChoice}
          onPrevStep={handlePrevCutsceneStep}
          onNextStep={handleNextCutsceneStep}
          onSkip={finishCutscene}
        />
      )}

      <HUD
        player={playerStats}
        world={worldState}
        isPlaying={screen === 'PLAYING'}
        onOpenPauseMenu={handleOpenPauseMenu}
        onSelectWeapon={handleSelectWeapon}
        onTriggerDash={triggerLightningDash}
        onTriggerTimeShift={triggerTimeShift}
        onTriggerNova={triggerSolarNova}
        recentCollectName={recentCollectName}
      />

      <MainMenu
        screen={screen}
        saves={saves}
        activeSlot={activeSlot}
        soundEnabled={soundEnabled}
        cameraMode={playerStats.cameraMode}
        orbsCollected={worldState.orbsCollected}
        totalOrbs={worldState.totalOrbs}
        endingChoice={endingChoice}
        badEndingCompleted={progressionState.badEndingCompleted}
        goodEndingCompleted={progressionState.goodEndingCompleted}
        onStartNewGame={handleStartNewGame}
        onLoadGame={handleLoadGame}
        onSaveCurrentGame={performSave}
        onDeleteSave={handleDeleteSave}
        onResumeGame={handleResumeGame}
        onReturnToMainMenu={handleReturnToMainMenu}
        onToggleSound={handleToggleSound}
        onToggleCamera={handleToggleCamera}
        onReplayOutro={startOutroCutscene}
        onDebugJumpToEndingChoice={handleDebugJumpToEndingChoice}
        onSimulateBadEndingCompleted={handleSimulateBadEndingCompleted}
        onTestDimensionalClash={handleTestDimensionalClash}
        onResetAllSaves={handleResetAllSaves}
        onRetryGameOver={handleRetryGameOver}
        onForceGameOver={handleForceGameOver}
        onSpawnBossPhase1={handleSpawnBossPhase1}
        onForceBossPhase2={handleForceBossPhase2}
        onForceBossPhase3={handleForceBossPhase3}
        onForceBossZeroHp={handleForceBossZeroHp}
      />
    </div>
  );
}

export default App;
