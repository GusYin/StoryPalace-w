import type { User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { auth } from "~/firebase/firebase";
import { BillingCycle, PricingPlan } from "~/lib/constant";
import { functions } from "~/firebase/firebase";
import { toast, ToastContainer } from "react-toastify";
import ButtonWithLoading from "~/components/button-with-loading";

export default function PricingPage() {
  const hasPremium = true;
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<{
    type: "" | "create-free" | "basic" | "premium";
    cycle?: "monthly" | "yearly";
  }>({ type: "", cycle: undefined });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserPlan = async () => {
    try {
      const getUserPlan = httpsCallable<
        {},
        { plan: "free" | "basic" | "premium"; trialEndDate?: string }
      >(functions, "getUserPlan");

      const result = await getUserPlan({});
      return result.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Toast with retry button
      toast.error(
        <div>
          Failed to fetch your plan.{" "}
          <button
            onClick={() => {
              fetchUserPlan().catch((err) =>
                console.error("Retry failed:", err)
              );
            }}
            style={{ marginLeft: "10px", fontWeight: "bold" }}
          >
            Retry
          </button>
        </div>,
        {
          autoClose: false,
          closeOnClick: false,
        }
      );
      return null;
    }
  };

  const authGuard = async (plan?: PricingPlan, cycle?: BillingCycle) => {
    if (!user) {
      if (plan && cycle) {
        const redirectPath = encodeURIComponent(
          `/subscribe-plan/${plan}/${cycle}`
        );
        navigate(`/signup?redirect=${redirectPath}`);
      } else {
        navigate("/signup");
      }
      return false;
    }

    await user.reload();

    if (!user.emailVerified) {
      if (plan && cycle) {
        // Show toast with redirect to verify email
        const redirectPath = encodeURIComponent(
          `/subscribe-plan/${plan}/${cycle}`
        );
        navigate(`/verify-email?redirect=${redirectPath}`);
      } else {
        navigate("/verify-email");
      }
      return false;
    }

    return true;
  };

  async function handleCreateFreeAccount(): Promise<void> {
    setIsLoading({ type: "create-free" });

    try {
      const isAuthed = await authGuard();
      if (isAuthed !== true) {
        return;
      }

      const userPlan = await fetchUserPlan();

      if (userPlan?.plan === PricingPlan.Free) {
        // User already has a Basic plan
        toast.info("You are already subscribed to the Free plan.");
        return;
      }

      if (userPlan?.plan === PricingPlan.Basic) {
        // User already has a Basic plan
        toast.info("You are already subscribed to the Basic plan.");
        return;
      }

      if (userPlan?.plan === PricingPlan.Premium) {
        toast.info("You are already subscribed to the Premium plan.");
        return;
      }
    } catch (error) {
      console.error("Error creating free account:", error);
    } finally {
      setIsLoading({ type: "" });
    }
  }

  async function subscribeBasicPlan(
    monthlyOrYearly: BillingCycle
  ): Promise<void> {
    setIsLoading({ type: "basic", cycle: monthlyOrYearly });

    try {
      const isAuthed = await authGuard(PricingPlan.Basic, monthlyOrYearly);
      if (!isAuthed) return;

      const userPlan = await fetchUserPlan();

      if (userPlan?.plan === PricingPlan.Basic) {
        // User already has a Basic plan
        toast.info("You are already subscribed to the Basic plan.");
        return;
      }

      if (userPlan?.plan === PricingPlan.Premium) {
        // Show confirmation toast for downgrade
        toast.warn(
          <div className="flex flex-col gap-y-4 p-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Plan Change
                </h3>
                <p className="text-gray-700">
                  Downgrading to Basic will cancel your Premium plan. Note that
                  funds paid for the Premium plan cannot be refunded.
                </p>
                <p className="text-gray-700">
                  Your Basic plan will start after the current Premium plan
                  payment cycle ends.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-auto mt-2">
              <button
                onClick={() =>
                  navigate(`/subscribe-plan/basic/${monthlyOrYearly}`)
                }
                className="cursor-pointer p-2 bg-custom-teal text-white rounded-4xl hover:bg-custom-teal-dark transition-colors font-medium whitespace-nowrap w-full text-center"
              >
                Confirm Downgrade
              </button>
              <button
                onClick={() => toast.dismiss()}
                className="cursor-pointer p-2 bg-[#F3F5F5] text-black rounded-4xl hover:bg-gray-200 transition-colors font-medium whitespace-nowrap w-full text-center"
              >
                Cancel
              </button>
            </div>
          </div>,
          {
            autoClose: false,
            closeOnClick: false,
            className: "",
          }
        );
        return;
      }

      if (userPlan?.plan === PricingPlan.Free) {
        navigate(`/subscribe-plan/basic/${monthlyOrYearly}`);
      }
    } catch (error) {
      console.error("Error subscribing to Basic plan:", error);
    } finally {
      setIsLoading({ type: "" });
    }
  }

  async function subscribePremiumPlan(
    monthlyOrYearly: BillingCycle
  ): Promise<void> {
    setIsLoading({ type: "premium", cycle: monthlyOrYearly });
    try {
      const isAuthed = await authGuard(PricingPlan.Premium, monthlyOrYearly);
      if (!isAuthed) return;

      const userPlan = await fetchUserPlan();

      if (userPlan?.plan === PricingPlan.Premium) {
        toast.info("You are already subscribed to the Premium plan.");
        return;
      }

      if (
        userPlan?.plan === PricingPlan.Free ||
        userPlan?.plan === PricingPlan.Basic
      ) {
        navigate(`/subscribe-plan/premium/${monthlyOrYearly}`);
      }
    } catch (error) {
      console.error("Error subscribing to Premium plan:", error);
    } finally {
      setIsLoading({ type: "" });
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
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
      <div className="py-15 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {" "}
          {/* Changed to max-w-7xl to accommodate 3 columns */}
          <h1 className="font-fraunces text-4xl font-semibold text-center mb-20">
            Pricing
          </h1>
          {/* Changed to grid-cols-1 for mobile/tablet, lg:grid-cols-3 for desktop */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              hasPremium ? "lg:grid-cols-3" : "lg:grid-cols-2"
            } gap-7`}
          >
            {" "}
            {/* Changed to 3 columns */}
            {/* Free Plan */}
            <div className="text-black font-dosis bg-container-grey py-8 px-5 rounded-xl">
              <h2 className="text-xl font-bold mb-15">Free</h2>
              <p className="text-xl mb-0">3 Free Stories</p>
              <p className="text-md text-custom-text-grey font-medium">
                Enjoy listening to 3 free stories.
              </p>
              <div className="mt-5">
                <p className="text-xl mb-0">0 custom narrators</p>
                <p className="text-md text-custom-text-grey font-medium">
                  This plan doesn't offer custom narrators.
                </p>
              </div>
              <ButtonWithLoading
                isLoading={isLoading.type === "create-free"}
                onClick={handleCreateFreeAccount}
                className="font-semibold text-xl w-full mt-13 px-4 py-2 border-1 border-custom-stroke-grey rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Create Free Account
              </ButtonWithLoading>
            </div>
            {/* Basic Plan */}
            <div className="flex flex-col h-full text-black font-dosis bg-container-grey py-8 px-5 rounded-xl">
              <div className="flex items-center justify-between mb-15">
                <h2 className="text-xl font-bold">Basic</h2>
                <span className="bg-black text-white text-lg font-semibold px-3 py-1 rounded-full">
                  Try the 7 days Free Trial
                </span>
              </div>

              {/* Content wrapper with flex-grow */}
              <div className="flex-grow mb-13">
                <p className="text-xl">Unlimited story access</p>
                <p className="text-md text-custom-text-grey font-medium">
                  Unlimited access to all the Story Palace stories
                </p>
                <div className="mt-5">
                  <p className="text-xl">Early access to new features</p>
                  <p className="text-md text-custom-text-grey font-medium">
                    {" "}
                    Be the first to experience and provide feedback on our
                    latest updates and features
                  </p>
                </div>
              </div>

              {/* Pricing Grid - Now at bottom */}
              <div
                className={`gap-x-10 grid ${
                  hasPremium ? "xl:grid-cols-2" : "lg:grid-cols-2"
                } gap-y-12`}
              >
                {/* Monthly Plan */}
                <div className="border-1 border-black pt-5 pb-3 px-3 rounded-2xl">
                  <div className="mb-3">
                    <h3 className="text-lg font-medium">Monthly</h3>
                    <p className="tracking-tighter text-4xl font-bold">
                      $9.99
                      <span className="text-base tracking-normal text-custom-text-grey">
                        {" "}
                        / mo
                      </span>
                    </p>
                    <p className="text-lg text-custom-text-grey">
                      Cancel anytime
                    </p>
                  </div>
                  <ButtonWithLoading
                    isLoading={
                      isLoading.type === "basic" &&
                      isLoading.cycle === BillingCycle.Monthly
                    }
                    onClick={() => subscribeBasicPlan(BillingCycle.Monthly)}
                    className="tracking-normal text-lg font-bold border-1 border-custom-stroke-grey w-full px-4 py-2 rounded-2xl hover:bg-white transition-colors"
                  >
                    Subscribe
                  </ButtonWithLoading>
                </div>

                {/* Yearly Plan */}
                <div className="relative">
                  {" "}
                  {/* Added wrapper div */}
                  <div className="absolute -top-[35px] left-[-.1px] right-[-.1px] bg-black text-white px-3 py-1 text-xl text-center rounded-t-2xl">
                    BEST DEAL
                  </div>
                  {/* Content div */}
                  <div className="border-1 border-black pt-5 pb-3 px-3 rounded-2xl rounded-t-none">
                    <div className="mb-3">
                      <h3 className="text-lg font-medium">Yearly</h3>
                      <p className="tracking-tighter text-4xl font-bold">
                        $4.99
                        <span className="text-base tracking-normal text-custom-text-grey">
                          {" "}
                          / mo
                        </span>
                      </p>
                      <p className="tracking-tighter text-lg text-custom-text-grey">
                        $59.88
                        <span className="text-base tracking-normal text-gray-500">
                          {" "}
                          / y
                        </span>
                      </p>
                    </div>
                    <ButtonWithLoading
                      isLoading={
                        isLoading.type === "basic" &&
                        isLoading.cycle === BillingCycle.Yearly
                      }
                      onClick={() => subscribeBasicPlan(BillingCycle.Yearly)}
                      className="tracking-normal text-lg font-bold border-1 border-custom-stroke-grey w-full px-4 py-2 rounded-2xl hover:bg-white transition-colors"
                    >
                      Subscribe
                    </ButtonWithLoading>
                  </div>
                </div>
              </div>
            </div>
            {/* Premium Plan - Conditionally Rendered */}
            {hasPremium && (
              <div className="flex flex-col h-full text-black font-dosis bg-container-grey py-8 px-5 rounded-xl">
                <div className="flex items-center justify-between mb-15">
                  <h2 className="text-xl font-bold">Premium</h2>
                  <span className="bg-black text-white text-lg font-semibold px-3 py-1 rounded-full">
                    Custom Voices
                  </span>
                </div>

                {/* Content wrapper with flex-grow */}
                <div className="flex-grow mb-13">
                  <div className="mb-5">
                    <p className="text-xl">Basic Plan Plus</p>
                    <p className="text-md text-custom-text-grey font-medium">
                      Everything in the Basic Plan, plus more!
                    </p>
                  </div>

                  <div className="mb-5">
                    <p className="text-xl">Premium content</p>
                    <p className="text-md text-custom-text-grey font-medium">
                      Exclusive access to premium content
                    </p>
                  </div>

                  <div className="mb-5">
                    <p className="text-xl">Custom narrators</p>
                    <p className="text-md text-custom-text-grey font-medium">
                      Record your voice once, and we'll use it to narrate your
                      favorite stories.
                    </p>
                  </div>
                </div>

                <div
                  className={`gap-x-5 grid ${
                    hasPremium ? "xl:grid-cols-2" : "lg:grid-cols-2"
                  } gap-y-12`}
                >
                  {/* Monthly Plan */}
                  <div className="border-1 border-black pt-5 pb-3 px-3 rounded-2xl">
                    <div className="mb-3">
                      <h3 className="text-lg font-medium">Monthly</h3>
                      <p className="tracking-tighter text-4xl font-bold">
                        $29.99
                        <span className="text-base tracking-normal text-custom-text-grey">
                          {" "}
                          / mo
                        </span>
                      </p>
                      <p className="text-lg text-custom-text-grey">
                        Cancel anytime
                      </p>
                    </div>
                    <ButtonWithLoading
                      isLoading={
                        isLoading.type === "premium" &&
                        isLoading.cycle === BillingCycle.Monthly
                      }
                      onClick={() => subscribePremiumPlan(BillingCycle.Monthly)}
                      className="tracking-normal text-lg font-bold border-1 border-custom-stroke-grey w-full px-4 py-2 rounded-2xl hover:bg-white transition-colors"
                    >
                      Subscribe
                    </ButtonWithLoading>
                  </div>

                  {/* Yearly Plan */}
                  <div className="relative">
                    {" "}
                    {/* Added wrapper div */}
                    <div className="absolute -top-[35px] left-[-.1px] right-[-.1px] bg-black text-white px-3 py-1 text-xl text-center rounded-t-2xl">
                      BEST DEAL
                    </div>
                    {/* Content div */}
                    <div className="border-1 border-black pt-5 pb-3 px-3 rounded-2xl rounded-t-none">
                      <div className="mb-3">
                        <h3 className="text-lg font-medium">Yearly</h3>
                        <p className="tracking-tighter text-4xl font-bold">
                          $12.99
                          <span className="text-base tracking-normal text-custom-text-grey">
                            {" "}
                            / mo
                          </span>
                        </p>
                        <p className="tracking-tighter text-lg text-custom-text-grey">
                          $155.88
                          <span className="text-base tracking-normal text-gray-500">
                            {" "}
                            / y
                          </span>
                        </p>
                      </div>
                      <ButtonWithLoading
                        isLoading={
                          isLoading.type === "premium" &&
                          isLoading.cycle === BillingCycle.Yearly
                        }
                        onClick={() =>
                          subscribePremiumPlan(BillingCycle.Yearly)
                        }
                        className="tracking-normal text-lg font-bold border-1 border-custom-stroke-grey w-full px-4 py-2 rounded-2xl hover:bg-white transition-colors"
                      >
                        Subscribe
                      </ButtonWithLoading>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
