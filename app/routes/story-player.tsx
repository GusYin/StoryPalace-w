import { useLocation, useNavigate } from "react-router";
import AuthHeaderDark from "~/components/auth-header-dark";
import DarkThemeStoryPlayer from "~/components/dark-theme-story-player";

const StoryPlayerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { storyId } = location.state || {};

  // Dummy narrators and episodes data
  const narrators = [
    { voiceName: "Jo", isReady: true },
    { voiceName: "Mummy", isReady: false },
    { voiceName: "Daddy", isReady: false },
  ];

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
        <div className="md:-mt-8 w-full md:max-w-[330px]">
          <div className="mb-8 flex flex-col items-center gap-4">
            {/* Story Title */}
            <h1 className="text-3xl mb-5">Tales of Lily and Leo</h1>
            <div className="bg-[#161D1C] rounded-2xl shadow-md overflow-hidden w-full p-5">
              {" "}
              <h2 className="text-md mb-3">Select your narrator:</h2>
              <div className="flex gap-3">
                {narrators.map((narrator) => (
                  <button
                    key={narrator.voiceName}
                    className={`text-md px-4 py-1 ${
                      narrator.isReady
                        ? `bg-[#07C5A5] text-[#0D0D0D]`
                        : `bg-[#172624] text-[#707978] hover:bg-custom-teal/20`
                    } rounded-full transition-colors`}
                  >
                    {narrator.voiceName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Directly use the DarkThemeStoryPlayer with episode data */}
          <DarkThemeStoryPlayer />
        </div>
      </div>
    </div>
  );
};

export default StoryPlayerPage;
