import { Link, useNavigate } from "react-router";
import { StoryPalaceLogoWithText } from "./icons/story-palace-logo";
import { InstagramIcon } from "./icons/instagram";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="font-dosis w-full bg-grey-bg-lucile py-12">
      <div className="px-20 mx-auto">
        {/* Main container with 2 columns on desktop */}
        <div className="flex flex-col md:flex-row md:justify-between gap-8">
          {/* Left Column (Logo + Social) */}
          <div className="flex flex-col space-y-10 md:max-w-[50%]">
            <button onClick={() => navigate("/")} className="self-start">
              <StoryPalaceLogoWithText className="h-8 w-auto -ml-8" />
            </button>

            {/* Updated Social Section */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[#707978] font-medium text-xl">FOLLOW US</h3>
              <InstagramIcon className="ml-[-2px]" />{" "}
              {/* Added slight alignment adjustment */}
            </div>
          </div>

          {/* Right Column (Links) - Vertical on desktop */}
          <div className="md:self-start">
            <div className="text-black text-md flex flex-row flex-wrap gap-x-6 gap-y-4 md:flex-col md:gap-4">
              <Link to="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link
                to="/library"
                className="hover:text-blue-600 transition-colors"
              >
                Library
              </Link>
              <Link
                to="/pricing"
                className="hover:text-blue-600 transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/contact"
                className="hover:text-blue-600 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
