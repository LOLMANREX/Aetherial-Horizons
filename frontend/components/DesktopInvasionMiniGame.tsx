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
  Star,
  Download,
  ExternalLink,
  X,
  Crosshair,
} from 'lucide-react';
import { soundFX } from '../utils/sound';
import {
  EpilogueMinecraftSequence,
  EpilogueStartSubPhase,
} from './EpilogueMinecraftSequence';

export type DesktopMiniGameInitialMode =
  | 'TRANSITION'
  | 'CURSOR_RIPOSTE'
  | 'BROWSER_ANTIVIRUS'
  | 'CRAFT_AND_ROCKET'
  | 'SIX_MONTHS_VIRUS'
  | 'STEVE_EXIT_COMBAT'
  | 'ELYTRA_FLIGHT'
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
  | 'VICTORY'
  | 'EPILOGUE_SEQUENCE';

type DesktopIconId =
  | 'THIS_PC'
  | 'RECYCLE_BIN'
  | 'WEB_BROWSER'
  | 'SYSTEM32';

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
  | 'ATTACK_SYSTEM32'
  | 'ATTACK_BROWSER_WINDOW'
  | 'DRAG_TO_TRASH';

interface DesktopAvatarState {
  id: AvatarRole;
  name: string;
  weaponLabel: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  stunTimer: number;
  action: AvatarAction;
  carryingIconId: DesktopIconId | null;
  walkPhase: number;
  attackAnimTimer: number;
  attackCooldown: number;
  speech: string;
  slapCount: number;
}

interface EnergyBullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
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
    homeY: 18,
    x: 8,
    y: 18,
    beingDraggedBy: null,
    underAttack: false,
  },
  {
    id: 'RECYCLE_BIN',
    label: 'Corbeille',
    homeX: 8,
    homeY: 68,
    x: 8,
    y: 68,
    beingDraggedBy: null,
    underAttack: false,
  },
  {
    id: 'WEB_BROWSER',
    label: 'Navigateur Web',
    homeX: 89,
    homeY: 20,
    x: 89,
    y: 20,
    beingDraggedBy: null,
    underAttack: false,
  },
  {
    id: 'SYSTEM32',
    label: 'System32',
    homeX: 89,
    homeY: 70,
    x: 89,
    y: 70,
    beingDraggedBy: null,
    underAttack: false,
  },
];

const INITIAL_AVATARS: DesktopAvatarState[] = [
  {
    id: 'CELESTIAL',
    name: 'Entité Céleste',
    weaponLabel: 'Marteau Lourd Astral',
    x: 38,
    y: 52,
    vx: 0,
    vy: 0,
    facing: 1,
    stunTimer: 0,
    action: 'ATTACK_SYSTEM32',
    carryingIconId: null,
    walkPhase: 0,
    attackAnimTimer: 0,
    attackCooldown: 0.9,
    speech: 'Approche ton curseur et goûte à mon Marteau Lourd !',
    slapCount: 0,
  },
  {
    id: 'VOID',
    name: 'Souverain du Néant',
    weaponLabel: 'Pistolet Énergétique',
    x: 62,
    y: 54,
    vx: 0,
    vy: 0,
    facing: -1,
    stunTimer: 0,
    action: 'ATTACK_SYSTEM32',
    carryingIconId: null,
    walkPhase: 1.5,
    attackAnimTimer: 0,
    attackCooldown: 1.4,
    speech: 'Mon Pistolet Énergétique va paralyser ta souris !',
    slapCount: 0,
  },
];

