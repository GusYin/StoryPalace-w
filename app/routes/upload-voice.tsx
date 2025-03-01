import React, { useState, useRef, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import { DeleteIcon } from "~/components/icons/delete-icon";
import { UploadIcon } from "~/components/icons/upload-icon";
import { UploadIconLg } from "~/components/icons/upload-icon-lg";
import { MicrophoneIcon } from "~/components/icons/microphone-icon";

interface VoiceUploadUrlRequest {
  contentType: string;
}

interface VoiceUploadUrlResponse {
  uploadUrl: string;
  filePath: string;
  expires: string;
}

const VoiceUploadPage = () => {
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [microphones, setMicrophones] = useState<MediaDeviceInfo[] | []>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);

  // Generate object URL when audioBlob changes and revoke it when component unmounts
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
      setRecordingTime(0);
    }
  }, [audioBlob]);

  // Get available microphones when component mounts
  useEffect(() => {
    async function getMicrophones() {
      try {
        // Request permission and get devices
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput"
        );
        setMicrophones(audioInputs);
        // Set default microphone if any exist
        if (audioInputs.length > 0) {
          setSelectedMic(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting microphones:", error);
      }
    }
    getMicrophones();
  }, []);

  // Timer effect for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [recording]);

  const fetchSamples = async () => {
    try {
      const getSamples = httpsCallable(functions, "getVoiceSamples");
      await getSamples({});
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
      setRecordingTime(0);

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
    <div className="font-dosis min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
        {/* Centered Title */}
        <div className="text-center mb-8 flex flex-col items-center">
          <h1 className="text-xl font-bold text-black">Add a voice</h1>
          <div className="text-[#F1F8F7] text-[40px] font-fraunces font-semibold flex-shrink-0 w-14 h-14 bg-custom-teal text-white rounded-full flex items-center justify-center mt-[70px]">
            2
          </div>
          <p className="text-3xl font-medium text-black mt-6">
            Upload a recording of your voice
          </p>
        </div>

        <div className="mt-[69px]">
          {/* Drag & Drop Zone */}
          <div
            ref={dropRef}
            className={`bg-[#F1F8F7] border border-dashed border-[#829793] ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            } rounded-2xl p-5 text-center transition-colors`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {showRecordingUI ? (
              // Recording UI
              <div className="space-y-4">
                <div className="text-black flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      if (recording) stopRecording();
                      setShowRecordingUI(false);
                    }}
                    className="hover:text-gray-800"
                  >
                    ← Back
                  </button>
                  <div className="text-sm text-gray-500">
                    {microphones.length > 0 ? (
                      <select
                        value={selectedMic}
                        onChange={(e) => setSelectedMic(e.target.value)}
                        className="border rounded-xl p-1"
                      >
                        {microphones.map((mic) => (
                          <option key={mic.deviceId} value={mic.deviceId}>
                            {mic.label ||
                              `Microphone ${mic.deviceId.slice(0, 5)}...`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-md">
                        No microphones detected
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-2xl font-medium text-gray-800 mb-4">
                  {Math.floor(recordingTime / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(recordingTime % 60).toString().padStart(2, "0")}
                  <span className="text-gray-500"> / 00:30</span>
                </div>

                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`rounded-3xl bg-custom-teal px-8 py-3 font-medium text-white ${
                    recording
                      ? "bg-red-600 hover:bg-red-700"
                      : "hover:bg-green-700"
                  } transition-colors`}
                >
                  {recording ? "⏹ Stop Recording" : "⏺ Start Recording"}
                </button>
              </div>
            ) : (
              // Upload UI
              <div className="space-y-3">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <UploadIconLg />
                </label>

                <p className="font-medium text-black">
                  Click to upload a file or drag and drop up to 10MB
                </p>
                <input
                  type="file"
                  accept="audio/mp3,audio/wav,audio/m4a"
                  onChange={handleFileUpload}
                  disabled={uploadProgress !== null}
                  className="hidden"
                  id="file-upload"
                />

                {/* or */}
                <div className="relative my-4">
                  <div className="relative flex justify-center">
                    <span className="inline-block rounded-full w-10 h-7 flex items-center justify-center bg-gray-200 text-black">
                      or
                    </span>
                  </div>
                </div>

                {/* Record audio button */}
                <div className="relative flex justify-center">
                  <button
                    onClick={() => setShowRecordingUI(true)}
                    className="flex items-center gap-2 py-3 px-6 bg-white hover:bg-gray-200 text-black rounded-full font-medium transition-colors"
                  >
                    <MicrophoneIcon />
                    Record audio
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recording preview section */}
          {audioBlob && audioUrl && (
            <div className="space-y-4 mt-3">
              <audio controls src={audioUrl} className="w-full" />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  Duration: {recordingTime} seconds
                </span>
                <div className="flex">
                  <button
                    onClick={handleRecordUpload}
                    className="hover:bg-custom-teal px-4 py-2 text-white rounded-3xl hover:bg-green-700 transition-colors"
                  >
                    <UploadIcon />
                  </button>
                  <button
                    onClick={() => setAudioBlob(null)}
                    className="flex items-center px-4 py-2 rounded-3xl hover:bg-gray-100 transition-colors"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            </div>
          )}

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
            <div className="p-4 bg-red-50 text-red-700 rounded-lg mt-4 mb-4">
              {error}
            </div>
          )}

          {/* Navigation Footer */}
          <div className="mt-9 flex justify-between items-center">
            <button className="font-bold text-xl bg-[#F1F8F7] rounded-3xl w-28 h-14 px-6 py-2 text-black hover:text-gray-800 transition-colors">
              Back
            </button>
            <button className="font-bold text-xl w-52 h-14 bg-black text-white rounded-3xl px-6 py-2 hover:bg-blue-700 transition-colors">
              Next
            </button>
          </div>

          {/* Tips */}
          <div className="tracking-wider mt-6 rounded-xl text-center text-black">
            <h3 className="leading-8 text-xl font-medium mb-2">
              Tips for quality recording:
            </h3>
            <ul className="text-small font-medium space-y-0 inline-block text-left p-0">
              <li className="flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-700 mr-2"></span>
                One speaker only
              </li>
              <li className="flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-700 mr-2"></span>
                Between 1 to 5 minutes
              </li>
              <li className="flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-700 mr-2"></span>
                No background noise
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceUploadPage;
