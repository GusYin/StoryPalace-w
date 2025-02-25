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

  // Get voice samples on mount
  useEffect(() => {
    fetchSamples();
  }, []);

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
    <div className="voice-upload-container">
      <h1>Voice Samples</h1>

      <div
        ref={dropRef}
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="drop-content">
          <p>Drag and drop audio files here</p>
          <span>or</span>
          <input
            type="file"
            accept="audio/mp3,audio/wav,audio/m4a"
            onChange={handleFileUpload}
            disabled={uploadProgress !== null}
          />
        </div>
      </div>

      <div className="recording-section">
        <h2>Record Audio</h2>
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={uploadProgress !== null}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>

        {audioBlob && (
          <div className="recording-preview">
            <audio controls src={URL.createObjectURL(audioBlob)} />
            <button onClick={handleRecordUpload}>Upload Recording</button>
            <button onClick={() => setAudioBlob(null)}>Discard</button>
          </div>
        )}
      </div>

      {uploadProgress !== null && (
        <div className="progress-bar">
          <progress value={uploadProgress} max="100" />
          <span>{uploadProgress}%</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="samples-list">
        <h2>Your Voice Samples</h2>
        {samples.length === 0 ? (
          <p>No samples uploaded yet</p>
        ) : (
          <ul>
            {samples.map((sample) => (
              <li key={sample.id}>
                <audio controls src={sample.downloadUrl} />
                <div>
                  <span>Status: {sample.status}</span>
                  {sample.duration && <span>Duration: {sample.duration}s</span>}
                  <span>
                    Uploaded: {new Date(sample.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VoiceUploadPage;
