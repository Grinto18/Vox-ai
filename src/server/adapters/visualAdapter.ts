import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { Scene, VisualStyle, AspectRatio } from '../types.js';

const execFileAsync = promisify(execFile);

export interface VisualResult {
  sceneNumber: number;
  imagePath: string;
  width: number;
  height: number;
}

/**
 * Escapes text for SVG XML
 */
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Helper to download an image from a URL with redirects
 */
async function downloadImageFile(url: string, destPath: string, timeoutMs: number = 7000): Promise<boolean> {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;

    const timer = setTimeout(() => {
      resolve(false);
    }, timeoutMs);

    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'VoxAIStudio/1.0 (https://voxstudio.app; contact@voxstudio.app)',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          clearTimeout(timer);
          return downloadImageFile(res.headers.location, destPath, timeoutMs).then(resolve);
        }

        if (res.statusCode !== 200) {
          clearTimeout(timer);
          resolve(false);
          return;
        }

        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          clearTimeout(timer);
          fileStream.close();
          const stat = fs.existsSync(destPath) ? fs.statSync(destPath) : null;
          resolve(Boolean(stat && stat.size > 2000));
        });

        fileStream.on('error', () => {
          clearTimeout(timer);
          resolve(false);
        });
      }
    );

    req.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });

    req.end();
  });
}

/**
 * Search Wikimedia Commons for real historical & documentary images
 */
async function searchWikimediaPhoto(query: string, destPath: string): Promise<boolean> {
  try {
    const cleanQuery = query.replace(/[^\w\s\u0600-\u06FF]/gi, ' ').trim().slice(0, 80);
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      cleanQuery
    )}&gsrnamespace=6&gsrlimit=4&prop=imageinfo&iiprop=url|mime&format=json`;

    const jsonStr = await new Promise<string>((resolve) => {
      https
        .get(
          apiUrl,
          {
            headers: {
              'User-Agent': 'VoxAIStudio/1.0 (https://voxstudio.app; contact@voxstudio.app)',
            },
          },
          (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => resolve(data));
          }
        )
        .on('error', () => resolve(''));
    });

    if (!jsonStr) return false;

    const data = JSON.parse(jsonStr);
    const pages = data.query?.pages ? Object.values(data.query.pages) : [];
    for (const p of pages as any[]) {
      const url = p.imageinfo?.[0]?.url;
      if (url && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png'))) {
        const ok = await downloadImageFile(url, destPath);
        if (ok) return true;
      }
    }
  } catch {
    // Fall through
  }
  return false;
}

/**
 * Tries downloading real scene photo using Pollinations AI generator, then Wikimedia Commons
 */
async function acquireScenePhoto(
  scene: Scene,
  topicTitle: string,
  destPath: string,
  width: number,
  height: number
): Promise<boolean> {
  // 1. Try Pollinations AI image generator using the scene prompt
  try {
    const promptKeywords = `${scene.generationPrompt || topicTitle}, documentary vintage photograph, cinematic lighting, archival photo 8k`;
    const cleanPrompt = encodeURIComponent(promptKeywords.slice(0, 160));
    const pollUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&nologo=true`;
    const success = await downloadImageFile(pollUrl, destPath, 8000);
    if (success) return true;
  } catch {
    // Fall through
  }

  // 2. Try Wikimedia Commons search with topic and scene title
  try {
    const searchQuery = `${topicTitle} ${scene.onScreenTitle}`;
    const success = await searchWikimediaPhoto(searchQuery, destPath);
    if (success) return true;
  } catch {
    // Fall through
  }

  // 3. Try English keyword fallback from topic
  try {
    const fallbackQuery = scene.generationPrompt ? scene.generationPrompt.split(',')[0] : topicTitle;
    const success = await searchWikimediaPhoto(fallbackQuery, destPath);
    if (success) return true;
  } catch {
    // Fall through
  }

  return false;
}

/**
 * Creates SVG documentary overlay with vignette and Arabic lower-third card
 */
