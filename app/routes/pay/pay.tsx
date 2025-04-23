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
    monthly: 9.99,
    yearly: 59.88,
  },
  premium: {
    monthly: 29.99,
    yearly: 155.88,
  },
};

export default function Pay() {
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

  const checkout = async () => {
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

      {/* Order summary content */}
      <main className="font-dosis text-black flex items-center justify-center">
        <div className="w-full max-w-[390px] md:h-[346px] mt-15">
          <h1 className="font-semibold font-fraunces text-4xl text-center mb-15">
            Order Summary
          </h1>

          {/* Plan info container */}
          <div className="text-xl pt-0 flex flex-col justify-between">
            {/* Plan details */}
            <div className="p-5 grid grid-cols-[4fr_1fr] gap-x-8 items-baseline">
              {/* Product Details Column - Now 1/4 of the space */}
              <div className="flex flex-col">
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

              {/* Price Column - Now 1/4 of the space */}
              <div className="flex flex-col">
                <span className="font-medium text-custom-text-grey mb-1">
                  PRICE
                </span>
                <div className="mt-7">
                  {/* Matching spacer */}
                  <span className="invisible font-semibold">d</span>
                  <p className="leading-[32px] font-light mt-1">${price}</p>
                </div>
              </div>
            </div>

            {/* Total container */}
            <div className="p-5 mt-12 bg-container-grey rounded-2xl">
              <div className="grid grid-cols-[4fr_1fr] items-baseline">
                <div className="flex flex-col mb-5">
                  <span className="leading-[32px] font-semibold">TOTAL</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">${price}</span>
                </div>
              </div>

              {/* Checkout button */}
              <ButtonWithLoading
                isLoading={isSubscribing}
                onClick={checkout}
                className="w-full bg-custom-teal text-white py-4 rounded-4xl hover:bg-[#056955] transition-colors font-normal"
              >
                Checkout
              </ButtonWithLoading>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
