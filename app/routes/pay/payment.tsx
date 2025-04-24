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
    monthly: 19.99,
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-teal"></div>
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

      <main className="font-dosis text-xl text-black flex flex-col items-center justify-center">
        <div className="w-full max-w-[500px] mt-12 px-[30px]">
          <h1 className="font-semibold text-start mb-8">ORDER SUMMARY</h1>

          {/* Plan Details */}
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
        <div className="rounded-2xl bg-container-grey w-full max-w-[500px] mt-12 p-[30px]">
          <h1 className="font-semibold text-start mb-[30px]">
            CARD INFORMATION
          </h1>

          <div className="space-y-[40px] mb-[30px] text-xl font-dosis">
            <label>Card number</label>
            <div className="h-17 mt-1">
              <input
                id="cardNumber"
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="bg-custom-bg-light leading-[32px] w-full h-full font-medium placeholder-custom-text-grey appearance-none px-5 py-2 border border-custom-stroke-grey rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                maxLength={16}
              />{" "}
            </div>

            <div className="grid grid-cols-2 gap-10">
              <div>
                <label>Expiry date</label>
                <div className="h-17 mt-1">
                  <input
                    id="expiryDate"
                    type="text"
                    placeholder="MM/YY"
                    className="bg-custom-bg-light leading-[32px] w-full h-full font-medium placeholder-custom-text-grey appearance-none px-5 py-2 border border-custom-stroke-grey rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    maxLength={5}
                  />
                </div>
              </div>
              <div>
                <label>CVV code</label>
                <div className="h-17 mt-1">
                  <input
                    type="password"
                    placeholder="XXX"
                    className="bg-custom-bg-light leading-[32px] w-full h-full font-medium placeholder-custom-text-grey appearance-none px-5 py-2 border border-custom-stroke-grey rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    maxLength={3}
                  />
                </div>
              </div>
            </div>

            <label>Name on card</label>
            <div className="h-17 mt-1">
              <input
                id="nameOnCard"
                type="text"
                className="bg-custom-bg-light leading-[32px] w-full h-full font-medium placeholder-custom-text-grey appearance-none px-5 py-2 border border-custom-stroke-grey rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <ButtonWithLoading
            isLoading={isSubscribing}
            onClick={pay}
            className="w-full bg-custom-teal text-white py-4 rounded-4xl hover:bg-[#056955] transition-colors"
          >
            Pay
          </ButtonWithLoading>
        </div>
      </main>
    </div>
  );
}
