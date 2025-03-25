import React from "react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Pricing
        </h1>

        {/* Free Plan */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Free</h2>
            <p className="text-lg text-gray-600 mb-6">3 Free Stories</p>
            <p className="text-gray-500 mb-6">
              Enjoy listening to 3 free stories.
            </p>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-500">0 custom narrators</p>
              <p className="text-sm text-gray-400 mt-1">
                This plan doesn't offer custom narrators.
              </p>
            </div>

            <button className="w-full mt-6 px-4 py-2 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
              Get Started
            </button>
          </div>

          {/* Basic Plan */}
          <div className="bg-white p-8 rounded-lg shadow-md border-2 border-blue-500">
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

            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-600">2 custom narrators</p>
              <p className="text-sm text-gray-400 mt-1">
                Record your voice once, and we'll use it to narrate your
                favorite stories.
              </p>
            </div>

            <button className="w-full mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              Start Free Trial
            </button>
          </div>
        </div>

        {/* Premium Plans */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Monthly Plan */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800">Monthly</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                $19.99<span className="text-lg text-gray-500">/mo</span>
              </p>
              <p className="text-gray-500 mt-2">Cancel anytime</p>
            </div>
            <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">
              Subscribe
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white p-8 rounded-lg shadow-md border-2 border-blue-500 relative">
            <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm rounded-bl-lg">
              BEST DEAL
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800">Yearly</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                $12.99<span className="text-lg text-gray-500">/mo</span>
              </p>
              <p className="text-gray-900 mt-2">
                $155.88<span className="text-gray-500">/y</span>
              </p>
            </div>
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
