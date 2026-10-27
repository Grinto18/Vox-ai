import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Server,
  Cpu,
  Video,
  HardDrive,
  Shield,
  RotateCw,
  Key,
  Info,
} from 'lucide-react';
import { ProviderStatus } from '../types';

interface SettingsAndDiagnosticsProps {
  status: ProviderStatus | null;
  onRefreshStatus: () => Promise<void>;
  isDemoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
}

export const SettingsAndDiagnostics: React.FC<SettingsAndDiagnosticsProps> = ({
  status,
  onRefreshStatus,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    await onRefreshStatus();
    setIsTesting(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F7F3EA] font-['Cairo'] tracking-tight">
            حالة المزودين وتشخيص النظام
          </h1>
          <p className="text-xs sm:text-sm text-[#77736D] mt-1 font-['Tajawal']">
            فحص حي لاتصال نماذج الذكاء الاصطناعي، محرك المونتاج FFmpeg، وقيود الحصص دون كشف أي أسرار
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#21201D] border border-[#33312C] text-[#C6A15B] hover:border-[#C6A15B] text-xs font-bold transition-all shadow-sm"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
          <span>إعادة فحص الاتصال الآن</span>
        </button>
      </div>

      {/* Provider Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Gemini Text Model */}
        <div className="bg-[#1C1B19] border border-[#2D2C28] rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#252420] border border-[#383631]">
                <Cpu className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F7F3EA] font-['Cairo']">
                  نموذج كتابة السيناريو (Gemini)
                </h3>
                <span className="text-[11px] font-mono text-[#77736D]">
                  {status?.geminiText.model || 'gemini-3.8-flash'}
                </span>
              </div>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded font-bold flex items-center gap-1.5 ${
                status?.geminiText.status === 'connected'
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                  : status?.geminiText.status === 'configured'
                  ? 'bg-blue-950/70 text-blue-400 border border-blue-800'
                  : 'bg-amber-950/70 text-amber-400 border border-amber-800'
              }`}
            >
              {status?.geminiText.status === 'connected' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>متصل ونشط</span>
                </>
              ) : status?.geminiText.status === 'configured' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>المفتاح مسجل</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>المفتاح غير متوفر</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-[#A8A49C] leading-relaxed bg-[#141413] p-3 rounded-xl border border-[#262522]">
            {status?.geminiText.message || 'يستخدم لتوليد السيناريو الوثائقي العربي الموزون بدقة المشاهد.'}
          </p>
        </div>

        {/* Card 2: Gemini TTS Model */}
        <div className="bg-[#1C1B19] border border-[#2D2C28] rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#252420] border border-[#383631]">
                <Server className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F7F3EA] font-['Cairo']">
                  محرك التعليق الصوتي (Voice TTS)
                </h3>
                <span className="text-[11px] font-mono text-[#77736D]">
                  {status?.geminiTts.model || 'gemini-3.8-flash-lite-tts'}
                </span>
              </div>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded font-bold flex items-center gap-1.5 ${
                status?.geminiTts.status === 'connected' || status?.geminiTts.status === 'configured'
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950/70 text-amber-400 border border-amber-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>جاهز للاستخدام</span>
            </span>
          </div>

          <p className="text-xs text-[#A8A49C] leading-relaxed bg-[#141413] p-3 rounded-xl border border-[#262522]">
            {status?.geminiTts.message || 'يدعم أصوات Fenrir و Kore و Puck مع نبرات وثائقية باللغة العربية.'}
          </p>
        </div>

        {/* Card 3: FFmpeg Video Engine */}
        <div className="bg-[#1C1B19] border border-[#2D2C28] rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#252420] border border-[#383631]">
                <Video className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F7F3EA] font-['Cairo']">
                  محرك المونتاج والرندرة (FFmpeg)
                </h3>
                <span className="text-[11px] font-mono text-[#77736D]">
                  {status?.ffmpeg.path || '/usr/bin/ffmpeg'}
                </span>
              </div>
            </div>

            <span className="text-xs px-2.5 py-1 rounded font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مثبت ومتوافق</span>
            </span>
          </div>

          <div className="text-xs text-[#A8A49C] space-y-1.5 bg-[#141413] p-3 rounded-xl border border-[#262522]">
            <div className="flex justify-between">
              <span className="text-[#77736D]">النسخة ومكتبة الفيديو:</span>
              <span className="font-mono text-[#F7F3EA]">H.264 / AAC / Libass</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#77736D]">دعم خطوط اللغة العربية:</span>
              <span className="text-emerald-400 font-bold">
                {status?.ffmpeg.hasArabicFont ? 'Noto Sans Arabic متوفر' : 'نعم'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Media Storage */}
        <div className="bg-[#1C1B19] border border-[#2D2C28] rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#252420] border border-[#383631]">
                <HardDrive className="w-5 h-5 text-[#C6A15B]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#F7F3EA] font-['Cairo']">
                  تخزين الفيديوهات والأصول
                </h3>
                <span className="text-[11px] font-mono text-[#77736D]">
                  /exports &amp; persistent disk
                </span>
              </div>
            </div>

            <span className="text-xs px-2.5 py-1 rounded font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>قرص محلي موثق</span>
            </span>
          </div>

          <p className="text-xs text-[#A8A49C] leading-relaxed bg-[#141413] p-3 rounded-xl border border-[#262522]">
            يتم تخزين فيديوهات MP4 الناتجة بشكل دائم مع حماية أمنية وتدقيق ملكية، ودعم إرسال البايتات المجزأة للتشغيل الفوري.
          </p>
        </div>
      </div>

      {/* Security & Limits Section */}
      <div className="bg-[#1C1B19] border border-[#2D2C28] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#2C2A26]">
          <Shield className="w-5 h-5 text-[#C6A15B]" />
          <div>
            <h3 className="text-base font-bold text-[#F7F3EA] font-['Cairo']">
              الأمان، الخصوصية، وحدود الاستخدام (Guardrails)
            </h3>
            <p className="text-xs text-[#77736D]">
              حماية بيانات المشاريع ومفاتيح التشفير السحابية
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#141413] p-4 rounded-xl border border-[#262522]">
            <span className="text-[#77736D] block mb-1">الحد الأقصى لطول العنوان:</span>
            <span className="font-bold text-sm text-[#F7F3EA]">300 حرف</span>
          </div>
          <div className="bg-[#141413] p-4 rounded-xl border border-[#262522]">
            <span className="text-[#77736D] block mb-1">أقصى مدة للفيلم الواحد:</span>
            <span className="font-bold text-sm text-[#F7F3EA]">180 ثانية (3 دقائق)</span>
          </div>
          <div className="bg-[#141413] p-4 rounded-xl border border-[#262522]">
            <span className="text-[#77736D] block mb-1">حماية المفاتيح:</span>
            <span className="font-bold text-sm text-emerald-400">Server-Side Only (محجوبة)</span>
          </div>
        </div>

        {/* Demo Mode Toggle Banner */}
        <div className="p-4 rounded-xl bg-[#24211A] border border-[#C6A15B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#F7F3EA] mb-0.5 font-['Cairo']">
                الوضع التجريبي (Demo Mode)
              </h4>
              <p className="text-xs text-[#77736D] leading-relaxed">
                يتيح إنشاء أفلام وثائقية كاملة بصيغة MP4 ومونتاج حقيقي عبر FFmpeg دون أي استهلاك لحصص الذكاء الاصطناعي المدفوعة.
              </p>
            </div>
          </div>

          <button
            onClick={() => onToggleDemoMode(!isDemoMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              isDemoMode
                ? 'bg-[#C6A15B] text-[#171717] shadow-md'
                : 'bg-[#1E1D1A] border border-[#383631] text-[#D8D2C5] hover:border-[#C6A15B]'
            }`}
          >
            {isDemoMode ? 'الوضع التجريبي مفعل (اضغط للتعطيل)' : 'تفعيل الوضع التجريبي'}
          </button>
        </div>
      </div>
    </div>
  );
};
