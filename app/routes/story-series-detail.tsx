import { useNavigate } from "react-router";
import AuthHeaderDark from "~/components/dark-theme-auth-header";
import { PlayIconWhite } from "~/components/icons/play";

const StorySeriesDetailPage = () => {
  const navigate = useNavigate();
  const episodes = [
    "Episode 1: The Garden Prank",
    "Episode 2: The Magic Leaf",
    "Episode 3: The Magic Leaf",
    "Episode 4: The Magic Leaf",
    "Episode 5: The Magic Leaf",
  ];

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Tales of Lily and Leo</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">EPISODES</p>
              <p className="text-lg">5 Episodes</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">AGE GROUP</p>
              <p className="text-lg">3-8 years</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">DURATION</p>
              <p className="text-lg">7 mins</p>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={() => navigate("/player")}
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
            Lily and Leo love exploring, but their adventures take a magical
            turn when the mischievous pixies hiding in their backyard start
            playing tricks on them! With their wise old cat watching over them,
            they unravel tiny mysteries, solve playful problems, and learn
            important lessons about kindness, friendship, and perseverance.
          </p>
        </div>

        {/* Episode List */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-6">Episode List</h2>
          <div className="space-y-4">
            {episodes.map((episode, index) => (
              <div
                key={index}
                className="bg-[#161D1C] p-4 rounded-xl flex justify-between items-center
                  hover:bg-[#1e2525] transition-colors"
              >
                <span className="text-gray-300">{episode}</span>
                <button
                  className="text-custom-teal hover:text-[#05b092] transition-colors
                    flex items-center gap-2"
                  onClick={() => navigate(`/player?episode=${index + 1}`)}
                >
                  <PlayIconWhite className="w-5 h-5" />
                  Play
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StorySeriesDetailPage;
