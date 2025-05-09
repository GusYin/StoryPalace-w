import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

export const tempMakeAdmin = functions.https.onRequest(async (req, res) => {
  // Basic security checks
  const secretKey = process.env.TEMP_MAKE_ADMIN_SECRET_KEY;

  // Validate request
  if (req.query.key !== secretKey) {
    res.status(403).send("Unauthorized");
    return;
  }

  const uid = req.query.uid as string;

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    res.send(`User ${uid} granted admin privileges`);
  } catch (error) {
    res.status(500).send("Error setting claims: " + error);
  }
});
