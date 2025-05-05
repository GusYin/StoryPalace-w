import * as functionsV2 from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as functionsV1 from "firebase-functions/v1";
import { isUserAuthenticatedAndEmailVerified } from "./util";

export interface UserData {
  plan: "free" | "basic" | "premium";
  billingCycle?: "monthly" | "yearly";
  stripeProductId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  stripeCustomerId?: string;
  stripeSubscriptionUnpaidSince?: admin.firestore.Timestamp;
  trialEndDate?: admin.firestore.Timestamp;
  email: string;
  displayName: string;
  status: string;
  reactivatedAt?: admin.firestore.FieldValue;
  createdAt: admin.firestore.FieldValue;
  deletedAt?: admin.firestore.FieldValue;
}

export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  try {
    const usersRef = admin.firestore().collection("users");

    let email = user.email;
    let displayName = user.displayName;

    if (!email || !displayName) {
      const authUser = await admin.auth().getUser(user.uid);
      email = authUser.email || "";
      displayName = authUser.displayName || "Anonymous";
    }

    // Check for existing deleted accounts with the same email
    const querySnapshot = await usersRef
      .where("email", "==", email)
      .where("status", "==", "deleted")
      .limit(1)
      .get();

    const isReturningUser = !querySnapshot.empty;

    const userData: UserData = {
      plan: "free",
      email: email,
      displayName: displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: isReturningUser ? "reactivated" : "active",
    };

    // Add reactivation timestamp if returning
    if (isReturningUser) {
      userData.reactivatedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    // Create/update the user document
    await usersRef.doc(user.uid).set(userData);

    console.log(`User ${user.uid} created with status: ${userData.status}`);
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
});

// Handle user deletion
export const onUserDelete = functionsV1.auth.user().onDelete(async (user) => {
  try {
    // if user is not in db, below line will create a new document
    // under users collection and set the status to deleted
    const userDoc = admin.firestore().collection("users").doc(user.uid);

    // Mark as deleted but keep the document
    await userDoc.set(
      {
        status: "deleted",
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`User ${user.uid} marked as deleted.`);
  } catch (error) {
    console.error("Error handling user deletion:", error);
    throw error;
  }
});

interface PlanResponse {
  plan: string;
  billingCycle?: "monthly" | "yearly";
  trialEndDate?: admin.firestore.Timestamp;
}

export const getUserPlanDocument = async (uid?: string) => {
  try {
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(uid || "")
      .get();

    if (!userDoc.exists) {
      throw new functionsV2.https.HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data() as UserData;
    return {
      plan: userData.plan,
      billingCycle: userData.billingCycle,
      stripeSubscriptionStatus: userData.stripeSubscriptionStatus,
      trialEndDate: userData.trialEndDate,
    };
  } catch (error) {
    functionsV2.logger.error("Error fetching user plan:", error);
    throw new functionsV2.https.HttpsError(
      "internal",
      "Failed to fetch user plan"
    );
  }
};

export const getUserPlan = functionsV2.https.onCall(
  async (request): Promise<PlanResponse> => {
    await isUserAuthenticatedAndEmailVerified(request);

    return await getUserPlanDocument(request.auth?.uid);
  }
);
