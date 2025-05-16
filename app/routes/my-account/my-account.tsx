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
import { auth, logout, functions } from "~/firebase/firebase";
import { PricingPlan } from "~/lib/constant";
import { httpsCallable } from "firebase/functions";
import ButtonWithLoading from "~/components/button-with-loading";
import { toast, ToastContainer } from "react-toastify";
import { Timestamp } from "firebase/firestore";

interface UserPlanResponse {
  plan: "free" | "basic" | "premium";
  billingCycle?: "monthly" | "yearly";
  stripeSubscriptionStatus?: string;
  stripeSubscriptionUnpaidSince?: Timestamp;
  trialEndDate?: Timestamp;
}

const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlanResponse | null>(null);
  const [isFetchingPlan, setIsFetchingPlan] = useState(true);

  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [deleteAccountInlineError, setDeleteAccountInlineError] = useState("");

  // Add these new states for delete account flow
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");

  const [userDisplay, setUserDisplay] = useState<{
    name?: string | null;
    email?: string | null;
  } | null>(null);

  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] =
    useState(false);
  const [cancelSubscriptionPassword, setCancelSubscriptionPassword] =
    useState("");
  const [cancelSubscriptionInlineError, setCancelSubscriptionInlineError] =
    useState("");
  const [isLoadingCancelSubscription, setIsLoadingCancelSubscription] =
    useState(false);

  // Handle subscription cancellation
  const handleConfirmCancelSubscription = async () => {
    if (!cancelSubscriptionPassword.trim()) {
      setCancelSubscriptionInlineError("Password is required");
      return;
    }

    setIsLoadingCancelSubscription(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error("No authenticated user found");
        return;
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        cancelSubscriptionPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Cancel subscription
      const cancelSubscription = httpsCallable(functions, "cancelSubscription");
      await cancelSubscription({});

      // Refresh user plan data
      const getUserPlan = httpsCallable<{}, UserPlanResponse>(
        functions,
        "getUserPlan"
      );
      const result = await getUserPlan({});
      setUserPlan(result.data);

      toast.success("Subscription cancelled successfully");
      setShowCancelSubscriptionModal(false);
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      if (error.code === "auth/invalid-credential") {
        setCancelSubscriptionInlineError("Incorrect password");
      } else {
        toast.error("Failed to cancel subscription. Please try again.");
      }
    } finally {
      setIsLoadingCancelSubscription(false);
      setCancelSubscriptionPassword("");
      setCancelSubscriptionInlineError("");
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserDisplay({ name: user?.displayName, email: user?.email });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsFetchingPlan(true);
      try {
        const getUserPlan = httpsCallable<{}, UserPlanResponse>(
          functions,
          "getUserPlan"
        );

        const result = await getUserPlan({});

        setUserPlan(result.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load account information. Please try again.");
      } finally {
        setIsFetchingPlan(false);
      }
    };

    fetchUserData();
  }, []);

  const doLogout = async () =>
    logout()
      .then()
      .catch((err) => {
        console.error(err);
        toast.error("Failed to log out. Please try again.");
      })
      .finally(() => navigate("/"));

  const handleUpdateName = async () => {
    try {
      await updateProfile(auth.currentUser!, { displayName: newName });
      setUserDisplay((prev) => ({ ...prev, name: newName }));
      setEditingName(false);
      toast.success("Name updated successfully");
    } catch (error) {
      toast.error("Error updating name");
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
      toast.success("Password changed successfully");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(
        "Error changing password. Please check your current password."
      );
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteAccountModal(true);
  };

  const handleConfirmDeleteAccount = async () => {
    // Validate password
    if (!deleteAccountPassword.trim()) {
      setDeleteAccountInlineError("Password is required");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error("No authenticated user found");
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
      console.error("Delete account error:", error);

      // Handle specific error codes
      if (error.code === "auth/invalid-credential") {
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
      setDeleteAccountInlineError("");
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
        {/* Combined Title and Welcome Section */}
        <div className="text-black tracking-[3%] bg-white p-6 space-y-5 mb-[46px] pl-0">
          <div className="text-xl font-medium">MY ACCOUNT</div>
          <h2 className="font-fraunces font-semibold text-4xl">
            Welcome back{userDisplay?.name ? `, ${userDisplay.name}` : ``}!
          </h2>
        </div>

        {/* unpaid callout Section */}
        {userPlan?.stripeSubscriptionStatus === "unpaid" &&
          userPlan.stripeSubscriptionUnpaidSince &&
          (() => {
            const unpaidSinceDate =
              userPlan.stripeSubscriptionUnpaidSince.toDate();
            const unpaidSinceTime = unpaidSinceDate.getTime();
            const currentTime = Date.now();
            const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
            const isWithinOneWeek =
              currentTime - unpaidSinceTime <= oneWeekInMs;

            return isWithinOneWeek ? (
              <div className="bg-red-50 border-l-4 border-red-400 mb-8 p-5 rounded-xl shadow-xs">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h1 className="font-medium text-red-800">
                      Subscription Cancelled
                    </h1>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Your subscription has been cancelled due to failed
                        payments. You've been downgraded to the free plan. To
                        regain premium access, please update your payment method
                        and resubscribe.
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          onClick={() => navigate("/pricing")}
                          className="cursor-pointer underline bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600 transition-colors"
                        >
                          Resubscribe Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

        {/* Plan Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F3F7F6] p-5 rounded-xl shadow-xs">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-[#707978] font-medium text-xl mb-4">
              YOUR PLAN
            </h3>
            <span className="capitalize-plan text-black font-bold text-4xl">
              Story Palace{" "}
              {isFetchingPlan ? (
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-custom-teal"></div>
              ) : (
                <span className="capitalize">{userPlan?.plan}</span>
              )}
            </span>
          </div>
          {userPlan?.plan === PricingPlan.Premium ? (
            <button className="w-full sm:w-auto md:w-80 bg-gray-600 text-white px-3 py-3 rounded-3xl hover:bg-gray-700 transition-colors">
              Manage Plan
            </button>
          ) : (
            <></>
            // <button
            //   onClick={() => navigate("/upgrade")}
            //   className="text-xl w-full sm:w-auto md:w-80 bg-custom-teal text-white px-3 py-3 rounded-3xl hover:bg-blue-600 transition-colors"
            // >
            //   Upgrade Plan
            // </button>
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
                    setDeleteAccountInlineError(""); // Clear error when typing
                  }}
                  className={`font-dosis bg-[#F3F7F7] border ${
                    deleteAccountInlineError
                      ? "border-custom-error"
                      : "border-[#829793]"
                  } p-2 w-full rounded-xl transition-colors`}
                />
                {deleteAccountInlineError && (
                  <p className="text-red-500 text-sm">
                    {deleteAccountInlineError}
                  </p>
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
                    setDeleteAccountInlineError("");
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

          {userPlan?.stripeSubscriptionStatus === "active" ? (
            <div>
              <button
                onClick={() => setShowCancelSubscriptionModal(true)}
                className="cursor-pointer w-[200px] text-[#EF4444] hover:text-red-700 px-4 py-2 border border-[#EF4444] rounded-3xl hover:bg-red-50 transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          ) : null}

          {showCancelSubscriptionModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-xl space-y-4">
                <h3 className="font-bold">Confirm Subscription Cancellation</h3>
                <div className="space-y-1">
                  <input
                    type="password"
                    placeholder="Enter your password to confirm"
                    value={cancelSubscriptionPassword}
                    onChange={(e) => {
                      setCancelSubscriptionPassword(e.target.value);
                      setCancelSubscriptionInlineError("");
                    }}
                    className={`font-dosis bg-[#F3F7F7] border ${
                      cancelSubscriptionInlineError
                        ? "border-custom-error"
                        : "border-[#829793]"
                    } p-2 w-full rounded-xl transition-colors`}
                  />
                  {cancelSubscriptionInlineError && (
                    <p className="text-red-500 text-sm">
                      {cancelSubscriptionInlineError}
                    </p>
                  )}
                </div>
                <div className="text-xl flex gap-2">
                  <ButtonWithLoading
                    description="Cancelling..."
                    isLoading={isLoadingCancelSubscription}
                    onClick={handleConfirmCancelSubscription}
                    className="cursor-pointer w-auto text-custom-error hover:text-red-700 hover:bg-red-50 border border-[#EF4444] px-5 py-3 rounded-3xl transition-colors"
                  >
                    Confirm
                  </ButtonWithLoading>
                  <button
                    disabled={isLoadingCancelSubscription}
                    onClick={() => {
                      setShowCancelSubscriptionModal(false);
                      setCancelSubscriptionPassword("");
                      setCancelSubscriptionInlineError("");
                    }}
                    className="cursor-pointer border border-[#829793] px-3 py-3 rounded-3xl w-auto bg-white text-black hover:text-blue-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

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
