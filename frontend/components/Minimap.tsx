import React, { useEffect, useRef, useState } from 'react';
import {
  OrbData,
  PlayerStats,
  EnemyData,
  CampData,
  LootPickupData,
  BossData,
} from '../types';
import { getTerrainHeight, pseudoRandom, WORLD_SIZE } from '../utils/noise';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface MinimapProps {
  player: PlayerStats;
  orbs: OrbData[];
  enemies: EnemyData[];
  camps: CampData[];
  lootPickups: LootPickupData[];
  boss: BossData;
}

const MAP_TEX_SIZE = 420;

let cachedTerrainCanvas: HTMLCanvasElement | null = null;

function getOrGenerateTerrainMap(): HTMLCanvasElement {
  if (cachedTerrainCanvas) return cachedTerrainCanvas;

  const offscreen = document.createElement('canvas');
  offscreen.width = MAP_TEX_SIZE;
  offscreen.height = MAP_TEX_SIZE;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return offscreen;

  const imgData = ctx.createImageData(MAP_TEX_SIZE, MAP_TEX_SIZE);
  const data = imgData.data;

  for (let py = 0; py < MAP_TEX_SIZE; py++) {
    const wz = (py / MAP_TEX_SIZE - 0.5) * WORLD_SIZE;
    for (let px = 0; px < MAP_TEX_SIZE; px++) {
      const wx = (px / MAP_TEX_SIZE - 0.5) * WORLD_SIZE;

      const h = getTerrainHeight(wx, wz);
      const hEast = getTerrainHeight(wx + 2.5, wz);
      const hSouth = getTerrainHeight(wx, wz + 2.5);
      const dx = (hEast - h) / 2.5;
      const dz = (hSouth - h) / 2.5;
      const slope = Math.sqrt(dx * dx + dz * dz);

      let r = 0;
      let g = 0;
      let b = 0;

      if (h < -6.5) {
        const depthFactor = Math.max(0, Math.min(1, (h + 14) / 7.5));
        r = 12 + depthFactor * 22;
        g = 85 + depthFactor * 65;
        b = 155 + depthFactor * 60;

        if (h > -7.2) {
          r += 35;
          g += 45;
          b += 40;
        }
      } else {
        if (h < -5.2) {
          r = 212;
          g = 172;
          b = 118;
        } else if (slope > 0.78) {
          r = 75;
          g = 88;
          b = 104;
        } else if (h < 9) {
          r = 46;
          g = 112;
          b = 82;
        } else if (h < 22) {
          r = 66;
          g = 142;
          b = 106;
        } else if (h < 32) {
          r = 108;
          g = 122;
          b = 138;
        } else {
          r = 236;
          g = 242;
          b = 248;
        }

        const shade = (dx + dz) * 26;
        r = Math.max(15, Math.min(255, r - shade));
        g = Math.max(15, Math.min(255, g - shade));
        b = Math.max(15, Math.min(255, b - shade));

        const contourMod = ((h % 6) + 6) % 6;
        if (contourMod < 0.28 && h > -4.5) {
          r *= 0.84;
          g *= 0.84;
          b *= 0.84;
        }
      }

      const idx = (py * MAP_TEX_SIZE + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  ctx.fillStyle = 'rgba(20, 62, 44, 0.55)';
  let placedTrees = 0;
  let attempt = 0;
  const TREE_COUNT = 900;
  while (placedTrees < TREE_COUNT && attempt < TREE_COUNT * 4) {
    attempt++;
    const tx = (pseudoRandom(attempt * 3.1) - 0.5) * (WORLD_SIZE - 70);
    const tz = (pseudoRandom(attempt * 7.7) - 0.5) * (WORLD_SIZE - 70);
    if (Math.hypot(tx, tz) < 18) continue;

    const ty = getTerrainHeight(tx, tz);
    if (ty < -4.5 || ty > 27) continue;

    const mapX = (tx / WORLD_SIZE + 0.5) * MAP_TEX_SIZE;
    const mapY = (tz / WORLD_SIZE + 0.5) * MAP_TEX_SIZE;
    ctx.beginPath();
    ctx.arc(mapX, mapY, 1.3, 0, Math.PI * 2);
    ctx.fill();
    placedTrees++;
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  const step = MAP_TEX_SIZE / 10;
  for (let i = 1; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, MAP_TEX_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(MAP_TEX_SIZE, i * step);
    ctx.stroke();
  }

  cachedTerrainCanvas = offscreen;
  return offscreen;
}

export const Minimap: React.FC<MinimapProps> = ({
  player,
  orbs,
  enemies,
  camps,
  lootPickups,
  boss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomOut, setZoomOut] = useState(false);

  const radarRangeMeters = zoomOut ? 300 : 175;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const terrainMap = getOrGenerateTerrainMap();
    const size = canvas.width;
    const half = size / 2;
    const headingRad = (player.heading * Math.PI) / 180;

    ctx.clearRect(0, 0, size, size);

    const pixelsPerMeter = half / radarRangeMeters;
    const texPixelsPerMeter = MAP_TEX_SIZE / WORLD_SIZE;
    const mapScale = pixelsPerMeter / texPixelsPerMeter;

    const playerTexX = (player.x / WORLD_SIZE + 0.5) * MAP_TEX_SIZE;
    const playerTexY = (player.z / WORLD_SIZE + 0.5) * MAP_TEX_SIZE;

    // 1. DESSIN DU TERRAIN TOPOGRAPHIQUE ROTATIF
    ctx.save();
    ctx.fillStyle = '#0f2942';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(half, half);
    ctx.rotate(-headingRad);
    ctx.scale(mapScale, mapScale);
    ctx.drawImage(terrainMap, -playerTexX, -playerTexY);
    ctx.restore();

    // 2. CÔNE DE VISION DU JOUEUR
    ctx.save();
    const grad = ctx.createRadialGradient(half, half, 4, half, half, half * 0.78);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(half, half);
    ctx.arc(half, half, half * 0.78, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. CAMPS ENNEMIS
    camps.forEach((camp) => {
      const dx = camp.x - player.x;
      const dz = camp.z - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist > radarRangeMeters * 0.95) return;

      const worldAngle = Math.atan2(dx, -dz);
      const relAngle = worldAngle - headingRad;
      const rPx = dist * pixelsPerMeter;
      const cx = half + Math.sin(relAngle) * rPx;
      const cy = half - Math.cos(relAngle) * rPx;

      ctx.save();
      ctx.fillStyle = 'rgba(249, 115, 22, 0.28)';
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // 4. CAISSES DE FLÈCHES / BUTIN
    lootPickups.forEach((loot) => {
      if (loot.collected) return;
      const dx = loot.x - player.x;
      const dz = loot.z - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist > radarRangeMeters * 0.9) return;

      const worldAngle = Math.atan2(dx, -dz);
      const relAngle = worldAngle - headingRad;
      const rPx = dist * pixelsPerMeter;
      const lx = half + Math.sin(relAngle) * rPx;
      const ly = half - Math.cos(relAngle) * rPx;

      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1;
      ctx.fillRect(lx - 2.5, ly - 2.5, 5, 5);
      ctx.strokeRect(lx - 2.5, ly - 2.5, 5, 5);
      ctx.restore();
    });

    // 5. ENNEMIS ACTIFS
    enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      const dx = enemy.x - player.x;
      const dz = enemy.z - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist > radarRangeMeters * 0.92) return;

      const worldAngle = Math.atan2(dx, -dz);
      const relAngle = worldAngle - headingRad;
      const rPx = dist * pixelsPerMeter;
      const ex = half + Math.sin(relAngle) * rPx;
      const ey = half - Math.cos(relAngle) * rPx;

      ctx.save();
      ctx.fillStyle = '#f43f5e';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ex, ey, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // 6. LIGNE GPS VERS LE BOSS (SI ACTIF) OU VERS L'ORBE LA PLUS PROCHE
    if (boss.active && !boss.defeated) {
      const dx = boss.x - player.x;
      const dz = boss.z - player.z;
      const dist = Math.hypot(dx, dz);
      const worldAngle = Math.atan2(dx, -dz);
      const relAngle = worldAngle - headingRad;
      const maxBlipRadius = half - 10;
      const rPx = Math.min(dist * pixelsPerMeter, maxBlipRadius);
      const bx = half + Math.sin(relAngle) * rPx;
      const by = half - Math.cos(relAngle) * rPx;

      // Tracé GPS rouge vers le Boss
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(half, half);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();

      // Marqueur Boss géant sur la minimap
      ctx.save();
      ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e11d48';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else {
      let nearestOrb: OrbData | null = null;
      let minDist = Infinity;
      for (const o of orbs) {
        if (o.collected) continue;
        const d = Math.hypot(o.x - player.x, o.z - player.z);
        if (d < minDist) {
          minDist = d;
          nearestOrb = o;
        }
      }

      if (nearestOrb) {
        const dx = nearestOrb.x - player.x;
        const dz = nearestOrb.z - player.z;
        const worldAngle = Math.atan2(dx, -dz);
        const relAngle = worldAngle - headingRad;
        const clampedDist = Math.min(minDist, radarRangeMeters * 0.88);
        const targetX = half + Math.sin(relAngle) * (clampedDist * pixelsPerMeter);
        const targetY = half - Math.cos(relAngle) * (clampedDist * pixelsPerMeter);

        ctx.save();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.75)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(half, half);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 7. ICÔNES DES ORBES (BLIPS CYAN)
    orbs.forEach((orb) => {
      const dx = orb.x - player.x;
      const dz = orb.z - player.z;
      const dist = Math.hypot(dx, dz);

      const worldAngle = Math.atan2(dx, -dz);
      const relAngle = worldAngle - headingRad;

      if (orb.collected) {
        if (dist > radarRangeMeters * 0.9) return;
        const rPx = dist * pixelsPerMeter;
        const bx = half + Math.sin(relAngle) * rPx;
        const by = half - Math.cos(relAngle) * rPx;

        ctx.save();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.55)';
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      const maxBlipRadius = half - 10;
      const rawRadiusPx = dist * pixelsPerMeter;
      const isClamped = rawRadiusPx > maxBlipRadius;
      const rPx = Math.min(rawRadiusPx, maxBlipRadius);

      const bx = half + Math.sin(relAngle) * rPx;
      const by = half - Math.cos(relAngle) * rPx;

      ctx.save();
      if (!isClamped) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.32)';
        ctx.beginPath();
        ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = isClamped ? '#67e8f9' : '#22d3ee';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(bx, by, isClamped ? 3.8 : 4.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // 8. CURSEUR JOUEUR AU CENTRE
    ctx.save();
    ctx.translate(half, half);
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5.5, 6);
    ctx.lineTo(0, 3.2);
    ctx.lineTo(-5.5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const vignette = ctx.createRadialGradient(half, half, half * 0.72, half, half, half);
    vignette.addColorStop(0, 'rgba(2, 6, 23, 0)');
    vignette.addColorStop(1, 'rgba(2, 6, 23, 0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, size, size);
  }, [player.x, player.z, player.heading, orbs, enemies, camps, lootPickups, boss, radarRangeMeters]);

  const headingRad = (player.heading * Math.PI) / 180;
  const badgeRadius = 64;
  const northX = Math.sin(-headingRad) * badgeRadius;
  const northY = -Math.cos(-headingRad) * badgeRadius;

  return (
    <div className="relative flex items-center justify-center select-none pointer-events-auto group">
      <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-slate-950/90 border-2 border-slate-700/90 shadow-[0_8px_32px_rgba(0,0,0,0.75)] flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={160}
          height={160}
          onClick={() => setZoomOut((prev) => !prev)}
          title="Cliquer pour changer le zoom de la minimap"
          className="w-full h-full rounded-full cursor-pointer"
        />
        <div className="absolute inset-1 rounded-full border border-white/15 pointer-events-none" />
      </div>

      <div
        className="absolute z-20 w-5 h-5 rounded-full bg-slate-950 border border-amber-400/80 flex items-center justify-center text-[10px] font-black text-amber-400 shadow-md pointer-events-none"
        style={{
          transform: `translate(${northX}px, ${northY}px)`,
        }}
      >
        N
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setZoomOut((prev) => !prev);
        }}
        title={zoomOut ? 'Zoomer la carte' : 'Dézoomer la carte'}
        className="absolute -bottom-1 -left-1 z-20 w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-200 shadow-lg transition-transform hover:scale-105 cursor-pointer"
      >
        {zoomOut ? (
          <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
        ) : (
          <ZoomOut className="w-3.5 h-3.5 text-cyan-400" />
        )}
      </button>
    </div>
  );
};
