import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

export const tempMakeAdmin = functions.https.onRequest(async (req, res) => {
  const uid = req.query.uid as string;

  // Add security checks here (e.g., secret key validation)
  await admin.auth().setCustomUserClaims(uid, { admin: true });

  res.send(`User ${uid} is now an admin`);
});
