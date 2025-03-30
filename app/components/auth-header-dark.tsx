import { useNavigate } from "react-router";
import { StoryPalaceLogoWithText } from "./icons/story-palace-logo";
import { StoryPalaceLogoNoText } from "./icons/story-palace-logo-no-text";
import { StoryPalaceLogoWhite } from "./icons/sp-logo-white";

const AuthHeaderDark = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Sticky Navigation Bar */}
      <nav className="bg-custom-bg-dark text-white drop-shadow-[0_10px_25px_rgba(255,255,255,0.07)] sticky h-[64px] top-0 z-50 relative font-dosis text-sm font-[700]">
        {/* Responsive Logo */}
        {/* Left-aligned Logo */}
        <button
          className="cursor-pointer absolute top-1/2 -translate-y-1/2 left-8"
          onClick={() => navigate("/")}
        >
          {/* Desktop logo (visible on medium screens and up) */}
          <span className="flex items-center">
            <StoryPalaceLogoWhite className="h-8" />{" "}
            <p className="hidden sm:block ml-2 tracking-tight font-fraunces text-2xl font-semibold">
              Story Palace
            </p>
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
            className="cursor-pointer bg-[#172624] hover:bg-teal-700 focus:outline-hidden focus:ring-4 focus:ring-green-300 rounded-[30px] px-5 py-2.5 text-center me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          >
            My Account
          </button>
        </div>
      </nav>
    </>
  );
};

export default AuthHeaderDark;
