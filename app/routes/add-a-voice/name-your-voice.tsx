import React, { useState } from "react";
import localforage from "localforage";
import { useNavigate } from "react-router";

const STORAGE_KEY = "nameYourVoice";

const NameYourVoicePage = () => {
  const navigate = useNavigate();
  const [voiceName, setVoiceName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleVoiceNameChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    setError(null);
    const newName = event.target.value;
    setVoiceName(newName);
    localforage.setItem(STORAGE_KEY, newName);
  }

  function handleOnNext(): void {
    if (voiceName.trim() === "") {
      setError("Please enter a name before proceeding.");
      return;
    }

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
          <div className="text-[#F1F8F7] text-[40px] font-fraunces font-semibold flex-shrink-0 w-14 h-14 bg-custom-teal text-white rounded-full flex items-center justify-center mt-[70px]">
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
              placeholder="e.g. Daddy, Mummy, Grand Ma..."
              pattern="[a-zA-Z0-9]*"
              onChange={handleVoiceNameChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleOnNext();
                }
              }}
              className={`w-full h-14 bg-[#F9FBFB] border border-[#829793] rounded-xl p-5 transition-colors`}
              id="voice-name"
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
              onClick={handleOnNext}
              className="font-bold text-xl w-52 h-14 bg-black text-white rounded-3xl px-6 py-2 hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameYourVoicePage;
