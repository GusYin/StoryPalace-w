import React, { useState, useRef, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "~/firebase/firebase";
import { DeleteIcon } from "~/components/icons/delete-icon";
import { UploadIcon } from "~/components/icons/upload-icon";

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
  const [timer, setTimer] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [samples, setSamples] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);

  // Timer effect
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
                  <div className="text-sm font-medium">Default - AirPods</div>
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
                  <svg
                    className="mx-auto h-8 w-8"
                    width="26"
                    height="25"
                    viewBox="0 0 26 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.36945 25C2.48663 25 1.73088 24.6857 1.1022 24.057C0.473519 23.4283 0.15918 22.6726 0.15918 21.7897V18.5795C0.15918 18.1247 0.313005 17.7434 0.620656 17.4358C0.928308 17.1281 1.30953 16.9743 1.76432 16.9743C2.2191 16.9743 2.60032 17.1281 2.90798 17.4358C3.21563 17.7434 3.36945 18.1247 3.36945 18.5795V21.7897H22.6311V18.5795C22.6311 18.1247 22.7849 17.7434 23.0926 17.4358C23.4002 17.1281 23.7814 16.9743 24.2362 16.9743C24.691 16.9743 25.0722 17.1281 25.3799 17.4358C25.6875 17.7434 25.8414 18.1247 25.8414 18.5795V21.7897C25.8414 22.6726 25.527 23.4283 24.8983 24.057C24.2697 24.6857 23.5139 25 22.6311 25H3.36945ZM11.3951 5.49759L8.3855 8.50722C8.06448 8.82825 7.68326 8.98208 7.24184 8.9687C6.80043 8.95532 6.41921 8.78812 6.09818 8.46709C5.80391 8.14607 5.65008 7.77154 5.63671 7.3435C5.62333 6.91546 5.77716 6.54093 6.09818 6.2199L11.8767 0.441413C12.0372 0.280899 12.2111 0.167202 12.3983 0.100321C12.5856 0.0334403 12.7863 0 13.0003 0C13.2143 0 13.4149 0.0334403 13.6022 0.100321C13.7895 0.167202 13.9634 0.280899 14.1239 0.441413L19.9024 6.2199C20.2234 6.54093 20.3772 6.91546 20.3638 7.3435C20.3505 7.77154 20.1966 8.14607 19.9024 8.46709C19.5813 8.78812 19.2001 8.95532 18.7587 8.9687C18.3173 8.98208 17.9361 8.82825 17.615 8.50722L14.6054 5.49759V16.9743C14.6054 17.4291 14.4516 17.8103 14.1439 18.118C13.8363 18.4256 13.4551 18.5795 13.0003 18.5795C12.5455 18.5795 12.1643 18.4256 11.8566 18.118C11.549 17.8103 11.3951 17.4291 11.3951 16.9743V5.49759Z"
                      fill="black"
                    />
                  </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#5f6368"
                    >
                      <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" />
                    </svg>
                    Record audio
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recording preview section */}
          {audioBlob && (
            <div className="space-y-4 mt-3">
              <audio
                controls
                src={URL.createObjectURL(audioBlob)}
                className="w-full"
              />
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
            <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
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
              <li className="text-gray-700 flex items-center">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-700 mr-2"></span>
                Between 1 to 5 minutes
              </li>
              <li className="text-gray-700 flex items-center">
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
