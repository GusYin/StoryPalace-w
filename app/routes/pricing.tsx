import React from "react";
import Footer from "~/components/footer";
import Header from "~/components/header";

export default function PricingPage() {
  const hasPremium = true;
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
            <div className="bg-container-grey py-8 px-5 rounded-xl">
              <div className="mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                  Try the 7 days Free Trial
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Basic</h2>
              <p className="text-lg text-gray-600 mb-6">Create Free Account</p>
              <div className="space-y-4 mb-6">
                <p className="text-gray-600">Get access to 20+ stories</p>
                <p className="text-gray-600">
                  Unlimited access to all the Story Palace stories
                </p>
              </div>
              <div className="border-t border-gray-200 pt-6 mb-8">
                <p className="text-gray-600">2 custom narrators</p>
                <p className="text-sm text-gray-400 mt-1">
                  Record your voice once, and we'll use it to narrate your
                  favorite stories.
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
                      $19.99<span className="text-base text-gray-500">/mo</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Cancel anytime</p>
                  </div>
                  <button className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors">
                    Subscribe
                  </button>
                </div>

                {/* Yearly Plan */}
                <div className="bg-gray-50 p-6 rounded-lg relative">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm rounded-bl-lg">
                    BEST DEAL
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Yearly
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      $12.99<span className="text-base text-gray-500">/mo</span>
                    </p>
                    <p className="text-gray-900 mt-1">
                      $155.88<span className="text-gray-500">/y</span>
                    </p>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
            {/* Premium Plan - Conditionally Rendered */}
            {hasPremium && (
              <div className="bg-container-grey py-8 px-5 rounded-xl">
                <div className="mb-4">
                  <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                    Premium Features
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Premium
                </h2>
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
