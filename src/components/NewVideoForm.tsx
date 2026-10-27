import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Palette,
  Maximize2,
  Mic,
  Subtitles,
  Music,
  Coins,
  ArrowLeft,
  Layers,
  MapPin,
  Film,
  Camera,
  Info,
} from 'lucide-react';
import {
  VisualStyle,
  AspectRatio,
  DurationOption,
  VoiceOption,
  ProjectSettings,
} from '../types';

interface NewVideoFormProps {
  onSubmit: (topic: string, settings: ProjectSettings) => Promise<void>;
  isLoading: boolean;
  isDemoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
}

const INSPIRATION_TOPICS = [
  'أسرار طريق الحرير التجاري: الشريان الذي ربط الشرق بالغرب',
  'القهوة العربية: كيف تحولت حبة بن من جبال اليمن إلى إمبراطورية عالمية',
  'كيف غيّر اختراع صناعة الورق مسار الحضارة الإنسانية وتدوين العلوم',
  'رحلة ابن بطوطة: ثلاثون عاماً من الترحال والمغامرة عبر العالم القديم',
  'سر بناء أهرامات الجيزة: بين دقة الهندسة الفلكية وعبقرية البنائين',
  'تاريخ مكتبة بغداد الكبرى (بيت الحكمة) وثورة الترجمة والمعرفة',
];

