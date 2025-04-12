import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import AuthHeaderDark from "~/components/dark-theme-auth-header";
import { SearchIcon } from "~/components/icons/search-icon";
import { PlayIconWhite } from "~/components/icons/play";
import { useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";

interface StoryMetadata {
  title: string;
  description: string;
  episodeSeries: string;
  language?: string;
  recommendedAge?: string;
  categories?: string[];
  author?: string;
  durationMinutes?: number;
}

interface EpisodeMetadata {
  title: string;
  order?: number;
  durationSeconds?: number;
  keywords?: string[];
}

interface Story {
  id: string;
  metadata: StoryMetadata;
  episodes: Episode[];
  imgSrc?: string;
}

interface Episode {
  id: string;
  metadata: EpisodeMetadata;
  contentUrl: string;
  audioUrls: string[];
}

type UserPlan = "free" | "basic" | "premium";

const LibraryPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const getStories = httpsCallable<
          {},
          { stories: Story[]; nextPageToken?: string }
        >(functions, "getStories");
        const firstPageResult = await getStories({});
        setStories(firstPageResult.data.stories);
      } catch (error) {
        console.error("Error fetching stories:", error);
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [loading]);

  const filteredStories = useMemo(() => {
    if (!searchQuery) return stories;

    const lowerQuery = searchQuery.toLowerCase();
    return stories.filter(
      (story) =>
        story.metadata.title.toLowerCase().includes(lowerQuery) ||
        story.metadata.description.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, stories]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-custom-bg-dark">
        <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-bg-dark">
      <AuthHeaderDark />

      {/* Main Content */}
      <main className="font-dosis px-4 sm:px-6 lg:px-8 text-white flex flex-col items-center mt-15">
        <div className="max-w-7xl mx-auto">
          {/* Search area */}
          <div className="mb-13">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-center gap-4">
              <h1 className="font-fraunces font-semibold text-4xl text-center md:text-left">
                Library
              </h1>
              <div className="w-full md:max-w-[350px] md:justify-self-end relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  className="placeholder-white bg-[#121212] w-full pl-[37px] pr-7 py-2 rounded-xl border-1 border-custom-stroke-grey focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>

          {/* Stories Grid */}
          <div className="">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-12 justify-items-center">
              {filteredStories.map((story, index) => (
                <div
                  key={index}
                  className="bg-[#161D1C] rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-5">
                    <div className="mb-2">
                      <h3 className="text-xl font-semibold mb-2">
                        {story.metadata.title}
                      </h3>
                      <span className="text-sm">
                        {story.metadata.episodeSeries}
                      </span>
                    </div>

                    {/* Story image
                    The aspect ratio 3/4 (0.75) is commonly used for book covers, 
                    but we can adjust the ratio in aspect-[X/Y] to match 
                    specific image requirements if needed. */}
                    <div className="aspect-[4/4] bg-gray-500 mb-2 w-full overflow-hidden">
                      <img
                        src={story.imgSrc}
                        alt={story.metadata.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <p className="text-sm mb-2 line-clamp-4">
                      {story.metadata.description}
                    </p>

                    {/* Play button */}
                    <button
                      onClick={() =>
                        navigate("/story-player", {
                          state: { storyId: story.id },
                        })
                      }
                      className="flex items-center justify-center gap-2 cursor-pointer border-1 border-white text-white px-4 py-2 rounded-3xl hover:bg-custom-teal transition-colors"
                    >
                      <PlayIconWhite />
                      <span>Play this series</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LibraryPage;
