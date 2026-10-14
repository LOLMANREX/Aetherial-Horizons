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
  onStartNewGame: (slotId: number) => void;
  onLoadGame: (slot: SaveSlotData) => void;
  onSaveCurrentGame: (slotId: number) => void;
  onDeleteSave: (slotId: number) => void;
  onResumeGame: () => void;
  onReturnToMainMenu: () => void;
  onToggleSound: () => void;
  onToggleCamera: () => void;
  onReplayOutro?: () => void;
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
}) => {
  const [activeTab, setActiveTab] = useState<'MAIN' | 'SAVES' | 'CONTROLS'>('MAIN');
  const [savedToastSlot, setSavedToastSlot] = useState<number | null>(null);

  if (
    screen === 'PLAYING' ||
    screen === 'INTRO_CUTSCENE' ||
    screen === 'BOSS_CUTSCENE' ||
    screen === 'OUTRO_CUTSCENE'
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

  if (screen === 'VICTORY') {
    const isRuler = endingChoice === 'RULE_WORLD';
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 pointer-events-auto">
        <div
          className={`bg-slate-900/95 border rounded-3xl p-8 max-w-md w-full text-center shadow-2xl ${
            isRuler ? 'border-rose-500/50' : 'border-emerald-500/40'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${
              isRuler
                ? 'bg-rose-500/20 border-rose-400/40 text-rose-400'
                : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400'
            }`}
          >
            {isRuler ? <Flame className="w-9 h-9" /> : <Trophy className="w-9 h-9" />}
          </div>
          <h2 className="text-3xl font-black text-white mb-2">
            {isRuler ? 'Souverain d’Aetheria' : 'Harmonie Restaurée'}
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            {isRuler
              ? 'Après avoir terrassé Malakor, vous avez gardé les 10 Orbes pour vous ! Tous vos pouvoirs divins (Dash Éclair, Contrôle Jour/Nuit, Nova Solaire) restent actifs et les Maraudeurs continuent de vous défier.'
              : 'Après avoir terrassé Malakor, vous avez rendu les 10 Orbes au Réceptacle pour sauver le monde. Les Maraudeurs ont été purifiés et les terres d’Aetheria sont désormais en paix.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onResumeGame}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
                isRuler
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {isRuler
                ? 'Régner sur le Monde (Garder ses Pouvoirs)'
                : 'Explorer le Monde en Paix'}
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
    </div>
  );
};