export const NewVideoForm: React.FC<NewVideoFormProps> = ({
  onSubmit,
  isLoading,
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [topic, setTopic] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [duration, setDuration] = useState<DurationOption>(30);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('vox_maps');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [voice, setVoice] = useState<VoiceOption>('Fenrir');
  const [enableSubtitles, setEnableSubtitles] = useState(true);
  const [enableBackgroundMusic, setEnableBackgroundMusic] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.2);
  const [costMode, setCostMode] = useState<'economy' | 'studio'>('economy');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isLoading) return;

    await onSubmit(topic.trim(), {
      duration,
      visualStyle,
      aspectRatio,
      voice,
      enableSubtitles,
      enableBackgroundMusic,
      musicTrack: 'ambient_documentary',
      musicVolume,
      costMode,
      isDemoMode,
      additionalInstructions: additionalInstructions.trim() || undefined,
    });
  };

  const visualStyles: { id: VisualStyle; name: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'vox_maps',
      name: 'خرائط ورسوم بيانية أسلوب فوكس',
      desc: 'خرائط جغرافية داكنة، مسارات مضيئة، وإحداثيات بيانية دقيقة',
      icon: <MapPin className="w-5 h-5 text-[#C6A15B]" />,
    },
    {
      id: 'paper_cutout',
      name: 'قصاصات ورقية وكولاج وثائقي',
      desc: 'طبقات ورق ممزقة، أختام أرشيفية، وملمس كولاج تاريخي مفعم بالحياة',
      icon: <Layers className="w-5 h-5 text-[#C6A15B]" />,
    },
    {
      id: 'cinematic',
      name: 'سينمائي بالذكاء الاصطناعي',
      desc: 'إضاءة درامية داكنة (Chiaroscuro)، تدرج ألوان سينمائي وحبيبات فيلم',
      icon: <Film className="w-5 h-5 text-[#C6A15B]" />,
    },
    {
      id: 'slideshow',
      name: 'سلايدشو وثائقي بحركات بان وزوم',
      desc: 'إطارات أرشيفية مع حركة كاميرا كين-بيرنز (Ken Burns) البطيئة',
      icon: <Camera className="w-5 h-5 text-[#C6A15B]" />,
    },
  ];

  const voices: { id: VoiceOption; name: string; desc: string; sample: string }[] = [
    {
      id: 'Fenrir',
      name: 'فينرير (Fenrir)',
      desc: 'صوت وثائقي عميق، رزين ووقور، مثالي للأحداث التاريخية',
      sample: 'نبرة عميقة وواثقة',
    },
    {
      id: 'Kore',
      name: 'كور (Kore)',
      desc: 'صوت هادئ ومؤثر، فصاحة عالية وتدفق سردي مشرق',
      sample: 'نبرة واضحة ومؤثرة',
    },
    {
      id: 'Puck',
      name: 'بَك (Puck)',
      desc: 'صوت سردي مشوق وسريع الإيقاع للقصص القصيرة والريلز',
      sample: 'نبرة حيوية ومعاصرة',
    },
    {
      id: 'Zephyr',
      name: 'زفير (Zephyr)',
      desc: 'صوت إذاعي فصيح، مناسب للتقارير والوثائقيات الجيوسياسية',
      sample: 'نبرة إذاعية رصينة',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Title & Introduction */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6A15B]/10 border border-[#C6A15B]/30 text-[#C6A15B] text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>خط إنتاج وثائقي آلي متكامل</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#F7F3EA] mb-3 font-['Cairo'] tracking-tight">
          أنشئ فيلماً وثائقياً احترافياً من فكرة واحدة
        </h1>
        <p className="text-sm sm:text-base text-[#77736D] max-w-2xl mx-auto leading-relaxed font-['Tajawal']">
          يقوم استوديو VOX بتحويل الموضوع إلى سيناريو تاريخي محكم، لوحة قصة سينمائية، إطارات مرئية، تعليق صوتي
          عربي، ترجمة متزامنة، وفيديو MP4 عالي الجودة بنقرة واحدة.
        </p>
      </div>

      {/* Main Creation Card */}
      <form onSubmit={handleSubmit} className="space-y-8 bg-[#1D1C1A] border border-[#2D2C28] rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Section 1: Topic Input */}
        <div>
          <label className="block text-sm font-bold text-[#F7F3EA] mb-2 flex items-center justify-between">
            <span>موضوع الوثائقي (إلزامي) *</span>
            <span className="text-xs text-[#77736D] font-normal">{topic.length}/300 حرف</span>
          </label>
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={300}
            placeholder="مثال: كيف أثرت الثورة الصناعية على الحياة اليومية للمدن؟ أو: أسرار بناء تاج محل..."
            className="w-full px-4 py-3.5 rounded-xl bg-[#141413] border border-[#383631] text-[#F7F3EA] placeholder-[#66635D] focus:outline-none focus:border-[#C6A15B] transition-all text-base"
          />

          {/* Quick inspiration pills */}
          <div className="mt-3">
            <span className="text-xs text-[#77736D] block mb-2 font-medium">أفكار مقترحة بنقرة واحدة:</span>
            <div className="flex flex-wrap gap-2">
              {INSPIRATION_TOPICS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(item)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#252420] border border-[#383631] text-[#D8D2C5] hover:border-[#C6A15B] hover:text-[#C6A15B] transition-all text-right"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Additional Directions */}
        <div>
          <label className="block text-sm font-bold text-[#F7F3EA] mb-2">
            توجيهات أو مصادر إضافية للسيناريو (اختياري)
          </label>
          <textarea
            rows={2}
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="مثال: ركّز على دور المخطوطات الأندلسية، واختم بتساؤل فلسفي حول حفظ المعرفة..."
            className="w-full px-4 py-3 rounded-xl bg-[#141413] border border-[#383631] text-[#F7F3EA] placeholder-[#66635D] focus:outline-none focus:border-[#C6A15B] transition-all text-sm resize-none"
          />
        </div>

        {/* Section 3: Duration Selector */}
        <div>
          <label className="block text-sm font-bold text-[#F7F3EA] mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C6A15B]" />
            <span>مدة الفيديو المستهدفة</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { val: 30, label: '30 ثانية', desc: 'سريع ومركّز (3 مشاهد) — ملائم للريلز والشبكات' },
              { val: 60, label: '60 ثانية', desc: 'مفصّل ومتزن (4-5 مشاهد) — وثائقي كلاسيكي' },
              { val: 180, label: '3 دقائق', desc: 'وثائقي شامل (8-10 مشاهد) — سرد معمق' },
            ].map((item) => (
              <div
                key={item.val}
                onClick={() => setDuration(item.val as DurationOption)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  duration === item.val
                    ? 'bg-[#29251C] border-[#C6A15B] text-[#F7F3EA] shadow-md'
                    : 'bg-[#151413] border-[#2E2D29] text-[#77736D] hover:border-[#444]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-base ${duration === item.val ? 'text-[#C6A15B]' : 'text-[#F7F3EA]'}`}>
                    {item.label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      duration === item.val ? 'border-[#C6A15B] bg-[#C6A15B]' : 'border-[#444]'
                    }`}
                  >
                    {duration === item.val && <div className="w-1.5 h-1.5 rounded-full bg-[#171717]" />}
                  </div>
                </div>
                <p className="text-xs text-[#77736D]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Visual Style Selector */}
        <div>
          <label className="block text-sm font-bold text-[#F7F3EA] mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#C6A15B]" />
            <span>الأسلوب البصري للمشاهد</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visualStyles.map((item) => (
              <div
                key={item.id}
                onClick={() => setVisualStyle(item.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  visualStyle === item.id
                    ? 'bg-[#29251C] border-[#C6A15B] text-[#F7F3EA] shadow-md'
                    : 'bg-[#151413] border-[#2E2D29] text-[#77736D] hover:border-[#444]'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-[#21201D] border border-[#383631]">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-bold ${visualStyle === item.id ? 'text-[#C6A15B]' : 'text-[#F7F3EA]'}`}>
                    {item.name}
                  </h4>
                  <p className="text-xs text-[#77736D] mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Aspect Ratio & Voice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aspect ratio */}
          <div>
            <label className="block text-sm font-bold text-[#F7F3EA] mb-3 flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-[#C6A15B]" />
              <span>أبعاد الفيديو (Aspect Ratio)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: '9:16', name: '9:16 عمودي', desc: 'Reels / Shorts / TikTok' },
                { id: '16:9', name: '16:9 أفقي', desc: 'YouTube والشاشات' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setAspectRatio(item.id as AspectRatio)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all text-center ${
                    aspectRatio === item.id
                      ? 'bg-[#29251C] border-[#C6A15B] text-[#F7F3EA]'
                      : 'bg-[#151413] border-[#2E2D29] text-[#77736D] hover:border-[#444]'
                  }`}
                >
                  <span className={`block font-bold text-sm ${aspectRatio === item.id ? 'text-[#C6A15B]' : 'text-[#F7F3EA]'}`}>
                    {item.name}
                  </span>
                  <span className="text-[11px] text-[#77736D] mt-0.5 block">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Voice selector */}
          <div>
            <label className="block text-sm font-bold text-[#F7F3EA] mb-3 flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#C6A15B]" />
              <span>الصوت السردي العربي</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {voices.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    voice === v.id
                      ? 'bg-[#29251C] border-[#C6A15B] text-[#F7F3EA]'
                      : 'bg-[#151413] border-[#2E2D29] text-[#77736D] hover:border-[#444]'
                  }`}
                >
                  <span className={`block font-bold text-xs ${voice === v.id ? 'text-[#C6A15B]' : 'text-[#F7F3EA]'}`}>
                    {v.name}
                  </span>
                  <span className="text-[10px] text-[#77736D] mt-0.5 block line-clamp-1">{v.sample}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 6: Audio, Subtitles & Cost controls */}
        <div className="border-t border-[#2C2A26] pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Subtitles Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableSubtitles}
                onChange={(e) => setEnableSubtitles(e.target.checked)}
                className="w-5 h-5 rounded border-[#383631] accent-[#C6A15B] cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <Subtitles className="w-4 h-4 text-[#C6A15B]" />
                <span className="text-sm font-bold text-[#F7F3EA]">تضمين الترجمة والنصوص التوضيحية</span>
              </div>
            </label>

            {/* Music Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableBackgroundMusic}
                onChange={(e) => setEnableBackgroundMusic(e.target.checked)}
                className="w-5 h-5 rounded border-[#383631] accent-[#C6A15B] cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#C6A15B]" />
                <span className="text-sm font-bold text-[#F7F3EA]">موسيقى وثائقية محيطية مرخصة</span>
              </div>
            </label>
          </div>

          {/* Volume slider when music is enabled */}
          {enableBackgroundMusic && (
            <div className="flex items-center gap-4 bg-[#141413] p-3 rounded-xl border border-[#2B2A27]">
              <span className="text-xs text-[#77736D] whitespace-nowrap">مستوى صوت الموسيقى:</span>
              <input
                type="range"
                min="0.05"
                max="0.4"
                step="0.05"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-full accent-[#C6A15B] cursor-pointer"
              />
              <span className="text-xs font-mono text-[#C6A15B]">{Math.round(musicVolume * 100)}%</span>
            </div>
          )}

          {/* Cost Mode & Demo Mode banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#141413] border border-[#2E2D29] gap-3">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-[#C6A15B]" />
              <div>
                <span className="text-xs font-bold text-[#F7F3EA] block">
                  وضع التكلفة: {isDemoMode ? 'وضع تجريبي (بدون رسوم)' : 'الوضع الاقتصادي (Low-Cost)'}
                </span>
                <span className="text-[11px] text-[#77736D]">
                  {isDemoMode
                    ? 'لا يتم استهلاك حصص API الخارجية، ويتم إنتاج MP4 كامل للتجربة'
                    : 'يستخدم نموذج Gemini الاقتصادي ويولد ملف MP4 حقيقي عبر FFmpeg'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleDemoMode(!isDemoMode)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#383631] bg-[#1E1D1A] text-[#C6A15B] hover:border-[#C6A15B] transition-all whitespace-nowrap"
            >
              {isDemoMode ? 'التبديل إلى الوضع الحقيقي' : 'التبديل إلى الوضع التجريبي'}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className={`w-full py-4 px-6 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all ${
              isLoading || !topic.trim()
                ? 'bg-[#33312C] text-[#66635D] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#C6A15B] to-[#B38D46] text-[#171717] hover:shadow-xl hover:shadow-[#C6A15B]/25 hover:brightness-105 active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
                <span>جاري بدء خط الإنتاج وتجهيز المشاهد...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>أنشئ الفيديو (بدء خط الإنتاج)</span>
                <ArrowLeft className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-[#77736D] mt-2.5">
            العملية تبدأ مباشرة وتشمل كتابة السيناريو، الإطارات، الصوت، والتحقق من صحة ملف MP4.
          </p>
        </div>
      </form>
    </div>
  );
};
