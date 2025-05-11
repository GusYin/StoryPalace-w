import { useState } from "react";
import { getStorage, ref, uploadBytes, deleteObject } from "firebase/storage";
import { functions } from "~/firebase/firebase";
import { httpsCallable } from "firebase/functions";
import type {
  Story,
  StoryMetadata,
  Episode,
  EpisodeMetadata,
} from "../library";
import { DeleteIcon } from "~/components/icons/delete-icon";
import { PlusIcon } from "~/components/icons/plus-icon";

export default function AdminStoryEdit() {
  const [storyId, setStoryId] = useState("");
  const [metadata, setMetadata] = useState<StoryMetadata | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [newCategory, setNewCategory] = useState("");
  const storage = getStorage();

  const getStoryFunction = httpsCallable<{ storyId: string }, { story: Story }>(
    functions,
    "getStory"
  );

  const fetchStoryData = async () => {
    if (!storyId) return alert("Please enter a Story ID");

    try {
      setLoading(true);
      const result = await getStoryFunction({ storyId });
      const { story } = result.data;

      setMetadata({
        ...story.metadata,
        categories: story.metadata.categories || [],
      });

      setEpisodes(
        story.episodes.map((ep) => ({
          ...ep,
          metadata: {
            ...ep.metadata,
            keywords: ep.metadata.keywords || [],
          },
        }))
      );
    } catch (error) {
      console.error("Error fetching story:", error);
      alert("Story not found or access denied");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metadata || !storyId) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `stories/${storyId}`);

      // Update metadata
      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      });
      await uploadBytes(ref(storageRef, "metadata.json"), metadataBlob);

      // Update episodes
      for (const [index, episode] of episodes.entries()) {
        const episodeRef = ref(storageRef, `episodes/${episode.id}`);

        // Upload episode metadata
        const episodeMeta: EpisodeMetadata = {
          title: episode.metadata.title,
          order: episode.metadata.order,
          durationSeconds: episode.metadata.durationSeconds,
          keywords: episode.metadata.keywords?.filter((k) => k.trim() !== ""),
        };

        await uploadBytes(
          ref(episodeRef, "metadata.json"),
          new Blob([JSON.stringify(episodeMeta)], { type: "application/json" })
        );

        // Upload content
        await uploadBytes(
          ref(episodeRef, "content.txt"),
          new Blob([episode.contentUrl], { type: "text/plain" })
        );

        setProgress(Math.round(((index + 1) / episodes.length) * 100));
      }

      await httpsCallable(functions, "updateStoryIndex")({ storyId });
      alert("Story updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Story</h1>

      <div className="mb-6">
        <label className="block mb-2">Story ID:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={storyId}
            onChange={(e) => setStoryId(e.target.value)}
            className="border p-2 flex-1 rounded"
            placeholder="story_id"
          />
          <button
            onClick={fetchStoryData}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Loading..." : "Load Story"}
          </button>
        </div>
      </div>

      {metadata && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Story Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Story Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Title*</label>
                <input
                  value={metadata.title}
                  onChange={(e) =>
                    setMetadata({ ...metadata, title: e.target.value })
                  }
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block mb-2">Author</label>
                <input
                  value={metadata.author || ""}
                  onChange={(e) =>
                    setMetadata({ ...metadata, author: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2">Description*</label>
                <textarea
                  value={metadata.description}
                  onChange={(e) =>
                    setMetadata({ ...metadata, description: e.target.value })
                  }
                  required
                  rows={3}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block mb-2">Episode Series*</label>
                <input
                  value={metadata.episodeSeries}
                  onChange={(e) =>
                    setMetadata({ ...metadata, episodeSeries: e.target.value })
                  }
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block mb-2">Language</label>
                <select
                  value={metadata.language || "en-US"}
                  onChange={(e) =>
                    setMetadata({ ...metadata, language: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="en-US">English</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                </select>
              </div>

              <div>
                <label className="block mb-2">Recommended Age</label>
                <input
                  value={metadata.recommendedAge || ""}
                  onChange={(e) =>
                    setMetadata({ ...metadata, recommendedAge: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={metadata.durationMinutes || ""}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2">Categories</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {metadata.categories?.map((category, index) => (
                    <div
                      key={index}
                      className="bg-blue-100 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{category}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setMetadata({
                            ...metadata,
                            categories: metadata.categories?.filter(
                              (_, i) => i !== index
                            ),
                          })
                        }
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add new category"
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategory.trim()) {
                        setMetadata({
                          ...metadata,
                          categories: [
                            ...(metadata.categories || []),
                            newCategory.trim(),
                          ],
                        });
                        setNewCategory("");
                      }
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    <PlusIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Episodes */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Episodes</h2>

            {episodes.map((episode, index) => (
              <div key={episode.id} className="mb-6 border-b pb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Episode {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setEpisodes((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    <DeleteIcon />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2">Title*</label>
                    <input
                      value={episode.metadata.title}
                      onChange={(e) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].metadata.title = e.target.value;
                        setEpisodes(newEpisodes);
                      }}
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">Order</label>
                    <input
                      type="number"
                      value={episode.metadata.order || ""}
                      onChange={(e) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].metadata.order = Number(
                          e.target.value
                        );
                        setEpisodes(newEpisodes);
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">Duration (seconds)</label>
                    <input
                      type="number"
                      value={episode.metadata.durationSeconds || ""}
                      onChange={(e) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].metadata.durationSeconds = Number(
                          e.target.value
                        );
                        setEpisodes(newEpisodes);
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">
                      Keywords (comma-separated)
                    </label>
                    <input
                      value={episode.metadata.keywords?.join(", ") || ""}
                      onChange={(e) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].metadata.keywords = e.target.value
                          .split(",")
                          .map((k) => k.trim())
                          .filter((k) => k !== "");
                        setEpisodes(newEpisodes);
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block mb-2">Audio Files</label>
                    <div className="space-y-2">
                      {episode.audioUrls.map((audioUrl, audioIndex) => (
                        <div
                          key={audioIndex}
                          className="flex items-center justify-between bg-gray-100 p-2 rounded"
                        >
                          <span className="truncate">
                            {audioUrl.split("/").pop()}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await deleteObject(ref(storage, audioUrl));
                                const newEpisodes = [...episodes];
                                newEpisodes[index].audioUrls = newEpisodes[
                                  index
                                ].audioUrls.filter((_, i) => i !== audioIndex);
                                setEpisodes(newEpisodes);
                              } catch (error) {
                                console.error("Error deleting audio:", error);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].audioUrls = [
                          ...newEpisodes[index].audioUrls,
                          ...Array.from(e.target.files || []).map((f) =>
                            URL.createObjectURL(f)
                          ),
                        ];
                        setEpisodes(newEpisodes);
                      }}
                      className="mt-2 w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? `Saving... ${progress}%` : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}
