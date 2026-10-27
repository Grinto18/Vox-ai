import React, { useEffect, useRef } from 'react';
import {
  FileText,
  LayoutGrid,
  Image,
  Mic,
  Subtitles,
  Film,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Eye,
  Loader2,
  Terminal,
} from 'lucide-react';
import { GenerationJob, JobStatus } from '../types';

interface PipelineProgressProps {
  job: GenerationJob;
  topicTitle: string;
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
  onViewProject: (projectId: string) => void;
}

const STAGES: { id: JobStatus; name: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: 'scripting',
    name: 'كتابة السيناريو',
    icon: <FileText className="w-4 h-4" />,
    desc: 'صياغة المحتوى التاريخي والسردي بالذكاء الاصطناعي',
  },
  {
    id: 'storyboard',
    name: 'لوحة القصة',
    icon: <LayoutGrid className="w-4 h-4" />,
    desc: 'مراجعة تسلسل المشاهد والتطابق الزمني',
  },
  {
    id: 'visuals',
    name: 'تجهيز المرئيات',
    icon: <Image className="w-4 h-4" />,
    desc: 'توليد الإطارات والخرائط الوثائقية عالية الدقة',
  },
  {
    id: 'narration',
    name: 'التعليق الصوتي',
    icon: <Mic className="w-4 h-4" />,
    desc: 'تسجيل الصوت السردي باللغة العربية الفصحى',
  },
  {
    id: 'subtitles',
    name: 'الترجمة والتوقيت',
    icon: <Subtitles className="w-4 h-4" />,
    desc: 'إنشاء ملفات الترجمة ASS / SRT المتوافقة مع الخطوط العربية',
  },
  {
    id: 'rendering',
    name: 'المونتاج بـ FFmpeg',
    icon: <Film className="w-4 h-4" />,
    desc: 'مزج الصوتيات وتحريك الكاميرا (Ken Burns) ودمج المشاهد',
  },
  {
    id: 'validating',
    name: 'التحقق والاعتماد',
    icon: <CheckCircle className="w-4 h-4" />,
    desc: 'فحص تكامل ملف MP4 والتأكد من قابليته للتشغيل الفوري',
  },
];

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  job,
  topicTitle,
  onCancel,
  onRetry,
  onViewProject,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [job.logs]);

  // Determine stage states
  const stageOrder: JobStatus[] = [
    'queued',
    'scripting',
    'storyboard',
    'visuals',
    'narration',
    'subtitles',
    'rendering',
    'validating',
    'completed',
  ];

  const currentIdx = stageOrder.indexOf(job.currentStage);
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header Info */}
      <div className="bg-[#1D1C1A] border border-[#2D2C28] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#2C2A26]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-1 rounded bg-[#2A2925] text-[#C6A15B] border border-[#C6A15B]/30 font-bold">
                معرف المهمة: {job.id.substring(0, 16)}...
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded font-bold ${
                  isCompleted
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                    : isFailed
                    ? 'bg-red-950/60 text-red-400 border border-red-800'
                    : isCancelled
                    ? 'bg-gray-800 text-gray-400 border border-gray-700'
                    : 'bg-amber-950/50 text-amber-400 border border-amber-800 animate-pulse'
                }`}
              >
                {isCompleted
                  ? 'مكتمل بنجاح'
                  : isFailed
                  ? 'تعثر الإنتاج'
                  : isCancelled
                  ? 'تم الإلغاء'
                  : 'جاري المعالجة'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#F7F3EA] font-['Cairo']">
              {topicTitle}
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {isCompleted && (
              <button
                onClick={() => onViewProject(job.projectId)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C6A15B] text-[#171717] font-bold text-sm shadow-lg hover:brightness-105 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>مشاهدة وتحميل الفيديو</span>
              </button>
            )}

            {isFailed && (
              <button
                onClick={() => onRetry(job.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/90 text-white font-bold text-sm hover:bg-red-600 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة المحاولة الآن</span>
              </button>
            )}

            {!isCompleted && !isFailed && !isCancelled && (
              <button
                onClick={() => onCancel(job.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#262522] border border-[#3A3833] text-[#77736D] hover:text-red-400 hover:border-red-500/50 text-xs font-semibold transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>إلغاء المعالجة</span>
              </button>
            )}
          </div>
        </div>

        {/* Stepper Stages */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[#77736D] uppercase tracking-wider mb-3">
            مراحل خط الإنتاج الآلي (Orchestration Pipeline)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STAGES.map((s) => {
              const stageIdx = stageOrder.indexOf(s.id);
              const isPast = isCompleted || (currentIdx > stageIdx && !isFailed);
              const isCurrent = job.currentStage === s.id && !isFailed && !isCancelled;
              const hasFailedHere = isFailed && job.currentStage === s.id;

              return (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-[#2A261D] border-[#C6A15B] shadow-md shadow-[#C6A15B]/10'
                      : isPast
                      ? 'bg-[#181816] border-emerald-900/50'
                      : hasFailedHere
                      ? 'bg-red-950/20 border-red-800'
                      : 'bg-[#141413] border-[#2A2925] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isCurrent
                          ? 'bg-[#C6A15B] text-[#171717]'
                          : isPast
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : hasFailedHere
                          ? 'bg-red-900 text-red-200'
                          : 'bg-[#222] text-gray-500'
                      }`}
                    >
                      {s.icon}
                    </div>

                    {isCurrent ? (
                      <Loader2 className="w-4 h-4 text-[#C6A15B] animate-spin" />
                    ) : isPast ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : hasFailedHere ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gray-600" />
                    )}
                  </div>

                  <h4
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-[#C6A15B]'
                        : isPast
                        ? 'text-[#F7F3EA]'
                        : hasFailedHere
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {s.name}
                  </h4>
                  <p className="text-[11px] text-[#77736D] mt-1 leading-normal line-clamp-2">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message banner if failed */}
        {isFailed && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-300 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-red-200 font-bold mb-1">
                توقف خط الإنتاج عند مرحلة ({job.currentStage}):
              </strong>
              <span>{job.errorMessage || 'حدث خطأ غير متوقع في المعالجة'}</span>
              <p className="text-xs text-red-400/80 mt-2">
                يمكنك الضغط على زر "إعادة المحاولة الآن" أو استخدام "الوضع التجريبي" من شريط التنقل العلوي لتجاوز قيود المفاتيح أو الحصص.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Job Console Logs */}
      <div className="bg-[#141413] border border-[#2A2925] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 bg-[#1B1B19] border-b border-[#2A2925] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D8D2C5]">
            <Terminal className="w-4 h-4 text-[#C6A15B]" />
            <span className="font-bold">سجل العمليات الآني (Audit & Pipeline Console)</span>
          </div>
          <span className="text-[11px] text-[#77736D] font-mono">
            {job.logs.length} سجلات مُدققة
          </span>
        </div>

        <div
          ref={logContainerRef}
          className="p-4 max-h-60 overflow-y-auto font-mono text-xs space-y-2 bg-[#0E0E0E]"
        >
          {job.logs.map((l, idx) => (
            <div key={idx} className="flex items-start gap-3 leading-relaxed">
              <span className="text-[#555] shrink-0 text-[10px] mt-0.5">
                {new Date(l.timestamp).toLocaleTimeString('ar-EG')}
              </span>
              <span
                className={`text-[10px] uppercase px-1.5 py-0.5 rounded shrink-0 ${
                  l.level === 'error'
                    ? 'bg-red-950 text-red-400 border border-red-800'
                    : l.level === 'warn'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-[#1E1E1C] text-[#C6A15B]'
                }`}
              >
                {l.stage}
              </span>
              <span
                className={
                  l.level === 'error'
                    ? 'text-red-300'
                    : l.level === 'warn'
                    ? 'text-amber-300'
                    : 'text-[#E0DDD5]'
                }
              >
                {l.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
