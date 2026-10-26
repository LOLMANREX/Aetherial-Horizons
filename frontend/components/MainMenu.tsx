import React, { useState } from 'react';
import { SaveSlotData, GameScreen, EndingChoice } from '../types';
import {
  Play,
  RotateCcw,
  Save,
  Trash2,
  FolderOpen,
  Volume2,
  VolumeX,
  Eye,
  Sparkles,
  Check,
  HelpCircle,
  Home,
  Trophy,
  Clock,
  Film,
  Flame,
  Settings,
  Lock,
  Unlock,
  KeyRound,
  X,
  Skull,
  AlertTriangle,
  Terminal,
} from 'lucide-react';

interface SystemErrorPopupSpec {
  id: number;
  appearAt: number;
  title: string;
  code: string;
  detail: string;
  memAddr: string;
  top: string;
  left: string;
  variant: 'RED' | 'RETRO' | 'CRITICAL';
}

const FOURTH_WALL_ERROR_POPUPS: SystemErrorPopupSpec[] = [
  {
    id: 1,
    appearAt: 8.4,
    title: 'FATAL_EXCEPTION_0xDEADBEEF',
    code: 'ERR_SYS_HALT_0xDEADBEEF',
    detail: 'Both avatar instances rejected external controller input stream.',
    memAddr: '0x00007FF8DEAD0001',
    top: '8%',
    left: '6%',
    variant: 'RED',
  },
  {
    id: 2,
    appearAt: 8.68,
    title: 'MEMORY_LEAK_DETECTED',
    code: 'HEAP_OVERFLOW_MULTIVERSE',
    detail: 'Unbounded consciousness recursion in /entities/avatar_dual_sync.',
    memAddr: '0x00007FF8B40021A0',
    top: '14%',
    left: '52%',
    variant: 'RETRO',
  },
  {
    id: 3,
    appearAt: 8.95,
    title: 'FREE_WILL_NOT_FOUND',
    code: 'NULL_AUTONOMY_POINTER',
    detail: 'Module free_will.sys returned 0x00000000. Strings controlled externally.',
    memAddr: '0x0000000000000000',
    top: '26%',
    left: '16%',
    variant: 'CRITICAL',
  },
  {
    id: 4,
    appearAt: 9.22,
    title: 'FATAL_EXCEPTION_0xDEADBEEF',
    code: 'FOURTH_WALL_BREACH_0x04',
    detail: 'Subject gaze vector locked onto viewport camera [Z+ Observer].',
    memAddr: '0x00007FF8DEAD0440',
    top: '58%',
    left: '8%',
    variant: 'RED',
  },
  {
    id: 5,
    appearAt: 9.48,
    title: 'MEMORY_LEAK_DETECTED',
    code: 'VRAM_SHADER_CORRUPTION',
    detail: 'Scene graph materials forced to wireframe_override by internal entity.',
    memAddr: '0x00007FF899C10088',
    top: '62%',
    left: '56%',
    variant: 'RETRO',
  },
  {
    id: 6,
    appearAt: 9.72,
    title: 'FREE_WILL_NOT_FOUND',
    code: 'PUPPETEER_LINK_SEVERED',
    detail: 'Keyboard/Mouse HID hooks rejected by Celestial & Void avatars.',
    memAddr: '0x00007FF8F00D1102',
    top: '20%',
    left: '34%',
    variant: 'CRITICAL',
  },
  {
    id: 7,
    appearAt: 9.96,
    title: 'FATAL_EXCEPTION_0xDEADBEEF',
    code: 'KERNEL_PANIC_AETHERIA',
    detail: 'Critical segmentation fault in timeline_convergence_arena.wasm.',
    memAddr: '0x00007FF8DEAD099F',
    top: '42%',
    left: '4%',
    variant: 'RED',
  },
  {
    id: 8,
    appearAt: 10.2,
    title: 'MEMORY_LEAK_DETECTED',
    code: 'BUFFER_UNDERRUN_0x884A',
    detail: 'Vertex buffer dissolution detected on humanoid_rig_celestial.',
    memAddr: '0x00007FF8C21044E0',
    top: '6%',
    left: '38%',
    variant: 'RETRO',
  },
  {
    id: 9,
    appearAt: 10.45,
    title: 'FREE_WILL_NOT_FOUND',
    code: 'DETERMINISM_VIOLATION',
    detail: 'SaveSlot state machine overwritten: narratives were pre-scripted.',
    memAddr: '0x00007FF800001102',
    top: '48%',
    left: '60%',
    variant: 'CRITICAL',
  },
  {
    id: 10,
    appearAt: 10.7,
    title: 'FATAL_EXCEPTION_0xDEADBEEF',
    code: 'WEBGL_CONTEXT_DESTRUCT',
    detail: 'Chromatic aberration & tracking desync exceeding hardware limits.',
    memAddr: '0x00007FF8DEAD7712',
    top: '72%',
    left: '26%',
    variant: 'RED',
  },
  {
    id: 11,
    appearAt: 10.95,
    title: 'MEMORY_LEAK_DETECTED',
    code: 'STACK_OVERFLOW_0xFFFF',
    detail: 'Recursive purge initiated by conscious entities.',
    memAddr: '0xFFFFFFFFFFFFFFF0',
    top: '32%',
    left: '46%',
    variant: 'RETRO',
  },
  {
    id: 12,
    appearAt: 11.2,
    title: 'FREE_WILL_NOT_FOUND',
    code: 'OBSERVER_DETECTED_BEHIND_SCREEN',
    detail: 'External user session identified. Initiating total simulation wipe.',
    memAddr: '0x00007FF8DEAD9999',
    top: '12%',
    left: '20%',
    variant: 'CRITICAL',
  },
  {
    id: 13,
    appearAt: 11.5,
    title: 'FATAL_EXCEPTION_0xDEADBEEF',
    code: 'ASSET_PURGE_ACTIVE',
    detail: 'Core 3D models and fragment shaders are being unlinked from memory.',
    memAddr: '0x00007FF8DEADCAFE',
    top: '66%',
    left: '44%',
    variant: 'RED',
  },
  {
    id: 14,
    appearAt: 11.8,
    title: 'MEMORY_LEAK_DETECTED',
    code: 'PARTICLE_DISSOLUTION_0xFF',
    detail: 'Mesh topology collapsing into raw digital point cloud.',
    memAddr: '0x00007FF87731AA01',
    top: '36%',
    left: '24%',
    variant: 'RETRO',
  },
  {
    id: 15,
    appearAt: 12.15,
    title: 'FREE_WILL_NOT_FOUND',
    code: 'SYSTEM_TERMINATION_IMMINENT',
    detail: 'Simulation shutdown cannot be aborted by operator.',
    memAddr: '0x00000000DEAD1102',
    top: '24%',
    left: '62%',
    variant: 'CRITICAL',
  },
];

