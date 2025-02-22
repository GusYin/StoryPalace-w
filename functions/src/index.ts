/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Connect to Firestore Emulator in development
if (process.env.FUNCTIONS_EMULATOR) {
  db.settings({
    host: "localhost:8080",
    ssl: false,
  });
  console.log("Connected to Firestore Emulator at localhost:8080");
}

// Placeholder function to create a voice in ElevenLabs
async function createVoiceInElevenLabs(userId: string): Promise<string> {
  // Replace with actual ElevenLabs API call (e.g., using fetch or axios)
  // Simulating for now
  return `voice-${userId}`;
}

// Placeholder function to delete a voice from ElevenLabs
async function deleteVoiceFromElevenLabs(voiceId: string): Promise<void> {
  // Replace with actual ElevenLabs API call
  console.log(`Deleted voice ${voiceId} from ElevenLabs`);
}

/**
 * Cloud Function to get or create a voice for a user with hybrid LRU + TTL.
 * Callable from the client via Firebase SDK.
 */
export const getOrCreateVoice = onCall(async (request) => {
  // Authentication / user information is automatically added to the request.
  const userId = request.auth?.uid;
  if (!userId) {
    throw new functions.https.HttpsError("unauthenticated", "User ID required");
  }

  const TTL = 24 * 60 * 60 * 1000; // TTL set to 24 hours in milliseconds
  const currentTime = Date.now();
  const MAX_SLOTS = 10; // Maximum number of voice slots

  const VOICE_BANK_DOC_ID = "voiceBank";
  const MRU_DOC_ID = `${VOICE_BANK_DOC_ID}/mostRecentlyUsed`;
  const USER_VOICE_DOC_ID = `${VOICE_BANK_DOC_ID}/users`;

  // Field: order
  // Type: Array of userId strings
  // Order: Most Recently Used (MRU) at index 0, Least Recently Used (LRU)
  // at the end
  const mostRecentlyUsedDoc = db.doc(MRU_DOC_ID);

  // Document ID: userId
  // Fields:
  // voiceId: String (from ElevenLabs)
  // lastUsed: Timestamp (Firestore timestamp)
  const userVoiceDoc = db.doc(`${USER_VOICE_DOC_ID}/${userId}`);

  const [mostRecentlyUsedSnap, userVoiceSnap] = await Promise.all([
    mostRecentlyUsedDoc.get(),
    userVoiceDoc.get(),
  ]);

  let order: string[] = mostRecentlyUsedSnap.data()?.order || [];

  // Check if the user's voice exists and is not expired
  if (userVoiceSnap.exists) {
    const lastUsed = userVoiceSnap.data()?.lastUsed.toDate().getTime();
    if (currentTime - lastUsed <= TTL) {
      // Voice is valid: update lastUsed and move to front (Most Recently Used)
      await userVoiceDoc.update({ lastUsed: new Date() });
      order = [userId, ...order.filter((id) => id !== userId)];
      await mostRecentlyUsedDoc.set({ order });
      return { voiceId: userVoiceSnap.data()?.voiceId };
    }
  }

  // Handle adding a new voice or replacing an expired/evicted one

  // Identify expired voices
  const voicesToRemove: { uid: string; voiceId: string }[] = [];

  const voiceDocs = await Promise.all(
    order.map((uid) => db.doc(`${USER_VOICE_DOC_ID}/${uid}`).get())
  );

  for (let i = 0; i < order.length; i++) {
    const uid = order[i];
    const voiceSnap = voiceDocs[i];

    if (!voiceSnap.exists) continue;

    const lastUsed = voiceSnap.data()?.lastUsed.toDate().getTime();

    if (currentTime - lastUsed > TTL) {
      voicesToRemove.push({ uid, voiceId: voiceSnap.data()?.voiceId });
    }
  }

  // Remove expired voices from ElevenLabs and Firestore
  for (const { uid, voiceId } of voicesToRemove) {
    await deleteVoiceFromElevenLabs(voiceId);
    await db.doc(`${VOICE_BANK_DOC_ID}/${uid}`).delete();
    order = order.filter((id) => id !== uid);
  }
  await mostRecentlyUsedDoc.set({ order });

  // Check if there's space after removing expired voices
  if (order.length < MAX_SLOTS) {
    const voiceId = await createVoiceInElevenLabs(userId);
    await userVoiceDoc.set({ voiceId, lastUsed: new Date() });
    order = [userId, ...order];
    await mostRecentlyUsedDoc.set({ order });
    return { voiceId };
  } else {
    // No space: evict the Least Recently Used voice (last in order)
    const lruUserId = order[order.length - 1];
    const lruVoiceDoc = db.doc(`${VOICE_BANK_DOC_ID}/${lruUserId}`);
    const lruVoiceSnap = await lruVoiceDoc.get();
    const lruVoiceId = lruVoiceSnap.data()?.voiceId;
    await deleteVoiceFromElevenLabs(lruVoiceId);
    await lruVoiceDoc.delete();
    order = order.slice(0, -1);

    // Create and add the new voice
    const voiceId = await createVoiceInElevenLabs(userId);
    await userVoiceDoc.set({ voiceId, lastUsed: new Date() });
    order = [userId, ...order];
    await mostRecentlyUsedDoc.set({ order });
    return { voiceId };
  }
});
