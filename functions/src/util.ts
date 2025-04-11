import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v2";

export const throwIfUnauthenticated = (request: CallableRequest) => {
  if (!request.auth?.uid || !request.auth?.token?.email_verified) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication and email verified required"
    );
  }
};

export const isUserAuthenticatedAndEmailVerified = async (
  request: CallableRequest
): Promise<boolean> => {
  if (!request.auth?.uid) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication and email verified required"
    );
  }

  if (request.auth?.token?.email_verified) {
    return true;
  }

  // Get fresh user record from Firebase Auth
  const authUser = await admin.auth().getUser(request.auth.uid);

  if (!authUser.emailVerified) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Email verification required"
    );
  }

  return true;
};
