import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { getUserPlanDocument } from "./user";
import { Bucket } from "@google-cloud/storage";
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

interface LightweightStory {
  id: string;
  metadata: StoryMetadata;
  imgSrc?: string;
  episodes: LightweightEpisode[];
}

interface LightweightEpisode {
  id: string;
  metadata: EpisodeMetadata;
}

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

// Helper function to find cover image
const getCoverImageUrl = async (bucket: Bucket, storyPrefix: string) => {
  const allowedExtensions = ["svg", "png", "jpg", "jpeg", "webp"];

  for (const ext of allowedExtensions) {
    const coverFile = bucket.file(`${storyPrefix}cover.${ext}`);
    const [exists] = await coverFile.exists();
    if (exists) {
      return coverFile
        .getSignedUrl({
          action: "read",
          expires: Date.now() + STORY_TTL,
          version: "v4",
        })
        .then(([url]) => url);
    }
  }
  return undefined;
};

// Helper function to filter valid audio files
const getValidAudioUrls = async (
  bucket: Bucket,
  prefix: string
): Promise<string[]> => {
  const [audioFiles] = await bucket.getFiles({ prefix });
  const validExtensions = [".mp3", ".wav", ".aac"];

  // Filter valid audio files
  const validAudioFiles = audioFiles.filter((file) => {
    const name = file.name.toLowerCase();
    // Skip directory placeholders (ends with '/')
    if (name.endsWith("/")) return false;
    // Only include files with valid audio extensions
    return validExtensions.some((ext) => name.endsWith(ext));
  });

  functions.logger.info(
    `Valid audio files for ${prefix}:`,
    validAudioFiles.map((f) => f.name)
  );

  // Generate signed URLs for valid files
  const audioUrls = await Promise.all(
    validAudioFiles.map((file) =>
      file
        .getSignedUrl({
          action: "read",
          expires: Date.now() + STORY_TTL,
          version: "v4",
        })
        .then(([url]) => url)
    )
  );

  return audioUrls;
};

export const getStoryMetadata = functions.https.onCall(async (request) => {
  await isUserAuthenticatedAndEmailVerified(request);

  if (!request.data.storyId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "storyId is required"
    );
  }

  try {
    const bucket: Bucket = admin.storage().bucket();
    const storyId: string = request.data.storyId;
    const storyPrefix = `stories/${storyId}/`;

    // 1. Get story metadata
    const metadataFile = bucket.file(`${storyPrefix}metadata.json`);
    const [metadataExists] = await metadataFile.exists();

    if (!metadataExists) {
      throw new functions.https.HttpsError("not-found", "Story not found");
    }

    const [metadata] = await metadataFile.download();
    const storyMeta: StoryMetadata = parseStoryMetadata(metadata.toString());

    // 2. Get cover image URL
    const imgSrc = await getCoverImageUrl(bucket, storyPrefix);

    // 3. Get episode folders
    const [, , episodeApiResponse] = (await bucket.getFiles({
      prefix: `${storyPrefix}episodes/`,
      delimiter: "/",
    })) as [any, any, { prefixes?: string[] }];

    const episodePrefixes = episodeApiResponse?.prefixes || [];
    const episodes: LightweightEpisode[] = [];

    for (const episodePrefix of episodePrefixes) {
      try {
        const [epMetadata] = await bucket
          .file(`${episodePrefix}metadata.json`)
          .download();
        const episodeMeta: EpisodeMetadata = parseEpisodeMetadata(
          epMetadata.toString()
        );

        episodes.push({
          id: episodePrefix.split("/").filter(Boolean).pop() || "",
          metadata: episodeMeta,
        });
      } catch (error) {
        functions.logger.error(
          `Error processing episode metadata in ${episodePrefix}:`,
          error
        );
        // Skip this episode if metadata processing fails
      }
    }

    const story: LightweightStory = {
      id: storyId,
      metadata: storyMeta,
      imgSrc,
      episodes,
    };

    return { story };
  } catch (error) {
    functions.logger.error("Error fetching story metadata:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error retrieving story metadata"
    );
  }
});

