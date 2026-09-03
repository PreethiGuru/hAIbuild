import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let db: Firestore | undefined;

// Lazy on purpose: server.ts loads .env.local via dotenv in its own body,
// but ESM evaluates every imported module's top-level code first -- reading
// process.env here eagerly would run before that config() call does.
export function getDb(): Firestore {
  if (!db) {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error('VITE_FIREBASE_PROJECT_ID is not set (check .env.local)');
    }
    if (!getApps().length) {
      initializeApp({ projectId });
    }
    db = getFirestore();
  }
  return db;
}
