import * as functions from "firebase-functions/v2";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { throwIfUnauthenticated } from "./util";

const db = getFirestore();
const bucket = getStorage().bucket();

type VALID_AUDIO_CONTENT_TYPE =
  | "audio/mp3"
  | "audio/wav"
  | "audio/m4a"
  | "audio/mpeg"
  | string;

// Interface for voice sample metadata
interface VoiceSample {
  userId: string;
  downloadUrl: string;
  contentType: VALID_AUDIO_CONTENT_TYPE;
  createdAt: Timestamp;
  status: "processing" | "completed" | "failed";
  duration?: number; // Optional audio duration in seconds
}

// HTTPS Callable Function: Generate secure upload URL
export const generateVoiceUploadUrl = functions.https.onCall(
  async (request) => {
    throwIfUnauthenticated(request);

    const userId = request.auth?.uid;
    const fileName = request.data.fileName || Date.now().toString();
    const contentType = request.data.contentType || "audio/wav";
    const filePath = `users/${userId}/voice-samples/${fileName}`;

    try {
      // Generate signed URL for direct upload
      const [url] = await bucket.file(filePath).getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: contentType,
      });

      return {
        uploadUrl: url,
        filePath: filePath,
        expires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate signed URL",
        error
      );
    }
  }
);

// Storage Trigger: When voice sample is uploaded
export const processVoiceSample = functions.storage.onObjectFinalized(
  async (event) => {
    const file = event.data;
    if (!file) return;

    // Extract metadata
    const userId = file.name?.split("/")[1] || "unknown";
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${
      file.bucket
    }/o/${encodeURIComponent(file.name!)}?alt=media`;

    // Create Firestore document
    const voiceSampleDoc: VoiceSample = {
      userId: userId,
      downloadUrl: downloadUrl,
      contentType: file.contentType || "audio/wav",
      createdAt: Timestamp.now(),
      status: "processing",
    };

    try {
      // Add to Firestore
      await db.collection("voiceSamples").add(voiceSampleDoc);

      // Here you would add processing logic (e.g., audio analysis, duration detection)
      // For now, we'll just update the status to completed
      await db.collection("voiceSamples").doc().update({
        status: "completed",
        duration: 300, // Example duration
      });

      console.log(`Voice sample processed: ${file.name}`);
    } catch (error) {
      console.error("Error processing voice sample:", error);
      await db.collection("voiceSamples").doc().update({
        status: "failed",
      });
      throw error;
    }
  }
);

// HTTPS Callable Function: Get user's voice samples
export const getVoiceSamples = functions.https.onCall(async (request) => {
  throwIfUnauthenticated(request);

  const userId = request.auth?.uid;
  const snapshot = await db
    .collection("voiceSamples")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  const samples = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate().toISOString(),
  }));

  return samples;
});
