import { useNavigate } from "react-router";
import { StoryPalaceLogoBlack } from "./icons/story-palace-logo-black";
import Spinner from "./spinner";

const SkeletonHeader = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Sticky Navigation Bar */}
      <nav className="drop-shadow-[0_4px_20px_0_rgba(0,0,0,0.05)] sticky h-[64px] top-0 bg-white drop-shadow-sm z-50 relative font-dosis text-lg font-semibold">
        {/* Responsive Logo */}
        {/* Left-aligned Logo */}
        <button
          className="cursor-pointer absolute top-1/2 -translate-y-1/2 left-4 sm:left-6 lg:left-8"
          onClick={() => navigate("/")}
        >
          {/* logo */}
          <span className="flex items-center">
            <StoryPalaceLogoBlack className="h-8" />{" "}
            <p className="hidden md:block ml-2 tracking-tight font-fraunces text-2xl font-semibold">
              Story Palace
            </p>
          </span>
        </button>

        {/* Right-aligned Auth Buttons */}
        <div className="absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 flex space-x-4 items-center">
          <button
            type="button"
            className="cursor-pointer text-custom-text-grey bg-grey-bg-lucile hover:bg-teal-700 focus:outline-hidden focus:ring-4 focus:ring-green-300 rounded-[30px] px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          >
            <Spinner />
          </button>
        </div>
      </nav>
    </>
  );
};

export default SkeletonHeader;
