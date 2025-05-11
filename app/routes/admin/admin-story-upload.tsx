import { useActionState, useState } from "react";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import { PlusIcon } from "~/components/icons/plus-icon";

type FormState = {
  error: string | null;
  success: boolean;
};

// const PlusIcon = ({ className }: { className?: string }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     fill="none"
//     viewBox="0 0 24 24"
//     strokeWidth={1.5}
//     stroke="currentColor"
//     className={className}
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       d="M12 4.5v15m7.5-7.5h-15"
//     />
//   </svg>
// );

export default function AdminStoryUpload() {
  const [episodeIds, setEpisodeIds] = useState<string[]>([]);
  const [nextEpisodeNumber, setNextEpisodeNumber] = useState(1);
  const [progress, setProgress] = useState(0);
  const storage = getStorage();
  const [categories, setCategories] = useState([
    "adventure",
    "fantasy",
    "nature",
    "friendship",
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [episodeSeries, setEpisodeSeries] = useState({
    years: "",
    episodes: "",
  });

  const handleAddEpisode = () => {
    if (nextEpisodeNumber > 999) {
      alert("Maximum episodes reached (999)");
      return;
    }
    const newEpisodeId = `episode-${nextEpisodeNumber
      .toString()
      .padStart(3, "0")}`;
    setEpisodeIds((prev) => [...prev, newEpisodeId]);
    setNextEpisodeNumber((prev) => prev + 1);
  };

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (prevState, formData) => {
      try {
        const storyTitle = formData.get("story.title") as string;
        const storyId = storyTitle.trim().toLowerCase().replace(/\s+/g, "_");
        const storageRef = ref(storage, `stories/${storyId}/`);

        // Handle cover image
        const coverImage = formData.get("coverImage") as File;
        const coverExt = coverImage.name.split(".").pop();
        await uploadBytes(ref(storageRef, `cover.${coverExt}`), coverImage);

        // Handle story metadata
        const storyMetadata = {
          title: formData.get("story.title"),
          description: formData.get("story.description"),
          episodeSeries: formData.get("story.episodeSeries"),
          language: formData.get("story.language") || "en-NZ",
          recommendedAge: formData.get("story.recommendedAge"),
          categories: formData
            .getAll("story.categories")
            .filter((c) => c !== ""),
          author: formData.get("story.author"),
          durationMinutes: Number(formData.get("story.durationMinutes")),
        };

        const metadataBlob = new Blob([JSON.stringify(storyMetadata)], {
          type: "application/json",
        });
        await uploadBytes(ref(storageRef, "metadata.json"), metadataBlob);

        // Process episodes
        const episodes: Array<{
          title: string;
          content: string;
          audioFiles: File[];
          order: number;
          durationSeconds: number;
          keywords: string[];
        }> = [];

        // Parse episode data from formData
        formData.forEach((value, key) => {
          // Captures two groups:
          // (\d+) = The episode index (0, 1, 2...)
          // (.+) = The field name (title, content, audioFiles...)
          const episodeMatch = key.match(/^episodes\[(\d+)]\.(.+)$/);
          if (episodeMatch) {
            // Converts the captured index to a number (0, 1, 2...)
            const index = parseInt(episodeMatch[1]);
            // Gets the field name (title, content, audioFiles...)
            const field = episodeMatch[2] as keyof (typeof episodes)[number];

            if (!episodes[index]) {
              episodes[index] = {
                title: "",
                content: "",
                audioFiles: [],
                order: index,
                durationSeconds: 0,
                keywords: [],
              };
            }

            // Handle different field types explicitly
            switch (field) {
              case "audioFiles":
                if (value instanceof File) {
                  episodes[index].audioFiles.push(value);
                }
                break;

              case "durationSeconds":
                episodes[index].durationSeconds = Number(value);
                break;

              case "keywords":
                if (typeof value === "string") {
                  episodes[index].keywords = value
                    .split(",")
                    .filter((k) => k.trim() !== "");
                }
                break;

              case "content":
                episodes[index].content = value.toString();
                break;

              case "title":
                episodes[index].title = value.toString();
                break;

              case "order":
                // order is already set by index
                break;

              default:
                const exhaustiveCheck: never = field;
                throw new Error(`Unhandled field: ${field}`);
            }
          }
        });

        // Upload episodes
        for (const [index, episode] of episodes.entries()) {
          const episodeId = episodeIds[index]; // Use pre-generated episode ID
          const episodeRef = ref(storageRef, `episodes/${episodeId}/`);

          // Upload metadata
          const episodeMeta = {
            title: episode.title,
            order: episode.order,
            durationSeconds: episode.durationSeconds,
            keywords: episode.keywords.filter((k) => k !== ""),
          };
          const epMetadataBlob = new Blob([JSON.stringify(episodeMeta)], {
            type: "application/json",
          });
          await uploadBytes(ref(episodeRef, "metadata.json"), epMetadataBlob);

          // Upload content
          const contentBlob = new Blob([episode.content], {
            type: "text/plain",
          });
          await uploadBytes(ref(episodeRef, "content.txt"), contentBlob);

          // Upload audio files
          const audioRef = ref(episodeRef, "audios/");
          for (const audioFile of episode.audioFiles) {
            await uploadBytes(ref(audioRef, audioFile.name), audioFile);
          }

          setProgress(Math.round(((index + 1) / episodes.length) * 100));
        }

        // Update Firestore index
        await httpsCallable(functions, "updateStoryIndex")({ storyId });

        return { error: null, success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Upload failed",
          success: false,
        };
      }
    },
    { error: null, success: false }
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="font-dosis w-full mx-auto space-y-8 mt-14 mb-14 px-4 sm:px-6 lg:px-20">
        <h1 className="text-center text-xl font-bold mb-6">Upload New Story</h1>

        <form action={formAction} className="space-y-6">
          {/* Story Metadata */}
          {/* Story Metadata */}
          <div className="bg-[#F3F7F6] p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Story Metadata</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-custom-text-grey">Title*</label>
                <input
                  name="story.title"
                  required
                  className="bg-white px-3 py-3 mt-1 block w-full rounded-md border border-[#829793] shadow-sm"
                />
              </div>

              <div>
                <label className="block text-custom-text-grey">
                  Episode Series*
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="2+"
                    className="bg-white px-3 py-3 mt-1 block w-20 rounded-md border border-[#829793] shadow-sm"
                    value={episodeSeries.years}
                    onChange={(e) => {
                      const years = e.target.value.replace(/[^0-9+]/g, "");
                      setEpisodeSeries((prev) => ({
                        ...prev,
                        years: years,
                      }));
                    }}
                  />
                  <span className="mx-2">|</span>
                  <input
                    type="text"
                    placeholder="7"
                    className="bg-white px-3 py-3 mt-1 block w-20 rounded-md border border-[#829793] shadow-sm"
                    value={episodeSeries.episodes}
                    onChange={(e) => {
                      const episodes = e.target.value.replace(/[^0-9]/g, "");
                      setEpisodeSeries((prev) => ({
                        ...prev,
                        episodes: episodes,
                      }));
                    }}
                  />
                  <input
                    type="hidden"
                    name="story.episodeSeries"
                    value={`${episodeSeries.years}+ yr | ${episodeSeries.episodes} episodes`}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {`${episodeSeries.years}+ yr | ${episodeSeries.episodes} episodes`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Example: "2+ yr | 7 episodes" - Type numbers only, formatting
                  is automatic
                </p>
              </div>

              {/* Cover Image */}
              <div className="bg-[#F3F7F6] p-4 rounded-lg">
                <h2 className="text-lg font-semibold">Cover Image</h2>
                <input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  required
                  className="cursor-pointer mt-1 block w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-custom-teal file:text-white hover:file:bg-custom-bg-lighter-dark"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-custom-text-grey">
                  Description*
                </label>
                <textarea
                  name="story.description"
                  required
                  rows={3}
                  className="bg-white px-3 py-3 mt-1 block w-full rounded-md border border-[#829793] shadow-sm"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-custom-text-grey">Language*</label>
                <select
                  name="story.language"
                  defaultValue="en-US"
                  className="bg-white px-3 py-3 mt-1 block w-full rounded-md border border-[#829793] shadow-sm"
                >
                  <option value="en-US">English</option>
                  <option value="fr-FR">French</option>
                </select>
              </div>

              {/* Recommended Age */}
              <div>
                <label className="block text-custom-text-grey">
                  Recommended Age
                </label>
                <input
                  name="story.recommendedAge"
                  type="text"
                  placeholder="e.g., 5-12"
                  className="bg-white px-3 py-3 mt-1 block w-full rounded-md border border-[#829793] shadow-sm"
                />
              </div>

              {/* Categories */}
              <div className="md:col-span-2">
                <label className="block text-custom-text-grey mb-2">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Existing Categories */}
                  {categories.map((category) => (
                    <label
                      key={category}
                      className="relative has-[:checked]:bg-custom-teal has-[:checked]:text-white transition-colors rounded-full border border-[#829793] bg-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="story.categories"
                        value={category}
                        className="sr-only"
                      />
                      <span className="px-4 py-2 block text-sm capitalize">
                        {category}
                      </span>
                    </label>
                  ))}

                  {/* New Category Input */}
                  <div className="relative group">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) =>
                        setNewCategory(e.target.value.toLowerCase())
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCategory.trim()) {
                          e.preventDefault();
                          if (!categories.includes(newCategory.trim())) {
                            setCategories((prev) => [
                              ...prev,
                              newCategory.trim(),
                            ]);
                          }
                          setNewCategory("");
                        }
                      }}
                      placeholder="Add new..."
                      className="px-4 py-2 text-sm bg-transparent border-b-2 border-[#829793] focus:outline-none focus:border-custom-teal w-32"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          newCategory.trim() &&
                          !categories.includes(newCategory.trim())
                        ) {
                          setCategories((prev) => [
                            ...prev,
                            newCategory.trim(),
                          ]);
                          setNewCategory("");
                        }
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-[#829793] group-hover:text-custom-teal transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Duration Minutes */}
              <div>
                <label className="block text-custom-text-grey">
                  Duration (minutes)*
                </label>
                <input
                  name="story.durationMinutes"
                  type="number"
                  required
                  min="1"
                  className="bg-white px-3 py-3 mt-1 block w-full rounded-md border border-[#829793] shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Episodes */}
          <div className="bg-[#F3F7F6] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Episodes</h2>
              <button
                type="button"
                onClick={handleAddEpisode}
                className="cursor-pointer w-auto bg-custom-teal text-white px-6 py-3 rounded-3xl hover:bg-blue-600 transition-colors"
              >
                Add Episode
              </button>
            </div>

            {episodeIds.map((id, index) => (
              <div key={id} className="mb-6 border-b pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">
                    Episode {id.replace("episode-", "")}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setEpisodeIds((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    className="cursor-pointer border border-[#829793] px-3 py-3 rounded-3xl w-auto bg-white text-black hover:text-blue-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-custom-text-grey">
                      Episode Title*
                    </label>
                    <input
                      name={`episodes[${index}].title`}
                      required
                      className="bg-white px-3 py-3 mt-1 block w-full rounded-md border border-[#829793] shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-custom-text-grey">
                      Content*
                    </label>
                    <textarea
                      name={`episodes[${index}].content`}
                      required
                      rows={4}
                      className="bg-white px-3 py-3 mt-1 block w-full rounded-md border border-[#829793] shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-custom-text-grey">
                      Audio Files*
                    </label>
                    <input
                      type="file"
                      multiple
                      name={`episodes[${index}].audioFiles`}
                      required
                      className="cursor-pointer mt-1 block w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-custom-teal file:text-white hover:file:bg-custom-bg-lighter-dark"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Feedback */}
          {state.error && (
            <div className="text-red-500 p-4 rounded-lg bg-red-50">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="text-green-500 p-4 rounded-lg bg-green-50">
              Story uploaded successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="cursor-pointer w-auto bg-custom-teal text-white px-6 py-3 rounded-3xl hover:bg-blue-600 transition-colors"
          >
            {isPending ? `Uploading... ${progress}%` : "Upload Story"}
          </button>
        </form>
      </div>
    </div>
  );
}
