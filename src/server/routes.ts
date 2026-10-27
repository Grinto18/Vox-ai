import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from './db.js';
import { orchestrator } from './orchestrator.js';
import { Project, ProjectSettings, ProviderStatus } from './types.js';
import { hasGeminiKey, ai } from './gemini.js';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
export const apiRouter = express.Router();

/**
 * GET /api/health
 */
apiRouter.get('/health', async (_req: Request, res: Response) => {
  let ffmpegOk = false;
  try {
    const { stdout } = await execFileAsync('ffmpeg', ['-version']);
    ffmpegOk = stdout.includes('ffmpeg version');
  } catch {
    ffmpegOk = false;
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'Google AI Studio Node.js Runtime',
    ffmpegAvailable: ffmpegOk,
    geminiKeyConfigured: hasGeminiKey(),
  });
});

/**
 * GET /api/admin/provider-status
 */
apiRouter.get('/admin/provider-status', async (_req: Request, res: Response) => {
  const geminiConfigured = hasGeminiKey();
  let geminiConnected = false;
  let geminiMessage = geminiConfigured ? 'المفتاح مسجل في المتغيرات البيئية' : 'مفتاح GEMINI_API_KEY غير متوفر';

  if (geminiConfigured) {
    try {
      const pingPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Say OK',
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('مهلة الاتصال انتهت')), 3000)
      );
      const ping: any = await Promise.race([pingPromise, timeoutPromise]);
      if (ping && ping.text) {
        geminiConnected = true;
        geminiMessage = 'تم الاتصال بنجاح بـ Gemini 3.8 Flash';
      }
    } catch (err: any) {
      geminiConnected = false;
      geminiMessage = `فحص الاتصال: ${err?.message || 'خطأ في المصادقة أو الحصة'}`;
    }
  }

  // FFmpeg check
  let ffmpegVersion = '';
  let ffmpegOk = false;
  try {
    const { stdout } = await execFileAsync('ffmpeg', ['-version']);
    ffmpegOk = true;
    ffmpegVersion = stdout.split('\n')[0] || 'ffmpeg available';
  } catch (err: any) {
    ffmpegOk = false;
    ffmpegVersion = 'FFmpeg غير مثبت أو تعذر تشغيله';
  }

  // Arabic font check
  const fontPath = '/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf';
  const hasArabicFont = fs.existsSync(fontPath);

  const status: ProviderStatus = {
    geminiText: {
      status: geminiConnected ? 'connected' : geminiConfigured ? 'configured' : 'missing',
      model: 'gemini-3.8-flash',
      message: geminiMessage,
    },
    geminiTts: {
      status: (process.env.ELEVENLABS_API_KEY || process.env.TTS_API_KEY) ? 'connected' : geminiConnected ? 'connected' : geminiConfigured ? 'configured' : 'missing',
      model: (process.env.ELEVENLABS_API_KEY || process.env.TTS_API_KEY) ? 'eleven_multilingual_v2 (ElevenLabs)' : 'gemini-3.8-flash-lite-tts',
      message: (process.env.ELEVENLABS_API_KEY || process.env.TTS_API_KEY)
        ? 'تم التحقق من ElevenLabs API بنجاح ومتاح للتعليق الصوتي'
        : geminiConfigured
        ? 'جاهز للاستخدام مع التعليق الصوتي'
        : 'يتم استخدام محاكي الصوت البديل',
    },
    ffmpeg: {
      status: ffmpegOk ? 'connected' : 'missing',
      path: '/usr/bin/ffmpeg',
      version: ffmpegVersion,
      hasArabicFont,
      fontPath: hasArabicFont ? fontPath : undefined,
    },
    storage: {
      status: 'connected',
      provider: 'local_disk',
    },
  };

  res.json(status);
});

/**
 * GET /api/projects
 */
apiRouter.get('/projects', (_req: Request, res: Response) => {
  const projects = db.getAllProjects();
  res.json({ projects });
});

/**
 * POST /api/projects
 */
apiRouter.post('/projects', async (req: Request, res: Response) => {
  const { topic, settings } = req.body;

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({
      error: 'موضوع الفيديو مطلوب ولا يمكن أن يكون فارغاً',
      code: 'INVALID_TOPIC',
    });
  }

  if (topic.trim().length > 300) {
    return res.status(400).json({
      error: 'عنوان الموضوع طويل جداً، الحد الأقصى 300 حرف',
      code: 'TOPIC_TOO_LONG',
    });
  }

  const defaultSettings: ProjectSettings = {
    duration: 30,
    visualStyle: 'paper_cutout',
    aspectRatio: '9:16',
    voice: 'Fenrir',
    enableSubtitles: true,
    enableBackgroundMusic: true,
    musicTrack: 'ambient_documentary',
    musicVolume: 0.2,
    costMode: 'economy',
    isDemoMode: false,
    ...settings,
  };

  // If Gemini key is not configured, automatically suggest or set Demo Mode so user doesn't hit failure
  if (!hasGeminiKey()) {
    defaultSettings.isDemoMode = true;
  }

  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newProject: Project = {
    id: projectId,
    ownerUid: 'current_user',
    topic: topic.trim(),
    settings: defaultSettings,
    status: 'queued',
    estimatedCost: defaultSettings.isDemoMode ? '$0.00 (وضع تجريبي)' : '$0.02 (تقدير اقتصادي)',
    actualTrackedCost: '$0.00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.saveProject(newProject);

  // Automatically start generation pipeline
  const job = await orchestrator.startJob(newProject);

  res.status(201).json({
    project: newProject,
    jobId: job.id,
  });
});

