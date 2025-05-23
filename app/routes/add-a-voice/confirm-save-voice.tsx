import { useState } from "react";
import localforage from "localforage";
import { useNavigate } from "react-router";
import {
  clearPreviousVoiceSamples,
  STORAGE_KEY_VOICE_NAME,
  STORAGE_KEY_VOICE_SAMPLES,
  uploadVoiceSamples,
  type FileToUpload,
  type VoiceSampleFile,
} from "./add-voice";
import { toast, ToastContainer } from "react-toastify";

const ConfirmSaveVoicePage = () => {
  const navigate = useNavigate();

  // Track each checkbox state
  const [hasNecessaryRights, setHasNecessaryRights] = useState(false);
  const [consentToUse, setConsentToUse] = useState(false);

  // Combine logic: button should be enabled only if both are checked
  const isButtonDisabled = !(hasNecessaryRights && consentToUse);

  // State for total upload progress (null means not uploading)
  const [totalProgress, setTotalProgress] = useState<number | null>(null);

  async function handleAddVoice(): Promise<void> {
    let hasError = false; // Track error state
    const cancelProgressRef = { current: () => {} }; // Reference to cancel progress updates

    try {
      setTotalProgress(0);

      const voiceName = (await localforage.getItem(
        STORAGE_KEY_VOICE_NAME
      )) as string;
      const voiceSamples = (await localforage.getItem(
        STORAGE_KEY_VOICE_SAMPLES
      )) as VoiceSampleFile[];

      if (!voiceName || !voiceSamples) {
        toast.error("Voice name or samples are missing");
        setTotalProgress(null);
        return;
      }

      const progressValues: { [key: string]: number } = {};
      const totalFiles = voiceSamples.length;

      // Modified debounce function with cancel capability
      const { updateProgress, cancel } = (() => {
        let timeout: NodeJS.Timeout;
        return {
          updateProgress: (progress: number) => {
            if (hasError) return; // Don't update if error occurred
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              if (!hasError) setTotalProgress(progress);
            }, 300);
          },
          cancel: () => clearTimeout(timeout),
        };
      })();

      cancelProgressRef.current = cancel;

      const fileItems = voiceSamples.map((sample) => ({
        file: sample,
        onProgress: (progress: number) => {
          if (hasError) return; // Stop processing progress updates
          progressValues[sample.id] = progress;
          const total = Object.values(progressValues).reduce(
            (sum, val) => sum + val,
            0
          );
          updateProgress(total / totalFiles);
        },
      })) as FileToUpload[];

      await clearPreviousVoiceSamples(voiceName);
      const result = await uploadVoiceSamples(voiceName, fileItems);

      // Final progress update
      updateProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTotalProgress(null);

      toast.success("Voice samples uploaded successfully!");
      navigate("/add-voice-success");
    } catch (err) {
      hasError = true;
      cancelProgressRef.current(); // Cancel any pending progress updates
      setTotalProgress(null);

      // Immediately set progress to null and show error
      toast.error("Upload failed. Please try again.");
    }
  }

  return (
    <div>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
            <div className="text-[#F1F8F7] text-[40px] font-fraunces font-semibold shrink-0 w-14 h-14 bg-custom-teal text-white rounded-full flex items-center justify-center mt-[70px]">
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
                I confirm that I have all necessary rights and consents to
                upload and use this voice sample.
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
    </div>
  );
};

export default ConfirmSaveVoicePage;
