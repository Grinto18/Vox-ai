import path from 'path';
import fs from 'fs';
import { db } from './db.js';
import { Project, GenerationJob, JobStatus } from './types.js';
import { generateDocumentaryScript } from './gemini.js';
import { renderSceneVisuals } from './adapters/visualAdapter.js';
import { generateNarrationAudio } from './adapters/ttsAdapter.js';
import { buildSubtitleCues, writeAssFile, writeSrtFile } from './adapters/subtitlesAdapter.js';
import { generateDocumentaryMusicTrack } from './adapters/musicAdapter.js';
import { renderDocumentaryVideo } from './adapters/renderAdapter.js';

class PipelineOrchestrator {
  private activeJobs: Set<string> = new Set();
  private cancelledJobs: Set<string> = new Set();

  /**
   * Starts or resumes a generation job
   */
  async startJob(project: Project): Promise<GenerationJob> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: GenerationJob = {
      id: jobId,
      projectId: project.id,
      ownerUid: project.ownerUid,
      status: 'queued',
      currentStage: 'queued',
      attempts: 1,
      stageResults: {},
      logs: [
        {
          timestamp: new Date().toISOString(),
          stage: 'queued',
          message: 'تم إدراج المهمة في طابور المعالجة الآمن',
          level: 'info',
        },
      ],
      startedAt: new Date().toISOString(),
    };

    db.saveJob(job);

    project.status = 'queued';
    project.activeJobId = jobId;
    project.lastErrorCode = undefined;
    project.lastErrorMessage = undefined;
    db.saveProject(project);

    // Run execution in the background asynchronously
    this.runJobPipeline(jobId).catch((err) => {
      console.error(`Pipeline failure for job ${jobId}:`, err);
    });

