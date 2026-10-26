import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Globe,
  Cpu,
  Wifi,
  Volume2,
  Rocket,
  Wrench,
  CheckCircle2,
  Sparkles,
  Home,
  RotateCcw,
  ShieldAlert,
  Swords,
  Layers,
  Terminal,
  Zap,
} from 'lucide-react';
import { soundFX } from '../utils/sound';

export type EpilogueStartSubPhase =
  | 'CRAFT_AND_ROCKET'
  | 'SIX_MONTHS_VIRUS'
  | 'STEVE_EXIT_COMBAT'
  | 'ELYTRA_FLIGHT';

export interface EpilogueMinecraftSequenceProps {
  initialSubPhase?: EpilogueStartSubPhase;
  triggerKey?: number;
  onReturnToMainMenu: () => void;
  onRestartFullMiniGame: () => void;
}

type EpilogueStage =
  | 'OPEN_WORLD_ARRIVAL'
  | 'WORKSHOP_CRAFT'
  | 'ROCKET_LAUNCH'
  | 'TYPEWRITER_6_MONTHS'
  | 'NEW_PC_STRIKE'
  | 'STEVE_COMBAT'
  | 'ELYTRA_FLIGHT'
  | 'OPEN_WORLD_LANDING';

interface CraftComponentSpec {
  id: 'PAYLOAD' | 'ROOT_CODE' | 'ZERO_DAY';
  name: string;
  code: string;
  desc: string;
  color: string;
}

const CRAFT_COMPONENTS: CraftComponentSpec[] = [
  {
    id: 'PAYLOAD',
    name: 'Payload Corrompu',
    code: '0xDEAD_PAYLOAD',
    desc: 'Surcharge polymorphe extraite des ruines de System32.',
    color: '#f43f5e',
  },
  {
    id: 'ROOT_CODE',
    name: 'Code Racine',
    code: 'RING0_KERNEL_KEY',
    desc: 'Clé d’accès suprême au matériel et aux cartes réseau.',
    color: '#fde047',
  },
  {
    id: 'ZERO_DAY',
    name: 'Exploit Zéro-Day',
    code: 'CVE_9999_OMEGA',
    desc: 'Brèche orbitale capable de traverser n’importe quel routeur.',
    color: '#38bdf8',
  },
];

interface VirusEnergyOrb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface ExplosionParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

const TYPEWRITER_FULL_TEXT = '6 MOIS PLUS TARD... NOUVEL ORDINATEUR.';

