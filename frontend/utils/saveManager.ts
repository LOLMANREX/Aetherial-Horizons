import { SaveSlotData } from '../types';
import { db, ensureAuthenticated } from '../services/firebase';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

const STORAGE_KEY = 'aetherial_horizons_saves_v1';
const PROGRESSION_KEY = 'aetherial_horizons_progression_v1';

export interface PersistentProgressionState {
  badEndingCompleted: boolean;
  goodEndingCompleted: boolean;
  secretDesktopEndingCompleted?: boolean;
}

export const SaveManager = {
  getState(): PersistentProgressionState {
    try {
      const raw = localStorage.getItem(PROGRESSION_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const badFlag =
        localStorage.getItem('badEndingCompleted') === 'true' ||
        Boolean(parsed.badEndingCompleted);
      const goodFlag =
        localStorage.getItem('goodEndingCompleted') === 'true' ||
        Boolean(parsed.goodEndingCompleted);
      const secretFlag =
        localStorage.getItem('secretDesktopEndingCompleted') === 'true' ||
        Boolean(parsed.secretDesktopEndingCompleted);
      return {
        badEndingCompleted: badFlag,
        goodEndingCompleted: goodFlag,
        secretDesktopEndingCompleted: secretFlag,
      };
    } catch {
      return {
        badEndingCompleted: false,
        goodEndingCompleted: false,
        secretDesktopEndingCompleted: false,
      };
    }
  },

  saveState(state: PersistentProgressionState): void {
    try {
      localStorage.setItem(PROGRESSION_KEY, JSON.stringify(state));
      localStorage.setItem('badEndingCompleted', String(state.badEndingCompleted));
      localStorage.setItem('goodEndingCompleted', String(state.goodEndingCompleted));
      localStorage.setItem(
        'secretDesktopEndingCompleted',
        String(Boolean(state.secretDesktopEndingCompleted))
      );
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

  isBadEndingCompleted(): boolean {
    return this.getState().badEndingCompleted;
  },

  isGoodEndingCompleted(): boolean {
    return this.getState().goodEndingCompleted;
  },

  resetAllSaves(): PersistentProgressionState {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PROGRESSION_KEY);
      localStorage.removeItem('badEndingCompleted');
      localStorage.removeItem('goodEndingCompleted');
      localStorage.removeItem('secretDesktopEndingCompleted');
    } catch {}
    [1, 2, 3].forEach((slotId) => {
      deleteSaveSlot(slotId);
    });
    return {
      badEndingCompleted: false,
      goodEndingCompleted: false,
      secretDesktopEndingCompleted: false,
    };
  },
};

export function getAllSaves(): Record<number, SaveSlotData | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

export async function syncSavesFromCloud(): Promise<Record<number, SaveSlotData | null>> {
  const localSaves = getAllSaves();
  try {
    const user = await ensureAuthenticated();
    if (!user) return localSaves;

    const snap = await getDocs(collection(db, 'users', user.uid, 'saves'));
    let updated = false;

    snap.forEach((docSnap) => {
      const cloudSlot = docSnap.data() as SaveSlotData;
      const slotId = cloudSlot.slotId;
      if (slotId >= 1 && slotId <= 3) {
        const localSlot = localSaves[slotId];
        if (!localSlot || cloudSlot.updatedAt > localSlot.updatedAt) {
          localSaves[slotId] = cloudSlot;
          updated = true;
        }
      }
    });

    if (updated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localSaves));
    }
  } catch {
    // Fallback transparent sur le stockage local
  }
  return localSaves;
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  } catch {
    // Ignore quota errors
  }

  // Synchronisation Cloud Firestore asynchrone non-bloquante
  ensureAuthenticated()
    .then((user) => {
      if (user) {
        return setDoc(doc(db, 'users', user.uid, 'saves', `slot_${slotId}`), entry);
      }
    })
    .catch(() => {});

  return entry;
}

export function deleteSaveSlot(slotId: number): void {
  const saves = getAllSaves();
  saves[slotId] = null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  } catch {
    // Ignore errors
  }

  ensureAuthenticated()
    .then((user) => {
      if (user) {
        return deleteDoc(doc(db, 'users', user.uid, 'saves', `slot_${slotId}`));
      }
    })
    .catch(() => {});
}
