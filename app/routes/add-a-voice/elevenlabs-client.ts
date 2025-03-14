import axios, { type AxiosInstance } from "axios";
import FormData from "form-data";
import type { Voice } from "./add-voice";

class ElevenLabsClient {
  private api: AxiosInstance;

  constructor() {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not set");
    }

    this.api = axios.create({
      baseURL: "https://api.elevenlabs.io/v1",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
    });
  }

  async createClone(voiceSamples: Voice): Promise<string> {
    const formData = new FormData();
    formData.append("name", voiceSamples.uniqueVoiceName);
    formData.append("description", "Cloned voice");
    formData.append(
      "voice_settings",
      JSON.stringify({ stability: 0.75, similarity_boost: 0.75 })
    );

    // Fetch audio files from Firebase Storage URLs
    for (const [index, voiceSample] of voiceSamples.uploadedFiles.entries()) {
      const response = await axios.get(voiceSample.downloadUrl, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(response.data);

      formData.append("files", buffer, {
        filename: `sample_${index}.mp3`,
        contentType: "audio/mpeg",
      });
    }

    try {
      const response = await this.api.post("/voices/add", formData, {
        headers: formData.getHeaders(),
      });
      return response.data.voiceId; // Assumes the API returns voiceId
    } catch (error) {
      console.error("Error creating voice clone:", error);
      throw error;
    }
  }

  /**
   * Deletes a voice by its ID
   * @param voiceId The ID of the voice to delete
   */
  async deleteVoice(voiceId: string): Promise<void> {
    try {
      await this.api.delete(`/voices/${voiceId}`);
    } catch (error) {
      console.error("Error deleting voice:", error);
      throw error;
    }
  }

  /**
   * Generates text-to-speech audio using a specified voice
   * @param text The text to convert to speech
   * @param voiceId The ID of the voice to use
   * @returns Buffer containing the generated audio
   */
  async generateTTS(text: string, voiceId: string): Promise<Buffer> {
    try {
      const response = await this.api.post(
        `/text-to-speech/${voiceId}`,
        {
          text,
          // Optional: Add model_id, voice_settings, etc., as needed
        },
        {
          responseType: "arraybuffer",
        }
      );
      return Buffer.from(response.data);
    } catch (error) {
      console.error("Error generating TTS:", error);
      throw error;
    }
  }
}

export default ElevenLabsClient;
