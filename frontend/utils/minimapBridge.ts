import * as THREE from 'three';
import { OrbData, CampData } from '../types';
import { EnemyInstance3D, BossInstance3D, LootPickup3D } from './combatModels';

export interface LiveMinimapData {
  playerPos: THREE.Vector3;
  yaw: number;
  orbs: OrbData[];
  camps: CampData[];
  enemies: EnemyInstance3D[];
  lootPickups: LootPickup3D[];
  boss: BossInstance3D | null;
}

type MinimapRenderCallback = (data: LiveMinimapData) => void;

let activeMinimapCallback: MinimapRenderCallback | null = null;

export function registerMinimapRenderer(callback: MinimapRenderCallback | null) {
  activeMinimapCallback = callback;
}

export function renderMinimapFrame(data: LiveMinimapData) {
  if (activeMinimapCallback) {
    activeMinimapCallback(data);
  }
}
