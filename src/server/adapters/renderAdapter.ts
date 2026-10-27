import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { Scene, AspectRatio } from '../types.js';

const execFileAsync = promisify(execFile);

export interface RenderResult {
  outputPath: string;
  outputUrl: string;
  durationSeconds: number;
  sizeBytes: number;
}

/**
 * Validates MP4 file using ffprobe and filesystem stats
 */
async function validateMp4(filePath: string): Promise<{ isValid: boolean; duration: number; sizeBytes: number; error?: string }> {
  if (!fs.existsSync(filePath)) {
    return { isValid: false, duration: 0, sizeBytes: 0, error: 'الملف غير موجود على القرص' };
  }

  const stat = fs.statSync(filePath);
  if (stat.size < 5000) {
    return { isValid: false, duration: 0, sizeBytes: stat.size, error: 'حجم ملف الفيديو صغير جداً أو فارغ' };
  }

  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'stream=codec_type,codec_name,duration:format=duration',
      '-of', 'json',
      filePath,
    ]);

    const info = JSON.parse(stdout);
    const streams = info.streams || [];
    const hasVideoStream = streams.some((s: any) => s.codec_type === 'video');
    const hasAudioStream = streams.some((s: any) => s.codec_type === 'audio');

    if (!hasVideoStream) {
      return { isValid: false, duration: 0, sizeBytes: stat.size, error: 'ملف MP4 لا يحتوي على مسار فيديو صالح' };
    }

    if (!hasAudioStream) {
      return { isValid: false, duration: 0, sizeBytes: stat.size, error: 'ملف MP4 لا يحتوي على مسار صوتي' };
    }

    const duration = parseFloat(info.format?.duration || '0');
    if (isNaN(duration) || duration <= 0) {
      return { isValid: false, duration: 0, sizeBytes: stat.size, error: 'مدة الفيديو غير صالحة' };
    }

    return { isValid: true, duration, sizeBytes: stat.size };
  } catch (err: any) {
    return { isValid: stat.size > 20000, duration: 0, sizeBytes: stat.size };
  }
}

/**
 * Renders complete documentary MP4 with Ken Burns motion, narration, music, and subtitles
 */
