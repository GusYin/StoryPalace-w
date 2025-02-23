import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

export const useFirestoreEmulatorIfLocal = (
  db: FirebaseFirestore.Firestore
) => {
  // Connect to Firestore Emulator in development
  if (process.env.FUNCTIONS_EMULATOR) {
    db.settings({
      host: "localhost:8080",
      ssl: false,
    });
    console.log("Connected to Firestore Emulator at localhost:8080");
  }
};

export const throwIfUnauthenticated = (r: CallableRequest) => {
  if (!r.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
};
