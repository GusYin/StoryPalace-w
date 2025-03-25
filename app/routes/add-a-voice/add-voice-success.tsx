import React, { useState, useRef, useEffect } from "react";
import localforage from "localforage";
import { useNavigate } from "react-router";
import { TickIcon } from "~/components/icons/tick";

const STORAGE_KEY = "nameYourVoice";

const AddVoiceSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="text-black font-dosis min-h-screen bg-gray-50 p-8">
      <div className="relative max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
        {/* "X" Button within the white card */}
        <button
          onClick={() => navigate("/my-account")}
          className="absolute text-[#707978] top-4 right-4 text-2xl font-bold text-gray-600 hover:text-gray-800"
        >
          X
        </button>

        {/* Centered Title */}
        <div className="text-black text-center mb-8 flex flex-col items-center">
          <h1 className="text-xl font-bold">Add a voice</h1>
          <div className="text-[#F1F8F7] text-[40px] font-fraunces font-semibold shrink-0 w-14 h-14 bg-custom-teal text-white rounded-full flex items-center justify-center mt-[70px]">
            <TickIcon />
          </div>
          <p className="text-3xl font-medium  mt-14">
            Your voice has been successfully saved
          </p>
        </div>

        <div className="mt-[48px]">
          <p>
            Please note that it may take some time to create stories with your
            custom narration. We’ll notify you when they’re ready!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddVoiceSuccessPage;
