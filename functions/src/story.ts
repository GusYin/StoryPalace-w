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
  // Log the service account email
  const [serviceAccount] = await admin.storage().bucket().getMetadata();
  functions.logger.log("Using service account:", serviceAccount);

  await isUserAuthenticatedAndEmailVerified(request);

  try {
    const planDoc = await getUserPlanDocument(request.auth?.uid);
    const bucket = admin.storage().bucket();
    const storagePath = "stories/";
    const maxFreeStories = 3;
    const pageSize = planDoc.plan === "free" ? maxFreeStories : 10;
    const pageToken =
      planDoc.plan === "free" ? undefined : request.data.pageToken;

    // 1. Get story folders using prefix/delimiter
    const [, , storyApiResponse] = (await bucket.getFiles({
      prefix: storagePath,
      delimiter: "/",
      maxResults: pageSize,
      pageToken: pageToken,
      autoPaginate: false,
    })) as [any, any, { prefixes?: string[]; nextPageToken?: string }];

    const storyFolderPrefixes =
      storyApiResponse?.prefixes?.filter((p) => p !== storagePath) || [];
    const nextPageToken = storyApiResponse?.nextPageToken;

    functions.logger.info("story folder prefixes:", storyFolderPrefixes);

    const stories: Story[] = [];
    for (const storyPrefix of storyFolderPrefixes) {
      functions.logger.info("story folder:", storyPrefix);

      if (stories.length >= maxFreeStories && planDoc.plan === "free") break;

      // 2. Process story metadata
      const [metadata] = await bucket
        .file(`${storyPrefix}metadata.json`)
        .download();
      const storyMeta = parseStoryMetadata(metadata.toString());

      // 3. Process episodes for this story
      const [, , episodeApiResponse] = (await bucket.getFiles({
        prefix: `${storyPrefix}episodes/`,
        delimiter: "/",
      })) as [any, any, { prefixes?: string[] }];

      const episodePrefixes = episodeApiResponse?.prefixes || [];
      const episodes: Episode[] = [];

      for (const episodePrefix of episodePrefixes) {
        functions.logger.info("episode folder:", episodePrefix);

        // 4. Process episode metadata
        const [epMetadata] = await bucket
          .file(`${episodePrefix}metadata.json`)
          .download();
        const episodeMeta = parseEpisodeMetadata(epMetadata.toString());

        functions.logger.info("episode metadata:", episodeMeta);

        // 5. Process audio files
        const [audioFiles] = await bucket.getFiles({
          prefix: `${episodePrefix}audios/`,
        });

        const audioUrls = await Promise.all(
          audioFiles.map((file) =>
            file.getSignedUrl({
              action: "read",
              expires: Date.now() + 5 * 60 * 1000,
              version: "v4",
            })
          )
        );

        functions.logger.info("audio urls:", audioUrls);

        // 6. Process content
        const [contentBuffer] = await bucket
          .file(`${episodePrefix}content.txt`)
          .download();

        episodes.push({
          id: episodePrefix.split("/").filter(Boolean).pop() || "",
          metadata: episodeMeta,
          contentUrl: `data:text/plain;base64,${contentBuffer.toString(
            "base64"
          )}`,
          audioUrls: audioUrls.map(([url]) => url),
        });
      }

      // 7. Add completed story
      stories.push({
        id: storyPrefix.split("/").filter(Boolean).pop() || "",
        metadata: storyMeta,
        imgSrc: await bucket
          .file(`${storyPrefix}cover.jpg`)
          .getSignedUrl({
            action: "read",
            expires: Date.now() + 5 * 60 * 1000,
            version: "v4",
          })
          .then(([url]) => url),
        episodes,
      });
    }

    return {
      stories: stories,
      nextPageToken: planDoc.plan === "free" ? null : nextPageToken,
    };
  } catch (error) {
    functions.logger.error("Error fetching stories:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error retrieving stories"
    );
  }
});
