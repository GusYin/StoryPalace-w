import { useNavigate } from "react-router";
import { StoryPalaceLogo } from "./icons/story-palace-logo";

const AuthHeader = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Sticky Navigation Bar */}
      <nav className="shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] sticky h-[64px] top-0 bg-white shadow-sm z-50 relative font-dosis text-sm font-[700]">
        {/* Left-aligned Logo */}
        <button
          className="absolute top-1/2 -translate-y-1/2"
          onClick={() => navigate("/")}
        >
          <StoryPalaceLogo />
        </button>

        {/* Right-aligned Auth Buttons */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex space-x-4 items-center">
          <button
            onClick={() => navigate("/library")}
            className="hover:text-blue-600"
          >
            Library
          </button>
          <button
            type="button"
            onClick={() => navigate("/my-account")}
            className="text-black bg-grey-bg-lucile hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-green-300 rounded-[30px] px-5 py-2.5 text-center me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          >
            My Account
          </button>
        </div>
      </nav>
    </>
  );
};

export default AuthHeader;
