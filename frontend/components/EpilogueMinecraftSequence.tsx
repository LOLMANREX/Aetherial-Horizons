import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Rocket,
  CheckCircle2,
  Sparkles,
  Home,
  RotateCcw,
  ShieldAlert,
  Swords,
  Cpu,
  Wifi,
  Volume2,
  Zap,
  Crosshair,
  Flame,
  Navigation,
} from 'lucide-react';
import { soundFX } from '../utils/sound';

export type EpilogueStartSubPhase =
  | 'HANGAR_HUB'
  | 'MINIGAME_PARKOUR'
  | 'MINIGAME_HOLOGRAM'
  | 'MINIGAME_VALVES'
  | 'SIX_MONTHS_VIRUS'
  | 'DESKTOP_COMBAT_DRONES'
  | 'ELYTRA_FLIGHT_3D';

export interface EpilogueMinecraftSequenceProps {
  initialSubPhase?: EpilogueStartSubPhase;
  triggerKey?: number;
  onReturnToMainMenu: () => void;
  onRestartFullMiniGame: () => void;
}

type SequenceStage =
  | 'HANGAR_3D'
  | 'ROCKET_LAUNCH_3D'
  | 'TYPEWRITER_6_MONTHS'
  | 'NEW_DESKTOP_BREACH'
  | 'MINECRAFT_WINDOW_EXIT'
  | 'DESKTOP_COMBAT_DRONES'
  | 'ELYTRA_3D'
  | 'CONFRONTATION_3D';

interface DesktopMinion {
  id: number;
  kind: 'DRONE' | 'ZOMBIE';
  x: number;
  y: number;
  speed: number;
}

interface DesktopVirusOrb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  reflected: boolean;
}

interface ServerRackPlatform3D {
  group: THREE.Group;
  mesh: THREE.Mesh;
  wire: THREE.LineSegments;
  basePos: THREE.Vector3;
  width: number;
  depth: number;
  steppedTime: number;
  collapsed: boolean;
  respawnTimer: number;
}

interface ValveStation3D {
  group: THREE.Group;
  wheel: THREE.Group;
  light: THREE.PointLight;
  pos: THREE.Vector3;
  progress: number;
  completed: boolean;
}

interface CanyonObstacle3D {
  type: 'FIREWALL' | 'FIBER_CABLE' | 'VOXEL_CLUSTER';
  group: THREE.Group;
  z: number;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  hit: boolean;
  phase: number;
}

interface BoostRing3D {
  mesh: THREE.Mesh;
  z: number;
  x: number;
  y: number;
  collected: boolean;
}

const TYPEWRITER_FULL_TEXT = '6 MOIS PLUS TARD... NOUVEL ORDINATEUR.';

function createMinecraftSteve3DGroup(withElytra: boolean): {
  root: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
} {
  const root = new THREE.Group();

  const netheriteMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.35,
    metalness: 0.85,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x7e22ce,
    emissiveIntensity: 0.45,
    roughness: 0.3,
    metalness: 0.7,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x3f3f46,
    roughness: 0.4,
    metalness: 0.8,
  });
  const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.25, 0.5), netheriteMat);
  torso.position.y = 1.45;
  root.add(torso);

  const chestTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.35, 0.54),
    trimMat
  );
  chestTrim.position.y = 1.65;
  root.add(chestTrim);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), headMat);
  head.position.y = 2.5;
  root.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.84), visorMat);
  visor.position.y = 2.52;
  root.add(visor);

  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.9, 0.42),
    netheriteMat
  );
  leftLeg.position.set(-0.22, 0.45, 0);
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.9, 0.42),
    netheriteMat
  );
  rightLeg.position.set(0.22, 0.45, 0);
  root.add(rightLeg);

  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 1.1, 0.4),
    netheriteMat
  );
  leftArm.position.set(-0.66, 1.45, 0);
  root.add(leftArm);

  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 1.1, 0.4),
    netheriteMat
  );
  rightArm.position.set(0.66, 1.45, 0);
  root.add(rightArm);

  const swordBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 1.35, 0.24),
    trimMat
  );
  swordBlade.position.set(0, -0.75, 0.35);
  swordBlade.rotation.x = Math.PI / 3;
  rightArm.add(swordBlade);

  const wingGeo = new THREE.BoxGeometry(1.15, 1.85, 0.08);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    emissive: 0x0284c7,
    emissiveIntensity: 0.35,
    roughness: 0.4,
    metalness: 0.75,
  });

  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-0.55, 1.45, -0.32);
  leftWing.rotation.z = 0.28;
  leftWing.visible = withElytra;
  root.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(0.55, 1.45, -0.32);
  rightWing.rotation.z = -0.28;
  rightWing.visible = withElytra;
  root.add(rightWing);

  return {
    root,
    leftWing,
    rightWing,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
  };
}

function createAvatar3DGroup(isCelestial: boolean): {
  root: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  halo: THREE.Mesh;
} {
  const root = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: isCelestial ? 0xf8fafc : 0x090414,
    emissive: isCelestial ? 0xfef08a : 0xe11d48,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.75,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: isCelestial ? 0x38bdf8 : 0xa855f7,
    emissive: isCelestial ? 0x38bdf8 : 0x9333ea,
    emissiveIntensity: 0.75,
    roughness: 0.2,
    metalness: 0.8,
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.2, 0.46), bodyMat);
  torso.position.y = 1.45;
  root.add(torso);

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.24, 0),
    accentMat
  );
  core.position.set(0, 1.5, 0.26);
  root.add(core);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.68, 0.68), bodyMat);
  head.position.y = 2.45;
  root.add(head);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.05, 12, 32),
    accentMat
  );
  halo.position.set(0, 2.65, -0.22);
  root.add(halo);

  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.88, 0.36),
    bodyMat
  );
  leftLeg.position.set(-0.2, 0.44, 0);
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.88, 0.36),
    bodyMat
  );
  rightLeg.position.set(0.2, 0.44, 0);
  root.add(rightLeg);

  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 1.0, 0.32),
    bodyMat
  );
  leftArm.position.set(-0.6, 1.45, 0);
  root.add(leftArm);

  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 1.0, 0.32),
    bodyMat
  );
  rightArm.position.set(0.6, 1.45, 0);
  root.add(rightArm);

  return { root, leftLeg, rightLeg, halo };
}

