import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

// Public web config for the nsm-procurement-69 Firebase project. These values are
// not secrets -- access control lives in firestore.rules, not here.
export const firebaseConfig = {
  apiKey: 'AIzaSyDFgjMMCD154LQqgkHZJuSSqhcyRO0onsQ',
  authDomain: 'nsm-procurement-69.firebaseapp.com',
  projectId: 'nsm-procurement-69',
  storageBucket: 'nsm-procurement-69.firebasestorage.app',
  messagingSenderId: '379133821022',
  appId: '1:379133821022:web:2036222abe81a63f59b4cf'
};

let dbInstance = null;

/**
 * Lazily create the Firestore handle. Uses the IndexedDB-backed persistent cache so
 * the app keeps working offline and survives reloads without a round trip, and the
 * multi-tab manager so two tabs on the same machine share one cache instead of
 * fighting over it.
 */
export const getDb = () => {
  if (dbInstance) return dbInstance;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

  try {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e) {
    // Private-browsing / blocked IndexedDB: fall back to the default in-memory cache
    // so cloud sync still works for this session, just without offline persistence.
    console.warn('Persistent Firestore cache unavailable, falling back to memory cache', e);
    dbInstance = initializeFirestore(app, {});
  }

  return dbInstance;
};
