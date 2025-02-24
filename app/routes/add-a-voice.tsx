import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

interface VoiceUploadUrlRequest {
  contentType: string;
}

interface VoiceUploadUrlResponse {
  uploadUrl: string;
  filePath: string;
  expires: string;
}

// Generate signed URL
const generateVoiceUploadUrl = async () => {
  const response = await httpsCallable<
    VoiceUploadUrlRequest,
    VoiceUploadUrlResponse
  >(
    functions,
    "generateVoiceUploadUrl"
  )({
    contentType: "audio/wav",
  });

  const { uploadUrl, filePath } = response.data;

  return { uploadUrl, filePath };
};

// Upload file directly using fetch
const uploadVoiceSample = async (uploadUrl: string, audioFile: any) => {
  await fetch(uploadUrl, {
    method: "PUT",
    body: audioFile,
    headers: {
      "Content-Type": "audio/wav",
    },
  });
};

interface VoiceSamplesResponse {
  id: string;
  createdAt: string;
}

// Get voice samples by userId. UserId is automatically added to request by Firebase.
const getVoiceSamples = async () => {
  const samples = await httpsCallable<any, VoiceSamplesResponse>(
    functions,
    "getVoiceSamples"
  )();
  return samples.data;
};