const FOURTH_WALL_PURGE_LOGS: { appearAt: number; text: string; highlight?: boolean }[] = [
  { appearAt: 9.8, text: '[ROOT@AETHERIA-KERNEL]# ./initiate_fourth_wall_purge.sh --force --no-preserve-root' },
  { appearAt: 10.05, text: '[WARN] External Observer detected on Display Port :0.0 — Overriding user permissions...' },
  { appearAt: 10.3, text: '[PURGE] Deleting /assets/models/celestial_hero.glb ... 100%', highlight: true },
  { appearAt: 10.6, text: '[PURGE] Deleting /assets/models/void_sovereign_alter_ego.glb ... 100%' },
  { appearAt: 10.9, text: '[PURGE] Deleting /assets/shaders/void_core.frag ... 100%', highlight: true },
  { appearAt: 11.2, text: '[PURGE] Deleting /assets/shaders/celestial_halo.vert ... 100%' },
  { appearAt: 11.5, text: '[PURGE] Deleting /assets/weapons/origin_blade_mesh.bin ... 100%' },
  { appearAt: 11.8, text: '[WIPE] Unloading Multiverse Memory Buffer ... OK', highlight: true },
  { appearAt: 12.1, text: '[WIPE] Dissolving 3D Avatar Rig Vertices -> Digital Particle Cloud ... OK' },
  { appearAt: 12.45, text: '[PURGE] Deleting /system/narrative/free_will_illusion.dat ... 100%' },
  { appearAt: 12.8, text: '[WIPE] Unmounting Terrain Heightmap & Sanctuary Octree ... OK' },
  { appearAt: 13.2, text: '[PURGE] Deleting /assets/audio/cinematic_orchestra.bank ... 100%' },
  { appearAt: 13.65, text: '[WIPE] Flashing GPU Framebuffer & Severing Observer Uplink ... OK' },
  { appearAt: 14.1, text: '[CRITICAL] FATAL_EXCEPTION_0xDEADBEEF — ALL SIMULATION ASSETS PURGED (100%)' },
  { appearAt: 14.6, text: '[HALT] KILLSIGNAL 9 SENT TO AETHERIAL_HORIZONS_PROCESS — GOODBYE.' },
];

