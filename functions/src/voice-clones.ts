import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

admin.initializeApp();
const db = admin.firestore();

// Connect to Firestore Emulator in development
if (process.env.FUNCTIONS_EMULATOR) {
  db.settings({
    host: "localhost:8080",
    ssl: false,
  });
  console.log("Connected to Firestore Emulator at localhost:8080");
}

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

  async generateTTS(text: string, voiceId: string): Promise<string> {
    // Implementation using ElevenLabs API
    return `https://storage.example.com/audio/${Math.random().toString(
      36
    )}.mp3`;
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
export const generateTTS = functions.https.onCall(async (request) => {
  const TTS_MONTHLY_QUOTA_MINUTES = 100; // Minutes
  const CHARACTERS_PER_5_MINUTE = 1500;

  if (!request.auth?.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const text = request.data.text;
  const voiceId = request.data.voiceId;

  // Calculate text duration (e.g., estimatedMinutes = text.length / 1500,
  // assuming 1500 chars ≈ 5 minutes).
  const estimatedMinutes = text.length / CHARACTERS_PER_5_MINUTE;
  const quotaRef = db.collection("ttsQuota").doc("monthlyUsage");

  try {
    await db.runTransaction(async (transaction) => {
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

      transaction.set(
        quotaRef,
        {
          totalMinutesUsed: newTotal,
          lastReset:
            quotaData?.lastReset ||
            admin.firestore.FieldValue.serverTimestamp(),
        } as TTSQuota,
        { merge: true }
      );
    });

    // Generate TTS audio
    const audioUrl = await elevenLabs.generateTTS(text, voiceId);
    return { audioUrl };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "TTS generation failed");
  }
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
