import { useLocation, useNavigate } from "react-router";
import AuthHeaderDark from "~/components/auth-header-dark";
import DarkThemeStoryPlayer from "~/components/dark-theme-story-player";

const StoryPlayerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { storyId } = location.state || {};

  // Dummy narrators and episodes data
  const narrators = ["Jo", "Alex", "Sam"];

  if (!storyId) {
    navigate("/library");
    return null;
  }

  return (
    <div className="min-h-screen bg-custom-bg-dark font-dosis text-white">
      <AuthHeaderDark />
      <div className="px-20 flex flex-col items-center mt-15">
        <div className="w-full flex flex-col md:flex-row md:justify-between items-center">
          {/* Back Navigation */}
          <a
            href="/library"
            className="-ml-4 mb-4 md:mb-0 hover:text-[#E7D5C0] text-xl transition-colors"
          >
            ← Back to library
          </a>
        </div>

        {/* Narrator Selection */}
        <div className="md:-mt-8 mb-8 flex flex-col items-center gap-4">
          {/* Story Title */}
          <h1 className="text-4xl text-[#F5EBDC] font-dosis text-start">
            Tales of Lily and Leo
          </h1>
          <h2 className="text-[#F5EBDC] text-xl font-dosis">
            Select your narrator:
          </h2>
          <div className="flex gap-4">
            {narrators.map((narrator) => (
              <button
                key={narrator}
                className="px-6 py-2 border border-custom-teal rounded-full 
                         hover:bg-custom-teal/20 transition-colors"
              >
                {narrator}
              </button>
            ))}
          </div>
        </div>

        {/* Directly use the DarkThemeStoryPlayer with episode data */}
        <DarkThemeStoryPlayer />
      </div>
    </div>
  );
};

export default StoryPlayerPage;
