import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

export const db = getFirestore();
connectFirestoreEmulator(db, "127.0.0.1", 8080);
