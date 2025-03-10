import axios, { AxiosInstance } from "axios";
import FormData from "form-data";

class ElevenLabsClient {
  private api: AxiosInstance;
  private apiKey: string;

  /** Initialize the client with the ElevenLabs API key from environment variables */
  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set");
    }
    this.apiKey = apiKey;
    if (!this.apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set");
    }
    this.api = axios.create({
      baseURL: "https://api.elevenlabs.io/v1",
      headers: {
        "xi-api-key": this.apiKey,
      },
    });
  }

  /**
   * Creates a voice clone using audio samples from provided URLs
   * @param sampleUrls Array of URLs pointing to audio samples in Firebase Storage
   * @param voiceName Name of the voice to create
   * @returns The voiceId of the newly created voice
   */
  async createClone(sampleUrls: string[], voiceName: string): Promise<string> {
    const formData = new FormData();
    formData.append("name", voiceName);
    formData.append("description", "Cloned voice");

    // Fetch audio files from Firebase Storage URLs
    for (const url of sampleUrls) {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data);
      formData.append("files", buffer, {
        filename: "sample.mp3",
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
