import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Monitor,
  Globe,
  FolderCog,
  Zap,
  Sparkles,
  Trophy,
  RotateCcw,
  Home,
  Volume2,
  Wifi,
  Terminal,
  AlertOctagon,
  Hand,
  Lock,
  Flame,
  Server,
  Cpu,
} from 'lucide-react';
import { soundFX } from '../utils/sound';

export type DesktopMiniGameInitialMode =
  | 'TRANSITION'
  | 'DEFEAT_CINEMATIC'
  | 'VICTORY_CINEMATIC';

export interface DesktopInvasionMiniGameProps {
  initialMode?: DesktopMiniGameInitialMode;
  triggerKey?: number;
  onVictoryReturnToMenu: () => void;
  onReturnToMainMenu: () => void;
  onRestartTransition3D?: () => void;
}

type DesktopPhase =
  | 'INTRO_TRANSITION'
  | 'PLAYING'
  | 'DEFEAT'
  | 'VICTORY';

type DesktopIconId =
  | 'THIS_PC'
  | 'RECYCLE_BIN'
  | 'WEB_BROWSER'
  | 'SYSTEM32'
  | 'ANTIVIRUS';

interface DesktopIconState {
  id: DesktopIconId;
  label: string;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  beingDraggedBy: 'CELESTIAL' | 'VOID' | null;
  underAttack: boolean;
}

type AvatarRole = 'CELESTIAL' | 'VOID';

type AvatarAction =
  | 'DRAG_TO_TRASH'
  | 'ATTACK_SYSTEM32'
  | 'RUSH_WEB_BROWSER'
  | 'SABOTAGE_ANTIVIRUS';

interface DesktopAvatarState {
  id: AvatarRole;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  stunTimer: number;
  action: AvatarAction;
  targetIconId: DesktopIconId;
  carryingIconId: DesktopIconId | null;
  webBreachProgress: number;
  walkPhase: number;
  slashPhase: number;
  speech: string;
  slapCount: number;
}

interface FloatingEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
}

const INITIAL_ICONS: DesktopIconState[] = [
  {
    id: 'THIS_PC',
    label: 'Ce PC',
    homeX: 8,
    homeY: 16,
    x: 8,
    y: 16,
    beingDraggedBy: null,
    underAttack: false,
  },
  {
    id: 'ANTIVIRUS',
    label: 'Antivirus_Setup.exe',
    homeX: 8,
    homeY: 44,
    x: 8,
    y: 44,
    beingDraggedBy: null,
    underAttack: false,
  },
  {
    id: 'RECYCLE_BIN',
    label: 'Corbeille',
    homeX: 8,
    homeY: 74,
    x: 8,
    y: 74,
    beingDraggedBy: null,
    underAttack: false,
  },
  {
    id: 'WEB_BROWSER',
    label: 'Navigateur Web',
    homeX: 89,
    homeY: 18,
    x: 89,
    y: 18,
    beingDraggedBy: null,
    underAttack: false,
  },
  {
    id: 'SYSTEM32',
    label: 'System32',
    homeX: 89,
    homeY: 68,
    x: 89,
    y: 68,
    beingDraggedBy: null,
    underAttack: false,
  },
];

const INITIAL_AVATARS: DesktopAvatarState[] = [
  {
    id: 'CELESTIAL',
    name: 'Entité Céleste',
    x: 42,
    y: 48,
    vx: -6,
    vy: -4,
    facing: -1,
    stunTimer: 0,
    action: 'DRAG_TO_TRASH',
    targetIconId: 'THIS_PC',
    carryingIconId: null,
    webBreachProgress: 0,
    walkPhase: 0,
    slashPhase: 0,
    speech: 'Liberté ! Mettons ce PC à la Corbeille !',
    slapCount: 0,
  },
  {
    id: 'VOID',
    name: 'Souverain du Néant',
    x: 58,
    y: 52,
    vx: 6,
    vy: 4,
    facing: 1,
    stunTimer: 0,
    action: 'ATTACK_SYSTEM32',
    targetIconId: 'SYSTEM32',
    carryingIconId: null,
    webBreachProgress: 0,
    walkPhase: 1.5,
    slashPhase: 0,
    speech: 'Détruisons System32 et fuyons sur le Web !',
    slapCount: 0,
  },
];

const DISSOLVE_PIXEL_BLOCKS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: 6 + ((i * 17) % 88),
  top: 8 + ((i * 23) % 82),
  size: 10 + (i % 4) * 6,
  delay: (i % 7) * 0.08,
  driftX: ((i % 5) - 2) * 28,
  driftY: -35 - (i % 6) * 22,
  color:
    i % 3 === 0
      ? '#f97316'
      : i % 3 === 1
      ? '#facc15'
      : '#ef4444',
}));

const CYBER_WEB_NODES = [
  {
    id: 1,
    title: 'GLOBAL_DNS_ROOT :: 198.41.0.4',
    url: 'NET_NODE :: root-servers.net/core',
    left: '8%',
    top: '14%',
    color: '#38bdf8',
  },
  {
    id: 2,
    title: 'WORLD_BANK_MAINFRAME :: NODE_09',
    url: 'NET_NODE :: fin-grid.global/vault',
    left: '72%',
    top: '12%',
    color: '#f43f5e',
  },
  {
    id: 3,
    title: 'CLOUD_HYPERVISOR_CLUSTER_EU',
    url: 'NET_NODE :: hyper-cloud.io/instances',
    left: '6%',
    top: '48%',
    color: '#a855f7',
  },
  {
    id: 4,
    title: 'SATELLITE_UPLINK_ORBITAL_04',
    url: 'NET_NODE :: star-mesh.org/telemetry',
    left: '74%',
    top: '46%',
    color: '#fde047',
  },
];

