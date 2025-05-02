import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import AuthHeader from "~/components/header-auth";
import { toast, ToastContainer } from "react-toastify";
import FullScreenLoadingSpinnerTeal from "~/components/loading-spinner-teal";
import { useNavigate } from "react-router";

type BillingCycle = "monthly" | "yearly";
type PlanType = "basic" | "premium";

interface SessionStatus {
  status: "open" | "complete" | "expired";
  paymentStatus: string;
  customerEmail?: string;
  planDetails: {
    plan: PlanType;
    billingCycle: BillingCycle;
  };
}

export default function CheckoutReturnPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionStatus | null>(null);

  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get("session_id");

        if (!sessionId) {
          throw new Error("Missing session ID in URL");
        }

        const getStatus = httpsCallable<{ sessionId: string }, SessionStatus>(
          functions,
          "getCheckoutSessionStatus"
        );

        const result = await getStatus({ sessionId });
        setSession(result.data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to verify payment";

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    checkSessionStatus();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <AuthHeader />

      <main className="font-dosis text-xl text-black flex items-center justify-center">
        <FullScreenLoadingSpinnerTeal loading={loading} />

        <div className="w-full max-w-[390px] md:h-[346px] mt-15">
          {session?.status === "complete" && (
            <>
              <h1 className="font-semibold font-fraunces text-4xl text-center mb-15">
                Payment Successful
              </h1>

              <p className="mb-4">
                A confirmation has been sent to{" "}
                <span className="font-semibold">{session.customerEmail}</span>
              </p>
              <div className="p-4 rounded-md">
                <p className="text-sm">
                  Payment status:{" "}
                  <span className="font-medium capitalize">
                    {session.paymentStatus}
                  </span>
                </p>
              </div>
              <button
                onClick={() => navigate("/library")}
                className="w-full bg-custom-teal text-white py-4 rounded-4xl hover:bg-[#056955] transition-colors font-normal"
              >
                Start Enjoying Your Subscription
              </button>
            </>
          )}
          {session?.status === "expired" && (
            <>
              <h1 className="font-semibold font-fraunces text-4xl text-center mb-15">
                Payment Expired
              </h1>
              <p className="mb-4">
                Your payment session has expired. Please try again.
              </p>
              <button
                onClick={() =>
                  navigate(
                    `/payment/${session.planDetails.plan}/${session.planDetails.billingCycle}`
                  )
                }
                className="w-full bg-custom-teal text-white py-4 rounded-4xl hover:bg-[#056955] transition-colors font-normal"
              >
                Resubmit Payment
              </button>
            </>
          )}
          {session?.status === "open" && (
            <>
              <h1 className="font-semibold font-fraunces text-4xl text-center mb-15">
                Payment Open
              </h1>
              <p className="mb-4">
                Your payment is still open. Please submit your payment again.
              </p>
              <button
                onClick={() =>
                  navigate(
                    `/payment/${session.planDetails.plan}/${session.planDetails.billingCycle}`
                  )
                }
                className="w-full bg-custom-teal text-white py-4 rounded-4xl hover:bg-[#056955] transition-colors font-normal"
              >
                Resubmit Payment
              </button>
            </>
          )}
          {error && (
            <>
              <h1 className="font-semibold font-fraunces text-4xl text-center mb-15">
                Payment Failed
              </h1>
              <p className="mb-4">
                {" "}
                Your payment failed. Please choose your subscription again.
              </p>
              <button
                onClick={() => navigate("/pricing")}
                className="w-full bg-custom-teal text-white py-4 rounded-4xl hover:bg-[#056955] transition-colors font-normal"
              >
                Go to Pricing
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