function createEditorialOverlaySvg(
  scene: Scene,
  style: VisualStyle,
  width: number,
  height: number,
  topicTitle: string
): string {
  const charcoal = '#171717';
  const antiqueGold = '#C6A15B';
  const ivory = '#F7F3EA';
  const mutedGray = '#A8A49C';

  const sceneNumStr = String(scene.sceneNumber).padStart(2, '0');
  const safeTitle = escapeXml(scene.onScreenTitle || `المشهد ${sceneNumStr}`);
  const safeTopic = escapeXml(topicTitle);
  const safeDesc = escapeXml(
    scene.visualDescription.length > 120
      ? scene.visualDescription.substring(0, 117) + '...'
      : scene.visualDescription
  );

  const cardY = height - 260;
  const cardW = width - 80;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <!-- Cinematic Vignette for contrast -->
    <linearGradient id="vignetteTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="vignetteBottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.95"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.9"/>
    </filter>
  </defs>

  <!-- Dark Top & Bottom Vignette Overlays -->
  <rect x="0" y="0" width="${width}" height="180" fill="url(#vignetteTop)"/>
  <rect x="0" y="${height - 380}" width="${width}" height="380" fill="url(#vignetteBottom)"/>

  <!-- Top Documentary Branding Header -->
  <g transform="translate(40, 50)">
    <rect width="120" height="32" rx="4" fill="${antiqueGold}"/>
    <text x="60" y="22" font-family="'Noto Sans Arabic', sans-serif" font-weight="900" font-size="14" fill="${charcoal}" text-anchor="middle">VOX STUDIO</text>
    
    <text x="${width - 80}" y="22" font-family="'Noto Sans Arabic', sans-serif" font-size="13" fill="${antiqueGold}" text-anchor="end" font-weight="bold">SCENE ${sceneNumStr} // ${scene.durationSeconds}s</text>
    
    <text x="${width / 2}" y="22" font-family="'Noto Sans Arabic', sans-serif" font-size="13" fill="${ivory}" text-anchor="middle" font-weight="600">${safeTopic}</text>
  </g>

  <!-- Lower-Third Editorial Title Card -->
  <g transform="translate(40, ${cardY})" filter="url(#shadow)">
    <!-- Main Card Body -->
    <rect width="${cardW}" height="190" rx="12" fill="#141413" fill-opacity="0.92" stroke="${antiqueGold}" stroke-width="2"/>
    <rect x="0" y="0" width="8" height="190" rx="4" fill="${antiqueGold}"/>

    <!-- Scene Number Pill -->
    <rect x="24" y="20" width="88" height="26" rx="4" fill="#252420" stroke="${antiqueGold}" stroke-width="1"/>
    <text x="68" y="38" font-family="'Noto Sans Arabic', sans-serif" font-size="12" font-weight="bold" fill="${antiqueGold}" text-anchor="middle">المشهد ${sceneNumStr}</text>

    <!-- Scene Arabic Headline -->
    <text x="${cardW - 24}" y="65" font-family="'Noto Sans Arabic', sans-serif" font-size="24" font-weight="bold" fill="${ivory}" text-anchor="end">${safeTitle}</text>

    <!-- Scene Visual Description -->
    <text x="${cardW - 24}" y="110" font-family="'Noto Sans Arabic', sans-serif" font-size="13" fill="${mutedGray}" text-anchor="end">${safeDesc}</text>
    
    <!-- Archival Metadata Tag -->
    <text x="24" y="165" font-family="'Noto Sans Arabic', sans-serif" font-size="11" fill="${antiqueGold}">DOCUMENTARY ARCHIVE // 4K HIGH FIDELITY</text>
  </g>
</svg>`;
}

/**
 * Creates high-quality procedural documentary background if no external image was obtained
 */
async function generateProceduralBackdrop(
  destPath: string,
  width: number,
  height: number,
  sceneNumber: number
): Promise<void> {
  const hues = [
    'color=c=#1A1815:s=' + width + 'x' + height,
    'color=c=#14181B:s=' + width + 'x' + height,
    'color=c=#1E1715:s=' + width + 'x' + height,
  ];
  const colorSpec = hues[(sceneNumber - 1) % hues.length];

  await execFileAsync('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', colorSpec,
    '-frames:v', '1',
    destPath,
  ]);
}

/**
 * Renders all scene visuals to disk as real, high-resolution photographic PNG images
 */
export async function renderSceneVisuals(
  scenes: Scene[],
  style: VisualStyle,
  aspectRatio: AspectRatio,
  topicTitle: string,
  outputDir: string
): Promise<VisualResult[]> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results: VisualResult[] = [];
  const width = aspectRatio === '9:16' ? 720 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : 720;

  for (const scene of scenes) {
    const sceneNum = scene.sceneNumber;
    const rawPhotoPath = path.join(outputDir, `raw_photo_${sceneNum}.jpg`);
    const croppedPhotoPath = path.join(outputDir, `cropped_photo_${sceneNum}.png`);
    const overlaySvgPath = path.join(outputDir, `overlay_${sceneNum}.svg`);
    const finalPngPath = path.join(outputDir, `scene_${sceneNum}.png`);

    // 1. Acquire real photograph or AI visual
    const hasPhoto = await acquireScenePhoto(scene, topicTitle, rawPhotoPath, width, height);

    if (hasPhoto && fs.existsSync(rawPhotoPath) && fs.statSync(rawPhotoPath).size > 2000) {
      // Scale and crop to target aspect ratio
      await execFileAsync('ffmpeg', [
        '-y',
        '-i', rawPhotoPath,
        '-vf', `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
        croppedPhotoPath,
      ]);
    } else {
      // Create procedural documentary canvas
      await generateProceduralBackdrop(croppedPhotoPath, width, height, sceneNum);
    }

    // 2. Generate Vox editorial overlay SVG
    const svgContent = createEditorialOverlaySvg(scene, style, width, height, topicTitle);
    fs.writeFileSync(overlaySvgPath, svgContent, 'utf-8');

    // 3. Composite photo + overlay using FFmpeg
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', croppedPhotoPath,
      '-i', overlaySvgPath,
      '-filter_complex', '[0:v][1:v]overlay=0:0',
      finalPngPath,
    ]);

    // 4. Verify output file exists and is valid
    if (!fs.existsSync(finalPngPath) || fs.statSync(finalPngPath).size < 1000) {
      throw new Error(`فشل إنشاء الإطار البصري للمشهد رقم ${sceneNum}`);
    }

    scene.visualAssetPath = finalPngPath;
    results.push({
      sceneNumber: sceneNum,
      imagePath: finalPngPath,
      width,
      height,
    });
  }

  return results;
}
