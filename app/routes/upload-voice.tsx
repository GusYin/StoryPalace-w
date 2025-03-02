import React, { useState, useRef, useEffect } from "react";
import { DeleteIcon } from "~/components/icons/delete-icon";
import { UploadIconLg } from "~/components/icons/upload-icon-lg";
import { MicrophoneIcon } from "~/components/icons/microphone-icon";
import localforage from "localforage";
import { PauseIcon } from "~/components/icons/pause-icon";
import { PlayIcon } from "~/components/icons/play-icon";

const STORAGE_KEY = "voiceUploads";

interface UploadedFile {
  id: string;
  name: string;
  duration: number;
  data: Blob;
  url: string;
}

const VoiceUploadPage = () => {
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [microphones, setMicrophones] = useState<MediaDeviceInfo[] | []>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");

  const [recording, setRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const handlePlayPause = (id: string, url: string) => {
    if (currentlyPlaying === id) {
      // Pause current audio
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      // Pause any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create new audio element and play
      const newAudio = new Audio(url);
      newAudio.play();
      newAudio.addEventListener("ended", () => setCurrentlyPlaying(null));

      audioRef.current = newAudio;
      setCurrentlyPlaying(id);
    }
  };

  // Load files from storage on mount
  useEffect(() => {
    localforage.getItem<UploadedFile[]>(STORAGE_KEY).then((storedFiles) => {
      if (storedFiles) {
        // Regenerate URLs for preview
        const filesWithUrls = storedFiles.map((file) => ({
          ...file,
          url: URL.createObjectURL(file.data),
        }));
        setUploadedFiles(filesWithUrls);
      }
    });
  }, []);

  // Save files to storage when they change
  useEffect(() => {
    const filesToStore = uploadedFiles.map(({ id, name, duration, data }) => ({
      id,
      name,
      duration,
      data,
    }));
    localforage.setItem(STORAGE_KEY, filesToStore);
  }, [uploadedFiles]);

  const formatDuration = (durationInSeconds: number) => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const getAudioDuration = (url: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = url;
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => reject(new Error("Could not load audio file"));
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("audio/") && file.size <= 10 * 1024 * 1024
    );

    if (files.length === 0) {
      setError("Please upload audio files (max 10MB each)");
      return;
    }

    try {
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          const url = URL.createObjectURL(file);
          const duration = await getAudioDuration(url);
          return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            duration,
            data: file,
            url,
          };
        })
      );
      setUploadedFiles((prev) => [...prev, ...processedFiles]);
    } catch (err) {
      setError("Failed to process audio files");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      (file) => file.type.startsWith("audio/") && file.size <= 10 * 1024 * 1024
    );

    if (files.length === 0) {
      setError("Please upload audio files (max 10MB each)");
      return;
    }

    try {
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          const url = URL.createObjectURL(file);
          const duration = await getAudioDuration(url);
          return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            duration,
            data: file,
            url,
          };
        })
      );
      setUploadedFiles((prev) => [...prev, ...processedFiles]);
    } catch (err) {
      setError("Failed to process audio files");
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((file) => file.id !== id);
      const removedFile = prev.find((file) => file.id === id);
      if (removedFile) URL.revokeObjectURL(removedFile.url);
      return newFiles;
    });
  };

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [uploadedFiles]);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items?.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Get initial devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const mics = devices.filter((d) => d.kind === "audioinput");
      setMicrophones(mics);
      if (mics.length > 0) setSelectedMic(mics[0].deviceId);
    });
  }, []);

  // Listen for device changes
  useEffect(() => {
    const handler = () => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const mics = devices.filter((d) => d.kind === "audioinput");
        setMicrophones(mics);
        if (!mics.some((m) => m.deviceId === selectedMic)) {
          setSelectedMic(mics[0]?.deviceId || "");
        }
      });
    };

    navigator.mediaDevices.addEventListener("devicechange", handler);
    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", handler);
  }, [selectedMic]);

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

  const startRecording = async () => {
    try {
      setRecordingTime(0);
      setError(null);

      // Use selected microphone constraints
      const constraints = {
        audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: "audio/wav" });
        audioChunks.current = []; // Clear chunks

        // Generate URL and get duration
        const url = URL.createObjectURL(blob);
        try {
          const duration = await getAudioDuration(url);
          const newFile: UploadedFile = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `Recording ${new Date().toLocaleString()}`,
            duration,
            data: blob,
            url,
          };
          setUploadedFiles((prev) => [...prev, newFile]);
        } catch (err) {
          setError("Failed to process recording");
        }

        // Cleanup media streams
        if (mediaRecorder.current?.stream) {
          mediaRecorder.current.stream
            .getTracks()
            .forEach((track) => track.stop());
        }
        setRecording(false);
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

                {selectedMic && (
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={`rounded-3xl bg-custom-teal px-8 py-3 font-medium text-white ${
                      recording
                        ? "bg-red-600 hover:bg-red-700"
                        : "hover:bg-green-700"
                    } transition-colors`}
                    disabled={microphones.length === 0}
                  >
                    {recording ? "⏹ Stop Recording" : "⏺ Start Recording"}
                  </button>
                )}
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

          {/* Uploaded files preview with play buttons */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-4 mt-3">
              {uploadedFiles.map((fileInfo) => (
                <div
                  key={fileInfo.id}
                  className="flex justify-between items-center p-3 bg-gray-100 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePlayPause(fileInfo.id, fileInfo.url)}
                      className="text-custom-teal hover:text-green-700"
                    >
                      {currentlyPlaying === fileInfo.id ? (
                        <PauseIcon />
                      ) : (
                        <PlayIcon />
                      )}
                    </button>
                    <span className="text-gray-700">{fileInfo.name}</span>
                    <span className="text-gray-500 text-sm">
                      {formatDuration(fileInfo.duration)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(fileInfo.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              ))}
              <p className="text-center text-gray-600 mt-4">
                Continue to add recordings for a better clone
              </p>
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
