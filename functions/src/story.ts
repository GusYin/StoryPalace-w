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
          expires: Date.now() + 5 * 60 * 1000,
          version: "v4",
        })
        .then(([url]) => url);
    }
  }
  return undefined;
};

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

        functions.logger.info("episode audios:", audioFiles);

        const audioUrls = await Promise.all(
          audioFiles.map((file) => {
            functions.logger.info("episode audio:", file);

            return file.getSignedUrl({
              action: "read",
              expires: Date.now() + 5 * 60 * 1000,
              version: "v4",
            });
          })
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

      episodes.push({
        id: episodePrefix.split("/").filter(Boolean).pop() || "",
        metadata: episodeMeta,
        contentUrl: `data:text/plain;base64,${contentBuffer.toString(
          "base64"
        )}`,
        audioUrls: audioUrls.map(([url]) => url),
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