export const EpilogueMinecraftSequence: React.FC<EpilogueMinecraftSequenceProps> = ({
  initialSubPhase = 'HANGAR_HUB',
  triggerKey = 0,
  onReturnToMainMenu,
  onRestartFullMiniGame,
}) => {
  const mount3DRef = useRef<HTMLDivElement | null>(null);

  const resolveInitialStage = (sub: EpilogueStartSubPhase): SequenceStage => {
    if (sub === 'ELYTRA_FLIGHT_3D') return 'ELYTRA_3D';
    if (sub === 'SIX_MONTHS_VIRUS') return 'TYPEWRITER_6_MONTHS';
    if (sub === 'DESKTOP_COMBAT_DRONES') return 'DESKTOP_COMBAT_DRONES';
    return 'HANGAR_3D';
  };

  const [stage, setStage] = useState<SequenceStage>(() =>
    resolveInitialStage(initialSubPhase)
  );
  const [payloadDone, setPayloadDone] = useState<boolean>(false);
  const [rootCodeDone, setRootCodeDone] = useState<boolean>(false);
  const [zeroDayDone, setZeroDayDone] = useState<boolean>(false);

  const [hologramModalActive, setHologramModalActive] = useState<boolean>(
    initialSubPhase === 'MINIGAME_HOLOGRAM'
  );
  const [lockedRingsCount, setLockedRingsCount] = useState<number>(0);

  const [reactorTimer, setReactorTimer] = useState<number>(40);
  const [reactorPressure, setReactorPressure] = useState<number>(100);
  const [valvesClosedCount, setValvesClosedCount] = useState<number>(0);

  const [promptText, setPromptText] = useState<string | null>(null);
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  const [typewriterText, setTypewriterText] = useState<string>('');
  const [breachTimer, setBreachTimer] = useState<number>(0);
  const [waitingForAltTab, setWaitingForAltTab] = useState<boolean>(false);
  const [exitWindowTimer, setExitWindowTimer] = useState<number>(0);

  const [stevePos, setStevePos] = useState<{ x: number; y: number }>({
    x: 34,
    y: 56,
  });
  const [steveHp, setSteveHp] = useState<number>(100);
  const [steveSweepTimer, setSteveSweepTimer] = useState<number>(0);
  const [steveSweepAngle, setSteveSweepAngle] = useState<number>(0);

  const [virusPos, setVirusPos] = useState<{ x: number; y: number }>({
    x: 76,
    y: 44,
  });
  const [virusHp, setVirusHp] = useState<number>(100);
  const [virusShield, setVirusShield] = useState<number>(100);
  const [droneWave, setDroneWave] = useState<number>(1);
  const [minions, setMinions] = useState<DesktopMinion[]>([]);
  const [virusOrbs, setVirusOrbs] = useState<DesktopVirusOrb[]>([]);

  const [elytraProgress, setElytraProgress] = useState<number>(0);
  const [elytraHits, setElytraHits] = useState<number>(0);
  const [elytraBlur, setElytraBlur] = useState<number>(0);
  const [elytraBoostActive, setElytraBoostActive] = useState<boolean>(false);

  const desktopCombatRef = useRef({
    steveX: 34,
    steveY: 56,
    steveHp: 100,
    sweepTimer: 0,
    sweepAngle: 0,
    dashCooldown: 0,
    mouseX: 70,
    mouseY: 45,
    virusX: 76,
    virusY: 44,
    virusHp: 100,
    virusShield: 100,
    wave: 1,
    spawnTimer: 0.4,
    orbCooldown: 1.3,
    nextEntityId: 1,
    minions: [] as DesktopMinion[],
    orbs: [] as DesktopVirusOrb[],
  });

  const sim3DRef = useRef({
    stage: resolveInitialStage(initialSubPhase) as SequenceStage,
    keys: {} as Record<string, boolean>,
    playerPos: new THREE.Vector3(0, 0, 14),
    playerVel: new THREE.Vector3(0, 0, 0),
    isGrounded: true,
    camYaw: 0,
    camPitch: 0.28,
    payloadCollected: false,
    rootCodeCollected: false,
    zeroDayCollected: false,
    hologramActive: initialSubPhase === 'MINIGAME_HOLOGRAM',
    ringAngles: [0, 1.8, 3.6],
    ringLocked: [false, false, false],
    reactorPressure: 100,
    reactorTimer: 40,
    rocketLaunchElapsed: 0,
    elytraPos: new THREE.Vector3(0, 12, 0),
    elytraYaw: 0,
    elytraPitch: 0,
    elytraRoll: 0,
    elytraSpeed: 46,
    elytraBoostTimer: 0,
    elytraBlurTimer: 0,
    elytraHits: 0,
    elytraDistance: 0,
    elytraMaxDistance: 460,
    teleportTarget: null as 'HUB' | 'PARKOUR' | 'HOLOGRAM' | 'VALVES' | 'WORKBENCH' | null,
    interactRequested: false,
  });

  const showQuickToast = useCallback((msg: string) => {
    setToastBanner(msg);
    setTimeout(() => {
      setToastBanner((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  useEffect(() => {
    const startSt = resolveInitialStage(initialSubPhase);
    const s = sim3DRef.current;
    s.stage = startSt;
    s.payloadCollected = false;
    s.rootCodeCollected = false;
    s.zeroDayCollected = false;
    s.ringAngles = [0, 1.8, 3.6];
    s.ringLocked = [false, false, false];
    s.reactorPressure = 100;
    s.reactorTimer = 40;
    s.rocketLaunchElapsed = 0;
    s.elytraPos.set(0, 12, 0);
    s.elytraYaw = 0;
    s.elytraPitch = 0;
    s.elytraRoll = 0;
    s.elytraBoostTimer = 0;
    s.elytraBlurTimer = 0;
    s.elytraHits = 0;
    s.elytraDistance = 0;
    s.hologramActive = initialSubPhase === 'MINIGAME_HOLOGRAM';

    if (initialSubPhase === 'MINIGAME_PARKOUR') {
      s.playerPos.set(-18, 0, 8);
      s.camYaw = 0;
    } else if (initialSubPhase === 'MINIGAME_HOLOGRAM') {
      s.playerPos.set(18, 0, 0);
      s.camYaw = -Math.PI / 2;
    } else if (initialSubPhase === 'MINIGAME_VALVES') {
      s.playerPos.set(0, 0, -14);
      s.camYaw = 0;
    } else {
      s.playerPos.set(0, 0, 14);
      s.camYaw = 0;
    }
    s.playerVel.set(0, 0, 0);

    setStage(startSt);
    setPayloadDone(false);
    setRootCodeDone(false);
    setZeroDayDone(false);
    setHologramModalActive(initialSubPhase === 'MINIGAME_HOLOGRAM');
    setLockedRingsCount(0);
    setReactorTimer(40);
    setReactorPressure(100);
    setValvesClosedCount(0);
    setTypewriterText('');
    setBreachTimer(0);
    setWaitingForAltTab(false);
    setExitWindowTimer(0);

    desktopCombatRef.current = {
      steveX: 34,
      steveY: 56,
      steveHp: 100,
      sweepTimer: 0,
      sweepAngle: 0,
      dashCooldown: 0,
      mouseX: 70,
      mouseY: 45,
      virusX: 76,
      virusY: 44,
      virusHp: 100,
      virusShield: 100,
      wave: 1,
      spawnTimer: 0.4,
      orbCooldown: 1.3,
      nextEntityId: 1,
      minions: [],
      orbs: [],
    };
    setStevePos({ x: 34, y: 56 });
    setSteveHp(100);
    setSteveSweepTimer(0);
    setVirusPos({ x: 76, y: 44 });
    setVirusHp(100);
    setVirusShield(100);
    setDroneWave(1);
    setMinions([]);
    setVirusOrbs([]);

    setElytraProgress(0);
    setElytraHits(0);
    setElytraBlur(0);
  }, [initialSubPhase, triggerKey]);

  const triggerAltTabToMinecraft = useCallback(() => {
    if (stage !== 'NEW_DESKTOP_BREACH') return;
    soundFX.init();
    soundFX.playOrbCollect(10);
    setWaitingForAltTab(false);
    setExitWindowTimer(0);
    sim3DRef.current.stage = 'MINECRAFT_WINDOW_EXIT';
    setStage('MINECRAFT_WINDOW_EXIT');
    showQuickToast(
      'ALT + TAB DÉCLENCHÉ : Ouverture de Minecraft au premier plan !'
    );
  }, [stage, showQuickToast]);

  useEffect(() => {
    if (stage !== 'NEW_DESKTOP_BREACH') return;
    const onAltTabKey = (e: KeyboardEvent) => {
      if (
        e.code === 'Tab' ||
        e.key === 'Tab' ||
        e.code === 'AltLeft' ||
        e.code === 'AltRight' ||
        e.altKey
      ) {
        e.preventDefault();
        if (waitingForAltTab || breachTimer >= 2.8) {
          triggerAltTabToMinecraft();
        }
      }
    };
    window.addEventListener('keydown', onAltTabKey);
    return () => window.removeEventListener('keydown', onAltTabKey);
  }, [stage, waitingForAltTab, breachTimer, triggerAltTabToMinecraft]);

  useEffect(() => {
    if (
      stage !== 'TYPEWRITER_6_MONTHS' &&
      stage !== 'NEW_DESKTOP_BREACH' &&
      stage !== 'MINECRAFT_WINDOW_EXIT' &&
      stage !== 'DESKTOP_COMBAT_DRONES'
    ) {
      return;
    }

    let rafId: number;
    let lastTime = performance.now();
    let elapsed = 0;
    let lastChars = 0;
    let strikePlayed = false;
    let shatterPlayed = false;
    let stepOutPlayed = false;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      if (stage === 'TYPEWRITER_6_MONTHS') {
        const chars = Math.min(
          TYPEWRITER_FULL_TEXT.length,
          Math.floor(elapsed * 14)
        );
        if (chars > lastChars) {
          lastChars = chars;
          soundFX.init();
          soundFX.playPickupAmmo();
          setTypewriterText(TYPEWRITER_FULL_TEXT.slice(0, chars));
        }
        if (elapsed >= 3.2) {
          elapsed = 0;
          setBreachTimer(0);
          setWaitingForAltTab(false);
          sim3DRef.current.stage = 'NEW_DESKTOP_BREACH';
          setStage('NEW_DESKTOP_BREACH');
        }
      } else if (stage === 'NEW_DESKTOP_BREACH') {
        setBreachTimer(elapsed);
        if (elapsed >= 1.1 && !strikePlayed) {
          strikePlayed = true;
          soundFX.init();
          soundFX.playLightningDash();
        }
        if (elapsed >= 2.1 && !shatterPlayed) {
          shatterPlayed = true;
          soundFX.init();
          soundFX.playPiercingGlitchCrash();
          soundFX.playBossSlam();
        }
        if (elapsed >= 3.1 && !waitingForAltTab) {
          setWaitingForAltTab(true);
        }
      } else if (stage === 'MINECRAFT_WINDOW_EXIT') {
        setExitWindowTimer(elapsed);
        if (elapsed >= 0.95 && !stepOutPlayed) {
          stepOutPlayed = true;
          soundFX.init();
          soundFX.playBossSlam();
          soundFX.playLightningDash();
          showQuickToast(
            'STEVE SORT DU CADRE DE LA FENÊTRE MINECRAFT SUR LE BUREAU !'
          );
        }
        if (elapsed >= 2.5) {
          sim3DRef.current.stage = 'DESKTOP_COMBAT_DRONES';
          setStage('DESKTOP_COMBAT_DRONES');
        }
      } else if (stage === 'DESKTOP_COMBAT_DRONES') {
        const cb = desktopCombatRef.current;
        const keys = sim3DRef.current.keys;

        if (cb.sweepTimer > 0) {
          cb.sweepTimer = Math.max(0, cb.sweepTimer - dt);
        }
        if (cb.dashCooldown > 0) {
          cb.dashCooldown = Math.max(0, cb.dashCooldown - dt);
        }

        let moveX = 0;
        let moveY = 0;
        if (keys['KeyW'] || keys['KeyZ'] || keys['ArrowUp']) moveY -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
        if (keys['KeyA'] || keys['KeyQ'] || keys['ArrowLeft']) moveX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

        const mLen = Math.hypot(moveX, moveY);
        if (mLen > 0.01) {
          const spd = keys['Space'] && cb.dashCooldown <= 0 ? 68 : 28;
          if (keys['Space'] && cb.dashCooldown <= 0) {
            cb.dashCooldown = 0.7;
            soundFX.init();
            soundFX.playLightningDash();
          }
          cb.steveX = Math.max(
            8,
            Math.min(92, cb.steveX + (moveX / mLen) * spd * dt)
          );
          cb.steveY = Math.max(
            14,
            Math.min(82, cb.steveY + (moveY / mLen) * spd * dt)
          );
        }

        cb.virusX = 76 + Math.sin(now * 0.0022) * 8;
        cb.virusY = 42 + Math.cos(now * 0.0028) * 14;

        cb.spawnTimer -= dt;
        if (cb.spawnTimer <= 0 && cb.minions.length < 7) {
          cb.spawnTimer = cb.virusShield > 0 ? 1.35 : 2.2;
          const batchCount = cb.minions.length === 0 ? 4 : 2;
          for (let b = 0; b < batchCount; b++) {
            const ang = (Math.random() - 0.5) * Math.PI * 1.4;
            const kind: 'DRONE' | 'ZOMBIE' =
              (cb.nextEntityId + b) % 2 === 0 ? 'DRONE' : 'ZOMBIE';
            cb.minions.push({
              id: cb.nextEntityId++,
              kind,
              x: Math.max(
                10,
                Math.min(90, cb.virusX - 6 + Math.cos(ang) * 8)
              ),
              y: Math.max(
                14,
                Math.min(82, cb.virusY + Math.sin(ang) * 12)
              ),
              speed: kind === 'DRONE' ? 18.5 : 14.0,
            });
          }
        }

        for (let i = cb.minions.length - 1; i >= 0; i--) {
          const m = cb.minions[i];
          const dx = cb.steveX - m.x;
          const dy = cb.steveY - m.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.2) {
            m.x += (dx / dist) * m.speed * dt;
            m.y += (dy / dist) * m.speed * dt;
          }
          if (dist < 4.5) {
            cb.minions.splice(i, 1);
            cb.steveHp = Math.max(20, cb.steveHp - 8);
            soundFX.init();
            soundFX.playPlayerHurt();
          }
        }

        cb.orbCooldown -= dt;
        if (cb.orbCooldown <= 0) {
          cb.orbCooldown = 1.45;
          const dx = cb.steveX - cb.virusX;
          const dy = cb.steveY - cb.virusY;
          const d = Math.max(1, Math.hypot(dx, dy));
          cb.orbs.push({
            id: cb.nextEntityId++,
            x: cb.virusX,
            y: cb.virusY,
            vx: (dx / d) * 32,
            vy: (dy / d) * 32,
            reflected: false,
          });
        }

        for (let i = cb.orbs.length - 1; i >= 0; i--) {
          const o = cb.orbs[i];
          o.x += o.vx * dt;
          o.y += o.vy * dt;

          if (!o.reflected) {
            const dSteve = Math.hypot(o.x - cb.steveX, o.y - cb.steveY);
            if (dSteve < 4.2) {
              cb.orbs.splice(i, 1);
              cb.steveHp = Math.max(20, cb.steveHp - 10);
              soundFX.init();
              soundFX.playPlayerHurt();
              continue;
            }
          } else {
            const dVirus = Math.hypot(o.x - cb.virusX, o.y - cb.virusY);
            if (dVirus < 7.5) {
              cb.orbs.splice(i, 1);
              if (cb.virusShield > 0) {
                cb.virusShield = Math.max(0, cb.virusShield - 18);
              } else {
                cb.virusHp = Math.max(0, cb.virusHp - 25);
              }
              soundFX.init();
              soundFX.playEnemyHit(true);
              continue;
            }
          }

          if (o.x < 0 || o.x > 100 || o.y < 0 || o.y > 100) {
            cb.orbs.splice(i, 1);
          }
        }

        if (cb.virusHp <= 0) {
          soundFX.init();
          soundFX.playBossSlam();
          soundFX.playLightningDash();
          showQuickToast(
            'VIRUS BATTU ! Il fuit par l’écran brisé — Steve plonge en Élytres 3D !'
          );
          sim3DRef.current.stage = 'ELYTRA_3D';
          sim3DRef.current.elytraPos.set(0, 12, 0);
          sim3DRef.current.elytraDistance = 0;
          sim3DRef.current.elytraHits = 0;
          setStage('ELYTRA_3D');
          return;
        }

        setStevePos({ x: cb.steveX, y: cb.steveY });
        setSteveHp(cb.steveHp);
        setSteveSweepTimer(cb.sweepTimer);
        setSteveSweepAngle(cb.sweepAngle);
        setVirusPos({ x: cb.virusX, y: cb.virusY });
        setVirusHp(cb.virusHp);
        setVirusShield(cb.virusShield);
        setDroneWave(cb.wave);
        setMinions([...cb.minions]);
        setVirusOrbs([...cb.orbs]);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [stage, waitingForAltTab, showQuickToast]);

  const handleDesktopCombatSweepAttack = useCallback(
    (e?: React.MouseEvent<HTMLDivElement>) => {
      if (stage !== 'DESKTOP_COMBAT_DRONES') return;
      const cb = desktopCombatRef.current;
      if (e) {
        const rect = e.currentTarget.getBoundingClientRect();
        cb.mouseX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
        cb.mouseY = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100;
      }

      cb.sweepTimer = 0.32;
      cb.sweepAngle = Math.atan2(
        cb.mouseY - cb.steveY,
        cb.mouseX - cb.steveX
      );
      soundFX.init();
      soundFX.playSwordSwing();

      let killedInSweep = 0;
      for (let i = cb.minions.length - 1; i >= 0; i--) {
        const m = cb.minions[i];
        const d = Math.hypot(m.x - cb.steveX, m.y - cb.steveY);
        if (d < 19.5) {
          cb.minions.splice(i, 1);
          killedInSweep += 1;
        }
      }

      if (killedInSweep > 0) {
        soundFX.playEnemyHit(true);
        const prevShield = cb.virusShield;
        cb.virusShield = Math.max(0, cb.virusShield - killedInSweep * 14);
        if (cb.virusShield <= 66 && cb.wave === 1) cb.wave = 2;
        if (cb.virusShield <= 33 && cb.wave === 2) cb.wave = 3;
        if (prevShield > 0 && cb.virusShield === 0) {
          showQuickToast(
            'BOUCLIER DU VIRUS BRISÉ ! Assénez-lui le coup de grâce avec l’Épée en Netherite !'
          );
        }
      }

      cb.orbs.forEach((o) => {
        const dOrb = Math.hypot(o.x - cb.steveX, o.y - cb.steveY);
        if (dOrb < 18.0 && !o.reflected) {
          o.reflected = true;
          const dx = cb.virusX - o.x;
          const dy = cb.virusY - o.y;
          const len = Math.max(1, Math.hypot(dx, dy));
          o.vx = (dx / len) * 48;
          o.vy = (dy / len) * 48;
          soundFX.playEnemyHit(false);
        }
      });

      const dBoss = Math.hypot(cb.virusX - cb.steveX, cb.virusY - cb.steveY);
      if (dBoss < 21.0) {
        if (cb.virusShield > 0) {
          cb.virusShield = Math.max(0, cb.virusShield - 16);
          soundFX.playEnemyHit(false);
        } else {
          cb.virusHp = Math.max(0, cb.virusHp - 28);
          soundFX.playEnemyHit(true);
        }
      }
    },
    [stage, showQuickToast]
  );

  useEffect(() => {
    const container = mount3DRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04020c);
    scene.fog = new THREE.FogExp2(0x050212, 0.0085);

    const camera = new THREE.PerspectiveCamera(
      68,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.1,
      450
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 1.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(25, 45, 20);
    scene.add(dirLight);

    const purpleVolLight = new THREE.PointLight(0xa855f7, 6.5, 48);
    purpleVolLight.position.set(-16, 12, 0);
    scene.add(purpleVolLight);

    const cyanVolLight = new THREE.PointLight(0x38bdf8, 6.5, 48);
    cyanVolLight.position.set(16, 12, 0);
    scene.add(cyanVolLight);

    const reactorLight = new THREE.PointLight(0xf43f5e, 7.0, 38);
    reactorLight.position.set(0, 8, -22);
    scene.add(reactorLight);

    const terrainGeo = new THREE.PlaneGeometry(360, 360, 72, 72);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const distCenter = Math.hypot(vx, vz);
      if (distCenter > 36) {
        const wave =
          Math.sin(vx * 0.08) * Math.cos(vz * 0.08) * 3.8 +
          Math.sin(vx * 0.22 + vz * 0.19) * 1.2;
        posAttr.setY(i, Math.max(0, wave));
      } else {
        posAttr.setY(i, 0);
      }
    }
    terrainGeo.computeVertexNormals();

    const terrainMesh = new THREE.Mesh(
      terrainGeo,
      new THREE.MeshStandardMaterial({
        color: 0x070514,
        roughness: 0.28,
        metalness: 0.82,
        flatShading: true,
      })
    );
    scene.add(terrainMesh);

    const neonGrid = new THREE.GridHelper(360, 90, 0x38bdf8, 0x7e22ce);
    neonGrid.position.y = 0.04;
    scene.add(neonGrid);

    const dataCount = 1400;
    const dataPositions = new Float32Array(dataCount * 3);
    const dataColors = new Float32Array(dataCount * 3);
    for (let i = 0; i < dataCount; i++) {
      dataPositions[i * 3] = (Math.random() - 0.5) * 240;
      dataPositions[i * 3 + 1] = 1 + Math.random() * 55;
      dataPositions[i * 3 + 2] = (Math.random() - 0.5) * 240;
      const isCyan = i % 2 === 0;
      dataColors[i * 3] = isCyan ? 0.22 : 0.85;
      dataColors[i * 3 + 1] = isCyan ? 0.74 : 0.27;
      dataColors[i * 3 + 2] = isCyan ? 0.97 : 0.93;
    }
    const dataGeo = new THREE.BufferGeometry();
    dataGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(dataPositions, 3)
    );
    dataGeo.setAttribute('color', new THREE.BufferAttribute(dataColors, 3));
    const dataParticles = new THREE.Points(
      dataGeo,
      new THREE.PointsMaterial({
        size: 0.35,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(dataParticles);

    const hangarGroup = new THREE.Group();
    scene.add(hangarGroup);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.75,
    });
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const neonPurpleMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

    const floorPad = new THREE.Mesh(
      new THREE.BoxGeometry(52, 0.2, 56),
      new THREE.MeshStandardMaterial({
        color: 0x090d1a,
        roughness: 0.22,
        metalness: 0.88,
      })
    );
    floorPad.position.set(0, -0.05, -2);
    hangarGroup.add(floorPad);

    for (let p = -2; p <= 2; p++) {
      const leftPillar = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 18, 1.6),
        wallMat
      );
      leftPillar.position.set(-25, 9, p * 11);
      hangarGroup.add(leftPillar);

      const rightPillar = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 18, 1.6),
        wallMat
      );
      rightPillar.position.set(25, 9, p * 11);
      hangarGroup.add(rightPillar);

      const roofBeam = new THREE.Mesh(
        new THREE.BoxGeometry(52, 1.1, 1.4),
        wallMat
      );
      roofBeam.position.set(0, 18, p * 11);
      hangarGroup.add(roofBeam);

      const neonStrip = new THREE.Mesh(
        new THREE.BoxGeometry(48, 0.18, 0.35),
        p % 2 === 0 ? neonCyanMat : neonPurpleMat
      );
      neonStrip.position.set(0, 17.35, p * 11);
      hangarGroup.add(neonStrip);
    }

    const coneGeo = new THREE.ConeGeometry(7, 17, 24, 1, true);
    const purpleConeMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.11,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cyanConeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.11,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const volConeLeft = new THREE.Mesh(coneGeo, purpleConeMat);
    volConeLeft.position.set(-16, 8.5, 0);
    hangarGroup.add(volConeLeft);

    const volConeRight = new THREE.Mesh(coneGeo, cyanConeMat);
    volConeRight.position.set(16, 8.5, 0);
    hangarGroup.add(volConeRight);

    const parkourPlatforms: ServerRackPlatform3D[] = [];
    const rackCoords = [
      new THREE.Vector3(-18, 1.3, 6),
      new THREE.Vector3(-18, 2.7, 1.5),
      new THREE.Vector3(-18, 4.1, -3.0),
      new THREE.Vector3(-14.5, 5.5, -5.5),
      new THREE.Vector3(-11.0, 6.9, -3.0),
      new THREE.Vector3(-11.0, 8.3, 1.5),
    ];

    rackCoords.forEach((coord) => {
      const grp = new THREE.Group();
      grp.position.copy(coord);
      const w = 3.2;
      const d = 3.2;
      const boxGeo = new THREE.BoxGeometry(w, 0.55, d);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
        roughness: 0.3,
        metalness: 0.8,
      });
      const mesh = new THREE.Mesh(boxGeo, boxMat);
      grp.add(mesh);

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(boxGeo),
        new THREE.LineBasicMaterial({ color: 0x38bdf8 })
      );
      grp.add(wire);
      hangarGroup.add(grp);

      parkourPlatforms.push({
        group: grp,
        mesh,
        wire,
        basePos: coord.clone(),
        width: w,
        depth: d,
        steppedTime: 0,
        collapsed: false,
        respawnTimer: 0,
      });
    });

    const payloadSphereMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.75, 1),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xf43f5e,
        emissiveIntensity: 1.1,
        wireframe: false,
      })
    );
    payloadSphereMesh.position.set(-11.0, 10.1, 1.5);
    hangarGroup.add(payloadSphereMesh);

    const holoStationGroup = new THREE.Group();
    holoStationGroup.position.set(16, 0, 0);
    hangarGroup.add(holoStationGroup);

    const holoPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.1, 1.6, 16),
      wallMat
    );
    holoPedestal.position.y = 0.8;
    holoStationGroup.add(holoPedestal);

    const holoRings3D: THREE.Group[] = [];
    const ringRadii = [1.4, 2.2, 3.0];
    ringRadii.forEach((rad) => {
      const rGrp = new THREE.Group();
      rGrp.position.set(0, 4.6, 0);

      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(rad, 0.09, 12, 48),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.8,
        })
      );
      rGrp.add(torus);

      const gapMarker = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.42),
        new THREE.MeshBasicMaterial({ color: 0xfde047 })
      );
      gapMarker.position.set(0, rad, 0);
      rGrp.add(gapMarker);

      holoStationGroup.add(rGrp);
      holoRings3D.push(rGrp);
    });

    const targetMarker3D = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.7, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    targetMarker3D.position.set(0, 8.3, 0);
    targetMarker3D.rotation.x = Math.PI;
    holoStationGroup.add(targetMarker3D);

    const reactorGroup = new THREE.Group();
    reactorGroup.position.set(0, 0, -21);
    hangarGroup.add(reactorGroup);

    const reactorCoreMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 7.5, 24),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 0.95,
        transparent: true,
        opacity: 0.88,
      })
    );
    reactorCoreMesh.position.y = 3.8;
    reactorGroup.add(reactorCoreMesh);

    const zeroDaySphereMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.75, 1),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.2,
      })
    );
    zeroDaySphereMesh.position.set(0, 2.2, -16.5);
    hangarGroup.add(zeroDaySphereMesh);

    const valveStations: ValveStation3D[] = [];
    const valvePositions = [
      new THREE.Vector3(-7.5, 0, -16),
      new THREE.Vector3(0, 0, -13.5),
      new THREE.Vector3(7.5, 0, -16),
    ];

    valvePositions.forEach((vPos) => {
      const vGrp = new THREE.Group();
      vGrp.position.copy(vPos);

      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 1.8, 12),
        wallMat
      );
      pipe.position.y = 0.9;
      vGrp.add(pipe);

      const wheelGrp = new THREE.Group();
      wheelGrp.position.y = 1.85;
      const wheelTorus = new THREE.Mesh(
        new THREE.TorusGeometry(0.75, 0.1, 10, 24),
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xdc2626,
          emissiveIntensity: 0.6,
        })
      );
      wheelTorus.rotation.x = Math.PI / 2;
      wheelGrp.add(wheelTorus);

      const spoke1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.08, 0.08),
        neonCyanMat
      );
      const spoke2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 1.4),
        neonCyanMat
      );
      wheelGrp.add(spoke1);
      wheelGrp.add(spoke2);
      vGrp.add(wheelGrp);

      const vLight = new THREE.PointLight(0xef4444, 2.5, 8);
      vLight.position.y = 2.4;
      vGrp.add(vLight);

      hangarGroup.add(vGrp);
      valveStations.push({
        group: vGrp,
        wheel: wheelGrp,
        light: vLight,
        pos: vPos.clone(),
        progress: 0,
        completed: false,
      });
    });

    const workbenchGroup = new THREE.Group();
    workbenchGroup.position.set(0, 0, 2);
    hangarGroup.add(workbenchGroup);

    const benchTable = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.8, 1.3, 8),
      new THREE.MeshStandardMaterial({
        color: 0x1e1b4b,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.45,
        roughness: 0.3,
        metalness: 0.8,
      })
    );
    benchTable.position.y = 0.65;
    workbenchGroup.add(benchTable);

    const forgedVirusOrb = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.95, 1),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xf43f5e,
        emissiveIntensity: 1.4,
      })
    );
    forgedVirusOrb.position.y = 2.6;
    forgedVirusOrb.visible = false;
    workbenchGroup.add(forgedVirusOrb);

    const rocketGroup3D = new THREE.Group();
    rocketGroup3D.position.set(0, 0, 32);
    scene.add(rocketGroup3D);

    const rocketBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.2, 12, 24),
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.25,
        metalness: 0.8,
      })
    );
    rocketBody.position.y = 6.5;
    rocketGroup3D.add(rocketBody);

    const rocketNose = new THREE.Mesh(
      new THREE.ConeGeometry(1.8, 4.2, 24),
      new THREE.MeshStandardMaterial({
        color: 0xe11d48,
        emissive: 0x9f1239,
        emissiveIntensity: 0.5,
      })
    );
    rocketNose.position.y = 14.6;
    rocketGroup3D.add(rocketNose);

    const rocketFlame = new THREE.Mesh(
      new THREE.ConeGeometry(2.1, 6.5, 16),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    rocketFlame.position.y = -2.2;
    rocketFlame.rotation.x = Math.PI;
    rocketFlame.visible = false;
    rocketGroup3D.add(rocketFlame);

    const playerAvatar3D = createAvatar3DGroup(true);
    scene.add(playerAvatar3D.root);

    const partnerAvatar3D = createAvatar3DGroup(false);
    partnerAvatar3D.root.position.set(3.5, 0, 2);
    scene.add(partnerAvatar3D.root);

    const canyonGroup = new THREE.Group();
    canyonGroup.visible = false;
    scene.add(canyonGroup);

    const steve3D = createMinecraftSteve3DGroup(true);
    canyonGroup.add(steve3D.root);

    const canyonObstacles: CanyonObstacle3D[] = [];
    const boostRings: BoostRing3D[] = [];

    for (let seg = 0; seg < 28; seg++) {
      const zPos = -seg * 18;
      const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(8, 36, 16),
        new THREE.MeshStandardMaterial({
          color: 0x090418,
          emissive: seg % 2 === 0 ? 0x0284c7 : 0x7e22ce,
          emissiveIntensity: 0.35,
          flatShading: true,
        })
      );
      leftWall.position.set(-22, 16, zPos);
      canyonGroup.add(leftWall);

      const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(8, 36, 16),
        new THREE.MeshStandardMaterial({
          color: 0x090418,
          emissive: seg % 2 === 0 ? 0x7e22ce : 0x0284c7,
          emissiveIntensity: 0.35,
          flatShading: true,
        })
      );
      rightWall.position.set(22, 16, zPos);
      canyonGroup.add(rightWall);

      if (seg >= 2 && seg <= 25) {
        const obsGrp = new THREE.Group();
        const ox = ((seg * 7) % 3 - 1) * 7.5;
        const oy = 7 + ((seg * 5) % 3) * 4.5;
        obsGrp.position.set(ox, oy, zPos);

        const obsType: CanyonObstacle3D['type'] =
          seg % 3 === 0
            ? 'FIREWALL'
            : seg % 3 === 1
            ? 'FIBER_CABLE'
            : 'VOXEL_CLUSTER';

        if (obsType === 'FIREWALL') {
          const laserWall = new THREE.Mesh(
            new THREE.BoxGeometry(11, 5.5, 0.45),
            new THREE.MeshBasicMaterial({
              color: 0xef4444,
              transparent: true,
              opacity: 0.78,
            })
          );
          obsGrp.add(laserWall);
        } else if (obsType === 'FIBER_CABLE') {
          const cable = new THREE.Mesh(
            new THREE.CylinderGeometry(1.1, 1.1, 28, 12),
            new THREE.MeshStandardMaterial({
              color: 0x0f172a,
              emissive: 0x38bdf8,
              emissiveIntensity: 0.9,
            })
          );
          cable.rotation.z = Math.PI / 3;
          obsGrp.add(cable);
        } else {
          for (let v = 0; v < 5; v++) {
            const vox = new THREE.Mesh(
              new THREE.BoxGeometry(2.1, 2.1, 2.1),
              new THREE.MeshStandardMaterial({
                color: 0x1e1b4b,
                emissive: 0xd946ef,
                emissiveIntensity: 0.85,
              })
            );
            vox.position.set(
              (v - 2) * 1.3,
              Math.sin(v * 2) * 1.3,
              Math.cos(v) * 1.1
            );
            obsGrp.add(vox);
          }
        }

        canyonGroup.add(obsGrp);
        canyonObstacles.push({
          type: obsType,
          group: obsGrp,
          z: zPos,
          x: ox,
          y: oy,
          radiusX: obsType === 'FIREWALL' ? 5.6 : 3.4,
          radiusY: 3.2,
          hit: false,
          phase: seg * 0.7,
        });
      }

      if (seg >= 3 && seg % 4 === 0 && seg <= 24) {
        const bx = ((seg / 4) % 2 === 0 ? -1 : 1) * 5.5;
        const by = 11;
        const ringMesh = new THREE.Mesh(
          new THREE.TorusGeometry(2.8, 0.25, 12, 32),
          new THREE.MeshBasicMaterial({ color: 0xfde047 })
        );
        ringMesh.position.set(bx, by, zPos - 8);
        canyonGroup.add(ringMesh);
        boostRings.push({
          mesh: ringMesh,
          z: zPos - 8,
          x: bx,
          y: by,
          collected: false,
        });
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      sim3DRef.current.keys[e.code] = true;
      if (e.code === 'KeyE') {
        sim3DRef.current.interactRequested = true;
      }
      if (e.code === 'Space' && sim3DRef.current.hologramActive) {
        e.preventDefault();
        sim3DRef.current.interactRequested = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      sim3DRef.current.keys[e.code] = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const s = sim3DRef.current;
      if (s.stage === 'HANGAR_3D' && !s.hologramActive) {
        if (e.buttons === 1 || document.pointerLockElement === renderer.domElement) {
          s.camYaw -= e.movementX * 0.005;
          s.camPitch = Math.max(
            0.08,
            Math.min(1.15, s.camPitch + e.movementY * 0.004)
          );
        }
      } else if (s.stage === 'ELYTRA_3D') {
        const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
        s.elytraYaw = -nx * 0.75;
        s.elytraPitch = -ny * 0.55;
        s.elytraRoll = -nx * 0.65;
      }
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    let rafId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const st = sim3DRef.current;

      dataParticles.rotation.y += dt * 0.04;
      payloadSphereMesh.rotation.y += dt * 2.4;
      zeroDaySphereMesh.rotation.y -= dt * 2.2;
      forgedVirusOrb.rotation.y += dt * 3.0;

      if (st.teleportTarget) {
        if (st.teleportTarget === 'PARKOUR') {
          st.playerPos.set(-18, 0, 9.5);
          st.playerVel.set(0, 0, 0);
        } else if (st.teleportTarget === 'HOLOGRAM') {
          st.playerPos.set(12.5, 0, 0);
          st.playerVel.set(0, 0, 0);
          st.hologramActive = true;
          setHologramModalActive(true);
        } else if (st.teleportTarget === 'VALVES') {
          st.playerPos.set(0, 0, -11);
          st.playerVel.set(0, 0, 0);
        } else if (st.teleportTarget === 'WORKBENCH') {
          st.playerPos.set(0, 0, 6.5);
          st.playerVel.set(0, 0, 0);
        } else {
          st.playerPos.set(0, 0, 14);
          st.playerVel.set(0, 0, 0);
        }
        st.teleportTarget = null;
      }

      if (st.stage === 'HANGAR_3D') {
        hangarGroup.visible = true;
        rocketGroup3D.visible = true;
        canyonGroup.visible = false;
        playerAvatar3D.root.visible = true;
        partnerAvatar3D.root.visible = true;

        for (let r = 0; r < 3; r++) {
          if (!st.ringLocked[r]) {
            st.ringAngles[r] =
              (st.ringAngles[r] + dt * (1.8 + r * 0.65)) % (Math.PI * 2);
          }
          holoRings3D[r].rotation.z = st.ringAngles[r];
        }

        if (st.hologramActive) {
          camera.position.lerp(new THREE.Vector3(16, 5.2, 7.5), dt * 6);
          camera.lookAt(16, 4.8, 0);

          if (st.interactRequested) {
            st.interactRequested = false;
            const currentRingIdx = st.ringLocked.findIndex((lk) => !lk);
            if (currentRingIdx !== -1) {
              const angle = st.ringAngles[currentRingIdx] % (Math.PI * 2);
              const normalized =
                angle > Math.PI ? Math.PI * 2 - angle : angle;
              if (normalized < 0.72) {
                st.ringLocked[currentRingIdx] = true;
                soundFX.init();
                soundFX.playOrbCollect(6 + currentRingIdx);
                const lockedCount = st.ringLocked.filter(Boolean).length;
                setLockedRingsCount(lockedCount);
                if (lockedCount === 3) {
                  st.rootCodeCollected = true;
                  st.hologramActive = false;
                  setRootCodeDone(true);
                  setHologramModalActive(false);
                  showQuickToast('COMPOSANT 2 OBTENU : Code Racine verrouillé !');
                }
              } else {
                soundFX.init();
                soundFX.playErrorPopupBeep(2);
                showQuickToast(
                  'Alignement manqué ! Stoppez l’anneau quand le marqueur doré passe en haut !'
                );
              }
            }
          }

          renderer.render(scene, camera);
          return;
        }

        const moveSpeed = 13.5;
        let forward = 0;
        let right = 0;
        if (st.keys['KeyW'] || st.keys['KeyZ'] || st.keys['ArrowUp']) forward += 1;
        if (st.keys['KeyS'] || st.keys['ArrowDown']) forward -= 1;
        if (st.keys['KeyD'] || st.keys['ArrowRight']) right += 1;
        if (st.keys['KeyA'] || st.keys['KeyQ'] || st.keys['ArrowLeft']) right -= 1;

        const dirX =
          -Math.sin(st.camYaw) * forward + Math.cos(st.camYaw) * right;
        const dirZ =
          -Math.cos(st.camYaw) * forward - Math.sin(st.camYaw) * right;
        const dirLen = Math.hypot(dirX, dirZ);

        if (dirLen > 0.01) {
          st.playerPos.x += (dirX / dirLen) * moveSpeed * dt;
          st.playerPos.z += (dirZ / dirLen) * moveSpeed * dt;
          playerAvatar3D.root.rotation.y = Math.atan2(dirX, dirZ);
          playerAvatar3D.leftLeg.rotation.x = Math.sin(now * 0.014) * 0.6;
          playerAvatar3D.rightLeg.rotation.x = -Math.sin(now * 0.014) * 0.6;
        } else {
          playerAvatar3D.leftLeg.rotation.x = 0;
          playerAvatar3D.rightLeg.rotation.x = 0;
        }

        if (st.keys['Space'] && st.isGrounded) {
          st.playerVel.y = 11.2;
          st.isGrounded = false;
          soundFX.init();
          soundFX.playJump();
        }

        st.playerVel.y -= 24.0 * dt;
        st.playerPos.y += st.playerVel.y * dt;

        let groundHeight = 0;
        parkourPlatforms.forEach((plat) => {
          if (plat.collapsed) {
            plat.respawnTimer += dt;
            plat.group.position.y -= dt * 14;
            if (plat.respawnTimer >= 2.6) {
              plat.collapsed = false;
              plat.steppedTime = 0;
              plat.respawnTimer = 0;
              plat.group.position.copy(plat.basePos);
              plat.group.visible = true;
            }
            return;
          }

          if (plat.steppedTime > 0) {
            plat.steppedTime += dt;
            plat.group.position.x =
              plat.basePos.x + Math.sin(now * 0.06) * 0.12;
            if (plat.steppedTime >= 2.0) {
              plat.collapsed = true;
              soundFX.init();
              soundFX.playBossSlam();
            }
          }

          const dx = Math.abs(st.playerPos.x - plat.basePos.x);
          const dz = Math.abs(st.playerPos.z - plat.basePos.z);
          const topY = plat.basePos.y + 0.28;
          if (
            dx < plat.width * 0.56 &&
            dz < plat.depth * 0.56 &&
            st.playerPos.y >= topY - 0.55 &&
            st.playerVel.y <= 0
          ) {
            if (topY > groundHeight) {
              groundHeight = topY;
              if (plat.steppedTime === 0) {
                plat.steppedTime = 0.01;
              }
            }
          }
        });

        if (st.playerPos.y <= groundHeight) {
          st.playerPos.y = groundHeight;
          st.playerVel.y = 0;
          st.isGrounded = true;
        }

        playerAvatar3D.root.position.copy(st.playerPos);

        let activePrompt: string | null = null;

        if (!st.payloadCollected) {
          const dPayload = st.playerPos.distanceTo(payloadSphereMesh.position);
          if (dPayload < 3.4) {
            st.payloadCollected = true;
            payloadSphereMesh.visible = false;
            setPayloadDone(true);
            soundFX.init();
            soundFX.playOrbCollect(8);
            showQuickToast('COMPOSANT 1 OBTENU : Payload Corrompu récupéré !');
          } else if (
            st.playerPos.distanceTo(new THREE.Vector3(-18, 0, 6)) < 7
          ) {
            activePrompt =
              'Parkour de Serveurs : Sautez [ESPACE] sur les racks (ils chutent après 2s) jusqu’à la sphère !';
          }
        }

        if (!st.rootCodeCollected) {
          const dHolo = st.playerPos.distanceTo(holoStationGroup.position);
          if (dHolo < 5.2) {
            activePrompt =
              'Appuyez sur [E] pour ouvrir le Terminal d’Alignement Holographique 3D (Code Racine)';
            if (st.interactRequested) {
              st.interactRequested = false;
              st.hologramActive = true;
              setHologramModalActive(true);
            }
          }
        }

        if (!st.zeroDayCollected) {
          st.reactorTimer = Math.max(0, st.reactorTimer - dt);
          if (st.reactorTimer <= 0 && st.reactorPressure > 0) {
            st.reactorTimer = 40;
            st.reactorPressure = 100;
            valveStations.forEach((v) => {
              v.progress = 0;
              v.completed = false;
            });
            setValvesClosedCount(0);
            setReactorPressure(100);
          }
          setReactorTimer(Math.ceil(st.reactorTimer));

          valveStations.forEach((vStat, idx) => {
            if (vStat.completed) return;
            const dValve = st.playerPos.distanceTo(vStat.pos);
            if (dValve < 3.6) {
              activePrompt = `Maintenez [E] pour tourner la Valve Hydraulique #${
                idx + 1
              } (${Math.round(vStat.progress)}%)`;
              if (st.keys['KeyE'] || st.interactRequested) {
                vStat.progress = Math.min(100, vStat.progress + dt * 75);
                vStat.wheel.rotation.y += dt * 9;
                if (vStat.progress >= 100) {
                  vStat.completed = true;
                  vStat.light.color.setHex(0x10b981);
                  const doneCount = valveStations.filter(
                    (vv) => vv.completed
                  ).length;
                  const nextPress = Math.max(0, 100 - doneCount * 34);
                  st.reactorPressure = nextPress;
                  setValvesClosedCount(doneCount);
                  setReactorPressure(nextPress);
                  soundFX.init();
                  soundFX.playOrbCollect(5 + doneCount);
                }
              }
            }
          });

          if (valveStations.every((v) => v.completed)) {
            reactorLight.color.setHex(0x38bdf8);
            const dZero = st.playerPos.distanceTo(zeroDaySphereMesh.position);
            if (dZero < 4.2) {
              st.zeroDayCollected = true;
              zeroDaySphereMesh.visible = false;
              setZeroDayDone(true);
              soundFX.init();
              soundFX.playOrbCollect(9);
              showQuickToast('COMPOSANT 3 OBTENU : Exploit Zéro-Day extrait !');
            } else {
              activePrompt =
                'Pression abaissée ! Approchez-vous du Réacteur pour extraire l’Exploit Zéro-Day !';
            }
          }
        }

        if (
          st.payloadCollected &&
          st.rootCodeCollected &&
          st.zeroDayCollected
        ) {
          forgedVirusOrb.visible = true;
          const dBench = st.playerPos.distanceTo(workbenchGroup.position);
          if (dBench < 5.2) {
            activePrompt =
              'Appuyez sur [E] devant l’Établi Central 3D pour forger le Virus Primordial et tirer la Fusée !';
            if (st.interactRequested) {
              st.interactRequested = false;
              soundFX.init();
              soundFX.playVoidDimensionSeal();
              soundFX.playBossRoar();
              st.stage = 'ROCKET_LAUNCH_3D';
              st.rocketLaunchElapsed = 0;
              setStage('ROCKET_LAUNCH_3D');
            }
          } else {
            activePrompt =
              'Les 3 composants sont réunis ! Rejoignez l’Établi Central 3D au milieu du Hangar !';
          }
        }

        st.interactRequested = false;
        setPromptText(activePrompt);

        const camDist = 9.5;
        const camX =
          st.playerPos.x + Math.sin(st.camYaw) * Math.cos(st.camPitch) * camDist;
        const camY = st.playerPos.y + 3.2 + Math.sin(st.camPitch) * camDist;
        const camZ =
          st.playerPos.z + Math.cos(st.camYaw) * Math.cos(st.camPitch) * camDist;
        camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.18);
        camera.lookAt(
          st.playerPos.x,
          st.playerPos.y + 1.8,
          st.playerPos.z
        );

        renderer.render(scene, camera);
        return;
      }

      if (st.stage === 'ROCKET_LAUNCH_3D') {
        st.rocketLaunchElapsed += dt;
        const t = st.rocketLaunchElapsed;
        rocketFlame.visible = t >= 1.0;

        if (t >= 1.0) {
          const lift = Math.pow(t - 1.0, 2.2) * 18;
          rocketGroup3D.position.y = lift;
        }

        camera.position.set(
          Math.sin(t * 0.5) * 24,
          6 + Math.min(30, t * 5),
          54
        );
        camera.lookAt(
          0,
          rocketGroup3D.position.y + 8,
          rocketGroup3D.position.z
        );

        if (t >= 4.4) {
          st.stage = 'TYPEWRITER_6_MONTHS';
          setStage('TYPEWRITER_6_MONTHS');
        }

        renderer.render(scene, camera);
        return;
      }

      if (st.stage === 'ELYTRA_3D') {
        hangarGroup.visible = false;
        rocketGroup3D.visible = false;
        playerAvatar3D.root.visible = false;
        partnerAvatar3D.root.visible = false;
        canyonGroup.visible = true;

        if (st.elytraBoostTimer > 0) {
          st.elytraBoostTimer = Math.max(0, st.elytraBoostTimer - dt);
        }
        if (st.elytraBlurTimer > 0) {
          st.elytraBlurTimer = Math.max(0, st.elytraBlurTimer - dt);
          setElytraBlur(st.elytraBlurTimer);
        }

        const currentSpeed = st.elytraBoostTimer > 0 ? 78 : st.elytraSpeed;
        setElytraBoostActive(st.elytraBoostTimer > 0);

        st.elytraPos.z -= currentSpeed * dt;
        st.elytraPos.x = THREE.MathUtils.clamp(
          st.elytraPos.x - st.elytraYaw * 26 * dt,
          -14,
          14
        );
        st.elytraPos.y = THREE.MathUtils.clamp(
          st.elytraPos.y + st.elytraPitch * 22 * dt,
          3.5,
          22
        );

        steve3D.root.position.copy(st.elytraPos);
        steve3D.root.rotation.set(
          -Math.PI / 2.3 + st.elytraPitch * 0.5,
          st.elytraYaw * 0.4,
          st.elytraRoll
        );

        canyonObstacles.forEach((obs) => {
          if (obs.type === 'FIREWALL') {
            obs.group.visible = Math.sin(now * 0.012 + obs.phase) > -0.35;
          } else if (obs.type === 'VOXEL_CLUSTER') {
            obs.group.rotation.x += dt * 1.8;
            obs.group.rotation.y += dt * 2.1;
          }

          if (!obs.hit && obs.group.visible) {
            const dz = Math.abs(st.elytraPos.z - obs.z);
            const dx = Math.abs(st.elytraPos.x - obs.x);
            const dy = Math.abs(st.elytraPos.y - obs.y);
            if (dz < 2.2 && dx < obs.radiusX && dy < obs.radiusY) {
              obs.hit = true;
              st.elytraHits += 1;
              st.elytraBlurTimer = 1.25;
              setElytraHits(st.elytraHits);
              setElytraBlur(1.25);
              soundFX.init();
              soundFX.playPlayerHurt();

              if (st.elytraHits >= 3) {
                st.elytraHits = 0;
                st.elytraPos.set(0, 12, 0);
                canyonObstacles.forEach((o) => {
                  o.hit = false;
                });
                boostRings.forEach((b) => {
                  b.collected = false;
                  b.mesh.visible = true;
                });
                setElytraHits(0);
                showQuickToast(
                  '3 IMPACTS SUBIS ! Retour au checkpoint d’entrée du canyon 3D !'
                );
              }
            }
          }
        });

        boostRings.forEach((ring) => {
          ring.mesh.rotation.z += dt * 3.5;
          if (!ring.collected) {
            const dRing = st.elytraPos.distanceTo(ring.mesh.position);
            if (dRing < 3.8) {
              ring.collected = true;
              ring.mesh.visible = false;
              st.elytraBoostTimer = 1.8;
              soundFX.init();
              soundFX.playLightningDash();
              showQuickToast('⚡ ANNEAU DORÉ FRANCHI : BOOST DE VITESSE ACTIF !');
            }
          }
        });

        const progressPct = Math.min(
          100,
          Math.round((Math.abs(st.elytraPos.z) / st.elytraMaxDistance) * 100)
        );
        setElytraProgress(progressPct);

        camera.fov = st.elytraBoostTimer > 0 ? 84 : 70;
        camera.updateProjectionMatrix();
        camera.position.set(
          st.elytraPos.x * 0.75,
          st.elytraPos.y + 2.4,
          st.elytraPos.z + 7.5
        );
        camera.lookAt(
          st.elytraPos.x,
          st.elytraPos.y,
          st.elytraPos.z - 15
        );

        if (Math.abs(st.elytraPos.z) >= st.elytraMaxDistance) {
          soundFX.init();
          soundFX.playBossSlam();
          soundFX.playCinematicChord(3, true);
          st.stage = 'CONFRONTATION_3D';
          setStage('CONFRONTATION_3D');
        }

        renderer.render(scene, camera);
        return;
      }

      if (st.stage === 'CONFRONTATION_3D') {
        hangarGroup.visible = true;
        rocketGroup3D.visible = false;
        canyonGroup.visible = true;
        canyonObstacles.forEach((o) => {
          o.group.visible = false;
        });
        boostRings.forEach((b) => {
          b.mesh.visible = false;
        });

        playerAvatar3D.root.visible = true;
        playerAvatar3D.root.position.set(-2.5, 0, 10);
        playerAvatar3D.root.rotation.y = 0;

        partnerAvatar3D.root.visible = true;
        partnerAvatar3D.root.position.set(2.5, 0, 10);
        partnerAvatar3D.root.rotation.y = 0;

        steve3D.root.visible = true;
        steve3D.root.position.set(0, 0, 18);
        steve3D.root.rotation.set(0, Math.PI, 0);

        camera.fov = 65;
        camera.updateProjectionMatrix();
        camera.position.set(
          Math.sin(now * 0.0005) * 14,
          5.5,
          25
        );
        camera.lookAt(0, 2.0, 13);

        renderer.render(scene, camera);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [showQuickToast]);

  const handleCompleteComponentQuick = (which: 1 | 2 | 3) => {
    const st = sim3DRef.current;
    soundFX.init();
    soundFX.playOrbCollect(8);
    if (which === 1) {
      st.payloadCollected = true;
      setPayloadDone(true);
      showQuickToast('COMPOSANT 1 OBTENU : Payload Corrompu !');
    } else if (which === 2) {
      st.rootCodeCollected = true;
      st.ringLocked = [true, true, true];
      st.hologramActive = false;
      setRootCodeDone(true);
      setHologramModalActive(false);
      showQuickToast('COMPOSANT 2 OBTENU : Code Racine !');
    } else {
      st.zeroDayCollected = true;
      st.reactorPressure = 0;
      setZeroDayDone(true);
      setReactorPressure(0);
      setValvesClosedCount(3);
      showQuickToast('COMPOSANT 3 OBTENU : Exploit Zéro-Day !');
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black text-white font-mono select-none overflow-hidden">
      <div
        ref={mount3DRef}
        style={
          elytraBlur > 0
            ? {
                filter: `blur(${Math.min(6, elytraBlur * 4)}px) contrast(1.4)`,
              }
            : undefined
        }
        className="fixed inset-0 w-full h-full z-0"
      />

      {toastBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-950/95 border-2 border-amber-400 text-amber-300 text-xs font-black uppercase tracking-wider shadow-[0_0_40px_rgba(251,191,36,0.5)]">
          {toastBanner}
        </div>
      )}

      {stage === 'HANGAR_3D' && (
        <>
          <div className="fixed top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
            <div className="bg-slate-950/90 border border-fuchsia-500/60 rounded-2xl px-4 py-2.5 backdrop-blur-xl shadow-2xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">
                OPEN-WORLD INTERNET 3D (THREE.JS) • HANGAR DES AVATARS
              </div>
              <div className="text-xs font-bold text-white mt-0.5">
                ZQSD/Flèches : Marcher • ESPACE : Sauter • Souris (Clic maintenu) : Caméra Orbitale • [E] : Interagir
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sim3DRef.current.teleportTarget = 'PARKOUR';
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 cursor-pointer ${
                  payloadDone
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900/90 border-rose-500/60 text-rose-200 hover:bg-slate-800'
                }`}
              >
                {payloadDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
                <span>1. Parkour Serveurs (Payload)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sim3DRef.current.teleportTarget = 'HOLOGRAM';
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 cursor-pointer ${
                  rootCodeDone
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900/90 border-cyan-500/60 text-cyan-200 hover:bg-slate-800'
                }`}
              >
                {rootCodeDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
                <span>2. Anneaux Holographiques (Code Racine)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sim3DRef.current.teleportTarget = 'VALVES';
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 cursor-pointer ${
                  zeroDayDone
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900/90 border-amber-500/60 text-amber-200 hover:bg-slate-800'
                }`}
              >
                {zeroDayDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
                <span>
                  3. Valves Réacteur ({valvesClosedCount}/3 • {reactorTimer}s)
                </span>
              </button>
            </div>
          </div>

          {hologramModalActive && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-lg bg-slate-950/92 border-2 border-cyan-400 rounded-3xl p-5 text-center shadow-[0_0_70px_rgba(56,189,248,0.5)] pointer-events-auto space-y-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                PUZZLE D’ALIGNEMENT HOLOGRAPHIQUE 3D — ANNEAU {lockedRingsCount + 1} / 3
              </div>
              <p className="text-xs text-slate-200">
                Cliquez sur Verrouiller (ou appuyez sur <strong className="text-amber-300">ESPACE</strong>) lorsque le marqueur doré de l’anneau 3D passe sous le cône vert supérieur !
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sim3DRef.current.interactRequested = true;
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-xs uppercase cursor-pointer"
                >
                  🔒 Stopper &amp; Verrouiller l’Anneau ({lockedRingsCount}/3)
                </button>
                <button
                  type="button"
                  onClick={() => handleCompleteComponentQuick(2)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 font-bold text-xs cursor-pointer"
                >
                  Forcer Alignement
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sim3DRef.current.hologramActive = false;
                    setHologramModalActive(false);
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-900 text-slate-400 text-xs cursor-pointer"
                >
                  Quitter
                </button>
              </div>
            </div>
          )}

          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[95vw] max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/90 border border-white/15 rounded-2xl px-5 py-3 backdrop-blur-xl pointer-events-auto">
            <div className="text-xs font-bold text-cyan-200">
              {promptText ||
                'Explorez le Hangar 3D : récupérez les 3 composants (Parkour, Hologramme, Valves du Réacteur) puis forgez le Virus sur l’Établi Central.'}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!payloadDone && (
                <button
                  type="button"
                  onClick={() => handleCompleteComponentQuick(1)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-[10px] font-bold cursor-pointer"
                >
                  + Payload
                </button>
              )}
              {!zeroDayDone && (
                <button
                  type="button"
                  onClick={() => handleCompleteComponentQuick(3)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[10px] font-bold cursor-pointer"
                >
                  + Valves ({reactorPressure}%)
                </button>
              )}
              {payloadDone && rootCodeDone && zeroDayDone && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.init();
                    soundFX.playVoidDimensionSeal();
                    soundFX.playBossRoar();
                    sim3DRef.current.stage = 'ROCKET_LAUNCH_3D';
                    sim3DRef.current.rocketLaunchElapsed = 0;
                    setStage('ROCKET_LAUNCH_3D');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 text-slate-950 font-black text-xs cursor-pointer animate-pulse"
                >
                  🚀 Forger le Virus &amp; Lancer la Fusée 3D
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {stage === 'ROCKET_LAUNCH_3D' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 bg-slate-950/90 border-2 border-amber-400 rounded-2xl px-6 py-4 text-center shadow-2xl">
          <div className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center justify-center gap-2">
            <Rocket className="w-4 h-4" />
            CINÉMATIQUE 3D • DÉCOLLAGE ORBITAL DE LA FUSÉE
          </div>
          <div className="text-sm font-bold text-white mt-1">
            Le Virus Primordial est expédié en orbite dans le ciel numérique...
          </div>
        </div>
      )}

      {stage === 'TYPEWRITER_6_MONTHS' && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-8">
          <div className="text-2xl sm:text-4xl font-black text-emerald-400 tracking-[0.2em] text-center">
            {typewriterText}
            <span className="inline-block w-3 h-7 bg-emerald-400 ml-1 animate-ping align-middle" />
          </div>
        </div>
      )}

      {(stage === 'NEW_DESKTOP_BREACH' ||
        stage === 'MINECRAFT_WINDOW_EXIT' ||
        stage === 'DESKTOP_COMBAT_DRONES') && (
        <div
          onMouseDown={
            stage === 'DESKTOP_COMBAT_DRONES'
              ? handleDesktopCombatSweepAttack
              : undefined
          }
          onMouseMove={
            stage === 'DESKTOP_COMBAT_DRONES'
              ? (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  desktopCombatRef.current.mouseX =
                    ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
                  desktopCombatRef.current.mouseY =
                    ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100;
                }
              : undefined
          }
          className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden font-sans select-none"
          style={{
            background:
              'linear-gradient(135deg, #0284c7 0%, #1d4ed8 48%, #0f172a 100%)',
          }}
        >
          <div className="relative flex-1 overflow-hidden">
            <div className="absolute left-6 top-6 flex flex-col gap-5 z-10">
              <div className="flex flex-col items-center w-20 text-center">
                <div className="w-12 h-12 rounded-xl bg-sky-500/30 border border-sky-300/60 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-sky-200" />
                </div>
                <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
                  Nouveau PC
                </span>
              </div>

              <button
                type="button"
                onClick={
                  stage === 'NEW_DESKTOP_BREACH'
                    ? triggerAltTabToMinecraft
                    : undefined
                }
                className={`flex flex-col items-center w-20 text-center p-1.5 rounded-xl transition-all cursor-pointer ${
                  stage === 'NEW_DESKTOP_BREACH' && breachTimer >= 2.1
                    ? 'bg-emerald-500/35 border-2 border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.9)] animate-bounce'
                    : 'bg-emerald-900/30 border border-emerald-400/50'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-emerald-500 to-amber-800 border-2 border-emerald-200 flex items-center justify-center font-mono font-black text-xs text-white">
                  MC
                </div>
                <span className="text-[11px] font-extrabold text-emerald-200 mt-1 drop-shadow">
                  Minecraft
                </span>
              </button>
            </div>

            {stage === 'NEW_DESKTOP_BREACH' &&
              breachTimer >= 1.1 &&
              breachTimer < 2.2 && (
                <svg
                  viewBox="0 0 1000 600"
                  className="absolute inset-0 w-full h-full pointer-events-none z-20"
                >
                  <line
                    x1="120"
                    y1="0"
                    x2={
                      120 +
                      Math.min(1, (breachTimer - 1.1) / 0.9) * 825
                    }
                    y2={Math.min(1, (breachTimer - 1.1) / 0.9) * 585}
                    stroke="#ef4444"
                    strokeWidth="14"
                  />
                  <circle
                    cx={
                      120 +
                      Math.min(1, (breachTimer - 1.1) / 0.9) * 825
                    }
                    cy={Math.min(1, (breachTimer - 1.1) / 0.9) * 585}
                    r="24"
                    fill="#fef08a"
                  />
                </svg>
              )}

            {(stage !== 'NEW_DESKTOP_BREACH' || breachTimer >= 2.1) && (
              <div className="absolute right-0 bottom-0 w-[360px] h-[290px] pointer-events-none z-20">
                <svg viewBox="0 0 400 320" className="w-full h-full">
                  <polygon
                    points="110,320 195,155 295,95 400,35 400,320"
                    fill="#03000a"
                    stroke="#f43f5e"
                    strokeWidth="5"
                  />
                  <polyline
                    points="195,155 125,110 75,125"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                  />
                  <polyline
                    points="295,95 250,35 210,15"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="3"
                  />
                  <polyline
                    points="195,155 155,235 80,265"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            )}

            {stage === 'NEW_DESKTOP_BREACH' && (
              <>
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-slate-950/90 border border-white/20 rounded-2xl px-6 py-3 text-center backdrop-blur-md">
                  <div className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-300">
                    {breachTimer < 1.1
                      ? 'ÉTAPE 1/4 • NOUVEAU BUREAU WINDOWS PROPRE'
                      : breachTimer < 2.1
                      ? 'ÉTAPE 2/4 • TRAÎNÉE ROUGE FRAPPANT L’ICÔNE RÉSEAU'
                      : 'ÉTAPE 3/4 • FISSURATION DU COIN INFÉRIEUR DROIT & APPARITION DU VIRUS'}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                    {breachTimer < 1.1
                      ? '6 mois plus tard, votre nouvel ordinateur fonctionne paisiblement...'
                      : breachTimer < 2.1
                      ? 'ALERTE : L’ogive virale frappe l’icône Réseau dans la barre des tâches !'
                      : 'Le coin inférieur droit est brisé ! Le Virus Primordial infiltre le bureau !'}
                  </div>
                </div>

                {breachTimer >= 2.1 && (
                  <div
                    className="absolute z-25 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ left: '78%', top: '54%' }}
                  >
                    <div className="w-24 h-24 rounded-full bg-rose-600/35 border-4 border-rose-500 shadow-[0_0_55px_rgba(244,63,94,0.95)] flex items-center justify-center animate-pulse">
                      <ShieldAlert className="w-12 h-12 text-rose-200" />
                    </div>
                    <span className="mt-2 px-3 py-1 rounded-full bg-rose-950/95 border border-rose-400 text-[10px] font-mono font-black text-rose-200 uppercase">
                      VIRUS PRIMORDIAL DÉTECTÉ
                    </span>
                  </div>
                )}

                {waitingForAltTab && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px]">
                    <div className="max-w-lg w-[92vw] bg-slate-950/95 border-2 border-amber-400 rounded-3xl p-6 text-center shadow-[0_0_80px_rgba(251,191,36,0.65)] space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300 text-amber-300 text-xs font-mono font-black uppercase">
                        <Sparkles className="w-4 h-4" />
                        ACTION REQUISE • NE PAS SKIPPER
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                        APPUYEZ SUR ALT + TAB
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300">
                        Basculez sur la fenêtre <strong className="text-emerald-300">Minecraft</strong> en arrière-plan (ou cliquez sur l’icône Minecraft qui clignote) pour appeler Steve en armure de Netherite à la rescousse !
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={triggerAltTabToMinecraft}
                          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 text-slate-950 font-mono font-black text-sm uppercase shadow-[0_0_30px_rgba(251,191,36,0.6)] cursor-pointer animate-pulse"
                        >
                          [ ALT + TAB ] Ouvrir Minecraft au 1er Plan
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {(stage === 'MINECRAFT_WINDOW_EXIT' ||
              stage === 'DESKTOP_COMBAT_DRONES') && (
              <div
                className="absolute left-[14%] top-[18%] w-[380px] sm:w-[440px] h-[250px] bg-slate-900/95 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.4)] overflow-hidden z-15 pointer-events-none"
              >
                <div className="h-8 bg-slate-950 px-3 flex items-center justify-between border-b border-slate-800">
                  <span className="text-[11px] font-mono font-bold text-emerald-300">
                    Minecraft 1.21.4 — Singleplayer (Premier Plan)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  </div>
                </div>
                <div
                  className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
                  style={{
                    background:
                      'linear-gradient(180deg, #38bdf8 0%, #bae6fd 55%, #15803d 55%, #14532d 100%)',
                  }}
                >
                  <div className="px-3 py-1 rounded bg-slate-950/80 text-[10px] font-mono font-bold text-emerald-300">
                    {stage === 'MINECRAFT_WINDOW_EXIT' && exitWindowTimer < 0.95
                      ? 'Steve équipe son Épée en Netherite...'
                      : 'Cadre de fenêtre franchi — Steve est sur le Bureau !'}
                  </div>
                </div>
              </div>
            )}

            {stage === 'MINECRAFT_WINDOW_EXIT' && (
              <>
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950/92 border-2 border-emerald-400 rounded-2xl px-6 py-3 text-center shadow-2xl">
                  <div className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-300">
                    ALT + TAB ACTIVÉ • SORTIE HORS DU CADRE DE LA FENÊTRE
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                    Steve enjambe la bordure de la fenêtre Minecraft et pose le pied sur votre Bureau Windows !
                  </div>
                </div>

                <div
                  className="absolute z-35 -translate-x-1/2 -translate-y-1/2 transition-all duration-150 flex flex-col items-center"
                  style={{
                    left: `${28 + Math.min(1, exitWindowTimer / 2.2) * 14}%`,
                    top: `${36 + Math.min(1, exitWindowTimer / 2.2) * 22}%`,
                    transform: `translate(-50%, -50%) scale(${
                      0.85 + Math.min(1, exitWindowTimer / 2.2) * 0.35
                    })`,
                  }}
                >
                  <div className="w-16 h-20 rounded-xl bg-zinc-800 border-2 border-purple-400 shadow-[0_0_35px_rgba(168,85,247,0.85)] flex flex-col items-center justify-center">
                    <div className="w-8 h-2 bg-cyan-300 mb-1" />
                    <Swords className="w-7 h-7 text-purple-300" />
                  </div>
                  <span className="mt-1.5 px-2.5 py-0.5 rounded bg-slate-950/90 border border-purple-400 text-[10px] font-mono font-black text-purple-200">
                    STEVE (NETHERITE)
                  </span>
                </div>
              </>
            )}

            {stage === 'DESKTOP_COMBAT_DRONES' && (
              <>
                <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                  <div className="bg-slate-950/92 border border-purple-400/70 rounded-2xl px-4 py-2.5 backdrop-blur-md">
                    <div className="text-[10px] font-mono font-black uppercase tracking-widest text-purple-300">
                      COMBAT SUR LE BUREAU • VAGUE DE DRONES / ZOMBIES {droneWave} / 3
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      ZQSD/Flèches : Bouger Steve • CLIC GAUCHE : Balayage Épée Netherite (One-Shot les Drones &amp; Zombies) • ESPACE : Dash
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 bg-slate-950/92 border border-rose-500/60 rounded-2xl px-4 py-2.5">
                    <div className="text-xs font-mono font-bold text-emerald-300">
                      PV Steve : {steveHp}%
                    </div>
                    <div className="text-xs font-mono font-bold text-cyan-300">
                      Bouclier Virus : {Math.round(virusShield)}%
                    </div>
                    <div className="text-xs font-mono font-black text-rose-400">
                      PV Virus : {Math.round(virusHp)}%
                    </div>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        desktopCombatRef.current.virusShield = 0;
                        desktopCombatRef.current.virusHp = 0;
                      }}
                      className="pointer-events-auto px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-[10px] uppercase cursor-pointer"
                    >
                      Purger Virus &rarr; Vol Élytres 3D
                    </button>
                  </div>
                </div>

                {minions.map((m) => (
                  <div
                    key={m.id}
                    className="absolute z-25 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center shadow-lg ${
                        m.kind === 'DRONE'
                          ? 'bg-rose-950/90 border-rose-400 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.8)]'
                          : 'bg-emerald-950/90 border-lime-400 text-lime-300 shadow-[0_0_16px_rgba(132,204,22,0.8)]'
                      }`}
                    >
                      {m.kind === 'DRONE' ? (
                        <Zap className="w-5 h-5" />
                      ) : (
                        <Cpu className="w-5 h-5" />
                      )}
                    </div>
                    <span className="mt-0.5 px-1.5 py-0.2 bg-slate-950/85 text-[9px] font-mono font-bold text-white rounded">
                      {m.kind === 'DRONE' ? 'DRONE' : 'ZOMBIE.EXE'}
                    </span>
                  </div>
                ))}

                {virusOrbs.map((o) => (
                  <div
                    key={o.id}
                    className={`absolute z-25 w-5 h-5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
                      o.reflected
                        ? 'bg-cyan-300 shadow-[0_0_18px_#22d3ee]'
                        : 'bg-rose-500 shadow-[0_0_16px_#f43f5e]'
                    }`}
                    style={{ left: `${o.x}%`, top: `${o.y}%` }}
                  />
                ))}

                <div
                  className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
                  style={{ left: `${virusPos.x}%`, top: `${virusPos.y}%` }}
                >
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all ${
                      virusShield > 0
                        ? 'bg-rose-950/90 border-cyan-400 shadow-[0_0_45px_rgba(34,211,238,0.85)]'
                        : 'bg-rose-600/40 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.95)]'
                    }`}
                  >
                    <ShieldAlert className="w-12 h-12 text-rose-200" />
                  </div>
                  <div className="mt-1.5 px-2.5 py-0.5 rounded bg-slate-950/90 border border-rose-400 text-[10px] font-mono font-black text-rose-200">
                    {virusShield > 0
                      ? `BOUCLIER ACTIF (${Math.round(virusShield)}%)`
                      : `VIRUS VULNÉRABLE (${Math.round(virusHp)}% PV)`}
                  </div>
                </div>

                <div
                  className="absolute z-35 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
                  style={{ left: `${stevePos.x}%`, top: `${stevePos.y}%` }}
                >
                  {steveSweepTimer > 0 && (
                    <div
                      className="absolute w-44 h-44 rounded-full border-4 border-purple-400 bg-purple-500/25 shadow-[0_0_45px_rgba(168,85,247,0.9)]"
                      style={{
                        transform: `rotate(${steveSweepAngle}rad)`,
                      }}
                    />
                  )}
                  <div className="w-14 h-16 rounded-xl bg-zinc-800 border-2 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.85)] flex flex-col items-center justify-center">
                    <div className="w-7 h-1.5 bg-cyan-300 mb-1" />
                    <Swords className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="mt-1 px-2 py-0.5 rounded bg-slate-950/90 border border-purple-400 text-[10px] font-mono font-black text-purple-200">
                    STEVE • SWEEP ATTACK
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="h-12 bg-slate-950/95 border-t border-white/15 px-4 flex items-center justify-between text-xs z-40">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sky-300">⊞ Démarrer</span>
              <button
                type="button"
                onClick={
                  stage === 'NEW_DESKTOP_BREACH'
                    ? triggerAltTabToMinecraft
                    : undefined
                }
                className={`px-3 py-1.5 rounded-lg font-mono font-black text-xs flex items-center gap-2 cursor-pointer ${
                  stage === 'NEW_DESKTOP_BREACH' && breachTimer >= 2.1
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.95)] animate-pulse'
                    : 'bg-slate-800 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                <span>⛏ Minecraft 1.21.4</span>
                {stage === 'NEW_DESKTOP_BREACH' && breachTimer >= 2.1 && (
                  <span className="text-[10px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded">
                    CLIQUEZ OU ALT+TAB
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`font-mono font-bold flex items-center gap-1 ${
                  breachTimer >= 1.1 ? 'text-rose-400' : 'text-emerald-300'
                }`}
              >
                <Wifi className="w-4 h-4" />
                {breachTimer >= 2.1
                  ? 'COIN ÉCRAN BRISÉ'
                  : breachTimer >= 1.1
                  ? 'IMPACT RÉSEAU !'
                  : 'Réseau Connecté'}
              </span>
              <Volume2 className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      )}

      {stage === 'ELYTRA_3D' && (
        <div className="fixed top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="bg-slate-950/90 border border-cyan-400/60 rounded-2xl px-4 py-2.5 backdrop-blur-xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              VOL EN ÉLYTRES 100% 3D (THREE.JS) • CANYON CYBERSPATIAL
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              Déplacez la souris (Pitch / Yaw / Roulis) pour éviter les pare-feu laser, câbles de fibre optique et voxels corrompus !
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/90 border border-white/15 rounded-2xl px-4 py-2.5">
            {elytraBoostActive && (
              <span className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-black text-xs animate-pulse">
                ⚡ BOOST DORÉ
              </span>
            )}
            <div className="text-xs font-bold text-rose-300">
              Stabilité : {Math.max(0, 3 - elytraHits)} / 3
            </div>
            <div className="w-36 h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                style={{ width: `${elytraProgress}%` }}
              />
            </div>
            <span className="text-xs font-black text-emerald-300">
              {elytraProgress}%
            </span>
          </div>
        </div>
      )}

      {stage === 'CONFRONTATION_3D' && (
        <div className="fixed inset-x-0 bottom-8 z-40 flex justify-center px-4 pointer-events-auto">
          <div className="max-w-2xl w-full bg-slate-950/92 border-2 border-emerald-400 rounded-3xl p-6 text-center shadow-[0_0_90px_rgba(16,185,129,0.5)] backdrop-blur-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-widest">
              <Swords className="w-4 h-4" />
              ATTERRISSAGE 3D SUR LE PARVIS DU HANGAR RÉUSSI
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white uppercase">
              STEVE FAIT FACE AUX DEUX AVATARS DEVANT LE HANGAR 3D !
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans">
              Après avoir franchi le canyon cyberspatial en Élytres 3D, Steve en armure complète de Netherite atterrit en douceur sur le parvis du hangar 3D des deux avatars pour la confrontation ultime.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onReturnToMainMenu}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Retour au Menu Principal
              </button>
              <button
                type="button"
                onClick={onRestartFullMiniGame}
                className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Rejouer la Séquence Complète
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
