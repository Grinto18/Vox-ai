import React, { useState } from 'react';
import {
  Film,
  Download,
  Trash2,
  Copy,
  RotateCcw,
  Clock,
  Coins,
  Search,
  ExternalLink,
  Plus,
  Play,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Project } from '../types';

interface ProjectsListProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onDuplicate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onRetry: (projectId: string) => void;
  onDownload: (projectId: string) => void;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  onOpenProject,
  onNewProject,
  onDuplicate,
  onDelete,
  onRetry,
  onDownload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.topic.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'completed') return matchesSearch && p.status === 'completed';
    if (statusFilter === 'active')
      return (
        matchesSearch &&
        p.status !== 'completed' &&
        p.status !== 'failed' &&
        p.status !== 'cancelled'
      );
    if (statusFilter === 'failed') return matchesSearch && p.status === 'failed';
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F7F3EA] font-['Cairo'] tracking-tight">
            المشاريع المحفوظة
          </h1>
          <p className="text-xs sm:text-sm text-[#77736D] mt-1 font-['Tajawal']">
            إدارة كافة الأفلام الوثائقية المنشأة، تتبع تكاليف الإنتاج، وتحميل ملفات MP4 المكتملة
          </p>
        </div>

        <button
          onClick={onNewProject}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#C6A15B] to-[#B38D46] text-[#171717] font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>إنشاء وثائقي جديد</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-[#1A1917] p-3 rounded-xl border border-[#2D2C28]">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#77736D] absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث في عناوين المشاريع والموضوعات..."
            className="w-full pr-10 pl-4 py-2 rounded-lg bg-[#141413] border border-[#33312C] text-[#F7F3EA] placeholder-[#66635D] text-sm focus:outline-none focus:border-[#C6A15B]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'completed', label: 'المكتملة' },
            { id: 'active', label: 'قيد المعالجة' },
            { id: 'failed', label: 'المتعثرة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#C6A15B] text-[#171717]'
                  : 'text-[#77736D] hover:text-[#F7F3EA] hover:bg-[#252420]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-[#161514] border border-[#282724] rounded-2xl p-8">
          <Film className="w-12 h-12 text-[#444] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#F7F3EA] mb-1 font-['Cairo']">
            لا توجد مشاريع تطابق بحثك
          </h3>
          <p className="text-xs text-[#77736D] max-w-sm mx-auto mb-6">
            ابدأ الآن بإنشاء أول فيلم وثائقي بالذكاء الاصطناعي مع خط إنتاج VOX الآلي.
          </p>
          <button
            onClick={onNewProject}
            className="px-5 py-2.5 rounded-xl bg-[#C6A15B] text-[#171717] font-bold text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            أنشئ فيديو الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const isCompleted = p.status === 'completed';
            const isFailed = p.status === 'failed';
            const isActive = !isCompleted && !isFailed && p.status !== 'cancelled';
            const dateStr = new Date(p.createdAt).toLocaleDateString('ar-EG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={p.id}
                className="bg-[#1C1B19] border border-[#2B2A26] hover:border-[#C6A15B]/50 rounded-2xl overflow-hidden transition-all flex flex-col group shadow-lg"
              >
                {/* Header aspect / poster thumbnail area */}
                <div
                  className="h-36 bg-gradient-to-br from-[#24221E] to-[#141413] p-4 flex flex-col justify-between border-b border-[#2B2A26] cursor-pointer relative overflow-hidden"
                  onClick={() => onOpenProject(p.id)}
                >
                  {/* Subtle background graphics */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C6A15B_1px,transparent_1px)] [background-size:16px_16px]" />

                  {/* Top Badges */}
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#171717]/80 text-[#C6A15B] border border-[#C6A15B]/30 font-bold">
                      {p.settings.aspectRatio}
                    </span>

                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : isFailed
                          ? 'bg-red-950/80 text-red-300 border border-red-800'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>جاهز للتحميل</span>
                        </>
                      ) : isFailed ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>تعثر</span>
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>{p.status}</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Play icon overlay on hover if completed */}
                  {isCompleted && (
                    <div className="self-center w-10 h-10 rounded-full bg-[#C6A15B] text-[#171717] flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-md z-10">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  )}

                  {/* Duration and Date bottom row */}
                  <div className="flex items-center justify-between text-[11px] text-[#77736D] z-10">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#C6A15B]" />
                      <span>{p.videoDurationSeconds ? `${p.videoDurationSeconds.toFixed(0)} ثانية` : `${p.settings.duration} ثانية`}</span>
                    </span>
                    <span>{dateStr}</span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => onOpenProject(p.id)}
                      className="font-bold text-sm text-[#F7F3EA] group-hover:text-[#C6A15B] transition-colors font-['Cairo'] line-clamp-2 cursor-pointer leading-snug mb-2"
                    >
                      {p.topic}
                    </h3>

                    {/* Script Summary or Subtitle if available */}
                    {p.script && (
                      <p className="text-xs text-[#77736D] line-clamp-2 leading-relaxed mb-3">
                        {p.script.topicSummary}
                      </p>
                    )}
                  </div>

                  {/* Cost & Size row */}
                  <div className="pt-3 border-t border-[#262522] flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 text-[#77736D]">
                      <Coins className="w-3.5 h-3.5 text-[#C6A15B]" />
                      <span>الكلفة: {p.actualTrackedCost || p.estimatedCost}</span>
                    </div>

                    {p.videoSizeBytes && (
                      <span className="text-[#77736D] font-mono">
                        {(p.videoSizeBytes / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-[#151413] border-t border-[#262522] flex items-center justify-between gap-1">
                  <button
                    onClick={() => onOpenProject(p.id)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#252420] hover:bg-[#302E29] text-xs font-bold text-[#F7F3EA] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>التفاصيل</span>
                  </button>

                  {isCompleted && (
                    <button
                      onClick={() => onDownload(p.id)}
                      title="تحميل ملف MP4"
                      className="p-1.5 rounded-lg bg-[#252420] hover:bg-[#C6A15B] text-[#77736D] hover:text-[#171717] transition-all"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}

                  {isFailed && (
                    <button
                      onClick={() => onRetry(p.id)}
                      title="إعادة المحاولة"
                      className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-800 text-red-300 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onDuplicate(p.id)}
                    title="نسخ المشروع"
                    className="p-1.5 rounded-lg bg-[#252420] hover:bg-[#302E29] text-[#77736D] hover:text-[#F7F3EA] transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setProjectToDelete(p.id)}
                    title="حذف المشروع"
                    className="p-1.5 rounded-lg bg-[#252420] hover:bg-red-950/60 text-[#77736D] hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1C1B19] border border-[#383631] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#F7F3EA] mb-2 font-['Cairo']">
              تأكيد حذف المشروع
            </h3>
            <p className="text-xs text-[#77736D] leading-relaxed mb-6">
              هل أنت متأكد من رغبتك في حذف هذا المشروع وملفات الفيديو المصاحبة له؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#D8D2C5] hover:bg-[#252420]"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onDelete(projectToDelete);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md"
              >
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
