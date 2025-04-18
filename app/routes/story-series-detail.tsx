import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import AuthHeaderDark from "~/components/dark-theme-auth-header";
import { PlayIconWhite } from "~/components/icons/play";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import type { Story } from "./library";

const StorySeriesDetailPage = () => {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const location = useLocation();
  const [story, setStory] = useState<Story>(location.state?.story);
  const [loading, setLoading] = useState(!location.state?.story);

  useEffect(() => {
    if (!storyId) return;

    const fetchStory = async () => {
      try {
        const getStory = httpsCallable<{ storyId: string }, { story: Story }>(
          functions,
          "getStoryMetadata"
        );
        const result = await getStory({ storyId });
        setStory(result.data.story);
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

      <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mt-8">
        {/* Back Navigation */}
        <button
          onClick={() => navigate("/library")}
          className="mb-8 hover:text-custom-teal transition-colors"
        >
          ← Back to library
        </button>

        {/* Series Header */}
        <div>
          {loading ? (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[.7px] flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">
                  {story.metadata.title}
                </h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-gray-400 text-sm">EPISODES</p>
                    <p className="text-lg">{story.episodes.length} Episodes</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">AGE GROUP</p>
                    <p className="text-lg">
                      {story.metadata.recommendedAge} years
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">DURATION</p>
                    <p className="text-lg">
                      {story.metadata.durationMinutes} minutes
                    </p>
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={() =>
                    navigate("/story-player", {
                      state: { storyId: story.id },
                    })
                  }
                  className="w-full bg-custom-teal text-black py-4 rounded-xl font-semibold
              hover:bg-[#05b092] transition-colors flex items-center justify-center gap-2"
                >
                  <PlayIconWhite className="w-6 h-6" />
                  Play this series
                </button>
              </div>

              {/* Story Description */}
              <div className="mb-12">
                <p className="text-gray-300 leading-relaxed">
                  Lily and Leo love exploring, but their adventures take a
                  magical turn when the mischievous pixies hiding in their
                  backyard start playing tricks on them! With their wise old cat
                  watching over them, they unravel tiny mysteries, solve playful
                  problems, and learn important lessons about kindness,
                  friendship, and perseverance.
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
                        {episode.metadata.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StorySeriesDetailPage;