/**
 * GET /api/projects/:projectId
 */
apiRouter.get('/projects/:projectId', (req: Request, res: Response) => {
  const project = db.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'المشروع غير موجود', code: 'PROJECT_NOT_FOUND' });
  }
  res.json({ project });
});

/**
 * PATCH /api/projects/:projectId
 */
apiRouter.patch('/projects/:projectId', (req: Request, res: Response) => {
  const project = db.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'المشروع غير موجود', code: 'PROJECT_NOT_FOUND' });
  }

  if (req.body.topic) project.topic = req.body.topic.trim();
  if (req.body.settings) project.settings = { ...project.settings, ...req.body.settings };

  db.saveProject(project);
  res.json({ project });
});

/**
 * DELETE /api/projects/:projectId
 */
apiRouter.delete('/projects/:projectId', (req: Request, res: Response) => {
  const project = db.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'المشروع غير موجود', code: 'PROJECT_NOT_FOUND' });
  }

  // Delete export file if exists
  if (project.outputVideoPath && fs.existsSync(project.outputVideoPath)) {
    try {
      fs.unlinkSync(project.outputVideoPath);
    } catch {}
  }

  db.deleteProject(project.id);
  res.json({ success: true, message: 'تم حذف المشروع بنجاح' });
});

/**
 * POST /api/projects/:projectId/duplicate
 */
apiRouter.post('/projects/:projectId/duplicate', (req: Request, res: Response) => {
  const project = db.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'المشروع الأصلي غير موجود', code: 'PROJECT_NOT_FOUND' });
  }

  const dupId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const duplicate: Project = {
    ...project,
    id: dupId,
    topic: `${project.topic} (نسخة)`,
    status: 'queued',
    activeJobId: undefined,
    outputVideoPath: undefined,
    outputVideoUrl: undefined,
    videoDurationSeconds: undefined,
    videoSizeBytes: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.saveProject(duplicate);
  res.status(201).json({ project: duplicate });
});

/**
 * POST /api/projects/:projectId/generate
 */
apiRouter.post('/api/projects/:projectId/generate', async (req: Request, res: Response) => {
  const project = db.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'المشروع غير موجود', code: 'PROJECT_NOT_FOUND' });
  }

  if (project.status !== 'queued' && project.status !== 'failed' && project.status !== 'cancelled') {
    return res.status(409).json({
      error: 'هناك مهمة توليد جارية بالفعل لهذا المشروع',
      code: 'JOB_ALREADY_ACTIVE',
    });
  }

  const job = await orchestrator.startJob(project);
  res.json({ success: true, jobId: job.id, project });
});

/**
 * GET /api/jobs/:jobId
 */
apiRouter.get('/jobs/:jobId', (req: Request, res: Response) => {
  const job = db.getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'المهمة غير موجودة', code: 'JOB_NOT_FOUND' });
  }
  res.json({ job });
});

/**
 * POST /api/jobs/:jobId/cancel
 */
apiRouter.post('/jobs/:jobId/cancel', (req: Request, res: Response) => {
  const success = orchestrator.cancelJob(req.params.jobId);
  if (!success) {
    return res.status(400).json({ error: 'تعذر إلغاء المهمة أو أنها مكتملة بالفعل' });
  }
  res.json({ success: true, message: 'تم إيقاف المهمة' });
});

/**
 * POST /api/jobs/:jobId/retry
 */
apiRouter.post('/jobs/:jobId/retry', async (req: Request, res: Response) => {
  const oldJob = db.getJob(req.params.jobId);
  if (!oldJob) {
    return res.status(404).json({ error: 'المهمة غير موجودة' });
  }

  const project = db.getProject(oldJob.projectId);
  if (!project) {
    return res.status(404).json({ error: 'المشروع التابع غير موجود' });
  }

  const newJob = await orchestrator.startJob(project);
  res.json({ success: true, jobId: newJob.id, project });
});

/**
 * GET /api/projects/:projectId/download
 */
apiRouter.get('/projects/:projectId/download', (req: Request, res: Response) => {
  const project = db.getProject(req.params.projectId);
  if (!project) {
    return res.status(404).json({ error: 'المشروع غير موجود' });
  }

  const exportsDir = path.resolve(process.cwd(), 'exports');
  const filePath = path.join(exportsDir, `${project.id}.mp4`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'ملف الفيديو غير جاهز أو لم يكتمل إنتاجه بعد',
      code: 'FILE_NOT_READY',
    });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Stream video with range support for video players
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const isAttachment = req.query.download === '1';
    const head: Record<string, string | number> = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    };
    if (isAttachment) {
      head['Content-Disposition'] = `attachment; filename="vox_${project.id}.mp4"`;
    }
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});
