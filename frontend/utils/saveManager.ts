import { SaveSlotData } from '../types';

const DEFAULT_NAMESPACE = 'aetheria_exe';
let activeNamespace = DEFAULT_NAMESPACE;

function sanitizeNamespace(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 64);
  return cleaned.length > 0 ? cleaned : DEFAULT_NAMESPACE;
}

export function setStorageNamespace(namespace?: string): string {
  activeNamespace = sanitizeNamespace(namespace || DEFAULT_NAMESPACE);
  return activeNamespace;
}

export function getStorageNamespace(): string {
  return activeNamespace;
}

function getSavesKey(): string {
  return `${activeNamespace}_saves_v1`;
}

function getProgressionKey(): string {
  return `${activeNamespace}_progression_v1`;
}

export interface PersistentProgressionState {
  badEndingCompleted: boolean;
  goodEndingCompleted: boolean;
  secretDesktopEndingCompleted: boolean;
  secretEpilogueEndingCompleted: boolean;
  totalPlayTimeSec: number;
}

const DEFAULT_PROGRESSION: PersistentProgressionState = {
  badEndingCompleted: false,
  goodEndingCompleted: false,
  secretDesktopEndingCompleted: false,
  secretEpilogueEndingCompleted: false,
  totalPlayTimeSec: 0,
};

export const SaveManager = {
  getState(): PersistentProgressionState {
    try {
      const raw = localStorage.getItem(getProgressionKey());
      const parsed = raw ? JSON.parse(raw) : {};
      const totalPlayTimeSec = Number(parsed?.totalPlayTimeSec);
      return {
        badEndingCompleted: Boolean(parsed?.badEndingCompleted),
        goodEndingCompleted: Boolean(parsed?.goodEndingCompleted),
        secretDesktopEndingCompleted: Boolean(parsed?.secretDesktopEndingCompleted),
        secretEpilogueEndingCompleted: Boolean(parsed?.secretEpilogueEndingCompleted),
        totalPlayTimeSec:
          Number.isFinite(totalPlayTimeSec) && totalPlayTimeSec > 0
            ? Math.floor(totalPlayTimeSec)
            : 0,
      };
    } catch {
      return { ...DEFAULT_PROGRESSION };
    }
  },

  saveState(state: PersistentProgressionState): void {
    try {
      const normalized: PersistentProgressionState = {
        badEndingCompleted: Boolean(state.badEndingCompleted),
        goodEndingCompleted: Boolean(state.goodEndingCompleted),
        secretDesktopEndingCompleted: Boolean(state.secretDesktopEndingCompleted),
        secretEpilogueEndingCompleted: Boolean(state.secretEpilogueEndingCompleted),
        totalPlayTimeSec: Math.max(0, Math.floor(Number(state.totalPlayTimeSec) || 0)),
      };
      localStorage.setItem(getProgressionKey(), JSON.stringify(normalized));
    } catch {}
  },

  setBadEndingCompleted(completed = true): PersistentProgressionState {
    const current = this.getState();
    const next: PersistentProgressionState = {
      ...current,
      badEndingCompleted: completed,
    };
    this.saveState(next);
    return next;
  },

  setGoodEndingCompleted(completed = true): PersistentProgressionState {
    const current = this.getState();
    const next: PersistentProgressionState = {
      ...current,
      goodEndingCompleted: completed,
    };
    this.saveState(next);
    return next;
  },

  setSecretDesktopEndingCompleted(completed = true): PersistentProgressionState {
    const current = this.getState();
    const next: PersistentProgressionState = {
      ...current,
      secretDesktopEndingCompleted: completed,
    };
    this.saveState(next);
    return next;
  },

  setSecretEpilogueEndingCompleted(completed = true): PersistentProgressionState {
    const current = this.getState();
    const next: PersistentProgressionState = {
      ...current,
      secretEpilogueEndingCompleted: completed,
    };
    this.saveState(next);
    return next;
  },

  addPlayTime(deltaSec: number): PersistentProgressionState {
    const cleanDelta = Math.max(0, Math.floor(Number(deltaSec) || 0));
    const current = this.getState();
    if (cleanDelta <= 0) return current;
    const next: PersistentProgressionState = {
      ...current,
      totalPlayTimeSec: current.totalPlayTimeSec + cleanDelta,
    };
    this.saveState(next);
    return next;
  },

  isBadEndingCompleted(): boolean {
    return this.getState().badEndingCompleted;
  },

  isGoodEndingCompleted(): boolean {
    return this.getState().goodEndingCompleted;
  },

  resetAllSaves(): PersistentProgressionState {
    try {
      localStorage.removeItem(getSavesKey());
      localStorage.removeItem(getProgressionKey());
    } catch {}
    return { ...DEFAULT_PROGRESSION };
  },
};

export function getAllSaves(): Record<number, SaveSlotData | null> {
  try {
    const raw = localStorage.getItem(getSavesKey());
    if (!raw) {
      return { 1: null, 2: null, 3: null };
    }
    const parsed = JSON.parse(raw);
    return {
      1: parsed[1] || null,
      2: parsed[2] || null,
      3: parsed[3] || null,
    };
  } catch {
    return { 1: null, 2: null, 3: null };
  }
}

export function saveToSlot(
  slotId: number,
  data: Omit<SaveSlotData, 'slotId' | 'updatedAt'>
): SaveSlotData {
  const saves = getAllSaves();
  const entry: SaveSlotData = {
    ...data,
    slotId,
    updatedAt: Date.now(),
  };
  saves[slotId] = entry;
  try {
    localStorage.setItem(getSavesKey(), JSON.stringify(saves));
  } catch {}
  return entry;
}

export function deleteSaveSlot(slotId: number): void {
  const saves = getAllSaves();
  saves[slotId] = null;
  try {
    localStorage.setItem(getSavesKey(), JSON.stringify(saves));
  } catch {}
}
