import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AuthHeader from "~/components/auth-header";
import Footer from "~/components/footer";
import { auth, logout } from "~/firebase/firebase";

const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [editingName, setEditingName] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const planNames = {
    noPlan: "noPlan",
    free: "Free",
    basic: "Basic",
    premium: "Premium",
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user || !user.emailVerified) {
        navigate("/");
      } else {
        setUser({
          name: user.displayName,
          email: user.email,
          plan: "free" as keyof typeof planNames,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const [user, setUser] = useState({
    name: auth.currentUser?.displayName,
    email: auth.currentUser?.email,
    plan: "free" as keyof typeof planNames,
  });

  // Plans: free, basic, premium
  React.useEffect(() => {
    const fetchUserPlan = async () => {
      if (auth.currentUser) {
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        setUser((prevUser) => {
          const plan =
            (idTokenResult.claims.plan as keyof typeof planNames) || "free";
          return {
            ...prevUser,
            plan,
          };
        });
      }
    };

    fetchUserPlan();
  }, []);

  const doLogout = async () =>
    logout()
      .then()
      .catch((err) => console.error(err))
      .finally(() => navigate("/"));

  const handleUpdateName = async () => {
    try {
      await updateProfile(auth.currentUser!, { displayName: newName });
      setUser((prev) => ({ ...prev, name: newName }));
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
    if (
      window.confirm(
        "Are you sure you want to permanently delete your account?"
      )
    ) {
      try {
        await deleteUser(auth.currentUser!);
        navigate("/");
      } catch (error) {
        setError("Error deleting account. Please reauthenticate.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AuthHeader />
      <div className="font-dosis w-full mx-auto space-y-8 mt-14 px-20">
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
            Welcome back{user.name ? `, ${user.name}` : ``}!
          </h2>
        </div>

        {/* Plan Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F3F7F6] p-6 rounded-xl shadow-xs">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-[#707978] font-medium text-xl mb-4">
              YOUR PLAN
            </h3>
            <span className="text-black font-bold text-4xl">
              Story Palace {planNames[user.plan]}
            </span>
          </div>
          {user.plan === "premium" ? (
            <button className="w-full sm:w-auto md:w-80 bg-gray-600 text-white px-3 py-3 rounded-3xl hover:bg-gray-700 transition-colors">
              Manage Plan
            </button>
          ) : (
            <button
              onClick={() => navigate("/upgrade")}
              className="w-full sm:w-auto md:w-80 bg-custom-teal text-white px-3 py-3 rounded-3xl hover:bg-blue-600 transition-colors"
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
          <div className="space-y-8">
            <div className="text-xl">
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
                    className="text-base w-auto bg-custom-teal text-white px-6 py-3 rounded-3xl hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="text-base border border-[#829793] px-3 py-3 rounded-3xl w-auto bg-white text-black hover:text-blue-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="text-[#707978] mt-1 flex items-center gap-2">
                  {user.name || "You don't have a name yet..."}
                  <button
                    onClick={() => {
                      setNewName(user.name || "");
                      setEditingName(true);
                    }}
                    className="underline text-[#06846F] hover:text-blue-500"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div className="text-xl">
              <label className="text-black block">Email Address</label>
              <div className="text-[#707978] mt-1">{user.email}</div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div>
                <label className="text-xl text-black block">Password</label>
                <div className="text-[#707978] mt-1">**********</div>
              </div>
              <div>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="border border-[#829793] px-3 py-3 rounded-3xl w-auto bg-white text-black hover:text-blue-600 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg space-y-4">
              <h3 className="text-xl font-bold">Change Password</h3>
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
                  className="text-base w-auto bg-custom-teal text-white px-5 py-3 rounded-3xl hover:bg-blue-600 transition-colors"
                >
                  Submit
                </button>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="text-base border border-[#829793] px-3 py-3 rounded-3xl w-auto bg-white text-black hover:text-blue-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div className="bg-white p-6 space-y-16 pl-0">
          <button
            onClick={doLogout}
            className="w-[200px] text-black py-3 px-3 border border-[#829793] rounded-3xl hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
          <div className="">
            <button
              onClick={handleDeleteAccount}
              className="w-[200px] text-[#EF4444] hover:text-red-700 px-4 py-2 border border-[#EF4444] rounded-3xl hover:bg-red-50 transition-colors"
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
