import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getAuth, type User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import { toast, ToastContainer } from "react-toastify";
import ButtonWithLoading from "~/components/button-with-loading";
import AuthHeader from "~/components/header-auth";

type SubscriptionParams = {
  plan: "basic" | "premium";
  monthlyOrYearly: "monthly" | "yearly";
};

const PRICE_MAP = {
  basic: {
    monthly: 19.99, // Updated to match screenshot price
    yearly: 59.88,
  },
  premium: {
    monthly: 29.99,
    yearly: 155.88,
  },
};

export default function Payment() {
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
    });

    return () => unsubscribe();
  }, [navigate]);

  const pay = async () => {
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

      <main className="font-dosis text-black flex items-center justify-center">
        <div className="w-full max-w-[390px] mt-8 px-4">
          <h1 className="font-semibold font-fraunces text-3xl text-center mb-8">
            Order Summary
          </h1>

          <div className="space-y-6">
            {/* Plan Details */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold capitalize">
                  {plan} Plan
                </h2>
                <p className="text-gray-600 mt-1">
                  {monthlyOrYearly === "yearly"
                    ? "Yearly Subscription"
                    : "Monthly Subscription"}
                </p>
              </div>
              <span className="text-xl font-medium">${price}</span>
            </div>

            <hr className="border-t border-gray-200" />

            {/* Total Section */}
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Total</span>
              <span className="text-xl font-semibold">${price}</span>
            </div>

            {/* Payment Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Payment Details
                </span>
              </div>
            </div>

            {/* Payment Information (Visual Only - Actual processing via Stripe) */}
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Card number
                </label>
                <div className="h-10 bg-gray-100 rounded-lg px-4 flex items-center">
                  <span className="text-gray-500">xxxx-xxxx-xxxx-xxxx</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Expiry date
                  </label>
                  <div className="h-10 bg-gray-100 rounded-lg px-4 flex items-center">
                    <span className="text-gray-500">MM/YY</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    CVV code
                  </label>
                  <div className="h-10 bg-gray-100 rounded-lg px-4 flex items-center">
                    <span className="text-gray-500">xxx</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Name on card
                </label>
                <div className="h-10 bg-gray-100 rounded-lg px-4 flex items-center">
                  <span className="text-gray-500">Pay</span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <ButtonWithLoading
              isLoading={isSubscribing}
              onClick={pay}
              className="w-full bg-custom-teal text-white py-4 rounded-xl hover:bg-[#056955] transition-colors font-medium text-lg mt-8"
            >
              Pay ${price}
            </ButtonWithLoading>
          </div>
        </div>
      </main>
    </div>
  );
}
