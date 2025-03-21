import React from "react";
import AuthHeader from "~/components/auth-header";

const MyAccount: React.FC = () => {
  const user = {
    name: "User's Name",
    email: "useremail@gmail.com",
  };

  return (
    <div className="min-h-screen bg-white">
      <AuthHeader />
      <div className="font-dosis w-full mx-auto space-y-8 mt-14 px-20">
        {/* Combined Title and Welcome Section */}
        <div className="text-black tracking-[3%] bg-white p-6 space-y-5 mb-[46px] pl-0">
          <div className="text-xl font-medium">MY ACCOUNT</div>
          <h2 className="font-fraunces font-semibold text-4xl">
            Welcome back, {user.name}!
          </h2>
        </div>

        {/* Plan Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F3F7F6] p-6 rounded-lg shadow-sm">
          {/* Plan Details */}
          <div className="mb-4 sm:mb-0">
            <h3 className="text-[#707978] font-medium text-xl mb-4">
              YOUR PLAN
            </h3>
            <span className="text-black font-bold text-4xl">
              Story Palace Free
            </span>
          </div>
          <button className="w-full sm:w-auto md:w-80 bg-custom-teal text-white px-4 py-2 rounded-3xl hover:bg-blue-600 transition-colors">
            Upgrade plan
          </button>
        </div>

        {/* Account Settings */}
        <div className="bg-[#F3F7F6] p-6 rounded-lg shadow-sm">
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
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4 pl-0">
          <button className="text-left py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            Log out
          </button>
          <div className="border-t pt-4">
            <button className="text-red-600 hover:text-red-700 px-4 py-2 border border-red-600 rounded-md hover:bg-red-50 transition-colors">
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
