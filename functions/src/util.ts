import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

export const throwIfUnauthenticated = (r: CallableRequest) => {
  if (!r.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
};
