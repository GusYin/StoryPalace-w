import { useState, type ChangeEvent } from "react";
import AuthHeaderDark from "~/components/auth-header-dark";
import { SearchIcon } from "~/components/icons/search-icon";

interface Story {
  title: string;
  episodes: string;
  imgSrc?: string;
  description: string;
}

const LibraryPage = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const stories: Story[] = [
    {
      title: "Tales of Lily and Leo",
      episodes: "3+15 episodes",
      imgSrc: "../images/Tales_of_Lily_and_Leo.svg",
      description:
        "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
    },
    {
      title: "The Enchanted Forest",
      episodes: "3+15 episodes",
      description:
        "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
    },
    {
      title: "The Enchanted Forest",
      episodes: "3+15 episodes",
      description:
        "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
    },
    {
      title: "The Enchanted Forest",
      episodes: "3+15 episodes",
      description:
        "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
    },
    {
      title: "The Enchanted Forest",
      episodes: "3+15 episodes",
      description:
        "Dive into the magical world of 'The Enchanted Forest', where every tree tells a story and every creature has a tale...",
    },
    // Add more stories as needed
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
            {stories.map((story, index) => (
              <div
                key={index}
                className="bg-[#161D1C] rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-5">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">{story.title}</h3>
                    <span className="text-sm">{story.episodes}</span>
                  </div>

                  {/* Image Placeholder */}
                  <div className="h-48 bg-gray-200">
                    <img
                      src={story.imgSrc}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                    {story.description}
                  </p>

                  <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Play this series
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
