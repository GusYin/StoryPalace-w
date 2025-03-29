import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getAuth, type User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import { toast } from "react-toastify";
import LoadingSpinner from "~/components/loading-spinner";

type SubscriptionParams = {
  plan: "basic" | "premium";
  monthlyOrYearly: "monthly" | "yearly";
};

export default function SubscribePlan() {
  const { plan, monthlyOrYearly } = useParams<SubscriptionParams>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStarted, setSubscriptionStarted] = useState(false);

  // Verify valid parameters
  const isValidPlan = plan === "basic" || plan === "premium";
  const isValidFrequency =
    monthlyOrYearly === "monthly" || monthlyOrYearly === "yearly";

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
        return;
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!isValidPlan || !isValidFrequency) {
      setError("Invalid subscription parameters");
      toast.error("Invalid subscription URL parameters");
      return;
    }

    if (user?.emailVerified && !subscriptionStarted) {
      //startSubscription();
    }
  }, [user, subscriptionStarted]);

  const startSubscription = async () => {
    try {
      setIsSubscribing(true);
      setError(null);
      toast.info("Starting subscription process...");

      const createCheckoutSession = httpsCallable(
        functions,
        "createCheckoutSession"
      );

      const result = await createCheckoutSession({
        planId: `${plan}_${monthlyOrYearly}`,
        userId: user?.uid,
        email: user?.email,
      });

      // Handle Stripe redirect
      const { sessionId } = result.data as { sessionId: string };
      toast.success("Redirecting to secure checkout...");
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
    } catch (error) {
      console.error("Subscription error:", error);
      setError("Failed to start subscription. Please try again.");
      toast.error("❌ Subscription failed. Please try again.");
    } finally {
      setIsSubscribing(false);
      setSubscriptionStarted(true);
    }
  };

  if (loading || !isValidPlan || !isValidFrequency) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
        {!isValidPlan ||
          (!isValidFrequency && (
            <p className="text-red-500 mt-4">Invalid subscription parameters</p>
          ))}
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Processing {plan?.toUpperCase()} Subscription
        </h2>
        <p className="text-gray-600 mb-6">
          You're subscribing to our {plan} plan ({monthlyOrYearly} payment).
        </p>
        {isSubscribing && <LoadingSpinner />}
      </div>
    </div>
  );
}
