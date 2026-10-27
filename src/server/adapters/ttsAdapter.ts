import fs from 'fs';
import path from 'path';
import https from 'https';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ai, hasGeminiKey } from '../gemini.js';
import { VoiceOption } from '../types.js';

const execFileAsync = promisify(execFile);

export interface TTSResult {
  audioPath: string;
  durationSeconds: number;
  isFallback: boolean;
  provider: 'elevenlabs' | 'gemini-3.8-flash-lite-tts' | 'synthesized_fallback';
}

/**
 * Measure audio duration precisely using ffprobe
 */
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) || duration <= 0 ? 0 : duration;
  } catch {
    const stat = fs.statSync(filePath);
    return Math.max(3, stat.size / 32000);
  }
}

/**
 * Generate audio via ElevenLabs API
 */
async function callElevenLabsTts(text: string, voiceName: string, tempOutPath: string): Promise<boolean> {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.TTS_API_KEY;
  if (!apiKey || (!apiKey.startsWith('sk_') && apiKey.length < 20)) return false;

  const voiceMap: Record<string, string> = {
    Fenrir: 'pNInz6obpgDQGcFmaJgB', // Adam
    Kore: '21m00Tcm4TlvDq8ikWAM',   // Rachel
    Puck: 'ErXwobaYiN019PkySvjV',   // Antoni
    Zephyr: 'JBFqnCBsd6RMkjVDRZzb', // George
  };
  const voiceId = voiceMap[voiceName] || 'pNInz6obpgDQGcFmaJgB';

  const payload = JSON.stringify({
    text: text.slice(0, 1500),
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.8,
    },
  });

  return new Promise<boolean>((resolve) => {
    const req = https.request(
      {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${voiceId}`,
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          resolve(false);
          return;
        }
        const fileStream = fs.createWriteStream(tempOutPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          const stat = fs.existsSync(tempOutPath) ? fs.statSync(tempOutPath) : null;
          resolve(Boolean(stat && stat.size > 2000));
        });
        fileStream.on('error', () => resolve(false));
      }
    );

    req.on('error', () => resolve(false));
    req.write(payload);
    req.end();
  });
}

/**
 * Generate WAV audio for Arabic narration
 */
export async function generateNarrationAudio(
  text: string,
  voice: VoiceOption = 'Fenrir',
  outputFilePath: string,
  targetDuration: number,
  isDemoMode: boolean = false
): Promise<TTSResult> {
  const dir = path.dirname(outputFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Try ElevenLabs first if key is present and not demo mode
  const elevenKey = process.env.ELEVENLABS_API_KEY || process.env.TTS_API_KEY;
  if (!isDemoMode && elevenKey && (elevenKey.startsWith('sk_') || elevenKey.length > 20)) {
    try {
      const tempMp3 = path.join(dir, 'eleven_raw.mp3');
      const ok = await callElevenLabsTts(text, voice, tempMp3);
      if (ok && fs.existsSync(tempMp3)) {
        // Convert to standard 44.1kHz mono WAV for pristine FFmpeg mixing
        await execFileAsync('ffmpeg', [
          '-y',
          '-i', tempMp3,
          '-ar', '44100',
          '-ac', '1',
          outputFilePath,
        ]);

        if (fs.existsSync(outputFilePath) && fs.statSync(outputFilePath).size > 2000) {
          const duration = await getAudioDuration(outputFilePath);
          return {
            audioPath: outputFilePath,
            durationSeconds: duration || targetDuration,
            isFallback: false,
            provider: 'elevenlabs',
          };
        }
      }
    } catch (err: any) {
      console.warn('ElevenLabs TTS failed, attempting Gemini TTS:', err?.message || err);
    }
  }

  // 2. Try Gemini TTS if key is present and not demo mode
  if (hasGeminiKey() && !isDemoMode) {
    try {
      const voiceName = voice === 'fallback' ? 'Fenrir' : voice;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style: 'Deep, authoritative Arabic documentary narrator, steady pacing, classical Arabic eloquence',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const rawWavBuffer = Buffer.from(base64Audio, 'base64');
        fs.writeFileSync(outputFilePath, rawWavBuffer);

        if (fs.existsSync(outputFilePath) && fs.statSync(outputFilePath).size > 1000) {
          const duration = await getAudioDuration(outputFilePath);
          return {
            audioPath: outputFilePath,
            durationSeconds: duration || targetDuration,
            isFallback: false,
            provider: 'gemini-3.8-flash-lite-tts',
          };
        }
      }
    } catch (err: any) {
      console.warn('Gemini TTS error:', err?.message || err);
    }
  }

  // 3. Fallback: If in production mode and user requested real generation, report error rather than silent failure
  if (!isDemoMode && !hasGeminiKey() && !elevenKey) {
    throw new Error('لم يتم تكوين أي مزود تعليق صوتي (Gemini API أو ElevenLabs API)');
  }

  // 4. Demo Mode / Audible Synth fallback
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * targetDuration);
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sentenceEnv = Math.sin(t * 1.5) > -0.2 ? Math.abs(Math.sin(t * 2.5)) : 0.05;
    const fundamental = Math.sin(2 * Math.PI * 150 * t) * 0.35;
    const harmonic = Math.sin(2 * Math.PI * 300 * t) * 0.15;
    const sampleVal = Math.floor((fundamental + harmonic) * sentenceEnv * 9000);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, sampleVal)), offset);
    offset += 2;
  }

  fs.writeFileSync(outputFilePath, buffer);

  return {
    audioPath: outputFilePath,
    durationSeconds: targetDuration,
    isFallback: true,
    provider: 'synthesized_fallback',
  };
}
