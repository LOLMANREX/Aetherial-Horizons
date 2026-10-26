import React, { useState } from 'react';
import { SaveSlotData, GameScreen, EndingChoice } from '../types';
import { DesktopInvasionMiniGame } from './DesktopInvasionMiniGame';
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
  Monitor,
  Terminal,
} from 'lucide-react';

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
  secretDesktopEndingCompleted?: boolean;
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
  onTestWindowsDesktopMiniGame?: () => void;
  onVictoryDesktopMiniGame?: () => void;
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
  secretDesktopEndingCompleted = false,
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
  onTestWindowsDesktopMiniGame,
  onVictoryDesktopMiniGame,
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
    return (
      <DesktopInvasionMiniGame
        onVictoryReturnToMenu={onVictoryDesktopMiniGame || onReturnToMainMenu}
        onReturnToMainMenu={onReturnToMainMenu}
      />
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
          {secretDesktopEndingCompleted && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[11px] font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              Succès Secret : Dompteur du 4ème Mur (Desktop Pets Asservis)
            </div>
          )}
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
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
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
                    <span className="text-slate-300">
                      secretDesktopEnding :{' '}
                      <strong className={secretDesktopEndingCompleted ? 'text-emerald-400' : 'text-slate-500'}>
                        {secretDesktopEndingCompleted ? 'TRUE' : 'FALSE'}
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

                  {(onTestWindowsDesktopMiniGame || onLaunchFourthWallCutscene || onForceBossZeroHp) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsOpen(false);
                        if (onTestWindowsDesktopMiniGame) {
                          onTestWindowsDesktopMiniGame();
                        } else if (onLaunchFourthWallCutscene) {
                          onLaunchFourthWallCutscene();
                        } else if (onForceBossZeroHp) {
                          onForceBossZeroHp();
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300 hover:from-cyan-300 hover:to-amber-200 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer"
                    >
                      <Monitor className="w-4 h-4" />
                      Tester Mini-jeu Bureau Windows
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
