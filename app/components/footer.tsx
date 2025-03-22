import { Link, useNavigate } from "react-router";
import { StoryPalaceLogoNoText } from "./icons/story-palace-logo-no-text";
import { StoryPalaceLogoWithText } from "./icons/story-palace-logo";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="font-dosis w-full bg-grey-bg-lucile py-8">
      <button
        className="top-1/2 -translate-y-1/2 left-4 md:left-8"
        onClick={() => navigate("/")}
      >
        {/* Mobile logo (visible on small screens) */}
        <span className="block md:hidden">
          <StoryPalaceLogoNoText className="h-8 w-auto" />
        </span>

        {/* Desktop logo (visible on medium screens and up) */}
        <span className="hidden md:block">
          <StoryPalaceLogoWithText className="h-8 w-auto" />
        </span>
      </button>

      <div className="px-20 mx-auto">
        <h3 className="text-[#707978] font-medium text-xl mb-4">FOLLOW US</h3>
        <div className="flex space-x-6">
          <Link
            to="/"
            className="text-black text-lg hover:text-blue-600 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/library"
            className="text-black text-lg hover:text-blue-600 transition-colors"
          >
            Library
          </Link>
          <Link
            to="/pricing"
            className="text-black text-lg hover:text-blue-600 transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/contact"
            className="text-black text-lg hover:text-blue-600 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
