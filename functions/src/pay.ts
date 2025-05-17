import Stripe from "stripe";
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { isUserAuthenticatedAndEmailVerified } from "./util";
import { HttpsError } from "firebase-functions/https";

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
  basic_monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID!,
  basic_yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID!,
  premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
  premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!,
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
    const userId = request.auth?.uid as string;
    const userEmail = request.auth?.token.email;
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();

    // Double subscription prevention check
    // Check if user already signed up for the
    // the same stripe subscription and same price id
    if (userDoc.exists) {
      const userData = userDoc.data();
      const currentPriceId = PRICE_ID_MAP[planId];

      // Check if user already has this price ID in their active subscriptions
      // however, if user already has a different subscription, we don't eagerly
      // cancel it in the checkout session creation. We only cancel it after
      // the checkout session is completed i.e. payment success.
      if (userData?.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(
          userData.stripeSubscriptionId
        );

        const hasActiveSubscription = ["active", "trialing"].includes(
          subscription.status
        );
        const hasSamePrice = subscription.items.data.some(
          (item) => item.price.id === currentPriceId
        );

        if (hasActiveSubscription && hasSamePrice) {
          const planDetails = PRICE_ID_MAP_REVERSE[currentPriceId];
          throw new functions.https.HttpsError(
            "already-exists",
            `User has already subscribed to this plan: ${planDetails.plan} with billing cycle ${planDetails.billingCycle}`
          );
        }
      }
    }

    let stripeCustomerId = userDoc.data()?.stripeCustomerId;

    stripeCustomerId &&
      functions.logger.log(
        `User ${userId} has an existing Stripe customer ID: ${stripeCustomerId}`
      );

    // Create new customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { firebaseUID: userId }, // Store Firebase UID in Stripe
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID to Firestore
      await userRef.set({ stripeCustomerId }, { merge: true });

      functions.logger.log(
        `Created new Stripe customer for user ${userId}: ${stripeCustomerId}`
      );
    }

    // If not provided with an existing Stripe customer ID,
    // creating a new Stripe checkout seesion with "subscription"
    // mode will create a new customer every single time,
    // even it is the same user paying for a different subscription.
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId, // Use existing customer
      mode: "subscription",
      subscription_data: {
        metadata: {
          firebaseUID: userId,
        },
      },
      line_items: [
        {
          price: PRICE_ID_MAP[planId],
          quantity: 1,
        },
      ],
      ui_mode: "embedded",
      client_reference_id: userId,
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

interface SessionStatusResponse {
  status: string | null;
  paymentStatus: string;
  planDetails: {
    plan: PlanType;
    billingCycle: BillingCycle;
  };
  customerEmail: string | null;
}

