import React, { useEffect, useState } from "react";
import localforage from "localforage";
import { useNavigate } from "react-router";
import { STORAGE_KEY_VOICE_NAME } from "./add-voice";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";

const NameYourVoicePage = () => {
  const navigate = useNavigate();
  const [voiceName, setVoiceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [terminationError, setTerminationError] = useState(false);
  const [existingVoices, setExistingVoices] = useState<
    Array<{ voiceName: string }>
  >([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);

  useEffect(() => {
    localforage.getItem<string>(STORAGE_KEY_VOICE_NAME).then((name) => {
      name && setVoiceName(name);
    });

    // Fetch existing voices on component mount
    const fetchExistingVoices = async () => {
      try {
        const getExistingVoices = httpsCallable(functions, "getExistingVoices");
        const result = await getExistingVoices();
        const voices = (result.data as { voices: Array<{ voiceName: string }> })
          .voices;

        setExistingVoices(voices);

        // Check voice limit immediately
        if (voices.length >= 2) {
          setError(
            "Maximum of 2 voice clones per user. Please delete an existing voice to create a new one."
          );
        }
      } catch (error) {
        console.error("Error loading voices:", error);
        setError(
          "Failed to load existing voices. Please refresh to try again."
        );
        setTerminationError(true);
      } finally {
        setIsLoadingVoices(false);
      }
    };

    fetchExistingVoices();
  }, []);

  function handleVoiceNameChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    const newName = event.target.value;
    setVoiceName(newName);
    localforage.setItem(STORAGE_KEY_VOICE_NAME, newName);

    // Clear error when user starts typing
    if (error && existingVoices.length < 2) {
      setError(null);
    }
  }

  function handleOnNext(): void {
    if (isLoadingVoices) return;

    const trimmedName = voiceName.trim();

    if (!trimmedName) {
      setError("Please enter a name before proceeding.");
      return;
    }

    // Check for duplicate name using cached results
    const isDuplicate = existingVoices.some(
      (voice) => voice.voiceName.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setError(
        "A voice with this name already exists. Please choose a different name."
      );
      return;
    }

    // If all checks pass, navigate
    navigate("/upload-voice");
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
          <div className="text-[#F1F8F7] text-[40px] font-fraunces font-semibold shrink-0 w-14 h-14 bg-custom-teal text-white rounded-full flex items-center justify-center mt-[70px]">
            1
          </div>
          <p className="text-3xl font-medium text-black mt-6">
            Name your voice
          </p>
        </div>

        <div className="mt-[69px]">
          <div className="item-center">
            <input
              type="text"
              value={voiceName}
              placeholder="e.g. Daddy, Mummy, Grand Ma..."
              pattern="[a-zA-Z0-9]*"
              onChange={handleVoiceNameChange}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !isLoadingVoices) {
                  handleOnNext();
                }
              }}
              className={`w-full h-14 bg-[#F9FBFB] border border-[#829793] rounded-xl p-5 transition-colors`}
              id="voice-name"
              disabled={isLoadingVoices || existingVoices.length >= 2}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg mt-4 mb-4">
              {error}
            </div>
          )}

          {/* Navigation Footer */}
          <div className="mt-9 flex justify-between items-center">
            <button
              onClick={() => navigate("/my-account")}
              className="font-bold text-xl bg-[#F1F8F7] rounded-3xl w-28 h-14 px-6 py-2 text-black hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={
                terminationError ||
                isLoadingVoices ||
                existingVoices.length >= 2
              }
              onClick={handleOnNext}
              className={`font-bold text-xl w-52 h-14 text-white rounded-3xl px-6 py-2 transition-colors ${
                terminationError ||
                isLoadingVoices ||
                existingVoices.length >= 2
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-blue-700"
              }`}
            >
              {isLoadingVoices
                ? "Loading..."
                : existingVoices.length >= 2
                ? "Limit Reached"
                : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameYourVoicePage;