// Returns lightweight metadata
export const getStoriesMetadata = functions.https.onCall(async (request) => {
  await isUserAuthenticatedAndEmailVerified(request);

  try {
    const planDoc = await getUserPlanDocument(request.auth?.uid);
    const bucket = admin.storage().bucket();
    const storagePath = "stories/";
    const maxFreeStories = 3;
    const defaultPageSize = 20;
    const pageSize = planDoc.plan === "free" ? maxFreeStories : defaultPageSize;
    const pageToken =
      planDoc.plan === "free" ? undefined : request.data.pageToken;

    // 1. Get story folders using prefix/delimiter
    const [, , storyApiResponse] = (await bucket.getFiles({
      prefix: storagePath,
      delimiter: "/",
      maxResults: pageSize + 1,
      pageToken: pageToken,
      autoPaginate: false,
    })) as [any, any, { prefixes?: string[]; nextPageToken?: string }];

    functions.logger.log(`Story prefixes ${storyApiResponse?.prefixes}`);

    const storyFolderPrefixes =
      storyApiResponse?.prefixes?.filter((p) => p !== storagePath) || [];
    const nextPageToken = storyApiResponse?.nextPageToken;

    const stories: Array<LightweightStory> = [];

    for (const storyPrefix of storyFolderPrefixes) {
      if (stories.length >= maxFreeStories && planDoc.plan === "free") break;

      // 2. Process story metadata
      const [metadata] = await bucket
        .file(`${storyPrefix}metadata.json`)
        .download();
      const storyMeta = parseStoryMetadata(metadata.toString());

      // 3. Get cover image URL
      const imgSrc = await getCoverImageUrl(bucket, storyPrefix);

      // 4. Process episodes metadata
      const [, , episodeApiResponse] = (await bucket.getFiles({
        prefix: `${storyPrefix}episodes/`,
        delimiter: "/",
      })) as [any, any, { prefixes?: string[] }];

      const episodePrefixes = episodeApiResponse?.prefixes || [];
      const episodes: Array<LightweightEpisode> = [];

      for (const episodePrefix of episodePrefixes) {
        try {
          const [epMetadata] = await bucket
            .file(`${episodePrefix}metadata.json`)
            .download();
          const episodeMeta = parseEpisodeMetadata(epMetadata.toString());

          episodes.push({
            id: episodePrefix.split("/").filter(Boolean).pop() || "",
            metadata: episodeMeta,
          });
        } catch (error) {
          functions.logger.error(
            `Error processing episode metadata in ${episodePrefix}:`,
            error
          );
        }
      }

      // 5. Add story with metadata only
      stories.push({
        id: storyPrefix.split("/").filter(Boolean).pop() || "",
        metadata: storyMeta,
        imgSrc,
        episodes,
      });
    }

    return {
      stories,
      nextPageToken: planDoc.plan === "free" ? null : nextPageToken,
    };
  } catch (error) {
    functions.logger.error("Error fetching stories metadata:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error retrieving stories metadata"
    );
  }
});

export const getStories = functions.https.onCall(async (request) => {
  await isUserAuthenticatedAndEmailVerified(request);

  try {
    const planDoc = await getUserPlanDocument(request.auth?.uid);
    const bucket = admin.storage().bucket();
    const storagePath = "stories/";
    const maxFreeStories = 3;
    const defaultPageSize = 20;
    const pageSize = planDoc.plan === "free" ? maxFreeStories : defaultPageSize;
    const pageToken =
      planDoc.plan === "free" ? undefined : request.data.pageToken;

    // 1. Get story folders using prefix/delimiter
    const [, , storyApiResponse] = (await bucket.getFiles({
      prefix: storagePath,
      delimiter: "/",
      maxResults: pageSize + 1,
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
        const audioUrls = await getValidAudioUrls(
          bucket,
          `${episodePrefix}audios/`
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
          audioUrls,
        });
      }

      // 7. Add completed story

      // Modified cover image handling
      const imgSrc = await getCoverImageUrl(bucket, storyPrefix);

      stories.push({
        id: storyPrefix.split("/").filter(Boolean).pop() || "",
        metadata: storyMeta,
        imgSrc,
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

export const getStory = functions.https.onCall(async (request) => {
  await isUserAuthenticatedAndEmailVerified(request);

  if (!request.data.storyId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "storyId is required"
    );
  }

  try {
    const bucket = admin.storage().bucket();
    const storyId = request.data.storyId;
    const storyPrefix = `stories/${storyId}/`;

    // 1. Get story metadata
    const metadataFile = bucket.file(`${storyPrefix}metadata.json`);
    const [metadataExists] = await metadataFile.exists();

    if (!metadataExists) {
      throw new functions.https.HttpsError("not-found", "Story not found");
    }

    const [metadata] = await metadataFile.download();
    const storyMeta = parseStoryMetadata(metadata.toString());

    // 2. Get episodes
    const [, , episodeApiResponse] = (await bucket.getFiles({
      prefix: `${storyPrefix}episodes/`,
      delimiter: "/",
    })) as [any, any, { prefixes?: string[] }];

    const episodePrefixes = episodeApiResponse?.prefixes || [];
    const episodes: Episode[] = [];

    for (const episodePrefix of episodePrefixes) {
      // 3. Process episode metadata
      const [epMetadata] = await bucket
        .file(`${episodePrefix}metadata.json`)
        .download();
      const episodeMeta = parseEpisodeMetadata(epMetadata.toString());

      // 4. Process content
      const [contentBuffer] = await bucket
        .file(`${episodePrefix}content.txt`)
        .download();

      // 5. Process audio files
      const audioUrls = await getValidAudioUrls(
        bucket,
        `${episodePrefix}audios/`
      );

      episodes.push({
        id: episodePrefix.split("/").filter(Boolean).pop() || "",
        metadata: episodeMeta,
        contentUrl: `data:text/plain;base64,${contentBuffer.toString(
          "base64"
        )}`,
        audioUrls,
      });
    }

    // 6. Get cover image
    const imgSrc = await getCoverImageUrl(bucket, storyPrefix);

    const story: Story = {
      id: storyId,
      metadata: storyMeta,
      imgSrc,
      episodes,
    };

    return { story };
  } catch (error) {
    functions.logger.error("Error fetching story:", error);

    throw new functions.https.HttpsError("internal", "Error retrieving story");
  }
});
