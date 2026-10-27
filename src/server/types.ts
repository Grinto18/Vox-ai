/**
 * VOX AI STUDIO - Core Type Definitions
 * Arabic-first AI Documentary Pipeline
 */

export type VisualStyle = 'paper_cutout' | 'vox_maps' | 'cinematic' | 'slideshow';
export type AspectRatio = '9:16' | '16:9';
export type DurationOption = 30 | 60 | 180;
export type VoiceOption = 'Fenrir' | 'Kore' | 'Puck' | 'Zephyr' | 'fallback';

export type JobStatus =
  | 'queued'
  | 'scripting'
  | 'storyboard'
  | 'visuals'
  | 'narration'
  | 'subtitles'
  | 'rendering'
  | 'validating'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Scene {
  sceneNumber: number;
  durationSeconds: number;
  narrationSegment: string;
  visualDescription: string;
  generationPrompt: string;
  onScreenTitle: string;
  transitionSuggestion: string;
  sourceOrVerificationNotes?: string;
  visualAssetPath?: string;
  audioAssetPath?: string;
}

export interface DocumentaryScript {
  title: string;
  topicSummary: string;
  narrationLanguage: string;
  targetDuration: number;
  fullNarrationScript: string;
  historicalUncertaintyNotes?: string;
  sourceReferences?: string[];
  scenes: Scene[];
}

export interface ProjectSettings {
  duration: DurationOption;
  visualStyle: VisualStyle;
  aspectRatio: AspectRatio;
  voice: VoiceOption;
  enableSubtitles: boolean;
  enableBackgroundMusic: boolean;
  musicTrack?: string;
  musicVolume?: number; // 0.0 to 1.0
  costMode: 'economy' | 'studio';
  isDemoMode: boolean;
  additionalInstructions?: string;
}

export interface Project {
  id: string;
  ownerUid: string;
  topic: string;
  settings: ProjectSettings;
  script?: DocumentaryScript;
  status: JobStatus;
  activeJobId?: string;
  estimatedCost: string;
  actualTrackedCost: string;
  createdAt: string;
  updatedAt: string;
  outputVideoPath?: string;
  outputVideoUrl?: string;
  videoDurationSeconds?: number;
  videoSizeBytes?: number;
  lastErrorCode?: string;
  lastErrorMessage?: string;
}

export interface JobLog {
  timestamp: string;
  stage: JobStatus;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface GenerationJob {
  id: string;
  projectId: string;
  ownerUid: string;
  status: JobStatus;
  currentStage: JobStatus;
  attempts: number;
  stageResults: Record<string, any>;
  logs: JobLog[];
  startedAt: string;
  completedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SubtitleCue {
  index: number;
  startTime: string; // HH:MM:SS,mmm
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface ProviderStatus {
  geminiText: {
    status: 'configured' | 'missing' | 'connected' | 'error';
    model: string;
    message?: string;
  };
  geminiTts: {
    status: 'configured' | 'missing' | 'connected' | 'error';
    model: string;
    message?: string;
  };
  ffmpeg: {
    status: 'configured' | 'missing' | 'connected' | 'error';
    path: string;
    version?: string;
    hasArabicFont: boolean;
    fontPath?: string;
  };
  storage: {
    status: 'configured' | 'connected';
    provider: 'local_disk' | 'firebase';
  };
}
