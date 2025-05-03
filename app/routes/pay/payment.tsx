import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import AuthHeader from "~/components/header-auth";

type SubscriptionParams = {
  plan: "basic" | "premium";
  monthlyOrYearly: "monthly" | "yearly";
};

const PRICE_MAP = {
  basic: {
    monthly: 9.99,
    yearly: 59.88,
  },
  premium: {
    monthly: 29.99,
    yearly: 155.88,
  },
};

// Add Stripe initialization
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Update your main component export
export default function Payment() {
  const navigate = useNavigate();
  const { plan, monthlyOrYearly } = useParams<SubscriptionParams>();
  const [loading, setLoading] = useState(true);

  const isValidPlan = plan === "basic" || plan === "premium";
  const isValidFrequency =
    monthlyOrYearly === "monthly" || monthlyOrYearly === "yearly";

  const fetchClientSecret = async (): Promise<string> => {
    try {
      const createCheckoutSession = httpsCallable(
        functions,
        "createCheckoutSession"
      );
      const result = await createCheckoutSession({
        planId: `${plan}_${monthlyOrYearly}`,
      });

      const { clientSecret } = result.data as { clientSecret: string };

      return clientSecret;
    } catch (error) {
      console.error("Error create checkout session:", error);

      if (
        error instanceof Error &&
        error.message.includes("User has already subscribed")
      ) {
        toast.error(
          "You've already subscribed to this plan. Please try subscribing to a different plan."
        );
        return "";
      }

      toast.error("Failed to create checkout session. Please try again.");
      return "";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AuthHeader />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <main className="font-dosis text-xl text-black flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center mt-12">
          {isValidPlan && isValidFrequency ? (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ fetchClientSecret }}
            >
              <div className="relative rounded-2xl bg-container-grey w-full mb-12 p-[30px]">
                <h1 className="font-semibold text-center mb-[30px]">
                  ORDER SUMMARY
                </h1>
                <div className="space-y-[40px] mb-[30px] text-xl font-dosis">
                  <EmbeddedCheckout />
                </div>
              </div>
            </EmbeddedCheckoutProvider>
          ) : (
            <>
              <h1 className="text-2xl font-semibold mb-4">
                Invalid Plan or Frequency
              </h1>
              <div className="relative rounded-2xl w-full max-w-[500px] mb-12 p-[30px]">
                <p className="">
                  Invalid plan or frequency please check your selection.
                </p>
                <button
                  onClick={() => {
                    navigate("/pricing");
                  }}
                  className="mt-4 w-full bg-custom-teal text-white py-4 rounded-4xl hover:bg-[#056955] transition-colors font-normal"
                >
                  Select a Plan
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
