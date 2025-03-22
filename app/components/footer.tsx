import { Link, useNavigate } from "react-router";
import { StoryPalaceLogoWithText } from "./icons/story-palace-logo";
import { InstagramIcon } from "./icons/instagram";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="font-dosis w-full bg-grey-bg-lucile py-8 py-12">
      <div className="px-20 mx-auto">
        <button
          className="top-1/2 -translate-y-1/2 left-4 md:left-8"
          onClick={() => navigate("/")}
        >
          <StoryPalaceLogoWithText className="h-8 w-auto -ml-8" />
        </button>
        <h3 className="text-[#707978] font-medium text-xl mb-4">FOLLOW US</h3>
        <InstagramIcon />
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