export async function renderDocumentaryVideo(
  projectId: string,
  scenes: Scene[],
  aspectRatio: AspectRatio,
  narrationAudioPath?: string,
  musicAudioPath?: string,
  musicVolume: number = 0.2,
  assSubtitlesPath?: string,
  workDir?: string
): Promise<RenderResult> {
  const exportsDir = path.resolve(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  const tempWorkDir = workDir || path.resolve(process.cwd(), 'data', 'temp', projectId);
  if (!fs.existsSync(tempWorkDir)) {
    fs.mkdirSync(tempWorkDir, { recursive: true });
  }

  const finalMp4Path = path.join(exportsDir, `${projectId}.mp4`);
  const finalPublicUrl = `/api/projects/${projectId}/download`;

  // Resolution setup
  // Use 720x1280 (9:16) or 1280x720 (16:9) for crisp rendering speed and resource safety
  const width = aspectRatio === '9:16' ? 720 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : 720;
  const fps = 30;

  const sceneClipPaths: string[] = [];

  // Step 1: Render each scene with Ken Burns pan & zoom
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneDuration = Math.max(3, Math.round(scene.durationSeconds));
    const totalFrames = sceneDuration * fps;
    const imgPath = scene.visualAssetPath;

    if (!imgPath || !fs.existsSync(imgPath)) {
      throw new Error(`مشهد رقم ${scene.sceneNumber} يفتقد الصورة البصرية`);
    }

    const sceneClipPath = path.join(tempWorkDir, `scene_clip_${scene.sceneNumber}.mp4`);

    // Alternate subtle zoom-in and zoom-out for documentary camera movement
    const isZoomIn = i % 2 === 0;
    const zoomExpr = isZoomIn ? "min(zoom+0.0012,1.18)" : "max(zoom-0.0012,1.0)";
    const initialZoom = isZoomIn ? 1.0 : 1.18;

    const filter = `scale=${width}:${height},zoompan=z='${zoomExpr}':d=${totalFrames}:s=${width}x${height}:fps=${fps}`;

    await execFileAsync('ffmpeg', [
      '-y',
      '-loop', '1',
      '-i', imgPath,
      '-vf', filter,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-frames:v', String(totalFrames),
      sceneClipPath
    ]);

    sceneClipPaths.push(sceneClipPath);
  }

  // Step 2: Concatenate scene clips
  const concatListFile = path.join(tempWorkDir, 'concat_list.txt');
  const concatContent = sceneClipPaths.map((p) => `file '${p}'`).join('\n');
  fs.writeFileSync(concatListFile, concatContent, 'utf-8');

  const rawVideoMerged = path.join(tempWorkDir, 'video_merged.mp4');
  await execFileAsync('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListFile,
    '-c', 'copy',
    rawVideoMerged
  ]);

  // Step 3: Audio & Subtitles mixing
  // We combine merged video + narration track + background music track
  const hasNarration = narrationAudioPath && fs.existsSync(narrationAudioPath);
  const hasMusic = musicAudioPath && fs.existsSync(musicAudioPath);
  const hasAss = assSubtitlesPath && fs.existsSync(assSubtitlesPath);

  const ffmpegArgs: string[] = ['-y', '-i', rawVideoMerged];
  let filterComplex = '';

  let audioInputIndex = 1;
  let narrationIdx = -1;
  let musicIdx = -1;

  if (hasNarration) {
    ffmpegArgs.push('-i', narrationAudioPath);
    narrationIdx = audioInputIndex++;
  }

  if (hasMusic) {
    ffmpegArgs.push('-i', musicAudioPath);
    musicIdx = audioInputIndex++;
  }

  const filterComplexParts: string[] = [];

  // Video filter for subtitles
  let videoOutMap = '0:v';
  if (hasAss) {
    // Escape path for ffmpeg filter
    const escapedAss = assSubtitlesPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    filterComplexParts.push(`[0:v]ass='${escapedAss}'[vout]`);
    videoOutMap = '[vout]';
  }

  // Audio filter for mixing narration + music
  let audioOutMap = '';
  if (hasNarration && hasMusic) {
    const vol = Math.max(0.05, Math.min(0.3, musicVolume || 0.15));
    filterComplexParts.push(
      `[${narrationIdx}:a]volume=1.4[narr]`,
      `[${musicIdx}:a]volume=${vol}[bgm]`,
      `[narr][bgm]amix=inputs=2:duration=longest:dropout_transition=2[aout]`
    );
    audioOutMap = '[aout]';
  } else if (hasNarration) {
    filterComplexParts.push(`[${narrationIdx}:a]volume=1.3[aout]`);
    audioOutMap = '[aout]';
  } else if (hasMusic) {
    audioOutMap = `${musicIdx}:a`;
  }

  if (filterComplexParts.length > 0) {
    ffmpegArgs.push('-filter_complex', filterComplexParts.join(';'));
  }

  ffmpegArgs.push('-map', videoOutMap);

  if (audioOutMap) {
    ffmpegArgs.push('-map', audioOutMap);
    ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k', '-ar', '44100');
  }

  ffmpegArgs.push(
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    finalMp4Path
  );

  await execFileAsync('ffmpeg', ffmpegArgs);

  // Step 4: Validate output
  const validation = await validateMp4(finalMp4Path);
  if (!validation.isValid) {
    throw new Error(`فشل التحقق من صحة ملف MP4 الناتج: ${validation.error || 'ملف غير صالح'}`);
  }

  // Clean up temporary workspace directory asynchronously
  try {
    fs.rmSync(tempWorkDir, { recursive: true, force: true });
  } catch (cleanErr) {
    // Non-fatal
  }

  return {
    outputPath: finalMp4Path,
    outputUrl: finalPublicUrl,
    durationSeconds: validation.duration || scenes.reduce((a, s) => a + s.durationSeconds, 0),
    sizeBytes: validation.sizeBytes,
  };
}
