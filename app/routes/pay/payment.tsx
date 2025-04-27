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
import FullScreenLoadingSpinnerTeal from "~/components/loading-spinner-teal";

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
  const { plan, monthlyOrYearly } = useParams<SubscriptionParams>();
  const [loading, setLoading] = useState(true);

  const isValidPlan = plan === "basic" || plan === "premium";
  const isValidFrequency =
    monthlyOrYearly === "monthly" || monthlyOrYearly === "yearly";
  const price = plan && monthlyOrYearly ? PRICE_MAP[plan][monthlyOrYearly] : 0;

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
      console.error("Error fetching client secret:", error);
      toast.error("Failed to fetch payment details. Please try again.");
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
        <div className="w-full max-w-[500px] mt-12 px-[30px]">
          <h1 className="font-semibold text-start mb-8">ORDER SUMMARY</h1>

          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold capitalize">{plan} Plan</h2>
              <p className="leading-[32px] font-light">
                {monthlyOrYearly === "yearly"
                  ? "Yearly Subscription"
                  : "Monthly Subscription"}
              </p>
            </div>
            <div>
              <h2 className="invisible font-bold capitalize">d</h2>
              <span className="leading-[32px] font-light">${price}</span>
            </div>
          </div>
        </div>
        <FullScreenLoadingSpinnerTeal loading={loading} />
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret }}
        >
          <div className="relative rounded-2xl bg-container-grey w-full max-w-[500px] mt-12 mb-12 p-[30px]">
            <h1 className="font-semibold text-start mb-[30px]">
              CARD INFORMATION
            </h1>
            <div className="space-y-[40px] mb-[30px] text-xl font-dosis">
              <EmbeddedCheckout />
            </div>
          </div>
        </EmbeddedCheckoutProvider>
      </main>
    </div>
  );
}
