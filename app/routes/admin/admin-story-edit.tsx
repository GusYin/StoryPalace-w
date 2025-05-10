import { useEffect, useState } from "react";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytes,
  deleteObject,
  listAll,
} from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

type Episode = {
  id: string;
  title: string;
  content: string;
  audioFiles: File[];
  durationSeconds: number;
  keywords: string[];
  existingAudios: string[];
};

type StoryMetadata = {
  title: string;
  description: string;
  episodeSeries: string;
  language: string;
  recommendedAge: string;
  categories: string[];
  author: string;
  durationMinutes: number;
  coverExtension: string;
  coverUrl?: string;
  newCoverFile?: File;
};

export default function AdminStoryEdit() {
  const [storyId, setStoryId] = useState("");
  const [metadata, setMetadata] = useState<StoryMetadata | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const storage = getStorage();

  const fetchStoryData = async () => {
    try {
      setLoading(true);
      const storageRef = ref(storage, `stories/${storyId}/metadata.json`);
      const url = await getDownloadURL(storageRef);
      const response = await fetch(url);
      const data: StoryMetadata = await response.json();

      // Fetch cover image
      const coverExt = data.coverExtension || "jpg";
      const coverRef = ref(storage, `stories/${storyId}/cover.${coverExt}`);
      data.coverUrl = await getDownloadURL(coverRef);

      // Fetch episodes
      const episodesRef = ref(storage, `stories/${storyId}/episodes/`);
      const episodeDirs = (await listAll(episodesRef)).prefixes;

      const fetchedEpisodes: Episode[] = await Promise.all(
        episodeDirs.map(async (dir) => {
          const metaRef = ref(dir, "metadata.json");
          const contentRef = ref(dir, "content.txt");
          const audioRef = ref(dir, "audios/");

          const [metaUrl, contentUrl, audios] = await Promise.all([
            getDownloadURL(metaRef),
            getDownloadURL(contentRef),
            listAll(audioRef),
          ]);

          const [metaRes, contentRes] = await Promise.all([
            fetch(metaUrl),
            fetch(contentUrl),
          ]);

          const episodeMeta = await metaRes.json();
          const content = await contentRes.text();

          return {
            id: dir.name,
            ...episodeMeta,
            content,
            existingAudios: audios.items.map((i) => i.name),
            audioFiles: [],
          };
        })
      );

      setMetadata(data);
      setEpisodes(
        fetchedEpisodes.sort((a, b) => a.title.localeCompare(b.title))
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
      const storageRef = ref(storage, `stories/${storyId}/`);

      // Update cover image
      if (metadata.newCoverFile) {
        const coverExt = metadata.newCoverFile.name.split(".").pop();
        await uploadBytes(
          ref(storageRef, `cover.${coverExt}`),
          metadata.newCoverFile
        );
      }

      // Update metadata
      const updatedMetadata = {
        ...metadata,
        coverExtension:
          metadata.newCoverFile?.name.split(".").pop() ||
          metadata.coverExtension,
      };
      delete updatedMetadata.coverUrl;
      delete updatedMetadata.newCoverFile;

      const metadataBlob = new Blob([JSON.stringify(updatedMetadata)], {
        type: "application/json",
      });
      await uploadBytes(ref(storageRef, "metadata.json"), metadataBlob);

      // Update episodes
      for (const [index, episode] of episodes.entries()) {
        const episodeRef = ref(storageRef, `episodes/${episode.id}/`);

        // Upload metadata
        const episodeMeta = {
          title: episode.title,
          durationSeconds: episode.durationSeconds,
          keywords: episode.keywords,
        };
        const metaBlob = new Blob([JSON.stringify(episodeMeta)], {
          type: "application/json",
        });
        await uploadBytes(ref(episodeRef, "metadata.json"), metaBlob);

        // Upload content
        const contentBlob = new Blob([episode.content], {
          type: "text/plain",
        });
        await uploadBytes(ref(episodeRef, "content.txt"), contentBlob);

        // Upload new audio files
        if (episode.audioFiles.length > 0) {
          const audioRef = ref(episodeRef, "audios/");
          for (const audioFile of episode.audioFiles) {
            await uploadBytes(ref(audioRef, audioFile.name), audioFile);
          }
        }

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
      <h1 className="text-2xl font-bold mb-6">Edit Existing Story</h1>

      <div className="mb-6">
        <label className="block mb-2">Enter Story ID:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={storyId}
            onChange={(e) =>
              setStoryId(e.target.value.replace(/[^a-z0-9_]/g, ""))
            }
            className="border p-2 flex-1"
            placeholder="story_id_here"
          />
          <button
            onClick={fetchStoryData}
            className="bg-blue-500 text-white px-4 py-2 rounded"
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
            <h2 className="text-lg font-semibold mb-4">Story Metadata</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium">Title*</label>
                <input
                  value={metadata.title}
                  onChange={(e) =>
                    setMetadata({ ...metadata, title: e.target.value })
                  }
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium">Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      newCoverFile: e.target.files?.[0],
                    })
                  }
                  className="mt-1 block w-full"
                />
                {metadata.coverUrl && (
                  <img
                    src={metadata.coverUrl}
                    alt="Current cover"
                    className="mt-2 w-32 h-32 object-cover"
                  />
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">
                  Description*
                </label>
                <textarea
                  value={metadata.description}
                  onChange={(e) =>
                    setMetadata({ ...metadata, description: e.target.value })
                  }
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium">Language*</label>
                <select
                  value={metadata.language}
                  onChange={(e) =>
                    setMetadata({ ...metadata, language: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="en-US">English</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                </select>
              </div>

              {/* Recommended Age */}
              <div>
                <label className="block text-sm font-medium">
                  Recommended Age
                </label>
                <input
                  type="text"
                  value={metadata.recommendedAge}
                  onChange={(e) =>
                    setMetadata({ ...metadata, recommendedAge: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              {/* Categories */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Categories</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {metadata.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium">
                  Duration (minutes)*
                </label>
                <input
                  type="number"
                  value={metadata.durationMinutes}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
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
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Title*</label>
                    <input
                      value={episode.title}
                      onChange={(e) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].title = e.target.value;
                        setEpisodes(newEpisodes);
                      }}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Content*
                    </label>
                    <textarea
                      value={episode.content}
                      onChange={(e) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].content = e.target.value;
                        setEpisodes(newEpisodes);
                      }}
                      required
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Audio Files
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const newEpisodes = [...episodes];
                        newEpisodes[index].audioFiles = Array.from(
                          e.target.files || []
                        );
                        setEpisodes(newEpisodes);
                      }}
                      className="mt-1 block w-full"
                    />
                    <div className="mt-2 space-y-1">
                      {episode.existingAudios?.map((audio) => (
                        <span
                          key={audio}
                          className="block text-sm text-gray-600"
                        >
                          {audio}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? `Saving... ${progress}%` : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}
