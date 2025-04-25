import Stripe from "stripe";
import * as functions from "firebase-functions/v2";
import { CallableRequest, HttpsOptions } from "firebase-functions/v2/https";
import { isUserAuthenticatedAndEmailVerified } from "./util";

type SubscriptionPlan =
  | "basic_monthly"
  | "basic_yearly"
  | "premium_monthly"
  | "premium_yearly";

interface PaymentIntentRequest {
  planId: SubscriptionPlan;
}

interface PaymentIntentResponse {
  clientSecret: string;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

// Price mapping should match client-side PRICE_MAP
const PRICE_MAP: Record<SubscriptionPlan, number> = {
  basic_monthly: 1999, // $19.99 in cents
  basic_yearly: 5988, // $59.88 in cents
  premium_monthly: 2999, // $29.99 in cents
  premium_yearly: 15588, // $155.88 in cents
};

const calculateAmount = (planId: SubscriptionPlan): number => {
  const amount = PRICE_MAP[planId];
  if (!amount) throw new Error("Invalid subscription plan");
  return amount;
};

export const createPaymentIntent = functions.https.onCall(async (request) => {
  await isUserAuthenticatedAndEmailVerified(request);

  if (!request.data?.planId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Plan ID is required"
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculateAmount(request.data.planId),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: request.auth?.uid || "",
        planId: request.data.planId,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create payment intent"
      );
    }

    return { clientSecret: paymentIntent.client_secret };
  } catch (error) {
    console.error("Stripe error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Payment processing failed",
      (error as Error).message
    );
  }
});
