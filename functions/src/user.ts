import * as functionsV2 from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as functionsV1 from "firebase-functions/v1";

interface UserData {
  plan: string;
  trialEndDate?: admin.firestore.Timestamp;
  email: string;
  displayName: string;
  createdAt: admin.firestore.FieldValue;
}

export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  try {
    const userData: UserData = {
      plan: "free",
      email: user.email || "",
      displayName: user.displayName || "Anonymous",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection("users").doc(user.uid).set(userData);
    console.log(`User ${user.uid} document created successfully.`);
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
});

interface PlanResponse {
  plan: string;
  trialEndDate?: admin.firestore.Timestamp;
}

export const getUserPlan = functionsV2.https.onCall(
  async (request): Promise<PlanResponse> => {
    if (!request.auth?.uid) {
      throw new functionsV2.https.HttpsError(
        "unauthenticated",
        "Authentication required"
      );
    }

    try {
      // Get fresh user record from Firebase Auth
      const authUser = await admin.auth().getUser(request.auth.uid);

      if (!authUser.emailVerified) {
        throw new functionsV2.https.HttpsError(
          "unauthenticated",
          "Email verification required"
        );
      }

      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(request.auth.uid)
        .get();

      if (!userDoc.exists) {
        throw new functionsV2.https.HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data() as UserData;
      return {
        plan: userData.plan || "free",
        trialEndDate: userData.trialEndDate,
      };
    } catch (error) {
      functionsV2.logger.error("Error fetching user plan:", error);
      throw new functionsV2.https.HttpsError(
        "internal",
        "Failed to fetch user plan"
      );
    }
  }
);

// functions/src/index.ts
export const upgradePlan = functionsV2.https.onCall(async (request) => {
  if (!request.auth || !request.auth.token.email_verified) {
    throw new functionsV2.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const { plan } = request.data;
  if (!["basic", "premium"].includes(plan)) {
    throw new functionsV2.https.HttpsError("invalid-argument", "Invalid plan");
  }

  // Add payment verification logic here
  const paymentValid = await verifyPayment(request.auth.uid, plan);

  if (!paymentValid) {
    throw new functionsV2.https.HttpsError(
      "permission-denied",
      "Payment verification failed"
    );
  }

  await admin
    .firestore()
    .collection("users")
    .doc(request.auth.uid)
    .update({
      plan,
      trialEndDate:
        plan === "basic"
          ? admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 7 * 86400000)
            )
          : null,
    });

  return { status: "success", newPlan: plan };
});

async function verifyPayment(uid: string, plan: string): Promise<boolean> {
  // Simulate payment verification logic
  // In a real-world scenario, this would involve calling a payment gateway API
  console.log(`Verifying payment for user ${uid} and plan ${plan}`);

  // For demonstration purposes, assume payment is always valid
  return true;
}
