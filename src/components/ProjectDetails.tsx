import React, { useState } from 'react';
import {
  ArrowRight,
  Download,
  Play,
  RotateCcw,
  FileText,
  LayoutGrid,
  Subtitles,
  Terminal,
  Clock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { Project } from '../types';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
  onRetry: (projectId: string) => void;
  onDownload: (projectId: string) => void;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onBack,
  onRetry,
  onDownload,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'script' | 'storyboard' | 'subtitles' | 'logs'>('video');
  const [copiedScript, setCopiedScript] = useState(false);

  const isCompleted = project.status === 'completed';
  const hasVideo = isCompleted && Boolean(project.outputVideoUrl || project.outputVideoPath);

  const handleCopyScript = () => {
    if (project.script?.fullNarrationScript) {
      navigator.clipboard.writeText(project.script.fullNarrationScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Navigation & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C2A26]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#21201D] border border-[#33312C] text-[#C6A15B] hover:bg-[#2A2824] transition-all"
            title="الرجوع إلى المشاريع"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#2A2925] text-[#C6A15B] font-bold">
                {project.settings.visualStyle} • {project.settings.aspectRatio}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                  isCompleted
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                }`}
              >
                {isCompleted ? 'جاهز للعرض' : project.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F7F3EA] font-['Cairo']">
              {project.script?.title || project.topic}
            </h1>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-3">
          {hasVideo && (
            <button
              onClick={() => onDownload(project.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C6A15B] text-[#171717] font-bold text-sm shadow-md hover:brightness-105 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تحميل ملف MP4</span>
            </button>
          )}

          {project.status === 'failed' && (
            <button
              onClick={() => onRetry(project.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة المحاولة</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2C2A26] pb-2 overflow-x-auto">
        {[
          { id: 'video', label: 'مشغل الفيديو', icon: <Play className="w-4 h-4" /> },
          { id: 'storyboard', label: 'لوحة القصة والمشاهد', icon: <LayoutGrid className="w-4 h-4" /> },
          { id: 'script', label: 'السيناريو الكامل والتوثيق', icon: <FileText className="w-4 h-4" /> },
          { id: 'subtitles', label: 'الترجمة المتزامنة', icon: <Subtitles className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#C6A15B] text-[#171717] shadow-sm'
                : 'text-[#77736D] hover:text-[#F7F3EA] hover:bg-[#21201D]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Video Player */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Screen */}
          <div className="lg:col-span-2 bg-[#141413] border border-[#2D2C28] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center">
            {hasVideo ? (
              <div
                className={`w-full overflow-hidden rounded-xl bg-black shadow-2xl relative ${
                  project.settings.aspectRatio === '9:16'
                    ? 'max-w-xs aspect-[9/16]'
                    : 'w-full aspect-[16/9]'
                }`}
              >
                <video
                  controls
                  playsInline
                  autoPlay
                  preload="metadata"
                  src={`/api/projects/${project.id}/download`}
                  className="w-full h-full object-contain"
                >
                  متصفحك لا يدعم تشغيل فيديو HTML5.
                </video>
              </div>
            ) : (
              <div className="text-center py-20 px-4">
                <Play className="w-16 h-16 text-[#383631] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#F7F3EA] mb-2 font-['Cairo']">
                  الفيديو قيد الإنتاج أو المعالجة
                </h3>
                <p className="text-xs text-[#77736D] max-w-md mx-auto mb-6 leading-relaxed">
                  الحالة الحالية: ({project.status}). يمكنك متابعة مراحل الإنتاج أو إعادة المحاولة في حال تعثرت إحدى الخطوات.
                </p>
                {project.status === 'failed' && (
                  <button
                    onClick={() => onRetry(project.id)}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs"
                  >
                    إعادة المحاولة الآن
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Video Metadata & Production Spec Card */}
          <div className="bg-[#1C1B19] border border-[#2D2C28] rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#F7F3EA] mb-3 flex items-center gap-2 font-['Cairo']">
                <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
                <span>شهادة ومواصفات الإنتاج</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[#2A2925]">
                  <span className="text-[#77736D]">أبعاد العرض:</span>
                  <span className="font-mono text-[#F7F3EA]">{project.settings.aspectRatio} (HD 30fps)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#2A2925]">
                  <span className="text-[#77736D]">المدة الفعلية:</span>
                  <span className="font-mono text-[#F7F3EA]">
                    {project.videoDurationSeconds ? `${project.videoDurationSeconds.toFixed(1)} ثانية` : `${project.settings.duration} ثانية`}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#2A2925]">
                  <span className="text-[#77736D]">ترميز الفيديو والصوت:</span>
                  <span className="font-mono text-[#F7F3EA]">H.264 / AAC 192k</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#2A2925]">
                  <span className="text-[#77736D]">حجم الملف النهائي:</span>
                  <span className="font-mono text-[#F7F3EA]">
                    {project.videoSizeBytes ? `${(project.videoSizeBytes / 1024 / 1024).toFixed(2)} MB` : 'قيد القياس'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#2A2925]">
                  <span className="text-[#77736D]">الصوت السردي:</span>
                  <span className="text-[#F7F3EA]">{project.settings.voice} (العربية الفصحى)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#77736D]">كلفة الإنتاج المحتسبة:</span>
                  <span className="text-[#C6A15B] font-bold">{project.actualTrackedCost || project.estimatedCost}</span>
                </div>
              </div>
            </div>

            {hasVideo && (
              <div className="pt-4 border-t border-[#2A2925] space-y-2">
                <a
                  href={`/api/projects/${project.id}/download?download=1`}
                  download={`vox_${project.id}.mp4`}
                  className="w-full py-3 px-4 rounded-xl bg-[#C6A15B] text-[#171717] font-black text-sm flex items-center justify-center gap-2 shadow-md hover:brightness-105 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل ملف MP4 مباشرة</span>
                </a>
                <span className="block text-center text-[11px] text-[#77736D]">
                  ملف MP4 صالح للرفع على TikTok, Instagram Reels, YouTube
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Storyboard */}
      {activeTab === 'storyboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#F7F3EA] font-['Cairo']">
              لوحة القصة وتفاصيل المشاهد ({project.script?.scenes.length || 0} مشاهد)
            </h3>
            <span className="text-xs text-[#77736D]">
              مجموع التوقيت: {project.script?.targetDuration || project.settings.duration} ثانية
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {project.script?.scenes.map((scene) => (
              <div
                key={scene.sceneNumber}
                className="bg-[#1C1B19] border border-[#2D2C28] rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Top scene banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#282723]">
                    <span className="px-2.5 py-0.5 rounded bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30 font-bold text-xs">
                      المشهد {String(scene.sceneNumber).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-[#77736D] flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#C6A15B]" />
                      {scene.durationSeconds} ثانية
                    </span>
                  </div>

                  {/* Scene On-Screen Title */}
                  <h4 className="font-bold text-sm text-[#F7F3EA] mt-3 mb-2 font-['Cairo']">
                    {scene.onScreenTitle}
                  </h4>

                  {/* Narration voiceover excerpt */}
                  <div className="bg-[#141413] p-3 rounded-xl border border-[#262522] mb-3">
                    <span className="text-[10px] font-bold text-[#C6A15B] uppercase block mb-1">
                      التعليق الصوتي المسموع:
                    </span>
                    <p className="text-xs text-[#E0DDD5] leading-relaxed">
                      "{scene.narrationSegment}"
                    </p>
                  </div>

                  {/* Visual Description */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] text-[#77736D] font-bold block">الوصف البصري والكاميرا:</span>
                    <p className="text-[#A8A49C] text-xs leading-relaxed">{scene.visualDescription}</p>
                  </div>
                </div>

                {/* Transition & Historical Notes */}
                <div className="pt-3 border-t border-[#262522] space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-[#77736D]">
                    <span>الانتقال المقترح:</span>
                    <span className="text-[#C6A15B] font-medium">{scene.transitionSuggestion}</span>
                  </div>
                  {scene.sourceOrVerificationNotes && (
                    <div className="text-[10px] text-[#888] italic">
                      توثيق: {scene.sourceOrVerificationNotes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Full Script */}
      {activeTab === 'script' && (
        <div className="bg-[#1C1B19] border border-[#2D2C28] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#2C2A26]">
            <div>
              <h3 className="text-xl font-bold text-[#F7F3EA] font-['Cairo']">
                {project.script?.title || 'السيناريو الوثائقي الكامل'}
              </h3>
              <p className="text-xs text-[#77736D] mt-1 font-['Tajawal']">
                {project.script?.topicSummary}
              </p>
            </div>

            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252420] border border-[#383631] text-xs font-semibold text-[#D8D2C5] hover:border-[#C6A15B] transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedScript ? 'تم النسخ!' : 'نسخ النص'}</span>
            </button>
          </div>

          {/* Full Narration Script */}
          <div>
            <h4 className="text-xs font-bold text-[#C6A15B] uppercase tracking-wider mb-2">
              نص التعليق الصوتي المسموع كاملاً (Narration Script)
            </h4>
            <div className="bg-[#141413] border border-[#2C2A26] rounded-xl p-5 text-sm sm:text-base text-[#F7F3EA] leading-loose font-['Tajawal'] whitespace-pre-line">
              {project.script?.fullNarrationScript}
            </div>
          </div>

          {/* Historical Uncertainty & Fact Check notes */}
          {project.script?.historicalUncertaintyNotes && (
            <div className="bg-[#24211A] border border-[#C6A15B]/30 rounded-xl p-4 text-xs text-[#D8D2C5] space-y-1">
              <span className="font-bold text-[#C6A15B] block flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>ملاحظات الدقة والتحقق التاريخي:</span>
              </span>
              <p className="leading-relaxed">{project.script.historicalUncertaintyNotes}</p>
            </div>
          )}

          {/* Source References */}
          {project.script?.sourceReferences && project.script.sourceReferences.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#77736D] uppercase tracking-wider mb-2">
                المصادر والمراجع المعتمدة
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#A8A49C]">
                {project.script.sourceReferences.map((ref, idx) => (
                  <li key={idx}>{ref}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Subtitles */}
      {activeTab === 'subtitles' && (
        <div className="bg-[#1C1B19] border border-[#2D2C28] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#2C2A26]">
            <div>
              <h3 className="text-base font-bold text-[#F7F3EA] font-['Cairo']">
                الترجمة الموقوتة المتزامنة (Arabic Subtitles)
              </h3>
              <p className="text-xs text-[#77736D]">
                نصوص متزامنة بدقة مع المشاهد ومُشكّلة بنظام FriBidi لضمان سلامة اتجاه النص RTL
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {project.script?.scenes.map((scene, idx) => (
              <div
                key={idx}
                className="bg-[#141413] border border-[#2A2925] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[#C6A15B] font-bold shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="text-[#F7F3EA] font-['Tajawal'] text-sm">
                    {scene.narrationSegment}
                  </span>
                </div>
                <div className="font-mono text-[#77736D] shrink-0 text-left">
                  {scene.durationSeconds}s
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
