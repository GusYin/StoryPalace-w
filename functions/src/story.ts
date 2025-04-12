import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { getUserPlanDocument } from "./user";
import { isUserAuthenticatedAndEmailVerified } from "./util";

// Type Definitions
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

// Validation Functions
const parseStoryMetadata = (data: string): StoryMetadata => {
  const raw = JSON.parse(data);

  if (!raw.title || !raw.description || !raw.episodeSeries) {
    throw new Error("Invalid story metadata: Missing required fields");
  }

  return {
    title: raw.title,
    description: raw.description,
    episodeSeries: raw.episodeSeries,
    language: raw.language || "en-US",
    recommendedAge: raw.recommendedAge,
    categories: raw.categories || [],
    author: raw.author,
    durationMinutes: raw.durationMinutes,
  };
};

const parseEpisodeMetadata = (data: string): EpisodeMetadata => {
  const raw = JSON.parse(data);

  return {
    title: raw.title || "Untitled Episode",
    order: raw.order,
    durationSeconds: raw.durationSeconds,
    keywords: raw.keywords || [],
  };
};

export const getStories = functions.https.onCall(async (request) => {
  await isUserAuthenticatedAndEmailVerified(request);

  try {
    const planDoc = await getUserPlanDocument(request.auth?.uid);
    const bucket = admin.storage().bucket();
    const storagePath = "stories/";
    const maxFreeStories = 3;
    const pageSize = planDoc.plan === "free" ? maxFreeStories : 10;
    const pageToken =
      planDoc.plan === "free" ? undefined : request.data.pageToken;

    // Get paginated list of story folders
    const [storyFolders, nextPageToken] = await bucket.getFiles({
      prefix: storagePath,
      delimiter: "/",
      maxResults: pageSize,
      pageToken: pageToken,
      autoPaginate: false,
    });

    const stories: Story[] = [];
    for (const folder of storyFolders) {
      if (stories.length >= maxFreeStories && planDoc.plan === "free") break;

      // Process story metadata
      const metadataFile = bucket.file(`${folder.name}metadata.json`);
      const [metadata] = await metadataFile.download();
      const storyMeta = parseStoryMetadata(metadata.toString());

      // Get cover image URL
      const [coverUrl] = await bucket
        .file(`${folder.name}cover.jpg`)
        .getSignedUrl({
          action: "read",
          //URLs expire in 5 minutes (300000ms)
          expires: Date.now() + 5 * 60 * 1000,
        });

      // Process episodes
      const episodes: Episode[] = [];
      const [episodeFolders] = await bucket.getFiles({
        prefix: `${folder.name}episodes/`,
        delimiter: "/",
      });

      for (const episodeFolder of episodeFolders) {
        const episodeId = episodeFolder.name.split("/").pop() || "";
        let episodeMeta: EpisodeMetadata = { title: "Untitled Episode" };

        try {
          const [epMetadata] = await bucket
            .file(`${episodeFolder.name}metadata.json`)
            .download();
          episodeMeta = parseEpisodeMetadata(epMetadata.toString());
        } catch (error) {
          // Fallback to content.txt first line
          const [content] = await bucket
            .file(`${episodeFolder.name}content.txt`)
            .download();
          episodeMeta.title =
            content.toString().split("\n")[0] || "Untitled Episode";
        }

        // Process audio files
        const [audioFiles] = await bucket.getFiles({
          prefix: `${episodeFolder.name}audios/`,
        });

        const audioUrls = await Promise.all(
          audioFiles.map(async (file) => {
            const [url] = await file.getSignedUrl({
              action: "read",
              //URLs expire in 5 minutes (300000ms)
              expires: Date.now() + 5 * 60 * 1000,
            });
            return url;
          })
        );

        // Process content
        const [contentBuffer] = await bucket
          .file(`${episodeFolder.name}content.txt`)
          .download();

        episodes.push({
          id: episodeId,
          metadata: episodeMeta,
          contentUrl: `data:text/plain;base64,${contentBuffer.toString(
            "base64"
          )}`,
          audioUrls,
        });
      }

      stories.push({
        id: folder.name.split("/").filter(Boolean).pop() || "",
        metadata: storyMeta,
        imgSrc: coverUrl,
        episodes,
      });
    }

    return {
      stories: stories,
      nextPageToken: planDoc.plan === "free" ? null : nextPageToken,
    };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      "Error retrieving stories",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});