export const getCheckoutSessionStatus = functions.https.onCall(
  async (request): Promise<SessionStatusResponse> => {
    await isUserAuthenticatedAndEmailVerified(request);

    // Validate input
    if (!request.data.sessionId) {
      throw new HttpsError("invalid-argument", "Missing session ID");
    }

    try {
      const stripe = createStripeClient();

      // Retrieve Checkout Session
      const session = await stripe.checkout.sessions.retrieve(
        request.data.sessionId
      );

      // Retrieve customer details
      const customer = await stripe.customers.retrieve(
        session.customer as string
      );

      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          expand: ["data.price"],
        }
      );

      const price = lineItems.data[0].price as Stripe.Price;
      const priceId = price.id;
      const planDetails = PRICE_ID_MAP_REVERSE[priceId];

      return {
        status: session.status,
        paymentStatus: session.payment_status,
        planDetails: planDetails,
        customerEmail: !("deleted" in customer) ? customer.email : null,
      };
    } catch (error) {
      functions.logger.error("Session status fetch failed:", error);

      throw new HttpsError(
        "internal",
        "Failed to retrieve session status",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const stripeWebhook = functions.https.onRequest(
  async (request, response) => {
    let event: Stripe.Event;
    const stripe = createStripeClient();
    const signature = request.headers["stripe-signature"] as string;

    try {
      // Use the raw buffer body for verification
      event = stripe.webhooks.constructEvent(
        request.rawBody, // This is now a Buffer
        signature,
        stripeWebhookSecret
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed.", err);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      // Handle the event
      switch (event.type) {
        // Not handle customer.subscription.deleted because it might
        // get into a race condition with checkout.session.completed.

        // When user cancels the subscription, or subscripton is cancelled
        // from the Stripe dashboard by admin. Stripe will send this event
        // and the subscription will be set to "canceled" status.
        // case "customer.subscription.deleted":
        //   {
        //     const subscription = event.data.object as Stripe.Subscription;
        //     const customerId = subscription.customer as string;

        //     // First try to get the Firebase UID from subscription metadata
        //     let userId = subscription.metadata.firebaseUID;

        //     // If not found in subscription metadata, check customer metadata
        //     if (!userId) {
        //       const customer = await stripe.customers.retrieve(customerId);

        //       // Only check customer metadata if the customer record isn't deleted
        //       if (!("deleted" in customer)) {
        //         userId = customer.metadata.firebaseUID;
        //       }
        //     }

        //     // Handle missing user ID case
        //     if (!userId) {
        //       functions.logger.error(
        //         `${event.type}.
        //         No Firebase UID found in either subscription or customer metadata`,
        //         {
        //           subscriptionId: subscription.id,
        //           customerId,
        //         }
        //       );
        //       break;
        //     }

        //     const userRef = admin.firestore().collection("users").doc(userId);
        //     const userDoc = await userRef.get();
        //     const userData = userDoc.data();

        //     // Only downgrade if the deleted subscription is the current one
        //     if (
        //       userData?.stripeSubscriptionId === subscription.id &&
        //       userData?.stripeSubscriptionStatus === "active"
        //     ) {
        //       await userRef.update({
        //         plan: "free",
        //         billingCycle: admin.firestore.FieldValue.delete(),
        //         stripeProductId: admin.firestore.FieldValue.delete(),
        //         stripeSubscriptionId: admin.firestore.FieldValue.delete(),
        //         stripeSubscriptionStatus: subscription.status,
        //         trialEndDate: admin.firestore.FieldValue.delete(),
        //       });
        //       functions.logger.log(
        //         `${event.type}. Downgraded user ${userId} to free plan due to subscription deletion`
        //       );
        //     } else {
        //       functions.logger.log(
        //         `${event.type}. Ignored deleted subscription ${subscription.id} (current: ${userData?.stripeSubscriptionId}) for user ${userId}`
        //       );
        //     }
        //   }
        //   break;
        case "checkout.session.completed":
          {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.client_reference_id;

            if (!userId) {
              functions.logger.error(
                `${event.type}. No user ID found in session`
              );
              response.status(400).send("No user ID found");
              return;
            }

            try {
              // Get user document and data
              const userRef = admin.firestore().collection("users").doc(userId);
              const userDoc = await userRef.get();
              const userData = userDoc.data();

              // Cancel existing active subscription if present
              // this subcription must be a different subscription
              // than the one that was just completed / paid.
              if (
                userData?.stripeSubscriptionId &&
                userData?.stripeSubscriptionStatus === "active"
              ) {
                try {
                  await stripe.subscriptions.cancel(
                    userData.stripeSubscriptionId
                  );
                  functions.logger.log(
                    `${event.type}. Canceled existing subscription ${userData.stripeSubscriptionId} for user ${userId}`
                  );
                } catch (error) {
                  functions.logger.error(
                    `${event.type}. Error canceling existing subscription ${userData.stripeSubscriptionId} for user ${userId}:`,
                    error
                  );
                }
              }

              // Process new subscription
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
                functions.logger.error(
                  `${event.type}. Missing price or product information`
                );
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
                functions.logger.error(
                  `${event.type}. Unrecognised price ID: ${priceId}`
                );
                response.status(400).send("Unrecognised price ID");
                return;
              }

              // Update user document in Firestore
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
                `${event.type}. Updated user ${userId} to plan ${planDetails.plan} with billing cycle ${planDetails.billingCycle}`
              );
            } catch (error) {
              functions.logger.error(
                `${event.type}. Error processing checkout session:`,
                error
              );
              response.status(500).send("Error processing subscription");
              return;
            }
          }
          break;

        // Handle failed subscription occuring payment
        case "customer.subscription.updated":
          {
            const subscription = event.data.object as Stripe.Subscription;
            const subscriptionStatus = subscription.status;

            if (subscriptionStatus === "unpaid") {
              const customerId = subscription.customer as string;

              // First try to get the Firebase UID from subscription metadata
              let userId = subscription.metadata.firebaseUID;

              // If not found in subscription metadata, check customer metadata
              if (!userId) {
                const customer = await stripe.customers.retrieve(customerId);

                // Only check customer metadata if the customer record isn't deleted
                if (!("deleted" in customer)) {
                  userId = customer.metadata.firebaseUID;
                }
              }

              // Handle missing user ID case
              if (!userId) {
                functions.logger.error(
                  `${event.type}. 
                  No Firebase UID found in either subscription or customer metadata`,
                  {
                    subscriptionId: subscription.id,
                    customerId,
                  }
                );
                break;
              }

              // https://dashboard.stripe.com/settings/billing/automatic
              // https://docs.stripe.com/billing/subscriptions/overview#failed-payments
              // when all retries are exhausted, the subscription will be set to "unpaid"

              // Handle subscription cancellation or unpaid status
              const userRef = admin.firestore().collection("users").doc(userId);
              await userRef.update({
                plan: "free",
                billingCycle: admin.firestore.FieldValue.delete(),
                stripeProductId: admin.firestore.FieldValue.delete(),
                stripeSubscriptionId: admin.firestore.FieldValue.delete(),
                stripeSubscriptionStatus: subscriptionStatus,
                stripeSubscriptionUnpaidSince: admin.firestore.Timestamp.now(),
                trialEndDate: admin.firestore.FieldValue.delete(),
              });

              functions.logger.log(
                `${event.type}. Downgraded user ${userId} to free plan due to subscription ${subscriptionStatus}`
              );
            }

            functions.logger.log(
              `${event.type}. Subscription change to ${subscription.status} for user ${subscription.metadata.firebaseUID}`
            );
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

export const cancelSubscription = functions.https.onCall(async (request) => {
  await isUserAuthenticatedAndEmailVerified(request);

  const userId = request.auth?.uid as string;
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  const userData = userDoc.data();

  if (!userData?.stripeSubscriptionId) {
    throw new functions.https.HttpsError(
      "not-found",
      "No active subscription found"
    );
  }

  try {
    const stripe = createStripeClient();

    // Cancel subscription
    const canceledSubscription = await stripe.subscriptions.cancel(
      userData.stripeSubscriptionId
    );

    functions.logger.log(
      `User: ${userId} subscription cancelled: ${canceledSubscription}`
    );

    // Update Firestore
    await admin.firestore().collection("users").doc(userId).update({
      plan: "free",
      stripeSubscriptionStatus: canceledSubscription.status,
      stripeSubscriptionId: admin.firestore.FieldValue.delete(),
      stripeProductId: admin.firestore.FieldValue.delete(),
      billingCycle: admin.firestore.FieldValue.delete(),
      trialEndDate: admin.firestore.FieldValue.delete(),
      stripeSubscriptionUnpaidSince: admin.firestore.FieldValue.delete(),
    });

    return { status: canceledSubscription.status };
  } catch (error) {
    functions.logger.error("Error canceling subscription:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to cancel subscription"
    );
  }
});