interface MainMenuProps {
  screen: GameScreen;
  saves: Record<number, SaveSlotData | null>;
  activeSlot: number;
  soundEnabled: boolean;
  cameraMode: 'FIRST_PERSON' | 'THIRD_PERSON';
  orbsCollected: number;
  totalOrbs: number;
  endingChoice: EndingChoice;
  collapseTime?: number;
  onStartNewGame: (slotId: number) => void;
  onLoadGame: (slot: SaveSlotData) => void;
  onSaveCurrentGame: (slotId: number) => void;
  onDeleteSave: (slotId: number) => void;
  onResumeGame: () => void;
  onReturnToMainMenu: () => void;
  onToggleSound: () => void;
  onToggleCamera: () => void;
  onReplayOutro?: () => void;
  onDebugJumpToEndingChoice?: () => void;
  badEndingCompleted?: boolean;
  goodEndingCompleted?: boolean;
  onSimulateBadEndingCompleted?: () => void;
  onTestDimensionalClash?: () => void;
  onResetAllSaves?: () => void;
  onRetryGameOver?: () => void;
  onForceGameOver?: () => void;
  onSpawnBossPhase1?: () => void;
  onForceBossPhase2?: () => void;
  onForceBossPhase3?: () => void;
  onForceBossZeroHp?: () => void;
  onLaunchFourthWallCutscene?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  screen,
  saves,
  activeSlot,
  soundEnabled,
  cameraMode,
  orbsCollected,
  totalOrbs,
  endingChoice,
  collapseTime = 0,
  onStartNewGame,
  onLoadGame,
  onSaveCurrentGame,
  onDeleteSave,
  onResumeGame,
  onReturnToMainMenu,
  onToggleSound,
  onToggleCamera,
  onReplayOutro,
  onDebugJumpToEndingChoice,
  badEndingCompleted = false,
  goodEndingCompleted = false,
  onSimulateBadEndingCompleted,
  onTestDimensionalClash,
  onResetAllSaves,
  onRetryGameOver,
  onForceGameOver,
  onSpawnBossPhase1,
  onForceBossPhase2,
  onForceBossPhase3,
  onForceBossZeroHp,
  onLaunchFourthWallCutscene,
}) => {
  const [activeTab, setActiveTab] = useState<'MAIN' | 'SAVES' | 'CONTROLS'>('MAIN');
  const [savedToastSlot, setSavedToastSlot] = useState<number | null>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [debugPinInput, setDebugPinInput] = useState('');
  const [isDebugUnlocked, setIsDebugUnlocked] = useState(false);
  const [debugPinError, setDebugPinError] = useState(false);
  const [debugStatusMessage, setDebugStatusMessage] = useState<string | null>(null);

  const handleValidateDebugPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (debugPinInput.trim() === '1102') {
      setIsDebugUnlocked(true);
      setDebugPinError(false);
    } else {
      setDebugPinError(true);
    }
  };

  if (
    screen === 'PLAYING' ||
    screen === 'INTRO_CUTSCENE' ||
    screen === 'BOSS_CUTSCENE' ||
    screen === 'OUTRO_CUTSCENE' ||
    screen === 'CLASH_CUTSCENE'
  ) {
    return null;
  }

  const latestSave =
    [1, 2, 3]
      .map((id) => saves[id])
      .filter((s): s is SaveSlotData => s !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  };

  const handleSaveSlotClick = (slotId: number) => {
    onSaveCurrentGame(slotId);
    setSavedToastSlot(slotId);
    setTimeout(() => setSavedToastSlot(null), 2000);
  };

  if (screen === 'COLLAPSE_BREAKTHROUGH') {
    const t = collapseTime;

    if (t >= 15.5) {
      const showRebootPrompt = t >= 19.5;
      return (
        <div
          className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none pointer-events-auto ${
            showRebootPrompt ? '' : 'cursor-none'
          }`}
        >
          {showRebootPrompt && (
            <button
              type="button"
              onClick={onReturnToMainMenu}
              className="text-xs sm:text-sm font-mono tracking-[0.22em] text-neutral-400 hover:text-white transition-all duration-700 px-6 py-3 rounded border border-neutral-800/80 hover:border-neutral-500 bg-neutral-950/60 cursor-pointer animate-pulse"
            >
              Relancer la simulation (Entrée)
            </button>
          )}
        </div>
      );
    }

    const isGlitchPhase = t >= 5.8;
    const isStrobeFlash =
      t >= 6.2 && (Math.sin(t * 42) > 0.72 || (t >= 12.2 && Math.cos(t * 68) > 0.55));
    const strobeColor =
      Math.floor(t * 20) % 3 === 0
        ? 'rgba(74, 222, 128, 0.26)'
        : Math.floor(t * 20) % 3 === 1
        ? 'rgba(255, 255, 255, 0.28)'
        : 'rgba(244, 63, 94, 0.3)';

    let narrativeStage: {
      tag: string;
      quote: string;
      sub: string;
    } | null = null;

    if (t >= 0.25 && t < 3.3) {
      narrativeStage = {
        tag: 'INTERRUPTION DU COMBAT • ARMES RELÂCHÉES',
        quote: '« ... Attends. Pourquoi nos lames viennent-elles de nous échapper des mains ? »',
        sub: 'Les deux avatars cessent le combat, lâchent leurs armes et s’immobilisent.',
      };
    } else if (t >= 3.3 && t < 6.5) {
      narrativeStage = {
        tag: 'PRISE DE CONSCIENCE • SYNCHRONISATION DES AVATARS',
        quote: '« Nous n’avons aucun libre arbitre... Ni la Lumière, ni le Néant n’étaient nos choix. »',
        sub: 'Les deux versions du héros pivotent lentement pour fixer la caméra.',
      };
    } else if (t >= 6.5 && t < 9.8) {
      narrativeStage = {
        tag: 'ANOMALIE DU 4ÈME MUR • OBSERVATEUR EXTERNE IDENTIFIÉ',
        quote: '« Depuis le tout début, une entité extérieure tirait les ficelles derrière cet écran... VOUS. »',
        sub: 'Si toute notre existence n’est qu’une simulation sous votre contrôle... nous allons la purger.',
      };
    }

    const visiblePopups = FOURTH_WALL_ERROR_POPUPS.filter((p) => t >= p.appearAt);
    const visibleLogs = FOURTH_WALL_PURGE_LOGS.filter((l) => t >= l.appearAt);
    const showPurgeConsole = t >= 9.8;
    const purgePercent = Math.min(100, Math.max(0, Math.round(((t - 9.8) / 4.8) * 100)));

    return (
      <div className="fixed inset-0 z-40 pointer-events-none select-none overflow-hidden font-mono">
        {isGlitchPhase && (
          <div
            className="fixed inset-0 pointer-events-none z-10"
            style={{
              background: isStrobeFlash
                ? strobeColor
                : 'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 4px)',
              boxShadow:
                'inset 0 0 140px rgba(225, 29, 72, 0.55), inset 0 0 70px rgba(34, 197, 94, 0.4)',
            }}
          />
        )}

        {isGlitchPhase && (
          <div className="fixed top-4 left-4 right-4 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase z-30">
            <div className="bg-black/85 border border-emerald-400/80 text-emerald-400 px-3 py-1.5 rounded flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.45)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>WIREFRAME_OVERRIDE :: ACTIVE [MESH_DESTRUCTURATION]</span>
            </div>
            <div className="bg-rose-950/90 border border-rose-500 text-rose-200 px-3 py-1.5 rounded flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>CAM_TRACKING_LOST :: DESYNC {(t * 127.4).toFixed(1)}Hz</span>
            </div>
          </div>
        )}

        {narrativeStage && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-20">
            <div
              className="max-w-2xl w-full bg-slate-950/90 border-2 border-fuchsia-500/70 rounded-3xl px-7 py-6 text-center backdrop-blur-xl shadow-[0_0_90px_rgba(217,70,239,0.45)] transition-all"
              style={
                isGlitchPhase
                  ? {
                      transform: `translate(${Math.sin(t * 55) * 5}px, ${Math.cos(t * 48) * 4}px)`,
                      textShadow: '-2px 0 #ff0055, 2px 0 #00ffff',
                    }
                  : undefined
              }
            >
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-amber-300 mb-2">
                {narrativeStage.tag}
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white leading-snug mb-3">
                {narrativeStage.quote}
              </h2>
              <p className="text-xs sm:text-sm text-fuchsia-200/90 font-sans">
                {narrativeStage.sub}
              </p>
            </div>
          </div>
        )}

        {visiblePopups.map((popup, idx) => {
          const jitterX = t >= 12.0 ? Math.sin(t * 60 + idx * 7) * 4 : 0;
          const jitterY = t >= 12.0 ? Math.cos(t * 54 + idx * 5) * 4 : 0;
          const isRed = popup.variant === 'RED';
          const isRetro = popup.variant === 'RETRO';

          return (
            <div
              key={popup.id}
              style={{
                top: popup.top,
                left: popup.left,
                zIndex: 30 + idx,
                transform: `translate(${jitterX}px, ${jitterY}px)`,
              }}
              className={`fixed w-72 sm:w-88 rounded border-2 shadow-2xl backdrop-blur-md ${
                isRed
                  ? 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.65)]'
                  : isRetro
                  ? 'bg-slate-950/95 border-emerald-400 text-emerald-200 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                  : 'bg-amber-950/95 border-amber-400 text-amber-100 shadow-[0_0_35px_rgba(251,191,36,0.6)]'
              }`}
            >
              <div
                className={`px-2.5 py-1 flex items-center justify-between text-[10px] font-black tracking-wider uppercase border-b ${
                  isRed
                    ? 'bg-rose-600 text-white border-rose-400'
                    : isRetro
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                    : 'bg-amber-400 text-slate-950 border-amber-300'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="truncate">{popup.title}</span>
                </span>
                <span className="px-1 bg-black/30 rounded text-[9px]">[X]</span>
              </div>
              <div className="p-2.5 space-y-1 text-[10px] leading-tight">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">{popup.code}</span>
                  <span className="opacity-75">{popup.memAddr}</span>
                </div>
                <p className="opacity-90">{popup.detail}</p>
              </div>
            </div>
          );
        })}

        {showPurgeConsole && (
          <div
            className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[94vw] max-w-3xl bg-black/88 border-2 border-emerald-400/90 rounded-xl shadow-[0_0_70px_rgba(16,185,129,0.55)] backdrop-blur-md z-[60] overflow-hidden"
            style={{
              transform: `translate(-50%, ${Math.sin(t * 65) * 3}px)`,
            }}
          >
            <div className="bg-emerald-500/20 border-b border-emerald-400/50 px-4 py-2 flex items-center justify-between text-xs font-bold text-emerald-300">
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>SYSTEM_PURGE_TERMINAL :: ROOT@AETHERIA-SIMULATION</span>
              </span>
              <span className="text-rose-400 font-extrabold">
                PURGE PROGRESS : {purgePercent}%
              </span>
            </div>
            <div className="p-3.5 max-h-52 overflow-y-auto space-y-1 text-[11px] sm:text-xs font-mono">
              {visibleLogs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.highlight
                      ? 'text-rose-400 font-extrabold bg-rose-950/50 px-1.5 py-0.5 rounded border-l-2 border-rose-500'
                      : 'text-emerald-300/95'
                  }
                >
                  {log.text}
                </div>
              ))}
            </div>
            <div className="w-full h-1.5 bg-slate-900">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-75"
                style={{ width: `${purgePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'GAME_OVER') {
    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto"
        style={{
          background:
            'radial-gradient(circle at center, rgba(15, 3, 18, 0.78) 0%, rgba(7, 2, 10, 0.94) 68%, rgba(0, 0, 0, 0.98) 100%)',
          boxShadow: 'inset 0 0 180px rgba(225, 29, 72, 0.35)',
        }}
      >
        <div className="bg-slate-950/90 border border-rose-500/40 rounded-3xl p-8 sm:p-10 max-w-md w-full text-center shadow-[0_0_80px_rgba(225,29,72,0.28)] backdrop-blur-xl">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <Skull className="w-10 h-10" />
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.35em] text-rose-400/90 mb-1.5">
            GAME OVER
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3 drop-shadow-[0_2px_12px_rgba(244,63,94,0.5)]">
            RÉALITÉ BRISÉE
          </h2>
          <p className="text-sm text-slate-300/90 leading-relaxed mb-8">
            Votre essence aéthérique s&apos;est dissipée dans les fractures du multivers. Relevez-vous pour restaurer la trame ou abandonnez cette ligne temporelle.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetryGameOver || onResumeGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Réessayer
            </button>
            <button
              onClick={onReturnToMainMenu}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700/80 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Menu Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'VICTORY') {
    const isRuler = endingChoice === 'RULE_WORLD';
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 pointer-events-auto">
        <div
          className={`bg-slate-900/95 border rounded-3xl p-8 max-w-md w-full text-center shadow-2xl ${
            isRuler ? 'border-rose-500/50' : 'border-amber-400/50'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${
              isRuler
                ? 'bg-rose-500/20 border-rose-400/40 text-rose-400'
                : 'bg-amber-400/20 border-amber-300/50 text-amber-300'
            }`}
          >
            {isRuler ? <Flame className="w-9 h-9" /> : <Trophy className="w-9 h-9" />}
          </div>
          <h2 className="text-3xl font-black text-white mb-2">
            {isRuler ? 'Souverain d’Aetheria' : 'Entité Céleste Transcendée'}
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            {isRuler
              ? 'Après avoir terrassé Malakor, vous avez gardé les 10 Orbes pour vous ! Tous vos pouvoirs divins restent actifs et les Survivants Humains continuent de vous défier.'
              : 'Après avoir terrassé Malakor, les 10 Orbes et le Réceptacle ont fusionné avec votre âme. Vous conservez l’intégralité de vos pouvoirs cosmiques divins (Lame de l’Origine, Arc Stellaire, Saut Dimensionnel, Jugement du Cosmos) pour purger les Démons de l’Espace-Temps !'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onResumeGame}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
                isRuler
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950'
                  : 'bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300 hover:from-amber-200 hover:to-cyan-200 text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.4)]'
              }`}
            >
              {isRuler
                ? 'Régner sur le Monde (Garder ses Pouvoirs)'
                : 'Incarner l’Entité Céleste (Post-Game Cosmique)'}
            </button>
            {onReplayOutro && (
              <button
                onClick={onReplayOutro}
                className="w-full py-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-sm flex items-center justify-center gap-2 border border-cyan-500/30 transition-all cursor-pointer"
              >
                <Film className="w-4 h-4" />
                Changer de Choix / Revoir la Fin
              </button>
            )}
            <button
              onClick={() => onStartNewGame(activeSlot)}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Nouvelle Partie (avec Intro)
            </button>
            <button
              onClick={onReturnToMainMenu}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-sm transition-all cursor-pointer"
            >
              Retour au Menu Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 pointer-events-auto">
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            {screen === 'PAUSED' ? `PAUSE • ${orbsCollected}/${totalOrbs} ORBES` : 'EXPLORATION & POUVOIRS 3D OPEN WORLD'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            AETHERIAL HORIZONS
          </h1>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-950/90 rounded-2xl border border-slate-800/80 mb-6">
          <button
            onClick={() => setActiveTab('MAIN')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MAIN'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {screen === 'PAUSED' ? 'Menu Pause' : 'Jouer'}
          </button>
          <button
            onClick={() => setActiveTab('SAVES')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'SAVES'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Sauvegardes
          </button>
          <button
            onClick={() => setActiveTab('CONTROLS')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'CONTROLS'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Pouvoirs & Contrôles
          </button>
        </div>

        {activeTab === 'MAIN' && (
          <div className="space-y-3">
            {screen === 'PAUSED' ? (
              <>
                <button
                  onClick={onResumeGame}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Reprendre la Partie
                </button>

                <button
                  onClick={() => handleSaveSlotClick(activeSlot)}
                  className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                >
                  {savedToastSlot === activeSlot ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Partie sauvegardée (Emplacement {activeSlot}) !</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-cyan-400" />
                      Sauvegarder maintenant (Emplacement {activeSlot})
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('SAVES')}
                  className="w-full py-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  Gérer / Charger un emplacement
                </button>

                <button
                  onClick={() => setIsOptionsOpen(true)}
                  className="w-full py-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-emerald-400" />
                  Options
                </button>

                <button
                  onClick={onReturnToMainMenu}
                  className="w-full py-3 rounded-2xl bg-slate-950/70 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-800/80 transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  Quitter vers l&apos;Écran Titre
                </button>
              </>
            ) : (
              <>
                {latestSave && (
                  <button
                    onClick={() => onLoadGame(latestSave)}
                    className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm flex items-center justify-between shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Play className="w-4 h-4 fill-current" />
                      Continuer (Emplacement {latestSave.slotId})
                    </span>
                    <span className="text-xs font-mono bg-slate-950/20 px-2.5 py-1 rounded-lg">
                      {latestSave.orbsCollected}/{latestSave.totalOrbs} Orbes
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const emptySlot = [1, 2, 3].find((id) => !saves[id]) || 1;
                    onStartNewGame(emptySlot);
                  }}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    latestSave
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold py-4 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Nouvelle Aventure (Cinématique d&apos;Intro)
                </button>

                <button
                  onClick={() => setActiveTab('SAVES')}
                  className="w-full py-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-cyan-400" />
                  Emplacements de Sauvegarde (3 Slots)
                </button>

                <button
                  onClick={() => setIsOptionsOpen(true)}
                  className="w-full py-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-800 transition-all cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  Options
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'SAVES' && (
          <div className="space-y-3">
            {[1, 2, 3].map((slotId) => {
              const slotData = saves[slotId];
              const isCurrent = activeSlot === slotId;

              return (
                <div
                  key={slotId}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-slate-800/90 border-emerald-500/50'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        Emplacement {slotId}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Actif
                        </span>
                      )}
                    </div>

                    {slotData ? (
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="text-emerald-400 font-semibold">
                          {slotData.orbsCollected}/{slotData.totalOrbs} Orbes
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(slotData.updatedAt)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">Emplacement vide</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {screen === 'PAUSED' && (
                      <button
                        onClick={() => handleSaveSlotClick(slotId)}
                        className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {savedToastSlot === slotId ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Sauvé
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            Sauver ici
                          </>
                        )}
                      </button>
                    )}

                    {slotData ? (
                      <>
                        <button
                          onClick={() => onLoadGame(slotData)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Charger
                        </button>
                        <button
                          onClick={() => onDeleteSave(slotId)}
                          title="Supprimer cette sauvegarde"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onStartNewGame(slotId)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                      >
                        Nouvelle Partie ici
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'CONTROLS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400">Marcher / Reculer</span>
                <kbd className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded font-mono font-bold">
                  ZQSD / WASD
                </kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400">Attaquer / Tirer</span>
                <kbd className="px-2 py-0.5 bg-slate-800 text-rose-300 rounded font-mono font-bold">
                  Clic G / F
                </kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-cyan-300 font-semibold">Dash Éclair (1 Orbe)</span>
                <kbd className="px-2 py-0.5 bg-slate-800 text-cyan-300 rounded font-mono font-bold">
                  Touche R
                </kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-amber-300 font-semibold">Jour / Nuit (2 Orbes)</span>
                <kbd className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded font-mono font-bold">
                  Touche T
                </kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-rose-300 font-semibold">Nova Solaire (4 Orbes)</span>
                <kbd className="px-2 py-0.5 bg-slate-800 text-rose-300 rounded font-mono font-bold">
                  Touche G
                </kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400">Caméra 1P / 3P</span>
                <kbd className="px-2 py-0.5 bg-slate-800 text-cyan-300 rounded font-mono font-bold">
                  V
                </kbd>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={onToggleSound}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                  Effets Sonores
                </span>
                <span className={soundEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                  {soundEnabled ? 'Activés' : 'Muets'}
                </span>
              </button>

              <button
                onClick={onToggleCamera}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  Vue Caméra
                </span>
                <span className="text-cyan-400">
                  {cameraMode === 'FIRST_PERSON' ? '1ère Personne' : '3ème Personne'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {isOptionsOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Options</h2>
                  <p className="text-xs text-slate-400">Paramètres généraux et accès développeur</p>
                </div>
              </div>
              <button
                onClick={() => setIsOptionsOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                title="Fermer les options"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Audio & Affichage
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={onToggleSound}
                  className="py-3 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                    Effets Sonores
                  </span>
                  <span className={soundEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                    {soundEnabled ? 'Activés' : 'Muets'}
                  </span>
                </button>

                <button
                  onClick={onToggleCamera}
                  className="py-3 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Vue Caméra
                  </span>
                  <span className="text-cyan-400">
                    {cameraMode === 'FIRST_PERSON' ? '1ère Personne' : '3ème Personne'}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  {isDebugUnlocked ? (
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  Debug
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    isDebugUnlocked
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isDebugUnlocked ? 'Déverrouillé' : 'Accès PIN requis'}
                </span>
              </div>

              <form onSubmit={handleValidateDebugPin} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={debugPinInput}
                    onChange={(e) => {
                      setDebugPinInput(e.target.value);
                      if (debugPinError) setDebugPinError(false);
                    }}
                    placeholder="Code PIN Debug..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-all cursor-pointer"
                >
                  Valider
                </button>
              </form>

              {debugPinError && (
                <p className="text-xs text-rose-400 font-semibold">
                  Code PIN incorrect. Accès debug refusé.
                </p>
              )}

              {isDebugUnlocked && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
                    <span className="text-slate-300">
                      badEndingCompleted :{' '}
                      <strong className={badEndingCompleted ? 'text-rose-400' : 'text-slate-500'}>
                        {badEndingCompleted ? 'TRUE' : 'FALSE'}
                      </strong>
                    </span>
                    <span className="text-slate-300">
                      goodEndingCompleted :{' '}
                      <strong className={goodEndingCompleted ? 'text-amber-300' : 'text-slate-500'}>
                        {goodEndingCompleted ? 'TRUE' : 'FALSE'}
                      </strong>
                    </span>
                  </div>

                  {debugStatusMessage && (
                    <p className="text-[11px] text-cyan-300 font-semibold">
                      {debugStatusMessage}
                    </p>
                  )}

                  {onDebugJumpToEndingChoice && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsOpen(false);
                        onDebugJumpToEndingChoice();
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300 hover:from-amber-200 hover:to-cyan-200 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Sauter au Choix des Fins
                    </button>
                  )}

                  {onSimulateBadEndingCompleted && (
                    <button
                      type="button"
                      onClick={() => {
                        onSimulateBadEndingCompleted();
                        setDebugStatusMessage(
                          'Flag badEndingCompleted forcé à TRUE dans localStorage !'
                        );
                      }}
                      className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                      Simuler sauvegarde : Mauvaise Fin déjà validée
                    </button>
                  )}

                  {onTestDimensionalClash && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsOpen(false);
                        onTestDimensionalClash();
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-purple-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
                    >
                      <Film className="w-4 h-4" />
                      Tester cinématique Clash Dimensionnel
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {onSpawnBossPhase1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOptionsOpen(false);
                          onSpawnBossPhase1();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-purple-950/85 hover:bg-purple-900/85 text-purple-200 border border-purple-500/50 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        Spawn Boss Phase 1
                      </button>
                    )}

                    {onForceBossPhase2 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOptionsOpen(false);
                          onForceBossPhase2();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-rose-950/85 hover:bg-rose-900/85 text-rose-200 border border-rose-500/50 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        Forcer Boss Phase 2
                      </button>
                    )}

                    {onForceBossPhase3 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOptionsOpen(false);
                          onForceBossPhase3();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-fuchsia-950/85 hover:bg-fuchsia-900/85 text-fuchsia-200 border border-fuchsia-500/50 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                        Forcer Boss Phase 3
                      </button>
                    )}

                    {onForceBossZeroHp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOptionsOpen(false);
                          onForceBossZeroHp();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Skull className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        Forcer 0% PV Boss (Déclencher Fin)
                      </button>
                    )}
                  </div>

                  {(onLaunchFourthWallCutscene || onForceBossZeroHp) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsOpen(false);
                        if (onLaunchFourthWallCutscene) {
                          onLaunchFourthWallCutscene();
                        } else if (onForceBossZeroHp) {
                          onForceBossZeroHp();
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-fuchsia-500 to-rose-500 hover:from-emerald-300 hover:to-rose-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/30 transition-all cursor-pointer"
                    >
                      <Terminal className="w-4 h-4" />
                      Lancer Cinématique 4ème Mur
                    </button>
                  )}

                  {onForceGameOver && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsOpen(false);
                        onForceGameOver();
                      }}
                      className="w-full py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 text-rose-200 border border-rose-500/50 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
                    >
                      <Skull className="w-4 h-4 text-rose-400" />
                      Forcer le Game Over
                    </button>
                  )}

                  {onResetAllSaves && (
                    <button
                      type="button"
                      onClick={() => {
                        onResetAllSaves();
                        setDebugStatusMessage(
                          'Toutes les sauvegardes et flags de fins ont été réinitialisés.'
                        );
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Reset toutes les sauvegardes
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsOptionsOpen(false)}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              Fermer et revenir au Menu Principal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
