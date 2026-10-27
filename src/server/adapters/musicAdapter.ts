import fs from 'fs';
import path from 'path';

/**
 * Generates an atmospheric documentary ambient soundtrack (warm evolving drone with acoustic depth)
 * Returns path to a pristine 44.1kHz stereo WAV file
 */
export async function generateDocumentaryMusicTrack(
  durationSeconds: number,
  outputFilePath: string,
  styleName: string = 'ambient_documentary'
): Promise<string> {
  const dir = path.dirname(outputFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sampleRate = 44100;
  const numChannels = 2; // Stereo
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Chord progression frequencies (D minor documentary aesthetic: D2=73.4Hz, A2=110Hz, F3=174.6Hz, C3=130.8Hz)
  const baseFreq1 = 73.42;
  const fifthFreq = 110.0;
  const minorThird = 174.61;
  const ninthFreq = 164.81;

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Fade-in in first 2 seconds, fade-out in last 3 seconds
    let masterEnv = 1.0;
    if (t < 2.0) masterEnv = t / 2.0;
    else if (t > durationSeconds - 3.0) masterEnv = Math.max(0, (durationSeconds - t) / 3.0);

    // Slow organic LFOs for warm atmospheric movement
    const lfo1 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.12 * t);
    const lfo2 = 0.5 + 0.5 * Math.cos(2 * Math.PI * 0.08 * t);

    // Left channel mix
    const leftWave =
      Math.sin(2 * Math.PI * baseFreq1 * t) * 0.4 +
      Math.sin(2 * Math.PI * fifthFreq * t + 0.2) * 0.3 * lfo1 +
      Math.sin(2 * Math.PI * minorThird * t + 0.5) * 0.2 * lfo2;

    // Right channel mix (subtle stereo width phase difference)
    const rightWave =
      Math.sin(2 * Math.PI * baseFreq1 * t + 0.1) * 0.4 +
      Math.sin(2 * Math.PI * fifthFreq * t + 0.4) * 0.3 * lfo2 +
      Math.sin(2 * Math.PI * ninthFreq * t + 0.8) * 0.2 * lfo1;

    const leftVal = Math.floor(leftWave * masterEnv * 9000);
    const rightVal = Math.floor(rightWave * masterEnv * 9000);

    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, leftVal)), offset);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, rightVal)), offset + 2);
    offset += 4;
  }

  fs.writeFileSync(outputFilePath, buffer);
  return outputFilePath;
}
