import { useActionState, useState } from "react";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { PlusIcon } from "~/components/icons/plus-icon";
import { DeleteIcon } from "~/components/icons/delete-icon";

type FormState = {
  error: string | null;
  success: boolean;
};

type EpisodeData = {
  audioFiles: File[];
  keywords: string[];
  newKeyword: string;
  durationSeconds: number;
};

export default function AdminStoryUpload() {
  const storage = getStorage();

  const [episodeIds, setEpisodeIds] = useState<string[]>([]);
  const [nextEpisodeNumber, setNextEpisodeNumber] = useState(1);
  const [progress, setProgress] = useState(0);
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
  const [episodeData, setEpisodeData] = useState<EpisodeData[]>([]);

  const handleAddEpisode = () => {
    if (nextEpisodeNumber > 999) {
      alert("Maximum episodes reached (999)");
      return;
    }
    const newEpisodeId = `episode-${nextEpisodeNumber
      .toString()
      .padStart(3, "0")}`;
    setEpisodeIds((prev) => [...prev, newEpisodeId]);
    setEpisodeData((prev) => [
      ...prev,
      {
        audioFiles: [],
        keywords: [],
        newKeyword: "",
        durationSeconds: 0,
      },
    ]);
    setNextEpisodeNumber((prev) => prev + 1);
  };

  const handleAudioFilesChange = (index: number, files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setEpisodeData((prev) =>
        prev.map((episode, i) =>
          i === index
            ? { ...episode, audioFiles: [...episode.audioFiles, ...newFiles] }
            : episode
        )
      );
    }
  };

  const handleRemoveAudioFile = (episodeIndex: number, fileIndex: number) => {
    setEpisodeData((prev) =>
      prev.map((episode, i) =>
        i === episodeIndex
          ? {
              ...episode,
              audioFiles: episode.audioFiles.filter(
                (_, idx) => idx !== fileIndex
              ),
            }
          : episode
      )
    );
  };

  const handleAddKeyword = (index: number) => {
    const keyword = episodeData[index].newKeyword.trim();
    if (keyword) {
      setEpisodeData((prev) =>
        prev.map((episode, i) =>
          i === index
            ? {
                ...episode,
                keywords: [...episode.keywords, keyword],
                newKeyword: "",
              }
            : episode
        )
      );
    }
  };

  const handleRemoveKeyword = (episodeIndex: number, keywordIndex: number) => {
    setEpisodeData((prev) =>
      prev.map((episode, i) =>
        i === episodeIndex
          ? {
              ...episode,
              keywords: episode.keywords.filter(
                (_, idx) => idx !== keywordIndex
              ),
            }
          : episode
      )
    );
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
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Upload New Story</h1>

        <form action={formAction} className="space-y-6">
          {/* Story Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Story Metadata</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title*</label>
                <input
                  name="story.title"
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Episode Series*
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="2+"
                    className="w-20 p-2 border rounded"
                    value={episodeSeries.years}
                    onChange={(e) => {
                      const years = e.target.value.replace(/[^0-9+]/g, "");
                      setEpisodeSeries((prev) => ({
                        ...prev,
                        years: years,
                      }));
                    }}
                  />{" "}
                  + yr
                  <span className="mx-2">|</span>
                  <input
                    type="text"
                    placeholder="7"
                    className="w-20 p-2 border rounded"
                    value={episodeSeries.episodes}
                    onChange={(e) => {
                      const episodes = e.target.value.replace(/[^0-9]/g, "");
                      setEpisodeSeries((prev) => ({
                        ...prev,
                        episodes: episodes,
                      }));
                    }}
                  />{" "}
                  episodes
                  <input
                    type="hidden"
                    name="story.episodeSeries"
                    value={`${episodeSeries.years}+ yr | ${episodeSeries.episodes} episodes`}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {`${episodeSeries.years}+ yr | ${episodeSeries.episodes} episodes`}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Cover Image*
                </label>
                <input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description*
                </label>
                <textarea
                  name="story.description"
                  required
                  rows={3}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Language*
                </label>
                <select
                  name="story.language"
                  defaultValue="en-US"
                  className="w-full p-2 border rounded"
                >
                  <option value="en-US">English</option>
                  <option value="fr-FR">French</option>
                  <option value="es-ES">Spanish</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Recommended Age
                </label>
                <input
                  name="story.recommendedAge"
                  type="text"
                  placeholder="e.g., 5-12"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {categories.map((category) => (
                    <label
                      key={category}
                      className="relative has-[:checked]:bg-blue-500 has-[:checked]:text-white transition-colors rounded-full border bg-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="story.categories"
                        value={category}
                        defaultChecked={category === newCategory.trim()} // Auto-check new categories
                        className="sr-only"
                      />
                      <span className="px-3 py-1 block text-sm capitalize">
                        {category}
                      </span>
                    </label>
                  ))}
                  <div className="relative">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) =>
                        setNewCategory(e.target.value.toLowerCase())
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const trimmed = newCategory.trim();
                          if (trimmed && !categories.includes(trimmed)) {
                            setCategories((prev) => [...prev, trimmed]);
                            setNewCategory(trimmed); // Preserve value to trigger defaultChecked
                            setTimeout(() => setNewCategory(""), 0); // Clear after render
                          }
                        }
                      }}
                      placeholder="Add new..."
                      className="p-2 text-sm border rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = newCategory.trim();
                        if (trimmed && !categories.includes(trimmed)) {
                          setCategories((prev) => [...prev, trimmed]);
                          setNewCategory(trimmed);
                          setTimeout(() => setNewCategory(""), 0);
                        }
                      }}
                      className="absolute right-2 top-2.5 text-gray-500 hover:text-blue-500"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Duration (minutes)*
                </label>
                <input
                  name="story.durationMinutes"
                  type="number"
                  required
                  min="1"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Episodes */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Episodes</h2>
              <button
                type="button"
                onClick={handleAddEpisode}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title*
                    </label>
                    <input
                      name={`episodes[${index}].title`}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Content*
                    </label>
                    <textarea
                      name={`episodes[${index}].content`}
                      required
                      rows={4}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  {/* Duration Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Duration (seconds)*
                    </label>
                    <input
                      type="number"
                      name={`episodes[${index}].durationSeconds`}
                      value={episodeData[index]?.durationSeconds || 0}
                      onChange={(e) => {
                        const newData = [...episodeData];
                        newData[index].durationSeconds = Number(e.target.value);
                        setEpisodeData(newData);
                      }}
                      className="w-full p-2 border rounded"
                      min="0"
                    />
                  </div>

                  {/* Keywords Section */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Keywords
                    </label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {episodeData[index]?.keywords?.map(
                        (keyword, keywordIndex) => (
                          <div
                            key={keywordIndex}
                            className="bg-blue-100 px-3 py-1 rounded-full flex items-center"
                          >
                            <span className="text-sm">{keyword}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveKeyword(index, keywordIndex)
                              }
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <DeleteIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={episodeData[index]?.newKeyword || ""}
                          onChange={(e) => {
                            const newData = [...episodeData];
                            newData[index].newKeyword = e.target.value;
                            setEpisodeData(newData);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddKeyword(index);
                            }
                          }}
                          placeholder="Add keyword"
                          className="p-2 text-sm border rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddKeyword(index)}
                          className="bg-blue-500 text-white px-2 py-1 rounded"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="hidden"
                      name={`episodes[${index}].keywords`}
                      value={episodeData[index]?.keywords?.join(",") || ""}
                    />
                  </div>

                  {/* Audio Files Section */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Audio Files*
                    </label>
                    <div className="space-y-2 mb-2">
                      {episodeData[index]?.audioFiles?.map(
                        (file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="flex items-center justify-between bg-gray-100 p-2 rounded"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveAudioFile(index, fileIndex)
                              }
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              <DeleteIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                    <input
                      type="file"
                      multiple
                      name={`episodes[${index}].audioFiles`}
                      required
                      onChange={(e) =>
                        handleAudioFilesChange(index, e.target.files)
                      }
                      className="w-full p-2 border rounded"
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
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {isPending ? `Uploading... ${progress}%` : "Upload Story"}
          </button>
        </form>
      </div>
    </div>
  );
}
