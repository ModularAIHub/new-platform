import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import { getMessaging, isSupported as messagingSupported } from "firebase/messaging";
import { getRemoteConfig } from "firebase/remote-config";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const getFirebaseAnalytics = async () => {
  if (typeof window === 'undefined') return null;
  const supported = await analyticsSupported();
  console.log('Analytics supported:', supported); // ← add this
  return supported ? getAnalytics(app) : null;
};

export const getFirebaseMessaging = async () => {
  if (typeof window === 'undefined') return null;
  const supported = await messagingSupported();
  return supported ? getMessaging(app) : null;
};

export const getFirebaseRemoteConfig = () => {
  if (typeof window === 'undefined') return null;
  const rc = getRemoteConfig(app);
  rc.settings = {
    minimumFetchIntervalMillis: 1000 * 60 * 60,
    fetchTimeoutMillis: 10000
  };
  rc.defaultConfig = {
    linkedin_genie_enabled: false,
    meta_genie_enabled: false,
    wordpress_module_enabled: false,
    bulk_generation_limit: 10,
    show_upgrade_banner: false,
  };
  return rc;
};


export default app;