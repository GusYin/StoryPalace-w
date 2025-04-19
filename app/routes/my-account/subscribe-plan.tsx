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

      {/* Order summary content */}
      <main className="font-dosis text-black flex items-center justify-center">
        <div className="w-full max-w-[390px] md:h-[346px] mt-15">
          <h1 className="font-semibold font-fraunces text-4xl text-center mb-15">
            Order Summary
          </h1>

          {/* Plan info container */}
          <div className="p-5 pt-0 flex flex-col justify-between">
            {/* Plan details */}
            <div className="mb-5 grid grid-cols-[2fr_1fr] gap-x-8 items-baseline">
              {/* Product Details Column - Now 2/3 of the space */}
              <div className="text-xl flex flex-col">
                <span className="font-medium text-custom-text-grey mb-1">
                  PRODUCT DETAILS
                </span>
                <div className="mt-7">
                  <span className="capitalize-plan font-semibold">
                    {plan} Plan
                  </span>
                  <p className="leading-[32px] mt-1 font-light">
                    {monthlyOrYearly === "yearly"
                      ? "Yearly Subscription"
                      : "Monthly Subscription"}
                  </p>
                </div>
              </div>

              {/* Price Column - Now 1/3 of the space */}
              <div className="text-xl flex flex-col items-end">
                <span className="font-medium text-custom-text-grey mb-1">
                  PRICE
                </span>
                <div className="mt-7 flex flex-col items-end">
                  {/* Matching spacer */}
                  <div className="invisible">dummy text</div>
                  <p className="leading-[32px] font-light mt-1">${price}</p>
                </div>
              </div>
            </div>

            {/* Total container */}
            <div className="mt-12">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">
                  TOTAL
                </span>
                <span className="text-lg font-semibold text-gray-800">
                  ${price}
                </span>
              </div>
            </div>

            {/* Checkout button */}
            <ButtonWithLoading
              isLoading={isSubscribing}
              onClick={startSubscription}
              className="w-full bg-[#06846f] text-white py-4 rounded-lg hover:bg-[#056955] transition-colors font-semibold text-lg"
            >
              Checkout
            </ButtonWithLoading>
          </div>
        </div>
      </main>
    </div>
  );
}
