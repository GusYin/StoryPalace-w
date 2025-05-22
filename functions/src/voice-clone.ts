import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { createHash } from "crypto";
import ElevenLabsSDK, { VoiceSample } from "./elevenlabs-client";

const db = admin.firestore();
const bucket = admin.storage().bucket();

interface VoiceClone {
  userId: string;
  voiceName: string;
  lastUsed: FirebaseFirestore.Timestamp;
  elevenLabsVoiceId: string; // Added field to store actual API voice ID
}

interface TTSQuota {
  totalMinutesUsed: number;
  lastReset: FirebaseFirestore.Timestamp;
}

// TTS audio doc in Firestore
interface TTSAudio {
  userId: string;
  storyNameAndVoiceHash: string;
  voiceName: string;
  storagePath: string;
  url: string;
  estimatedDuration: number;
  createdAt: admin.firestore.Timestamp;
}

// Voice Clone Management
export const createVoiceClone = functions.https.onCall(async (request) => {
  if (!request.auth?.uid && !request.auth?.token?.email_verified) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  // Validate request data
  if (!request.data.voiceName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required voice clone data"
    );
  }

  try {
    const userId = request.auth.uid;
    const elevenLabs = new ElevenLabsSDK();
    const voiceName = request.data.voiceName;
    const voiceClonesRef = db.collection("voiceClones");

    // 1. Check for existing voice with voice name for this user
    const userVoiceQuery = await voiceClonesRef
      .where("userId", "==", userId)
      .where("voiceName", "==", voiceName)
      .limit(1)
      .get();

    if (!userVoiceQuery.empty) {
      const voiceData = userVoiceQuery.docs[0].data() as VoiceClone;
      await voiceClonesRef.doc(userVoiceQuery.docs[0].id).update({
        lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { voiceName: voiceData.voiceName };
    }

    // 2. Check user's voice count
    const userVoicesQuery = await voiceClonesRef
      .where("userId", "==", userId)
      .count()
      .get();

    if (userVoicesQuery.data().count >= 2) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Maximum of 2 voice clones per user"
      );
    }

    // 3. Fetch voice samples from Firebase Storage
    const prefix = `users/${userId}/voice-samples/${voiceName}`;
    const [files] = await bucket.getFiles({ prefix });

    const samples: VoiceSample[] = [];
    for (const file of files) {
      // Get download URL that works without authentication
      // The Admin SDK bypasses security rules by default
      const [downloadUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        version: "v4", // Always use v4 signed URLs
      });

      samples.push({
        fileName: file.name,
        downloadUrl: downloadUrl,
        contentType: file.metadata.contentType || "audio/wav",
      });
    }

    if (samples.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `No voice samples found for the given ${voiceName}`
      );
    }

    // 4. Check global slots (original 30-voice limit)
    // 11labs Creator plan
    // const voiceOperationMonthlyQuota = 95;
    const voiceSlotsLimit = 30;
    const totalVoices = (await voiceClonesRef.count().get()).data().count;

    if (totalVoices >= voiceSlotsLimit) {
      const lruQuery = await voiceClonesRef
        .orderBy("lastUsed", "asc")
        .limit(1)
        .get();

      const lruVoice = lruQuery.docs[0].data() as VoiceClone;
      // Delete using actual ElevenLabs voice ID
      await elevenLabs.deleteVoice(lruVoice.elevenLabsVoiceId);
      await voiceClonesRef.doc(lruQuery.docs[0].id).delete();
    }

    // Create new voice clone
    const elevenLabsVoiceId = await elevenLabs.createClone({
      voiceName,
      samples,
    });

    // Store voice clone data in Firestore
    await voiceClonesRef.add({
      userId,
      voiceName,
      elevenLabsVoiceId,
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
    } as VoiceClone);

    return { voiceName };
  } catch (error) {
    console.error("Error in createVoiceClone:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to create voice clone",
      error instanceof Error ? error.message : undefined
    );
  }
});