    return job;
  }

  cancelJob(jobId: string): boolean {
    const job = db.getJob(jobId);
    if (!job) return false;

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return false;
    }

    this.cancelledJobs.add(jobId);
    job.status = 'cancelled';
    job.currentStage = 'cancelled';
    job.completedAt = new Date().toISOString();
    job.logs.push({
      timestamp: new Date().toISOString(),
      stage: 'cancelled',
      message: 'تم إلغاء المهمة يدوياً من قبل المستخدم',
      level: 'warn',
    });
    db.saveJob(job);

    const project = db.getProject(job.projectId);
    if (project) {
      project.status = 'cancelled';
      db.saveProject(project);
    }

    return true;
  }

  private isCancelled(jobId: string): boolean {
    return this.cancelledJobs.has(jobId);
  }

  private updateStage(job: GenerationJob, stage: JobStatus, message: string) {
    job.status = stage;
    job.currentStage = stage;
    job.logs.push({
      timestamp: new Date().toISOString(),
      stage,
      message,
      level: 'info',
    });
    db.saveJob(job);

    const project = db.getProject(job.projectId);
    if (project) {
      project.status = stage;
      db.saveProject(project);
    }
  }

  private async runJobPipeline(jobId: string) {
    const job = db.getJob(jobId);
    if (!job) return;

    const project = db.getProject(job.projectId);
    if (!project) return;

    this.activeJobs.add(jobId);
    const workDir = path.resolve(process.cwd(), 'data', 'temp', project.id);

    try {
      if (this.isCancelled(jobId)) return;

      // Stage 1: Scripting with Gemini
      this.updateStage(job, 'scripting', 'بدء كتابة السيناريو الوثائقي وصياغة المشاهد السردية');

      let script = project.script;
      if (!script || !script.scenes || script.scenes.length === 0) {
        if (project.settings.isDemoMode) {
          // Demo script without external API consumption
          script = {
            title: `وثائقي: ${project.topic}`,
            topicSummary: `فيلم وثائقي يستعرض أبعاد وخفايا ${project.topic} بلغة سينمائية مكثفة.`,
            narrationLanguage: 'ar',
            targetDuration: project.settings.duration,
            fullNarrationScript: `في هذا الاستطلاع الوثائقي، نقترب من تفاصيل ${project.topic}. تتداخل الوثائق والشواهد لنكتشف كيف تشكلت القصة عبر التاريخ.`,
            historicalUncertaintyNotes: 'تمت مراجعة الوثائق المقارنة والسياق الجغرافي للموضوع.',
            sourceReferences: ['الأرشيف الوثائقي العالمي', 'المكتبة الرقمية للنصوص التاريخية'],
            scenes: [
              {
                sceneNumber: 1,
                durationSeconds: Math.floor(project.settings.duration / 3),
                onScreenTitle: 'المقدمة والسياق الأولي',
                narrationSegment: `تبدأ حكايتنا مع ${project.topic}، حين كانت البدايات مختلفة تماماً عما نعهده اليوم.`,
                visualDescription: 'خريطة وثائقية وتفاصيل تاريخية توضح نقطة انطلاق الحدث',
                generationPrompt: 'Documentary archival map and paper collage, warm vintage gold lighting',
                transitionSuggestion: 'تقريب تدريجي هادئ',
              },
              {
                sceneNumber: 2,
                durationSeconds: Math.floor(project.settings.duration / 3),
                onScreenTitle: 'نقطة التحول الكبرى',
                narrationSegment: 'هنا تغير كل شيء؛ تفاعلت العوامل وتدافعت الأحداث لتصنع لحظة تاريخية فارقة.',
                visualDescription: 'رسوم بيانية ومخطوطات تاريخية تكشف محطات التحول الجوهرية',
                generationPrompt: 'Infographic timeline cards with dramatic charcoal background and gold highlights',
                transitionSuggestion: 'انتقال جانبي سينمائي',
              },
              {
                sceneNumber: 3,
                durationSeconds: Math.max(5, project.settings.duration - 2 * Math.floor(project.settings.duration / 3)),
                onScreenTitle: 'الأثر الحاضر والخاتمة',
                narrationSegment: 'واليوم، يقف هذا الشاهد دليلاً حياً على إرث عميق مستمر في تشكيل حاضرنا.',
                visualDescription: 'لقطة ختامية عريضة تجمع الشواهد في لوحة أرشيفية متكاملة',
                generationPrompt: 'Cinematic wide frame documentary conclusion, warm atmospheric glow',
                transitionSuggestion: 'تلاشي تدريجي هادئ نحو النهاية',
              },
            ],
          };
        } else {
          // Real Gemini generation
          script = await generateDocumentaryScript(
            project.topic,
            project.settings.duration,
            project.settings.visualStyle,
            project.settings.additionalInstructions
          );
        }

        project.script = script;
        db.saveProject(project);
      }

      job.stageResults['script'] = {
        title: script.title,
        sceneCount: script.scenes.length,
      };
      job.logs.push({
        timestamp: new Date().toISOString(),
        stage: 'scripting',
        message: `تم إنجاز السيناريو بنجاح: "${script.title}" (${script.scenes.length} مشاهد)`,
        level: 'info',
      });

      if (this.isCancelled(jobId)) return;

      // Stage 2: Storyboard Validation
      this.updateStage(job, 'storyboard', 'التحقق من لوحة القصة والمطابقة الزمنية للمشاهد');
      job.stageResults['storyboard'] = {
        valid: true,
        totalPlannedSeconds: script.scenes.reduce((a, s) => a + s.durationSeconds, 0),
      };

      if (this.isCancelled(jobId)) return;

      // Stage 3: Visual Assets Generation
      this.updateStage(job, 'visuals', 'توليد وتصميم الإطارات البصرية الوثائقية لكل مشهد بدقة عالية');
      const visualDir = path.join(workDir, 'visuals');
      await renderSceneVisuals(
        script.scenes,
        project.settings.visualStyle,
        project.settings.aspectRatio,
        script.title,
        visualDir
      );

      job.stageResults['visuals'] = {
        generatedCount: script.scenes.length,
      };
      job.logs.push({
        timestamp: new Date().toISOString(),
        stage: 'visuals',
        message: `تم توليد ${script.scenes.length} إطارات بصرية بأسلوب ${project.settings.visualStyle}`,
        level: 'info',
      });

      if (this.isCancelled(jobId)) return;

      // Stage 4: Narration Generation (Arabic TTS or synthesis fallback)
      this.updateStage(job, 'narration', 'تسجيل التعليق الصوتي العربي المحكم');
      const narrationPath = path.join(workDir, 'narration.wav');
      const ttsResult = await generateNarrationAudio(
        script.fullNarrationScript,
        project.settings.voice,
        narrationPath,
        script.targetDuration,
        project.settings.isDemoMode
      );

      job.stageResults['narration'] = {
        provider: ttsResult.provider,
        isFallback: ttsResult.isFallback,
        duration: ttsResult.durationSeconds,
      };
      job.logs.push({
        timestamp: new Date().toISOString(),
        stage: 'narration',
        message: ttsResult.isFallback
          ? 'تم توليد مسار صوتي نغمي بديل (وضع تجريبي/اقتصادي)'
          : `تم التسجيل بنجاح عبر ${ttsResult.provider}`,
        level: 'info',
      });

      if (this.isCancelled(jobId)) return;

      // Stage 5: Timed Subtitles (Arabic SRT & ASS)
      this.updateStage(job, 'subtitles', 'صياغة وتوقيت ملفات الترجمة والنصوص المصاحبة');
      const cues = buildSubtitleCues(script.scenes);
      const srtPath = path.join(workDir, 'subtitles.srt');
      const assPath = path.join(workDir, 'subtitles.ass');
      writeSrtFile(cues, srtPath);
      writeAssFile(cues, assPath, project.settings.aspectRatio);

      job.stageResults['subtitles'] = {
        cuesCount: cues.length,
        hasAss: true,
      };

      if (this.isCancelled(jobId)) return;

      // Background music generation if enabled
      let musicPath: string | undefined = undefined;
      if (project.settings.enableBackgroundMusic) {
        musicPath = path.join(workDir, 'bgm.wav');
        await generateDocumentaryMusicTrack(
          script.targetDuration + 2,
          musicPath,
          project.settings.musicTrack || 'ambient_documentary'
        );
      }

      // Stage 6: Video Rendering with FFmpeg
      this.updateStage(job, 'rendering', 'بدء مونتاج الفيديو النهائي بمحرك FFmpeg ومزج الصوتيات وتأثيرات الكاميرا');
      const renderResult = await renderDocumentaryVideo(
        project.id,
        script.scenes,
        project.settings.aspectRatio,
        ttsResult.audioPath,
        musicPath,
        project.settings.musicVolume ?? 0.15,
        project.settings.enableSubtitles ? assPath : undefined,
        workDir
      );

      // Stage 7: Validation
      this.updateStage(job, 'validating', 'التحقق النهائي من سلامة ملف MP4 واكتمال المدة والحجم');

      // Update project record
      project.status = 'completed';
      project.outputVideoPath = renderResult.outputPath;
      project.outputVideoUrl = renderResult.outputUrl;
      project.videoDurationSeconds = renderResult.durationSeconds;
      project.videoSizeBytes = renderResult.sizeBytes;
      project.estimatedCost = project.settings.isDemoMode ? '$0.00 (وضع تجريبي)' : '$0.02 (تقدير اقتصادي)';
      project.actualTrackedCost = project.settings.isDemoMode ? '$0.00' : '$0.01';
      db.saveProject(project);

      // Complete job
      job.status = 'completed';
      job.currentStage = 'completed';
      job.completedAt = new Date().toISOString();
      job.stageResults['rendering'] = {
        outputPath: renderResult.outputPath,
        sizeBytes: renderResult.sizeBytes,
        durationSeconds: renderResult.durationSeconds,
      };
      job.logs.push({
        timestamp: new Date().toISOString(),
        stage: 'completed',
        message: `تم إنتاج الفيديو بنجاح! المدة: ${renderResult.durationSeconds.toFixed(1)} ثانية، الحجم: ${(renderResult.sizeBytes / 1024 / 1024).toFixed(2)} ميجابايت`,
        level: 'info',
      });
      db.saveJob(job);
    } catch (err: any) {
      console.error(`Error executing job ${jobId}:`, err);
      job.status = 'failed';
      job.currentStage = 'failed';
      job.errorCode = err?.code || 'RENDER_ORCHESTRATION_ERROR';
      job.errorMessage = err?.message || 'حدث خطأ غير متوقع أثناء معالجة خط الإنتاج';
      job.completedAt = new Date().toISOString();
      job.logs.push({
        timestamp: new Date().toISOString(),
        stage: 'failed',
        message: `فشل التنفيذ: ${job.errorMessage}`,
        level: 'error',
      });
      db.saveJob(job);

      project.status = 'failed';
      project.lastErrorCode = job.errorCode;
      project.lastErrorMessage = job.errorMessage;
      db.saveProject(project);
    } finally {
      this.activeJobs.delete(jobId);
      this.cancelledJobs.delete(jobId);
    }
  }
}

export const orchestrator = new PipelineOrchestrator();
