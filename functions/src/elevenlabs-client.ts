import { ElevenLabsClient } from "elevenlabs";
import axios from "axios";
import { Readable } from "stream";

export interface VoiceSample {
  fileName: string;
  downloadUrl: string;
  contentType: string;
}

export interface VoiceToClone {
  voiceName: string;
  samples: VoiceSample[];
}

class ElevenLabsSDK {
  private client: ElevenLabsClient;

  constructor() {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not set");
    }

    this.client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }

  async createClone(voiceToClone: VoiceToClone): Promise<string> {
    // Fetch audio files from URLs and convert to Buffers
    const files = await Promise.all(
      voiceToClone.samples.map(async (sample) => {
        const response = await axios.get(sample.downloadUrl, {
          responseType: "arraybuffer",
        });
        return new Blob([response.data], { type: sample.contentType });
      })
    );

    const voice = await this.client.voices.add({
      name: voiceToClone.voiceName,
      files,
    });

    return voice.voice_id;
  }

  async getVoice(voiceId: string) {
    return await this.client.voices.get(voiceId);
  }

  async deleteVoice(voiceId: string): Promise<void> {
    await this.client.voices.delete(voiceId);
  }

  async generateTTS(text: string, voiceId: string): Promise<Buffer> {
    const audio = await this.client.textToSpeech.convert(voiceId, {
      text,
      // MP3 with 192kbps bitrate requires you to be subscribed to Creator tier
      // or above. PCM with 44.1kHz sample rate requires you to be subscribed
      // to Pro tier or above.
      output_format: "mp3_44100_128",
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.75,
      },
    });

    // Convert Readable stream to Buffer
    const buffer = await this.streamToBuffer(audio);

    return buffer;
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}

export default ElevenLabsSDK;
