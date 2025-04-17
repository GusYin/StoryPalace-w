import { useLocation, useNavigate } from "react-router";
import AuthHeaderDark from "~/components/dark-theme-auth-header";
import DarkThemeStoryPlayer from "~/components/dark-theme-story-player";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import type { Story } from "./library";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import localforage from "localforage";

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const StoryPlayerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { storyId } = location.state || {};
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  // Get cache key for story
  const getStoryCacheKey = (id: string) => `story_${id}`;

  // Cache story data
  const cacheStory = async (storyData: Story) => {
    try {
      await localforage.setItem(getStoryCacheKey(storyData.id), {
        data: storyData,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to cache story:", error);
    }
  };

  // Get cached story
  const getCachedStory = async (id: string) => {
    try {
      const cached = await localforage.getItem<{
        data: Story;
        timestamp: number;
      }>(getStoryCacheKey(id));

      if (cached && Date.now() - cached.timestamp < STORY_TTL) {
        return cached.data;
      }
    } catch (error) {
      console.error("Failed to read cache:", error);
    }
    return null;
  };

  // Dummy narrators and episodes data
  const narrators = [
    { voiceName: "Jokkkkkkkkkkkkkkkkkkkkkkkkkkkkkk", isReady: true },
    // { voiceName: "Mummy", isReady: false },
    // { voiceName: "Daddy", isReady: false },
  ];

  useEffect(() => {
    if (!storyId) {
      navigate("/library");
      return;
    }

    const fetchStory = async () => {
      try {
        setLoading(true);

        // Check cache first
        const cachedStory = await getCachedStory(storyId);
        if (cachedStory) {
          setStory(cachedStory);
          setLoading(false);
          return;
        }

        const getStory = httpsCallable<{ storyId: string }, { story: Story }>(
          functions,
          "getStory"
        );
        const result = await getStory({ storyId });
        const freshStory = result.data.story;

        // Update state and cache
        setStory(freshStory);
        await cacheStory(freshStory);
      } catch (err) {
        console.error("Error fetching story:", err);
        toast.error(
          <div>
            Failed to load story.
            <button
              onClick={fetchStory}
              className="ml-2 px-2 py-1 text-sm bg-white/10 hover:bg-white/20 rounded"
            >
              Retry
            </button>
          </div>,
          { autoClose: false }
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId, navigate]);

  if (!storyId) {
    navigate("/library");
    return null;
  }

  return (
    // md (medium screens (768px) is the breakpoint the audio play
    <div className="min-h-screen bg-custom-bg-dark font-dosis text-white">
      <AuthHeaderDark />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="bg-gray-800 text-white"
      />
      <div className="px-4 sm:px-6 md:px-20 mt-2 md:mt-15 flex flex-col items-center">
        <div className="tall-mobile-margin-bottom w-full flex flex-col md:flex-row md:justify-between items-center">
          {/* Back Navigation */}
          <a
            href="/library"
            className="-ml-4 mb-4 md:mb-0 hover:text-[#E7D5C0] tall-mobile-font-size md:text-xl transition-colors"
          >
            ← Back to library
          </a>
        </div>

        <div className="md:-mt-8 w-full md:max-w-[330px]">
          <div className="mb-2 md:mb-8 gap-2 md:gap-5 flex flex-col items-center">
            {/* Story Title */}
            <h1 className="tall-mobile-margin-bottom tall-mobile-font-size-3 text-lg md:text-3xl">
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
              ) : (
                story?.metadata.title
              )}
            </h1>
            <div className="tall-mobile-margin-bottom p-2 md:p-5 bg-[#161D1C] rounded-2xl shadow-md overflow-hidden w-full">
              {" "}
              {/* Narrator Selection */}
              <h2 className="text-md mb-3">Select your narrator:</h2>
              <div className="flex gap-3">
                {narrators.map((narrator) => (
                  <div key={narrator.voiceName} className="relative">
                    <button
                      className={`max-w-20 overflow-hidden whitespace-nowrap text-ellipsis
                        text-md px-4 py-1 relative ${
                          narrator.isReady
                            ? `bg-[#07C5A5] text-[#0D0D0D]`
                            : `bg-[#172624] text-[#707978]`
                        } rounded-full transition-colors`}
                      disabled={!narrator.isReady}
                    >
                      {narrator.voiceName}

                      {/* Blur overlay with spinner */}
                      {!narrator.isReady && (
                        <div
                          className="absolute 
                          inset-0 bg-black/50 backdrop-blur-[.7px] rounded-full 
                          flex items-center justify-center"
                        >
                          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DarkThemeStoryPlayer episodes={story?.episodes || []} />
        </div>
      </div>
    </div>
  );
};

export default StoryPlayerPage;
