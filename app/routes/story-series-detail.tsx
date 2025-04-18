import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import AuthHeaderDark from "~/components/dark-theme-auth-header";
import { PlayIconWhite } from "~/components/icons/play";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import { ImageWithLoader, type LightweightStory, type Story } from "./library";
import localforage from "localforage";

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours

const StorySeriesDetailPage = () => {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const location = useLocation();
  const [story, setStory] = useState<LightweightStory>(location.state?.story);
  const [loading, setLoading] = useState(!location.state?.story);

  useEffect(() => {
    if (!storyId) return;

    const fetchStory = async () => {
      try {
        const cacheKey = `story_metadata_${storyId}`;

        // Check cache first
        const cachedStory = await localforage.getItem<{
          data: LightweightStory;
          timestamp: number;
        }>(cacheKey);

        if (cachedStory && Date.now() - cachedStory.timestamp < STORY_TTL) {
          setStory(cachedStory.data);
          setLoading(false);
          return;
        }

        // Fetch from Firebase if no valid cache
        const getStory = httpsCallable<{ storyId: string }, { story: Story }>(
          functions,
          "getStoryMetadata"
        );
        const result = await getStory({ storyId });
        setStory(result.data.story);
        await localforage.setItem(cacheKey, {
          data: result.data.story,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Error fetching story:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!location.state?.story) {
      fetchStory();
    }
  }, [storyId, location.state]);

  return (
    <div className="min-h-screen bg-custom-bg-dark font-dosis text-white">
      <AuthHeaderDark />

      <main className="px-8 sm:px-14 max-w-4xl mx-auto mt-8">
        {/* Back Navigation - stays on top */}
        <button
          onClick={() => navigate("/library")}
          className="mb-8 hover:text-custom-teal transition-colors"
        >
          ← Back to library
        </button>

        {/* Main Content Container */}
        <div className="md:flex md:gap-8">
          {/* Left Sidebar (Image + Play Button) */}
          <div className="md:w-1/3 md:sticky md:top-8 md:self-start">
            {/* Story Image */}
            <div className="aspect-[4/4] bg-gray-500 mb-4 overflow-hidden rounded-xl">
              <ImageWithLoader src={story.imgSrc} alt={story.metadata.title} />
            </div>

            {/* Play Button */}
            <button
              onClick={() =>
                navigate("/story-player", { state: { storyId: story.id } })
              }
              className="w-full bg-custom-teal text-black py-4 rounded-xl font-semibold
              hover:bg-[#05b092] transition-colors flex items-center justify-center gap-2
              mb-8 md:mb-0"
            >
              <PlayIconWhite className="w-6 h-6" />
              Play this series
            </button>
          </div>

          {/* Right Content */}
          <div className="md:w-2/3">
            {loading ? (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[.7px] flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-bold mb-6">
                  {story.metadata.title}
                </h1>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-[#161D1C] p-4 rounded-xl">
                    <p className="text-gray-400 text-sm mb-1">EPISODES</p>
                    <p className="text-lg">{story.episodes.length}</p>
                  </div>
                  <div className="bg-[#161D1C] p-4 rounded-xl">
                    <p className="text-gray-400 text-sm mb-1">AGE GROUP</p>
                    <p className="text-lg">{story.metadata.recommendedAge}</p>
                  </div>
                  <div className="bg-[#161D1C] p-4 rounded-xl">
                    <p className="text-gray-400 text-sm mb-1">DURATION</p>
                    <p className="text-lg">
                      {story.metadata.durationMinutes} mins
                    </p>
                  </div>
                </div>

                {/* Story Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4">About the Series</h2>
                  <p className="text-gray-300 leading-relaxed">
                    {story.metadata.description}
                  </p>
                </div>

                {/* Episode List */}
                <div className="mb-20">
                  <h2 className="text-2xl font-bold mb-6">Episode List</h2>
                  <div className="space-y-4">
                    {story.episodes.map((episode, index) => (
                      <div
                        key={index}
                        className="bg-[#161D1C] p-4 rounded-xl flex justify-between items-center
                        hover:bg-[#1e2525] transition-colors"
                      >
                        <span className="text-gray-300">
                          Episode {index + 1}: {episode.metadata.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StorySeriesDetailPage;
