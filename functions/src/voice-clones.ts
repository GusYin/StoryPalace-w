import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { createHash } from "crypto";

admin.initializeApp();
const db = admin.firestore();
const storage = getStorage();

// Interface definitions
interface VoiceClone {
  userId: string;
  voiceId: string;
  lastUsed: FirebaseFirestore.Timestamp;
  sampleUrl: string;
}

interface TTSQuota {
  totalMinutesUsed: number;
  lastReset: FirebaseFirestore.Timestamp;
}

// New interface for TTS audio metadata
interface TTSAudio {
  userId: string;
  textHash: string;
  voiceId: string;
  storagePath: string;
  url: string;
  duration: number;
  createdAt: admin.firestore.Timestamp;
}

// ElevenLabs API Client (Mock implementation - replace with actual SDK)
class ElevenLabsClient {
  async createClone(sampleUrl: string): Promise<string> {
    const API_URL = "https://api.elevenlabs.io/v1/voices/add";

    // Implementation using ElevenLabs API
    return `voice_${Math.random().toString(36).substr(2, 9)}`;
  }

  async deleteVoice(voiceId: string): Promise<void> {
    // Implementation using ElevenLabs API
  }

  async generateTTS(text: string, voiceId: string): Promise<Buffer> {
    // Implementation using ElevenLabs API that returns audio buffer
    // Mock implementation - replace with actual API call
    return Buffer.from(`mock-audio-for-${text.substring(0, 10)}`);
  }
}

const elevenLabs = new ElevenLabsClient();

// Voice Clone Management
export const createVoiceClone = functions.https.onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = request.auth.uid;
  const voiceSlotsLimit = 30;
  const voiceClonesRef = db.collection("voiceClones");

  // Check existing user voice clone
  const userVoiceQuery = await voiceClonesRef
    .where("userId", "==", userId)
    .limit(1)
    .get();
  if (!userVoiceQuery.empty) {
    const voiceData = userVoiceQuery.docs[0].data() as VoiceClone;
    await voiceClonesRef.doc(userVoiceQuery.docs[0].id).update({
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { voiceId: voiceData.voiceId };
  }

  // Check available slots and evict LRU if needed
  const totalVoices = (await voiceClonesRef.count().get()).data().count;
  if (totalVoices >= voiceSlotsLimit) {
    const lruQuery = await voiceClonesRef
      .orderBy("lastUsed", "asc")
      .limit(1)
      .get();

    const lruVoice = lruQuery.docs[0].data() as VoiceClone;
    await elevenLabs.deleteVoice(lruVoice.voiceId);
    await voiceClonesRef.doc(lruQuery.docs[0].id).delete();
  }

  // Create new voice clone
  const newVoiceId = await elevenLabs.createClone(request.data.sampleUrl);
  await voiceClonesRef.add({
    userId,
    voiceId: newVoiceId,
    lastUsed: admin.firestore.FieldValue.serverTimestamp(),
    sampleUrl: request.data.sampleUrl,
  } as VoiceClone);

  return { voiceId: newVoiceId };
});

// TTS Quota Management
// Modified generateTTS function with caching
export const generateTTS = functions.https.onCall(async (request) => {
  const TTS_MONTHLY_QUOTA_MINUTES = 100;
  const CHARACTERS_PER_5_MINUTE = 1500;

  if (!request.auth?.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = request.auth.uid;
  const text = request.data.text;
  const voiceId = request.data.voiceId;

  // Create unique hash for the text/voice combination
  const textHash = createHash("sha256")
    .update(text + voiceId)
    .digest("hex");

  const estimatedMinutes = text.length / CHARACTERS_PER_5_MINUTE;
  const ttsAudioRef = db.collection("ttsAudio");
  const quotaRef = db.collection("ttsQuota").doc("monthlyUsage");

  // Check for existing audio first
  const existingAudio = await ttsAudioRef
    .where("textHash", "==", textHash)
    .where("voiceId", "==", voiceId)
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
    const audioBuffer = await elevenLabs.generateTTS(text, voiceId);

    // Upload to storage
    const filePath = `tts/${userId}/${textHash}-${voiceId}.mp3`;
    const file = storage.bucket().file(filePath);

    await file.save(audioBuffer, {
      metadata: {
        contentType: "audio/mpeg",
        metadata: {
          userId,
          voiceId,
          originalTextHash: textHash,
        },
      },
    });

    // Get public URL
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-09-2491", // Far future date
    });

    // Create audio document
    const audioDoc: TTSAudio = {
      userId,
      textHash,
      voiceId,
      storagePath: filePath,
      url,
      duration: estimatedMinutes * 60, // Convert to seconds
      createdAt: admin.firestore.Timestamp.now(),
    };

    transaction.set(ttsAudioRef.doc(), audioDoc);
    transaction.set(
      quotaRef,
      {
        totalMinutesUsed: newTotal,
        lastReset:
          quotaData?.lastReset || admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { audioUrl: url };
  });
});

// Scheduled monthly quota reset
export const resetTTSUsage = functions.scheduler.onSchedule(
  {
    schedule: "on the first of month 00:00",
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
