import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getAuth, type User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import { toast } from "react-toastify";
import ButtonWithLoading from "~/components/button-with-loading";
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

export default function SubscribePlan() {
  const { plan, monthlyOrYearly } = useParams<SubscriptionParams>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const isValidPlan = plan === "basic" || plan === "premium";
  const isValidFrequency =
    monthlyOrYearly === "monthly" || monthlyOrYearly === "yearly";
  const price = plan && monthlyOrYearly ? PRICE_MAP[plan][monthlyOrYearly] : 0;

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);

      if (!user) {
        toast.info("Please login to subscribe");
        navigate("/login");
        return;
      }

      if (!user.emailVerified) {
        toast.error("Please verify your email first");
        navigate("/verify-email");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const startSubscription = async () => {
    try {
      setIsSubscribing(true);
      setError(null);

      const createCheckoutSession = httpsCallable(
        functions,
        "createCheckoutSession"
      );
      const result = await createCheckoutSession({
        planId: `${plan}_${monthlyOrYearly}`,
        userId: user?.uid,
        email: user?.email,
      });

      const { sessionId } = result.data as { sessionId: string };
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    } catch (error) {
      console.error("Subscription error:", error);
      setError("Failed to start subscription. Please try again.");
      toast.error("❌ Subscription failed. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading || !isValidPlan || !isValidFrequency) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Subscription Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/pricing")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AuthHeader />

      {/* Order summary content - Simplified structure */}
      <main className="font-dosis p-4 flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">
            Order Summary
          </h2>

          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">{plan?.toUpperCase()} Plan</span>
              <span className="text-gray-600">${price}</span>
            </div>
            <p className="text-sm text-gray-500 text-center">
              {monthlyOrYearly === "yearly"
                ? "Yearly Subscription"
                : "Monthly Subscription"}
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 mb-8">
            <span className="font-semibold text-gray-700">TOTAL</span>
            <span className="font-semibold text-gray-700">${price}</span>
          </div>

          <ButtonWithLoading
            isLoading={isSubscribing}
            onClick={startSubscription}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Checkout
          </ButtonWithLoading>
        </div>
      </main>
    </div>
  );
}
