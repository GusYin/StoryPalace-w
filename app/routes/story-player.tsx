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
    <div className="min-h-screen bg-custom-bg-dark">
      <AuthHeaderDark />
      <div className="min-h-screen bg-[#0D1715] p-8 flex flex-col items-center">
        {/* Back Navigation */}
        <a
          href="/library"
          className="self-start text-[#F5EBDC] hover:text-[#E7D5C0] text-lg mb-8 transition-colors font-dosis"
        >
          ← Back to library
        </a>

        {/* Story Title */}
        <h1 className="text-4xl text-[#F5EBDC] font-dosis mb-6 text-center">
          Tales of Lily and Leo
        </h1>

        {/* Narrator Selection */}
        <div className="mb-8 flex flex-col items-center gap-4">
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
