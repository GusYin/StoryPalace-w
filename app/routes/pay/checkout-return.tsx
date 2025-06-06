import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import AuthHeader from "~/components/header-auth";
import FullScreenSpinner from "~/components/full-screen-spinner";
import { useNavigate } from "react-router";
import { TickIcon } from "~/components/icons/tick";
import { EscalationMarkIcon } from "~/components/icons/escalation-mark-icon";

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

type CheckoutStatusDisplayEntry = {
  title?: string;
  message?:
    | React.ReactNode
    | ((session: SessionStatus | null) => React.ReactNode);
  buttonText?: string;
  buttonOnClick?: (session: SessionStatus | null) => void;
  icon?: React.ComponentType;
};

export default function CheckoutReturnPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionStatus | null>(null);

  const checkoutStatusDisplay: Record<string, CheckoutStatusDisplayEntry> = {
    complete: {
      title: "Payment Successful",
      message: (session) => (
        <>
          <p className="mb-1">Thank you for subscribing to Story Palace.</p>
          <p className="text-sm text-gray-500">
            A confirmation has been sent to {session?.customerEmail ?? ""}
          </p>
        </>
      ),
      buttonText: "Explore Library",
      buttonOnClick: () => navigate("/library"),
      icon: TickIcon,
    },
    expired: {
      title: "Payment Expired",
      message: "Your payment session has expired. Please try again.",
      buttonText: "Resubmit Payment",
      icon: EscalationMarkIcon,
      buttonOnClick: (session) =>
        navigate(
          `/payment/${session?.planDetails.plan}/${session?.planDetails.billingCycle}`
        ),
    },
    open: {
      title: "Payment Open",
      message: "Your payment is still open. Please submit your payment again.",
      buttonText: "Resubmit Payment",
      icon: EscalationMarkIcon,
      buttonOnClick: (session) =>
        navigate(
          `/payment/${session?.planDetails.plan}/${session?.planDetails.billingCycle}`
        ),
    },
    error: {
      title: "Payment Failed",
      message: "Your payment failed. Please choose your subscription again.",
      icon: EscalationMarkIcon,
      buttonText: "Go to Pricing",
      buttonOnClick: () => navigate("/pricing"),
    },
  };

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

  const displayKey = error ? "error" : session?.status || "error";
  const displayConfig = checkoutStatusDisplay[displayKey];

  return (
    <div className="min-h-screen bg-white">
      <AuthHeader />

      <main className="font-dosis text-xl text-black flex items-center justify-center">
        <FullScreenSpinner loading={loading} />

        {!loading && displayConfig && (
          <div className="w-full max-w-[390px] md:h-[346px] mt-15">
            <div className="text-black text-center mb-8 flex flex-col items-center">
              {displayConfig.icon && <displayConfig.icon />}
              <h1 className="font-semibold font-fraunces text-4xl text-center mt-15 mb-5">
                {displayConfig.title}
              </h1>

              <div className="mb-[150px]">
                {typeof displayConfig.message === "function"
                  ? displayConfig.message(session)
                  : displayConfig.message}
              </div>

              <button
                onClick={() => displayConfig.buttonOnClick?.(session)}
                className="w-full bg-custom-teal text-white py-4 rounded-4xl hover:bg-[#056955] transition-colors font-normal"
              >
                {displayConfig.buttonText}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
