import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if firebase is configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app = null;
let auth = null;
let db = null;
let currentUser = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.warn('Firebase configuration is missing or incomplete. Falling back to local storage only.');
}

export { auth, db };

/**
 * Signs in the user anonymously if Firebase is configured.
 * @returns {Promise<string|null>} The user's UID or null if configuration is missing or auth fails.
 */
export async function initializeAuth() {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }

  if (currentUser) {
    return currentUser.uid;
  }

  try {
    const credential = await signInAnonymously(auth);
    currentUser = credential.user;
    console.log('Signed in anonymously to Firebase as:', currentUser.uid);
    return currentUser.uid;
  } catch (error) {
    console.error('Firebase anonymous authentication failed:', error);
    return null;
  }
}

/**
 * Gets the current authenticated user's UID.
 * @returns {string|null}
 */
export function getCurrentUid() {
  return currentUser ? currentUser.uid : null;
}

/**
 * Loads player data from Firestore.
 * @returns {Promise<object|null>}
 */
export async function loadFromFirestore() {
  const uid = getCurrentUid() || await initializeAuth();
  if (!uid || !db) {
    return null;
  }

  try {
    const docRef = doc(db, 'players', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error loading data from Firestore:', error);
    return null;
  }
}

/**
 * Saves player data to Firestore.
 * @param {object} playerData 
 * @returns {Promise<boolean>}
 */
export async function saveToFirestore(playerData) {
  const uid = getCurrentUid();
  if (!uid || !db) {
    return false;
  }

  try {
    const docRef = doc(db, 'players', uid);
    await setDoc(docRef, playerData, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving data to Firestore:', error);
    return false;
  }
}

/**
 * Resets player data in Firestore.
 * @returns {Promise<boolean>}
 */
export async function resetInFirestore() {
  const uid = getCurrentUid();
  if (!uid || !db) {
    return false;
  }

  try {
    const docRef = doc(db, 'players', uid);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting data from Firestore:', error);
    return false;
  }
}
