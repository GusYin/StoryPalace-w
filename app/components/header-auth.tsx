import { useNavigate } from "react-router";
import { StoryPalaceLogoWithText } from "./icons/story-palace-logo";
import { StoryPalaceLogoNoText } from "./icons/story-palace-logo-no-text";

const AuthHeader = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Sticky Navigation Bar */}
      <nav className="drop-shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] sticky h-[64px] top-0 bg-white drop-shadow-sm z-50 relative font-dosis text-sm font-[700]">
        {/* Responsive Logo */}
        {/* Left-aligned Logo */}
        <button
          className="cursor-pointer absolute top-1/2 -translate-y-1/2 left-4 md:left-8"
          onClick={() => navigate("/")}
        >
          {/* Mobile logo (visible on small screens) */}
          <span className="block md:hidden">
            <StoryPalaceLogoNoText className="h-8 w-auto" />
          </span>

          {/* Desktop logo (visible on medium screens and up) */}
          <span className="hidden md:block -ml-8">
            <StoryPalaceLogoWithText className="h-8 w-auto" />
          </span>
        </button>

        {/* Right-aligned Auth Buttons */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex space-x-4 items-center">
          <button
            onClick={() => navigate("/library")}
            className="cursor-pointer hover:text-blue-600"
          >
            Library
          </button>
          <button
            type="button"
            onClick={() => navigate("/my-account")}
            className="cursor-pointer text-black bg-grey-bg-lucile hover:bg-teal-700 focus:outline-hidden focus:ring-4 focus:ring-green-300 rounded-[30px] px-5 py-2.5 text-center me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          >
            My Account
          </button>
        </div>
      </nav>
    </>
  );
};

export default AuthHeader;
