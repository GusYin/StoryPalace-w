import React, { useState, useRef, useEffect } from "react";
import localforage from "localforage";
import { useNavigate } from "react-router";

const STORAGE_KEY = "nameYourVoice";

const NameYourVoicePage = () => {
  const navigate = useNavigate();

  function handleVoiceNameChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    localforage.setItem(STORAGE_KEY, event.target.value);
  }

  return (
    <div className="font-dosis min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
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
              className={`w-full h-14 bg-[#F9FBFB] border border-[#829793] rounded-xl p-5 transition-colors`}
              id="voice-name"
            />
          </div>

          {/* Navigation Footer */}
          <div className="mt-9 flex justify-between items-center">
            <button
              onClick={() => navigate("/my-account")}
              className="font-bold text-xl bg-[#F1F8F7] rounded-3xl w-28 h-14 px-6 py-2 text-black hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => navigate("/upload-voice")}
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
