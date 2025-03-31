import { useState, type ChangeEvent } from "react";
import AuthHeaderDark from "~/components/auth-header-dark";
import Header from "~/components/header";

interface Story {
  title: string;
  episodes: string;
  description: string;
}

const LibraryPage = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const stories: Story[] = [
    {
      title: "Tales of Lily and Leo",
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
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <h1 className="font-fraunces font-semibold text-4xl">Library</h1>
            <div className="w-full max-w-[350px] justify-self-end">
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-5 pr-7 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image Placeholder */}
                <div className="h-48 bg-gray-200"></div>

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {story.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {story.episodes}
                    </span>
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
