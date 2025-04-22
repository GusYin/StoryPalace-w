import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AuthHeader from "~/components/header-auth";
import Footer from "~/components/footer";
import { auth, logout } from "~/firebase/firebase";
import { PricingPlan } from "~/lib/constant";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import ButtonWithLoading from "~/components/button-with-loading";
import { toast, ToastContainer } from "react-toastify";

const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [editingName, setEditingName] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [deleteAccountError, setDeleteAccountError] = React.useState("");

  // Add these new states for delete account flow
  const [showDeleteAccountModal, setShowDeleteAccountModal] =
    React.useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = React.useState("");

  const [userDisplay, setUserDisplay] = useState<{
    name?: string | null;
    email?: string | null;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserDisplay({ name: user?.displayName, email: user?.email });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const getUserPlan = httpsCallable<
          {},
          { plan: "free" | "basic" | "premium"; trialEndDate?: string }
        >(functions, "getUserPlan");

        const result = await getUserPlan({});

        setUserPlan(result.data.plan);

        if (result.data.trialEndDate) {
          setTrialEndDate(new Date(result.data.trialEndDate));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserPlan("free");
      }
    };

    fetchUserData();
  }, []);

  const doLogout = async () =>
    logout()
      .then()
      .catch((err) => console.error(err))
      .finally(() => navigate("/"));

  const handleUpdateName = async () => {
    try {
      await updateProfile(auth.currentUser!, { displayName: newName });
      setUserDisplay((prev) => ({ ...prev, name: newName }));
      setEditingName(false);
      setSuccess("Name updated successfully");
    } catch (error) {
      setError("Error updating name");
    }
  };

  const handleChangePassword = async () => {
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser!.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, newPassword);
      setSuccess("Password changed successfully");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setError("Error changing password. Please check your current password.");
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteAccountModal(true);
  };

  const handleConfirmDeleteAccount = async () => {
    // Validate password
    if (!deleteAccountPassword.trim()) {
      setDeleteAccountError("Password is required");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        setError("No authenticated user found");
        return;
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        deleteAccountPassword
      );
      await reauthenticateWithCredential(user, credential);

      // If reauthentication succeeds, delete user
      await deleteUser(user);
      navigate("/");
    } catch (error: any) {
      setError("Error deleting account. Please check your password.");

      // Handle specific error codes
      if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else if (error.code === "auth/requires-recent-login") {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Error deleting account. Please try again.");
      }

      setShowDeleteAccountModal(false);
      setDeleteAccountPassword("");
    } finally {
      setIsDeletingAccount(false);
      setDeleteAccountError("");
    }
  };

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
      <div className="font-dosis w-full mx-auto space-y-8 mt-14 px-4 sm:px-6 lg:px-20">
        {/* Success/Error Messages */}
        {error && (
          <div className="text-red-500 p-3 bg-red-50 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="text-green-500 p-3 bg-green-50 rounded-lg">
            {success}
          </div>
        )}

        {/* Combined Title and Welcome Section */}
        <div className="text-black tracking-[3%] bg-white p-6 space-y-5 mb-[46px] pl-0">
          <div className="text-xl font-medium">MY ACCOUNT</div>
          <h2 className="font-fraunces font-semibold text-4xl">
            Welcome back{userDisplay?.name ? `, ${userDisplay.name}` : ``}!
          </h2>
        </div>

        {/* Plan Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F3F7F6] p-5 rounded-xl shadow-xs">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-[#707978] font-medium text-xl mb-4">
              YOUR PLAN
            </h3>
            <span className="capitalize-plan text-black font-bold text-4xl">
              Story Palace {userPlan}
            </span>
          </div>
          {userPlan === PricingPlan.Premium ? (
            <button className="w-full sm:w-auto md:w-80 bg-gray-600 text-white px-3 py-3 rounded-3xl hover:bg-gray-700 transition-colors">
              Manage Plan
            </button>
          ) : (
            <button
              onClick={() => navigate("/upgrade")}
              className="text-xl w-full sm:w-auto md:w-80 bg-custom-teal text-white px-3 py-3 rounded-3xl hover:bg-blue-600 transition-colors"
            >
              Upgrade Plan
            </button>
          )}
        </div>

        {/* Account Settings */}
        <div className="bg-[#F3F7F6] p-6 rounded-xl shadow-xs">
          <h3 className="text-[#707978] font-medium text-xl mb-3">
            ACCOUNT SETTINGS
          </h3>
          <div className="text-xl space-y-8">
            <div>
              <label className="text-black block">Name</label>
              {editingName ? (
                <div className="text-[#707978] text-xl mt-1 flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="font-dosis bg-[#F3F7F7] mt-1 block w-full rounded-xl border border-[#829793] px-3 py-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new name"
                  />
                  <button
                    onClick={handleUpdateName}
                    className="cursor-pointer w-auto bg-custom-teal text-white px-6 py-3 rounded-3xl hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="cursor-pointer border border-[#829793] px-3 py-3 rounded-3xl w-auto bg-white text-black hover:text-blue-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="text-[#707978] mt-1 flex items-center gap-2">
                  {userDisplay?.name || "You don't have a name yet..."}
                  <button
                    onClick={() => {
                      setNewName(userDisplay?.name || "");
                      setEditingName(true);
                    }}
                    className="cursor-pointer leading-[32px] underline text-[#06846F] hover:text-blue-500"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="text-black block">Email Address</label>
              <div className="text-[#707978] mt-1">{userDisplay?.email}</div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div>
                <label className="text-black block">Password</label>
                <div className="leading-[32px] text-[#707978] mt-1">
                  **********
                </div>
              </div>
              <div>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="cursor-pointer border border-[#829793] px-3 py-3 rounded-3xl w-auto bg-white text-black hover:text-blue-600 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="text-xl fixed inset-0 bg-black bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl space-y-4">
              <h3 className="font-bold">Change Password</h3>
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="font-dosis bg-[#F3F7F7] border border-[#829793] p-2 w-full rounded-xl transition-colors"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="font-dosis bg-[#F3F7F7] border border-[#829793] p-2 w-full rounded-xl transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleChangePassword}
                  className="cursor-pointer w-auto bg-custom-teal text-white px-5 py-3 rounded-3xl hover:bg-blue-600 transition-colors"
                >
                  Submit
                </button>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="cursor-pointer border border-[#829793] px-3 py-3 rounded-3xl w-auto bg-white text-black hover:text-blue-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteAccountModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl space-y-4 w-80">
              <h3 className="text-xl font-bold">Confirm Account Deletion</h3>
              <div className="space-y-1">
                <input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={deleteAccountPassword}
                  onChange={(e) => {
                    setDeleteAccountPassword(e.target.value);
                    setDeleteAccountError(""); // Clear error when typing
                  }}
                  className={`font-dosis bg-[#F3F7F7] border ${
                    deleteAccountError
                      ? "border-custom-error"
                      : "border-[#829793]"
                  } p-2 w-full rounded-xl transition-colors`}
                />
                {deleteAccountError && (
                  <p className="text-red-500 text-sm">{deleteAccountError}</p>
                )}
              </div>
              <div className="text-xl flex gap-2">
                <ButtonWithLoading
                  description="Deleting..."
                  isLoading={isDeletingAccount}
                  onClick={handleConfirmDeleteAccount}
                  className="cursor-pointer w-auto text-custom-error hover:text-red-700 hover:bg-red-50 border border-[#EF4444] px-5 py-3 rounded-3xl transition-colors"
                >
                  Delete
                </ButtonWithLoading>
                <button
                  disabled={isDeletingAccount}
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    setDeleteAccountPassword("");
                    setDeleteAccountError("");
                  }}
                  className="cursor-pointer border border-[#829793] px-3 py-3 rounded-3xl w-auto bg-white text-black hover:text-blue-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div className="text-xl bg-white p-6 space-y-16 pl-0">
          <button
            onClick={doLogout}
            className="cursor-pointer w-[200px] text-black py-3 px-3 border border-[#829793] rounded-3xl hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
          <div className="">
            <button
              onClick={handleDeleteAccount}
              className="cursor-pointer w-[200px] text-[#EF4444] hover:text-red-700 px-4 py-2 border border-[#EF4444] rounded-3xl hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
            <p className="text-lg text-[#707978] mt-2">
              Deleting your account is permanent.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyAccount;
