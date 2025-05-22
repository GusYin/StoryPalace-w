import { httpsCallable } from "firebase/functions";
import { deleteObject, listAll, ref } from "firebase/storage";
import { auth, functions, storage } from "~/firebase/firebase";

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

export async function uploadVoiceSamples(
  voiceName: string,
  items: FileToUpload[]
): Promise<UploadResultForVoiceSamples> {
  // Ensure the user is authenticated and email is verified
  if (!auth.currentUser?.uid || !auth.currentUser?.emailVerified) {
    throw new Error("User is not authenticated or email is not verified");
  }

  const userId = auth.currentUser.uid;
  const generateUploadUrl = httpsCallable(functions, "generateVoiceUploadUrl");
  const uploadPromises: Promise<UploadResultForEachVoiceSample>[] = [];

  try {
    // Process each file in the array
    for (const item of items) {
      const fileName = `${voiceName}_${item.file.id}`;
      const contentType = item.file.data.type || "audio/wav";

      // Get secure upload URL from callable function
      const { data } = await generateUploadUrl({
        voiceName,
        fileName,
        contentType,
      });

      const { uploadUrl, filePath, downloadUrl } = data as {
        uploadUrl: string;
        filePath: string;
        downloadUrl: string;
        expires: string;
      };

      const uploadPromise = new Promise<UploadResultForEachVoiceSample>(
        async (resolve, reject) => {
          try {
            const totalBytes = item.file.data.size;
            let bytesSent = 0;

            const transformStream = new TransformStream({
              transform(chunk, controller) {
                bytesSent += chunk.byteLength; // Track bytes sent
                item.onProgress?.((bytesSent / totalBytes) * 100); // Update progress
                controller.enqueue(chunk); // Pass through unchanged
              },
            });

            const response = await fetch(uploadUrl, {
              method: "PUT",
              headers: {
                "Content-Type": contentType,
              },
              body: item.file.data.stream().pipeThrough(transformStream),
            });

            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
            }

            resolve({ fileName, downloadUrl, filePath, contentType });
          } catch (error) {
            reject(error);
          }
        }
      );

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
    const listResult = await listAll(folderRef);

    // Create array of delete promises
    const deletePromises = listResult.items.map((item) => deleteObject(item));

    // Wait for all files to be deleted
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error clearing previous voice samples:", error);
    throw error;
  }
}
