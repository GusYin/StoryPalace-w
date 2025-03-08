// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  type Auth,
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = isSupported().then((yes) => (yes ? getAnalytics(app) : null));

// Initialize Firebase clound functions
export const functions = getFunctions(app);
if (process.env.NODE_ENV === "development") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

// Initialize Firebase Firestore
export const db = getFirestore();
if (process.env.NODE_ENV === "development") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export const auth = getAuth(app);

export const storage = getStorage(app);
if (process.env.NODE_ENV === "development") {
  // Point to the Storage emulator running on localhost.
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}

export const createUserWithEmailAndPw = async (
  email: string,
  password: string,
  username?: string
) => {
  const user = await createUserWithEmailAndPassword(auth, email, password);

  // swallow errors because we don't want to block the user from signing up
  try {
    auth.currentUser &&
      updateProfile(auth.currentUser, {
        displayName: username,
      });

    auth.currentUser && sendEmailVerification(auth.currentUser);
  } catch (err) {
    console.error(err);
  }

  return user;
};

export const verifyEmail = async (fbAuth: Auth = auth) => {
  auth.currentUser && sendEmailVerification(auth.currentUser);
};

export const signInWithEmailAndPw = async (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const sendPasswordResetLinkToEmail = async (email: string) =>
  sendPasswordResetEmail(auth, email);

export const logout = async () => await signOut(auth);
