import { useMemo, useState, type ChangeEvent } from "react";
import AuthHeaderDark from "~/components/auth-header-dark";
import { SearchIcon } from "~/components/icons/search-icon";
import TalesOfLilyAndLeo from "../images/Tales_of_Lily_and_Leo.svg";
import { PlayIconWhite } from "~/components/icons/play";
import { useNavigate } from "react-router";

interface Story {
  id: string;
  title: string;
  episodes: string;
  imgSrc?: string;
  description: string;
}

const LibraryPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const stories: Story[] = [
    {
      id: "1",
      title: "Tales of Lily and Leo",
      episodes: "3+15 episodes",
      imgSrc: TalesOfLilyAndLeo,
      description:
        "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
    },
    {
      id: "2",
      title: "The Enchanted Forest",
      episodes: "3+15 episodes",
      description:
        "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
    },
    {
      id: "3",
      title: "The Enchanted Forest",
      episodes: "3+15 episodes",
      description:
        "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
    },
    {
      id: "4",
      title: "The Enchanted Forest",
      episodes: "3+15 episodes",
      description:
        "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
    },
    {
      id: "5",
      title: "The Enchanted Forest",
      episodes: "3+15 episodes",
      description:
        "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
    },
    // Add more stories as needed
  ];

  // Use useMemo to optimize search filtering
  const filteredStories = useMemo(() => {
    if (!searchQuery) return stories;

    const lowerQuery = searchQuery.toLowerCase();
    return stories.filter(
      (story) =>
        story.title.toLowerCase().includes(lowerQuery) ||
        story.description.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, stories]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen bg-custom-bg-dark">
      <AuthHeaderDark />

      {/* Main Content */}
      <main className="font-dosis px-8 lg:px-15 text-white flex flex-col items-center mt-15">
        {/* Search area */}
        <div className="w-full max-w-5xl mb-13">
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
        <div className="w-full max-w-5xl px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 justify-items-center">
            {filteredStories.map((story, index) => (
              <div
                key={index}
                className="bg-[#161D1C] rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-5">
                  <div className="mb-2">
                    <h3 className="text-xl font-semibold mb-2">
                      {story.title}
                    </h3>
                    <span className="text-sm">{story.episodes}</span>
                  </div>

                  {/* Image Placeholder */}
                  <div className="h-48 bg-gray-500 mb-2">
                    <img
                      src={story.imgSrc}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <p className="text-sm mb-2 line-clamp-4">
                    {story.description}
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
      </main>
    </div>
  );
};

export default LibraryPage;
