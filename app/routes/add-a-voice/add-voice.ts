import {
  getStorage,
  ref,
  uploadBytesResumable,
  type UploadTask,
  type UploadTaskSnapshot,
  getDownloadURL,
  type StorageReference,
} from "firebase/storage";
import { auth } from "~/firebase/firebase";

// Define the return type for the upload result
interface UploadResult {
  filePath: string;
  downloadUrl: string;
}

/**
 * Uploads an audio file to Firebase Storage under the authenticated user's directory.
 * @param file The audio file to upload.
 * @param fileName Optional custom file name; defaults to current timestamp.
 * @param contentType Optional MIME type; defaults to "audio/mpeg".
 * @param onProgress Optional callback to report upload progress (0-100).
 * @returns A promise resolving to the file path and download URL.
 * @throws Error if the user is not authenticated.
 */
async function uploadVoiceSample(
  file: File,
  fileName?: string,
  contentType?: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  // Ensure the user is authenticated
  if (!auth.currentUser?.uid || !auth.currentUser?.emailVerified) {
    throw new Error("User is not authenticated");
  }

  // Set default values if not provided
  const finalFileName = fileName || Date.now().toString();
  const finalContentType = contentType || "audio/mpeg";

  // Construct the file path
  const filePath = `users/${auth.currentUser?.uid}/voice-samples/${finalFileName}`;

  // Initialize Firebase Storage and create a reference to the file path
  const storage = getStorage();
  const fileRef: StorageReference = ref(storage, filePath);

  // Upload the file with resumable upload for progress tracking
  const uploadTask: UploadTask = uploadBytesResumable(fileRef, file, {
    contentType: finalContentType,
  });

  // Monitor upload progress if a callback is provided
  if (onProgress) {
    uploadTask.on("state_changed", (snapshot: UploadTaskSnapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    });
  }

  // Wait for the upload to complete
  await uploadTask;

  // Get the download URL for the uploaded file
  const downloadUrl = await getDownloadURL(fileRef);

  // Return the file path and download URL
  return {
    filePath,
    downloadUrl,
  };
}

// Define the interface for each upload item
interface UploadItem {
  file: File;
  fileName?: string;
  contentType?: string;
  onProgress?: (progress: number) => void;
}

// Define the return type for each upload result
interface UploadResult {
  filePath: string;
  downloadUrl: string;
}

// Helper function to upload a single file and return UploadResult
async function uploadSingleFile(
  uploadTask: UploadTask,
  fileRef: StorageReference,
  filePath: string
): Promise<UploadResult> {
  await uploadTask;
  const downloadUrl = await getDownloadURL(fileRef);
  return { filePath, downloadUrl };
}

/**
 * Uploads multiple audio files to Firebase Storage under the authenticated user's directory.
 * @param items An array of upload items, each containing a file and optional metadata.
 * @returns A promise resolving to an array of upload results, each with filePath and downloadUrl.
 * @throws Error if the user is not authenticated or email is not verified.
 */
async function uploadVoiceSamples(
  items: UploadItem[]
): Promise<UploadResult[]> {
  // Ensure the user is authenticated and email is verified
  if (!auth.currentUser?.uid || !auth.currentUser?.emailVerified) {
    throw new Error("User is not authenticated or email is not verified");
  }
  const userId = auth.currentUser.uid;
  const storage = getStorage();
  const uploadPromises: Promise<UploadResult>[] = [];

  // Process each file in the array
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const fileName = item.fileName || `${Date.now()}_${i}`;
    const contentType = item.contentType || "audio/mpeg";
    const filePath = `users/${userId}/voice-samples/${fileName}`;
    const fileRef: StorageReference = ref(storage, filePath);

    // Create and start the upload task
    const uploadTask: UploadTask = uploadBytesResumable(fileRef, item.file, {
      contentType,
    });

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
  return Promise.all(uploadPromises);
}
