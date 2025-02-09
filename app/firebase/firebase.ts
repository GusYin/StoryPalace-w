// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
  type Auth,
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
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
const app = initializeApp(firebaseConfig);
const analytics = isSupported().then((yes) => (yes ? getAnalytics(app) : null));
export const auth = getAuth(app);

export const createUserWithEmailAndPw = async (
  email: string,
  password: string,
  username?: string,
  fbAuth: Auth = auth
) => {
  await createUserWithEmailAndPassword(fbAuth, email, password);

  fbAuth.currentUser &&
    updateProfile(fbAuth.currentUser, {
      displayName: username,
    })
      .then(() => {})
      .catch((err) => {
        console.error(err);
      });
};

export const signInWithEmailAndPw = async (
  email: string,
  password: string,
  fbAuth: Auth = auth
) => signInWithEmailAndPassword(fbAuth, email, password);