// TTS Quota Management
// Modified generateTTS function with caching
export const generateTTS = functions.https.onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  // 11 labs Creator plan
  const TTS_MONTHLY_QUOTA_MINUTES = 100;
  const CHARACTERS_PER_5_MINUTE = 1500;

  const elevenLabs = new ElevenLabsSDK();
  const userId = request.auth.uid;
  const storyText = request.data.text;
  const storyName = request.data.storyName;
  const voiceName = request.data.voiceName;

  try {
    // First get the ElevenLabs voice ID from Firestore
    const voiceDoc = await db
      .collection("voiceClones")
      .where("userId", "==", userId)
      .where("voiceName", "==", voiceName)
      .limit(1)
      .get();

    if (voiceDoc.empty) {
      throw new Error("Voice not found");
    }

    const elevenLabsVoiceId = voiceDoc.docs[0].data().elevenLabsVoiceId;

    // Create unique hash for the storyName/voice combination
    const storyNameAndVoiceHash = createHash("sha256")
      .update(storyName + voiceName)
      .digest("hex");

    const estimatedMinutes = storyText.length / CHARACTERS_PER_5_MINUTE;
    const ttsAudioRef = db.collection("ttsAudio");
    const quotaRef = db.collection("ttsQuota").doc("monthlyUsage");

    // Check for existing audio first
    const existingAudio = await ttsAudioRef
      .where("storyNameAndVoiceHash", "==", storyNameAndVoiceHash)
      .where("voiceName", "==", voiceName)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!existingAudio.empty) {
      const audioData = existingAudio.docs[0].data() as TTSAudio;
      return { audioUrl: audioData.url };
    }

    // Proceed with new generation
    return db.runTransaction(async (transaction) => {
      // Check quota
      const quotaDoc = await transaction.get(quotaRef);
      const quotaData = quotaDoc.data() as TTSQuota | undefined;
      const currentUsage = quotaData?.totalMinutesUsed || 0;
      const newTotal = currentUsage + estimatedMinutes;

      if (newTotal > TTS_MONTHLY_QUOTA_MINUTES) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Monthly TTS limit reached"
        );
      }

      // Generate audio
      const audioBuffer = await elevenLabs.generateTTS(
        storyText,
        elevenLabsVoiceId
      );

      // Upload to storage
      const storagePath = `tts/${userId}/${storyName}/${storyNameAndVoiceHash}.mp3`;
      const file = bucket.file(storagePath);

      await file.save(audioBuffer, {
        metadata: {
          contentType: "audio/mpeg",
          metadata: {
            userEmail: request.auth?.token.email,
            userDisplayName: request.auth?.token.name,
            voiceName,
          },
        },
      });

      // Get public URL
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "2040-01-01", // Valid ISO 8601 format
        version: "v4", // Always use v4 signed URLs
      });

      // Create audio document
      const audioDoc: TTSAudio = {
        userId,
        storyNameAndVoiceHash,
        voiceName,
        storagePath,
        url,
        estimatedDuration: estimatedMinutes * 60, // Convert to seconds
        createdAt: admin.firestore.Timestamp.now(),
      };

      transaction.set(ttsAudioRef.doc(), audioDoc);
      transaction.set(
        quotaRef,
        {
          totalMinutesUsed: newTotal,
          lastReset:
            quotaData?.lastReset ||
            admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { audioUrl: url };
    });
  } catch (error) {
    console.error("Error generating TTS:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate TTS audio",
      error instanceof Error ? error.message : undefined
    );
  }
});

// Scheduled monthly quota reset
export const resetTTSUsage = functions.scheduler.onSchedule(
  {
    schedule: "0 0 1 * *", // on the first of month 00:00
    timeZone: "UTC",
    retryCount: 2, // Built-in retry configuration
    maxBackoffSeconds: 60, // Built-in retry configuration
  },
  async () => {
    const quotaRef = db.collection("ttsQuota").doc("monthlyUsage");

    try {
      await quotaRef.update({
        totalMinutesUsed: 0,
        lastReset: admin.firestore.FieldValue.serverTimestamp(),
      } as Partial<TTSQuota>);

      console.log("TTS usage reset successfully");
    } catch (error) {
      console.error("Error resetting TTS usage:", error);
      throw error;
    }
  }
);

export const getExistingVoices = functions.https.onCall(async (request) => {
  if (!request.auth?.uid || !request.auth?.token?.email_verified) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication and email verified required"
    );
  }

  try {
    const userId = request.auth.uid;
    const voiceClonesRef = db.collection("voiceClones");

    // This query requires a composite index
    const query = voiceClonesRef
      .where("userId", "==", userId)
      .orderBy("lastUsed", "desc");

    const snapshot = await query.get();

    return {
      voices: snapshot.docs.map((doc) => ({
        voiceName: doc.data().voiceName,
        lastUsed: doc.data().lastUsed.toDate(),
      })),
    };
  } catch (error) {
    console.error("Error fetching existing voices:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to retrieve voices",
      error instanceof Error ? error.message : undefined
    );
  }
});
