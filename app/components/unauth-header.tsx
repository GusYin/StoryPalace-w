import { useNavigate } from "react-router";
import { StoryPalaceLogo } from "./icons/story-palace-logo";
import { getAuth } from "firebase/auth";

const UnauthHeader = () => {
  const navigate = useNavigate();

  const doGetStarted = () => {
    const user = getAuth().currentUser;

    if (user) {
      if (user.emailVerified) navigate("/dashboard");
      else navigate("/verify-email");
    }

    // If no user, we stay on this page.
  };

  const doLogin = () => {
    const user = getAuth().currentUser;

    if (user) {
      if (user.emailVerified) navigate("/dashboard");
      else navigate("/verify-email");
    } else navigate("/login");
  };

  return (
    <>
      {/* Sticky Navigation Bar */}
      <nav className="shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] font-dosis text-sm font-[700] sticky h-[64px] top-0 bg-white shadow-sm z-50 relative">
        {/* Left-aligned Logo */}
        <button
          className="absolute top-1/2 -translate-y-1/2"
          onClick={() => navigate("/")}
        >
          <StoryPalaceLogo />
        </button>

        {/* Centered Navigation Buttons */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex space-x-8">
          <button className="hover:text-blue-600">Library</button>
          <button className="hover:text-blue-600">Story Player</button>
        </div>

        {/* Right-aligned Auth Buttons */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex space-x-4 items-center">
          <button onClick={doLogin} className="hover:text-blue-600">
            Login
          </button>
          <button
            type="button"
            onClick={doGetStarted}
            className="text-white bg-custom-teal hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          >
            Get started
          </button>
        </div>
      </nav>
    </>
  );
};

export default UnauthHeader;
