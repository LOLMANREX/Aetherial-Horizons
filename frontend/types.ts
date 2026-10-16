export type WeaponType = 'SWORD' | 'BOW';

export type EndingChoice = 'NONE' | 'SAVE_WORLD' | 'RULE_WORLD';

export interface OrbData {
  id: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  name: string;
}

export interface EnemyData {
  id: number;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  campId: number;
}

export interface BossData {
  active: boolean;
  defeated: boolean;
  name: string;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  phase?: 1 | 2 | 3;
  isAlterEgo?: boolean;
}

export interface CampData {
  id: number;
  x: number;
  y: number;
  z: number;
  name: string;
}

export interface LootPickupData {
  id: string;
  x: number;
  y: number;
  z: number;
  arrows: number;
  heal: number;
  collected: boolean;
}

export interface PlayerStats {
  x: number;
  y: number;
  z: number;
  heading: number; // 0-360 degrés
  health: number; // 0-100
  stamina: number; // 0-100
  oxygen: number; // 0-100
  arrows: number;
  equippedWeapon: WeaponType;
  isAttacking: boolean;
  isDrawingBow: boolean;
  bowCharge: number; // 0 à 1
  isSprinting: boolean;
  isGrounded: boolean;
  isSwimming: boolean;
  isUnderwater: boolean;
  cameraMode: 'FIRST_PERSON' | 'THIRD_PERSON';
  // Système de pouvoirs Aethériques
  activePowersCount: number; // 0 à 10 (peut être 0 si le joueur a rendu les orbes)
  dashCooldown: number; // 0 si prêt
  maxDashCooldown: number;
  novaCooldown: number; // 0 si prêt
  maxNovaCooldown: number;
  endingChoice: EndingChoice;
}

export interface WorldState {
  orbsCollected: number;
  totalOrbs: number;
  timeOfDay: number; // 0 à 24 heures
  enemyTier: number; // 1 à 11 selon le nombre d'orbes
  nearestOrbDistance: number | null;
  nearestOrbAngle: number | null; // angle relatif en degrés (-180 à 180)
  orbs: OrbData[];
  enemies: EnemyData[];
  camps: CampData[];
  lootPickups: LootPickupData[];
  boss: BossData;
}

export interface SaveSlotData {
  slotId: number;
  name: string;
  updatedAt: number;
  orbsCollected: number;
  totalOrbs: number;
  timeOfDay: number;
  playerPos: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  cameraMode: 'FIRST_PERSON' | 'THIRD_PERSON';
  orbs: OrbData[];
  health?: number;
  arrows?: number;
  equippedWeapon?: WeaponType;
  endingChoice?: EndingChoice;
  bossActive?: boolean;
  bossDefeated?: boolean;
  bossHp?: number;
}

export type GameScreen =
  | 'MAIN_MENU'
  | 'INTRO_CUTSCENE'
  | 'PLAYING'
  | 'PAUSED'
  | 'BOSS_CUTSCENE'
  | 'OUTRO_CUTSCENE'
  | 'CLASH_CUTSCENE'
  | 'COLLAPSE_BREAKTHROUGH'
  | 'GAME_OVER'
  | 'VICTORY';
