import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  type StorageReference,
  uploadBytesResumable,
  type UploadTask,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { auth, storage } from "~/firebase/firebase";

export const STORAGE_KEY_VOICE_NAME = "voiceName";
export const STORAGE_KEY_VOICE_SAMPLES = "voiceSamples";

export interface VoiceSampleFile {
  id: string;
  name: string;
  duration: number;
  data: Blob;
  url: string;
}

// Define the interface for each upload item
export interface FileToUpload {
  file: VoiceSampleFile;
  onProgress?: (progress: number) => void;
}

// Define the return type for each upload result
export interface UploadResultForEachVoiceSample {
  fileName?: string;
  downloadUrl: string;
  filePath: string;
  contentType?: string;
}

export interface UploadResultForVoiceSamples {
  uniqueVoiceName: string;
  uploadedFiles: UploadResultForEachVoiceSample[];
}

// Helper function to upload a single file and return UploadResult
async function uploadSingleFile(
  uploadTask: UploadTask,
  fileRef: StorageReference,
  filePath: string
): Promise<UploadResultForEachVoiceSample> {
  await uploadTask;
  const downloadUrl = await getDownloadURL(fileRef);
  return { filePath, downloadUrl };
}

export async function uploadVoiceSamples(
  voiceName: string,
  items: FileToUpload[]
): Promise<UploadResultForVoiceSamples> {
  // Ensure the user is authenticated and email is verified
  if (!auth.currentUser?.uid || !auth.currentUser?.emailVerified) {
    throw new Error("User is not authenticated or email is not verified");
  }

  const userId = auth.currentUser.uid;
  const uploadPromises: Promise<UploadResultForEachVoiceSample>[] = [];

  try {
    // Process each file in the array
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // Add client-side validation (mirror storage rules)
      const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
      if (item.file.data.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds 20MB limit");
      }
      // Add timestamp to prevent name collisions
      const fileName = `${voiceName}_${item.file.id}`;
      const contentType = item.file.data.type || "audio/wav";
      const filePath = `voice-samples/${userId}/${voiceName}/${fileName}`;
      const fileRef: StorageReference = ref(storage, filePath);

      // Create and start the upload task
      const uploadTask: UploadTask = uploadBytesResumable(
        fileRef,
        item.file.data,
        {
          contentType: contentType,
          customMetadata: {
            voiceName: voiceName,
            originalFileName: item.file.name.slice(0, 256), // Prevent long names
            duration: item.file.duration.toString(),
          },
        }
      );

      // Attach progress listener if provided
      if (item.onProgress) {
        const onProgress = item.onProgress;
        uploadTask.on("state_changed", (snapshot: UploadTaskSnapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        });
      }

      // Create a promise for this upload using the helper function
      const uploadPromise = uploadSingleFile(uploadTask, fileRef, filePath);
      uploadPromises.push(uploadPromise);
    }

    // Wait for all uploads to complete and return the results
    const result = await Promise.all(uploadPromises);

    return {
      uniqueVoiceName: `${voiceName}_${userId}`,
      uploadedFiles: result,
    };
  } catch (error) {
    console.error("Error uploading voice samples:", error);
    throw error; // Rethrow the error to the caller
  }
}

export async function clearPreviousVoiceSamples(
  voiceName: string
): Promise<void> {
  // Ensure the user is authenticated and email is verified
  if (!auth.currentUser?.uid || !auth.currentUser?.emailVerified) {
    throw new Error("User is not authenticated or email is not verified");
  }

  const userId = auth.currentUser.uid;
  const folderRef = ref(storage, `voice-samples/${userId}/${voiceName}`);

  try {
    // List all files in the voice samples folder
    const { items } = await listAll(folderRef);

    if (items.length === 0) return;

    // Create array of delete promises
    const deletePromises = items.map((item) => deleteObject(item));

    // Wait for all files to be deleted
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error clearing previous voice samples:", error);
    throw error;
  }
}
