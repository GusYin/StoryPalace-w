import { useNavigate } from "react-router";
import { StoryPalaceLogoWithText } from "./icons/story-palace-logo";
import { getAuth } from "firebase/auth";

const UnauthHeader = () => {
  const navigate = useNavigate();

  const doGetStarted = () => {
    const user = getAuth().currentUser;

    if (user) {
      if (user.emailVerified) navigate("/my-account");
      else navigate("/verify-email");
    }

    // If no user, we stay on this page.
  };

  const doLogin = () => {
    const user = getAuth().currentUser;

    if (user) {
      if (user.emailVerified) navigate("/my-account");
      else navigate("/verify-email");
    } else navigate("/login");
  };

  return (
    <>
      {/* Sticky Navigation Bar */}
      <nav className="pr-8 shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] font-dosis text-sm font-[700] sticky h-[64px] top-0 bg-white shadow-xs z-50 relative">
        {/* Left-aligned Logo */}
        <button
          className="cursor-pointer absolute top-1/2 -translate-y-1/2"
          onClick={() => navigate("/")}
        >
          <StoryPalaceLogoWithText />
        </button>

        {/* Right-aligned Auth Buttons */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex space-x-9 items-center">
          <button className="hover:text-blue-600">Library</button>
          <button onClick={doLogin} className="hover:text-blue-600">
            Login
          </button>
          <button
            type="button"
            onClick={doGetStarted}
            className="text-white bg-custom-teal hover:bg-teal-700 focus:outline-hidden focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          >
            Get started
          </button>
        </div>
      </nav>
    </>
  );
};

export default UnauthHeader;
