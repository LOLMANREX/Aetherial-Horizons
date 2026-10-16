import React from 'react';
import { Sparkles, FastForward, ChevronLeft, ChevronRight, Sun, Flame } from 'lucide-react';
import { EndingChoice } from '../types';

export interface CutsceneSlide {
  chapter: string;
  title: string;
  subtitle: string;
}

export const INTRO_SLIDES: CutsceneSlide[] = [
  {
    chapter: 'PROLOGUE • LE MONDE FRAGMENTÉ',
    title: 'Les Terres d’Aetheria',
    subtitle:
      'Autrefois, le Cœur Solaire maintenait l’équilibre et la lumière sur ces vallées ancestrales. Mais lors du Grand Cataclysme, son essence fut brisée et dispersée aux quatre vents.',
  },
  {
    chapter: 'LES RELIQUES PERDUES',
    title: 'Les 10 Totems Aethériques',
    subtitle:
      'Chaque Orbe renferme un Pouvoir Divin ancien (Dash Éclair, Maîtrise du Temps, Onde Solaire...). Mais prenez garde : plus vous absorberez d’Orbes, plus les Maraudeurs de l’Ombre deviendront puissants.',
  },
  {
    chapter: 'L’ÉVEIL DU VOYAGEUR',
    title: 'Votre Mission',
    subtitle:
      'Vous êtes le dernier Arpenteur. Utilisez votre boussole et votre radar topographique pour localiser les 10 Orbes, terrassez les Maraudeurs et décidez du destin d’Aetheria.',
  },
];

export const BOSS_SLIDES: CutsceneSlide[] = [
  {
    chapter: 'LA CONVERGENCE • LE 10ÈME SCEAU',
    title: 'La Descente du Réceptacle Sacré',
    subtitle:
      'Alors que vous absorbez la dixième Orbe, les cieux s’ouvrent au-dessus du Sanctuaire Central. Le Réceptacle Ancestral descend des étoiles pour accueillir les 10 Orbes...',
  },
  {
    chapter: 'CATACLYSME • L’IRRUPTION DU TITAN',
    title: 'Malakor, Dévoreur d’Aetheria !',
    subtitle:
      'Soudain, la terre tremble ! Un Titan colossal surgit de l’abîme, intercepte le Réceptacle céleste dans sa chute et l’incruste dans son propre cœur pour s’emparer de sa puissance !',
  },
  {
    chapter: 'COMBAT ULTIME • REPRENEZ LE RÉCEPTACLE',
    title: 'Terrassez le Titan du Néant',
    subtitle:
      'Malakor vous attend au Sanctuaire Central. Utilisez votre Épée, votre Arc et vos Pouvoirs Divins (Dash [R], Nova [G]) pour abattre le Boss et débloquer le choix final !',
  },
];

export const OUTRO_SLIDES: CutsceneSlide[] = [
  {
    chapter: 'ÉPILOGUE • LE TITAN TERRASSÉ',
    title: 'Le Réceptacle Libéré',
    subtitle:
      'Malakor s’effondre dans un fracas cosmique ! Le Réceptacle des 10 Orbes lévite enfin devant vous, vibrant d’une énergie pure.',
  },
  {
    chapter: 'LE DILEMME ULTIME',
    title: 'L’Heure du Choix',
    subtitle:
      'Le Réceptacle attend votre décision. Allez-vous y sceller vos 10 Orbes pour guérir et sauver le monde, ou briser le Réceptacle et garder tous vos pouvoirs pour gouverner Aetheria ?',
  },
  {
    chapter: 'LÉGENDE D’AETHERIA',
    title: 'Un Nouveau Destin',
    subtitle:
      'Votre choix résonne à travers l’éternité.',
  },
];

interface CutsceneOverlayProps {
  mode: 'INTRO' | 'BOSS' | 'OUTRO';
  stepIndex: number;
  stepProgress: number; // 0 à 1
  endingChoice: EndingChoice;
  onSelectEndingChoice?: (choice: 'SAVE_WORLD' | 'RULE_WORLD') => void;
  onPrevStep?: () => void;
  onNextStep: () => void;
  onSkip: () => void;
}

