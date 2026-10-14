// Implémentation pure JS rapide et déterministe d'un bruit Simplex/Value 2D multi-octaves (FBM)
class FastSimplexNoise {
  private perm: Uint8Array;

  constructor(seed = 1337) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) !== 0 ? -u : u) + ((h & 2) !== 0 ? -2.0 * v : 2.0 * v);
  }

  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const A = this.perm[X] + Y;
    const B = this.perm[X + 1] + Y;

    const res = this.lerp(
      v,
      this.lerp(u, this.grad(this.perm[A], x, y), this.grad(this.perm[B], x - 1, y)),
      this.lerp(
        u,
        this.grad(this.perm[A + 1], x, y - 1),
        this.grad(this.perm[B + 1], x - 1, y - 1)
      )
    );
    return res * 0.5;
  }
}

const noiseGen = new FastSimplexNoise(42069);

export const WORLD_SIZE = 700;
export const WORLD_HALF = WORLD_SIZE / 2;
export const WATER_LEVEL = -6.5;

/**
 * Calcule la hauteur exacte et parfaitement continue (C1) du terrain en tout point (x, z)
 * Comprend des vallées profondes (lacs navigables sous l'eau), des collines et des montagnes
 */
export function getTerrainHeight(x: number, z: number): number {
  const scale1 = 0.0045;
  const scale2 = 0.015;
  const scale3 = 0.045;

  const n1 = noiseGen.noise2D(x * scale1, z * scale1);
  const n2 = noiseGen.noise2D(x * scale2 + 100, z * scale2 + 100);
  const n3 = noiseGen.noise2D(x * scale3 - 200, z * scale3 - 200);

  let baseHeight = n1 * 42 + n2 * 11 + n3 * 2.2;

  // Creuser davantage les lits des lacs sous le niveau de l'eau (-6.5m) pour permettre une vraie plongée sous-marine
  if (baseHeight < -4.0) {
    const depthBelow = -4.0 - baseHeight;
    baseHeight = -4.0 - depthBelow * 1.45;
  }

  // Aplatissement progressif et doux au centre (zone de spawn sûre autour de 0,0)
  const distFromCenter = Math.sqrt(x * x + z * z);
  const tSpawn = Math.min(1, Math.max(0, (distFromCenter - 12) / 38));
  const smoothSpawn = tSpawn * tSpawn * (3 - 2 * tSpawn);
  baseHeight = baseHeight * smoothSpawn + 2.5 * (1 - smoothSpawn);

  // Bordures montagneuses pour délimiter naturellement l'Open World
  const edgeDist = Math.max(Math.abs(x), Math.abs(z));
  if (edgeDist > WORLD_HALF - 65) {
    const factor = (edgeDist - (WORLD_HALF - 65)) / 65;
    baseHeight += factor * factor * 55;
  }

  // Terrasses douces et 100% continues (sans saut brusque qui faisait trembler le joueur)
  if (baseHeight > 16) {
    const excess = baseHeight - 16;
    baseHeight = 16 + excess - Math.sin(excess * 0.7) * 0.65;
  }

  return baseHeight;
}

/**
 * Normale approximative du terrain par différences finies pour calculer la pente
 */
export function getTerrainSlope(x: number, z: number): number {
  const eps = 0.6;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  const dx = (hR - hL) / (2 * eps);
  const dz = (hU - hD) / (2 * eps);
  return Math.sqrt(dx * dx + dz * dz);
}

export function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
