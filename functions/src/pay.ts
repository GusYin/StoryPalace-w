import Stripe from "stripe";
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { isUserAuthenticatedAndEmailVerified } from "./util";

const stripeSecret = process.env.STRIPE_API_SECRET_KEY!;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const checkoutReturnUrl = process.env.STRIPE_CHECKOUT_RETURN_URL!;

const createStripeClient = () =>
  new Stripe(stripeSecret, {
    typescript: true,
    apiVersion: "2025-03-31.basil" as any,
  });

type SubscriptionPlan =
  | "basic_monthly"
  | "basic_yearly"
  | "premium_monthly"
  | "premium_yearly";

type BillingCycle = "monthly" | "yearly";
type PlanType = "basic" | "premium";

const PRICE_ID_MAP = {
  basic_monthly: "price_1RHw4hH1JUbZrwFEal7Dj7kf",
  basic_yearly: "price_1RIEmHH1JUbZrwFEHmQcRouF",
  premium_monthly: "price_1RIFAHH1JUbZrwFESMAm5RGV",
  premium_yearly: "price_1RIFAHH1JUbZrwFErT9Uw6Cf",
} as const satisfies Record<SubscriptionPlan, string>;

const PRICE_ID_MAP_REVERSE: {
  [key: string]: {
    plan: PlanType;
    billingCycle: BillingCycle;
  };
} = {
  [PRICE_ID_MAP.basic_monthly]: { plan: "basic", billingCycle: "monthly" },
  [PRICE_ID_MAP.basic_yearly]: { plan: "basic", billingCycle: "yearly" },
  [PRICE_ID_MAP.premium_monthly]: { plan: "premium", billingCycle: "monthly" },
  [PRICE_ID_MAP.premium_yearly]: { plan: "premium", billingCycle: "yearly" },
};

export const createCheckoutSession = functions.https.onCall(async (request) => {
  await isUserAuthenticatedAndEmailVerified(request);

  // Input validation
  if (!request.data.planId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required parameters: planId"
    );
  }

  // check if the planId is valid
  const planId = request.data.planId as SubscriptionPlan;
  if (!PRICE_ID_MAP[planId]) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid planId: ${planId}`
    );
  }

  try {
    const stripe = createStripeClient();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: PRICE_ID_MAP[planId],
          quantity: 1,
        },
      ],
      ui_mode: "embedded",
      client_reference_id: request.auth?.uid,
      return_url: `${checkoutReturnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    });

    // Return client secret to the client
    return {
      clientSecret: session.client_secret,
    };
  } catch (error) {
    functions.logger.error("Stripe Checkout Session creation error:", error);

    let errorMessage = "Failed to create checkout session";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new functions.https.HttpsError("internal", errorMessage);
  }
});

export const stripeWebhook = functions.https.onRequest(
  async (request, response) => {
    let event: Stripe.Event = request.body;
    const endpointSecret = stripeWebhookSecret;

    const stripe = createStripeClient();

    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers["stripe-signature"] as string;
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );
      } catch (err: any) {
        console.log("⚠️ Webhook signature verification failed.", err.message);
        response
          .status(400)
          .send(`⚠️ Webhook signature verification failed: ${err.message}`);
        return;
      }
    }

    try {
      // Handle the event
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          {
            const subscription = event.data.object as Stripe.Subscription;
            const subscriptionStatus = subscription.status;

            functions.logger.log(
              `User Stripe subcription changed to ${subscriptionStatus}`
            );
          }
          break;
        case "customer.subscription.deleted":
          break;

        case "checkout.session.completed":
          {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.client_reference_id;

            if (!userId) {
              functions.logger.error("No user ID found in session");
              response.status(400).send("No user ID found");
              return;
            }

            try {
              // Get expanded line items with price and product details
              const lineItems = await stripe.checkout.sessions.listLineItems(
                session.id,
                {
                  expand: ["data.price.product"],
                }
              );

              const price = lineItems.data[0].price as Stripe.Price;
              const priceId = price.id;
              const stripeProductId =
                typeof price.product === "string"
                  ? price.product
                  : price.product?.id;

              if (!priceId || !stripeProductId) {
                functions.logger.error("Missing price or product information");
                response.status(400).send("Invalid price data");
                return;
              }

              // Get subscription details
              const stripeSubscriptionId = session.subscription as string;
              const subscription = await stripe.subscriptions.retrieve(
                stripeSubscriptionId
              );

              // Map Stripe price IDs to your plan names and billing cycles
              const planDetails = PRICE_ID_MAP_REVERSE[priceId];
              if (!planDetails) {
                functions.logger.error(`Unrecognised price ID: ${priceId}`);
                response.status(400).send("Unrecognised price ID");
                return;
              }

              // Update user document in Firestore
              const userRef = admin.firestore().collection("users").doc(userId);
              await userRef.update({
                plan: planDetails.plan,
                billingCycle: planDetails.billingCycle,
                stripeProductId: stripeProductId,
                stripeSubscriptionId: stripeSubscriptionId,
                stripeSubscriptionStatus: subscription.status,
                stripeCustomerId: session.customer,
                trialEndDate: admin.firestore.FieldValue.delete(),
                status: "active",
              });

              functions.logger.log(
                `Updated user ${userId} to plan ${planDetails.plan} with billing cycle ${planDetails.billingCycle}`
              );
            } catch (error) {
              functions.logger.error(
                "Error processing checkout session:",
                error
              );
              response.status(500).send("Error processing subscription");
              return;
            }
          }
          break;

        default:
          // Unexpected event type
          functions.logger.log(`Unhandled event type ${event.type}.`);
      }

      response.status(200).send("Webhook handled successfully");
    } catch (err) {
      functions.logger.error("Stripe Webhook error:", err);
      response
        .status(400)
        .send(
          `Stripe Webhook Error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
    }
  }
);
