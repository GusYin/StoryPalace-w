import React from "react";
import AuthHeader from "~/components/auth-header";

const MyAccount: React.FC = () => {
  const user = {
    name: "User's Name",
    email: "useremail@gmail.com",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <AuthHeader />
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Welcome back, {user.name}!
          </h2>
        </div>

        {/* Plan Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-4">YOUR PLAN</h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Story Palace Free</span>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
              Upgrade plan
            </button>
          </div>
        </div>

        {/* Narrators Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-4">YOUR NARRATORS</h3>
          <div className="bg-gray-50 p-4 rounded-md text-gray-500">
            Upgrade to a paid plan to add custom voices.
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-6">ACCOUNT SETTINGS</h3>

          <div className="space-y-6">
            <div>
              <label className="text-sm text-gray-500 block">Name</label>
              <div className="text-gray-900 mt-1">{user.name}</div>
            </div>

            <div>
              <label className="text-sm text-gray-500 block">
                Email Address
              </label>
              <div className="text-gray-900 mt-1">{user.email}</div>
            </div>

            <div>
              <label className="text-sm text-gray-500 block">Password</label>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-900">**********</span>
                <button className="text-blue-500 hover:text-blue-600">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <button className="w-full text-left py-2 text-gray-700 hover:text-gray-900">
            Log out
          </button>
          <div className="border-t pt-4">
            <button className="text-red-600 hover:text-red-700">
              Delete Account
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Deleting your account is permanent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
