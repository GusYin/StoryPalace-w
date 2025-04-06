import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

export const throwIfUnauthenticated = (request: CallableRequest) => {
  if (!request.auth?.uid || !request.auth?.token?.email_verified) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication and email verified required"
    );
  }
};
