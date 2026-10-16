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
    title: 'L’Heure de la Transcendance',
    subtitle:
      'Le Réceptacle attend votre décision. Allez-vous fusionner son essence stellaire avec vos 10 Orbes pour transcender en Entité Céleste et illuminer Aetheria, ou le corrompre pour régner en Souverain du Néant ?',
  },
  {
    chapter: 'APOTHÉOSE COSMIQUE',
    title: 'L’Ascension de l’Entité Céleste',
    subtitle:
      'En éveillant le Réceptacle, vous ne perdez aucun pouvoir : les 10 Orbes fusionnent avec votre âme dans un éclat d’or et de lumière pure. Vos capacités transcendent en Pouvoirs Cosmiques Divins, mais cette onde astrale fissure le multivers et attire les Démons de l’Espace-Temps !',
  },
];

interface CutsceneOverlayProps {
  mode: 'INTRO' | 'BOSS' | 'OUTRO';
  stepIndex: number;
  stepProgress: number;
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

  const isWaitingForChoice =
    mode === 'OUTRO' && stepIndex === 1 && endingChoice === 'NONE';

  let displayTitle = current.title;
  let displaySubtitle = current.subtitle;
  if (mode === 'OUTRO' && stepIndex === 2) {
    if (endingChoice === 'SAVE_WORLD') {
      displayTitle = 'L’Apothéose de l’Entité Céleste';
      displaySubtitle =
        'Loin de se dissiper, vos 10 Orbes ont fusionné avec le Cœur Solaire en vous ! Paré d’une armure astrale blanc et or, vous conservez et transcendez tous vos pouvoirs divins (Saut Dimensionnel, Firmament, Jugement du Cosmos) face aux Démons de l’Espace-Temps.';
    } else if (endingChoice === 'RULE_WORLD') {
      displayTitle = 'L’Ascension du Souverain du Néant';
      displaySubtitle =
        'J’assume pleinement ma chute : ce monde n’était qu’un brasier destiné à nourrir mon éveil. En dévorant le Cœur d’Aetheria et en brisant cette réalité, j’asservis l’abîme pour alimenter ma conquête des autres dimensions du multivers !';
    }
  }

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between select-none font-sans">
      {endingChoice === 'RULE_WORLD' && (
        <div
          className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(circle at center, transparent 32%, rgba(88, 28, 135, 0.42) 72%, rgba(9, 2, 18, 0.94) 100%)',
            boxShadow:
              'inset 0 0 130px rgba(225, 29, 72, 0.48), inset 0 0 60px rgba(147, 51, 234, 0.55)',
          }}
        />
      )}
      <div className="w-full h-20 sm:h-24 bg-gradient-to-b from-black via-black/90 to-transparent flex items-start justify-between px-6 sm:px-10 pt-5 relative z-20">
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

      {isWaitingForChoice && onSelectEndingChoice && (
        <div className="pointer-events-auto flex-1 flex items-center justify-center px-4 py-2 overflow-y-auto relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl w-full">
            <button
              onClick={() => onSelectEndingChoice('SAVE_WORLD')}
              className="group bg-slate-950/95 hover:bg-amber-950/90 backdrop-blur-xl border-2 border-amber-300/60 hover:border-amber-200 rounded-3xl p-5 text-left transition-all transform hover:scale-[1.02] shadow-2xl cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-200 mb-3 group-hover:scale-110 transition-transform">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-1">
                  Voie de la Transcendance
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mb-1.5">
                  Transcender en Entité Céleste
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Unissez le Réceptacle Sacré à votre âme pour restaurer la lumière d’Aetheria sans perdre aucun pouvoir. Vous éveillez l’Arsenal Cosmique (Lame de l’Origine, Arc Stellaire, Jugement du Cosmos) pour affronter les Démons de l’Espace-Temps.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-400/25 flex items-center justify-between text-xs font-extrabold text-amber-200">
                <span>Choisir l’Ascension Céleste</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => onSelectEndingChoice('RULE_WORLD')}
              className="group bg-slate-950/95 hover:bg-rose-950/90 backdrop-blur-xl border-2 border-rose-500/60 hover:border-fuchsia-400 rounded-3xl p-5 text-left transition-all transform hover:scale-[1.02] shadow-2xl cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mb-3 group-hover:scale-110 transition-transform">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-rose-400 mb-1">
                  Voie du Néant Absolu
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mb-1.5">
                  Devenir le Souverain du Néant
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Assumez votre chute : dévorez le Réceptacle et sacrifiez cette réalité pour alimenter votre ascension vers les autres mondes. Déchaînez la foudre écarlate et scellez la dimension sous votre règne abyssal.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-center justify-between text-xs font-extrabold text-rose-300">
                <span>Revendiquer le Néant</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="w-full pb-5 pt-4 px-4 sm:px-8 flex flex-col items-center relative z-20">
        <div className="max-w-3xl w-full bg-slate-950/92 backdrop-blur-xl border border-slate-800/90 rounded-3xl px-6 py-5 text-center space-y-2.5 shadow-2xl">
          <h2
            className={`text-xl sm:text-2xl font-black tracking-wide ${
              mode === 'BOSS' || endingChoice === 'RULE_WORLD'
                ? 'text-rose-400'
                : 'text-amber-300'
            }`}
          >
            {displayTitle}
          </h2>
          <p className="text-sm sm:text-base text-white leading-relaxed font-medium">
            {displaySubtitle}
          </p>

          <div className="pt-3 flex items-center justify-between gap-4 border-t border-slate-800">
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
                    className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full transition-all duration-100 ${
                        mode === 'BOSS' || endingChoice === 'RULE_WORLD'
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
                className="pointer-events-auto px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
            )}

            {!isWaitingForChoice && (
              <button
                onClick={onNextStep}
                className={`pointer-events-auto px-5 py-2 rounded-full font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                  mode === 'BOSS' || endingChoice === 'RULE_WORLD'
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
