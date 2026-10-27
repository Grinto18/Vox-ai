import fs from 'fs';
import path from 'path';
import { Scene, SubtitleCue, AspectRatio } from '../types.js';

function formatSrtTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 1000);

  return (
    String(hours).padStart(2, '0') +
    ':' +
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0') +
    ',' +
    String(milliseconds).padStart(3, '0')
  );
}

function formatAssTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((totalSeconds % 1) * 100);

  return (
    String(hours).padStart(1, '0') +
    ':' +
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0') +
    '.' +
    String(centiseconds).padStart(2, '0')
  );
}

/**
 * Builds subtitle cues from scenes
 */
export function buildSubtitleCues(scenes: Scene[]): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  let currentSec = 0;
  let cueIdx = 1;

  for (const scene of scenes) {
    const sceneStart = currentSec;
    const sceneDuration = scene.durationSeconds;
    const text = scene.narrationSegment.trim();

    // Split long narration into 1 or 2 readable sentences
    const sentences = text
      .split(/(?<=[.،؛؟])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length <= 1) {
      cues.push({
        index: cueIdx++,
        startSeconds: sceneStart,
        endSeconds: sceneStart + sceneDuration,
        startTime: formatSrtTime(sceneStart),
        endTime: formatSrtTime(sceneStart + sceneDuration),
        text: text,
      });
    } else {
      const partDuration = sceneDuration / sentences.length;
      sentences.forEach((part, idx) => {
        const start = sceneStart + idx * partDuration;
        const end = start + partDuration;
        cues.push({
          index: cueIdx++,
          startSeconds: start,
          endSeconds: end,
          startTime: formatSrtTime(start),
          endTime: formatSrtTime(end),
          text: part,
        });
      });
    }

    currentSec += sceneDuration;
  }

  return cues;
}

/**
 * Generates SRT file on disk
 */
export function writeSrtFile(cues: SubtitleCue[], outputPath: string): string {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const srtContent = cues
    .map((c) => `${c.index}\n${c.startTime} --> ${c.endTime}\n${c.text}\n`)
    .join('\n');

  fs.writeFileSync(outputPath, srtContent, 'utf-8');
  return outputPath;
}

/**
 * Generates styled ASS subtitle file for FFmpeg with Arabic font styling
 */
export function writeAssFile(
  cues: SubtitleCue[],
  outputPath: string,
  aspectRatio: AspectRatio
): string {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const resX = aspectRatio === '9:16' ? 1080 : 1920;
  const resY = aspectRatio === '9:16' ? 1920 : 1080;
  const fontSize = aspectRatio === '9:16' ? 42 : 36;
  const marginV = aspectRatio === '9:16' ? 240 : 120;

  // ASS Header with Arabic-compatible Noto Sans Arabic Bold
  let ass = `[Script Info]
Title: VOX AI STUDIO Arabic Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: ${resX}
PlayResY: ${resY}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: VoxDocumentary,Noto Sans Arabic,${fontSize},&H00F7F3EA,&H000000FF,&H00171717,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  for (const c of cues) {
    const start = formatAssTime(c.startSeconds);
    const end = formatAssTime(c.endSeconds);
    const text = c.text.replace(/\n/g, '\\N');
    ass += `Dialogue: 0,${start},${end},VoxDocumentary,,0,0,0,,${text}\n`;
  }

  fs.writeFileSync(outputPath, ass, 'utf-8');
  return outputPath;
}
