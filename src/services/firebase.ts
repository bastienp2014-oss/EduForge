import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

export let appCheck: AppCheck | undefined;

// Configuration de App Check avec reCAPTCHA v3
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  if (import.meta.env.DEV) {
    // Active le mode debug en développement
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
}

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
export const db = initializeFirestore(app, {
  localCache: undefined,
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || undefined);
export const storage = getStorage(app);
