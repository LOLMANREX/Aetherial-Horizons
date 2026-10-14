import React from 'react';
import { PlayerStats, WorldState, WeaponType } from '../types';
import {
  Sparkles,
  Navigation,
  Pause,
  Wind,
  Sword,
  Crosshair,
  Heart,
  Zap,
  SunMoon,
  Flame,
  Skull,
  CloudLightning,
} from 'lucide-react';
import { Minimap } from './Minimap';

interface HUDProps {
  player: PlayerStats;
  world: WorldState;
  isPlaying: boolean;
  onOpenPauseMenu: () => void;
  onSelectWeapon: (weapon: WeaponType) => void;
  onTriggerDash: () => void;
  onTriggerTimeShift: () => void;
  onTriggerNova: () => void;
  recentCollectName: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  world,
  isPlaying,
  onOpenPauseMenu,
  onSelectWeapon,
  onTriggerDash,
  onTriggerTimeShift,
  onTriggerNova,
  recentCollectName,
}) => {
  if (!isPlaying) return null;

  const getCardinalLabel = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    return dirs[index];
  };

  const allCollected = world.orbsCollected === world.totalOrbs;
  const bossActive = world.boss.active && !world.boss.defeated;
  const isRuler = player.endingChoice === 'RULE_WORLD';

  const relAngle =
    world.nearestOrbAngle !== null
      ? world.nearestOrbAngle > 180
        ? world.nearestOrbAngle - 360
        : world.nearestOrbAngle
      : null;

  const orbIndicatorPercent =
    relAngle !== null ? Math.max(8, Math.min(92, 50 + (relAngle / 90) * 42)) : null;

  const showOxygenBar = player.isUnderwater || player.oxygen < 99.5;

  const bowCircleScale = 1.45 - player.bowCharge * 0.65;
  const isFullyCharged = player.bowCharge >= 0.92;

  const unlockedDash = player.activePowersCount >= 1;
  const unlockedTimeControl = player.activePowersCount >= 2;
  const unlockedNova = player.activePowersCount >= 4;

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Filtre immersif quand la caméra est sous l'eau */}
      {player.isUnderwater && (
        <div
          className={`fixed inset-0 pointer-events-none transition-colors duration-300 -z-10 ${
            player.oxygen < 20
              ? 'bg-rose-950/35 shadow-[inset_0_0_90px_rgba(225,29,72,0.55)]'
              : 'bg-cyan-950/30 shadow-[inset_0_0_80px_rgba(6,182,212,0.45)]'
          }`}
        />
      )}

      {/* RÉTICULE (CROSSHAIR) FIXÉ PILE AU CENTRE GÉOMÉTRIQUE DE L'ÉCRAN (50% / 50%) */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-20">
        {player.equippedWeapon === 'BOW' ? (
          <div className="relative flex items-center justify-center">
            <div
              className={`w-7 h-7 rounded-full border-2 transition-transform duration-75 flex items-center justify-center ${
                isRuler
                  ? 'border-rose-500 shadow-[0_0_12px_#f43f5e]'
                  : isFullyCharged
                  ? 'border-cyan-400 shadow-[0_0_12px_#22d3ee]'
                  : player.bowCharge > 0.05
                  ? 'border-amber-400'
                  : 'border-amber-400/50'
              }`}
              style={{ transform: `scale(${bowCircleScale})` }}
            />
            <div
              className={`absolute w-1.5 h-1.5 rounded-full ${
                isRuler
                  ? 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                  : isFullyCharged
                  ? 'bg-cyan-300 shadow-[0_0_8px_#22d3ee]'
                  : 'bg-amber-300 shadow-[0_0_6px_#fbbf24]'
              }`}
            />
          </div>
        ) : (
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isRuler
                ? 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'
                : 'bg-white/85 shadow-[0_0_4px_rgba(255,255,255,0.8)]'
            }`}
          />
        )}
      </div>

      {/* HAUT : Compteur d'Orbes + Niveau Ennemis / Survivants, Boussole minimaliste et Bouton Pause */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-slate-950/65 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2.5 shadow-lg">
              <Sparkles
                className={`w-4 h-4 ${isRuler ? 'text-rose-400' : 'text-cyan-400'}`}
              />
              <span className="text-sm font-extrabold text-white tracking-wide">
                {world.orbsCollected}{' '}
                <span className="text-slate-400 font-normal">/ {world.totalOrbs}</span>
              </span>
            </div>

            {world.enemyTier > 1 && (
              <div
                className={`backdrop-blur-md border rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg ${
                  isRuler
                    ? 'bg-amber-950/80 border-amber-400/50'
                    : 'bg-rose-950/75 border-rose-500/40'
                }`}
                title={
                  isRuler
                    ? 'Les derniers Survivants Humains traquent votre Trône pour venger Aetheria !'
                    : "Plus vous possédez d'Orbes et de pouvoirs, plus les Maraudeurs deviennent rapides et puissants !"
                }
              >
                <Skull
                  className={`w-3.5 h-3.5 animate-pulse ${
                    isRuler ? 'text-amber-400' : 'text-rose-400'
                  }`}
                />
                <span
                  className={`text-xs font-extrabold ${
                    isRuler ? 'text-amber-200' : 'text-rose-200'
                  }`}
                >
                  {isRuler
                    ? 'Survivants Vengeurs'
                    : `Menace Niv. ${world.enemyTier}`}
                </span>
              </div>
            )}
          </div>

          {/* Boussole Minimaliste au Centre */}
          <div className="bg-slate-950/65 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 flex flex-col items-center shadow-lg min-w-[210px] sm:min-w-[250px]">
            <div className="flex items-center gap-3 text-xs font-bold tracking-widest text-slate-300">
              <span className="text-amber-400">{getCardinalLabel(player.heading)}</span>
              {world.nearestOrbDistance !== null && (!allCollected || bossActive) && (
                <span
                  className={`flex items-center gap-1 font-mono text-[11px] ${
                    bossActive ? 'text-rose-400 font-extrabold' : 'text-cyan-300'
                  }`}
                >
                  <Navigation
                    className={`w-3 h-3 transition-transform duration-100 ${
                      bossActive ? 'text-rose-400' : 'text-cyan-400'
                    }`}
                    style={{ transform: `rotate(${relAngle || 0}deg)` }}
                  />
                  {bossActive ? 'BOSS ' : ''}
                  {Math.round(world.nearestOrbDistance)}m
                </span>
              )}
            </div>

            <div className="w-full h-1.5 bg-slate-800/90 rounded-full mt-1.5 relative overflow-hidden">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-0.5 h-full bg-amber-400/80" />
              {orbIndicatorPercent !== null && (!allCollected || bossActive) && (
                <div
                  className={`w-2 h-2 rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-75 ${
                    bossActive
                      ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                      : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                  }`}
                  style={{ left: `${orbIndicatorPercent}%` }}
                />
              )}
            </div>
          </div>

          {/* Bouton Menu / Pause */}
          <button
            onClick={onOpenPauseMenu}
            title="Menu Pause / Sauvegarder (Échap)"
            className="pointer-events-auto bg-slate-950/65 hover:bg-slate-900 backdrop-blur-md border border-white/10 rounded-full px-3.5 py-2 flex items-center gap-1.5 text-xs font-semibold text-slate-200 transition-colors shadow-lg cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>

        {/* GRANDE BARRE DE VIE DU BOSS FINAL */}
        {bossActive && (
          <div className="w-full max-w-lg bg-slate-950/85 backdrop-blur-md border border-rose-500/50 rounded-2xl px-5 py-2.5 shadow-[0_0_30px_rgba(244,63,94,0.3)] flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs font-black tracking-wider uppercase text-rose-300 mb-1.5">
              <span className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-rose-500 animate-bounce" />
                {world.boss.name}
              </span>
              <span className="font-mono text-amber-300">
                {Math.ceil(world.boss.hp)} / {world.boss.maxHp} PV
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full p-0.5 border border-rose-500/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 transition-all duration-100 shadow-[0_0_12px_#f43f5e]"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (world.boss.hp / world.boss.maxHp) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="text-[10px] text-slate-300 mt-1 font-medium">
              Terrassez le Boss pour récupérer le Réceptacle des 10 Orbes et débloquer le choix final !
            </div>
          </div>
        )}
      </div>

      {/* CENTRE : Notifications d'Orbe & Pouvoir Débloqué */}
      <div className="relative flex-1 flex items-center justify-center">
        {recentCollectName && (
          <div
            className={`absolute top-6 bg-slate-950/90 border backdrop-blur-md px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 animate-fade-in ${
              isRuler ? 'border-rose-500/60' : 'border-cyan-400/50'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 shrink-0 ${
                isRuler ? 'text-rose-400' : 'text-cyan-400'
              }`}
            />
            <span className="text-xs sm:text-sm font-bold text-white">
              {recentCollectName}
            </span>
          </div>
        )}
      </div>

      {/* BAS : Armes & Pouvoirs à gauche, Jauges au centre, Minimap à droite */}
      <div className="relative flex items-end justify-between gap-2">
        <div className="flex flex-col gap-2">
          {/* Barre des Pouvoirs Aethériques (ou Pouvoirs du Souverain du Néant en Mauvaise Fin) */}
          {player.activePowersCount > 0 && (
            <div
              className={`pointer-events-auto flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border rounded-2xl p-1.5 shadow-xl ${
                isRuler ? 'border-rose-500/40' : 'border-cyan-500/30'
              }`}
            >
              {/* Pouvoir 1 : Dash Éclair ou Téléportation Éclair Rouge [R] */}
              <button
                onClick={onTriggerDash}
                disabled={!unlockedDash || player.dashCooldown > 0}
                className={`relative px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer overflow-hidden ${
                  unlockedDash
                    ? player.dashCooldown > 0
                      ? 'bg-slate-900 text-slate-500 border border-slate-800'
                      : isRuler
                      ? 'bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'opacity-40 bg-slate-900 text-slate-600'
                }`}
                title={
                  isRuler
                    ? 'Téléportation Sanglante [Touche R] : Téléportation instantanée dans un fracas d’éclairs rouges !'
                    : 'Dash Éclair [Touche R] : Téléportation foudroyante qui électrocute les ennemis sur votre passage'
                }
              >
                <Zap
                  className={`w-3.5 h-3.5 ${
                    isRuler ? 'text-rose-400' : 'text-cyan-400'
                  }`}
                />
                <div className="text-left leading-tight">
                  <div
                    className={`text-[9px] font-mono ${
                      isRuler ? 'text-rose-300' : 'text-cyan-300'
                    }`}
                  >
                    {isRuler ? '[R] Téléport' : '[R] Dash'}
                  </div>
                  <div className="text-[10px]">
                    {player.dashCooldown > 0
                      ? `${player.dashCooldown.toFixed(1)}s`
                      : 'Prêt'}
                  </div>
                </div>
              </button>

              {/* Pouvoir 2 : Contrôle du Temps ou Vortex Céleste Foudroyant [T] */}
              <button
                onClick={onTriggerTimeShift}
                disabled={!unlockedTimeControl}
                className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  unlockedTimeControl
                    ? isRuler
                      ? 'bg-purple-500/25 hover:bg-purple-500/40 text-purple-200 border border-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 border border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                    : 'opacity-40 bg-slate-900 text-slate-500 border border-slate-800'
                }`}
                title={
                  isRuler
                    ? 'Vortex Céleste [Touche T] : Invoque un vortex dans le ciel qui foudroie et désintègre la cible d’un éclair géant !'
                    : 'Maître du Temps [Touche T] : Basculer instantanément entre le Jour et la Nuit'
                }
              >
                {isRuler ? (
                  <CloudLightning className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <SunMoon className="w-3.5 h-3.5 text-amber-400" />
                )}
                <div className="text-left leading-tight">
                  <div
                    className={`text-[9px] font-mono ${
                      isRuler ? 'text-purple-300' : 'text-amber-300'
                    }`}
                  >
                    {isRuler ? '[T] Vortex' : '[T] Temps'}
                  </div>
                  <div className="text-[10px]">
                    {unlockedTimeControl
                      ? isRuler
                        ? 'Foudre'
                        : 'Jour/Nuit'
                      : '2 Orbes'}
                  </div>
                </div>
              </button>

              {/* Pouvoir 3 : Nova Solaire ou Fissure Dimensionnelle [G] */}
              <button
                onClick={onTriggerNova}
                disabled={!unlockedNova || player.novaCooldown > 0}
                className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  unlockedNova
                    ? player.novaCooldown > 0
                      ? 'bg-slate-900 text-slate-500 border border-slate-800'
                      : 'bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border border-rose-400/50 shadow-[0_0_10px_rgba(244,63,94,0.25)]'
                    : 'opacity-40 bg-slate-900 text-slate-500 border border-slate-800'
                }`}
                title={
                  isRuler
                    ? 'Fissure de la Réalité [Touche G] : Fissure l’espace-temps autour de vous pour annihiler tous les ennemis !'
                    : 'Nova Solaire [Touche G] : Déchaîne une onde de choc foudroyante autour de vous'
                }
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <div className="text-left leading-tight">
                  <div className="text-[9px] text-rose-300 font-mono">
                    {isRuler ? '[G] Fissure' : '[G] Nova'}
                  </div>
                  <div className="text-[10px]">
                    {!unlockedNova
                      ? '4 Orbes'
                      : player.novaCooldown > 0
                      ? `${player.novaCooldown.toFixed(1)}s`
                      : 'Prêt'}
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Sélecteur d'Armes (Lame du Néant / Éclairs en Mauvaise Fin) */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-xl">
            <button
              onClick={() => onSelectWeapon('SWORD')}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                player.equippedWeapon === 'SWORD'
                  ? isRuler
                    ? 'bg-rose-500/25 border border-rose-400/60 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-cyan-500/25 border border-cyan-400/60 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title={
                isRuler
                  ? 'Lame du Néant (Touche 1 - Clic Gauche ou F pour trancher)'
                  : 'Épée Aethérique (Touche 1 - Clic Gauche ou F pour frapper)'
              }
            >
              <Sword
                className={`w-4 h-4 ${
                  isRuler ? 'text-rose-400' : 'text-cyan-400'
                }`}
              />
              <div className="text-left leading-tight">
                <div className="text-[10px] text-slate-400 font-mono">[1]</div>
                <div>{isRuler ? 'Lame Néant' : 'Épée'}</div>
              </div>
            </button>

            <button
              onClick={() => onSelectWeapon('BOW')}
              className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                player.equippedWeapon === 'BOW'
                  ? isRuler
                    ? 'bg-rose-500/25 border border-rose-400/60 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-amber-500/25 border border-amber-400/60 text-white shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title={
                isRuler
                  ? 'Tir de Mini-Éclairs (Touche 2 - Clic Gauche ou F pour projeter des éclairs rouges)'
                  : 'Arc Sylvestre (Touche 2 - Maintenir Clic Gauche ou F pour bander et relâcher pour tirer)'
              }
            >
              {isRuler ? (
                <Zap className="w-4 h-4 text-rose-400" />
              ) : (
                <Crosshair className="w-4 h-4 text-amber-400" />
              )}
              <div className="text-left leading-tight">
                <div className="text-[10px] text-slate-400 font-mono">
                  {isRuler ? '[2] Éclairs' : '[2] Arc'}
                </div>
                <div
                  className={`font-mono ${
                    isRuler
                      ? 'text-rose-300'
                      : player.arrows === 0
                      ? 'text-rose-400'
                      : 'text-amber-300'
                  }`}
                >
                  {isRuler ? '∞ éclairs' : `${player.arrows} flèches`}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Conteneur central des jauges (Santé + Oxygène + Endurance) */}
        <div className="flex-1 flex flex-col items-center gap-1.5 pb-1">
          {player.isSwimming && (
            <div className="text-[11px] font-medium text-cyan-200/90 bg-slate-950/60 backdrop-blur-sm px-3 py-0.5 rounded-full border border-cyan-400/20">
              {player.isUnderwater
                ? 'ESPACE : Remonter à la surface'
                : 'Regarder vers le bas + Avancer (ou Touche C) : Plonger'}
            </div>
          )}

          {/* Barre d'Oxygène */}
          {showOxygenBar && (
            <div className="flex flex-col items-center gap-0.5 transition-all duration-200">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 drop-shadow">
                <Wind
                  className={`w-3 h-3 ${
                    player.oxygen < 25 ? 'text-rose-400 animate-ping' : 'text-cyan-400'
                  }`}
                />
                <span className={player.oxygen < 25 ? 'text-rose-400' : 'text-cyan-300'}>
                  Oxygène {Math.round(player.oxygen)}%
                </span>
              </div>
              <div className="w-48 sm:w-56 h-2 bg-slate-950/80 backdrop-blur-md rounded-full p-0.5 border border-cyan-400/30 shadow-lg overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    player.oxygen < 25 ? 'bg-rose-500' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, player.oxygen))}%` }}
                />
              </div>
            </div>
          )}

          {/* Barre de Santé (PV) */}
          <div className="flex items-center gap-2">
            <Heart
              className={`w-3.5 h-3.5 ${
                player.health < 30
                  ? 'text-rose-500 animate-pulse fill-rose-500'
                  : 'text-rose-400 fill-rose-400'
              }`}
            />
            <div className="w-44 sm:w-52 h-2.5 bg-slate-950/80 backdrop-blur-md rounded-full p-0.5 border border-white/15 shadow-lg overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, player.health))}%` }}
              />
            </div>
          </div>

          {/* Barre d'Endurance (Sprint) */}
          <div
            className={`transition-opacity duration-300 pl-5 ${
              player.stamina >= 99 && !player.isSprinting ? 'opacity-45' : 'opacity-100'
            }`}
          >
            <div className="w-44 sm:w-52 h-1.5 bg-slate-950/75 backdrop-blur-md rounded-full border border-white/10 shadow-lg overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  player.stamina < 20
                    ? 'bg-rose-500'
                    : player.isSprinting
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, player.stamina))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Minimap Terrain, Orbes, Camps, Ennemis & Boss en bas à droite */}
        <Minimap
          player={player}
          orbs={world.orbs}
          enemies={world.enemies}
          camps={world.camps}
          lootPickups={world.lootPickups}
          boss={world.boss}
        />
      </div>
    </div>
  );
};
