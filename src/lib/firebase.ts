import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const isDummyConfig = !firebaseConfig || firebaseConfig.apiKey === 'dummy-api-key';

let app;
let db: any = null;
let auth: any = null;

if (!isDummyConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
  } catch (error) {
    console.warn("Failed to initialize Firebase SDK:", error);
  }
}

export { db, auth };
export const HAS_REAL_FIREBASE = !isDummyConfig && db !== null && auth !== null;
