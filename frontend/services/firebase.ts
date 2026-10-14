import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import firebaseConfig from '../firebase/config.json';

const app = initializeApp(firebaseConfig.webAppConfig);
export const db = getFirestore(app, firebaseConfig.databaseId);
export const auth = getAuth(app);

let authReadyPromise: Promise<User | null> | null = null;

export function ensureAuthenticated(): Promise<User | null> {
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch {
          resolve(null);
        }
      }
    });
  });

  return authReadyPromise;
}
