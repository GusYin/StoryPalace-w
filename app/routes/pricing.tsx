import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Footer from "~/components/footer";
import Header from "~/components/header";
import { auth } from "~/firebase/firebase";
import { planNames } from "~/lib/constant";

export default function PricingPage() {
  const hasPremium = true;
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<keyof typeof planNames | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  function handleCreateFreeAccount(): void {
    if (user) {
      if (user.emailVerified) {
        navigate("/my-account");
      } else {
        navigate("/verify-email");
      }
    } else {
      navigate("/signup");
    }
  }

  const fetchUserPlan = async () => {
    if (auth.currentUser) {
      const idTokenResult = await auth.currentUser.getIdTokenResult();

      const plan =
        (idTokenResult.claims.plan as keyof typeof planNames) ||
        planNames.noPlan;

      setUserPlan(plan);
    }
  };

  async function subscribeBasicPlanMonthly(): Promise<void> {
    if (user) {
      if (user.emailVerified) {
        if (userPlan === null) {
          await fetchUserPlan();
        }

        if (userPlan === planNames.free) navigate("/subscribe-basic-plan");
      } else {
        navigate("/verify-email");
      }
    } else {
      navigate("/signup");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
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
              <button
                onClick={handleCreateFreeAccount}
                className="font-semibold text-xl w-full mt-13 px-4 py-2 border-1 border-custom-stroke-grey rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Create Free Account
              </button>
            </div>
            {/* Basic Plan */}
            <div className="text-black font-dosis bg-container-grey py-8 px-5 rounded-xl">
              <div className="flex items-center justify-between mb-15">
                <h2 className="text-xl font-bold">Basic</h2>
                <span className="bg-black text-white text-lg font-semibold px-3 py-1 rounded-full">
                  Try the 7 days Free Trial
                </span>
              </div>
              <p className="text-xl">Unlimited story access</p>
              <p className="text-md text-custom-text-grey font-medium">
                Unlimited access to all the Story Palace stories
              </p>
              <div className="mt-5">
                <p className="text-xl">Early access to new features</p>
                <p className="text-md text-custom-text-grey font-medium">
                  {" "}
                  Be the first to experience and provide feedback on our latest
                  updates and features
                </p>
              </div>

              <div
                className={`mt-13 gap-x-10 grid ${
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
                  <button
                    onClick={subscribeBasicPlanMonthly}
                    className="tracking-normal text-lg font-bold border-1 border-custom-stroke-grey w-full px-4 py-2 rounded-2xl hover:bg-white transition-colors"
                  >
                    Subscribe
                  </button>
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
                    <button className="tracking-normal text-lg font-bold border-1 border-custom-stroke-grey w-full px-4 py-2 rounded-2xl hover:bg-white transition-colors">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Premium Plan - Conditionally Rendered */}
            {hasPremium && (
              <div className="text-black font-dosis bg-container-grey py-8 px-5 rounded-xl">
                <div className="flex items-center justify-between mb-15">
                  <h2 className="text-xl font-bold">Premium</h2>
                  <span className="bg-black text-white text-lg font-semibold px-3 py-1 rounded-full">
                    Custom Voices
                  </span>
                </div>

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

                <div
                  className={`mt-13 gap-x-10 grid ${
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
                    <button className="tracking-normal text-lg font-bold border-1 border-custom-stroke-grey w-full px-4 py-2 rounded-2xl hover:bg-white transition-colors">
                      Subscribe
                    </button>
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
                      <button className="tracking-normal text-lg font-bold border-1 border-custom-stroke-grey w-full px-4 py-2 rounded-2xl hover:bg-white transition-colors">
                        Subscribe
                      </button>
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
