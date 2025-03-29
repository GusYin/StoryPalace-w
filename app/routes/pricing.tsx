import React from "react";
import Footer from "~/components/footer";
import Header from "~/components/header";

export default function PricingPage() {
  const hasPremium = false;
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
              <button className="font-semibold text-xl w-full mt-13 px-4 py-2 border-1 border-custom-stroke-grey rounded-2xl hover:bg-gray-50 transition-colors">
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
              <p className="text-xl mb-0">Get access to 20+ stories</p>
              <p className="text-md text-custom-text-grey font-medium">
                Unlimited access to all the Story Palace stories
              </p>
              <div className="mt-5">
                <p className="text-xl mb-0">2 custom narrators</p>
                <p className="text-md text-custom-text-grey font-medium">
                  Record your voice once, and we'll use it to narrate your
                  favorite stories.
                </p>
              </div>

              <div
                className={`mt-13 grid ${
                  hasPremium ? "xl:grid-cols-2" : "lg:grid-cols-2"
                } gap-6`}
              >
                {/* Monthly Plan */}
                <div className="border-1 border-black pt-5 pb-3 px-3 rounded-2xl">
                  <div className="mb-3">
                    <h3 className="text-lg font-medium">Monthly</h3>
                    <p className="tracking-tighter text-4xl font-bold">
                      $19.99
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
                <div className="border-1 border-black pt-5 pb-3 px-3 rounded-2xl relative">
                  <div className="absolute top-0 right-0 left-0 bg-black text-white px-3 py-1 text-sm rounded-t-2xl">
                    BEST DEAL
                  </div>
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
            {/* Premium Plan - Conditionally Rendered */}
            {hasPremium && (
              <div className="text-black font-dosis bg-container-grey py-8 px-5 rounded-xl">
                <div className="flex items-center justify-between mb-15">
                  <h2 className="text-xl font-bold">Premium</h2>
                  <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                    Premium Features
                  </span>
                </div>

                <p className="text-lg text-gray-600 mb-6">Priority Support</p>
                <div className="space-y-4 mb-6">
                  <p className="text-gray-600">Unlimited story access</p>
                  <p className="text-gray-600">Exclusive premium content</p>
                  <p className="text-gray-600">Early access to new features</p>
                </div>
                <div className="border-t border-gray-200 pt-6 mb-8">
                  <p className="text-gray-600">5 custom narrators</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Plus advanced voice customization options
                  </p>
                </div>

                <div
                  className={`grid ${
                    hasPremium ? "xl:grid-cols-2" : "lg:grid-cols-2"
                  } gap-6`}
                >
                  {/* Monthly Plan */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Monthly
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        $29.99
                        <span className="text-base text-gray-500">/mo</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Cancel anytime
                      </p>
                    </div>
                    <button className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors">
                      Subscribe
                    </button>
                  </div>

                  {/* Yearly Plan */}
                  <div className="bg-gray-50 p-6 rounded-lg relative">
                    <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 text-sm rounded-bl-lg">
                      BEST VALUE
                    </div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Yearly
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        $19.99
                        <span className="text-base text-gray-500">/mo</span>
                      </p>
                      <p className="text-gray-900 mt-1">
                        $239.88<span className="text-gray-500">/y</span>
                      </p>
                    </div>
                    <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors">
                      Subscribe
                    </button>
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
