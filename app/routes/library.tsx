import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import AuthHeaderDark from "~/components/dark-theme-auth-header";
import { SearchIcon } from "~/components/icons/search-icon";
import { PlayIconWhite } from "~/components/icons/play";
import { useNavigate } from "react-router";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import localforage from "localforage";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "~/firebase/firebase";
import Spinner from "~/components/spinner";

export interface StoryMetadata {
  title: string;
  description: string;
  episodeSeries: string;
  language?: string;
  recommendedAge?: string;
  categories?: string[];
  author?: string;
  durationMinutes?: number;
}

export interface EpisodeMetadata {
  title: string;
  order?: number;
  durationSeconds?: number;
  keywords?: string[];
}

export interface Story {
  id: string;
  metadata: StoryMetadata;
  episodes: Episode[];
  imgSrc?: string;
}

export interface Episode {
  id: string;
  metadata: EpisodeMetadata;
  contentUrl: string;
  audioUrls: string[];
}

export interface LightweightStory {
  id: string;
  metadata: StoryMetadata;
  imgSrc?: string;
  episodes: LightweightEpisode[];
}

export interface LightweightEpisode {
  id: string;
  metadata: EpisodeMetadata;
}

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper component for the image with loading state
export const ImageWithLoader = ({
  src,
  alt,
  onLoad,
}: {
  src?: string;
  alt: string;
  onLoad?: () => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState<string | undefined>();

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    const fetchAndCacheImage = async () => {
      try {
        const cacheKey = `image_${src}`;
        const ttl = STORY_TTL; // 24 hours

        // Check cache first
        const cached = await localforage.getItem<{
          url: string;
          timestamp: number;
        }>(cacheKey);

        if (cached && Date.now() - cached.timestamp < ttl) {
          setImgSrc(cached.url);
          setLoading(false);
          return;
        }

        // Get Firebase download URL
        const storageRef = ref(storage, src);
        const downloadURL = await getDownloadURL(storageRef);

        // Cache the download URL
        await localforage.setItem(cacheKey, {
          url: downloadURL,
          timestamp: Date.now(),
        });

        setImgSrc(downloadURL);
      } catch (error) {
        console.error("Image load failed:", error);
        setImgSrc(src); // Fallback to original src
      } finally {
        setLoading(false);
      }
    };

    fetchAndCacheImage();
  }, [src]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
          <Spinner />
        </div>
      )}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          className={`w-full h-full object-cover ${
            loading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => {
            onLoad && onLoad();
          }}
          onError={() => setLoading(false)}
        />
      )}
    </div>
  );
};

const LibraryPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [stories, setStories] = useState<LightweightStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchStoriesMetadata = async (pageToken?: string) => {
    const cacheKey = `stories_metadata_${pageToken || "initial"}`;
    const ttl = STORY_TTL; // 24 hours

    try {
      // Check cache first
      const cachedData = await localforage.getItem<{
        data: { stories: LightweightStory[]; nextPageToken?: string };
        timestamp: number;
      }>(cacheKey);

      if (cachedData && Date.now() - cachedData.timestamp < ttl) {
        return cachedData.data;
      }

      // If no valid cache, fetch from Firebase
      const getStoriesMeta = httpsCallable<
        { pageToken?: string },
        { stories: LightweightStory[]; nextPageToken?: string }
      >(functions, "getStoriesMetadata");

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 10000)
      );

      const result = (await Promise.race([
        getStoriesMeta({ pageToken }),
        timeoutPromise,
      ])) as Awaited<ReturnType<typeof getStoriesMeta>>;

      const data = result.data;

      // Update cache with fresh data
      await localforage.setItem(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error("Error fetching stories metadata:", error);
      throw error;
    }
  };

  const loadInitialStories = async () => {
    try {
      setLoading(true);
      const firstPage = await fetchStoriesMetadata();
      setStories(firstPage.stories);
      setNextPageToken(firstPage.nextPageToken);
      setHasMore(!!firstPage.nextPageToken);
    } catch (error) {
      // Show error with toast
      toast.error(
        <div>
          Failed to load stories.
          <button
            onClick={loadInitialStories}
            className="ml-2 px-2 py-1 text-sm bg-white/10 hover:bg-white/20 rounded"
          >
            Retry
          </button>
        </div>,
        { autoClose: false }
      );
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreStories = async () => {
    if (!hasMore || isFetchingMore || !nextPageToken) return;

    try {
      setIsFetchingMore(true);
      const nextPage = await fetchStoriesMetadata(nextPageToken);
      setStories((prev) => [...prev, ...nextPage.stories]);
      setNextPageToken(nextPage.nextPageToken);
      setHasMore(!!nextPage.nextPageToken);
    } catch (error) {
      toast.error(
        <div>
          Failed to load more stories.
          <button
            onClick={loadMoreStories}
            className="ml-2 px-2 py-1 text-sm bg-white/10 hover:bg-white/20 rounded"
          >
            Retry
          </button>
        </div>,
        { autoClose: false }
      );
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      // 1. Guard clauses to prevent unnecessary checks
      if (!containerRef.current || loading) return;

      // 2. Get scroll position measurements
      /*
        scrollTop: How far the user has scrolled from the top (px)

        scrollHeight: Total height of the scrollable content (px)

        clientHeight: Visible viewport height (px) 
      */
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;

      // 3. Calculate if user is near bottom (with 500px threshold)
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 500;

      // 4. Conditions to trigger loading more content
      if (isNearBottom && hasMore && !isFetchingMore) {
        loadMoreStories();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isFetchingMore, loading]);

  useEffect(() => {
    loadInitialStories();
  }, []);

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

  return (
    <div className="min-h-screen bg-custom-bg-dark">
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

      {/* Main Content */}
      <main className="font-dosis px-4 sm:px-6 lg:px-8 text-white flex flex-col items-center mt-15">
        <div className="max-w-7xl mx-auto" ref={containerRef}>
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
            {loading ? (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[.7px] flex items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <>
                {/* Story grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-12 justify-items-center">
                  {filteredStories.map((story, index) => (
                    <div
                      key={index}
                      className="bg-[#161D1C] rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="p-5">
                        <div
                          className="mb-2 cursor-pointer"
                          onClick={() =>
                            navigate(`/library/${story.id}`, {
                              state: { story },
                            })
                          }
                        >
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
                        <div
                          className="aspect-[4/4] bg-gray-500 mb-2 w-full overflow-hidden cursor-pointer"
                          onClick={() =>
                            navigate(`/library/${story.id}`, {
                              state: { story },
                            })
                          }
                        >
                          <ImageWithLoader
                            src={story.imgSrc}
                            alt={story.metadata.title}
                          />
                        </div>

                        <p
                          className="text-sm mb-2 line-clamp-4 cursor-pointer"
                          onClick={() =>
                            navigate(`/library/${story.id}`, {
                              state: { story },
                            })
                          }
                        >
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

                {/* Pagination status */}
                {isFetchingMore && (
                  <div className="flex justify-center my-8">
                    <Spinner className="h-8 w-8" />
                  </div>
                )}

                {!hasMore && (
                  <div className="text-center py-8 text-gray-400">
                    No more stories to load
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LibraryPage;