export const CutsceneOverlay: React.FC<CutsceneOverlayProps> = ({
  mode,
  stepIndex,
  stepProgress,
  endingChoice,
  onSelectEndingChoice,
  onPrevStep,
  onNextStep,
  onSkip,
}) => {
  const slides =
    mode === 'INTRO'
      ? INTRO_SLIDES
      : mode === 'BOSS'
      ? BOSS_SLIDES
      : OUTRO_SLIDES;
  const current = slides[Math.min(stepIndex, slides.length - 1)];

  // En mode OUTRO, à l'étape 1 (si pas encore choisi), afficher les 2 grands choix moraux
  const isWaitingForChoice =
    mode === 'OUTRO' && stepIndex === 1 && endingChoice === 'NONE';

  let displayTitle = current.title;
  let displaySubtitle = current.subtitle;
  if (mode === 'OUTRO' && stepIndex === 2) {
    if (endingChoice === 'SAVE_WORLD') {
      displayTitle = 'Le Sacrifice du Sauveur';
      displaySubtitle =
        'Vous avez scellé les 10 Orbes dans le Réceptacle. Vos pouvoirs divins se sont dissipés dans un pilier de lumière pure qui a purifié toutes les terres d’Aetheria. Le monde est sauvé et en paix.';
    } else if (endingChoice === 'RULE_WORLD') {
      displayTitle = 'Le Règne du Souverain Aethérique';
      displaySubtitle =
        'Vous avez absorbé le Réceptacle et conservé les 10 Orbes. Le ciel s’embrase sous votre volonté : le monde reste tel qu’il est, mais vous en êtes désormais le Maître absolu.';
    }
  }

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between select-none font-sans">
      {/* Bande noire cinéma supérieure (Letterbox) */}
      <div className="w-full h-20 sm:h-24 bg-gradient-to-b from-black via-black/90 to-transparent flex items-start justify-between px-6 sm:px-10 pt-5">
        <div className="flex items-center gap-2.5 text-xs font-bold tracking-[0.2em] uppercase text-cyan-300/90">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>{current.chapter}</span>
        </div>

        {!isWaitingForChoice && (
          <button
            onClick={onSkip}
            className="pointer-events-auto px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Passer la cinématique</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* CENTRE : LES 2 CHOIX MORAUX DE LA CINÉMATIQUE DE FIN */}
      {isWaitingForChoice && onSelectEndingChoice && (
        <div className="pointer-events-auto flex-1 flex items-center justify-center px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl w-full">
            {/* CHOIX 1 : RENDRE LES ORBES & SAUVER LE MONDE */}
            <button
              onClick={() => onSelectEndingChoice('SAVE_WORLD')}
              className="group bg-slate-950/85 hover:bg-emerald-950/80 backdrop-blur-xl border-2 border-emerald-400/50 hover:border-emerald-300 rounded-3xl p-6 text-left transition-all transform hover:scale-[1.03] shadow-[0_0_40px_rgba(16,185,129,0.25)] cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-4 group-hover:scale-110 transition-transform">
                  <Sun className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-1">
                  Voie de l’Harmonie
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  Rendre les Orbes & Sauver le Monde
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Placez les 10 Orbes dans le Réceptacle Sacré pour purifier Aetheria et faire disparaître les Maraudeurs. Vous renoncez à vos pouvoirs divins pour offrir la paix au monde.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-extrabold text-emerald-300">
                <span>Choisir ce destin</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* CHOIX 2 : GARDER SES POUVOIRS & CONTRÔLER LE MONDE */}
            <button
              onClick={() => onSelectEndingChoice('RULE_WORLD')}
              className="group bg-slate-950/85 hover:bg-rose-950/80 backdrop-blur-xl border-2 border-rose-500/50 hover:border-amber-400 rounded-3xl p-6 text-left transition-all transform hover:scale-[1.03] shadow-[0_0_40px_rgba(244,63,94,0.25)] cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-rose-400 mb-1">
                  Voie de la Domination
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  Garder ses Pouvoirs & Contrôler le Monde
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Laissez le monde tel qu’il est et conservez l’intégralité des 10 Orbes en vous. Vous gardez tous vos pouvoirs (Dash Éclair, Maître du Temps, Nova...) pour régner en maître.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-rose-500/20 flex items-center justify-between text-xs font-extrabold text-amber-300">
                <span>Choisir ce destin</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bande noire cinéma inférieure avec narration et contrôles */}
      <div className="w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-7 px-6 sm:px-12 flex flex-col items-center">
        <div className="max-w-3xl w-full text-center space-y-2.5">
          <h2
            className={`text-xl sm:text-2xl font-black tracking-wide drop-shadow ${
              mode === 'BOSS' ? 'text-rose-400' : 'text-amber-300'
            }`}
          >
            {displayTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium drop-shadow-md min-h-[3.5rem]">
            {displaySubtitle}
          </p>

          <div className="pt-4 flex items-center justify-between gap-4 border-t border-white/10">
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              {slides.map((_, idx) => {
                const fill =
                  idx < stepIndex
                    ? 100
                    : idx === stepIndex
                    ? Math.round(stepProgress * 100)
                    : 0;
                return (
                  <div
                    key={idx}
                    className="h-1.5 flex-1 bg-white/15 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full transition-all duration-100 ${
                        mode === 'BOSS'
                          ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                          : 'bg-gradient-to-r from-amber-400 to-cyan-400'
                      }`}
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {!isWaitingForChoice && onPrevStep && stepIndex > 0 && (
              <button
                onClick={onPrevStep}
                className="pointer-events-auto px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-slate-100 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
            )}

            {!isWaitingForChoice && (
              <button
                onClick={onNextStep}
                className={`pointer-events-auto px-5 py-2 rounded-full font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                  mode === 'BOSS'
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                <span>
                  {stepIndex < slides.length - 1
                    ? 'Plan suivant'
                    : mode === 'INTRO'
                    ? 'Commencer l’aventure'
                    : mode === 'BOSS'
                    ? 'Affronter le Boss !'
                    : 'Terminer'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
