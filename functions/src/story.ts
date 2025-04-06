import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();

interface UserData {
  plan?: "free" | "basic" | "premium";
  trialEndDate?: admin.firestore.Timestamp;
}

export const getUserPlan = functions.https.onCall(async (request) => {
  if (!request.auth?.uid || !request.auth?.token?.email_verified) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication and email verified required"
    );
  }

  try {
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(request.auth.uid)
      .get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data() as UserData;
    return {
      plan: userData.plan || "free",
      trialEndDate: userData.trialEndDate?.toDate().toISOString(),
    };
  } catch (error) {
    functions.logger.error("Error fetching user plan:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch user plan"
    );
  }
});

interface Story {
  id: string;
  title: string;
  episodeSeries: string; // For example, "3+ | 5 episodes"
  episodes: Episode[];
  imgSrc?: string;
  description: string;
}

interface Episode {
  id: string;
  title: string;
  contentUrl: string;
  audioUrls: string[]; // each episode can have multiple audio URLs
}

interface UserData {
  plan?: "free" | "basic" | "premium";
  trialEndDate?: admin.firestore.Timestamp;
}

/*
stories/
  story-001/
    metadata.json
    cover.jpg
    episodes/
      episode-001/
        metadata.json  # Contains { "title": "Episode 1" }
        content.txt
        audios/
          part-1.mp3
      episode-002/
        metadata.json
        content.txt
        audios/
          part-1.mp3
      ...
 */

export const getStories = functions.https.onCall(async (request) => {
  if (!request.auth?.uid || !request.auth?.token?.email_verified) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication and email verified required"
    );
  }

  try {
    // Get user plan
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(request.auth.uid)
      .get();
    const userData = userDoc.data() as UserData;
    const plan = userData?.plan || "free";

    const bucket = admin.storage().bucket();
    const storagePath = "stories/";
    const maxFreeStories = 3;
    const pageSize = plan === "free" ? maxFreeStories : 10;
    const pageToken = plan === "free" ? undefined : request.data.pageToken;

    // Get paginated list of story folders
    const [storyFolders, nextPageToken] = await bucket.getFiles({
      prefix: storagePath,
      delimiter: "/",
      maxResults: pageSize,
      pageToken: pageToken,
      autoPaginate: false,
    });

    // Process stories
    const stories: Story[] = [];
    for (const folder of storyFolders) {
      if (stories.length >= maxFreeStories && plan === "free") break;

      // Get story metadata
      const metadataFile = bucket.file(`${folder.name}metadata.json`);
      const [metadata] = await metadataFile.download();
      const storyMeta = JSON.parse(metadata.toString());

      // Get cover image
      const [coverUrl] = await bucket
        .file(`${folder.name}cover.jpg`)
        .getSignedUrl({
          action: "read",
          expires: Date.now() + 5 * 60 * 1000,
        });

      // Process episodes
      const episodes: Episode[] = [];
      const [episodeFolders] = await bucket.getFiles({
        prefix: `${folder.name}episodes/`,
        delimiter: "/",
      });

      for (const episodeFolder of episodeFolders) {
        // Get episode metadata
        const episodeId = episodeFolder.name.split("/").pop() || "";
        let episodeTitle = "Untitled Episode";

        try {
          const [epMetadata] = await bucket
            .file(`${episodeFolder.name}metadata.json`)
            .download();
          const episodeMeta = JSON.parse(epMetadata.toString());
          episodeTitle = episodeMeta.title || episodeTitle;
        } catch (error) {
          // Fallback to content.txt first line if metadata missing
          const [content] = await bucket
            .file(`${episodeFolder.name}content.txt`)
            .download();
          episodeTitle = content.toString().split("\n")[0] || episodeTitle;
        }

        // Get audio files
        const [audioFiles] = await bucket.getFiles({
          prefix: `${episodeFolder.name}audios/`,
        });

        const audioUrls = await Promise.all(
          audioFiles.map(async (file) => {
            const [url] = await file.getSignedUrl({
              action: "read",
              expires: Date.now() + 5 * 60 * 1000,
            });
            return url;
          })
        );

        // Get episode content
        const [contentBuffer] = await bucket
          .file(`${episodeFolder.name}content.txt`)
          .download();

        episodes.push({
          id: episodeId,
          title: episodeTitle,
          contentUrl: `data:text/plain;base64,${contentBuffer.toString(
            "base64"
          )}`,
          audioUrls,
        });
      }

      stories.push({
        id: folder.name.split("/").filter(Boolean).pop() || "",
        title: storyMeta.title,
        description: storyMeta.description,
        episodeSeries: storyMeta.episodeSeries,
        imgSrc: coverUrl,
        episodes,
      });
    }

    return {
      stories: stories,
      nextPageToken: plan === "free" ? null : nextPageToken,
    };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      "Error retrieving stories",
      error
    );
  }
});