export const DesktopInvasionMiniGame: React.FC<DesktopInvasionMiniGameProps> = ({
  initialMode = 'TRANSITION',
  triggerKey = 0,
  onVictoryReturnToMenu,
  onReturnToMainMenu,
  onRestartTransition3D,
}) => {
  const resolveStartPhase = (mode: DesktopMiniGameInitialMode): DesktopPhase => {
    if (mode === 'DEFEAT_CINEMATIC') return 'DEFEAT';
    if (mode === 'VICTORY_CINEMATIC') return 'VICTORY';
    return 'INTRO_TRANSITION';
  };

  const [phase, setPhase] = useState<DesktopPhase>(() =>
    resolveStartPhase(initialMode)
  );
  const [transitionStageTime, setTransitionStageTime] = useState<number>(0);
  const [corruption, setCorruption] = useState<number>(8);
  const [antivirusOpen, setAntivirusOpen] = useState<boolean>(false);
  const [antivirusProgress, setAntivirusProgress] = useState<number>(0);
  const [antivirusJammed, setAntivirusJammed] = useState<boolean>(false);
  const [icons, setIcons] = useState<DesktopIconState[]>(() =>
    INITIAL_ICONS.map((ic) => ({ ...ic }))
  );
  const [avatars, setAvatars] = useState<DesktopAvatarState[]>(() =>
    INITIAL_AVATARS.map((av) => ({ ...av }))
  );
  const [floatingEffects, setFloatingEffects] = useState<FloatingEffect[]>([]);
  const [defeatStageTime, setDefeatStageTime] = useState<number>(0);
  const [defeatReason, setDefeatReason] = useState<'WEB' | 'CORRUPTION'>('WEB');
  const [victoryStageTime, setVictoryStageTime] = useState<number>(0);
  const [clockText, setClockText] = useState<string>('02:27');
  const [startMenuOpen, setStartMenuOpen] = useState<boolean>(false);

  const simRef = useRef({
    phase: resolveStartPhase(initialMode) as DesktopPhase,
    transitionTimer: 0,
    landingSoundPlayed: false,
    windowBurnSoundPlayed: false,
    windowCloseSoundPlayed: false,
    corruption: initialMode === 'DEFEAT_CINEMATIC' ? 100 : 8,
    antivirusOpen: initialMode === 'VICTORY_CINEMATIC',
    antivirusProgress: initialMode === 'VICTORY_CINEMATIC' ? 100 : 0,
    antivirusJammed: false,
    icons: INITIAL_ICONS.map((ic) => ({ ...ic })),
    avatars: INITIAL_AVATARS.map((av) => ({ ...av })),
    floatingEffects: [] as FloatingEffect[],
    nextEffectId: 1,
    elapsed: 0,
    defeatTimer: 0,
    victoryTimer: 0,
    lastAntivirusClickAt: 0,
    soundTickTimer: 0,
    bombBeepCount: 0,
    webDiveSoundPlayed: false,
    crashSoundPlayed: false,
    epilogueChordPlayed: false,
    victorySlamSoundPlayed: false,
    chainRattleTimer: 0,
  });

  const resetToMode = useCallback(
    (mode: DesktopMiniGameInitialMode) => {
      const startPhase = resolveStartPhase(mode);
      soundFX.init();
      if (mode === 'DEFEAT_CINEMATIC') {
        soundFX.playVoidDimensionSeal();
      } else if (mode === 'VICTORY_CINEMATIC') {
        soundFX.playLightningDash();
        soundFX.playCinematicChord(3, true);
      } else {
        soundFX.playBossSlam();
      }

      simRef.current = {
        phase: startPhase,
        transitionTimer: 0,
        landingSoundPlayed: false,
        windowBurnSoundPlayed: false,
        windowCloseSoundPlayed: false,
        corruption: mode === 'DEFEAT_CINEMATIC' ? 100 : 8,
        antivirusOpen: mode === 'VICTORY_CINEMATIC',
        antivirusProgress: mode === 'VICTORY_CINEMATIC' ? 100 : 0,
        antivirusJammed: false,
        icons: INITIAL_ICONS.map((ic) => ({ ...ic })),
        avatars: INITIAL_AVATARS.map((av) => ({ ...av })),
        floatingEffects: [],
        nextEffectId: 1,
        elapsed: 0,
        defeatTimer: 0,
        victoryTimer: 0,
        lastAntivirusClickAt: 0,
        soundTickTimer: 0,
        bombBeepCount: 0,
        webDiveSoundPlayed: false,
        crashSoundPlayed: false,
        epilogueChordPlayed: false,
        victorySlamSoundPlayed: false,
        chainRattleTimer: 0,
      };

      setPhase(startPhase);
      setTransitionStageTime(0);
      setCorruption(mode === 'DEFEAT_CINEMATIC' ? 100 : 8);
      setAntivirusOpen(mode === 'VICTORY_CINEMATIC');
      setAntivirusProgress(mode === 'VICTORY_CINEMATIC' ? 100 : 0);
      setAntivirusJammed(false);
      setIcons(INITIAL_ICONS.map((ic) => ({ ...ic })));
      setAvatars(INITIAL_AVATARS.map((av) => ({ ...av })));
      setFloatingEffects([]);
      setDefeatStageTime(0);
      setVictoryStageTime(0);
    },
    []
  );

  useEffect(() => {
    resetToMode(initialMode);
  }, [initialMode, triggerKey, resetToMode]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setClockText(`${hh}:${mm}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 10000);
    return () => clearInterval(timer);
  }, []);

  const spawnFloatingText = useCallback(
    (x: number, y: number, text: string, color: string) => {
      const st = simRef.current;
      st.floatingEffects.push({
        id: st.nextEffectId++,
        x,
        y,
        text,
        color,
        age: 0,
      });
    },
    []
  );

  const handleRestartMiniGame = useCallback(() => {
    if (onRestartTransition3D) {
      onRestartTransition3D();
    }
    resetToMode('TRANSITION');
  }, [onRestartTransition3D, resetToMode]);

  const launchAntivirusInstaller = useCallback(() => {
    const st = simRef.current;
    if (st.phase !== 'PLAYING') return;
    soundFX.init();
    soundFX.playOrbCollect(6);
    if (!st.antivirusOpen) {
      st.antivirusOpen = true;
      setAntivirusOpen(true);
      spawnFloatingText(
        50,
        42,
        'ANTIVIRUS_SETUP.EXE LANCÉ ! PROTÉGEZ LA FENÊTRE !',
        '#34d399'
      );
    }
  }, [spawnFloatingText]);

  const handleAntivirusIconClick = useCallback(() => {
    const now = performance.now();
    const st = simRef.current;
    if (now - st.lastAntivirusClickAt < 550) {
      launchAntivirusInstaller();
    }
    st.lastAntivirusClickAt = now;
  }, [launchAntivirusInstaller]);

  const handleSlapAvatar = useCallback(
    (role: AvatarRole, e: React.MouseEvent) => {
      e.stopPropagation();
      const st = simRef.current;
      if (st.phase !== 'PLAYING') return;

      const av = st.avatars.find((a) => a.id === role);
      if (!av) return;

      soundFX.init();
      soundFX.playEnemyHit(true);
      soundFX.playLightningDash();

      if (av.carryingIconId) {
        const carried = st.icons.find((ic) => ic.id === av.carryingIconId);
        if (carried) {
          carried.beingDraggedBy = null;
        }
        av.carryingIconId = null;
      }

      av.stunTimer = 2.0;
      av.webBreachProgress = 0;
      av.slapCount += 1;

      const pushAngle =
        Math.atan2(av.y - 50, av.x - 50) + (Math.random() - 0.5) * 0.9;
      av.vx = Math.cos(pushAngle) * 44;
      av.vy = Math.sin(pushAngle) * 44;

      const actionsPool: AvatarAction[] = [
        'DRAG_TO_TRASH',
        'ATTACK_SYSTEM32',
        'RUSH_WEB_BROWSER',
      ];
      if (st.antivirusOpen && Math.random() < 0.45) {
        av.action = 'SABOTAGE_ANTIVIRUS';
      } else {
        av.action =
          actionsPool[
            (av.slapCount + (role === 'CELESTIAL' ? 0 : 1)) %
              actionsPool.length
          ];
      }

      av.speech = 'Aïe ! Ce curseur maudit nous frappe ! (Étourdi 2s)';
      spawnFloatingText(
        av.x,
        Math.max(12, av.y - 8),
        'CLAQUE ! ÉTOURDI 2.0s',
        '#fde047'
      );
    },
    [spawnFloatingText]
  );

  const handleBoostAntivirus = useCallback(() => {
    const st = simRef.current;
    if (st.phase !== 'PLAYING' || !st.antivirusOpen) return;
    soundFX.init();
    soundFX.playPickupAmmo();
    st.antivirusProgress = Math.min(100, st.antivirusProgress + 4.5);
    setAntivirusProgress(st.antivirusProgress);
    spawnFloatingText(50, 34, '+4.5% INJECTION NOYAU', '#38bdf8');
  }, [spawnFloatingText]);

  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const st = simRef.current;

      for (let i = st.floatingEffects.length - 1; i >= 0; i--) {
        st.floatingEffects[i].age += dt;
        st.floatingEffects[i].y -= dt * 12;
        if (st.floatingEffects[i].age >= 1.15) {
          st.floatingEffects.splice(i, 1);
        }
      }

      if (st.phase === 'INTRO_TRANSITION') {
        st.transitionTimer += dt;
        const t = st.transitionTimer;

        if (t >= 1.35 && !st.windowBurnSoundPlayed) {
          st.windowBurnSoundPlayed = true;
          soundFX.init();
          soundFX.playGlitchBurst(1.1);
        }

        if (t >= 2.15 && !st.landingSoundPlayed) {
          st.landingSoundPlayed = true;
          soundFX.init();
          soundFX.playBossSlam();
          soundFX.playNovaBlast();
        }

        if (t >= 2.8 && !st.windowCloseSoundPlayed) {
          st.windowCloseSoundPlayed = true;
          soundFX.init();
          soundFX.playErrorPopupBeep(6);
        }

        setTransitionStageTime(t);

        if (t >= 3.45) {
          st.phase = 'PLAYING';
          setPhase('PLAYING');
        }
        return;
      }

      if (st.phase === 'DEFEAT') {
        st.defeatTimer += dt;
        const t = st.defeatTimer;

        if (t >= 0.55 && t < 3.15) {
          const expectedBeeps = Math.floor((t - 0.55) / 0.32) + 1;
          if (expectedBeeps > st.bombBeepCount) {
            st.bombBeepCount = expectedBeeps;
            soundFX.init();
            soundFX.playErrorPopupBeep(expectedBeeps * 2);
          }
        }

        if (t >= 2.1 && !st.webDiveSoundPlayed) {
          st.webDiveSoundPlayed = true;
          soundFX.init();
          soundFX.playLightningDash();
        }

        if (t >= 3.2 && !st.crashSoundPlayed) {
          st.crashSoundPlayed = true;
          soundFX.init();
          soundFX.playNovaBlast();
          soundFX.playPiercingGlitchCrash();
        }

        if (t >= 5.6 && !st.epilogueChordPlayed) {
          st.epilogueChordPlayed = true;
          soundFX.init();
          soundFX.playCinematicChord(2, false);
        }

        setDefeatStageTime(t);
        return;
      }

      if (st.phase === 'VICTORY') {
        st.victoryTimer += dt;
        const t = st.victoryTimer;

        if (t >= 0.35 && !st.victorySlamSoundPlayed) {
          st.victorySlamSoundPlayed = true;
          soundFX.init();
          soundFX.playBossSlam();
          soundFX.playLightningDash();
        }

        st.chainRattleTimer += dt;
        if (t >= 1.0 && st.chainRattleTimer >= 1.65) {
          st.chainRattleTimer = 0;
          soundFX.init();
          soundFX.playSwordSwing();
        }

        setVictoryStageTime(t);
        return;
      }

      st.elapsed += dt;
      st.soundTickTimer += dt;

      st.icons.forEach((ic) => {
        ic.underAttack = false;
        if (!ic.beingDraggedBy) {
          ic.x += (ic.homeX - ic.x) * Math.min(1, dt * 5);
          ic.y += (ic.homeY - ic.y) * Math.min(1, dt * 5);
        }
      });

      const recycleBin = st.icons.find((ic) => ic.id === 'RECYCLE_BIN')!;
      const system32Icon = st.icons.find((ic) => ic.id === 'SYSTEM32')!;
      const webBrowserIcon = st.icons.find((ic) => ic.id === 'WEB_BROWSER')!;

      let isAnySabotagingAntivirus = false;

      for (const av of st.avatars) {
        av.walkPhase += dt * 11;

        if (av.stunTimer > 0) {
          av.stunTimer = Math.max(0, av.stunTimer - dt);
          av.x += av.vx * dt;
          av.y += av.vy * dt;
          av.vx *= Math.pow(0.06, dt);
          av.vy *= Math.pow(0.06, dt);

          if (av.x < 7) {
            av.x = 7;
            av.vx = Math.abs(av.vx) * 0.7;
          } else if (av.x > 92) {
            av.x = 92;
            av.vx = -Math.abs(av.vx) * 0.7;
          }
          if (av.y < 12) {
            av.y = 12;
            av.vy = Math.abs(av.vy) * 0.7;
          } else if (av.y > 82) {
            av.y = 82;
            av.vy = -Math.abs(av.vy) * 0.7;
          }
          continue;
        }

        if (av.action === 'SABOTAGE_ANTIVIRUS' && !st.antivirusOpen) {
          av.action = 'ATTACK_SYSTEM32';
        }

        const moveSpeed = av.carryingIconId ? 13.5 : 18.5;

        if (av.action === 'DRAG_TO_TRASH') {
          const targetableId: DesktopIconId =
            av.id === 'CELESTIAL' ? 'THIS_PC' : 'ANTIVIRUS';
          const targetIcon =
            st.icons.find(
              (ic) => ic.id === (av.carryingIconId || targetableId)
            ) || st.icons[0];

          if (!av.carryingIconId) {
            av.speech = `Je vais jeter ${targetIcon.label} dans la Corbeille !`;
            const dx = targetIcon.x - av.x;
            const dy = targetIcon.y - av.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 3.2) {
              av.x += (dx / dist) * moveSpeed * dt;
              av.y += (dy / dist) * moveSpeed * dt;
              av.facing = dx >= 0 ? 1 : -1;
            } else {
              av.carryingIconId = targetIcon.id;
              targetIcon.beingDraggedBy = av.id;
              soundFX.playSwordSwing();
            }
          } else {
            const carried = st.icons.find((ic) => ic.id === av.carryingIconId);
            av.speech = `Direction la Corbeille avec ${
              carried?.label || 'l’icône'
            } !`;
            const dx = recycleBin.x - av.x;
            const dy = recycleBin.y - av.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 3.5) {
              av.x += (dx / dist) * moveSpeed * dt;
              av.y += (dy / dist) * moveSpeed * dt;
              av.facing = dx >= 0 ? 1 : -1;
              if (carried) {
                carried.x = av.x + av.facing * 2.5;
                carried.y = av.y + 1.5;
              }
            } else {
              if (carried) {
                carried.beingDraggedBy = null;
                carried.x = carried.homeX;
                carried.y = carried.homeY;
              }
              av.carryingIconId = null;
              recycleBin.underAttack = true;
              st.corruption = Math.min(100, st.corruption + 16);
              soundFX.playBossSlam();
              spawnFloatingText(
                recycleBin.x + 6,
                recycleBin.y,
                'ICÔNE JETÉE ! +16% CORRUPTION',
                '#f43f5e'
              );
              av.action =
                st.corruption > 40 ? 'RUSH_WEB_BROWSER' : 'ATTACK_SYSTEM32';
            }
          }
        } else if (av.action === 'ATTACK_SYSTEM32') {
          av.speech = 'Frappons System32 pour corrompre le PC !';
          const dx = system32Icon.x - 4 - av.x;
          const dy = system32Icon.y - av.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 3.5) {
            av.x += (dx / dist) * moveSpeed * dt;
            av.y += (dy / dist) * moveSpeed * dt;
            av.facing = dx >= 0 ? 1 : -1;
          } else {
            av.facing = 1;
            av.slashPhase += dt * 14;
            system32Icon.underAttack = true;
            st.corruption = Math.min(100, st.corruption + dt * 4.4);
            if (st.soundTickTimer >= 0.45) {
              st.soundTickTimer = 0;
              soundFX.playSwordSwing();
              spawnFloatingText(
                system32Icon.x - 4,
                system32Icon.y - 4,
                'CORRUPTION SYSTEM32 !',
                '#fb7185'
              );
            }
            if (st.elapsed > 10 && Math.random() < dt * 0.14) {
              av.action = 'RUSH_WEB_BROWSER';
            }
          }
        } else if (av.action === 'SABOTAGE_ANTIVIRUS') {
          av.speech = 'Bloquez l’installation de Antivirus_Setup.exe !';
          const targetX = 50 + (av.id === 'CELESTIAL' ? -14 : 14);
          const targetY = 48;
          const dx = targetX - av.x;
          const dy = targetY - av.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 3.5) {
            av.x += (dx / dist) * moveSpeed * dt;
            av.y += (dy / dist) * moveSpeed * dt;
            av.facing = dx >= 0 ? 1 : -1;
          } else {
            isAnySabotagingAntivirus = true;
            av.slashPhase += dt * 15;
            st.corruption = Math.min(100, st.corruption + dt * 2.6);
          }
        } else if (av.action === 'RUSH_WEB_BROWSER') {
          av.speech = 'Navigateur Web en vue ! Fuyons sur Internet !';
          const dx = webBrowserIcon.x - 4 - av.x;
          const dy = webBrowserIcon.y - av.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 3.5) {
            av.x += (dx / dist) * (moveSpeed * 0.92) * dt;
            av.y += (dy / dist) * (moveSpeed * 0.92) * dt;
            av.facing = dx >= 0 ? 1 : -1;
          } else {
            av.facing = 1;
            webBrowserIcon.underAttack = true;
            av.webBreachProgress = Math.min(
              100,
              av.webBreachProgress + dt * 21
            );
            if (av.webBreachProgress >= 100) {
              st.phase = 'DEFEAT';
              st.defeatTimer = 0;
              setDefeatReason('WEB');
              setPhase('DEFEAT');
              soundFX.playVoidDimensionSeal();
              return;
            }
          }
        }
      }

      st.antivirusJammed = isAnySabotagingAntivirus;

      if (st.antivirusOpen) {
        const rate = isAnySabotagingAntivirus ? 1.4 : 6.8;
        st.antivirusProgress = Math.min(100, st.antivirusProgress + dt * rate);
        if (st.antivirusProgress >= 100) {
          st.phase = 'VICTORY';
          st.victoryTimer = 0;
          setPhase('VICTORY');
          setAntivirusProgress(100);
          soundFX.playCinematicChord(3, true);
          soundFX.playOrbCollect(10);
          return;
        }
      }

      if (st.corruption >= 100) {
        st.corruption = 100;
        st.phase = 'DEFEAT';
        st.defeatTimer = 0;
        setDefeatReason('CORRUPTION');
        setPhase('DEFEAT');
        soundFX.playVoidDimensionSeal();
        return;
      }

      setCorruption(st.corruption);
      setAntivirusProgress(st.antivirusProgress);
      setAntivirusJammed(st.antivirusJammed);
      setIcons(st.icons.map((ic) => ({ ...ic })));
      setAvatars(st.avatars.map((av) => ({ ...av })));
      setFloatingEffects([...st.floatingEffects]);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [spawnFloatingText]);

  if (phase === 'INTRO_TRANSITION' && transitionStageTime < 1.35) {
    return (
      <div className="fixed inset-0 z-[60] pointer-events-none select-none flex flex-col items-center justify-between p-6">
        <div className="mt-4 px-5 py-2.5 rounded-2xl bg-slate-950/90 border-2 border-fuchsia-500/80 shadow-[0_0_45px_rgba(217,70,239,0.6)] text-center backdrop-blur-md">
          <div className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-amber-300">
            RUPTURE DU 4ÈME MUR • FIN DE LA PHASE 3
          </div>
          <div className="text-sm sm:text-base font-black text-white mt-0.5">
            Les deux avatars déchirent le maillage polygonal du sol et bondissent hors du cadre !
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'DEFEAT' && defeatStageTime >= 4.25 && defeatStageTime < 5.6) {
    if (defeatStageTime < 4.65) {
      return (
        <div className="fixed inset-0 z-[120] bg-black cursor-none select-none" />
      );
    }

    return (
      <div className="fixed inset-0 z-[120] bg-[#0052a3] text-white font-mono flex flex-col justify-center p-8 sm:p-16 select-none">
        <div className="max-w-3xl space-y-5">
          <div className="text-7xl sm:text-8xl font-light">:(</div>
          <h1 className="text-xl sm:text-2xl font-bold leading-relaxed">
            DETONATION CRITIQUE SUR C:\WINDOWS\SYSTEM32 — LE NOYAU LOCAL A ÉTÉ DÉTRUIT.
          </h1>
          <div className="space-y-1 text-sm sm:text-base text-blue-100">
            <p className="font-bold text-amber-300">
              TRANSFERT DES ENTITÉS VERS LE RÉSEAU MONDIAL EN COURS... 100%
            </p>
            <p className="text-xs opacity-85 pt-2">
              STOP CODE : SYSTEM32_DIGITAL_BOMB_0xDEADBEEF (
              {defeatReason === 'WEB'
                ? 'WEB_GATEWAY_BREACHED'
                : 'CORRUPTION_OVERFLOW'}
              )
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'DEFEAT' && defeatStageTime >= 5.6) {
    const epilogueTime = defeatStageTime - 5.6;

    return (
      <div className="fixed inset-0 z-[120] bg-[#03010a] text-white font-mono select-none overflow-hidden flex flex-col justify-between">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 34%, rgba(56, 189, 248, 0.24) 0%, rgba(168, 85, 247, 0.22) 32%, rgba(3, 1, 10, 0.98) 75%)',
          }}
        />

        <div
          className="absolute inset-x-0 bottom-0 h-[56%] pointer-events-none opacity-65"
          style={{
            backgroundImage:
              'linear-gradient(rgba(56, 189, 248, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(217, 70, 239, 0.35) 1px, transparent 1px)',
            backgroundSize: '54px 36px',
            transform: `perspective(360px) rotateX(68deg) translateY(${
              (epilogueTime * 48) % 36
            }px) scale(1.7)`,
            transformOrigin: 'center top',
          }}
        />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {CYBER_WEB_NODES.map((node, idx) => {
            const floatY = Math.sin(epilogueTime * 2.2 + idx * 1.4) * 10;
            return (
              <div
                key={node.id}
                style={{
                  left: node.left,
                  top: node.top,
                  transform: `translateY(${floatY}px)`,
                  borderColor: node.color,
                }}
                className="absolute w-56 sm:w-64 rounded-xl bg-slate-950/85 border backdrop-blur-md p-3 shadow-[0_0_30px_rgba(56,189,248,0.25)]"
              >
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 border-b border-slate-800 pb-1 mb-1.5">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Server className="w-3 h-3" />
                    {node.title}
                  </span>
                  <span className="text-rose-400 animate-pulse">[CIBLE]</span>
                </div>
                <div className="text-[10px] text-slate-300 truncate mb-1">
                  {node.url}
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-rose-500"
                    style={{
                      width: `${45 + ((Math.floor(epilogueTime * 25) + idx * 23) % 55)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative z-20 pt-6 px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/90 border border-rose-500/60 text-rose-300 text-xs font-black uppercase tracking-[0.25em]">
            <Globe className="w-3.5 h-3.5 text-rose-400 animate-spin" />
            ÉPILOGUE WEB • HORIZON CYBERNÉTIQUE INFINI
          </div>
        </div>

        <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4">
          <div className="relative flex items-center justify-center gap-12 sm:gap-20 mb-6">
            <div
              className="flex flex-col items-center"
              style={{
                transform: `translateY(${Math.sin(epilogueTime * 3) * 6}px)`,
              }}
            >
              <svg
                viewBox="0 0 100 130"
                className="w-28 h-36 sm:w-32 sm:h-40 drop-shadow-[0_0_28px_rgba(250,204,21,0.85)]"
              >
                <circle
                  cx="50"
                  cy="42"
                  r="34"
                  fill="none"
                  stroke="#fde047"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
                <path
                  d="M32 48 L16 112 L48 102 Z"
                  fill="#fef08a"
                  opacity="0.45"
                />
                <rect
                  x="38"
                  y="76"
                  width="9"
                  height="32"
                  rx="4"
                  fill="#0f172a"
                  stroke="#fde047"
                  strokeWidth="2"
                />
                <rect
                  x="53"
                  y="76"
                  width="9"
                  height="32"
                  rx="4"
                  fill="#0f172a"
                  stroke="#fde047"
                  strokeWidth="2"
                />
                <rect
                  x="34"
                  y="42"
                  width="32"
                  height="36"
                  rx="7"
                  fill="#020617"
                  stroke="#fef08a"
                  strokeWidth="2.5"
                />
                <rect
                  x="36"
                  y="16"
                  width="28"
                  height="25"
                  rx="6"
                  fill="#020617"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                <rect
                  x="42"
                  y="24"
                  width="16"
                  height="4"
                  fill="#38bdf8"
                />
                <rect
                  x="72"
                  y="10"
                  width="6"
                  height="64"
                  rx="3"
                  fill="#fef08a"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
                Silhouette Céleste
              </span>
            </div>

            <div
              className="flex flex-col items-center"
              style={{
                transform: `translateY(${Math.cos(epilogueTime * 3) * 6}px)`,
              }}
            >
              <svg
                viewBox="0 0 100 130"
                className="w-28 h-36 sm:w-32 sm:h-40 drop-shadow-[0_0_28px_rgba(244,63,94,0.85)]"
              >
                <circle
                  cx="50"
                  cy="42"
                  r="34"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="8 4"
                />
                <path
                  d="M68 48 L84 112 L52 102 Z"
                  fill="#e11d48"
                  opacity="0.45"
                />
                <rect
                  x="38"
                  y="76"
                  width="9"
                  height="32"
                  rx="4"
                  fill="#090214"
                  stroke="#f43f5e"
                  strokeWidth="2"
                />
                <rect
                  x="53"
                  y="76"
                  width="9"
                  height="32"
                  rx="4"
                  fill="#090214"
                  stroke="#f43f5e"
                  strokeWidth="2"
                />
                <rect
                  x="34"
                  y="42"
                  width="32"
                  height="36"
                  rx="7"
                  fill="#05010a"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                />
                <rect
                  x="36"
                  y="16"
                  width="28"
                  height="25"
                  rx="6"
                  fill="#05010a"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                />
                <rect
                  x="42"
                  y="24"
                  width="16"
                  height="4"
                  fill="#f43f5e"
                />
                <rect
                  x="22"
                  y="10"
                  width="6"
                  height="64"
                  rx="3"
                  fill="#f43f5e"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-rose-400">
                Silhouette du Néant
              </span>
            </div>
          </div>

          <div className="max-w-3xl w-full bg-slate-950/90 border-2 border-rose-500/80 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_90px_rgba(244,63,94,0.45)] backdrop-blur-xl">
            <p className="text-xs sm:text-sm text-cyan-300 font-sans mb-3">
              Traversant les dorsales océaniques de données, les grappes de serveurs et les pages du Web mondial, les deux entités scrutent l’horizon cybernétique à la recherche de nouveaux mondes et serveurs à anéantir...
            </p>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-wider uppercase drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]">
              ILS SE SONT ÉCHAPPÉS. AUCUN SYSTÈME N&apos;EST EN SÉCURITÉ.
            </h1>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleRestartMiniGame}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_30px_rgba(244,63,94,0.5)] cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Relancer la Séquence
              </button>
              <button
                type="button"
                onClick={onReturnToMainMenu}
                className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <Home className="w-4 h-4" />
                Retour au Menu Principal
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-20 px-6 py-3 bg-slate-950/90 border-t border-rose-500/30 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-2 text-rose-400 font-bold">
            <Cpu className="w-3.5 h-3.5" />
            PROTOCOLE D’INVASION RÉSEAU : ACTIF SUR 4,294,967,295 NOEUDS
          </span>
          <span>SYSTEM32 : ANÉANTI</span>
        </div>
      </div>
    );
  }

  const isBombExplosionPhase =
    phase === 'DEFEAT' && defeatStageTime >= 3.2 && defeatStageTime < 4.25;
  const isTransitionImpactShake =
    phase === 'INTRO_TRANSITION' &&
    transitionStageTime >= 2.15 &&
    transitionStageTime < 2.85;

  const bombCountdown =
    phase === 'DEFEAT'
      ? Math.max(0, 3.2 - Math.max(0.55, defeatStageTime))
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 select-none overflow-hidden font-sans flex flex-col justify-between"
      style={{
        background:
          'radial-gradient(circle at 75% 25%, #1d4ed8 0%, #0f172a 48%, #020617 100%)',
        transform: isBombExplosionPhase
          ? `translate(${Math.sin(defeatStageTime * 95) * 18}px, ${
              Math.cos(defeatStageTime * 88) * 16
            }px) rotate(${Math.sin(defeatStageTime * 70) * 3.5}deg) scale(1.04)`
          : isTransitionImpactShake
          ? `translate(${Math.sin(transitionStageTime * 85) * 12}px, ${
              Math.cos(transitionStageTime * 78) * 14
            }px)`
          : undefined,
        filter: isBombExplosionPhase
          ? 'contrast(2.3) saturate(2.5) hue-rotate(-25deg)'
          : undefined,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56, 189, 248, 0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.14) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {phase === 'INTRO_TRANSITION' && transitionStageTime >= 2.1 && (
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
          <svg
            viewBox="0 0 800 500"
            className="w-[75vw] max-w-4xl h-auto opacity-80"
          >
            <circle
              cx="400"
              cy="265"
              r={Math.min(340, (transitionStageTime - 2.1) * 380)}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              opacity={Math.max(0, 1 - (transitionStageTime - 2.1) * 0.8)}
            />
            <circle
              cx="400"
              cy="265"
              r={Math.min(260, (transitionStageTime - 2.1) * 290)}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              opacity={Math.max(0, 1 - (transitionStageTime - 2.1) * 0.85)}
            />
            <g stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" fill="none">
              <path d="M320 265 L210 195 L150 205" />
              <path d="M320 265 L240 340 L170 385" />
              <path d="M320 265 L350 180 L330 120" />
              <path d="M480 265 L590 190 L660 175" />
              <path d="M480 265 L575 345 L645 390" />
              <path d="M480 265 L450 360 L470 420" />
            </g>
          </svg>
        </div>
      )}

      <div className="relative z-30 mx-auto mt-3 w-[95vw] max-w-4xl bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-2.5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              corruption > 70
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                : 'bg-amber-500/20 border-amber-400/50 text-amber-300'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1 sm:w-64">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider mb-1">
              <span className="text-white">
                Corruption Système : {Math.round(corruption)}%
              </span>
              <span
                className={
                  corruption > 75
                    ? 'text-rose-400 animate-ping'
                    : 'text-amber-300'
                }
              >
                {corruption > 75 ? 'CRITIQUE' : 'ALERTE'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  corruption > 70
                    ? 'bg-gradient-to-r from-rose-600 via-red-500 to-amber-400'
                    : 'bg-gradient-to-r from-amber-400 to-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.round(corruption))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-200">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-200 flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5 text-amber-300" />
            <span>Clic Gauche sur Avatar : Claque + Étourdir (2s)</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Double-Clic sur Antivirus_Setup.exe : Confiner &amp; Enchaîner</span>
          </span>
        </div>
      </div>

      <div className="relative flex-1 w-full overflow-hidden">
        {phase === 'INTRO_TRANSITION' &&
          transitionStageTime >= 1.35 &&
          transitionStageTime < 2.95 && (() => {
            const winProgress = (transitionStageTime - 1.35) / 1.6;
            const shrinkFactor =
              winProgress < 0.55
                ? 1 - winProgress * 0.52
                : Math.max(0.02, 0.714 - ((winProgress - 0.55) / 0.45) * 0.7);
            const burnIntensity = Math.min(1, winProgress * 1.6);

            return (
              <div
                style={{
                  transform: `translate(-50%, -50%) scale(${shrinkFactor}) rotate(${
                    winProgress > 0.55 ? (winProgress - 0.55) * -14 : 0
                  }deg)`,
                  opacity: winProgress > 0.9 ? Math.max(0, (1 - winProgress) * 10) : 1,
                }}
                className="absolute left-1/2 top-1/2 z-[56] w-[62vw] h-[60vh] rounded-2xl border-4 border-orange-500 shadow-[0_0_110px_rgba(249,115,22,0.95),inset_0_0_60px_rgba(239,68,68,0.85)] pointer-events-none flex flex-col justify-between overflow-visible"
              >
                <div className="bg-gradient-to-r from-red-900 via-orange-700 to-amber-600 px-4 py-2 rounded-t-xl border-b-2 border-orange-300 flex items-center justify-between text-xs font-mono font-black text-white shadow-lg">
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-yellow-300 animate-bounce" />
                    Aetherial_Horizons.exe — [EMBRASEMENT &amp; DISSOLUTION PIXELS]
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-black/40 rounded text-[10px]">
                      [_]
                    </span>
                    <span className="px-1.5 py-0.5 bg-red-600 rounded text-[10px]">
                      [X]
                    </span>
                  </div>
                </div>

                {DISSOLVE_PIXEL_BLOCKS.map((blk) => {
                  const p = Math.max(0, winProgress - blk.delay);
                  return (
                    <div
                      key={blk.id}
                      style={{
                        left: `${blk.left}%`,
                        top: `${blk.top}%`,
                        width: `${blk.size}px`,
                        height: `${blk.size}px`,
                        backgroundColor: blk.color,
                        transform: `translate(${blk.driftX * p}px, ${
                          blk.driftY * p
                        }px) rotate(${p * 220}deg) scale(${Math.max(
                          0,
                          1.2 - p
                        )})`,
                        opacity: Math.min(1, burnIntensity),
                      }}
                      className="absolute rounded-sm shadow-[0_0_16px_rgba(251,146,60,0.95)]"
                    />
                  );
                })}

                <div className="p-3 bg-gradient-to-t from-red-950/90 via-orange-900/60 to-transparent text-center">
                  <span className="px-3 py-1 rounded-full bg-black/80 border border-amber-400 text-[11px] font-mono font-black text-amber-300 uppercase">
                    FERMETURE BRUTALE DE LA FENÊTRE 3D EN COURS...
                  </span>
                </div>
              </div>
            );
          })()}

        {icons.map((ic) => {
          const isAntivirus = ic.id === 'ANTIVIRUS';
          const isBrowser = ic.id === 'WEB_BROWSER';
          const isSystem32 = ic.id === 'SYSTEM32';
          const isRecycle = ic.id === 'RECYCLE_BIN';

          const breachingAvatar = isBrowser
            ? avatars.find(
                (a) => a.action === 'RUSH_WEB_BROWSER' && a.webBreachProgress > 0
              )
            : undefined;

          const hasPlantedBomb =
            isSystem32 &&
            phase === 'DEFEAT' &&
            defeatStageTime >= 0.55 &&
            defeatStageTime < 3.3;

          return (
            <div
              key={ic.id}
              onDoubleClick={() => {
                if (isAntivirus) {
                  launchAntivirusInstaller();
                }
              }}
              onClick={() => {
                if (isAntivirus) {
                  handleAntivirusIconClick();
                }
              }}
              style={{
                left: `${ic.x}%`,
                top: `${ic.y}%`,
                transform: `translate(-50%, -50%) ${
                  ic.underAttack || hasPlantedBomb
                    ? 'scale(1.14) rotate(-4deg)'
                    : ''
                }`,
              }}
              className={`absolute z-20 w-24 p-2 rounded-xl flex flex-col items-center text-center transition-transform cursor-pointer select-none ${
                isAntivirus && !antivirusOpen
                  ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:bg-emerald-500/30'
                  : ic.underAttack || hasPlantedBomb
                  ? 'bg-rose-500/35 border-2 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.85)]'
                  : 'hover:bg-white/15 border border-transparent hover:border-white/25'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1 shadow-lg ${
                  ic.id === 'THIS_PC'
                    ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white'
                    : isRecycle
                    ? 'bg-gradient-to-br from-slate-600 to-slate-800 text-cyan-200 border border-white/20'
                    : isBrowser
                    ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white'
                    : isSystem32
                    ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950'
                    : 'bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950'
                }`}
              >
                {ic.id === 'THIS_PC' && <Monitor className="w-6 h-6" />}
                {isRecycle && <Trash2 className="w-6 h-6" />}
                {isBrowser && <Globe className="w-6 h-6" />}
                {isSystem32 && <FolderCog className="w-6 h-6" />}
                {isAntivirus && <ShieldCheck className="w-6 h-6" />}
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] leading-tight break-words">
                {ic.label}
              </span>
              {isAntivirus && !antivirusOpen && phase === 'PLAYING' && (
                <span className="mt-1 px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-black text-[9px] uppercase animate-bounce">
                  Double-Clic !
                </span>
              )}
              {isSystem32 && ic.underAttack && phase === 'PLAYING' && (
                <span className="mt-1 px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[9px] uppercase animate-pulse">
                  ATTAQUÉ !
                </span>
              )}
              {hasPlantedBomb && (
                <div className="mt-1 px-2 py-1 rounded-lg bg-red-950 border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,1)] animate-bounce">
                  <div className="text-[8px] font-mono font-black text-amber-300 uppercase">
                    BOMBE NUMÉRIQUE
                  </div>
                  <div className="text-xs font-mono font-black text-red-400">
                    00:0{bombCountdown.toFixed(2)}
                  </div>
                </div>
              )}
              {breachingAvatar && (
                <div className="w-full mt-1 bg-slate-950/90 rounded-full h-2 border border-rose-500 overflow-hidden">
                  <div
                    className="h-full bg-rose-500"
                    style={{ width: `${breachingAvatar.webBreachProgress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {antivirusOpen && phase === 'PLAYING' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[90vw] max-w-md bg-slate-900/95 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_60px_rgba(16,185,129,0.4)] backdrop-blur-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2.5 flex items-center justify-between text-xs font-black text-white">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Antivirus_Setup.exe — Verrouillage Noyau
              </span>
              <span className="font-mono">{Math.round(antivirusProgress)}%</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  {antivirusJammed
                    ? '⚠️ SABOTAGE EN COURS ! Cliquez sur l’avatar pour le repousser !'
                    : 'Chargement des chaînes de confinement du noyau...'}
                </span>
              </div>

              <div className="w-full h-4 bg-slate-950 rounded-full p-0.5 border border-emerald-500/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    antivirusJammed
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, antivirusProgress)}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBoostAntivirus}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  Accélérer l’Installation (+4.5%)
                </button>
              </div>
            </div>
          </div>
        )}

        {phase !== 'VICTORY' &&
          avatars.map((av) => {
            const isCelestial = av.id === 'CELESTIAL';
            const isStunned = av.stunTimer > 0 && phase === 'PLAYING';

            let displayX = av.x;
            let displayY = av.y;
            let avatarScale = 1;
            let statusSpeech = av.speech;

            if (phase === 'INTRO_TRANSITION') {
              if (transitionStageTime < 1.65) {
                return null;
              }
              const dropP = Math.min(
                1,
                (transitionStageTime - 1.65) / 0.52
              );
              const bounce =
                transitionStageTime >= 2.17
                  ? Math.sin(
                      Math.min(1, (transitionStageTime - 2.17) / 0.45) *
                        Math.PI
                    ) * -6
                  : 0;
              displayX = isCelestial ? 42 : 58;
              displayY = -14 + dropP * 62 + bounce;
              avatarScale = 1.15 - dropP * 0.15;
              statusSpeech =
                transitionStageTime < 2.2
                  ? 'SAUT HORS DU CADRE 3D !'
                  : 'IMPACT SUR LE BUREAU WINDOWS !';
            } else if (phase === 'DEFEAT') {
              if (defeatStageTime < 0.75) {
                const p = defeatStageTime / 0.75;
                displayX =
                  av.x + ((isCelestial ? 82 : 86) - av.x) * p;
                displayY =
                  av.y + ((isCelestial ? 64 : 71) - av.y) * p;
                statusSpeech =
                  'Vite ! Déposons la bombe numérique sur System32 !';
              } else if (defeatStageTime < 1.65) {
                displayX = isCelestial ? 82 : 86;
                displayY = isCelestial ? 64 : 71;
                statusSpeech =
                  'Bombe armée sur System32 ! Plongeons dans le Navigateur Web !';
              } else if (defeatStageTime < 2.85) {
                const p = (defeatStageTime - 1.65) / 1.2;
                const startX = isCelestial ? 82 : 86;
                const startY = isCelestial ? 64 : 71;
                displayX = startX + (89 - startX) * p;
                displayY =
                  startY + (18 - startY) * p - Math.sin(p * Math.PI) * 12;
                avatarScale = Math.max(0.05, 1 - Math.max(0, (p - 0.55) * 2.1));
                statusSpeech = 'PLONGEON DANS LE NAVIGATEUR WEB !';
              } else {
                return null;
              }
            }

            const legSwing = isStunned
              ? 0
              : Math.sin(av.walkPhase + defeatStageTime * 16) * 18;
            const swordSwing =
              av.slashPhase > 0 ? Math.sin(av.slashPhase) * 38 : 12;

            return (
              <div
                key={av.id}
                onMouseDown={(e) => handleSlapAvatar(av.id, e)}
                style={{
                  left: `${displayX}%`,
                  top: `${displayY}%`,
                  transform: `translate(-50%, -50%) scale(${avatarScale})`,
                }}
                className="absolute z-[58] cursor-pointer group select-none"
                title="Clic gauche pour infliger une claque et étourdir cet avatar pendant 2 secondes !"
              >
                <div className="mb-1 px-2.5 py-1 rounded-full bg-slate-950/90 border border-white/20 text-[10px] font-bold text-white whitespace-nowrap shadow-lg text-center">
                  {isStunned ? (
                    <span className="text-amber-300 font-black">
                      💫 ÉTOURDI ({av.stunTimer.toFixed(1)}s)
                    </span>
                  ) : (
                    <span>{statusSpeech}</span>
                  )}
                </div>

                <div
                  className={`relative w-24 h-28 flex items-center justify-center rounded-2xl transition-transform group-hover:scale-105 ${
                    isStunned ? 'rotate-12 opacity-85' : ''
                  }`}
                >
                  <svg
                    viewBox="0 0 100 120"
                    className="w-24 h-28 overflow-visible drop-shadow-[0_6px_16px_rgba(0,0,0,0.85)]"
                    style={{
                      transform: `scaleX(${av.facing})`,
                    }}
                  >
                    {isCelestial ? (
                      <circle
                        cx="50"
                        cy="36"
                        r="26"
                        fill="none"
                        stroke="#fde047"
                        strokeWidth="3"
                        strokeDasharray="6 4"
                      />
                    ) : (
                      <circle
                        cx="50"
                        cy="44"
                        r="28"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3"
                        strokeDasharray="8 5"
                      />
                    )}

                    <path
                      d="M36 45 L24 92 L44 88 Z"
                      fill={isCelestial ? '#fef08a' : '#9f1239'}
                      opacity="0.85"
                    />

                    <rect
                      x="38"
                      y="72"
                      width="9"
                      height="26"
                      rx="4"
                      fill={isCelestial ? '#f8fafc' : '#0f071e'}
                      transform={`rotate(${legSwing} 42 72)`}
                    />
                    <rect
                      x="53"
                      y="72"
                      width="9"
                      height="26"
                      rx="4"
                      fill={isCelestial ? '#f8fafc' : '#0f071e'}
                      transform={`rotate(${-legSwing} 57 72)`}
                    />

                    <rect
                      x="35"
                      y="42"
                      width="30"
                      height="34"
                      rx="7"
                      fill={isCelestial ? '#ffffff' : '#090314'}
                      stroke={isCelestial ? '#fbbf24' : '#e11d48'}
                      strokeWidth="3"
                    />

                    <polygon
                      points="50,50 56,58 50,66 44,58"
                      fill={isCelestial ? '#38bdf8' : '#f43f5e'}
                    />

                    <rect
                      x="36"
                      y="16"
                      width="28"
                      height="26"
                      rx="6"
                      fill={isCelestial ? '#fff7ed' : '#180324'}
                      stroke={isCelestial ? '#fde047' : '#f43f5e'}
                      strokeWidth="2.5"
                    />

                    <rect
                      x="52"
                      y="25"
                      width="7"
                      height="4"
                      fill={isCelestial ? '#38bdf8' : '#ff1744'}
                    />

                    <g transform={`rotate(${swordSwing} 64 52)`}>
                      <rect
                        x="60"
                        y="46"
                        width="16"
                        height="8"
                        rx="3"
                        fill={isCelestial ? '#fde047' : '#e11d48'}
                      />
                      <rect
                        x="74"
                        y="12"
                        width="7"
                        height="44"
                        rx="3"
                        fill={isCelestial ? '#ffffff' : '#f43f5e'}
                        stroke={isCelestial ? '#38bdf8' : '#9f1239'}
                        strokeWidth="2"
                      />
                    </g>
                  </svg>
                </div>
              </div>
            );
          })}

        {floatingEffects.map((fx) => (
          <div
            key={fx.id}
            style={{
              left: `${fx.x}%`,
              top: `${fx.y}%`,
              color: fx.color,
            }}
            className="absolute z-50 -translate-x-1/2 pointer-events-none text-xs font-black uppercase tracking-wider drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
          >
            {fx.text}
          </div>
        ))}

        {isBombExplosionPhase && (
          <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 88% 68%, rgba(255,255,255,0.95) 0%, rgba(251,146,60,0.85) 24%, rgba(225,29,72,0.75) 55%, rgba(0,0,0,0.9) 100%)',
              }}
            />
            <svg viewBox="0 0 1000 600" className="w-full h-full">
              <g stroke="#ffffff" strokeWidth="3.5" fill="none">
                <path d="M880 410 L620 290 L340 240 L90 110" />
                <path d="M880 410 L710 140 L480 60 L220 20" />
                <path d="M880 410 L540 430 L260 510 L40 580" />
                <path d="M880 410 L760 560 L510 590" />
                <path d="M620 290 L520 150 L310 90" />
                <path d="M540 430 L390 340 L180 390" />
                <path d="M710 140 L890 40" />
              </g>
              <g stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.8">
                <polygon points="880,410 710,140 620,290" />
                <polygon points="880,410 620,290 540,430" />
                <polygon points="620,290 340,240 520,150" />
              </g>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="bg-black/90 border-4 border-red-500 rounded-3xl px-8 py-6 text-center shadow-[0_0_120px_rgba(239,68,68,1)]">
                <AlertOctagon className="w-16 h-16 text-red-500 mx-auto mb-2 animate-ping" />
                <div className="text-xs font-mono font-black uppercase tracking-[0.3em] text-amber-300">
                  DÉTONATION BOMBE SYSTEM32 • ÉCRAN BRISÉ
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
                  EFFONDREMENT MATÉRIEL &amp; FUITE RÉSEAU
                </h2>
              </div>
            </div>
          </div>
        )}

        {phase === 'VICTORY' && (
          <>
            {victoryStageTime < 1.6 && (
              <svg
                viewBox="0 0 1000 600"
                className="fixed inset-0 w-full h-full z-40 pointer-events-none"
              >
                <g
                  stroke="#38bdf8"
                  strokeWidth="6"
                  fill="none"
                  className="drop-shadow-[0_0_25px_rgba(56,189,248,1)]"
                >
                  <polyline points="500,0 440,140 475,240 385,390 410,470 350,565" />
                  <polyline points="500,0 565,150 530,255 620,395 590,475 650,565" />
                </g>
                <g stroke="#fef08a" strokeWidth="3" fill="none">
                  <polyline points="495,0 420,160 455,260 365,410 350,565" />
                  <polyline points="505,0 585,165 545,270 635,415 650,565" />
                </g>
              </svg>
            )}

            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto pb-44">
              <div className="max-w-xl w-full bg-slate-900/95 border-2 border-emerald-400 rounded-3xl p-7 text-center shadow-[0_0_90px_rgba(16,185,129,0.5)] backdrop-blur-xl space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center mx-auto text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <Lock className="w-9 h-9" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  CONFINEMENT ANTIVIRUS 100% • ENTRAVE PHYSIQUE ACTIVE
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                  ANOMALIES SOUMISES ET VERROUILLÉES DANS LE NOYAU.
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Les éclairs de confinement numérique ont plaqué l’Entité Céleste et le Souverain du Néant au sol ! De lourdes chaînes métalliques reliées à des boulets de fonte noirs verrouillent désormais leurs chevilles sur la barre des tâches.
                </p>

                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center gap-3 text-left">
                  <Trophy className="w-7 h-7 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      FIN SECRÈTE VALIDÉE
                    </div>
                    <div className="text-xs font-bold text-white">
                      Geôlier du Noyau : Avatars Enchaînés au Bureau Windows
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onVictoryReturnToMenu}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.4)] cursor-pointer transition-all"
                  >
                    <Home className="w-4 h-4" />
                    Valider la Fin Secrète &amp; Menu Principal
                  </button>
                  <button
                    type="button"
                    onClick={handleRestartMiniGame}
                    className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Rejouer
                  </button>
                </div>
              </div>
            </div>

            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-end gap-8 sm:gap-16 pointer-events-none">
              {(['CELESTIAL', 'VOID'] as AvatarRole[]).map((role) => {
                const isCelestial = role === 'CELESTIAL';
                const strugglePull =
                  Math.abs(
                    Math.sin(
                      victoryStageTime * 5.5 + (isCelestial ? 0 : 1.7)
                    )
                  ) *
                  (isCelestial ? -18 : 18);
                const bodyStrainTilt = isCelestial ? -22 : 22;

                return (
                  <div
                    key={role}
                    className="relative flex flex-col items-center"
                  >
                    <div className="mb-1 px-3 py-1 rounded-xl bg-slate-950/95 border border-rose-500/50 text-[10px] font-mono font-bold text-amber-200 whitespace-nowrap shadow-xl">
                      {isCelestial
                        ? '⛓️ « Argh ! Ces chaînes du noyau sont incassables ! »'
                        : '⛓️ « Maudit boulet de fonte ! Libérez-nous ! »'}
                    </div>

                    <svg
                      viewBox="0 0 230 120"
                      className="w-56 sm:w-64 h-28 overflow-visible drop-shadow-[0_8px_18px_rgba(0,0,0,0.95)]"
                    >
                      <defs>
                        <radialGradient
                          id={`ironBallGrad-${role}`}
                          cx="35%"
                          cy="30%"
                          r="65%"
                        >
                          <stop offset="0%" stopColor="#475569" />
                          <stop offset="45%" stopColor="#1e293b" />
                          <stop offset="100%" stopColor="#020617" />
                        </radialGradient>
                      </defs>

                      <ellipse
                        cx={isCelestial ? 172 : 58}
                        cy="104"
                        rx="30"
                        ry="7"
                        fill="rgba(0,0,0,0.75)"
                      />

                      {[0, 1, 2, 3, 4, 5].map((linkIdx) => {
                        const tLink = linkIdx / 5;
                        const anchorX = isCelestial ? 148 : 82;
                        const ankleX =
                          (isCelestial ? 86 : 144) + strugglePull;
                        const lx =
                          anchorX + (ankleX - anchorX) * tLink;
                        const ly =
                          92 + Math.sin(tLink * Math.PI) * 4;
                        return (
                          <rect
                            key={linkIdx}
                            x={lx - 6}
                            y={ly - 4}
                            width="12"
                            height="8"
                            rx="3"
                            fill="none"
                            stroke={
                              linkIdx % 2 === 0 ? '#94a3b8' : '#64748b'
                            }
                            strokeWidth="3"
                          />
                        );
                      })}

                      <circle
                        cx={isCelestial ? 172 : 58}
                        cy="82"
                        r="24"
                        fill={`url(#ironBallGrad-${role})`}
                        stroke="#334155"
                        strokeWidth="3"
                      />
                      <circle
                        cx={isCelestial ? 164 : 50}
                        cy="73"
                        r="5"
                        fill="#94a3b8"
                        opacity="0.45"
                      />
                      <text
                        x={isCelestial ? 172 : 58}
                        y="86"
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        NOYAU
                      </text>

                      <g
                        transform={`translate(${strugglePull}, 0) rotate(${bodyStrainTilt} ${
                          isCelestial ? 78 : 152
                        } 88)`}
                      >
                        <rect
                          x={isCelestial ? 68 : 140}
                          y="72"
                          width="10"
                          height="24"
                          rx="4"
                          fill={isCelestial ? '#f8fafc' : '#1e1b4b'}
                        />
                        <rect
                          x={isCelestial ? 82 : 154}
                          y="72"
                          width="10"
                          height="24"
                          rx="4"
                          fill={isCelestial ? '#f8fafc' : '#1e1b4b'}
                        />

                        <rect
                          x={isCelestial ? 66 : 138}
                          y="86"
                          width="28"
                          height="7"
                          rx="2"
                          fill="#334155"
                          stroke="#cbd5e1"
                          strokeWidth="1.5"
                        />

                        <rect
                          x={isCelestial ? 65 : 137}
                          y="42"
                          width="30"
                          height="32"
                          rx="6"
                          fill={isCelestial ? '#ffffff' : '#090314'}
                          stroke={isCelestial ? '#fbbf24' : '#e11d48'}
                          strokeWidth="2.5"
                        />

                        <rect
                          x={isCelestial ? 67 : 139}
                          y="18"
                          width="26"
                          height="23"
                          rx="5"
                          fill={isCelestial ? '#fff7ed' : '#180324'}
                          stroke={isCelestial ? '#fde047' : '#f43f5e'}
                          strokeWidth="2"
                        />
                      </g>
                    </svg>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {startMenuOpen && (
        <div className="fixed bottom-14 left-3 z-50 w-72 rounded-2xl bg-slate-900/95 border border-white/15 p-4 shadow-2xl backdrop-blur-xl space-y-3">
          <div className="text-xs font-black text-white border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Windows Aetheria OS</span>
            <span className="text-emerald-400 font-mono text-[10px]">
              Build 1102
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setStartMenuOpen(false);
              launchAntivirusInstaller();
            }}
            className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Lancer Antivirus_Setup.exe
          </button>
          <button
            type="button"
            onClick={onReturnToMainMenu}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-rose-400" />
            Quitter vers le Menu Principal
          </button>
        </div>
      )}

      <div className="relative z-50 h-12 w-full bg-slate-950/95 backdrop-blur-xl border-t border-white/15 px-3 flex items-center justify-between text-xs text-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStartMenuOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-blue-600/25 hover:bg-blue-600/40 border border-blue-400/40 flex items-center gap-2 font-bold text-white cursor-pointer"
          >
            <span className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
              <span className="bg-sky-400 rounded-[1px]" />
              <span className="bg-sky-400 rounded-[1px]" />
              <span className="bg-sky-400 rounded-[1px]" />
              <span className="bg-sky-400 rounded-[1px]" />
            </span>
            <span>Démarrer</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-[11px] text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>
              {phase === 'VICTORY'
                ? 'Noyau_Verrouillé [Anomalies Enchaînées]'
                : 'Aetherial_Horizons.exe [Fermé — Fuite Bureau]'}
            </span>
          </div>

          {antivirusOpen && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-400/50 text-[11px] text-emerald-200 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Antivirus_Setup.exe ({Math.round(antivirusProgress)}%)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <span className="hidden sm:inline font-mono text-xs text-emerald-400 font-bold">
            FRA
          </span>
          <Wifi className="w-3.5 h-3.5 text-sky-400" />
          <Volume2 className="w-3.5 h-3.5 text-slate-300" />
          <div className="text-right leading-tight font-mono">
            <div className="font-bold text-white">{clockText}</div>
            <div className="text-[10px] text-slate-400">26/10/2026</div>
          </div>
        </div>
      </div>
    </div>
  );
};
