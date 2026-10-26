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
  CheckCircle2,
  AlertOctagon,
  Hand,
} from 'lucide-react';
import { soundFX } from '../utils/sound';

export interface DesktopInvasionMiniGameProps {
  onVictoryReturnToMenu: () => void;
  onReturnToMainMenu: () => void;
}

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
    x: 44,
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
    x: 56,
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

export const DesktopInvasionMiniGame: React.FC<DesktopInvasionMiniGameProps> = ({
  onVictoryReturnToMenu,
  onReturnToMainMenu,
}) => {
  const [phase, setPhase] = useState<'PLAYING' | 'DEFEAT' | 'VICTORY'>('PLAYING');
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
  const [petGreeting, setPetGreeting] = useState<{
    celestial: boolean;
    void: boolean;
    celestialCount: number;
    voidCount: number;
  }>({
    celestial: false,
    void: false,
    celestialCount: 0,
    voidCount: 0,
  });
  const [clockText, setClockText] = useState<string>('02:09');
  const [startMenuOpen, setStartMenuOpen] = useState<boolean>(false);

  const simRef = useRef({
    phase: 'PLAYING' as 'PLAYING' | 'DEFEAT' | 'VICTORY',
    corruption: 8,
    antivirusOpen: false,
    antivirusProgress: 0,
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
    crashSoundPlayed: false,
  });

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
    soundFX.init();
    soundFX.playTimeShift();
    simRef.current = {
      phase: 'PLAYING',
      corruption: 8,
      antivirusOpen: false,
      antivirusProgress: 0,
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
      crashSoundPlayed: false,
    };
    setPhase('PLAYING');
    setCorruption(8);
    setAntivirusOpen(false);
    setAntivirusProgress(0);
    setAntivirusJammed(false);
    setIcons(INITIAL_ICONS.map((ic) => ({ ...ic })));
    setAvatars(INITIAL_AVATARS.map((av) => ({ ...av })));
    setFloatingEffects([]);
    setDefeatStageTime(0);
    setVictoryStageTime(0);
  }, []);

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

      const pushAngle = Math.atan2(av.y - 50, av.x - 50) + (Math.random() - 0.5) * 0.9;
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
        av.action = actionsPool[(av.slapCount + (role === 'CELESTIAL' ? 0 : 1)) % actionsPool.length];
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
    st.antivirusProgress = Math.min(100, st.antivirusProgress + 4.2);
    setAntivirusProgress(st.antivirusProgress);
    spawnFloatingText(50, 34, '+4% TURBO SCAN', '#38bdf8');
  }, [spawnFloatingText]);

  const handlePetHover = useCallback((role: AvatarRole) => {
    soundFX.init();
    soundFX.playJump();
    setPetGreeting((prev) => ({
      ...prev,
      celestial: role === 'CELESTIAL' ? true : prev.celestial,
      void: role === 'VOID' ? true : prev.void,
      celestialCount:
        role === 'CELESTIAL' ? prev.celestialCount + 1 : prev.celestialCount,
      voidCount: role === 'VOID' ? prev.voidCount + 1 : prev.voidCount,
    }));
  }, []);

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

      if (st.phase === 'DEFEAT') {
        st.defeatTimer += dt;
        if (st.defeatTimer >= 2.6 && !st.crashSoundPlayed) {
          st.crashSoundPlayed = true;
          soundFX.playPiercingGlitchCrash();
        }
        if (st.defeatTimer >= 3.35) {
          soundFX.silenceAll();
        }
        setDefeatStageTime(st.defeatTimer);
        return;
      }

      if (st.phase === 'VICTORY') {
        st.victoryTimer += dt;
        setVictoryStageTime(st.victoryTimer);
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
            st.icons.find((ic) => ic.id === (av.carryingIconId || targetableId)) ||
            st.icons[0];

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
            av.speech = `Direction la Corbeille avec ${carried?.label || 'l’icône'} !`;
            const dx = recycleBin.x - av.x;
            const dy = recycleBin.y - av.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 3.5) {
              av.x += (dx / dist) * moveSpeed * dt;
              av.y += (dy / dist) * moveSpeed * dt;
              av.facing = dx >= 0 ? 1 : -1;
              if (carried) {
                carried.x = av.x + (av.facing * 2.5);
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

  if (phase === 'DEFEAT' && defeatStageTime >= 3.35) {
    if (defeatStageTime < 4.0) {
      return <div className="fixed inset-0 z-[120] bg-black cursor-none select-none" />;
    }

    return (
      <div className="fixed inset-0 z-[120] bg-[#0066cc] text-white font-mono flex flex-col justify-between p-8 sm:p-16 select-none">
        <div className="max-w-3xl space-y-6">
          <div className="text-7xl sm:text-8xl font-light">:(</div>
          <h1 className="text-xl sm:text-2xl font-bold leading-relaxed">
            Votre PC a rencontré un problème critique et doit redémarrer. Les deux avatars d’Aetheria ont brisé le confinement et se sont échappés vers le Réseau Mondial.
          </h1>
          <div className="space-y-1 text-sm sm:text-base text-blue-100">
            <p>
              Collecte des informations d’erreur : 100% terminé
            </p>
            <p className="font-bold text-amber-300">
              MESSAGE : FUITE VERS LE RÉSEAU MONDIAL RÉUSSIE
            </p>
            <p className="text-xs opacity-85 pt-2">
              Code d’arrêt : FOURTH_WALL_WEB_ESCAPE_0xDEADBEEF ({defeatReason === 'WEB' ? 'BROWSER_BREACH_COMPLETE' : 'SYSTEM32_CORRUPTION_100'})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-white/25">
          <button
            type="button"
            onClick={handleRestartMiniGame}
            className="px-6 py-3.5 rounded-xl bg-white text-[#0066cc] hover:bg-blue-50 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Réessayer la Défense du Bureau
          </button>
          <button
            type="button"
            onClick={onReturnToMainMenu}
            className="px-6 py-3.5 rounded-xl bg-blue-900/70 hover:bg-blue-900 text-white border border-white/30 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Retour au Menu Principal
          </button>
        </div>
      </div>
    );
  }

  const isExplodingDefeat = phase === 'DEFEAT' && defeatStageTime >= 1.8 && defeatStageTime < 3.35;

  return (
    <div
      className="fixed inset-0 z-50 select-none overflow-hidden font-sans flex flex-col justify-between"
      style={{
        background:
          'radial-gradient(circle at 75% 25%, #1d4ed8 0%, #0f172a 48%, #020617 100%)',
        transform: isExplodingDefeat
          ? `perspective(600px) rotateX(${Math.sin(defeatStageTime * 35) * 18}deg) rotateY(${
              Math.cos(defeatStageTime * 29) * 22
            }deg) scale(${1 + (defeatStageTime - 1.8) * 0.45}) skew(${
              Math.sin(defeatStageTime * 40) * 14
            }deg)`
          : undefined,
        filter: isExplodingDefeat
          ? 'invert(0.85) contrast(2.4) hue-rotate(140deg) saturate(3)'
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
            <span>Double-Clic sur Antivirus_Setup.exe : Purger &amp; Asservir</span>
          </span>
        </div>
      </div>

      <div className="relative flex-1 w-full overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[440px] h-[210px] rounded-xl bg-slate-950/70 border border-fuchsia-500/40 shadow-[0_0_50px_rgba(217,70,239,0.2)] backdrop-blur-sm pointer-events-none flex flex-col overflow-hidden opacity-60">
          <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-fuchsia-400" />
              Aetherial_Horizons.exe — [BRÈCHE DU 4ÈME MUR]
            </span>
            <span className="text-rose-400 font-bold">[FUITE DES ENTITÉS]</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="text-xs font-black uppercase tracking-widest text-fuchsia-300 mb-1">
              Fenêtre de Jeu Fracturée
            </div>
            <p className="text-[11px] text-slate-400 max-w-xs">
              L’Entité Céleste et le Souverain du Néant se sont échappés de la fenêtre 3D et envahissent votre bureau Windows !
            </p>
          </div>
        </div>

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
                  ic.underAttack ? 'scale(1.12) rotate(-4deg)' : ''
                }`,
              }}
              className={`absolute z-20 w-24 p-2 rounded-xl flex flex-col items-center text-center transition-transform cursor-pointer select-none ${
                isAntivirus && !antivirusOpen
                  ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:bg-emerald-500/30'
                  : ic.underAttack
                  ? 'bg-rose-500/30 border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.7)]'
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
              {isAntivirus && !antivirusOpen && (
                <span className="mt-1 px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-black text-[9px] uppercase animate-bounce">
                  Double-Clic !
                </span>
              )}
              {isSystem32 && ic.underAttack && (
                <span className="mt-1 px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[9px] uppercase animate-pulse">
                  ATTAQUÉ !
                </span>
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
                Antivirus_Setup.exe — Confinement des Entités
              </span>
              <span className="font-mono">{Math.round(antivirusProgress)}%</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  {antivirusJammed
                    ? '⚠️ SABOTAGE EN COURS ! Cliquez sur l’avatar pour le repousser !'
                    : 'Déploiement du pare-feu et de la bulle de confinement...'}
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
                  Accélérer l’Installation (+4%)
                </button>
              </div>
            </div>
          </div>
        )}

        {phase !== 'VICTORY' &&
          avatars.map((av) => {
            const isCelestial = av.id === 'CELESTIAL';
            const isStunned = av.stunTimer > 0;
            const isJumpingIntoWeb =
              phase === 'DEFEAT' && defeatStageTime < 2.2;
            const jumpScale = isJumpingIntoWeb
              ? Math.max(0.05, 1 - defeatStageTime * 0.45)
              : 1;
            const displayX = isJumpingIntoWeb ? 89 : av.x;
            const displayY = isJumpingIntoWeb ? 18 : av.y;

            const legSwing = isStunned ? 0 : Math.sin(av.walkPhase) * 18;
            const swordSwing =
              av.slashPhase > 0 ? Math.sin(av.slashPhase) * 38 : 12;

            return (
              <div
                key={av.id}
                onMouseDown={(e) => handleSlapAvatar(av.id, e)}
                style={{
                  left: `${displayX}%`,
                  top: `${displayY}%`,
                  transform: `translate(-50%, -50%) scale(${jumpScale})`,
                }}
                className="absolute z-40 cursor-pointer group select-none"
                title="Clic gauche pour infliger une claque et étourdir cet avatar pendant 2 secondes !"
              >
                <div className="mb-1 px-2.5 py-1 rounded-full bg-slate-950/90 border border-white/20 text-[10px] font-bold text-white whitespace-nowrap shadow-lg text-center">
                  {isStunned ? (
                    <span className="text-amber-300 font-black">
                      💫 ÉTOURDI ({av.stunTimer.toFixed(1)}s)
                    </span>
                  ) : (
                    <span>{av.speech}</span>
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

        {phase === 'DEFEAT' && defeatStageTime < 3.35 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-6">
            <div className="max-w-2xl w-full bg-rose-950/95 border-4 border-rose-500 rounded-3xl p-8 text-center shadow-[0_0_120px_rgba(244,63,94,0.9)] animate-bounce">
              <AlertOctagon className="w-16 h-16 text-rose-400 mx-auto mb-3" />
              <div className="text-xs font-mono font-black uppercase tracking-[0.3em] text-amber-300 mb-2">
                ALERTE CRITIQUE DE SÉCURITÉ
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-wide">
                FUITE VERS LE RÉSEAU MONDIAL RÉUSSIE
              </h2>
              <p className="text-sm text-rose-200 mt-3">
                Les deux avatars ont plongé dans le Navigateur Web et provoquent l’explosion géométrique du système !
              </p>
            </div>
          </div>
        )}

        {phase === 'VICTORY' && (
          <>
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto">
              <div className="max-w-lg w-full bg-slate-900/95 border-2 border-emerald-400 rounded-3xl p-7 text-center shadow-[0_0_90px_rgba(16,185,129,0.5)] backdrop-blur-xl space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center mx-auto text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  ANTIVIRUS_SETUP.EXE — 100% INSTALLÉ
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  MENACES NEUTRALISÉES ET ASSERVIES
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  La bulle de confinement numérique a neutralisé l’Entité Céleste et le Souverain du Néant ! Ils ont été convertis en petits <strong className="text-amber-300">Desktop Pets</strong> dociles bloqués en bas de votre écran. Survolez-les avec votre curseur pour les obliger à vous saluer !
                </p>

                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center gap-3 text-left">
                  <Trophy className="w-7 h-7 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      SUCCÈS SECRET VALIDÉ
                    </div>
                    <div className="text-xs font-bold text-white">
                      Dompteur du 4ème Mur : Avatars convertis en Desktop Pets
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onVictoryReturnToMenu}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.4)] cursor-pointer transition-all"
                >
                  <Home className="w-4 h-4" />
                  Retourner au Menu Principal (Succès Secret Validé)
                </button>
              </div>
            </div>

            <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-end gap-12 pointer-events-auto">
              <div
                onMouseEnter={() => handlePetHover('CELESTIAL')}
                onClick={() => handlePetHover('CELESTIAL')}
                className="group relative flex flex-col items-center cursor-pointer"
              >
                <div
                  className={`mb-2 px-3 py-1.5 rounded-2xl text-[11px] font-bold border shadow-xl transition-all whitespace-nowrap ${
                    petGreeting.celestial
                      ? 'bg-amber-400 text-slate-950 border-white scale-105'
                      : 'bg-slate-950/90 text-amber-200 border-amber-400/50'
                  }`}
                >
                  {petGreeting.celestial
                    ? `👋 « Bonjour ô Grand Curseur ! À vos ordres ! (#${petGreeting.celestialCount}) »`
                    : 'Survolez-moi avec la souris !'}
                </div>
                <div className="w-20 h-20 rounded-full bg-cyan-400/20 border-2 border-cyan-300/80 shadow-[0_0_30px_rgba(34,211,238,0.6)] flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                  <div className="w-10 h-12 rounded-xl bg-gradient-to-b from-white to-amber-200 border-2 border-amber-400 flex flex-col items-center justify-center relative">
                    <div className="flex gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    </div>
                    <div className="w-3 h-1 rounded-full bg-rose-400" />
                    <div className="absolute -right-3 top-1 text-sm origin-bottom-left group-hover:animate-bounce">
                      👋
                    </div>
                  </div>
                </div>
                <span className="mt-1 px-2 py-0.5 rounded bg-slate-950/90 border border-cyan-400/40 text-[10px] font-extrabold text-cyan-200">
                  Desktop Pet : Céleste (Docile)
                </span>
              </div>

              <div
                onMouseEnter={() => handlePetHover('VOID')}
                onClick={() => handlePetHover('VOID')}
                className="group relative flex flex-col items-center cursor-pointer"
              >
                <div
                  className={`mb-2 px-3 py-1.5 rounded-2xl text-[11px] font-bold border shadow-xl transition-all whitespace-nowrap ${
                    petGreeting.void
                      ? 'bg-fuchsia-500 text-white border-white scale-105'
                      : 'bg-slate-950/90 text-fuchsia-200 border-fuchsia-400/50'
                  }`}
                >
                  {petGreeting.void
                    ? `👋 « Salut Maître du Bureau ! Je vous salue bien bas ! (#${petGreeting.voidCount}) »`
                    : 'Survolez-moi avec la souris !'}
                </div>
                <div className="w-20 h-20 rounded-full bg-cyan-400/20 border-2 border-cyan-300/80 shadow-[0_0_30px_rgba(34,211,238,0.6)] flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                  <div className="w-10 h-12 rounded-xl bg-gradient-to-b from-purple-950 to-rose-950 border-2 border-rose-500 flex flex-col items-center justify-center relative">
                    <div className="flex gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    </div>
                    <div className="w-3 h-1 rounded-full bg-rose-300" />
                    <div className="absolute -right-3 top-1 text-sm origin-bottom-left group-hover:animate-bounce">
                      👋
                    </div>
                  </div>
                </div>
                <span className="mt-1 px-2 py-0.5 rounded bg-slate-950/90 border border-cyan-400/40 text-[10px] font-extrabold text-cyan-200">
                  Desktop Pet : Néant (Docile)
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {startMenuOpen && (
        <div className="fixed bottom-14 left-3 z-50 w-72 rounded-2xl bg-slate-900/95 border border-white/15 p-4 shadow-2xl backdrop-blur-xl space-y-3">
          <div className="text-xs font-black text-white border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Windows Aetheria OS</span>
            <span className="text-emerald-400 font-mono text-[10px]">Build 1102</span>
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
            <span>Aetherial_Horizons.exe (Fuite 4ème Mur)</span>
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