const DISSOLVE_PIXEL_BLOCKS = Array.from({ length: 26 }, (_, i) => ({
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
    if (mode === 'CURSOR_RIPOSTE' || mode === 'BROWSER_ANTIVIRUS') return 'PLAYING';
    if (
      mode === 'CRAFT_AND_ROCKET' ||
      mode === 'SIX_MONTHS_VIRUS' ||
      mode === 'STEVE_EXIT_COMBAT' ||
      mode === 'ELYTRA_FLIGHT'
    ) {
      return 'EPILOGUE_SEQUENCE';
    }
    return 'INTRO_TRANSITION';
  };

  const resolveEpilogueSubPhase = (
    mode: DesktopMiniGameInitialMode
  ): EpilogueStartSubPhase => {
    if (mode === 'SIX_MONTHS_VIRUS') return 'SIX_MONTHS_VIRUS';
    if (mode === 'STEVE_EXIT_COMBAT') return 'STEVE_EXIT_COMBAT';
    if (mode === 'ELYTRA_FLIGHT') return 'ELYTRA_FLIGHT';
    return 'CRAFT_AND_ROCKET';
  };

  const [phase, setPhase] = useState<DesktopPhase>(() =>
    resolveStartPhase(initialMode)
  );
  const [epilogueSubPhase, setEpilogueSubPhase] =
    useState<EpilogueStartSubPhase>(() => resolveEpilogueSubPhase(initialMode));
  const [transitionStageTime, setTransitionStageTime] = useState<number>(0);
  const [corruption, setCorruption] = useState<number>(10);

  const [browserOpen, setBrowserOpen] = useState<boolean>(
    initialMode === 'BROWSER_ANTIVIRUS'
  );
  const [browserPage, setBrowserPage] = useState<'HOME' | 'ANTIVIRUS_SHIELD'>(
    'HOME'
  );
  const [browserHp, setBrowserHp] = useState<number>(100);
  const [downloadStarted, setDownloadStarted] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [antivirusInstalling, setAntivirusInstalling] = useState<boolean>(false);
  const [antivirusProgress, setAntivirusProgress] = useState<number>(0);

  const [icons, setIcons] = useState<DesktopIconState[]>(() =>
    INITIAL_ICONS.map((ic) => ({ ...ic }))
  );
  const [avatars, setAvatars] = useState<DesktopAvatarState[]>(() =>
    INITIAL_AVATARS.map((av) => ({ ...av }))
  );
  const [energyBullets, setEnergyBullets] = useState<EnergyBullet[]>([]);
  const [floatingEffects, setFloatingEffects] = useState<FloatingEffect[]>([]);

  const [cursorDisplay, setCursorDisplay] = useState<{
    x: number;
    y: number;
    stunTimer: number;
  }>({
    x: 50,
    y: 50,
    stunTimer: 0,
  });
  const [hammerShakeTimer, setHammerShakeTimer] = useState<number>(0);

  const [defeatStageTime, setDefeatStageTime] = useState<number>(0);
  const [defeatReason, setDefeatReason] = useState<'WEB' | 'CORRUPTION'>(
    'CORRUPTION'
  );
  const [victoryStageTime, setVictoryStageTime] = useState<number>(0);
  const [clockText, setClockText] = useState<string>('02:55');
  const [startMenuOpen, setStartMenuOpen] = useState<boolean>(false);

  const simRef = useRef({
    phase: resolveStartPhase(initialMode) as DesktopPhase,
    transitionTimer: 0,
    landingSoundPlayed: false,
    windowBurnSoundPlayed: false,
    windowCloseSoundPlayed: false,
    corruption: initialMode === 'DEFEAT_CINEMATIC' ? 100 : 10,
    browserOpen: initialMode === 'BROWSER_ANTIVIRUS',
    browserHp: 100,
    downloadStarted: false,
    downloadProgress: 0,
    antivirusInstalling: initialMode === 'VICTORY_CINEMATIC',
    antivirusProgress: initialMode === 'VICTORY_CINEMATIC' ? 100 : 0,
    icons: INITIAL_ICONS.map((ic) => ({ ...ic })),
    avatars: INITIAL_AVATARS.map((av) => ({ ...av })),
    bullets: [] as EnergyBullet[],
    floatingEffects: [] as FloatingEffect[],
    nextEffectId: 1,
    rawMouseX: 50,
    rawMouseY: 50,
    cursorOffsetX: 0,
    cursorOffsetY: 0,
    cursorVelX: 0,
    cursorVelY: 0,
    cursorStunTimer: 0,
    hammerShakeTimer: 0,
    elapsed: 0,
    defeatTimer: 0,
    victoryTimer: 0,
    lastBrowserIconClickAt: 0,
    soundTickTimer: 0,
    bombBeepCount: 0,
    webDiveSoundPlayed: false,
    crashSoundPlayed: false,
    victorySlamSoundPlayed: false,
    chainRattleTimer: 0,
  });

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

  const resetToMode = useCallback((mode: DesktopMiniGameInitialMode) => {
    const startPhase = resolveStartPhase(mode);
    const subPhase = resolveEpilogueSubPhase(mode);
    soundFX.init();

    simRef.current = {
      phase: startPhase,
      transitionTimer: 0,
      landingSoundPlayed: false,
      windowBurnSoundPlayed: false,
      windowCloseSoundPlayed: false,
      corruption: mode === 'DEFEAT_CINEMATIC' ? 100 : 10,
      browserOpen: mode === 'BROWSER_ANTIVIRUS',
      browserHp: 100,
      downloadStarted: false,
      downloadProgress: 0,
      antivirusInstalling: mode === 'VICTORY_CINEMATIC',
      antivirusProgress: mode === 'VICTORY_CINEMATIC' ? 100 : 0,
      icons: INITIAL_ICONS.map((ic) => ({ ...ic })),
      avatars: INITIAL_AVATARS.map((av) => ({ ...av })),
      bullets: [],
      floatingEffects: [],
      nextEffectId: 1,
      rawMouseX: 50,
      rawMouseY: 50,
      cursorOffsetX: 0,
      cursorOffsetY: 0,
      cursorVelX: 0,
      cursorVelY: 0,
      cursorStunTimer: 0,
      hammerShakeTimer: 0,
      elapsed: 0,
      defeatTimer: 0,
      victoryTimer: 0,
      lastBrowserIconClickAt: 0,
      soundTickTimer: 0,
      bombBeepCount: 0,
      webDiveSoundPlayed: false,
      crashSoundPlayed: false,
      victorySlamSoundPlayed: false,
      chainRattleTimer: 0,
    };

    setPhase(startPhase);
    setEpilogueSubPhase(subPhase);
    setTransitionStageTime(0);
    setCorruption(mode === 'DEFEAT_CINEMATIC' ? 100 : 10);
    setBrowserOpen(mode === 'BROWSER_ANTIVIRUS');
    setBrowserPage('HOME');
    setBrowserHp(100);
    setDownloadStarted(false);
    setDownloadProgress(0);
    setAntivirusInstalling(mode === 'VICTORY_CINEMATIC');
    setAntivirusProgress(mode === 'VICTORY_CINEMATIC' ? 100 : 0);
    setIcons(INITIAL_ICONS.map((ic) => ({ ...ic })));
    setAvatars(INITIAL_AVATARS.map((av) => ({ ...av })));
    setEnergyBullets([]);
    setFloatingEffects([]);
    setDefeatStageTime(0);
    setVictoryStageTime(0);
    setHammerShakeTimer(0);
    setCursorDisplay({ x: 50, y: 50, stunTimer: 0 });
  }, []);

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

  const handleRestartMiniGame = useCallback(() => {
    if (onRestartTransition3D) {
      onRestartTransition3D();
    }
    resetToMode('TRANSITION');
  }, [onRestartTransition3D, resetToMode]);

  const handleMouseMoveDesktop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100;
      const my = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100;
      simRef.current.rawMouseX = Math.max(1, Math.min(99, mx));
      simRef.current.rawMouseY = Math.max(1, Math.min(99, my));
    },
    []
  );

  const openFakeBrowserModal = useCallback(() => {
    const st = simRef.current;
    if (st.phase !== 'PLAYING' || st.cursorStunTimer > 0) return;
    soundFX.init();
    soundFX.playOrbCollect(5);
    st.browserOpen = true;
    st.browserHp = 100;
    setBrowserOpen(true);
    setBrowserHp(100);
    spawnFloatingText(
      50,
      26,
      'NAVIGATEUR WEB OUVERT ! CLIQUEZ SUR LE FAVORI ANTIVIRUS SHIELD PRO !',
      '#38bdf8'
    );
  }, [spawnFloatingText]);

  const handleBrowserIconClick = useCallback(() => {
    const st = simRef.current;
    if (st.cursorStunTimer > 0) return;
    const now = performance.now();
    if (now - st.lastBrowserIconClickAt < 550) {
      openFakeBrowserModal();
    }
    st.lastBrowserIconClickAt = now;
  }, [openFakeBrowserModal]);

  const handleClickAntivirusBookmark = useCallback(() => {
    const st = simRef.current;
    if (st.phase !== 'PLAYING' || st.cursorStunTimer > 0) return;
    soundFX.init();
    soundFX.playOrbCollect(7);
    setBrowserPage('ANTIVIRUS_SHIELD');
    if (!st.downloadStarted) {
      st.downloadStarted = true;
      st.downloadProgress = 4;
      setDownloadStarted(true);
      setDownloadProgress(4);
      spawnFloatingText(
        50,
        35,
        'TÉLÉCHARGEMENT DE ANTIVIRUS_SHIELD_PRO.EXE LANCÉ !',
        '#34d399'
      );
    }
  }, [spawnFloatingText]);

  const handleClickDownloadedFile = useCallback(() => {
    const st = simRef.current;
    if (
      st.phase !== 'PLAYING' ||
      st.cursorStunTimer > 0 ||
      st.downloadProgress < 100
    ) {
      return;
    }
    soundFX.init();
    soundFX.playOrbCollect(9);
    st.antivirusInstalling = true;
    setAntivirusInstalling(true);
    spawnFloatingText(
      50,
      46,
      'INSTALLATION FINALE D’ANTIVIRUS SHIELD PRO LANCÉE !',
      '#10b981'
    );
  }, [spawnFloatingText]);

  const handleSlapAvatar = useCallback(
    (role: AvatarRole, e: React.MouseEvent) => {
      e.stopPropagation();
      const st = simRef.current;
      if (st.phase !== 'PLAYING') return;

      if (st.cursorStunTimer > 0) {
        soundFX.init();
        soundFX.playErrorPopupBeep(2);
        spawnFloatingText(
          st.rawMouseX,
          st.rawMouseY,
          'CLICS DÉSACTIVÉS (SOURIS ÉTOURDIE) !',
          '#f43f5e'
        );
        return;
      }

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
      av.attackCooldown = 1.6;
      av.slapCount += 1;

      const pushAngle =
        Math.atan2(av.y - 50, av.x - 50) + (Math.random() - 0.5) * 0.9;
      av.vx = Math.cos(pushAngle) * 44;
      av.vy = Math.sin(pushAngle) * 44;

      if (st.browserOpen && Math.random() < 0.5) {
        av.action = 'ATTACK_BROWSER_WINDOW';
      } else {
        av.action =
          av.slapCount % 2 === 0 ? 'ATTACK_SYSTEM32' : 'DRAG_TO_TRASH';
      }

      av.speech = 'Aïe ! Claque du curseur ! Étourdi pendant 2 secondes !';
      spawnFloatingText(
        av.x,
        Math.max(12, av.y - 8),
        'CLAQUE ! ÉTOURDI 2.0s',
        '#fde047'
      );
    },
    [spawnFloatingText]
  );

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

      if (st.phase === 'EPILOGUE_SEQUENCE') {
        return;
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

        setDefeatStageTime(t);

        if (t >= 5.6) {
          st.phase = 'EPILOGUE_SEQUENCE';
          setEpilogueSubPhase('CRAFT_AND_ROCKET');
          setPhase('EPILOGUE_SEQUENCE');
        }
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

      if (st.cursorStunTimer > 0) {
        st.cursorStunTimer = Math.max(0, st.cursorStunTimer - dt);
      }
      if (st.hammerShakeTimer > 0) {
        st.hammerShakeTimer = Math.max(0, st.hammerShakeTimer - dt);
      }

      st.cursorOffsetX += st.cursorVelX * dt;
      st.cursorOffsetY += st.cursorVelY * dt;
      st.cursorVelX *= Math.pow(0.03, dt);
      st.cursorVelY *= Math.pow(0.03, dt);
      st.cursorOffsetX *= Math.pow(0.08, dt);
      st.cursorOffsetY *= Math.pow(0.08, dt);

      const effectiveCursorX = Math.max(
        2,
        Math.min(98, st.rawMouseX + st.cursorOffsetX)
      );
      const effectiveCursorY = Math.max(
        2,
        Math.min(96, st.rawMouseY + st.cursorOffsetY)
      );

      for (let i = st.bullets.length - 1; i >= 0; i--) {
        const b = st.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        const distToCursor = Math.hypot(
          b.x - effectiveCursorX,
          b.y - effectiveCursorY
        );
        if (distToCursor < 5.5) {
          st.bullets.splice(i, 1);
          st.cursorStunTimer = 1.0;
          const recoilLen = Math.max(1, Math.hypot(b.vx, b.vy));
          st.cursorVelX = (b.vx / recoilLen) * 85;
          st.cursorVelY = (b.vy / recoilLen) * 85;
          soundFX.init();
          soundFX.playPlayerHurt();
          spawnFloatingText(
            effectiveCursorX,
            effectiveCursorY,
            '⚡ TIR ÉNERGÉTIQUE ! CLICS DÉSACTIVÉS (1s)',
            '#f43f5e'
          );
          continue;
        }

        if (b.x < 0 || b.x > 100 || b.y < 0 || b.y > 100) {
          st.bullets.splice(i, 1);
        }
      }

      st.icons.forEach((ic) => {
        ic.underAttack = false;
        if (!ic.beingDraggedBy) {
          ic.x += (ic.homeX - ic.x) * Math.min(1, dt * 5);
          ic.y += (ic.homeY - ic.y) * Math.min(1, dt * 5);
        }
      });

      const recycleBin = st.icons.find((ic) => ic.id === 'RECYCLE_BIN')!;
      const system32Icon = st.icons.find((ic) => ic.id === 'SYSTEM32')!;

      for (const av of st.avatars) {
        av.walkPhase += dt * 11;
        if (av.attackAnimTimer > 0) {
          av.attackAnimTimer = Math.max(0, av.attackAnimTimer - dt);
        }

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

        av.attackCooldown = Math.max(0, av.attackCooldown - dt);
        const distCursorToAvatar = Math.hypot(
          effectiveCursorX - av.x,
          effectiveCursorY - av.y
        );

        if (av.id === 'CELESTIAL') {
          if (distCursorToAvatar < 12.5 && av.attackCooldown <= 0) {
            av.attackCooldown = 1.65;
            av.attackAnimTimer = 0.45;
            const pushX = effectiveCursorX - av.x;
            const pushY = effectiveCursorY - av.y;
            const pushLen = Math.max(0.5, Math.hypot(pushX, pushY));
            st.cursorVelX = (pushX / pushLen) * 165;
            st.cursorVelY = (pushY / pushLen) * 165;
            st.hammerShakeTimer = 0.45;
            av.speech = '🔨 COUP DE MARTEAU LOURD ! Dégage de là, curseur !';
            soundFX.init();
            soundFX.playBossSlam();
            spawnFloatingText(
              av.x,
              av.y - 8,
              '🔨 COUP DE MARTEAU ! PROJECTION VIOLENTE !',
              '#fbbf24'
            );
          }
        } else {
          if (av.attackCooldown <= 0) {
            av.attackCooldown = 2.1;
            av.attackAnimTimer = 0.35;
            const aimX = effectiveCursorX - av.x;
            const aimY = effectiveCursorY - av.y;
            const aimLen = Math.max(1, Math.hypot(aimX, aimY));
            const shotSpeed = 38;
            st.bullets.push({
              id: st.nextEffectId++,
              x: av.x,
              y: av.y,
              vx: (aimX / aimLen) * shotSpeed,
              vy: (aimY / aimLen) * shotSpeed,
            });
            av.facing = aimX >= 0 ? 1 : -1;
            av.speech = '🔫 Tir énergétique sur ton curseur !';
            soundFX.init();
            soundFX.playLightningDash();
          }
        }

        if (av.action === 'ATTACK_BROWSER_WINDOW' && !st.browserOpen) {
          av.action = 'ATTACK_SYSTEM32';
        } else if (st.browserOpen && av.id === 'CELESTIAL' && !av.carryingIconId) {
          av.action = 'ATTACK_BROWSER_WINDOW';
        }

        const moveSpeed = av.carryingIconId ? 13.5 : 17.5;

        if (av.action === 'DRAG_TO_TRASH') {
          const targetIcon =
            st.icons.find((ic) => ic.id === 'THIS_PC') || st.icons[0];

          if (!av.carryingIconId) {
            av.speech = `Je jette ${targetIcon.label} à la Corbeille !`;
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
              st.corruption = Math.min(100, st.corruption + 15);
              soundFX.playBossSlam();
              spawnFloatingText(
                recycleBin.x + 6,
                recycleBin.y,
                'ICÔNE JETÉE ! +15% CORRUPTION',
                '#f43f5e'
              );
              av.action = 'ATTACK_SYSTEM32';
            }
          }
        } else if (av.action === 'ATTACK_BROWSER_WINDOW') {
          av.speech = 'Fermons cette fenêtre de Navigateur Web !';
          const targetX = 50 + (av.id === 'CELESTIAL' ? -22 : 22);
          const targetY = 48;
          const dx = targetX - av.x;
          const dy = targetY - av.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 3.5) {
            av.x += (dx / dist) * moveSpeed * dt;
            av.y += (dy / dist) * moveSpeed * dt;
            av.facing = dx >= 0 ? 1 : -1;
          } else {
            av.attackAnimTimer = 0.25;
            st.browserHp = Math.max(0, st.browserHp - dt * 16);
            st.corruption = Math.min(100, st.corruption + dt * 2.2);
            if (st.browserHp <= 0) {
              st.browserOpen = false;
              setBrowserOpen(false);
              soundFX.playErrorPopupBeep(4);
              spawnFloatingText(
                50,
                32,
                'FENÊTRE DU NAVIGATEUR FERMÉE PAR LES AVATARS ! ROUVREZ-LA !',
                '#f43f5e'
              );
              av.action = 'ATTACK_SYSTEM32';
            }
          }
        } else {
          av.speech = 'Posons la bombe sur System32 !';
          const dx = system32Icon.x - 4 - av.x;
          const dy = system32Icon.y - av.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 3.5) {
            av.x += (dx / dist) * moveSpeed * dt;
            av.y += (dy / dist) * moveSpeed * dt;
            av.facing = dx >= 0 ? 1 : -1;
          } else {
            av.facing = 1;
            av.attackAnimTimer = 0.25;
            system32Icon.underAttack = true;
            st.corruption = Math.min(100, st.corruption + dt * 4.2);
            if (st.soundTickTimer >= 0.5) {
              st.soundTickTimer = 0;
              soundFX.playSwordSwing();
            }
          }
        }
      }

      if (st.downloadStarted && st.downloadProgress < 100) {
        const dlSpeed = st.browserOpen ? 19.5 : 8.0;
        st.downloadProgress = Math.min(100, st.downloadProgress + dt * dlSpeed);
      }

      if (st.antivirusInstalling) {
        st.antivirusProgress = Math.min(
          100,
          st.antivirusProgress + dt * 15.5
        );
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
      setBrowserHp(st.browserHp);
      setDownloadProgress(st.downloadProgress);
      setAntivirusProgress(st.antivirusProgress);
      setIcons(st.icons.map((ic) => ({ ...ic })));
      setAvatars(st.avatars.map((av) => ({ ...av })));
      setEnergyBullets([...st.bullets]);
      setFloatingEffects([...st.floatingEffects]);
      setHammerShakeTimer(st.hammerShakeTimer);
      setCursorDisplay({
        x: effectiveCursorX,
        y: effectiveCursorY,
        stunTimer: st.cursorStunTimer,
      });
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [spawnFloatingText]);

  if (phase === 'EPILOGUE_SEQUENCE') {
    return (
      <EpilogueMinecraftSequence
        initialSubPhase={epilogueSubPhase}
        triggerKey={triggerKey}
        onReturnToMainMenu={onReturnToMainMenu}
        onRestartFullMiniGame={handleRestartMiniGame}
      />
    );
  }

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

  if (phase === 'DEFEAT' && defeatStageTime >= 4.25) {
    if (defeatStageTime < 4.65) {
      return (
        <div className="fixed inset-0 z-[120] bg-black cursor-none select-none" />
      );
    }

    return (
      <div className="fixed inset-0 z-[120] bg-[#0052a3] text-white font-mono flex flex-col justify-center p-8 sm:p-16 select-none cursor-none">
        <div className="max-w-3xl space-y-5">
          <div className="text-7xl sm:text-8xl font-light">:(</div>
          <h1 className="text-xl sm:text-2xl font-bold leading-relaxed">
            DÉTONATION CRITIQUE SUR C:\WINDOWS\SYSTEM32 — LE FAUX PC A EXPLOSÉ.
          </h1>
          <div className="space-y-1 text-sm sm:text-base text-blue-100">
            <p className="font-bold text-amber-300">
              FUITE DES AVATARS VERS LA PLAINE OPEN-WORLD DU WEB PROFOND... 100%
            </p>
            <p className="text-xs opacity-85 pt-2">
              STOP CODE : SYSTEM32_BOMB_ESCAPE_0xDEADBEEF ({defeatReason})
            </p>
          </div>
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
  const isHammerShake = hammerShakeTimer > 0;

  const bombCountdown =
    phase === 'DEFEAT'
      ? Math.max(0, 3.2 - Math.max(0.55, defeatStageTime))
      : 0;

  return (
    <div
      onMouseMove={handleMouseMoveDesktop}
      className="fixed inset-0 z-50 select-none overflow-hidden font-sans flex flex-col justify-between cursor-none"
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
          : isHammerShake
          ? `translate(${Math.sin(hammerShakeTimer * 120) * 14}px, ${
              Math.cos(hammerShakeTimer * 110) * 12
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
              <path d="M480 265 L590 190 L660 175" />
              <path d="M480 265 L575 345 L645 390" />
            </g>
          </svg>
        </div>
      )}

      <div className="relative z-30 mx-auto mt-3 w-[95vw] max-w-5xl bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-2.5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
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
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Double-Clic sur « Navigateur Web » → Favori « Antivirus Shield Pro »</span>
          </span>
        </div>
      </div>

      <div className="relative flex-1 w-full overflow-hidden">
        {phase === 'INTRO_TRANSITION' &&
          transitionStageTime >= 1.35 &&
          transitionStageTime < 2.95 &&
          (() => {
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
                  opacity:
                    winProgress > 0.9 ? Math.max(0, (1 - winProgress) * 10) : 1,
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
          const isBrowser = ic.id === 'WEB_BROWSER';
          const isSystem32 = ic.id === 'SYSTEM32';
          const isRecycle = ic.id === 'RECYCLE_BIN';

          const hasPlantedBomb =
            isSystem32 &&
            phase === 'DEFEAT' &&
            defeatStageTime >= 0.55 &&
            defeatStageTime < 3.3;

          return (
            <div
              key={ic.id}
              onDoubleClick={() => {
                if (isBrowser) {
                  openFakeBrowserModal();
                }
              }}
              onClick={() => {
                if (isBrowser) {
                  handleBrowserIconClick();
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
              className={`absolute z-20 w-24 p-2 rounded-xl flex flex-col items-center text-center transition-transform cursor-none select-none ${
                isBrowser && !browserOpen
                  ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:bg-cyan-500/30'
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
                    : 'bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950'
                }`}
              >
                {ic.id === 'THIS_PC' && <Monitor className="w-6 h-6" />}
                {isRecycle && <Trash2 className="w-6 h-6" />}
                {isBrowser && <Globe className="w-6 h-6" />}
                {isSystem32 && <FolderCog className="w-6 h-6" />}
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] leading-tight break-words">
                {ic.label}
              </span>
              {isBrowser && !browserOpen && phase === 'PLAYING' && (
                <span className="mt-1 px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-black text-[9px] uppercase animate-bounce">
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
            </div>
          );
        })}

        {browserOpen && phase === 'PLAYING' && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[92vw] max-w-2xl bg-slate-900/95 border-2 border-cyan-400/80 rounded-2xl shadow-[0_0_70px_rgba(56,189,248,0.4)] backdrop-blur-xl overflow-hidden cursor-none">
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Aetheria Web Browser
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-amber-300">
                  Intégrité Fenêtre : {Math.round(browserHp)}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (simRef.current.cursorStunTimer > 0) return;
                    simRef.current.browserOpen = false;
                    setBrowserOpen(false);
                  }}
                  className="p-1 rounded bg-rose-600/80 hover:bg-rose-500 text-white cursor-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center gap-2">
              <div className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 truncate">
                {browserPage === 'ANTIVIRUS_SHIELD'
                  ? 'SECURE_NODE :: antivirus-shield-pro.aetheria/download'
                  : 'PORTAL_NODE :: accueil.aetheria-web.local'}
              </div>
            </div>

            <div className="bg-slate-950/90 px-3 py-1.5 border-b border-slate-800 flex items-center gap-2 text-[11px]">
              <span className="text-slate-400 font-bold uppercase text-[10px]">
                Favoris :
              </span>
              <button
                type="button"
                onClick={handleClickAntivirusBookmark}
                className="px-3 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400 text-emerald-200 font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-none animate-pulse"
              >
                <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Antivirus Shield Pro</span>
              </button>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-500 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Cloud Aetheria
              </span>
            </div>

            <div className="p-5 space-y-4">
              {browserPage === 'HOME' ? (
                <div className="text-center py-6 space-y-2">
                  <Globe className="w-10 h-10 text-cyan-400 mx-auto" />
                  <h3 className="text-base font-black text-white">
                    Portail Intranet Aetheria
                  </h3>
                  <p className="text-xs text-slate-300">
                    Cliquez sur le favori <strong className="text-emerald-300">« Antivirus Shield Pro »</strong> dans la barre de favoris ci-dessus pour télécharger l’exécutable de confinement !
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Antivirus Shield Pro — Édition Noyau
                    </span>
                    <span className="text-xs font-mono text-amber-300">
                      v11.02
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {downloadProgress < 100
                      ? 'Téléchargement de Antivirus_Shield_Pro_Setup.exe en cours... Protégez la fenêtre contre les avatars !'
                      : 'Téléchargement terminé à 100% ! Cliquez sur le fichier dans la barre de téléchargement ci-dessous pour lancer l’installation finale !'}
                  </p>
                </div>
              )}

              {downloadStarted && (
                <div className="p-3 rounded-xl bg-slate-950 border-2 border-cyan-500/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Download className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">
                        Antivirus_Shield_Pro_Setup.exe ({Math.round(downloadProgress)}%)
                      </div>
                      <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={downloadProgress < 100 || antivirusInstalling}
                    onClick={handleClickDownloadedFile}
                    className={`px-4 py-2 rounded-xl font-black text-xs cursor-none ${
                      downloadProgress >= 100 && !antivirusInstalling
                        ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.7)] animate-bounce'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {antivirusInstalling
                      ? 'Installation en cours...'
                      : downloadProgress >= 100
                      ? '▶ Cliquer pour Installer'
                      : 'Téléchargement...'}
                  </button>
                </div>
              )}

              {antivirusInstalling && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border-2 border-emerald-400 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-300" />
                      INSTALLATION FINALE D’ANTIVIRUS SHIELD PRO...
                    </span>
                    <span className="font-mono">{Math.round(antivirusProgress)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 rounded-full"
                      style={{ width: `${antivirusProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {energyBullets.map((b) => (
          <div
            key={b.id}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-40 w-5 h-5 rounded-full bg-fuchsia-500 border-2 border-white shadow-[0_0_18px_rgba(217,70,239,1)] pointer-events-none"
          />
        ))}

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
              const dropP = Math.min(1, (transitionStageTime - 1.65) / 0.52);
              const bounce =
                transitionStageTime >= 2.17
                  ? Math.sin(
                      Math.min(1, (transitionStageTime - 2.17) / 0.45) * Math.PI
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
                displayX = av.x + ((isCelestial ? 82 : 86) - av.x) * p;
                displayY = av.y + ((isCelestial ? 64 : 71) - av.y) * p;
                statusSpeech = 'Vite ! Déposons la bombe numérique sur System32 !';
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
                  startY + (20 - startY) * p - Math.sin(p * Math.PI) * 12;
                avatarScale = Math.max(0.05, 1 - Math.max(0, (p - 0.55) * 2.1));
                statusSpeech = 'PLONGEON DANS LE NAVIGATEUR WEB !';
              } else {
                return null;
              }
            }

            const legSwing = isStunned
              ? 0
              : Math.sin(av.walkPhase + defeatStageTime * 16) * 18;
            const weaponAngle =
              av.attackAnimTimer > 0 ? Math.sin(av.attackAnimTimer * 24) * 55 : 0;

            return (
              <div
                key={av.id}
                onMouseDown={(e) => handleSlapAvatar(av.id, e)}
                style={{
                  left: `${displayX}%`,
                  top: `${displayY}%`,
                  transform: `translate(-50%, -50%) scale(${avatarScale})`,
                }}
                className="absolute z-[58] cursor-none group select-none"
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
                  className={`relative w-28 h-32 flex items-center justify-center rounded-2xl transition-transform ${
                    isStunned ? 'rotate-12 opacity-85' : ''
                  }`}
                >
                  <svg
                    viewBox="0 0 115 125"
                    className="w-28 h-32 overflow-visible drop-shadow-[0_6px_16px_rgba(0,0,0,0.85)]"
                    style={{
                      transform: `scaleX(${av.facing})`,
                    }}
                  >
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

                    {isCelestial ? (
                      <g transform={`rotate(${weaponAngle} 64 52)`}>
                        <rect
                          x="62"
                          y="18"
                          width="6"
                          height="48"
                          rx="2"
                          fill="#92400e"
                          stroke="#fde047"
                          strokeWidth="1.5"
                        />
                        <rect
                          x="50"
                          y="8"
                          width="30"
                          height="16"
                          rx="4"
                          fill="#475569"
                          stroke="#fbbf24"
                          strokeWidth="2.5"
                        />
                      </g>
                    ) : (
                      <g transform={`rotate(${weaponAngle * 0.4} 64 52)`}>
                        <rect
                          x="62"
                          y="44"
                          width="26"
                          height="10"
                          rx="3"
                          fill="#1e1b4b"
                          stroke="#f43f5e"
                          strokeWidth="2"
                        />
                        <rect
                          x="62"
                          y="52"
                          width="9"
                          height="14"
                          rx="2"
                          fill="#31102f"
                        />
                        <circle cx="89" cy="49" r="4" fill="#38bdf8" />
                      </g>
                    )}
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
              </g>
            </svg>
          </div>
        )}

        {phase === 'VICTORY' && (
          <>
            {victoryStageTime < 1.6 && (
              <svg
                viewBox="0 0 1000 600"
                className="fixed inset-0 w-full h-full z-40 pointer-events-none"
              >
                <g stroke="#38bdf8" strokeWidth="6" fill="none">
                  <polyline points="500,0 440,140 475,240 385,390 410,470 350,565" />
                  <polyline points="500,0 565,150 530,255 620,395 590,475 650,565" />
                </g>
              </svg>
            )}

            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto pb-44">
              <div className="max-w-xl w-full bg-slate-900/95 border-2 border-emerald-400 rounded-3xl p-7 text-center shadow-[0_0_90px_rgba(16,185,129,0.5)] backdrop-blur-xl space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center mx-auto text-emerald-300">
                  <Lock className="w-9 h-9" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  ANTIVIRUS SHIELD PRO 100% • ENTRAVE PHYSIQUE ACTIVE
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                  ANOMALIES SOUMISES ET VERROUILLÉES DANS LE NOYAU.
                </h2>
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
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-none"
                  >
                    <Home className="w-4 h-4" />
                    Valider la Fin Secrète &amp; Menu Principal
                  </button>
                  <button
                    type="button"
                    onClick={handleRestartMiniGame}
                    className="py-3.5 px-4 rounded-2xl bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-none"
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
                    Math.sin(victoryStageTime * 5.5 + (isCelestial ? 0 : 1.7))
                  ) * (isCelestial ? -18 : 18);
                const bodyStrainTilt = isCelestial ? -22 : 22;

                return (
                  <div key={role} className="relative flex flex-col items-center">
                    <svg
                      viewBox="0 0 230 120"
                      className="w-56 sm:w-64 h-28 overflow-visible"
                    >
                      {[0, 1, 2, 3, 4, 5].map((linkIdx) => {
                        const tLink = linkIdx / 5;
                        const anchorX = isCelestial ? 148 : 82;
                        const ankleX =
                          (isCelestial ? 86 : 144) + strugglePull;
                        const lx = anchorX + (ankleX - anchorX) * tLink;
                        const ly = 92 + Math.sin(tLink * Math.PI) * 4;
                        return (
                          <rect
                            key={linkIdx}
                            x={lx - 6}
                            y={ly - 4}
                            width="12"
                            height="8"
                            rx="3"
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="3"
                          />
                        );
                      })}
                      <circle
                        cx={isCelestial ? 172 : 58}
                        cy="82"
                        r="24"
                        fill="#0f172a"
                        stroke="#334155"
                        strokeWidth="3"
                      />
                      <g
                        transform={`translate(${strugglePull}, 0) rotate(${bodyStrainTilt} ${
                          isCelestial ? 78 : 152
                        } 88)`}
                      >
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

        <div
          style={{
            left: `${cursorDisplay.x}%`,
            top: `${cursorDisplay.y}%`,
            transform: 'translate(-20%, -15%)',
          }}
          className="fixed z-[150] pointer-events-none select-none"
        >
          <div
            className={`relative flex items-center ${
              cursorDisplay.stunTimer > 0 ? 'animate-spin' : ''
            }`}
          >
            <svg
              viewBox="0 0 36 36"
              className="w-8 h-8 drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]"
            >
              <polygon
                points="4,2 4,28 11,22 17,33 22,30 16,19 26,19"
                fill={cursorDisplay.stunTimer > 0 ? '#f43f5e' : '#ffffff'}
                stroke={cursorDisplay.stunTimer > 0 ? '#fde047' : '#020617'}
                strokeWidth="2.2"
              />
            </svg>
            {cursorDisplay.stunTimer > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded bg-rose-600 border border-yellow-300 text-[10px] font-mono font-black text-white whitespace-nowrap">
                ⚡ ÉTOURDI ({cursorDisplay.stunTimer.toFixed(1)}s)
              </span>
            )}
          </div>
        </div>
      </div>

      {startMenuOpen && (
        <div className="fixed bottom-14 left-3 z-50 w-72 rounded-2xl bg-slate-900/95 border border-white/15 p-4 shadow-2xl backdrop-blur-xl space-y-3 cursor-none">
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
              openFakeBrowserModal();
            }}
            className="w-full py-2 px-3 rounded-xl bg-cyan-500/20 text-cyan-200 text-xs font-bold flex items-center gap-2 cursor-none"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            Ouvrir Navigateur Web
          </button>
          <button
            type="button"
            onClick={onReturnToMainMenu}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-2 cursor-none"
          >
            <Home className="w-4 h-4 text-rose-400" />
            Quitter vers le Menu Principal
          </button>
        </div>
      )}

      <div className="relative z-50 h-12 w-full bg-slate-950/95 backdrop-blur-xl border-t border-white/15 px-3 flex items-center justify-between text-xs text-slate-200 cursor-none">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStartMenuOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-blue-600/25 border border-blue-400/40 flex items-center gap-2 font-bold text-white cursor-none"
          >
            <span>Démarrer</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-[11px] text-slate-300">
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>Curseur Physique Actif (Attention au Marteau &amp; Pistolet !)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-300">
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
