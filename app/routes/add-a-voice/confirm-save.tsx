import React, { useState, useRef, useEffect } from "react";
import localforage from "localforage";
import { useNavigate } from "react-router";

const STORAGE_KEY = "nameYourVoice";

const ConfirmSavePage = () => {
  const navigate = useNavigate();

  // Track each checkbox state
  const [hasNecessaryRights, setHasNecessaryRights] = useState(false);
  const [consentToUse, setConsentToUse] = useState(false);

  // Combine logic: button should be enabled only if both are checked
  const isButtonDisabled = !(hasNecessaryRights && consentToUse);

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

        <div className="mt-[103px] space-y-5">
          {/* Checkboxes */}
          <div>
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
          </div>

          <div>
            <label className="leading-[1.03] font-medium text-xl flex items-start gap-2 cursor-pointer mt-3">
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
          </div>

          {/* Navigation Footer */}
          <div className="mt-[60px] flex justify-between items-center">
            <button
              onClick={() => navigate("/upload-voice")}
              className="font-bold text-xl bg-[#F1F8F7] rounded-3xl w-28 h-14 px-6 py-2 text-black hover:text-gray-800 transition-colors"
            >
              Back
            </button>
            <button
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

export default ConfirmSavePage;
