import { useState } from "react";
import localforage from "localforage";
import { useNavigate } from "react-router";
import {
  STORAGE_KEY_VOICE_NAME,
  STORAGE_KEY_VOICE_SAMPLES,
  uploadVoiceSamples,
  type UploadItem,
  type VoiceSampleFile,
} from "./add-voice";

// Debounce function to limit state updates
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const ConfirmSaveVoicePage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Track each checkbox state
  const [hasNecessaryRights, setHasNecessaryRights] = useState(false);
  const [consentToUse, setConsentToUse] = useState(false);
  // State for total upload progress (null means not uploading)
  const [totalProgress, setTotalProgress] = useState<number | null>(null);

  // Combine logic: button should be enabled only if both are checked
  const isButtonDisabled = !(hasNecessaryRights && consentToUse);

  async function handleAddVoice(): Promise<void> {
    setError(null);
    setTotalProgress(0); // Start uploading, set to 0 to show progress bar

    const voiceName = (await localforage.getItem(
      STORAGE_KEY_VOICE_NAME
    )) as string;
    const voiceSamples = (await localforage.getItem(
      STORAGE_KEY_VOICE_SAMPLES
    )) as VoiceSampleFile[];

    if (!voiceName || !voiceSamples) {
      setError("Voice name or samples are missing");
      setTotalProgress(null); // Reset to null if validation fails
      return;
    }

    // Track progress for all files
    const progressValues: { [key: string]: number } = {};
    const totalFiles = voiceSamples.length;

    // Debounced progress update
    const updateProgress = debounce((progress: number) => {
      setTotalProgress(progress);
    }, 300);

    // Create fileItems with progress callbacks
    const fileItems = voiceSamples.map((sample) => ({
      file: sample,
      onProgress: (progress: number) => {
        progressValues[sample.id] = progress;
        // Calculate average progress
        const total = Object.values(progressValues).reduce(
          (sum, val) => sum + val,
          0
        );
        const averageProgress = total / totalFiles;
        updateProgress(averageProgress);
      },
    })) as UploadItem[];

    try {
      await uploadVoiceSamples(voiceName, fileItems);
      // Ensure progress reaches 100% and stays visible briefly
      setTotalProgress(100);
      // Minimum 0.5s display time for 100% progress
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTotalProgress(null); // Reset to null after completion
      navigate("/add-voice-success");
    } catch (err) {
      setError("Upload failed");
      setTotalProgress(null); // Reset to null on error
    }
  }

  return (
    <div className="font-dosis min-h-screen bg-gray-50 p-8">
      <div className="relative max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
        {/* "X" Button within the white card */}
        <button
          onClick={() => navigate("/my-account")}
          className="absolute text-[#707978] top-4 right-4 text-2xl font-bold text-gray-600 hover:text-gray-800"
        >
          X
        </button>

        {/* Centered Title */}
        <div className="text-center mb-8 flex flex-col items-center">
          <h1 className="text-xl font-bold text-black">Add a voice</h1>
          <div className="text-[#F1F8F7] text-[40px] font-fraunces font-semibold flex-shrink-0 w-14 h-14 bg-custom-teal text-white rounded-full flex items-center justify-center mt-[70px]">
            3
          </div>
          <p className="text-3xl font-medium text-black mt-6">
            Confirm and save
          </p>
        </div>

        <div className="mt-[103px]">
          {/* Checkboxes */}
          <label className="leading-[1.03] font-medium text-xl flex items-start gap-2 cursor-pointer">
            <input
              className="mt-1 form-checkbox h-4 w-4 rounded-[2px] text-blue-600"
              type="checkbox"
              checked={hasNecessaryRights}
              onChange={(e) => setHasNecessaryRights(e.target.checked)}
            />
            <span>
              I confirm that I have all necessary rights and consents to upload
              and use this voice sample.
            </span>
          </label>

          <label className="leading-[1.03] font-medium text-xl flex items-start gap-2 cursor-pointer mt-6">
            <input
              className="mt-1 form-checkbox h-5 w-5 rounded-[2px] text-blue-600"
              type="checkbox"
              checked={consentToUse}
              onChange={(e) => setConsentToUse(e.target.checked)}
            />
            <span>
              I consent to Story Palace using this voice sample to create
              personalized narrations for stories on this platform.
            </span>
          </label>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg mt-6">
              {error}
            </div>
          )}

          {/* Total Upload Progress */}
          {totalProgress !== null && (
            <div className="mt-6">
              <h3 className="text-lg font-medium">Uploading files...</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${totalProgress}%` }}
                ></div>
              </div>
              <span>{Math.round(totalProgress)}%</span>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="mt-16 flex justify-between items-center">
          <button
            onClick={() => navigate("/upload-voice")}
            className="font-bold text-xl bg-[#F1F8F7] rounded-3xl w-28 h-14 px-6 py-2 text-black hover:text-gray-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleAddVoice}
            disabled={isButtonDisabled}
            className={`font-bold text-xl w-52 h-14 rounded-3xl px-6 py-2 transition-colors 
                ${
                  isButtonDisabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-custom-teal text-white hover:bg-blue-700"
                }
              `}
          >
            Add voice
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSaveVoicePage;