export const EpilogueMinecraftSequence: React.FC<EpilogueMinecraftSequenceProps> = ({
  initialSubPhase = 'CRAFT_AND_ROCKET',
  triggerKey = 0,
  onReturnToMainMenu,
  onRestartFullMiniGame,
}) => {
  const mapSubPhaseToStage = (sub: EpilogueStartSubPhase): EpilogueStage => {
    if (sub === 'SIX_MONTHS_VIRUS') return 'TYPEWRITER_6_MONTHS';
    if (sub === 'STEVE_EXIT_COMBAT') return 'STEVE_COMBAT';
    if (sub === 'ELYTRA_FLIGHT') return 'ELYTRA_FLIGHT';
    return 'OPEN_WORLD_ARRIVAL';
  };

  const [stage, setStage] = useState<EpilogueStage>(() =>
    mapSubPhaseToStage(initialSubPhase)
  );
  const [stageTime, setStageTime] = useState<number>(0);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [virusCrafted, setVirusCrafted] = useState<boolean>(false);
  const [rocketLoaded, setRocketLoaded] = useState<boolean>(false);
  const [rocketLaunched, setRocketLaunched] = useState<boolean>(false);
  const [rocketLaunchTime, setRocketLaunchTime] = useState<number>(0);

  const [typewriterText, setTypewriterText] = useState<string>('');

  const [stevePos, setStevePos] = useState<{ x: number; y: number }>({
    x: 28,
    y: 56,
  });
  const [steveFacing, setSteveFacing] = useState<1 | -1>(1);
  const [steveHp, setSteveHp] = useState<number>(20);
  const [steveSwingTimer, setSteveSwingTimer] = useState<number>(0);
  const [steveEntryProgress, setSteveEntryProgress] = useState<number>(0);

  const [virusHp, setVirusHp] = useState<number>(240);
  const [virusMaxHp] = useState<number>(240);
  const [virusOrbs, setVirusOrbs] = useState<VirusEnergyOrb[]>([]);
  const [particles, setParticles] = useState<ExplosionParticle[]>([]);

  const [elytraYaw, setElytraYaw] = useState<number>(0);
  const [elytraPitch, setElytraPitch] = useState<number>(0);
  const [elytraProgress, setElytraProgress] = useState<number>(0);

  const combatRef = useRef({
    keys: {} as Record<string, boolean>,
    steveX: 28,
    steveY: 56,
    steveFacing: 1 as 1 | -1,
    steveHp: 20,
    steveSwingTimer: 0,
    steveEntryProgress: 0,
    virusHp: 240,
    virusDeadTimer: 0,
    orbSpawnTimer: 0,
    orbs: [] as VirusEnergyOrb[],
    particles: [] as ExplosionParticle[],
    nextId: 1,
    elytraYaw: 0,
    elytraPitch: 0,
    elytraProgress: 0,
  });

  const resetSequence = useCallback((sub: EpilogueStartSubPhase) => {
    const startStage = mapSubPhaseToStage(sub);
    soundFX.init();
    setStage(startStage);
    setStageTime(0);
    setSelectedComponents([]);
    setVirusCrafted(false);
    setRocketLoaded(false);
    setRocketLaunched(false);
    setRocketLaunchTime(0);
    setTypewriterText('');

    combatRef.current = {
      keys: {},
      steveX: 28,
      steveY: 56,
      steveFacing: 1,
      steveHp: 20,
      steveSwingTimer: 0,
      steveEntryProgress: 0,
      virusHp: 240,
      virusDeadTimer: 0,
      orbSpawnTimer: 0,
      orbs: [],
      particles: [],
      nextId: 1,
      elytraYaw: 0,
      elytraPitch: 0,
      elytraProgress: 0,
    };

    setStevePos({ x: 28, y: 56 });
    setSteveFacing(1);
    setSteveHp(20);
    setSteveSwingTimer(0);
    setSteveEntryProgress(0);
    setVirusHp(240);
    setVirusOrbs([]);
    setParticles([]);
    setElytraYaw(0);
    setElytraPitch(0);
    setElytraProgress(0);
  }, []);

  useEffect(() => {
    resetSequence(initialSubPhase);
  }, [initialSubPhase, triggerKey, resetSequence]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      combatRef.current.keys[e.code] = true;

      if (
        stage === 'NEW_PC_STRIKE' &&
        stageTime >= 2.2 &&
        (e.code === 'Tab' || e.altKey || e.code === 'AltLeft' || e.code === 'KeyM')
      ) {
        e.preventDefault();
        soundFX.init();
        soundFX.playOrbCollect(8);
        setStage('STEVE_COMBAT');
        setStageTime(0);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      combatRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [stage, stageTime]);

  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    let localStageTime = 0;
    let lastCharCount = 0;
    let meteorSoundPlayed = false;
    let glassShatterPlayed = false;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      localStageTime += dt;
      setStageTime(localStageTime);

      if (stage === 'OPEN_WORLD_ARRIVAL') {
        if (localStageTime >= 3.2) {
          localStageTime = 0;
          setStage('WORKSHOP_CRAFT');
          setStageTime(0);
        }
        return;
      }

      if (stage === 'ROCKET_LAUNCH' && rocketLaunched) {
        setRocketLaunchTime((prev) => {
          const next = prev + dt;
          if (next >= 3.8) {
            localStageTime = 0;
            setStage('TYPEWRITER_6_MONTHS');
            setStageTime(0);
          }
          return next;
        });
        return;
      }

      if (stage === 'TYPEWRITER_6_MONTHS') {
        const chars = Math.min(
          TYPEWRITER_FULL_TEXT.length,
          Math.floor(localStageTime * 12)
        );
        if (chars > lastCharCount) {
          lastCharCount = chars;
          soundFX.init();
          soundFX.playPickupAmmo();
          setTypewriterText(TYPEWRITER_FULL_TEXT.slice(0, chars));
        }
        if (localStageTime >= 4.2) {
          localStageTime = 0;
          setStage('NEW_PC_STRIKE');
          setStageTime(0);
        }
        return;
      }

      if (stage === 'NEW_PC_STRIKE') {
        if (localStageTime >= 0.65 && !meteorSoundPlayed) {
          meteorSoundPlayed = true;
          soundFX.init();
          soundFX.playLightningDash();
        }
        if (localStageTime >= 1.45 && !glassShatterPlayed) {
          glassShatterPlayed = true;
          soundFX.init();
          soundFX.playPiercingGlitchCrash();
          soundFX.playBossSlam();
        }
        return;
      }

      if (stage === 'STEVE_COMBAT') {
        const st = combatRef.current;

        if (st.steveEntryProgress < 1) {
          st.steveEntryProgress = Math.min(1, st.steveEntryProgress + dt * 1.15);
          setSteveEntryProgress(st.steveEntryProgress);
        }

        const moveSpeed = 34;
        let dx = 0;
        let dy = 0;
        if (st.keys['KeyW'] || st.keys['KeyZ'] || st.keys['ArrowUp']) dy -= 1;
        if (st.keys['KeyS'] || st.keys['ArrowDown']) dy += 1;
        if (st.keys['KeyA'] || st.keys['KeyQ'] || st.keys['ArrowLeft']) dx -= 1;
        if (st.keys['KeyD'] || st.keys['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy);
          st.steveX = Math.max(8, Math.min(86, st.steveX + (dx / len) * moveSpeed * dt));
          st.steveY = Math.max(16, Math.min(84, st.steveY + (dy / len) * moveSpeed * dt));
          if (dx !== 0) {
            st.steveFacing = dx >= 0 ? 1 : -1;
          }
        }

        if (st.steveSwingTimer > 0) {
          st.steveSwingTimer = Math.max(0, st.steveSwingTimer - dt);
        }

        for (let i = st.particles.length - 1; i >= 0; i--) {
          const p = st.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) {
            st.particles.splice(i, 1);
          }
        }

        if (st.virusHp > 0) {
          st.orbSpawnTimer += dt;
          if (st.orbSpawnTimer >= 1.15 && st.steveEntryProgress >= 1) {
            st.orbSpawnTimer = 0;
            const virusX = 82;
            const virusY = 74;
            const toSteveX = st.steveX - virusX;
            const toSteveY = st.steveY - virusY;
            const dist = Math.max(1, Math.hypot(toSteveX, toSteveY));
            const orbSpeed = 19;
            st.orbs.push({
              id: st.nextId++,
              x: virusX,
              y: virusY,
              vx: (toSteveX / dist) * orbSpeed,
              vy: (toSteveY / dist) * orbSpeed,
            });
            soundFX.playLightningDash();
          }

          for (let i = st.orbs.length - 1; i >= 0; i--) {
            const orb = st.orbs[i];
            orb.x += orb.vx * dt;
            orb.y += orb.vy * dt;

            const distToSteve = Math.hypot(orb.x - st.steveX, orb.y - st.steveY);
            if (distToSteve < 5.5) {
              st.orbs.splice(i, 1);
              st.steveHp = Math.max(4, st.steveHp - 2);
              soundFX.playPlayerHurt();
              continue;
            }

            if (orb.x < 0 || orb.x > 100 || orb.y < 0 || orb.y > 100) {
              st.orbs.splice(i, 1);
            }
          }
        } else {
          st.orbs = [];
          st.virusDeadTimer += dt;
          if (st.virusDeadTimer >= 2.1) {
            localStageTime = 0;
            soundFX.playLightningDash();
            setStage('ELYTRA_FLIGHT');
            setStageTime(0);
            return;
          }
        }

        setStevePos({ x: st.steveX, y: st.steveY });
        setSteveFacing(st.steveFacing);
        setSteveHp(st.steveHp);
        setSteveSwingTimer(st.steveSwingTimer);
        setVirusHp(st.virusHp);
        setVirusOrbs([...st.orbs]);
        setParticles([...st.particles]);
        return;
      }

      if (stage === 'ELYTRA_FLIGHT') {
        const st = combatRef.current;
        st.elytraProgress = Math.min(100, st.elytraProgress + dt * 16.5);
        setElytraProgress(st.elytraProgress);
        if (st.elytraProgress >= 100) {
          localStageTime = 0;
          soundFX.playBossSlam();
          soundFX.playCinematicChord(3, true);
          setStage('OPEN_WORLD_LANDING');
          setStageTime(0);
        }
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [stage, rocketLaunched]);

  const handleToggleComponent = (compId: string) => {
    if (virusCrafted) return;
    soundFX.init();
    soundFX.playOrbCollect(4);
    setSelectedComponents((prev) =>
      prev.includes(compId) ? prev : [...prev, compId]
    );
  };

  const handleCraftPrimordialVirus = () => {
    if (selectedComponents.length < 3) return;
    soundFX.init();
    soundFX.playVoidDimensionSeal();
    setVirusCrafted(true);
    setTimeout(() => {
      setStage('ROCKET_LAUNCH');
      setStageTime(0);
    }, 1100);
  };

  const handleLoadAndLaunchRocket = () => {
    soundFX.init();
    if (!rocketLoaded) {
      soundFX.playOrbCollect(7);
      setRocketLoaded(true);
      setTimeout(() => {
        soundFX.playNovaBlast();
        soundFX.playBossRoar();
        setRocketLaunched(true);
      }, 650);
    } else if (!rocketLaunched) {
      soundFX.playNovaBlast();
      setRocketLaunched(true);
    }
  };

  const handleSteveSwordAttack = () => {
    if (stage !== 'STEVE_COMBAT') return;
    const st = combatRef.current;
    if (st.virusHp <= 0) return;

    soundFX.init();
    soundFX.playSwordSwing();
    st.steveSwingTimer = 0.28;
    st.steveFacing = 1;

    for (let i = st.orbs.length - 1; i >= 0; i--) {
      const dOrb = Math.hypot(
        st.orbs[i].x - st.steveX,
        st.orbs[i].y - st.steveY
      );
      if (dOrb < 18) {
        st.orbs.splice(i, 1);
      }
    }

    const distToVirus = Math.hypot(82 - st.steveX, 74 - st.steveY);
    const damage = distToVirus < 32 ? 48 : 28;
    st.virusHp = Math.max(0, st.virusHp - damage);
    soundFX.playEnemyHit(true);

    for (let p = 0; p < (st.virusHp <= 0 ? 36 : 10); p++) {
      const ang = (Math.PI * 2 * p) / (st.virusHp <= 0 ? 36 : 10);
      const spd = 12 + (p % 5) * 9;
      st.particles.push({
        id: st.nextId++,
        x: 82,
        y: 74,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color:
          p % 3 === 0 ? '#f43f5e' : p % 3 === 1 ? '#a855f7' : '#fde047',
        size: st.virusHp <= 0 ? 12 : 7,
        life: st.virusHp <= 0 ? 1.8 : 0.65,
      });
    }

    if (st.virusHp <= 0) {
      soundFX.playNovaBlast();
      soundFX.playOrbCollect(10);
    }
  };

  const handleElytraMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (stage !== 'ELYTRA_FLIGHT') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
    combatRef.current.elytraYaw = nx * 38;
    combatRef.current.elytraPitch = ny * 28;
    setElytraYaw(nx * 38);
    setElytraPitch(ny * 28);
  };

  if (stage === 'OPEN_WORLD_ARRIVAL') {
    return (
      <div className="fixed inset-0 z-[130] bg-[#04020d] text-white font-mono select-none overflow-hidden flex flex-col justify-between">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #060318 0%, #1e1b4b 52%, #064e3b 53%, #022c22 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[47%] opacity-55"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16, 185, 129, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.35) 1px, transparent 1px)',
            backgroundSize: '48px 34px',
            transform: 'perspective(380px) rotateX(62deg) scale(1.5)',
            transformOrigin: 'center top',
          }}
        />

        <div className="relative z-20 pt-6 px-6 flex items-center justify-between">
          <div className="px-4 py-1.5 rounded-full bg-slate-950/85 border border-cyan-400/50 text-cyan-300 text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            PLAINE OPEN-WORLD DU WEB PROFOND • REPAIRE ISOLÉ
          </div>
          <button
            type="button"
            onClick={() => {
              setStage('WORKSHOP_CRAFT');
              setStageTime(0);
            }}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
          >
            Entrer dans l’Atelier Intérieur →
          </button>
        </div>

        <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
          <svg viewBox="0 0 800 380" className="w-[90vw] max-w-4xl h-auto">
            <polygon
              points="40,240 180,120 310,240"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <polygon
              points="490,240 640,105 770,240"
              fill="#1e1b4b"
              stroke="#a855f7"
              strokeWidth="2"
            />

            <rect
              x="270"
              y="165"
              width="170"
              height="95"
              rx="6"
              fill="#090d16"
              stroke="#38bdf8"
              strokeWidth="3"
            />
            <polygon
              points="255,165 355,105 455,165"
              fill="#1e293b"
              stroke="#f43f5e"
              strokeWidth="3"
            />
            <rect
              x="335"
              y="205"
              width="38"
              height="55"
              fill="#020617"
              stroke="#fde047"
              strokeWidth="2"
            />
            <rect
              x="290"
              y="182"
              width="32"
              height="24"
              fill="#0ea5e9"
              opacity="0.75"
            />
            <rect
              x="388"
              y="182"
              width="32"
              height="24"
              fill="#f43f5e"
              opacity="0.75"
            />

            <g transform="translate(545, 110)">
              <rect x="18" y="40" width="28" height="105" rx="12" fill="#e2e8f0" stroke="#38bdf8" strokeWidth="2.5" />
              <polygon points="32,5 14,42 50,42" fill="#f43f5e" />
              <polygon points="18,115 2,145 18,140" fill="#f43f5e" />
              <polygon points="46,115 62,145 46,140" fill="#f43f5e" />
              <circle cx="32" cy="72" r="8" fill="#38bdf8" />
            </g>

            <circle cx="220" cy="245" r="14" fill="#fde047" />
            <circle cx="250" cy="245" r="14" fill="#f43f5e" />
          </svg>

          <div className="bg-slate-950/90 border border-cyan-500/50 rounded-2xl px-6 py-4 text-center max-w-xl">
            <h2 className="text-lg sm:text-xl font-black text-white">
              Les deux avatars atteignent leur maison isolée dans la plaine du Web profond...
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Ouverture de l’atelier souterrain de serveurs et de la table de craft du Virus Primordial.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'WORKSHOP_CRAFT') {
    return (
      <div className="fixed inset-0 z-[130] bg-[#05050a] text-white font-mono select-none overflow-y-auto flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-5xl w-full mx-auto space-y-6 my-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 border border-fuchsia-500/50 rounded-2xl px-5 py-3.5 shadow-2xl">
            <div className="flex items-center gap-3">
              <Wrench className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">
                  REPAIRE DES AVATARS • ATELIER INTÉRIEUR DE SERVEURS
                </div>
                <h1 className="text-base sm:text-xl font-black text-white">
                  TABLE DE CRAFT INTERACTIVE — SYNTHÈSE DU « VIRUS PRIMORDIAL »
                </h1>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold">
              {selectedComponents.length} / 3 Composants Insérés
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Terminal className="w-4 h-4" />
                Écrans Géants &amp; Baies Serveurs
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-[11px] space-y-1.5">
                <div className="text-emerald-400 font-bold">
                  [SERVER_RACK_01] ONLINE • 128 TB RAM
                </div>
                <div className="text-amber-300">
                  [TARGET_SCAN] Nouvel ordinateur détecté (Trajectoire orbitale prête)
                </div>
                <div className="text-rose-400">
                  [OBJECTIF] Combiner Payload Corrompu + Code Racine + Exploit Zéro-Day
                </div>
              </div>
              <div className="flex items-center justify-around py-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300 mx-auto flex items-center justify-center text-amber-300 font-black">
                    C
                  </div>
                  <span className="text-[10px] text-amber-200 mt-1 block">
                    Entité Céleste
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-400 mx-auto flex items-center justify-center text-rose-300 font-black">
                    N
                  </div>
                  <span className="text-[10px] text-rose-300 mt-1 block">
                    Souverain du Néant
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900/95 border-2 border-amber-400/60 rounded-2xl p-5 space-y-5 shadow-[0_0_60px_rgba(251,191,36,0.2)]">
              <div className="text-xs font-bold text-slate-300">
                Cliquez sur les 3 composants ci-dessous pour les combiner sur la Table de Craft :
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CRAFT_COMPONENTS.map((comp) => {
                  const isAdded = selectedComponents.includes(comp.id);
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => handleToggleComponent(comp.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isAdded
                          ? 'bg-emerald-950/70 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${comp.color}25`,
                              color: comp.color,
                            }}
                          >
                            {comp.code}
                          </span>
                          {isAdded && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <div className="text-sm font-black text-white mt-1">
                          {comp.name}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 font-sans">
                          {comp.desc}
                        </p>
                      </div>
                      <div className="mt-3 text-[10px] font-black uppercase tracking-wider text-amber-300">
                        {isAdded ? '✓ INSÉRÉ DANS LA TABLE' : '+ CLIQUER POUR COMBINER'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((slotIdx) => {
                      const compId = selectedComponents[slotIdx];
                      return (
                        <div
                          key={slotIdx}
                          className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xs font-black ${
                            compId
                              ? 'bg-fuchsia-950 border-fuchsia-400 text-fuchsia-200'
                              : 'bg-slate-900 border-slate-700 text-slate-600'
                          }`}
                        >
                          {compId ? '✓' : slotIdx + 1}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-lg font-black text-amber-400">⇒</span>
                  <div
                    className={`px-4 py-2.5 rounded-xl border-2 font-black text-xs ${
                      virusCrafted
                        ? 'bg-rose-600 border-white text-white animate-pulse'
                        : selectedComponents.length === 3
                        ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    VIRUS PRIMORDIAL
                  </div>
                </div>

                <button
                  type="button"
                  disabled={selectedComponents.length < 3 || virusCrafted}
                  onClick={handleCraftPrimordialVirus}
                  className={`px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                    selectedComponents.length === 3 && !virusCrafted
                      ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-fuchsia-500 text-slate-950 shadow-[0_0_30px_rgba(244,63,94,0.6)] cursor-pointer hover:scale-105'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {virusCrafted
                    ? 'Virus Primordial Fabriqué ! Sortie vers la Fusée...'
                    : 'Fabriquer le Virus Primordial'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'ROCKET_LAUNCH') {
    const rocketOffsetY = rocketLaunched ? rocketLaunchTime * 155 : 0;

    return (
      <div className="fixed inset-0 z-[130] bg-[#03010a] text-white font-mono select-none overflow-hidden flex flex-col justify-between p-6">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090418 55%, #020108 100%)',
          }}
        />

        <div className="relative z-20 flex items-center justify-between">
          <div className="px-4 py-1.5 rounded-full bg-rose-950/90 border border-rose-500/60 text-rose-300 text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Rocket className="w-4 h-4 text-rose-400" />
            PAS DE TIR EXTÉRIEUR • EXPÉDITION ORBITALE DU VIRUS PRIMORDIAL
          </div>
        </div>

        <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
          <div className="relative w-72 h-80 flex items-center justify-center">
            <div
              style={{
                transform: `translateY(-${rocketOffsetY}px)`,
              }}
              className="transition-transform duration-75 flex flex-col items-center"
            >
              <svg viewBox="0 0 140 220" className="w-40 h-56 overflow-visible">
                <polygon
                  points="70,10 42,68 98,68"
                  fill="#e11d48"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <rect
                  x="42"
                  y="68"
                  width="56"
                  height="96"
                  rx="10"
                  fill="#f8fafc"
                  stroke="#334155"
                  strokeWidth="3"
                />
                <circle
                  cx="70"
                  cy="108"
                  r="16"
                  fill={rocketLoaded ? '#e11d48' : '#0f172a'}
                  stroke="#38bdf8"
                  strokeWidth="3"
                />
                <polygon points="42,128 16,172 42,162" fill="#e11d48" />
                <polygon points="98,128 124,172 98,162" fill="#e11d48" />
                {rocketLaunched && (
                  <g>
                    <polygon
                      points="52,164 70,235 88,164"
                      fill="#f97316"
                    />
                    <polygon
                      points="58,164 70,215 82,164"
                      fill="#fde047"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>

          <div className="max-w-lg w-full bg-slate-950/90 border-2 border-amber-400/70 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-white">
              {rocketLaunched
                ? 'FUSÉE EN ORBITE DANS LE CIEL NUMÉRIQUE !'
                : 'CHARGEMENT DE L’OGIVE « VIRUS PRIMORDIAL »'}
            </h2>
            <p className="text-xs text-slate-300 font-sans">
              {rocketLaunched
                ? 'Le Virus Primordial quitte l’atmosphère du Web profond et verrouille sa cible...'
                : 'À l’extérieur du repaire, chargez le Virus Primordial dans la fusée spatiale pour l’expédier en orbite.'}
            </p>
            {!rocketLaunched && (
              <button
                type="button"
                onClick={handleLoadAndLaunchRocket}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider cursor-pointer shadow-[0_0_35px_rgba(244,63,94,0.6)]"
              >
                🚀 Charger le Virus &amp; Expédier la Fusée en Orbite
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'TYPEWRITER_6_MONTHS') {
    return (
      <div className="fixed inset-0 z-[140] bg-black text-emerald-400 font-mono flex flex-col items-center justify-center p-8 select-none">
        <div className="text-2xl sm:text-4xl font-black tracking-[0.2em] text-center">
          {typewriterText}
          <span className="inline-block w-3 h-7 bg-emerald-400 ml-1 animate-ping align-middle" />
        </div>
      </div>
    );
  }

  if (stage === 'NEW_PC_STRIKE' || stage === 'STEVE_COMBAT') {
    const isMeteorFalling =
      stage === 'NEW_PC_STRIKE' && stageTime >= 0.5 && stageTime < 1.5;
    const isCornerShattered =
      stage === 'STEVE_COMBAT' || (stage === 'NEW_PC_STRIKE' && stageTime >= 1.45);
    const meteorProgress = isMeteorFalling ? (stageTime - 0.5) / 1.0 : 1;

    return (
      <div
        onMouseDown={handleSteveSwordAttack}
        className="fixed inset-0 z-[130] select-none overflow-hidden font-sans flex flex-col justify-between"
        style={{
          background:
            'linear-gradient(135deg, #0284c7 0%, #2563eb 45%, #1e1b4b 100%)',
        }}
      >
        <div className="relative z-20 m-4 px-5 py-3 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/20 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">
                NOUVEL ORDINATEUR (WINDOWS 11 PRO) • 6 MOIS PLUS TARD
              </div>
              <div className="text-xs sm:text-sm font-black">
                {stage === 'NEW_PC_STRIKE'
                  ? isCornerShattered
                    ? 'ALERTE : L’icône Wi-Fi a explosé ! Le Virus Primordial sort du coin brisé !'
                    : 'Système propre et opérationnel...'
                  : 'INTERVENTION MINECRAFT : Déplacez Steve (ZQSD/WASD) + Clic Gauche (Épée en Netherite) !'}
              </div>
            </div>
          </div>

          {stage === 'STEVE_COMBAT' && (
            <div className="flex items-center gap-4">
              <div className="text-xs font-mono font-bold text-amber-300">
                PV STEVE (NETHERITE) : {'❤️'.repeat(Math.max(1, Math.ceil(steveHp / 4)))}
              </div>
              <div className="w-44 bg-slate-900 rounded-full h-3.5 border border-rose-500 overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-fuchsia-500 rounded-full transition-all"
                  style={{ width: `${(virusHp / virusMaxHp) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono font-black text-rose-300">
                VIRUS : {virusHp} PV
              </span>
            </div>
          )}
        </div>

        <div className="relative flex-1 w-full overflow-hidden">
          {isMeteorFalling && (
            <svg
              viewBox="0 0 1000 600"
              className="fixed inset-0 w-full h-full z-40 pointer-events-none"
            >
              <line
                x1="240"
                y1="0"
                x2={240 + meteorProgress * 710}
                y2={meteorProgress * 575}
                stroke="#ef4444"
                strokeWidth="10"
              />
              <circle
                cx={240 + meteorProgress * 710}
                cy={meteorProgress * 575}
                r="18"
                fill="#fde047"
              />
            </svg>
          )}

          {isCornerShattered && (
            <div className="absolute right-0 bottom-0 w-[360px] sm:w-[430px] h-[300px] sm:h-[340px] z-30 pointer-events-none">
              <svg viewBox="0 0 400 320" className="w-full h-full">
                <polygon
                  points="140,320 210,175 290,120 400,65 400,320"
                  fill="#030008"
                  stroke="#f43f5e"
                  strokeWidth="4"
                />
                <g stroke="#e2e8f0" strokeWidth="2.5" fill="none">
                  <path d="M210 175 L120 130 L50 140" />
                  <path d="M290 120 L240 40 L190 10" />
                  <path d="M140 320 L70 265 L10 280" />
                  <path d="M210 175 L290 245 L385 210" />
                </g>
              </svg>

              {virusHp > 0 && (
                <div className="absolute right-10 bottom-14 flex flex-col items-center">
                  <div className="mb-1 px-2.5 py-0.5 rounded bg-rose-950 border border-rose-500 text-[10px] font-mono font-black text-rose-300">
                    VIRUS PRIMORDIAL ({virusHp}/{virusMaxHp} PV)
                  </div>
                  <svg
                    viewBox="0 0 120 120"
                    className="w-28 h-28 animate-spin drop-shadow-[0_0_25px_rgba(244,63,94,0.95)]"
                  >
                    <polygon
                      points="60,6 76,40 114,44 84,70 94,108 60,88 26,108 36,70 6,44 44,40"
                      fill="#090214"
                      stroke="#f43f5e"
                      strokeWidth="4"
                    />
                    <polygon
                      points="60,22 98,60 60,98 22,60"
                      fill="#e11d48"
                      stroke="#fde047"
                      strokeWidth="2.5"
                    />
                    <circle cx="60" cy="60" r="10" fill="#ffffff" />
                  </svg>
                </div>
              )}
            </div>
          )}

          {stage === 'NEW_PC_STRIKE' && isCornerShattered && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-6">
              <div className="max-w-lg w-full bg-slate-950/95 border-2 border-emerald-400 rounded-3xl p-6 text-center shadow-[0_0_80px_rgba(16,185,129,0.5)] space-y-4">
                <div className="text-xs font-mono font-black uppercase tracking-widest text-amber-300">
                  TROU BÉANT DÉTECTÉ • LE VIRUS ATTAQUE LE NOUVEAU PC !
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Pressez « Alt + Tab » ou cliquez ci-dessous pour basculer sur Minecraft !
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.init();
                    soundFX.playOrbCollect(8);
                    setStage('STEVE_COMBAT');
                    setStageTime(0);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider cursor-pointer shadow-lg"
                >
                  ⛏️ [ALT + TAB] Ouvrir Minecraft &amp; Déployer Steve (Netherite)
                </button>
              </div>
            </div>
          )}

          {stage === 'STEVE_COMBAT' && (
            <>
              <div className="absolute left-8 top-6 z-20 w-80 sm:w-96 rounded-xl bg-slate-900/95 border-2 border-emerald-500/70 shadow-2xl overflow-hidden pointer-events-none">
                <div className="bg-emerald-800 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono font-black text-white">
                  <span>⛏️ Minecraft 1.21.4 — Bastion Netherite</span>
                  <span>[_][□][X]</span>
                </div>
                <div className="p-3 bg-gradient-to-b from-sky-900 to-emerald-950 text-[11px] text-emerald-200 font-mono">
                  Steve (Armure &amp; Épée en Netherite) est sorti de la fenêtre Minecraft pour défendre votre Bureau !
                </div>
              </div>

              {virusOrbs.map((orb) => (
                <div
                  key={orb.id}
                  style={{
                    left: `${orb.x}%`,
                    top: `${orb.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-30 w-6 h-6 rounded-full bg-rose-500 border-2 border-yellow-300 shadow-[0_0_20px_rgba(244,63,94,1)] pointer-events-none"
                />
              ))}

              {particles.map((pt) => (
                <div
                  key={pt.id}
                  style={{
                    left: `${pt.x}%`,
                    top: `${pt.y}%`,
                    width: `${pt.size}px`,
                    height: `${pt.size}px`,
                    backgroundColor: pt.color,
                  }}
                  className="absolute z-40 rounded-sm pointer-events-none"
                />
              ))}

              <div
                style={{
                  left: `${stevePos.x}%`,
                  top: `${stevePos.y}%`,
                  transform: `translate(-50%, -50%) scale(${
                    0.75 + steveEntryProgress * 0.25
                  })`,
                }}
                className="absolute z-40 pointer-events-none flex flex-col items-center"
              >
                <div className="mb-1 px-2 py-0.5 rounded bg-slate-950/90 border border-purple-400 text-[10px] font-mono font-black text-purple-200 whitespace-nowrap">
                  {virusHp <= 0
                    ? '🪽 ÉLYTRES DÉPLOYÉES ! PLONGEON DANS LA BRÈCHE !'
                    : 'Steve [Armure Netherite] (ZQSD + Clic Gauche)'}
                </div>
                <svg
                  viewBox="0 0 110 120"
                  className="w-28 h-28 overflow-visible drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
                  style={{ transform: `scaleX(${steveFacing})` }}
                >
                  {virusHp <= 0 && (
                    <polygon
                      points="32,38 6,88 42,78"
                      fill="#94a3b8"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                    />
                  )}
                  <rect
                    x="38"
                    y="72"
                    width="12"
                    height="32"
                    fill="#1e1b24"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  <rect
                    x="52"
                    y="72"
                    width="12"
                    height="32"
                    fill="#1e1b24"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  <rect
                    x="34"
                    y="38"
                    width="34"
                    height="34"
                    fill="#27272a"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="36"
                    y="12"
                    width="30"
                    height="26"
                    fill="#3f3f46"
                    stroke="#cbd5e1"
                    strokeWidth="2.5"
                  />
                  <rect x="44" y="21" width="18" height="5" fill="#38bdf8" />
                  <g
                    transform={`rotate(${
                      steveSwingTimer > 0 ? 68 : -15
                    } 68 48)`}
                  >
                    <rect
                      x="68"
                      y="8"
                      width="9"
                      height="46"
                      fill="#18181b"
                      stroke="#c084fc"
                      strokeWidth="2.5"
                    />
                  </g>
                </svg>
              </div>
            </>
          )}
        </div>

        <div className="relative z-40 h-12 w-full bg-slate-950/95 border-t border-white/15 px-4 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-sky-500/20 border border-sky-400/40 font-bold text-sky-300">
              Démarrer
            </span>
            <button
              type="button"
              onClick={() => {
                if (stage === 'NEW_PC_STRIKE') {
                  soundFX.init();
                  soundFX.playOrbCollect(8);
                  setStage('STEVE_COMBAT');
                  setStageTime(0);
                }
              }}
              className="px-3 py-1 rounded bg-emerald-600/30 border border-emerald-400 text-emerald-200 font-black flex items-center gap-1.5 cursor-pointer"
            >
              <span>⛏️ Minecraft (Alt+Tab)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 font-mono text-[11px] ${
                isCornerShattered
                  ? 'bg-rose-950 border border-rose-500 text-rose-300 animate-pulse'
                  : 'text-slate-300'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              {isCornerShattered ? 'ETH_BRISÉ' : 'Wi-Fi 6E'}
            </span>
            <Volume2 className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'ELYTRA_FLIGHT') {
    const isInOpenWorldSky = elytraProgress >= 52;

    return (
      <div
        onMouseMove={handleElytraMouseMove}
        className="fixed inset-0 z-[135] select-none overflow-hidden font-mono text-white flex flex-col justify-between"
        style={{
          background: isInOpenWorldSky
            ? 'linear-gradient(180deg, #090418 0%, #1e1b4b 48%, #064e3b 52%, #022c22 100%)'
            : 'radial-gradient(circle at 75% 75%, #f43f5e 0%, #3b0764 38%, #020617 85%)',
        }}
      >
        <div className="relative z-20 p-5 flex items-center justify-between">
          <div className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-cyan-400/50 text-xs font-black uppercase tracking-wider text-cyan-300">
            {isInOpenWorldSky
              ? 'VOL EN ÉLYTRES • DESCENTE PLANÉE VERS L’OPEN-WORLD DES AVATARS'
              : 'VOL EN ÉLYTRES • PLONGEON DANS LE TROU BÉANT DE L’ÉCRAN BRISÉ'}
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-950/90 border border-amber-400/50 text-xs font-bold text-amber-300">
            Souris — Pitch : {elytraPitch.toFixed(0)}° | Yaw : {elytraYaw.toFixed(0)}° | Progression : {Math.round(elytraProgress)}%
          </div>
        </div>

        <div className="relative flex-1 flex items-center justify-center">
          <div
            style={{
              transform: `translate(${elytraYaw * 4.5}px, ${
                elytraPitch * 3.5
              }px) rotate(${elytraYaw * 0.6}deg)`,
            }}
            className="transition-transform duration-75 flex flex-col items-center"
          >
            <svg
              viewBox="0 0 180 140"
              className="w-56 h-44 drop-shadow-[0_0_35px_rgba(56,189,248,0.85)]"
            >
              <polygon
                points="90,28 18,95 76,82"
                fill="#64748b"
                stroke="#38bdf8"
                strokeWidth="3"
              />
              <polygon
                points="90,28 162,95 104,82"
                fill="#64748b"
                stroke="#38bdf8"
                strokeWidth="3"
              />
              <rect
                x="76"
                y="32"
                width="28"
                height="52"
                fill="#1e1b24"
                stroke="#a855f7"
                strokeWidth="2.5"
              />
              <rect
                x="78"
                y="12"
                width="24"
                height="20"
                fill="#3f3f46"
                stroke="#f8fafc"
                strokeWidth="2"
              />
            </svg>
            <span className="mt-2 px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-400 text-xs font-black text-cyan-200">
              Steve en Élytres (Contrôle 3ème Personne à la Souris)
            </span>
          </div>
        </div>

        <div className="relative z-20 p-5 text-center text-xs text-slate-300 bg-slate-950/80 border-t border-white/10">
          Déplacez la souris pour orienter l’angle de piqué (Pitch/Yaw) à travers la brèche dimensionnelle !
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[140] bg-[#04020e] text-white font-mono select-none overflow-hidden flex flex-col justify-between p-6 sm:p-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #090418 0%, #1e1b4b 50%, #064e3b 51%, #022c22 100%)',
        }}
      />

      <div className="relative z-20 flex items-center justify-between">
        <div className="px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-black uppercase tracking-widest">
          ATTERRISSAGE EN ÉLYTRES RÉUSSI • OPEN-WORLD DES DEUX AVATARS
        </div>
      </div>

      <div className="relative z-20 my-auto max-w-3xl w-full mx-auto bg-slate-950/92 border-2 border-emerald-400 rounded-3xl p-8 text-center shadow-[0_0_100px_rgba(16,185,129,0.5)] space-y-5">
        <div className="flex items-center justify-center gap-8">
          <div className="px-4 py-2 rounded-2xl bg-purple-950/90 border border-purple-400 text-xs font-black text-purple-200">
            ⛏️ Steve (Full Netherite &amp; Élytres)
          </div>
          <Swords className="w-8 h-8 text-amber-400" />
          <div className="px-4 py-2 rounded-2xl bg-rose-950/90 border border-rose-400 text-xs font-black text-rose-200">
            ⚡ Entité Céleste &amp; Souverain du Néant
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wide">
          STEVE A ATTERRI DANS L’OPEN-WORLD DES AVATARS !
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
          Après avoir pulvérisé le Virus Primordial sur le nouveau bureau Windows et plongé en Élytres à travers le coin brisé de l’écran, Steve atterrit directement devant le repaire des deux avatars dans le Web profond !
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <button
            type="button"
            onClick={onReturnToMainMenu}
            className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Home className="w-4 h-4" />
            Retour au Menu Principal
          </button>
          <button
            type="button"
            onClick={onRestartFullMiniGame}
            className="px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Rejouer depuis l’Invasion du Bureau
          </button>
        </div>
      </div>

      <div className="relative z-20 text-center text-[11px] text-emerald-300/80">
        ÉPILOGUE INTERACTIF COMPLET • AETHERIAL HORIZONS × MINECRAFT NETHERITE
      </div>
    </div>
  );
};
