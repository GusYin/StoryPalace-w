import React from "react";
import { useNavigate } from "react-router";
import AuthHeader from "~/components/auth-header";
import { auth, logout } from "~/firebase/firebase";

const MyAccount: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = React.useState({
    name: auth.currentUser?.displayName,
    email: auth.currentUser?.email,
  });

  React.useEffect(() => {
    const fetchUserPlan = async () => {
      if (auth.currentUser) {
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        setUser((prevUser) => ({
          ...prevUser,
          plan: idTokenResult.claims.plan || "Free",
        }));
      }
    };

    fetchUserPlan();
  }, []);

  const doLogout = async () =>
    logout()
      .then()
      .catch((err) => console.error(err))
      .finally(() => navigate("/"));

  return (
    <div className="min-h-screen bg-white">
      <AuthHeader />
      <div className="font-dosis w-full mx-auto space-y-8 mt-14 px-20">
        {/* Combined Title and Welcome Section */}
        <div className="text-black tracking-[3%] bg-white p-6 space-y-5 mb-[46px] pl-0">
          <div className="text-xl font-medium">MY ACCOUNT</div>
          <h2 className="font-fraunces font-semibold text-4xl">
            Welcome back{user.name ? `, ${user.name}` : ``}!
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
          <button
            onClick={() => console.log("/upgrade-to-")}
            className="w-full sm:w-auto md:w-80 bg-custom-teal text-white px-3 py-3 rounded-3xl hover:bg-blue-600 transition-colors"
          >
            Upgrade plan
          </button>
        </div>

        {/* Account Settings */}
        <div className="bg-[#F3F7F6] p-6 rounded-lg shadow-sm">
          <h3 className="text-[#707978] font-medium text-xl mb-3">
            ACCOUNT SETTINGS
          </h3>
          <div className="space-y-8">
            <div className="text-xl">
              <label className="text-black block">Name</label>
              <div className="text-[#707978] mt-1">
                {user.name || "You don't have a name yet..."}
              </div>
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
                <button className="border border-[#829793] px-3 py-3 rounded-3xl w-auto bg-white text-black hover:text-blue-600 transition-colors">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="bg-white p-6 shadow-sm space-y-16 pl-0">
          <button
            onClick={doLogout}
            className="w-[200px] text-black py-3 px-3 border border-[#829793] rounded-3xl hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
          <div className="">
            <button className="w-[200px] text-[#EF4444] hover:text-red-700 px-4 py-2 border border-[#EF4444] rounded-3xl hover:bg-red-50 transition-colors">
              Delete Account
            </button>
            <p className="text-lg text-[#707978] mt-2">
              Deleting your account is permanent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
