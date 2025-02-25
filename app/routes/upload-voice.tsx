import React, { useState, useRef, useEffect } from "react";
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

const VoiceUploadPage = () => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [samples, setSamples] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);

  const fetchSamples = async () => {
    try {
      const getSamples = httpsCallable(functions, "getVoiceSamples");
      const result = await getSamples({});
      setSamples(result.data as any[]);
    } catch (err) {
      setError("Failed to fetch voice samples");
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("audio/")) {
        await uploadFile(file);
      } else {
        setError("Please upload an audio file");
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/wav" });
        setAudioBlob(blob);
        audioChunks.current = [];
      };

      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      setError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const generateUrl = httpsCallable<
        VoiceUploadUrlRequest,
        VoiceUploadUrlResponse
      >(functions, "generateVoiceUploadUrl");

      const {
        data: { uploadUrl },
      } = await generateUrl({
        contentType: file.type,
      });

      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) throw new Error("Upload failed");

      await fetchSamples();
      setUploadProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadFile(file);
    } catch (err) {
      setError("File upload failed");
    }
  };

  const handleRecordUpload = async () => {
    if (!audioBlob) return;

    const file = new File([audioBlob], "recording.wav", {
      type: "audio/wav",
      lastModified: Date.now(),
    });

    try {
      await uploadFile(file);
      setAudioBlob(null);
    } catch (err) {
      setError("Recording upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Add a voice
            </h1>

            <div
              ref={dropRef}
              className={`border-2 border-dashed ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
              } rounded-xl p-8 text-center mb-6 transition-colors`}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-gray-600 font-medium">
                  Upload a recording of your voice
                </p>
                <p className="text-sm text-gray-500">
                  Click to upload a file or drag and drop
                </p>
                <input
                  type="file"
                  accept="audio/mp3,audio/wav,audio/m4a"
                  onChange={handleFileUpload}
                  disabled={uploadProgress !== null}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            </div>

            {/* Recording Section */}
            <div className="space-y-4 mb-8">
              <h2 className="text-lg font-semibold text-gray-800">
                Record Audio
              </h2>
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={uploadProgress !== null}
                className={`px-6 py-3 rounded-lg font-medium ${
                  recording
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                } transition-colors`}
              >
                {recording ? "⏹ Stop Recording" : "⏺ Start Recording"}
              </button>

              {audioBlob && (
                <div className="space-y-4 mt-4">
                  <audio
                    controls
                    src={URL.createObjectURL(audioBlob)}
                    className="w-full"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={handleRecordUpload}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Upload Recording
                    </button>
                    <button
                      onClick={() => setAudioBlob(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Progress and Errors */}
            {uploadProgress !== null && (
              <div className="space-y-2 mb-4">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-600 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {uploadProgress}% uploaded
                </span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Tips */}
          <div className="md:col-span-1 bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Tips for quality recording:
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  1
                </div>
                <span className="text-gray-700">One speaker only</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  2
                </div>
                <span className="text-gray-700">Between 1 to 5 minutes</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  3
                </div>
                <span className="text-gray-700">No background noise</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="mt-8 flex justify-between items-center">
          <button className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors">
            ← Back
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceUploadPage;
