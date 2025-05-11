// import * as functions from "firebase-functions/v2";
// import { getStorage } from "firebase-admin/storage";

// export const getStories = functions.https.onCall(async () => {
//   const storage = getStorage();
//   const listRef = ref(storage, "stories/");
//   const res = await listAll(listRef);
//   return res.prefixes.map((folder) => folder.name);
// });

// // Firebase Function to delete episodes
// export const deleteEpisode = functions.https.onCall(
//   async (data: { storyId: string; episodeId: string }) => {
//     const storage = getStorage();
//     const episodeRef = ref(
//       storage,
//       `stories/${data.storyId}/episodes/${data.episodeId}`
//     );
//     await deleteObject(episodeRef);
//     return { success: true };
//   }
// );
